import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const inputVariants = cva(
  "w-full outline-none transition placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-primary/15",
  {
    variants: {
      variant: {
        default:
          "h-10 rounded-md border border-border bg-card px-3 text-sm text-text-primary shadow-sm",
        search:
          "h-10 rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm text-text-primary shadow-sm",
        searchTransparent: "flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted",
        ghostNumber:
          "w-full bg-transparent text-2xl font-semibold text-oninset outline-none placeholder:text-oninset-muted",
        ghostReadonly:
          "h-10 w-full cursor-not-allowed select-none rounded-md border border-border bg-panel px-3 text-sm text-text-muted outline-none",
        nativeSelect:
          "h-10 w-full appearance-none rounded-md border border-border bg-card px-3 py-2 text-sm text-text-primary shadow-sm",
        dropdownTrigger:
          "flex h-10 w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm text-text-primary shadow-sm hover:border-primary/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, ...props }, ref) => (
    <input ref={ref} className={cn(inputVariants({ variant }), className)} {...props} />
  ),
);
Input.displayName = "Input";
