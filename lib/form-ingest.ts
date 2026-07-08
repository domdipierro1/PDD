export type IncomingPayload = Record<string, unknown>;

type FieldLike = {
  key?: string;
  label?: string;
  title?: string;
  name?: string;
  value?: unknown;
  answer?: unknown;
};

export async function readIncomingPayload(request: Request): Promise<IncomingPayload> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const json = await request.json().catch(() => ({}));
    return flattenWebhookPayload(json);
  }

  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    const payload: IncomingPayload = {};
    for (const [key, value] of formData.entries()) {
      const parsedValue = typeof File !== "undefined" && value instanceof File ? value.name : value;
      if (payload[key] === undefined) {
        payload[key] = parsedValue;
      } else if (Array.isArray(payload[key])) {
        (payload[key] as unknown[]).push(parsedValue);
      } else {
        payload[key] = [payload[key], parsedValue];
      }
    }
    return payload;
  }

  const text = await request.text().catch(() => "");
  if (!text) return {};

  try {
    return flattenWebhookPayload(JSON.parse(text));
  } catch {
    return { raw: text };
  }
}

function flattenWebhookPayload(payload: unknown): IncomingPayload {
  if (!payload || typeof payload !== "object") return {};
  const source = payload as Record<string, unknown>;
  const flattened: IncomingPayload = { ...source };

  const data = typeof source.data === "object" && source.data ? source.data as Record<string, unknown> : null;
  if (data) {
    Object.assign(flattened, data);
  }

  const possibleFields = [source.fields, data?.fields, source.answers, data?.answers].find(Array.isArray) as FieldLike[] | undefined;
  if (possibleFields) {
    for (const field of possibleFields) {
      if (!field || typeof field !== "object") continue;
      const key = field.label || field.title || field.name || field.key;
      if (!key) continue;
      flattened[String(key)] = field.value ?? field.answer ?? null;
    }
  }

  return flattened;
}

export function value(payload: IncomingPayload, aliases: string[]): unknown {
  const normalisedAliases = aliases.map(normaliseKey);

  for (const [key, val] of Object.entries(payload)) {
    if (normalisedAliases.includes(normaliseKey(key))) return val;
  }

  return undefined;
}

export function text(payload: IncomingPayload, aliases: string[], fallback = ""): string {
  const val = value(payload, aliases);
  if (val === undefined || val === null) return fallback;

  if (Array.isArray(val)) {
    return val.map((item) => stringifyValue(item)).filter(Boolean).join(", ");
  }

  return stringifyValue(val).trim() || fallback;
}

export function optionalText(payload: IncomingPayload, aliases: string[]): string | null {
  const result = text(payload, aliases, "").trim();
  return result || null;
}

export function bool(payload: IncomingPayload, aliases: string[], fallback = false): boolean {
  const val = value(payload, aliases);
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val > 0;
  const lower = String(val).trim().toLowerCase();
  return ["yes", "y", "true", "1", "on", "agreed", "confirmed", "complete", "completed"].includes(lower);
}

export function numberValue(payload: IncomingPayload, aliases: string[]): number | null {
  const val = value(payload, aliases);
  if (val === undefined || val === null || val === "") return null;
  const parsed = Number(String(val).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function dateValue(payload: IncomingPayload, aliases: string[]): string | null {
  const val = text(payload, aliases, "").trim();
  if (!val) return null;
  const date = new Date(val);
  if (Number.isNaN(date.getTime())) return val;
  return date.toISOString().slice(0, 10);
}

export function arrayValue(payload: IncomingPayload, aliases: string[]): string[] {
  const val = value(payload, aliases);
  if (val === undefined || val === null || val === "") return [];

  if (Array.isArray(val)) {
    return val.flatMap((item) => stringifyValue(item).split(",")).map((item) => item.trim()).filter(Boolean);
  }

  return stringifyValue(val).split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
}

export function verifyWebhookSecret(request: Request): boolean {
  const url = new URL(request.url);

  // Built-in public PDD forms are intentionally allowed without exposing the webhook secret.
  // Keep these pages unlisted and use the honeypot fields to reduce spam.
  if (url.searchParams.get("public") === "1") return true;

  const expected = process.env.FORM_WEBHOOK_SECRET;
  if (!expected) return true;

  const querySecret = url.searchParams.get("secret");
  const headerSecret = request.headers.get("x-pdd-form-secret");
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  return [querySecret, headerSecret, bearer].some((candidate) => candidate === expected);
}

export function getReturnUrl(request: Request, payload: IncomingPayload): string | null {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("return_url");
  const fromPayload = optionalText(payload, ["return_url", "redirect", "success_url"]);
  const candidate = fromQuery || fromPayload;
  if (!candidate) return null;

  try {
    const parsed = new URL(candidate, url.origin);
    if (parsed.origin !== url.origin && !["pddcleaningservices.co.uk", "www.pddcleaningservices.co.uk"].includes(parsed.hostname)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isHoneypotFilled(payload: IncomingPayload): boolean {
  return Boolean(optionalText(payload, ["company", "website", "url", "fax"]));
}

export function stringifyValue(val: unknown): string {
  if (val === undefined || val === null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);

  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const likelyUrl = obj.url || obj.href || obj.link || obj.name || obj.filename;
    if (likelyUrl) return String(likelyUrl);
    return JSON.stringify(val);
  }

  return String(val);
}

function normaliseKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}
