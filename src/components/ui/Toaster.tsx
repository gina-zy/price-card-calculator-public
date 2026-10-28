import { Toaster as Sonner } from "sonner";
import { useTheme } from "../../theme-context";

export { toast } from "sonner";

/** Mounted once in App. Use `toast.success(...)` / `toast.error(...)` for async results. */
export function Toaster() {
  const { theme } = useTheme();
  return (
    <Sonner
      position="top-center"
      theme={theme}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-[min(360px,calc(100vw-32px))] items-start gap-2.5 rounded-md border bg-surface px-3 py-2.5 text-sm text-fg shadow-overlay",
          title: "font-medium",
          description: "mt-0.5 text-fg-subtle",
          icon: "mt-0.5 shrink-0 [&_svg]:size-4",
          success: "[&_[data-icon]]:text-success",
          error: "[&_[data-icon]]:text-danger",
          warning: "[&_[data-icon]]:text-warning",
          info: "[&_[data-icon]]:text-primary",
          actionButton:
            "ml-auto h-7 shrink-0 rounded-md bg-primary px-2.5 text-[13px] font-medium text-primary-fg",
          cancelButton: "ml-auto h-7 shrink-0 rounded-md px-2.5 text-[13px] text-fg-muted hover:bg-muted",
        },
      }}
    />
  );
}
