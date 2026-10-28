import { Calculator } from "lucide-react";
import type { ReactNode } from "react";
import { useLocale } from "../../locale-context";
import LocaleToggle from "../LocaleToggle";
import ThemeToggle from "../ThemeToggle";

export default function TopBarShell({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-fg">
      <header className="sticky top-0 z-30 border-b bg-surface">
        <div className="flex h-12 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <span aria-hidden="true" className="grid size-7 place-items-center rounded-md bg-primary text-primary-fg">
            <Calculator size={16} />
          </span>
          <span className="truncate text-sm font-semibold text-fg">{t.app.name}</span>
          <span className="hidden text-sm text-fg-muted md:inline">{t.nav.calculator}</span>
          <div className="ml-auto flex items-center gap-1">
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
