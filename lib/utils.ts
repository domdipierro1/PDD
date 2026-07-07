export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(Number(value));
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function tomorrowISO() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function toMoney(value: FormDataEntryValue | null) {
  if (!value) return null;
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  return cleaned ? Number(cleaned) : null;
}

export function toBool(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "TRUE";
}

export function splitMulti(value: FormDataEntryValue | null) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
