export type TelegramNotificationResult = {
  configured: boolean;
  sent: boolean;
  error?: string;
};

function portalBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_PORTAL_URL || process.env.PDD_PORTAL_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`.replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`.replace(/\/$/, "");

  return "";
}

export function portalLink(path: string) {
  const base = portalBaseUrl();
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function cleanTelegramText(input: string) {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export async function sendTelegramNotification(message: string): Promise<TelegramNotificationResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { configured: false, sent: false, error: "Telegram env vars are not configured." };
  }

  const text = cleanTelegramText(message).slice(0, 3900);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { configured: true, sent: false, error: body || response.statusText };
    }

    return { configured: true, sent: true };
  } catch (error) {
    return {
      configured: true,
      sent: false,
      error: error instanceof Error ? error.message : "Unknown Telegram error.",
    };
  }
}

export async function notifyTelegram(message: string) {
  const result = await sendTelegramNotification(message);

  if (result.configured && !result.sent) {
    console.error("Telegram notification failed:", result.error);
  }

  return result;
}

export function fieldLine(label: string, value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (Array.isArray(value) && value.length === 0) return null;
  const stringValue = Array.isArray(value) ? value.join(", ") : String(value);
  return `${label}: ${stringValue}`;
}

export function compactLines(lines: Array<string | null | undefined>) {
  return lines.filter((line): line is string => Boolean(line && line.trim())).join("\n");
}
