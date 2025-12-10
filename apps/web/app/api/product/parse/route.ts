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

function cleanTitle(raw: string): string {
  let s = raw.trim();

  // Remove typical ecommerce suffixes
  s = s.replace(/\s*\|.*$/i, "");
  s = s.replace(/\s*-\s*Buy.*$/i, "");
  s = s.replace(/\s*Online.*$/i, "");
  s = s.replace(/\s*@.*$/i, "");

  return s.trim();
}

function extractProductName(html: string): string | null {
  // 1) og:title
  const ogMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
  );
  if (ogMatch?.[1]) {
    return cleanTitle(ogMatch[1]);
  }

  // 2) name="title"
  const nameTitleMatch = html.match(
    /<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i,
  );
  if (nameTitleMatch?.[1]) {
    return cleanTitle(nameTitleMatch[1]);
  }

  // 3) <title>...</title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch?.[1]) {
    return cleanTitle(titleMatch[1]);
  }

  return null;
}

function parseRupees(value: string | null | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return n;
}

function extractPrice(html: string, hostname: string): number | null {
  // Host-specific patterns first

  // Amazon: try priceblock ids and "a-offscreen"
  if (hostname.includes("amazon")) {
    const m1 = html.match(
      /id=["']priceblock_[^"']+["'][^>]*>\s*₹\s*([\d,]+)/i,
    );
    if (m1?.[1]) return parseRupees(m1[1]);

    const m2 = html.match(
      /class=["'][^"']*a-offscreen[^"']*["'][^>]*>\s*₹\s*([\d,]+)/i,
    );
    if (m2?.[1]) return parseRupees(m2[1]);
  }

  // Flipkart: ._30jeq3._16Jk6d
  if (hostname.includes("flipkart")) {
    const m = html.match(
      /class=["'][^"']*30jeq3[^"']*["'][^>]*>\s*₹\s*([\d,]+)/i,
    );
    if (m?.[1]) return parseRupees(m[1]);
  }

  // Ajio, Myntra, TataCliq – simple ₹ pattern as fallback
  const regex = /₹\s*([\d,]+)/g;
  let best: number | null = null;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const val = parseRupees(match[1]);
    if (!val) continue;

    // Heuristic: treat the *lowest* rupee value in the page as "offer price"
    if (best == null || val < best) {
      best = val;
    }
  }

  return best;
}

type OfferHints = {
  bankOffers: string[];
  cashbackOffers: string[];
  hasNoCostEmi: boolean;
  suggestedOfferPercent: number | null;
  bestOfferText: string | null;
};

function extractOfferHints(html: string): OfferHints {
  const candidateTexts = new Set<string>();

  // ---- 1) Line-based scan for general offer/cashback/emi text ----
  const rawLines = html.split(/[\r\n]+/);
  for (let raw of rawLines) {
    let s = raw.trim();
    if (!s) continue;

    const lower = s.toLowerCase();
    if (
      !(
        lower.includes("offer") ||
        lower.includes("discount") ||
        lower.includes("cashback") ||
        lower.includes("cash back") ||
        lower.includes("emi") ||
        lower.includes("no cost")
      )
    ) {
      continue;
    }

    // Strip tags, scripts, styles
    s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
    s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
    s = s.replace(/<[^>]+>/g, "");
    s = s.replace(/\s+/g, " ").trim();

    if (!s) continue;
    if (s.length < 15 || s.length > 250) continue;

    candidateTexts.add(s);
  }

  // ---- 2) Explicitly grab "Bank Offer ..." from Flipkart/Amazon style HTML ----
  const bankOfferRegexes: RegExp[] = [
    /(Bank Offer[^<]{0,220})/gi,
    /(bank offer[^<]{0,220})/gi,
    /(Bank Offers[^<]{0,220})/gi,
    /(bank offers[^<]{0,220})/gi,
    /(Instant Discount[^<]{0,220})/gi,
  ];

  for (const re of bankOfferRegexes) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      let snippet = m[1] || m[0] || "";
      snippet = snippet.replace(/<script[\s\S]*?<\/script>/gi, "");
      snippet = snippet.replace(/<style[\s\S]*?<\/style>/gi, "");
      snippet = snippet.replace(/<[^>]+>/g, "");
      snippet = snippet.replace(/\s+/g, " ").trim();

      if (!snippet) continue;
      if (snippet.length < 15 || snippet.length > 250) continue;

      candidateTexts.add(snippet);
    }
  }

  const bankOffersSet = new Set<string>();
  const cashbackOffersSet = new Set<string>();
  let hasNoCostEmi = false;

  let bestPercent = 0;
  let bestOfferText: string | null = null;

  for (const line of candidateTexts) {
    const lower = line.toLowerCase();

    if (lower.includes("no cost emi")) {
      hasNoCostEmi = true;
    }

    // Bank / card / instant discount
    if (
      lower.includes("bank offer") ||
      lower.includes("bank offers") ||
      lower.includes("credit card") ||
      lower.includes("debit card") ||
      lower.includes("instant discount") ||
      lower.includes("prepaid") ||
      lower.includes("card offer")
    ) {
      bankOffersSet.add(line);
    }

    // Cashback
    if (lower.includes("cashback") || lower.includes("cash back")) {
      cashbackOffersSet.add(line);
    }

    // Find % discount/cashback in this line
    const percentMatch = lower.match(/(\d+)\s*%/);
    if (percentMatch?.[1]) {
      const pct = Number(percentMatch[1]);
      if (pct > bestPercent) {
        bestPercent = pct;
        bestOfferText = line;
      }
    }
  }

  return {
    bankOffers: Array.from(bankOffersSet),
    cashbackOffers: Array.from(cashbackOffersSet),
    hasNoCostEmi,
    suggestedOfferPercent: bestPercent > 0 ? bestPercent : null,
    bestOfferText,
  };
}

// ---- Main route handler ----

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { ok: false, error: "Invalid URL" },
        { status: 400 },
      );
    }

    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (!ALLOWED_HOSTS.includes(hostname)) {
      return NextResponse.json(
        { ok: false, error: "Host not supported yet by Runesse parser." },
        { status: 400 },
      );
    }

    const res = await fetch(url, {
      headers: {
        // Pretend to be a real browser
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "Failed to fetch product page." },
        { status: res.status },
      );
    }

    const html = await res.text();

    const productName = extractProductName(html);
    const price = extractPrice(html, hostname);
    const offerHints = extractOfferHints(html);

    return NextResponse.json({
      ok: true,
      productTitle: productName || null,
      productPrice: price,
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
      { status: 500 },
    );
  }
}
