// © 2026 Nahid Hasan Rayan. All rights reserved.

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { GraduationCap, Briefcase, Building2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { login, landingRouteFor } from "@/lib/api";
import { EASE } from "@/lib/motion";

const DEMO_PASSWORD = "InternSageDemo!2026";

const DEMO_ACCOUNTS = [
  { label: "Student", email: "demo.student@graduate.utm.my", icon: GraduationCap },
  { label: "Recruiter", email: "demo.recruiter@paduanalytics.com", icon: Briefcase },
  { label: "University", email: "demo.admin@graduate.utm.my", icon: Building2 },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [demoLoading, setDemoLoading] = React.useState<string | null>(null);

  async function performLogin(loginEmail: string, loginPassword: string) {
    setError(null);
    try {
      const res = await login(loginEmail, loginPassword);
      router.push(landingRouteFor(res.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await performLogin(email, password);
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(demoEmail: string) {
    setDemoLoading(demoEmail);
    try {
      await performLogin(demoEmail, DEMO_PASSWORD);
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your matches."
      footer={
        <>
          No account?{" "}
          <Link href="/register" className="text-signal-700 hover:underline">
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@graduate.utm.my"
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: EASE.out }}
            className="rounded-[4px] border border-alert-600/40 bg-alert-600/10 px-3 py-2 text-sm text-alert-600"
          >
            {error}
          </motion.p>
        )}

        <Button type="submit" loading={loading} className="mt-2 w-full">
          {loading ? "Logging in…" : "Log in"}
        </Button>

        <div className="mt-1 flex items-center gap-3">
          <div className="h-px flex-1 bg-hairline" />
          <span className="text-xs text-slate-400">or explore a demo account</span>
          <div className="h-px flex-1 bg-hairline" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map(({ label, email: demoEmail, icon: Icon }) => (
            <Button
              key={demoEmail}
              type="button"
              variant="ghost"
              size="sm"
              className="flex-col gap-1 py-3"
              disabled={demoLoading !== null}
              loading={demoLoading === demoEmail}
              onClick={() => handleDemoLogin(demoEmail)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </form>
    </AuthShell>
  );
}
