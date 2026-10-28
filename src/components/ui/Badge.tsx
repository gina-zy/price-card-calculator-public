import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

const badgeVariants = cva(
  "inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded px-1.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-fg-muted",
        brand: "bg-primary-soft text-primary-soft-fg",
        success: "bg-success-soft text-success-fg",
        warning: "bg-warning-soft text-warning-fg",
        danger: "bg-danger-soft text-danger-fg",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

const dotColors = {
  neutral: "bg-fg-placeholder",
  brand: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

type BadgeProps = ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { dot?: boolean };

/** Status and category labels. Always include text; color is never the only signal. */
export function Badge({ className, tone, dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot ? (
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", dotColors[tone ?? "neutral"])} />
      ) : null}
      {children}
    </span>
  );
}
