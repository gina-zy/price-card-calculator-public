import { LoaderCircle } from "lucide-react";
import { cn } from "../../lib/cn";

export function Spinner({
  className,
  size = 16,
  label,
}: {
  className?: string;
  size?: number;
  label?: string;
}) {
  return (
    <LoaderCircle
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn("shrink-0 animate-spin", className)}
      role={label ? "status" : undefined}
      size={size}
    />
  );
}
