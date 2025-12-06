// apps/web/app/api/product/parse/route.ts
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  // Amazon (desktop + mobile + short)
  "amazon.in",
  "www.amazon.in",
  "m.amazon.in",
  "amzn.in",
  "www.amzn.in",

  // Flipkart
  "flipkart.com",
  "www.flipkart.com",

  // Myntra
  "myntra.com",
  "www.myntra.com",

  // Ajio
  "ajio.com",
  "www.ajio.com",

  // Tata CLiQ
  "tatacliq.com",
  "www.tatacliq.com",
];

function extractProductName(html: string): string | null {
  // Try og:title
  const ogMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i
  );
  if (ogMatch?.[1]) return ogMatch[1].trim();

  // Try <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch?.[1]) return titleMatch[1].trim();

  return null;
}

function extractPrice(html: string): number | null {
  // Scan for ₹ / Rs patterns
  const candidates: number[] = [];

  const rupeeRegex = /(?:₹|Rs\.?\s?)(\d[\d,]*)/gim;
  let match: RegExpExecArray | null;

  while ((match = rupeeRegex.exec(html)) !== null) {
    const raw = match[1].replace(/,/g, "");
    const num = Number(raw);
    if (!Number.isNaN(num) && num > 0) {
      candidates.push(num);
    }
  }

  if (!candidates.length) return null;

  // Prefer "big" values (product price), ignore tiny things like ₹149, ₹199, etc.
  const filtered = candidates.filter((n) => n >= 1000 && n <= 20000000);
  if (filtered.length > 0) {
    // Take the maximum as a simple heuristic for main product price
    return Math.max(...filtered);
  }

  // Fallback: median-ish of all candidates
  const sorted = [...candidates].sort((a, b) => a - b);
  const midIndex = Math.floor(sorted.length / 2);
  return sorted[midIndex] ?? sorted[0];
}

type OfferHints = {
  bankOffers: string[];
  cashbackOffers: string[];
  hasNoCostEmi: boolean;
  suggestedOfferPercent: number | null;
  bestOfferText: string | null;
};

function extractOfferHints(html: string): OfferHints {
  const lower = html.toLowerCase();

  const hasNoCostEmi = lower.includes("no cost emi");

  const snippets: string[] = [];

  function collectAround(keyword: string, radius = 180) {
    let fromIndex = 0;
    const lowerKeyword = keyword.toLowerCase();

    while (true) {
      const idx = lower.indexOf(lowerKeyword, fromIndex);
      if (idx === -1) break;

      const start = Math.max(0, idx - radius);
      const end = Math.min(html.length, idx + lowerKeyword.length + radius);
      const chunk = html.slice(start, end);

      snippets.push(chunk);
      fromIndex = idx + lowerKeyword.length;
    }
  }

  [
    "Bank Offer",
    "Bank Offers",
    "credit card offer",
    "debit card offer",
    "cashback",
    "cash back",
    "No Cost EMI",
  ].forEach((k) => collectAround(k));

  const lines: string[] = [];

  for (const chunk of snippets) {
    // remove tags first
    const withoutTags = chunk.replace(/<[^>]+>/g, " ");
    const collapsed = withoutTags.replace(/\s+/g, " ").trim();
    if (!collapsed) continue;

    const subLines = collapsed.split(/[.|•|▪|–|-]/);
    for (let sub of subLines) {
      let s = sub.trim();
      if (!s) continue;

      // 1) If this looks like JSON, try to keep only the "title":"..." part.
      const titleMatch = s.match(/"title":"([^"]+)"/);
      if (titleMatch?.[1]) {
        s = titleMatch[1].trim(); // keep only the title text
      }

      // 2) If there is still an "id": segment, drop everything after it.
      const idIdx = s.indexOf('"id":');
      if (idIdx > 0) {
        s = s.slice(0, idIdx).trim();
      }

      // Remove stray quotes
      s = s.replace(/"+/g, "").trim();

      // basic filters to avoid leftover JSON noise
      if (!s) continue;
      if (s.length < 15 || s.length > 160) continue;
      if (/[<>]/.test(s)) continue;
      if (/(width=|height=|class=|src=|\.png|\.jpg|\.svg)/i.test(s)) continue;
      if (/[{}]/.test(s)) continue;
      if (!/[a-zA-Z]/.test(s)) continue; // must contain letters
      if (!s.includes(" ")) continue; // avoid weird tokens

      lines.push(s);
    }
  }

  const uniqueLines = Array.from(new Set(lines));

  const bankOffers: string[] = [];
  const cashbackOffers: string[] = [];

  for (const line of uniqueLines) {
    const l = line.toLowerCase();
    if (
      l.includes("bank offer") ||
      l.includes("bank offers") ||
      l.includes("credit card") ||
      l.includes("debit card")
    ) {
      bankOffers.push(line);
    } else if (l.includes("cashback") || l.includes("cash back")) {
      cashbackOffers.push(line);
    }
  }

  const percentRegex = /(\d{1,2})\s*%/g;
  let suggestedOfferPercent: number | null = null;

  function scanForPercent(text: string) {
    let m: RegExpExecArray | null;
    while ((m = percentRegex.exec(text)) !== null) {
      const val = Number(m[1]);
      if (Number.isNaN(val)) continue;
      if (val <= 0 || val > 80) continue;
      if (suggestedOfferPercent == null || val > suggestedOfferPercent) {
        suggestedOfferPercent = val;
      }
    }
  }

  for (const line of [...bankOffers, ...cashbackOffers]) {
    scanForPercent(line);
  }

  // Try to find a "best offer" text (line containing the highest %)
  let bestOfferText: string | null = null;
  if (suggestedOfferPercent != null) {
    const percentPattern = new RegExp(
      `\\b${suggestedOfferPercent}\\s*%`,
      "i"
    );
    const allLines = [...bankOffers, ...cashbackOffers];
    const found = allLines.find((l) => percentPattern.test(l));
    if (found) {
      bestOfferText = found;
    }
  }
  if (!bestOfferText) {
    // fallback: first bank offer, or first cashback offer
    bestOfferText =
      bankOffers[0] ?? cashbackOffers[0] ?? null;
  }

  return {
    bankOffers,
    cashbackOffers,
    hasNoCostEmi,
    suggestedOfferPercent,
    bestOfferText,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const url = body?.url as string | undefined;

    if (!url) {
      return NextResponse.json(
        { ok: false, error: "Missing product URL." },
        { status: 400 }
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid product URL." },
        { status: 400 }
      );
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.includes(hostname)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This marketplace is not yet supported. Please use Amazon, Flipkart, Myntra, Ajio or Tata CLiQ links.",
        },
        { status: 400 }
      );
    }

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
        "Accept-Language": "en-IN,en;q=0.9",
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch product page:", res.status, res.statusText);
      return NextResponse.json(
        { ok: false, error: "Could not fetch product page." },
        { status: 502 }
      );
    }

    const html = await res.text();

    const productName = extractProductName(html);
    const price = extractPrice(html);
    const offerHints = extractOfferHints(html);

    return NextResponse.json({
      ok: true,
      productName: productName || null,
      price,
      bankOffers: offerHints.bankOffers,
      cashbackOffers: offerHints.cashbackOffers,
      hasNoCostEmi: offerHints.hasNoCostEmi,
      suggestedOfferPercent: offerHints.suggestedOfferPercent,
      bestOfferText: offerHints.bestOfferText,
    });
  } catch (error) {
    console.error("Error in /api/product/parse:", error);
    return NextResponse.json(
      { ok: false, error: "Could not analyse product link." },
      { status: 500 }
    );
  }
}
