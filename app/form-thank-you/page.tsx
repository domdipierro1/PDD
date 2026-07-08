type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
function stringParam(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] || "" : value || ""; }
export default async function FormThankYouPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const type = stringParam(params.type);
  const title = type === "contractor" ? "Contractor details received" : type === "completion" ? "Job sign-off received" : "Quote request received";
  const body = type === "completion" ? "PDD will review the job evidence and complete QA." : type === "contractor" ? "PDD will review your details before any agreement, test job or work is offered." : "PDD will review the enquiry and come back with the next step.";
  return <main className="public-page"><section className="public-card"><div className="public-logo"><img src="/logo.jpg" alt="PDD Cleaning Services" /></div><p className="eyebrow-lite">Thank you</p><h1>{title}</h1><p className="muted">{body}</p></section></main>;
}
