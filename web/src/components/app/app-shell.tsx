// © 2026 Nahid Hasan Rayan. All rights reserved.

"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import {
  LayoutGrid,
  Briefcase,
  Target,
  ClipboardList,
  UserCircle,
  ShieldCheck,
  Sparkles,
  Users,
  BarChart3,
  FileCheck2,
  Settings2,
  ArrowLeft,
  Radio,
  Map,
  LineChart,
  GraduationCap,
  Building2,
  CalendarDays,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/effects/logo-mark";
import { logout, type SessionUser } from "@/lib/api";
import { DURATION, EASE } from "@/lib/motion";
import { CommandPalette } from "@/components/app/command-palette";

const STUDENT_LINKS = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/matches", label: "Matches", icon: Target },
  { href: "/applications", label: "Applications", icon: ClipboardList },
  { href: "/verification", label: "Verification", icon: ShieldCheck },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/decision-room", label: "Decision Room", icon: LineChart },
  { href: "/pulse", label: "Industry Pulse", icon: Radio },
  { href: "/tutor", label: "AI Tutor", icon: GraduationCap },
  { href: "/copilot", label: "Sage Copilot", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

const RECRUITER_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/jobs", label: "Postings", icon: Briefcase },
  { href: "/applications", label: "Applicants", icon: Users },
  { href: "/recruiter/interview-kits", label: "Interview Kits", icon: FileCheck2 },
  { href: "/copilot", label: "Sage Copilot", icon: Sparkles },
  { href: "/recruiter/weights", label: "Scoring Rubric", icon: Settings2 },
];

const ADMIN_LINKS = [{ href: "/admin/analytics", label: "Platform Analytics", icon: BarChart3 }];

const UNIVERSITY_LINKS = [
  { href: "/university/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/university/partners", label: "Partners", icon: Building2 },
  { href: "/university/events", label: "Events", icon: CalendarDays },
  { href: "/university/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/copilot", label: "Sage Copilot", icon: Sparkles },
];

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const links =
    user.role === "RECRUITER"
      ? RECRUITER_LINKS
      : user.role === "ADMIN"
        ? ADMIN_LINKS
        : user.role === "UNIVERSITY"
          ? UNIVERSITY_LINKS
          : STUDENT_LINKS;

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleLogout() {
    await logout().catch(() => {});
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-paper-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-hairline bg-paper-50 py-6">
        <div className="mb-3 border-b border-hairline px-6 pb-6">
          <LogoMark size={26} />
          <p className="mt-1.5 text-[11px] text-slate-500">the line between education and employment</p>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  "flex items-center gap-3 rounded-[var(--radius-btn)] px-3.5 py-2.5 text-sm transition-colors " +
                  (active
                    ? "bg-signal-100 font-medium text-signal-700"
                    : "text-slate-500 hover:bg-paper-100 hover:text-ink-900")
                }
              >
                <Icon size={17} strokeWidth={1.8} className="shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-hairline px-6 pt-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-signal-700 text-xs font-semibold text-white">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink-900">{user.fullName}</p>
              <p className="text-[11px] text-slate-500">
                {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                {!user.verified && <span className="text-warn-600"> · unverified</span>}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="mt-3 w-full">
            Log out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-4 border-b border-hairline px-8 py-3">
          <button
            onClick={() => router.back()}
            className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-ink-900"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex h-8 max-w-xs flex-1 items-center gap-2 rounded-full border border-hairline bg-paper-50 px-3 text-xs text-slate-500 transition-colors hover:border-signal-600 hover:text-signal-600"
          >
            <Search size={13} className="shrink-0" />
            <span className="flex-1 text-left">Search or jump to…</span>
            <kbd className="mono rounded bg-paper-100 px-1.5 py-0.5 text-[10px] text-slate-500">⌘K</kbd>
          </button>
        </div>
        <AnimatePresence initial={false}>
          <motion.main
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DURATION.fast, ease: EASE.out }}
            className="flex-1 overflow-y-auto px-8 py-8"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      <CommandPalette
        items={links.map((l) => ({ ...l, group: "Navigate" }))}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
    </div>
  );
}
