"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace("/dashboard");
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <Image src="/logo.jpg" alt="PDD Cleaning Services" width={140} height={90} priority />
        <h1>Operator login</h1>
        <p>Private app for PDD leads, jobs, contractors, QA and payments.</p>
        {error ? <div className="notice bad" style={{ marginBottom: 14 }}>{error}</div> : null}
        <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
          <button className="button full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
        </div>
      </form>
    </main>
  );
}
