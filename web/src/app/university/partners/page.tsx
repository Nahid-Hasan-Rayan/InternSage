/**
 * InternSage — University partners
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-FE-UNIV-PARTNERS-001
 * File   : src/app/university/partners/page.tsx
 */

"use client";

import * as React from "react";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BackendPending } from "@/components/ui/backend-pending";
import { getSession, type SessionUser } from "@/lib/api";
import { getUniversityPartners, type UniversityPartner } from "@/lib/internsage-api";

export default function UniversityPartnersPage() {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [partners, setPartners] = React.useState<UniversityPartner[] | null>(null);
  const [notConnected, setNotConnected] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async (q: string) => {
    try {
      const res = await getUniversityPartners({ search: q || undefined });
      setPartners(res.items);
      setNotConnected(false);
    } catch {
      setNotConnected(true);
    }
  }, []);

  React.useEffect(() => {
    getSession().then(async (s) => {
      setUser(s);
      if (s) await load("");
      setLoading(false);
    });
  }, [load]);

  React.useEffect(() => {
    const handle = setTimeout(() => {
      if (user) load(search);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  if (loading || !user) {
    return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  }

  return (
    <AppShell user={user}>
      <h1 className="mb-1 font-display text-2xl text-ink-900">Employer partners</h1>
      <p className="mb-6 text-sm text-slate-500">Companies actively recruiting from your students.</p>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search partners…"
        className="mb-6 max-w-sm"
      />

      {notConnected || partners === null ? (
        <BackendPending feature="University partners" />
      ) : partners.length === 0 ? (
        <p className="text-sm text-slate-500">No partners found.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((p) => (
            <Card key={p.id} className="p-4">
              <p className="font-medium text-ink-900">{p.name}</p>
              <p className="text-xs text-slate-500">{p.industry}</p>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
