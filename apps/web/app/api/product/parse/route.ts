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

function isAllowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return ALLOWED_DOMAINS.some((d) => h === d || h.endsWith(`.${d}`));
}

function uniqStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const v = (raw || "").replace(/\s+/g, " ").trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractOffers(text: string): string[] {
  const offers: string[] = [];

  // Most common phrasing across Amazon/Flipkart/Myntra
  const patterns = [
    /(Bank Offer[^\n\.]{0,220}(?:\.|\n))/gi,
    /(No Cost EMI[^\n\.]{0,220}(?:\.|\n))/gi,
    /(Cashback[^\n\.]{0,220}(?:\.|\n))/gi,
    /(Instant discount[^\n\.]{0,220}(?:\.|\n))/gi,
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

function parseAmazon(html: string): { title: string | null; price: number | null } {
  const title =
    html.match(/<span[^>]*id="productTitle"[^>]*>([\s\S]*?)<\/span>/i)?.[1]
      ?.replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim() ||
    html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1]?.trim() ||
    null;

  // Amazon price can appear in multiple forms.
  const candidates: string[] = [];
  const m1 = html.match(/"priceToPay"[\s\S]{0,200}?"value"\s*:\s*"?([0-9,]+(?:\.[0-9]{1,2})?)"?/i);
  if (m1?.[1]) candidates.push(m1[1]);

  const m2 = html.match(/<span[^>]*class="a-price-whole"[^>]*>([0-9,]+)<\/span>/i);
  if (m2?.[1]) candidates.push(m2[1]);

  const m3 = html.match(/<meta\s+property="product:price:amount"\s+content="([0-9,.]+)"/i);
  if (m3?.[1]) candidates.push(m3[1]);

  const price = (() => {
    for (const c of candidates) {
      const n = Number(String(c).replace(/,/g, ""));
      if (!Number.isNaN(n) && n > 0) return n;
    }
    return null;
  })();

  return { title, price };
}

function parseFlipkart(html: string): { title: string | null; price: number | null } {
  const title =
    html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1]?.trim() ||
    html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ||
    null;

  // Common Flipkart price patterns
  const candidates: string[] = [];
  const m1 = html.match(/"sellingPrice"\s*:\s*\{[^}]*"amount"\s*:\s*([0-9]+)/i);
  if (m1?.[1]) candidates.push(m1[1]);

  const m2 = html.match(/<div[^>]*class="_30jeq3"[^>]*>\s*₹\s*([0-9,]+)/i);
  if (m2?.[1]) candidates.push(m2[1]);

  const m3 = html.match(/"price"\s*:\s*([0-9]{2,})/i);
  if (m3?.[1]) candidates.push(m3[1]);

  const price = (() => {
    for (const c of candidates) {
      const n = Number(String(c).replace(/,/g, ""));
      if (!Number.isNaN(n) && n > 0) return n;
    }
    return null;
  })();

  return { title, price };
}

function parseMyntra(html: string): { title: string | null; price: number | null } {
  // Myntra is Next.js; try __NEXT_DATA__ first.
  const nextData = html.match(
    /<script[^>]*id="__NEXT_DATA__"[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i
  )?.[1];

  if (nextData) {
    try {
      const json = JSON.parse(nextData);
      const pdp = json?.props?.pageProps?.pdpData || json?.props?.pageProps?.pdp || null;
      const title =
        pdp?.name ||
        pdp?.product?.name ||
        json?.props?.pageProps?.seoMeta?.title ||
        null;

      const priceCandidates: any[] = [
        pdp?.price?.discounted,
        pdp?.price?.mrp,
        pdp?.product?.price,
        pdp?.product?.mrp,
        pdp?.mrp,
        pdp?.price,
      ];
      let price: number | null = null;
      for (const c of priceCandidates) {
        const n = Number(String(c ?? "").replace(/,/g, ""));
        if (!Number.isNaN(n) && n > 0) {
          price = n;
          break;
        }
      }

      return {
        title: typeof title === "string" ? title.trim() : null,
        price,
      };
    } catch {
      // fall through
    }
  }

  // Fallback: JSON-LD Product schema
  const ldJson = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (ldJson) {
    const pickProductFromJsonLd = (obj: any): any | null => {
      if (!obj) return null;

      // Common case: array of nodes
      if (Array.isArray(obj)) {
        for (const node of obj) {
          const t = node?.["@type"];
          if (t === "Product" || (Array.isArray(t) && t.includes("Product"))) return node;
        }
        return null;
      }

      // Graph case
      const graph = obj?.["@graph"];
      if (Array.isArray(graph)) {
        for (const node of graph) {
          const t = node?.["@type"];
          if (t === "Product" || (Array.isArray(t) && t.includes("Product"))) return node;
        }
      }

      // Direct object
      const t = obj?.["@type"];
      if (t === "Product" || (Array.isArray(t) && t.includes("Product"))) return obj;

      return null;
    };

    try {
      const data = JSON.parse(ldJson);
      const product = pickProductFromJsonLd(data);
      if (product) {
        const title = product?.name || null;
        const priceRaw =
          product?.offers?.price ?? product?.offers?.lowPrice ?? product?.offers?.highPrice ?? null;
        const n = Number(String(priceRaw ?? "").replace(/,/g, ""));
        return {
          title: typeof title === "string" ? title.trim() : null,
          price: !Number.isNaN(n) && n > 0 ? n : null,
        };
      }
    } catch {
      // ignore
    }
  }

  // Last resort
  const title =
    html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1]?.trim() ||
    html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ||
    null;

  const m = html.match(/"price"\s*:\s*"?([0-9,]+(?:\.[0-9]{1,2})?)"?/i);
  const price = m?.[1] ? Number(m[1].replace(/,/g, "")) : null;
  return { title, price: price && price > 0 && !Number.isNaN(price) ? price : null };
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      // Many e-comm pages return limited HTML without a UA
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-IN,en;q=0.9",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
  });

  // Some platforms reply 403 for bot protection.
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Unable to fetch product page (HTTP ${res.status}). ${body?.slice(0, 120) || ""}`
    );
  }

  return await res.text();
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
    return NextResponse.json(
      { ok: false, error: e?.message || "Unable to parse product" },
      { status: 500 }
    );
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
    return NextResponse.json(
      { ok: false, error: e?.message || "Unable to parse product" },
      { status: 500 }
    );
  }
}
