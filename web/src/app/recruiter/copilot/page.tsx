// © 2026 Nahid Hasan Rayan. All rights reserved.

"use client";

/**
 * Sage Copilot moved to the shared /copilot route (every role gets a
 * copilot now, not just recruiters — see CopilotService). This
 * redirect exists only so an old bookmark or link to this URL still
 * lands somewhere useful instead of 404ing.
 */

import * as React from "react";
import { useRouter } from "next/navigation";

export default function LegacyRecruiterCopilotRedirect() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace("/copilot");
  }, [router]);
  return <div className="p-8 text-sm text-slate-500">Redirecting to Sage Copilot…</div>;
}
