"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { JobDocument, JobPhoto } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function RecordsPage() {
  const [documents, setDocuments] = useState<JobDocument[]>([]);
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [docRes, photoRes] = await Promise.all([
        supabase.from("job_documents").select("*").order("created_at", { ascending: false }).limit(80),
        supabase.from("job_photos").select("*").order("created_at", { ascending: false }).limit(80),
      ]);
      if (!docRes.error) setDocuments((docRes.data || []) as JobDocument[]);
      if (!photoRes.error) setPhotos((photoRes.data || []) as JobPhoto[]);
      const err = docRes.error || photoRes.error;
      if (err && !err.message.includes("does not exist")) setError(err.message);
    }
    load();
  }, []);

  return (
    <>
      <div className="page-head"><div><h1>Records</h1><p>Signed forms, agreement links, job evidence and before/after photo links.</p></div></div>
      {error ? <div className="notice bad" style={{ marginBottom: 16 }}>{error}</div> : null}
      <div className="grid grid-2">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Documents</h2>
          {documents.length === 0 ? <EmptyState title="No documents yet" body="Add customer agreements, contractor agreements, job sheets, invoices and sign-off documents from each job page." /> : (
            <div className="list">{documents.map((doc) => <div className="card list-card" key={doc.id}><div className="list-top"><h3>{doc.title}</h3><StatusBadge value={doc.signed ? "Signed" : doc.document_type} /></div><div className="list-meta"><span>{doc.document_type}</span><span>{formatDate(doc.signed_at || doc.created_at)}</span>{doc.job_id ? <Link href={`/jobs/${doc.job_id}`}>Job</Link> : null}{doc.file_link ? <a href={doc.file_link} target="_blank">Open file</a> : null}</div><p className="muted">{doc.notes}</p></div>)}</div>
          )}
        </section>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Photos</h2>
          {photos.length === 0 ? <EmptyState title="No photo links yet" body="Contractor job completion submissions and manual photo records will appear here." /> : (
            <div className="list">{photos.map((photo) => <div className="card list-card" key={photo.id}><div className="list-top"><h3>{photo.title || photo.photo_stage}</h3><StatusBadge value={photo.photo_stage} /></div><div className="list-meta"><span>{formatDate(photo.created_at)}</span>{photo.submitted_by ? <span>{photo.submitted_by}</span> : null}{photo.job_id ? <Link href={`/jobs/${photo.job_id}`}>Job</Link> : null}<a href={photo.file_link} target="_blank">Open photos</a></div><p className="muted">{photo.notes}</p></div>)}</div>
          )}
        </section>
      </div>
    </>
  );
}
