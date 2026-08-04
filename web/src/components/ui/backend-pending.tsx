/**
 * InternSage — BackendPending
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-FE-PENDING-001
 * File   : src/components/ui/backend-pending.tsx
 *
 * Used by pages whose backend is being built separately (Industry
 * Pulse, AI Tutor, Guidance/Roadmap, University portal — see
 * internsage-api.ts's header comment for each endpoint's expected
 * contract). Shows a clear, honest state instead of a raw fetch
 * error or a blank screen — the page is real and ready, it's just
 * waiting on data that doesn't exist yet.
 */

import { Card } from "./card";

export function BackendPending({ feature }: { feature: string }) {
  return (
    <Card className="flex flex-col items-center gap-2 border-dashed p-10 text-center">
      <p className="text-sm font-medium text-ink-900">{feature} isn&rsquo;t connected yet</p>
      <p className="max-w-sm text-xs text-slate-500">
        This page is fully built on the frontend and ready to go — it&rsquo;s waiting on its backend
        endpoint, which is in progress.
      </p>
    </Card>
  );
}
