// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Jobs page
 *
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/form-field";
import { Label } from "@/components/ui/label";
import { getSession, type SessionUser } from "@/lib/api";
import {
  listJobs,
  createJob,
  deactivateJob,
  listSkills,
  applyToJob,
  type JobPosting,
  type SkillOption,
} from "@/lib/internsage-api";

export default function JobsPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [jobs, setJobs] = React.useState<JobPosting[]>([]);
  const [skills, setSkills] = React.useState<SkillOption[]>([]);
  const [message, setMessage] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    requirementsText: "",
    location: "",
    requiredSkillIds: [] as string[],
  });

  const refresh = React.useCallback(async () => {
    const result = await listJobs();
    setJobs(result.items);
  }, []);

  React.useEffect(() => {
    Promise.all([getSession(), listJobs()]).then(async ([session, result]) => {
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session);
      setJobs(result.items);
      if (session.role === "RECRUITER") {
        const skillList = await listSkills().catch(() => []);
        setSkills(skillList);
      }
    });
  }, [router]);

  async function handleApply(jobPostingId: string) {
    try {
      await applyToJob(jobPostingId);
      setMessage("Applied! Track it under Applications.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not apply.");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createJob(form);
      setMessage("Posting created.");
      setForm({ title: "", description: "", requirementsText: "", location: "", requiredSkillIds: [] });
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not create posting.");
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await deactivateJob(id);
      setMessage("Posting deactivated.");
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not deactivate.");
    }
  }

  if (!user) return <div className="p-8 text-sm text-slate-500">Loading…</div>;

  return (
    <AppShell user={user}>
      <h1 className="mb-6 font-display text-xl text-ink-900">
        {user.role === "STUDENT" ? "Browse internships" : "Your postings"}
      </h1>

      {message && <p className="mb-4 text-xs text-signal-700">{message}</p>}

      {user.role === "RECRUITER" && (
        <Card className="mb-6 p-5">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink-900">Post a new role</h2>
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
            <FormField
              id="title"
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <FormField
              id="location"
              label="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <div className="sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="mt-1 h-24 w-full rounded-[4px] border border-hairline bg-paper-100 p-2 text-sm text-ink-900 outline-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="requirementsText">Requirements</Label>
              <textarea
                id="requirementsText"
                className="mt-1 h-16 w-full rounded-[4px] border border-hairline bg-paper-100 p-2 text-sm text-ink-900 outline-none"
                value={form.requirementsText}
                onChange={(e) => setForm({ ...form, requirementsText: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Required skills</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {skills.map((skill) => {
                  const active = form.requiredSkillIds.includes(skill.id);
                  return (
                    <button
                      type="button"
                      key={skill.id}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          requiredSkillIds: active
                            ? f.requiredSkillIds.filter((id) => id !== skill.id)
                            : [...f.requiredSkillIds, skill.id],
                        }))
                      }
                      className={`rounded-full border px-3 py-1 text-xs ${active ? "border-signal-600 bg-signal-700/20 text-signal-700" : "border-hairline text-slate-500"}`}
                    >
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button type="submit" className="sm:col-span-2 w-fit">
              Post role
            </Button>
          </form>
        </Card>
      )}

      <div className="grid gap-3">
        {jobs.map((job) => (
          <Card key={job.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <Link href={`/jobs/${job.id}`} className="min-w-0 flex-1">
                <h3 className="font-display text-base font-semibold text-ink-900 hover:text-signal-700">
                  {job.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {job.company.name} · {job.location ?? "Location flexible"}
                </p>
              </Link>
              {user.role === "STUDENT" ? (
                <Button size="sm" onClick={() => handleApply(job.id)}>
                  Apply
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => handleDeactivate(job.id)}>
                  Deactivate
                </Button>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-slate-500">{job.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.requiredSkills.map((rs) => (
                <span
                  key={rs.skill.id}
                  className="rounded-full border border-hairline bg-paper-100 px-2.5 py-0.5 text-[11px] text-ink-700"
                >
                  {rs.skill.name}
                </span>
              ))}
            </div>
            <Link href={`/jobs/${job.id}`} className="mt-3 inline-block text-xs text-signal-700 hover:underline">
              View full details →
            </Link>
          </Card>
        ))}
        {jobs.length === 0 && <p className="text-sm text-slate-500">No active postings yet.</p>}
      </div>
    </AppShell>
  );
}
