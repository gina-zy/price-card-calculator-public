import { FileSpreadsheet, RotateCcw, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Alert, EmptyState } from "../components/ui/Feedback";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs";
import { toast } from "../components/ui/Toaster";
import { Page, PageHeader } from "../components/layout/Page";
import { useLocale } from "../locale-context";
import { parsePriceCardFiles, type ParsedPriceCards } from "../lib/price-card-xlsx";
import { usePriceCards } from "../price-card-context";

export default function PriceCardManagementPage() {
  const { t, locale } = useLocale();
  const { serviceCards, version, publishServiceCards, resetServiceCards } = usePriceCards();
  const [files, setFiles] = useState<File[]>([]);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<ParsedPriceCards | null>(null);
  const [error, setError] = useState("");
  const formatter = useMemo(() => new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { dateStyle: "medium", timeStyle: "short" }), [locale]);
  const providerSummary = Object.entries(version.summary.providers).map(([provider, count]) => `${provider} ${count}`).join(" / ");

  const chooseFiles = (selected: FileList | null) => {
    const next = Array.from(selected ?? []);
    setFiles(next);
    setPreview(null);
    setError("");
  };

  const validate = async () => {
    setParsing(true);
    setError("");
    try {
      const result = await parsePriceCardFiles(files);
      setPreview(result);
      toast.success(t.maintenance.previewReady);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t.maintenance.validationFailed;
      setError(message);
      toast.error(message);
    } finally {
      setParsing(false);
    }
  };

  const publish = () => {
    if (!preview) return;
    publishServiceCards(preview.cards, {
      version: `local-${new Date().toISOString()}`,
      updatedAt: new Date().toISOString(),
      source: preview.files.map((file) => file.filename).join("、"),
      summary: preview.summary,
    });
    toast.success(t.maintenance.publishSuccess);
  };

  const restore = () => {
    resetServiceCards();
    setPreview(null);
    toast.success(t.maintenance.restoreBuiltInSuccess);
  };

  return (
    <Page>
      <PageHeader title={t.maintenance.title} description={t.maintenance.description} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader title={t.maintenance.uploadTitle} description={t.maintenance.uploadDescription} />
          <CardBody className="space-y-4">
            <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-4 text-center hover:bg-canvas">
              <FileSpreadsheet aria-hidden="true" className="text-fg-subtle" size={28} />
              <span className="text-sm font-medium">{t.maintenance.dropFiles}</span>
              <span className="text-xs text-fg-subtle">{t.maintenance.fileRule}</span>
              <input className="sr-only" multiple accept=".xlsx" type="file" onChange={(event) => chooseFiles(event.target.files)} />
            </label>
            {files.length ? <div className="rounded-lg border bg-canvas p-3 text-sm"><strong>{t.maintenance.selectedFiles}</strong><ul className="mt-2 list-disc pl-5 text-fg-muted">{files.map((file) => <li key={`${file.name}-${file.size}`}>{file.name}</li>)}</ul></div> : null}
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <div className="flex flex-wrap gap-2">
              <Button disabled={!files.length || parsing} type="button" variant="primary" onClick={() => void validate()}><Upload aria-hidden="true" size={16} />{parsing ? t.maintenance.validating : t.maintenance.validate}</Button>
              <Button disabled={!preview} type="button" onClick={publish}>{t.maintenance.confirmPublish}</Button>
              <Button type="button" variant="ghost" onClick={restore}><RotateCcw aria-hidden="true" size={16} />{t.maintenance.restoreBuiltIn}</Button>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t.maintenance.version} description={version.source} />
          <CardBody className="space-y-3 text-sm">
            <p><span className="text-fg-subtle">{t.maintenance.updatedAt}：</span>{formatter.format(new Date(version.updatedAt))}</p>
            <p><span className="text-fg-subtle">{t.maintenance.providers}：</span>{providerSummary || "—"}</p>
            <div className="grid grid-cols-2 gap-2">
              <Badge>{t.maintenance.rows} {version.summary.rows}</Badge>
              <Badge tone="success">{t.maintenance.computable} {version.summary.computable}</Badge>
              <Badge tone="danger">{t.maintenance.blockers} {version.summary.blockers}</Badge>
              <Badge tone="warning">{t.maintenance.warnings} {version.summary.warnings}</Badge>
            </div>
          </CardBody>
        </Card>
      </div>

      <Tabs className="mt-6" defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">{t.maintenance.serviceTab}</TabsTrigger>
          <TabsTrigger value="preview">{t.maintenance.previewTab}</TabsTrigger>
          <TabsTrigger value="issues">{t.maintenance.issueTab}</TabsTrigger>
        </TabsList>
        <TabsContent value="current"><PriceCardTable cards={serviceCards.slice(0, 80)} /></TabsContent>
        <TabsContent value="preview">{preview ? <PriceCardTable cards={preview.cards.slice(0, 80)} /> : <EmptyState title={t.maintenance.noPreviewTitle} description={t.maintenance.noPreviewDesc} />}</TabsContent>
        <TabsContent value="issues">{preview?.issues.length ? <Table><TableHeader><TableRow><TableHead>{t.maintenance.status}</TableHead><TableHead>{t.maintenance.provider}</TableHead><TableHead>{t.maintenance.sourceRow.replace("{row}", "")}</TableHead><TableHead>{t.maintenance.issueMessage}</TableHead></TableRow></TableHeader><TableBody>{preview.issues.slice(0, 120).map((issue, index) => <TableRow key={`${issue.provider}-${issue.row}-${index}`}><TableCell><Badge tone={issue.level === "blocker" ? "danger" : "warning"}>{issue.level === "blocker" ? t.maintenance.blocked : t.maintenance.warning}</Badge></TableCell><TableCell>{issue.provider}</TableCell><TableCell>{issue.row || "—"}</TableCell><TableCell>{issue.message}</TableCell></TableRow>)}</TableBody></Table> : <EmptyState title={t.maintenance.noIssuesTitle} />}</TabsContent>
      </Tabs>
    </Page>
  );
}

function PriceCardTable({ cards }: { cards: Array<{ id: string; provider: string; destination: string; channel: string; category: string; billingMode: string; status: string; sourceRow?: number }> }) {
  const { t } = useLocale();
  const modeLabel: Record<string, string> = { PER_KG: t.maintenance.perKg, TIERED_PER_KG: t.maintenance.tieredPerKg, FIRST_INCREMENT: t.maintenance.firstIncrement, PER_CBM: t.maintenance.perCbm, REFERENCE_ONLY: t.maintenance.referenceOnly };
  if (!cards.length) return <EmptyState title={t.maintenance.emptyTitle} />;
  return <Table><TableHeader><TableRow><TableHead>{t.maintenance.provider}</TableHead><TableHead>{t.maintenance.destination}</TableHead><TableHead>{t.maintenance.channel}</TableHead><TableHead>{t.maintenance.category}</TableHead><TableHead>{t.maintenance.billingMode}</TableHead><TableHead>{t.maintenance.status}</TableHead><TableHead>{t.maintenance.sourceRow.replace("{row}", "")}</TableHead></TableRow></TableHeader><TableBody>{cards.map((card) => <TableRow key={card.id}><TableCell>{card.provider}</TableCell><TableCell>{card.destination}</TableCell><TableCell>{card.channel}</TableCell><TableCell>{card.category || "—"}</TableCell><TableCell>{modeLabel[card.billingMode] ?? card.billingMode}</TableCell><TableCell><Badge tone={card.status === "blocked" ? "danger" : card.status === "warning" ? "warning" : "success"}>{card.status === "blocked" ? t.maintenance.blocked : card.status === "warning" ? t.maintenance.warning : t.maintenance.ready}</Badge></TableCell><TableCell>{card.sourceRow ?? "—"}</TableCell></TableRow>)}</TableBody></Table>;
}
