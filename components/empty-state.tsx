import Link from "next/link";

export function EmptyState({ title, body, actionHref, actionLabel }: { title: string; body: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{body}</p>
      {actionHref && actionLabel ? <Link className="button" href={actionHref}>{actionLabel}</Link> : null}
    </div>
  );
}
