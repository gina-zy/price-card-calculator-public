import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/inter";
import App from "./App";
import { TooltipProvider } from "./components/ui/Tooltip";
import { LocaleProvider } from "./locale-context";
import "./index.css";

const routerBaseName = import.meta.env.BASE_URL;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LocaleProvider>
      <TooltipProvider>
        <BrowserRouter basename={routerBaseName}>
          <App />
        </BrowserRouter>
      </TooltipProvider>
    </LocaleProvider>
  </StrictMode>,
);
