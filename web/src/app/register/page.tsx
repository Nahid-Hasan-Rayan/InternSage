// © 2026 Nahid Hasan Rayan. All rights reserved.

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { register } from "@/lib/api";
import { EASE } from "@/lib/motion";

type Role = "STUDENT" | "RECRUITER";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = React.useState<Role>("STUDENT");
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await register({ email, password, fullName, role });
      router.push(res.user.role === "STUDENT" ? "/profile" : "/candidates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Domain-verified, not self-declared."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-signal-700 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-2">
        {(["STUDENT", "RECRUITER"] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              "rounded-[4px] border px-3 py-2 text-sm transition-colors",
              role === r
                ? "border-signal-600 text-signal-700 bg-signal-700/10"
                : "border-hairline text-slate-500 hover:bg-paper-100",
            )}
          >
            {r === "STUDENT" ? "Student" : "Company / recruiter"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          id="fullName"
          label="Full name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <FormField
          id="email"
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={
            role === "STUDENT" ? "you@graduate.utm.my" : "you@company.com"
          }
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-slate-500">
          {role === "STUDENT"
            ? "A recognised university domain verifies your account automatically. Other domains can still register, unverified."
            : "Your company's domain must be on the whitelist to register. Contact us if yours isn't yet."}
        </p>

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
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
