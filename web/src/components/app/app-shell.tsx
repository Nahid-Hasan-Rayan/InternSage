/**
 * InternSage — AppShell
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-FE-SHELL-001
 * File   : src/components/app/app-shell.tsx
 *
 * Every authenticated page resolves its own session via getSession()
 * and redirects to /login if it comes back null — this component
 * just renders the nav once a page already has a SessionUser, it
 * doesn't do the resolving itself, so each page stays in control of
 * its own loading state.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout, type SessionUser } from "@/lib/api";

const STUDENT_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/matches", label: "Matches" },
  { href: "/applications", label: "Applications" },
  { href: "/profile", label: "Profile" },
];

const RECRUITER_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Postings" },
  { href: "/applications", label: "Applicants" },
  { href: "/recruiter/interview-kits", label: "Interview Kits" },
  { href: "/recruiter/copilot", label: "Sage Copilot" },
  { href: "/recruiter/weights", label: "Scoring Rubric" },
];

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const router = useRouter();
  const links = user.role === "RECRUITER" ? RECRUITER_LINKS : STUDENT_LINKS;

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-hairline px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="font-display text-sm font-semibold tracking-wide text-brass">
            InternSage
          </span>
          <nav className="flex gap-4 text-sm text-parchment-dim">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-parchment">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-parchment-dim">
            {user.fullName} · {user.role}
            {!user.verified && <span className="text-oxide-500"> (unverified)</span>}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
