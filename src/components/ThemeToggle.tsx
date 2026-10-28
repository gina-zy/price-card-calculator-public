import { Moon, Sun } from "lucide-react";
import { useLocale } from "../locale-context";
import { useTheme } from "../theme-context";
import { Button } from "./ui/Button";
import { Tooltip } from "./ui/Tooltip";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLocale();

  return (
    <Tooltip content={t.theme.toggle}>
      <Button aria-label={t.theme.toggle} onClick={toggleTheme} size="icon" variant="ghost">
        {theme === "dark" ? <Sun aria-hidden="true" size={16} /> : <Moon aria-hidden="true" size={16} />}
      </Button>
    </Tooltip>
  );
}
