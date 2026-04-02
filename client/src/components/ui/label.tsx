import { cva, type VariantProps } from "class-variance-authority";
import type { LabelHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const labelVariants = cva("block", {
  variants: {
    variant: {
      default: "space-y-2",
      inline: "flex flex-col gap-2",
      fieldRow: "block w-full space-y-2",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const fieldLabelVariants = cva("", {
  variants: {
    variant: {
      default: "text-sm text-text-muted",
      upper: "text-xs font-semibold uppercase tracking-wider text-text-muted mb-2",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement>, VariantProps<typeof labelVariants> {}

export function FieldLabel({
  className,
  variant,
  children,
  ...props
}: LabelProps & { children?: ReactNode }) {
  return (
    <label className={cn(labelVariants({ variant }), className)} {...props}>
      {children}
    </label>
  );
}

interface FieldCaptionProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof fieldLabelVariants> {}

export function FieldCaption({ className, variant, ...props }: FieldCaptionProps) {
  return <span className={cn(fieldLabelVariants({ variant }), className)} {...props} />;
}
