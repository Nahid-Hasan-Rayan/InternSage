// © 2026 Nahid Hasan Rayan. All rights reserved.

"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "text-xs font-semibold text-ink-700 mb-1.5 block",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
