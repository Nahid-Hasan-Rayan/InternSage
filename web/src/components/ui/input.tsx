import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-[4px] border border-hairline bg-ink-800 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim outline-none transition-colors focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/30 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
