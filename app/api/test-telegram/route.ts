import { NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram";

function isAuthorised(request: Request) {
  const expected = process.env.FORM_WEBHOOK_SECRET;
  if (!expected) return false;

  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  const headerSecret = request.headers.get("x-pdd-form-secret");
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  return [querySecret, headerSecret, bearer].some((candidate) => candidate === expected);
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ ok: false, error: "Invalid or missing test secret." }, { status: 401 });
  }

  const result = await sendTelegramNotification([
    "✅ PDD Telegram test successful",
    "",
    "Your operator portal can now send Telegram alerts for:",
    "- New customer enquiries",
    "- New contractor applications",
    "- Job completion submissions",
    "- Job completion issues/payment holds",
  ].join("\n"));

  return NextResponse.json({ ok: result.sent, telegram: result }, { status: result.sent ? 200 : 500 });
}
