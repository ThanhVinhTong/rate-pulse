import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const inputVariants = cva(
  "w-full outline-none transition placeholder:text-text-tertiary focus:border-primary",
  {
    variants: {
      variant: {
        default:
          "h-12 rounded-xl border border-white/10 bg-[#0c1220] px-4 text-white",
        search:
          "w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 py-2 text-sm text-slate-900 focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white",
        searchTransparent: "flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted",
        ghostNumber:
          "w-full bg-transparent text-2xl font-semibold text-oninset outline-none placeholder:text-oninset-muted",
        ghostReadonly:
          "h-12 w-full cursor-not-allowed select-none rounded-xl border border-white/10 bg-[#0c1220] px-4 text-text-muted outline-none",
        nativeSelect:
          "w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-white/10 dark:bg-[#0c1220] dark:text-white",
        dropdownTrigger:
          "w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition hover:border-primary/60 focus:border-primary dark:border-white/10 dark:bg-[#0c1220] dark:text-white",
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
