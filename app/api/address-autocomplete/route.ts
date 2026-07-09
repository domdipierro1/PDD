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

function normalisePostcodeInput(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
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
  const query = normalisePostcodeInput(searchParams.get("query") || "");

  if (query.length < 2) {
    return NextResponse.json({ addresses: [] }, { headers });
  }

  try {
    const autocompleteUrl = `https://api.postcodes.io/postcodes/${encodeURIComponent(
      query
    )}/autocomplete`;

    const response = await fetch(autocompleteUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ addresses: [] }, { headers });
    }

    const data = await response.json();
    const postcodes = Array.isArray(data.result) ? data.result : [];

    const addresses = postcodes.slice(0, 20).map((postcode: string) => ({
      label: postcode,
      value: postcode,
    }));

    return NextResponse.json({ addresses }, { headers });
  } catch (error) {
    console.error("Postcodes.io autocomplete error", error);
    return NextResponse.json({ addresses: [] }, { headers });
  }
}
