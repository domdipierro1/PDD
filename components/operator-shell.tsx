"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { classNames } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/jobs", label: "Jobs" },
  { href: "/contractors", label: "Contractors" },
  { href: "/qa", label: "QA" },
  { href: "/payments", label: "Payments" },
  { href: "/complaints", label: "Complaints" },
  { href: "/agents", label: "Agents" },
  { href: "/launch-checklist", label: "Launch" },
  { href: "/pricing", label: "Pricing" },
];

export function OperatorShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
      if (!data.session) router.replace("/login");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) router.replace("/login");
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) return <div className="loading-screen">Loading PDD Operator Portal…</div>;
  if (!session) return null;

  return (
    <div className="operator-layout">
      <aside className={classNames("sidebar", open && "sidebar-open")}>
        <div className="brand-block">
          <Image src="/logo.jpg" alt="PDD Cleaning Services" width={132} height={80} priority />
          <div>
            <strong>Operator Portal</strong>
            <span>Private admin app</span>
          </div>
        </div>
        <nav className="side-nav">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={classNames(pathname.startsWith(item.href) && "active")}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="button ghost full" onClick={signOut}>Sign out</button>
      </aside>
      <div className="main-shell">
        <header className="mobile-topbar">
          <button className="button ghost" onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}</button>
          <strong>PDD Operator</strong>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
