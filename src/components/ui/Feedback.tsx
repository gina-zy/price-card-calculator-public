import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded bg-muted", className)} {...props} />;
}

/** Empty / no-result / no-permission state inside a page region. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      {icon ? <div className="mb-3 text-fg-placeholder [&_svg]:size-8">{icon}</div> : null}
      <p className="text-sm font-medium text-fg">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-fg-subtle">{description}</p> : null}
      {action ? <div className="mt-4 flex items-center gap-2">{action}</div> : null}
    </div>
  );
}

const alertTones = {
  info: { className: "border-transparent bg-primary-soft", icon: Info, iconClass: "text-primary" },
  success: { className: "border-transparent bg-success-soft", icon: CircleCheck, iconClass: "text-success" },
  warning: { className: "border-transparent bg-warning-soft", icon: TriangleAlert, iconClass: "text-warning" },
  danger: { className: "border-transparent bg-danger-soft", icon: CircleAlert, iconClass: "text-danger" },
};

/** Inline message that needs the user's attention. Not for routine help text. */
export function Alert({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: keyof typeof alertTones;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const { className: toneClass, icon: Icon, iconClass } = alertTones[tone];
  return (
    <div
      className={cn("flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm", toneClass, className)}
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 shrink-0", iconClass)} size={16} />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-medium text-fg">{title}</p> : null}
        {children ? <div className={cn("text-fg-muted", title && "mt-0.5")}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
