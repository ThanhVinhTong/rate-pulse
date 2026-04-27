import { cva } from "class-variance-authority";
import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const textareaVariants = cva(
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text-primary shadow-sm outline-none transition placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-primary/15",
);

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(textareaVariants(), className)} {...props} />
));
Textarea.displayName = "Textarea";
