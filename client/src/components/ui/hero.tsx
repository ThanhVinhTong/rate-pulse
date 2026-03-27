import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const heroGradientStyle: CSSProperties = {
  background:
    "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 105, 254, 0.35), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(0, 211, 229, 0.2), transparent)",
};

export function HeroGradientBackdrop({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 opacity-40", className)}
      style={heroGradientStyle}
      {...props}
    />
  );
}
