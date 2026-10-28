import TopBarShell from "./components/layout/TopBarShell";
import { Toaster } from "./components/ui/Toaster";
import { PriceCardProvider } from "./price-card-context";
import { ThemeProvider } from "./theme-context";
import CalculatorPage from "./pages/CalculatorPage";

export default function App() {
  return (
    <ThemeProvider>
      <PriceCardProvider>
        <TopBarShell>
          <CalculatorPage />
        </TopBarShell>
      </PriceCardProvider>
      <Toaster />
    </ThemeProvider>
  );
}
