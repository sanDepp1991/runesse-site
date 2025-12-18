// apps/web/app/api/bin-lookup/route.ts
import { NextRequest, NextResponse } from "next/server";

const NEUTRINO_USER_ID = process.env.NEUTRINO_USER_ID;
const NEUTRINO_API_KEY = process.env.NEUTRINO_API_KEY;

// Map Neutrino BIN lookup JSON into our internal shape
function normalizeNeutrinoResponse(json: any) {
  if (!json) {
    return { issuer: null, network: null, brand: null, country: null };
  }

  const issuer =
    typeof json["issuer"] === "string" && json["issuer"].trim().length > 0
      ? json["issuer"].trim()
      : null;

  const networkRaw =
    typeof json["card-brand"] === "string"
      ? json["card-brand"]
      : null;

  const network = networkRaw ? String(networkRaw).toUpperCase() : null;

  const brand =
    typeof json["card-category"] === "string" &&
    json["card-category"].trim().length > 0
      ? json["card-category"].trim()
      : null;

  const country =
    typeof json["country-code"] === "string" &&
    json["country-code"].trim().length > 0
      ? json["country-code"].trim().toUpperCase()
      : null;

  return { issuer, network, brand, country };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const binRaw = typeof body.bin === "string" ? body.bin : "";

    // Keep only digits and first 8 for better accuracy
    const clean = binRaw.replace(/\D/g, "").slice(0, 8);

    if (!clean || clean.length < 6) {
      return NextResponse.json(
        { ok: false, error: "BIN must be at least 6 digits." },
        { status: 400 }
      );
    }

    if (!NEUTRINO_USER_ID || !NEUTRINO_API_KEY) {
      console.warn(
        "[BIN-LOOKUP] NEUTRINO_USER_ID or NEUTRINO_API_KEY not set in env"
      );
      return NextResponse.json(
        {
          ok: false,
          error:
            "BIN lookup service is not configured. Please fill issuer, network and brand manually.",
        },
        { status: 200 }
      );
    }

    // Neutrino BIN Lookup – credentials go in POST body as form fields
    const params = new URLSearchParams();
    params.append("user-id", NEUTRINO_USER_ID);
    params.append("api-key", NEUTRINO_API_KEY);
    params.append("bin-number", clean);
    // optional: params.append("customer-ip", "<ip-here>");

    const resp = await fetch("https://neutrinoapi.net/bin-lookup", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.warn("[BIN-LOOKUP] Neutrino HTTP error:", resp.status, text);
      return NextResponse.json(
        {
          ok: false,
          error:
            "No data found for this BIN from the lookup service. Please fill details manually.",
        },
        { status: 200 }
      );
    }

    const data = await resp.json().catch(() => null);

    // Neutrino returns "valid: boolean"
    if (!data || data.valid === false) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Lookup service did not recognize this BIN. Please fill details manually.",
        },
        { status: 200 }
      );
    }

    const { issuer, network, brand, country } = normalizeNeutrinoResponse(data);

    return NextResponse.json({
      ok: true,
      issuer,
      network,
      brand,
      country,
    });
  } catch (error) {
    console.error("[BIN-LOOKUP] Error in /api/bin-lookup:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong while calling the BIN lookup service. Please fill details manually.",
      },
      { status: 500 }
    );
  }
}
