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
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/effects/logo-mark";
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
  const pathname = usePathname();
  const links = user.role === "RECRUITER" ? RECRUITER_LINKS : STUDENT_LINKS;

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper-50">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-hairline bg-paper-0/90 px-6 py-3.5 backdrop-blur-sm">
        <div className="flex items-center gap-8">
          <Link href="/dashboard">
            <LogoMark size={30} />
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "rounded-full bg-signal-100 px-3.5 py-1.5 font-medium text-signal-700"
                      : "rounded-full px-3.5 py-1.5 text-slate-500 transition-colors hover:bg-paper-100 hover:text-ink-900"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-full border border-hairline py-1 pl-1 pr-3.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-signal-700 text-[11px] font-semibold text-white">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
            <span className="text-sm text-ink-900">{user.fullName}</span>
            {!user.verified && (
              <span className="mono rounded-full bg-warn-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warn-600">
                Unverified
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
    </div>
  );
}
