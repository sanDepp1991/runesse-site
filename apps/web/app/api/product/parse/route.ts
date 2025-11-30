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
];

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

// POST /api/product/parse
// Body: { url: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = typeof body.url === "string" ? body.url.trim() : "";

    if (!url) {
      return badRequest("Product URL is required.");
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return badRequest("Invalid URL.");
    }

    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
      return badRequest(
        "Only Amazon, Flipkart, Myntra and Ajio links are supported in this demo."
      );
    }

    // Fetch page HTML from the server side (no CORS issues)
    const resp = await fetch(url, {
      // Pretend to be a browser
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "en-IN,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!resp.ok) {
      console.error("Product parse: upstream fetch failed", resp.status);
      return NextResponse.json(
        { ok: false, error: "Could not fetch product page." },
        { status: 502 }
      );
    }

    const html = await resp.text();

    // ---- Extract product name ----
    let productName: string | null = null;

    // 1) Try og:title
    let m =
      html.match(
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i
      ) ||
      html.match(
        /<meta[^>]+name=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i
      );
    if (m) {
      productName = m[1].trim();
    }

    // 2) Fallback to <title>
    if (!productName) {
      const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (t) productName = t[1].trim();
    }

    // ---- Extract price ----
    let price: number | null = null;

    // 1) Try og:price:amount
    let pm =
      html.match(
        /<meta[^>]+property=["']og:price:amount["'][^>]+content=["']([^"']+)["'][^>]*>/i
      ) ||
      html.match(
        /<meta[^>]+name=["']og:price:amount["'][^>]+content=["']([^"']+)["'][^>]*>/i
      );
    if (pm) {
      const n = Number(pm[1].replace(/,/g, ""));
      if (!Number.isNaN(n)) price = n;
    }

    // 2) Fallback: first few ₹ / Rs. amounts on the page
    if (price == null) {
      const matches = Array.from(
        html.matchAll(/(?:₹|Rs\.?\s*)([0-9][0-9,]{2,})/g)
      )
        .map((mm) => Number(mm[1].replace(/,/g, "")))
        .filter((n) => !Number.isNaN(n) && n > 0 && n < 1_00_00_000);

      if (matches.length > 0) {
        // Take the smallest reasonable number as "main price" heuristic
        price = Math.min(...matches);
      }
    }

    return NextResponse.json({
      ok: true,
      productName: productName || null,
      price,
    });
  } catch (error) {
    console.error("Error in /api/product/parse:", error);
    return NextResponse.json(
      { ok: false, error: "Could not analyse product link." },
      { status: 500 }
    );
  }
}
