"use client";

import Link from "next/link";
import { LogoMark } from "@/components/effects/logo-mark";
import { ImageTrail } from "@/components/effects/image-trail";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <ImageTrail />
      <LogoMark size={52} />
      <p className="max-w-md text-sm text-parchment-dim">
        Every match comes with a reason. Move your cursor around, this trail
        is a real effect, not a screenshot.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/register">Register</Link>
        </Button>
      </div>
    </main>
  );
}
