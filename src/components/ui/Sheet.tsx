import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { DialogOverlay } from "./Dialog";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

type SheetContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  side?: "left" | "right";
  title: ReactNode;
  /** Visually hide the title (e.g. mobile navigation). */
  hideTitle?: boolean;
  closeLabel: string;
};

/** Side drawer for detail panels and mobile navigation. */
export function SheetContent({
  className,
  children,
  side = "right",
  title,
  hideTitle = false,
  closeLabel,
  ...props
}: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        aria-describedby={undefined}
        className={cn(
          "fixed inset-y-0 z-50 flex w-[min(100vw-48px,420px)] flex-col border-border bg-surface text-fg shadow-overlay focus:outline-none",
          side === "left"
            ? "left-0 border-r data-[state=open]:animate-slide-in-left"
            : "right-0 border-l data-[state=open]:animate-slide-in-right",
          className,
        )}
        {...props}
      >
        <div className={cn("flex h-12 shrink-0 items-center justify-between gap-3 px-4", !hideTitle && "border-b")}>
          <DialogPrimitive.Title className={cn("truncate text-base font-semibold", hideTitle && "sr-only")}>
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close
            aria-label={closeLabel}
            className="ml-auto inline-flex size-7 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-muted hover:text-fg"
          >
            <X aria-hidden="true" size={16} />
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
