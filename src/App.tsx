import { useState } from "react";
import TopBarShell from "./components/layout/TopBarShell";
import { Toaster } from "./components/ui/Toaster";
import { PriceCardProvider } from "./price-card-context";
import { ThemeProvider } from "./theme-context";
import CalculatorPage from "./pages/CalculatorPage";
import PriceCardManagementPage from "./pages/PriceCardManagementPage";

export type AppView = "calculator" | "maintenance";

export default function App() {
  const [view, setView] = useState<AppView>("calculator");
  return (
    <ThemeProvider>
      <PriceCardProvider>
        <TopBarShell view={view} onViewChange={setView}>
          {view === "calculator" ? <CalculatorPage /> : <PriceCardManagementPage />}
        </TopBarShell>
      </PriceCardProvider>
      <Toaster />
    </ThemeProvider>
  );
}
