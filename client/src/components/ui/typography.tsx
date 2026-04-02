import { cva, type VariantProps } from "class-variance-authority";
import { createElement, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/** Page / card titles: always use semantic text color (readable in light & dark). */
export const headingVariants = cva("font-semibold tracking-tight text-text-primary", {
  variants: {
    level: {
      display:
        "max-w-xl text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-7xl",
      h1: "text-3xl font-semibold text-text-primary",
      h2: "text-3xl font-bold text-text-primary sm:text-4xl",
      h3: "text-lg font-semibold text-text-primary",
      card: "text-2xl font-semibold text-text-primary",
      section: "text-2xl font-semibold text-text-primary lg:text-3xl",
      mutedTitle: "text-lg font-semibold text-text-primary",
      /** On #0c1220 / inset panels — light text */
      onDark: "text-lg font-semibold text-oninset",
      onDarkLarge: "text-lg font-semibold text-oninset sm:text-xl",
    },
  },
  defaultVariants: {
    level: "h1",
  },
});

export const textVariants = cva("", {
  variants: {
    variant: {
      body: "text-sm leading-6 text-text-muted",
      bodyLg: "text-lg font-medium text-text-muted sm:text-xl",
      muted: "text-sm text-text-muted",
      caption: "text-xs text-text-tertiary",
      label: "text-sm text-text-muted",
      labelUpper: "text-xs font-semibold uppercase tracking-wider text-text-muted",
      overline: "text-xs font-medium uppercase tracking-[0.2em] text-text-tertiary",
      overlineAccent: "text-xs font-bold uppercase tracking-[0.24em] text-accent-muted",
      overlineBrand: "text-xs font-bold uppercase tracking-[0.2em] text-accent-muted",
      inverse: "text-text-inverse",
      stat: "mt-3 text-3xl font-semibold text-text-primary",
      footer: "text-sm text-text-muted",
      error: "mt-3 max-w-2xl text-sm leading-6 text-red-100/90",
      monoMuted: "font-mono text-text-tertiary",
      onInset: "text-sm text-oninset-muted",
      onInsetMuted: "text-xs text-oninset-muted",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

const headingTags = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  card: "h2",
  section: "h2",
  mutedTitle: "h2",
  onDark: "h3",
  onDarkLarge: "h2",
} as const;

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & VariantProps<typeof headingVariants>;

export function Heading({ className, level, ...props }: HeadingProps) {
  const tag = headingTags[level ?? "h1"];
  return createElement(tag, { className: cn(headingVariants({ level }), className), ...props });
}

type TextProps = HTMLAttributes<HTMLParagraphElement> & VariantProps<typeof textVariants>;

export function Text({ className, variant, ...props }: TextProps) {
  return <p className={cn(textVariants({ variant }), className)} {...props} />;
}

type SpanTextProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof textVariants>;

export function Span({ className, variant, ...props }: SpanTextProps) {
  return <span className={cn(textVariants({ variant }), className)} {...props} />;
}
