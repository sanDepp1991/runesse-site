// apps/web/app/api/product/parse/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Parsed = {
  platform: "amazon" | "flipkart" | "myntra" | "unknown";
  productTitle: string | null;
  productPrice: number | null;
  currency: "INR";
  bankOffers: string[];
};

const ALLOWED_DOMAINS = ["amazon.in", "amzn.in", "flipkart.com", "myntra.com"];

function isAllowedHost(hostname: string) {
  const host = hostname.toLowerCase();
  return ALLOWED_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqStrings(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const v = (it || "").trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function extractOffers(text: string): string[] {
  const offers: string[] = [];
  const patterns = [
    /(?:bank offer|bank offers|instant discount|discount)\s*[:\-]?\s*([^.\n]{10,120})/gi,
    /(?:HDFC|ICICI|SBI|AXIS|KOTAK|IDFC|BOB|PNB|IOB|CANARA|UNION)\s*(?:bank)?\s*(?:credit|debit)?\s*card[^.\n]{0,60}/gi,
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      offers.push(m[1]);
      if (offers.length >= 12) break;
    }
    if (offers.length >= 12) break;
  }

  return uniqStrings(offers).slice(0, 10);
}

function parseAmazon(
  html: string
): { title: string | null; price: number | null } {
  const title =
    html.match(/id="productTitle"[^>]*>\s*([^<]+)\s*</i)?.[1]?.trim() ||
    html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ||
    null;

  const m = html.match(/"price"\s*:\s*"?([0-9,]+(?:\.[0-9]{1,2})?)"?/i);
  const price = m?.[1] ? Number(m[1].replace(/,/g, "")) : null;
  return {
    title,
    price: price && price > 0 && !Number.isNaN(price) ? price : null,
  };
}

function parseFlipkart(
  html: string
): { title: string | null; price: number | null } {
  const title =
    html.match(/<span[^>]*class="B_NuCI"[^>]*>\s*([^<]+)\s*<\/span>/i)?.[1]?.trim() ||
    html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ||
    null;

  const m =
    html.match(/"price"\s*:\s*"?([0-9,]+(?:\.[0-9]{1,2})?)"?/i) ||
    html.match(/₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);

  const price = m?.[1] ? Number(m[1].replace(/,/g, "")) : null;
  return {
    title,
    price: price && price > 0 && !Number.isNaN(price) ? price : null,
  };
}

function parseMyntra(
  html: string
): { title: string | null; price: number | null } {
  const title =
    html.match(/<h1[^>]*class="pdp-title"[^>]*>\s*([^<]+)\s*<\/h1>/i)?.[1]?.trim() ||
    html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ||
    null;

  const m =
    html.match(/"price"\s*:\s*"?([0-9,]+(?:\.[0-9]{1,2})?)"?/i) ||
    html.match(/₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);

  const price = m?.[1] ? Number(m[1].replace(/,/g, "")) : null;
  return {
    title,
    price: price && price > 0 && !Number.isNaN(price) ? price : null,
  };
}

async function fetchHtml(url: string): Promise<string> {
  // NOTE (Phase-1 pragmatism): Marketplaces frequently block server-side fetches (503/529/403).
  // For "today" reliability, we:
  // 1) try direct fetch with browser-like headers + timeout
  // 2) if blocked/throttled, try a temporary read-proxy fallback (r.jina.ai)
  // 3) on failure, throw a friendly message (NO raw HTML) so UI can fall back to manual entry.

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers,
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await res.text().catch(() => "");
    const ct = (res.headers.get("content-type") || "").toLowerCase();

    const looksLikeBlocked =
      [403, 429, 503, 529].includes(res.status) ||
      /captcha|robot|unusual traffic|access denied|to discuss automated access/i.test(text);

    // If the direct fetch worked and returned HTML, use it.
    if (res.ok && ct.includes("text/html") && text.length > 500 && !looksLikeBlocked) {
      return text;
    }

    // If blocked/throttled, try the temporary read-proxy fallback.
    if (looksLikeBlocked) {
      const proxied =
        url.startsWith("https://")
          ? `https://r.jina.ai/https://${url.slice("https://".length)}`
          : url.startsWith("http://")
            ? `https://r.jina.ai/http://${url.slice("http://".length)}`
            : `https://r.jina.ai/${url}`;

      const res2 = await fetch(proxied, {
        method: "GET",
        headers: {
          ...headers,
          Accept: "text/plain,*/*",
        },
        cache: "no-store",
        signal: controller.signal,
      });

      const text2 = await res2.text().catch(() => "");
      if (res2.ok && text2.length > 500) {
        return text2;
      }

      throw new Error(
        `Marketplace temporarily blocked/overloaded (HTTP ${res.status}). Please enter details manually.`
      );
    }

    // Other non-OK responses: return a clean message (no HTML dump)
    if (!res.ok) {
      throw new Error(
        `Unable to fetch product page right now (HTTP ${res.status}). Please enter details manually.`
      );
    }

    // Edge case: OK but not usable HTML
    if (!ct.includes("text/html") || text.length < 200) {
      throw new Error(
        "Unable to fetch product details from this link right now. Please enter details manually."
      );
    }

    return text;
  } catch (e: any) {
    const msg =
      e?.name === "AbortError"
        ? "Marketplace request timed out. Please enter details manually."
        : e?.message || "Unable to fetch product page. Please enter details manually.";
    throw new Error(msg);
  } finally {
    clearTimeout(timeout);
  }
}

async function parseUrl(targetUrl: string): Promise<Parsed> {
  const u = new URL(targetUrl);
  if (!isAllowedHost(u.hostname)) {
    return {
      platform: "unknown",
      productTitle: null,
      productPrice: null,
      currency: "INR",
      bankOffers: [],
    };
  }

  const html = await fetchHtml(targetUrl);
  const plainText = stripHtml(html);
  const bankOffers = extractOffers(plainText);

  const host = u.hostname.toLowerCase();
  let platform: Parsed["platform"] = "unknown";
  let title: string | null = null;
  let price: number | null = null;

  if (host.includes("amazon.")) {
    platform = "amazon";
    ({ title, price } = parseAmazon(html));
  } else if (host.includes("flipkart.")) {
    platform = "flipkart";
    ({ title, price } = parseFlipkart(html));
  } else if (host.includes("myntra.")) {
    platform = "myntra";
    ({ title, price } = parseMyntra(html));
  }

  return {
    platform,
    productTitle: title,
    productPrice: price,
    currency: "INR",
    bankOffers,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { url?: string } | null;
    const targetUrl = (body?.url || "").trim();
    if (!targetUrl) {
      return NextResponse.json({ ok: false, error: "Missing url" }, { status: 400 });
    }

    const parsed = await parseUrl(targetUrl);
    return NextResponse.json({ ok: true, ...parsed });
  } catch (e: any) {
    console.error("product/parse POST error:", e);
    const message = e?.message || "Unable to parse product";

    // Marketplace fetch failures are expected (503/529/403 etc).
    // Return 200 so the UI can gracefully fall back to manual entry.
    if (
      /Marketplace temporarily blocked|Unable to fetch product page right now|Please enter details manually|request timed out/i.test(
        message
      )
    ) {
      return NextResponse.json({ ok: false, error: message }, { status: 200 });
    }

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const targetUrl = (url.searchParams.get("url") || "").trim();
    if (!targetUrl) {
      return NextResponse.json({ ok: false, error: "Missing url" }, { status: 400 });
    }
    const parsed = await parseUrl(targetUrl);
    return NextResponse.json({ ok: true, ...parsed });
  } catch (e: any) {
    console.error("product/parse GET error:", e);
    const message = e?.message || "Unable to parse product";

    // Marketplace fetch failures are expected (503/529/403 etc).
    // Return 200 so the UI can gracefully fall back to manual entry.
    if (
      /Marketplace temporarily blocked|Unable to fetch product page right now|Please enter details manually|request timed out/i.test(
        message
      )
    ) {
      return NextResponse.json({ ok: false, error: message }, { status: 200 });
    }

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
