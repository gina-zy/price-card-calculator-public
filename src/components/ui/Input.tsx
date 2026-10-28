import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export const controlClass =
  "w-full rounded-md border border-border-strong bg-surface px-2.5 text-sm text-fg transition-colors placeholder:text-fg-placeholder hover:border-fg-placeholder focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-fg-subtle aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/20";

type InputProps = ComponentProps<"input"> & {
  /** Leading icon, e.g. <Search size={14} />. */
  icon?: ReactNode;
};

export function Input({ className, icon, ...props }: InputProps) {
  if (!icon) {
    return <input className={cn(controlClass, "h-8", className)} {...props} />;
  }
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-fg-placeholder">
        {icon}
      </span>
      <input className={cn(controlClass, "h-8 pl-8")} {...props} />
    </div>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlClass, "min-h-20 py-1.5 leading-relaxed", className)}
      {...props}
    />
  );
}
