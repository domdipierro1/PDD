import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = new Set([
  "https://pddcleaningservices.co.uk",
  "https://www.pddcleaningservices.co.uk",
  "http://localhost:3000",
]);

function corsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && allowedOrigins.has(origin)
      ? origin
      : "https://pddcleaningservices.co.uk";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") || "").trim();

  if (query.length < 2) {
    return NextResponse.json({ addresses: [] }, { headers });
  }

  const apiKey = process.env.GETADDRESS_API_KEY;

  if (!apiKey) {
    console.error("Missing GETADDRESS_API_KEY");
    return NextResponse.json({ addresses: [] }, { headers });
  }

  try {
    const params = new URLSearchParams({
      "api-key": apiKey,
      all: "true",
      "show-postcode": "true",
    });

    const providerUrl = `https://api.getAddress.io/autocomplete/${encodeURIComponent(
      query
    )}?${params.toString()}`;

    const response = await fetch(providerUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("getAddress lookup failed", response.status);
      return NextResponse.json({ addresses: [] }, { headers });
    }

    const data = await response.json();

    const addresses = Array.isArray(data.suggestions)
      ? data.suggestions
          .map((item: any) => {
            const label =
              item.address ||
              item.formatted_address ||
              item.label ||
              item.summary ||
              item.text ||
              item.description;

            if (!label) return null;

            return {
              label,
              value: label,
            };
          })
          .filter(Boolean)
          .slice(0, 20)
      : [];

    return NextResponse.json({ addresses }, { headers });
  } catch (error) {
    console.error("Address autocomplete error", error);
    return NextResponse.json({ addresses: [] }, { headers });
  }
}
