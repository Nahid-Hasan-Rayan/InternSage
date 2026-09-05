// © 2026 Nahid Hasan Rayan. All rights reserved.

import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-[var(--radius-card)] border border-hairline bg-paper-0 shadow-[var(--shadow-float)] transition-[box-shadow,transform] duration-200 hover:shadow-[var(--shadow-lg)]",
        className,
      )}
      {...props}
    />
  );
}

export { Card };
