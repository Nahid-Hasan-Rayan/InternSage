/**
 * InternSage — Student profile + CV editor
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-FE-PROFILE-001
 * File   : src/app/profile/page.tsx
 *
 * This is the piece that was missing: the backend's Profile and CV
 * modules had full APIs (see ProfileController/CvController) but no
 * frontend ever called them. This page is the first one that does.
 *
 * Data model note: `GET /cv` already returns the professional
 * profile alongside skills/experiences/educations/projects (see
 * CvService.getFullCv), so this page only needs TWO reads —
 * `/profile/academic` and `/cv` — not three. Editing the
 * professional profile's own fields (headline, visibility) still
 * goes through `PATCH /profile/professional`, per ProfileController.
 *
 * Known backend gap (see server/ARCHITECTURE.md's pattern — worth
 * fixing before this ships): CvController only has POST for
 * experiences/educations/projects, no PATCH/DELETE yet. So this
 * page can add entries but not edit or remove them — that's a
 * backend limitation, not something to fake client-side.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/auth/form-field";
import { authedFetch } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

// ---- Types (mirror the backend's actual response shapes) --------

interface AcademicProfile {
  major: string | null;
  year: number | null;
  bio: string | null;
  university: { id: string; name: string; verified: boolean } | null;
}

interface ProfessionalProfile {
  id: string;
  headline: string | null;
  visibility: "ALL_VERIFIED_RECRUITERS" | "APPLIED_ONLY" | "DRAFT";
}

interface Skill {
  skillId: string;
  skill: { id: string; name: string; category: string };
}

interface Experience {
  id: string;
  title: string;
  organization: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  startYear: number;
  endYear: number | null;
  verified: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  portfolioUrl: string | null;
}

interface FullCv {
  profile: ProfessionalProfile;
  skills: Skill[];
  experiences: Experience[];
  educations: Education[];
  projects: Project[];
}

const textareaClass =
  "flex w-full rounded-[4px] border border-hairline bg-ink-800 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim outline-none transition-colors focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30 disabled:cursor-not-allowed disabled:opacity-50";

const selectClass = textareaClass + " h-10";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [academic, setAcademic] = React.useState<AcademicProfile | null>(null);
  const [cv, setCv] = React.useState<FullCv | null>(null);

  const loadAll = React.useCallback(async () => {
    try {
      const [a, c] = await Promise.all([
        authedFetch<AcademicProfile>("/profile/academic"),
        authedFetch<FullCv>("/cv"),
      ]);
      setAcademic(a);
      setCv(c);
      setLoadError(null);
    } catch (err) {
      // Any failure here (not logged in, not a student, account
      // deleted) is treated the same way: send them to log in
      // rather than guessing which case it is.
      setLoadError(err instanceof Error ? err.message : "Couldn't load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadAll();
  }, [loadAll]);

  if (loading) {
    return <main className="p-8 text-sm text-parchment-dim">Loading your profile…</main>;
  }

  if (loadError || !academic || !cv) {
    return (
      <main className="flex flex-col items-start gap-3 p-8 text-parchment">
        <p className="text-sm text-oxide">{loadError ?? "Something went wrong."}</p>
        <Button onClick={() => router.push("/login")}>Log in</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-8 text-parchment">
      <div>
        <h1 className="text-xl font-semibold">Your profile</h1>
        <p className="text-sm text-parchment-dim">
          This is what recruiters see, depending on your visibility setting below.
        </p>
      </div>

      <AcademicSection academic={academic} onSaved={loadAll} />
      <ProfessionalSection profile={cv.profile} onSaved={loadAll} />
      <SkillsSection skills={cv.skills} onSaved={loadAll} />
      <ExperienceSection experiences={cv.experiences} onSaved={loadAll} />
      <EducationSection educations={cv.educations} onSaved={loadAll} />
      <ProjectSection projects={cv.projects} onSaved={loadAll} />
    </main>
  );
}

// ------------------------------------------------------------------
// Academic profile
// ------------------------------------------------------------------

function AcademicSection({
  academic,
  onSaved,
}: {
  academic: AcademicProfile;
  onSaved: () => Promise<void>;
}) {
  const [major, setMajor] = React.useState(academic.major ?? "");
  const [year, setYear] = React.useState(academic.year?.toString() ?? "");
  const [bio, setBio] = React.useState(academic.bio ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await authedFetch("/profile/academic", {
        method: "PATCH",
        body: JSON.stringify({
          major: major || undefined,
          year: year ? Number(year) : undefined,
          bio: bio || undefined,
        }),
      });
      trackEvent("PROFILE_UPDATED", { section: "academic" });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-parchment-dim">
          Academic
        </h2>
        {academic.university && (
          <span
            className={`text-xs ${academic.university.verified ? "text-brass" : "text-parchment-dim"}`}
          >
            {academic.university.name}
            {academic.university.verified ? " · verified" : " · not yet a partner"}
          </span>
        )}
      </div>
      <form onSubmit={save} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField id="major" label="Major" value={major} onChange={(e) => setMajor(e.target.value)} />
          <FormField
            id="year"
            label="Year"
            type="number"
            min={1}
            max={7}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            className={textareaClass}
            rows={3}
            maxLength={2000}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A couple of sentences about what you're looking for."
          />
        </div>
        {error && <p className="text-xs text-oxide">{error}</p>}
        <Button type="submit" loading={saving} size="sm" className="self-start">
          Save academic info
        </Button>
      </form>
    </Card>
  );
}

// ------------------------------------------------------------------
// Professional profile (headline + visibility)
// ------------------------------------------------------------------

function ProfessionalSection({
  profile,
  onSaved,
}: {
  profile: ProfessionalProfile;
  onSaved: () => Promise<void>;
}) {
  const [headline, setHeadline] = React.useState(profile.headline ?? "");
  const [visibility, setVisibility] = React.useState(profile.visibility);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await authedFetch("/profile/professional", {
        method: "PATCH",
        body: JSON.stringify({ headline: headline || undefined, visibility }),
      });
      trackEvent("PROFILE_UPDATED", { section: "professional" });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-parchment-dim">
        Headline &amp; visibility
      </h2>
      <form onSubmit={save} className="flex flex-col gap-4">
        <FormField
          id="headline"
          label="Headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g. Mechanical engineering student, CAD + thermal systems"
        />
        <div>
          <Label htmlFor="visibility">Who can see this profile</Label>
          <select
            id="visibility"
            className={selectClass}
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as ProfessionalProfile["visibility"])}
          >
            <option value="ALL_VERIFIED_RECRUITERS">All verified recruiters</option>
            <option value="APPLIED_ONLY">Only recruiters I've applied to</option>
            <option value="DRAFT">Draft — hidden from everyone</option>
          </select>
        </div>
        {error && <p className="text-xs text-oxide">{error}</p>}
        <Button type="submit" loading={saving} size="sm" className="self-start">
          Save
        </Button>
      </form>
    </Card>
  );
}

// ------------------------------------------------------------------
// Skills — add + remove (the only CV sub-resource with a DELETE route)
// ------------------------------------------------------------------

function SkillsSection({ skills, onSaved }: { skills: Skill[]; onSaved: () => Promise<void> }) {
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await authedFetch("/cv/skills", { method: "POST", body: JSON.stringify({ name: name.trim() }) });
      setName("");
      trackEvent("CV_UPDATED", { section: "skills", action: "add" });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add skill.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(skillId: string) {
    setBusy(true);
    try {
      await authedFetch(`/cv/skills/${skillId}`, { method: "DELETE" });
      trackEvent("CV_UPDATED", { section: "skills", action: "remove" });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove skill.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-parchment-dim">Skills</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {skills.length === 0 && <p className="text-sm text-parchment-dim">No skills added yet.</p>}
        {skills.map((s) => (
          <span
            key={s.skillId}
            className="flex items-center gap-2 rounded-[4px] border border-hairline bg-ink-800 px-3 py-1 text-sm"
          >
            {s.skill.name}
            <button
              type="button"
              onClick={() => remove(s.skillId)}
              disabled={busy}
              className="text-parchment-dim hover:text-oxide"
              aria-label={`Remove ${s.skill.name}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={add} className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. SolidWorks, Python, Financial modeling"
          maxLength={100}
        />
        <Button type="submit" loading={busy} size="sm">
          Add
        </Button>
      </form>
      {error && <p className="mt-2 text-xs text-oxide">{error}</p>}
    </Card>
  );
}

// ------------------------------------------------------------------
// Experience — add-only (no PATCH/DELETE route on the backend yet)
// ------------------------------------------------------------------

function ExperienceSection({
  experiences,
  onSaved,
}: {
  experiences: Experience[];
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authedFetch("/cv/experiences", {
        method: "POST",
        body: JSON.stringify({
          title,
          organization,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          description: description || undefined,
        }),
      });
      setTitle("");
      setOrganization("");
      setStartDate("");
      setEndDate("");
      setDescription("");
      setShowForm(false);
      trackEvent("CV_UPDATED", { section: "experience", action: "add" });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add experience.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-parchment-dim">Experience</h2>
        {!showForm && (
          <Button size="sm" variant="ghost" onClick={() => setShowForm(true)}>
            Add
          </Button>
        )}
      </div>

      <ul className="mb-4 flex flex-col gap-3">
        {experiences.length === 0 && <p className="text-sm text-parchment-dim">Nothing added yet.</p>}
        {experiences.map((exp) => (
          <li key={exp.id} className="border-t border-hairline/40 pt-3 text-sm">
            <p className="font-medium">
              {exp.title} · {exp.organization}
            </p>
            <p className="text-xs text-parchment-dim">
              {new Date(exp.startDate).toLocaleDateString(undefined, { year: "numeric", month: "short" })}
              {" – "}
              {exp.endDate
                ? new Date(exp.endDate).toLocaleDateString(undefined, { year: "numeric", month: "short" })
                : "Present"}
            </p>
            {exp.description && <p className="mt-1 text-parchment-dim">{exp.description}</p>}
          </li>
        ))}
      </ul>

      {showForm && (
        <form onSubmit={add} className="flex flex-col gap-3 border-t border-hairline/40 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField id="exp-title" label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
            <FormField
              id="exp-org"
              label="Organization"
              required
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="exp-start"
              label="Start date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <FormField
              id="exp-end"
              label="End date (leave blank if current)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="exp-desc">Description</Label>
            <textarea
              id="exp-desc"
              className={textareaClass}
              rows={2}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-oxide">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={busy}>
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------
// Education — add-only
// ------------------------------------------------------------------

function EducationSection({
  educations,
  onSaved,
}: {
  educations: Education[];
  onSaved: () => Promise<void>;
}) {
  const [institution, setInstitution] = React.useState("");
  const [degree, setDegree] = React.useState("");
  const [startYear, setStartYear] = React.useState("");
  const [endYear, setEndYear] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authedFetch("/cv/educations", {
        method: "POST",
        body: JSON.stringify({
          institution,
          degree,
          startYear: Number(startYear),
          endYear: endYear ? Number(endYear) : undefined,
        }),
      });
      setInstitution("");
      setDegree("");
      setStartYear("");
      setEndYear("");
      setShowForm(false);
      trackEvent("CV_UPDATED", { section: "education", action: "add" });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add education.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-parchment-dim">Education</h2>
        {!showForm && (
          <Button size="sm" variant="ghost" onClick={() => setShowForm(true)}>
            Add
          </Button>
        )}
      </div>

      <ul className="mb-4 flex flex-col gap-3">
        {educations.length === 0 && <p className="text-sm text-parchment-dim">Nothing added yet.</p>}
        {educations.map((ed) => (
          <li key={ed.id} className="border-t border-hairline/40 pt-3 text-sm">
            <p className="font-medium">
              {ed.degree} · {ed.institution}
              {ed.verified && <span className="ml-2 text-xs text-brass">verified</span>}
            </p>
            <p className="text-xs text-parchment-dim">
              {ed.startYear} – {ed.endYear ?? "Present"}
            </p>
          </li>
        ))}
      </ul>

      {showForm && (
        <form onSubmit={add} className="flex flex-col gap-3 border-t border-hairline/40 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="ed-institution"
              label="Institution"
              required
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
            <FormField id="ed-degree" label="Degree" required value={degree} onChange={(e) => setDegree(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="ed-start"
              label="Start year"
              type="number"
              required
              min={1950}
              max={2100}
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
            />
            <FormField
              id="ed-end"
              label="End year (leave blank if ongoing)"
              type="number"
              min={1950}
              max={2100}
              value={endYear}
              onChange={(e) => setEndYear(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-oxide">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={busy}>
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------
// Projects — add-only
// ------------------------------------------------------------------

function ProjectSection({ projects, onSaved }: { projects: Project[]; onSaved: () => Promise<void> }) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [portfolioUrl, setPortfolioUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authedFetch("/cv/projects", {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || undefined,
          portfolioUrl: portfolioUrl || undefined,
        }),
      });
      setTitle("");
      setDescription("");
      setPortfolioUrl("");
      setShowForm(false);
      trackEvent("CV_UPDATED", { section: "project", action: "add" });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add project.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-parchment-dim">Projects</h2>
        {!showForm && (
          <Button size="sm" variant="ghost" onClick={() => setShowForm(true)}>
            Add
          </Button>
        )}
      </div>

      <ul className="mb-4 flex flex-col gap-3">
        {projects.length === 0 && <p className="text-sm text-parchment-dim">Nothing added yet.</p>}
        {projects.map((p) => (
          <li key={p.id} className="border-t border-hairline/40 pt-3 text-sm">
            <p className="font-medium">{p.title}</p>
            {p.description && <p className="text-parchment-dim">{p.description}</p>}
            {p.portfolioUrl && (
              <a href={p.portfolioUrl} target="_blank" rel="noreferrer" className="text-brass hover:underline">
                {p.portfolioUrl}
              </a>
            )}
          </li>
        ))}
      </ul>

      {showForm && (
        <form onSubmit={add} className="flex flex-col gap-3 border-t border-hairline/40 pt-4">
          <FormField id="proj-title" label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <div>
            <Label htmlFor="proj-desc">Description</Label>
            <textarea
              id="proj-desc"
              className={textareaClass}
              rows={2}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <FormField
            id="proj-url"
            label="Link (repo, CAD file, writeup — anything)"
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://"
          />
          {error && <p className="text-xs text-oxide">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={busy}>
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
