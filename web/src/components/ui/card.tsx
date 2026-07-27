import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-[4px] border border-hairline bg-ink-850/90 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Card };
