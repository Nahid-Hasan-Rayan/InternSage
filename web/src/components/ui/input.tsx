// © 2026 Nahid Hasan Rayan. All rights reserved.

import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-[var(--radius-btn)] border border-hairline bg-paper-0 px-3 py-2 text-sm text-ink-900 placeholder:text-slate-500 outline-none transition-colors focus-visible:border-signal-600 focus-visible:ring-2 focus-visible:ring-signal-600/20 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
