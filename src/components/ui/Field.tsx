import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type FieldProps = {
  label: ReactNode;
  /** id of the control; pass the same value to the control's `id`. */
  htmlFor: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Label + control + hint/error. The control should set
 * `aria-describedby={`${htmlFor}-desc`}` and `aria-invalid` when `error` is set.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  const description = error ?? hint;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-sm font-medium text-fg" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        ) : null}
      </label>
      {children}
      {description ? (
        <p
          className={cn("text-xs", error ? "text-danger-fg" : "text-fg-subtle")}
          id={`${htmlFor}-desc`}
          role={error ? "alert" : undefined}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
