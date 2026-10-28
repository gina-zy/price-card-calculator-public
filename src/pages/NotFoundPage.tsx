import { FileQuestion } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Page } from "../components/layout/Page";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/Feedback";
import { useLocale } from "../locale-context";

export default function NotFoundPage() {
  const { t } = useLocale();

  useEffect(() => {
    document.title = `${t.notFound.title} | ${t.app.name}`;
  }, [t]);

  return (
    <Page className="grid min-h-[calc(100dvh-48px)] place-items-center">
      <EmptyState
        action={
          <Button asChild variant="secondary">
            <Link to="/">{t.notFound.back}</Link>
          </Button>
        }
        description={t.notFound.description}
        icon={<FileQuestion aria-hidden="true" />}
        title={t.notFound.title}
      />
    </Page>
  );
}
