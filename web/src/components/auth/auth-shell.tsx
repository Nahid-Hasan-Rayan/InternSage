"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { LogoMark } from "@/components/effects/logo-mark";
import { Card } from "@/components/ui/card";
import { fadeRise, staggerContainer } from "@/lib/motion";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      {/* instrument-panel backdrop detail, decorative only */}
      <div
        aria-hidden
        className="calibration-ring pointer-events-none absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 opacity-40"
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative z-10 w-full max-w-md"
      >
        <motion.div variants={fadeRise} className="mb-8 flex justify-center">
          <Link href="/">
            <LogoMark size={44} />
          </Link>
        </motion.div>

        <motion.div variants={fadeRise}>
          <Card className="p-8">
            <div className="mb-6 text-center">
              <h1 className="font-display text-2xl font-semibold text-parchment">
                {title}
              </h1>
              <p className="mt-1.5 text-sm text-parchment-dim">{subtitle}</p>
            </div>
            {children}
          </Card>
        </motion.div>

        <motion.div
          variants={fadeRise}
          className="mt-6 text-center text-sm text-parchment-dim"
        >
          {footer}
        </motion.div>
      </motion.div>
    </div>
  );
}
