/**
 * InternSage — Jobs page
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-FE-JOBS-001
 * File   : src/app/jobs/page.tsx
 */

"use client";

import * as React from "react";
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
    getSession().then(async (session) => {
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session);
      await refresh();
      if (session.role === "RECRUITER") {
        const skillList = await listSkills().catch(() => []);
        setSkills(skillList);
      }
    });
  }, [router, refresh]);

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

  if (!user) return <div className="p-8 text-sm text-parchment-dim">Loading…</div>;

  return (
    <AppShell user={user}>
      <h1 className="mb-6 font-display text-xl text-parchment">
        {user.role === "STUDENT" ? "Browse internships" : "Your postings"}
      </h1>

      {message && <p className="mb-4 text-xs text-brass">{message}</p>}

      {user.role === "RECRUITER" && (
        <Card className="mb-6 p-5">
          <h2 className="mb-3 font-display text-sm font-semibold text-parchment">Post a new role</h2>
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
                className="mt-1 h-24 w-full rounded-[4px] border border-hairline bg-ink-800 p-2 text-sm text-parchment outline-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="requirementsText">Requirements</Label>
              <textarea
                id="requirementsText"
                className="mt-1 h-16 w-full rounded-[4px] border border-hairline bg-ink-800 p-2 text-sm text-parchment outline-none"
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
                      className={`rounded-full border px-3 py-1 text-xs ${active ? "border-brass bg-brass/20 text-brass" : "border-hairline text-parchment-dim"}`}
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

      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-sm font-semibold text-parchment">{job.title}</h3>
                <p className="text-xs text-parchment-dim">{job.company.name} · {job.location ?? "Remote/Unspecified"}</p>
              </div>
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
            <p className="mt-2 text-xs text-parchment-dim">{job.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {job.requiredSkills.map((rs) => (
                <span key={rs.skill.id} className="rounded-full bg-ink-700 px-2 py-0.5 text-[10px] text-parchment-dim">
                  {rs.skill.name}
                </span>
              ))}
            </div>
          </Card>
        ))}
        {jobs.length === 0 && <p className="text-sm text-parchment-dim">No active postings yet.</p>}
      </div>
    </AppShell>
  );
}
