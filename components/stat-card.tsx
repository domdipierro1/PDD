import Link from "next/link";

export function StatCard({ title, value, href, note }: { title: string; value: number | string; href?: string; note?: string }) {
  const inner = (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      {note ? <div className="stat-note">{note}</div> : null}
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
