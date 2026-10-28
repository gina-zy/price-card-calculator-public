import { Calculator, FileSpreadsheet } from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../../App";
import { useLocale } from "../../locale-context";
import LocaleToggle from "../LocaleToggle";
import ThemeToggle from "../ThemeToggle";
import { Button } from "../ui/Button";

export default function TopBarShell({ children, view, onViewChange }: { children: ReactNode; view: AppView; onViewChange: (view: AppView) => void }) {
  const { t } = useLocale();
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-fg">
      <header className="sticky top-0 z-30 border-b bg-surface">
        <div className="flex h-12 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <span aria-hidden="true" className="grid size-7 place-items-center rounded-md bg-primary text-primary-fg">
            <Calculator size={16} />
          </span>
          <span className="truncate text-sm font-semibold text-fg">{t.app.name}</span>
          <nav aria-label={t.nav.label} className="hidden items-center gap-1 md:flex">
            <Button size="sm" type="button" variant={view === "calculator" ? "primary" : "ghost"} onClick={() => onViewChange("calculator")}><Calculator aria-hidden="true" size={14} />{t.nav.calculator}</Button>
            <Button size="sm" type="button" variant={view === "maintenance" ? "primary" : "ghost"} onClick={() => onViewChange("maintenance")}><FileSpreadsheet aria-hidden="true" size={14} />{t.nav.maintenance}</Button>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <div className="flex md:hidden">
              <Button size="sm" type="button" variant="ghost" onClick={() => onViewChange(view === "calculator" ? "maintenance" : "calculator")}>{view === "calculator" ? t.nav.maintenance : t.nav.calculator}</Button>
            </div>
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
