import { cva } from "class-variance-authority";
import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const textareaVariants = cva(
  "w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 py-3 text-white outline-none transition focus:border-primary",
);

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(textareaVariants(), className)} {...props} />
));
Textarea.displayName = "Textarea";
