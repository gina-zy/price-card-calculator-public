import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

/** Content container for every routed page. */
export function Page({ className, ...props }: ComponentProps<"main">) {
  return (
    <main
      className={cn("mx-auto w-full max-w-[1200px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6", className)}
      {...props}
    />
  );
}

/** One per page: task title, optional one-line description, page-level actions. */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <header className="mb-5">
      {breadcrumb ? <div className="mb-2 text-xs text-fg-subtle">{breadcrumb}</div> : null}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold leading-7 text-fg">{title}</h1>
          {description ? <p className="mt-1 text-sm text-fg-subtle">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
