import { Languages } from "lucide-react";
import { useLocale } from "../locale-context";
import { Button } from "./ui/Button";
import { Tooltip } from "./ui/Tooltip";

export default function LocaleToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <Tooltip content={t.locale.toggle}>
      <Button
        aria-label={t.locale.toggle}
        onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
        size="icon"
        variant="ghost"
      >
        <Languages aria-hidden="true" size={16} />
      </Button>
    </Tooltip>
  );
}
