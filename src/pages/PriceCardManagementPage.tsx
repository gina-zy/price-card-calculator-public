import { FileSpreadsheet, KeyRound, Upload } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { priceCardApi } from "../api";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Alert, EmptyState } from "../components/ui/Feedback";
import { Field } from "../components/ui/Field";
import { Input } from "../components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs";
import { toast } from "../components/ui/Toaster";
import { Page, PageHeader } from "../components/layout/Page";
import { useLocale } from "../locale-context";
import { parsePriceCardFiles, type ParsedPriceCards } from "../lib/price-card-xlsx";
import { usePriceCards } from "../price-card-context";
import type { ServicePriceCard } from "../types";

export default function PriceCardManagementPage() {
  const { t, locale } = useLocale();
  const { serviceCards, officialCards, version, refresh } = usePriceCards();
  const [adminPassword, setAdminPassword] = useState("");
  const [adminVerified, setAdminVerified] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [checking, setChecking] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<ParsedPriceCards | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const formatter = useMemo(() => new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { dateStyle: "medium", timeStyle: "short" }), [locale]);

  const verifyAdmin = async (event: FormEvent) => {
    event.preventDefault();
    setChecking(true); setAdminError("");
    try {
      await priceCardApi.checkAdmin(adminPassword);
      setAdminVerified(true);
      toast.success(t.maintenance.adminSuccess);
    } catch (cause) {
      setAdminError(cause instanceof Error ? cause.message : t.maintenance.adminFailed);
    } finally { setChecking(false); }
  };

  const chooseFiles = (selected: FileList | null) => {
    const next = Array.from(selected ?? []);
    if (next.length < 1 || next.length > 10 || next.some((file) => !file.name.toLowerCase().endsWith(".xlsx"))) {
      setError(t.maintenance.fileRule); return;
    }
    setFiles(next); setPreview(null); setError("");
  };

  const validate = async () => {
    setBusy(true); setError("");
    try {
      setPreview(await parsePriceCardFiles(files));
      toast.success(t.maintenance.previewReady);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.maintenance.validationFailed);
    } finally { setBusy(false); }
  };

  const publish = async () => {
    if (!preview) return;
    setBusy(true); setError("");
    try {
      const now = new Date();
      await priceCardApi.publish({
        schemaVersion: 2,
        version: now.toISOString().replace(/[-:.]/g, ""),
        updatedAt: now.toISOString(),
        source: preview.files.map((file) => file.filename).join("、"),
        serviceCards: preview.cards,
        officialCards,
        summary: preview.summary,
      }, adminPassword);
      await refresh();
      setFiles([]); setPreview(null);
      toast.success(t.maintenance.publishSuccess);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.maintenance.publishFailed);
    } finally { setBusy(false); }
  };

  if (!adminVerified) {
    return <Page><PageHeader title={t.maintenance.title} description={t.maintenance.adminDescription} /><Card className="max-w-lg"><CardHeader title={t.maintenance.adminTitle} description={t.maintenance.adminHint} /><CardBody><form className="space-y-3" onSubmit={verifyAdmin}><Field htmlFor="admin-password" label={t.maintenance.adminPassword}><Input id="admin-password" autoComplete="current-password" icon={<KeyRound size={14} />} type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} /></Field>{adminError ? <Alert tone="danger">{adminError}</Alert> : null}<Button disabled={!adminPassword} loading={checking} type="submit" variant="primary">{t.maintenance.adminLogin}</Button></form></CardBody></Card></Page>;
  }

  const providerSummary = Object.entries(version.summary.providers).map(([provider, count]) => `${provider} ${count}`).join(" / ");
  return <Page>
    <PageHeader title={t.maintenance.title} description={t.maintenance.description} />
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card><CardHeader title={t.maintenance.uploadTitle} description={t.maintenance.uploadDescription} /><CardBody className="space-y-4">
        <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-4 text-center hover:bg-canvas"><FileSpreadsheet aria-hidden="true" className="text-fg-subtle" size={28} /><span className="text-sm font-medium">{t.maintenance.dropFiles}</span><span className="text-xs text-fg-subtle">{t.maintenance.fileRule}</span><input className="sr-only" multiple accept=".xlsx" type="file" onChange={(event) => chooseFiles(event.target.files)} /></label>
        {files.length ? <div className="rounded-lg border bg-canvas p-3 text-sm"><strong>{t.maintenance.selectedFiles}</strong><ul className="mt-2 list-disc pl-5 text-fg-muted">{files.map((file) => <li key={`${file.name}-${file.size}`}>{file.name}</li>)}</ul></div> : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div className="flex flex-wrap gap-2"><Button disabled={!files.length || busy} loading={busy && !preview} variant="primary" onClick={() => void validate()}><Upload size={16} />{t.maintenance.validate}</Button><Button disabled={!preview || busy} loading={busy && Boolean(preview)} onClick={() => void publish()}>{t.maintenance.confirmPublish}</Button></div>
      </CardBody></Card>
      <Card><CardHeader title={t.maintenance.version} description={version.source} /><CardBody className="space-y-3 text-sm"><p><span className="text-fg-subtle">{t.maintenance.updatedAt}：</span>{formatter.format(new Date(version.updatedAt))}</p><p><span className="text-fg-subtle">{t.maintenance.providers}：</span>{providerSummary || "—"}</p><div className="grid grid-cols-2 gap-2"><Badge>{t.maintenance.rows} {version.summary.rows}</Badge><Badge tone="success">{t.maintenance.computable} {version.summary.computable}</Badge><Badge tone="danger">{t.maintenance.blockers} {version.summary.blockers}</Badge><Badge tone="warning">{t.maintenance.warnings} {version.summary.warnings}</Badge></div></CardBody></Card>
    </div>
    <Tabs className="mt-6" defaultValue="current"><TabsList><TabsTrigger value="current">{t.maintenance.serviceTab}</TabsTrigger><TabsTrigger value="preview">{t.maintenance.previewTab}</TabsTrigger></TabsList><TabsContent value="current"><PriceCardTable cards={serviceCards.slice(0, 80)} /></TabsContent><TabsContent value="preview">{preview ? <PriceCardTable cards={[]} preview={preview} /> : <EmptyState title={t.maintenance.noPreviewTitle} description={t.maintenance.noPreviewDesc} />}</TabsContent></Tabs>
  </Page>;
}

function PriceCardTable({ cards, preview }: { cards: ServicePriceCard[]; preview?: ParsedPriceCards }) {
  const { t } = useLocale();
  if (preview) return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Card><CardBody>{t.maintenance.rows}<strong className="ml-2">{preview.summary.rows}</strong></CardBody></Card><Card><CardBody>{t.maintenance.computable}<strong className="ml-2">{preview.summary.computable}</strong></CardBody></Card><Card><CardBody>{t.maintenance.blockers}<strong className="ml-2">{preview.summary.blockers}</strong></CardBody></Card><Card><CardBody>{t.maintenance.warnings}<strong className="ml-2">{preview.summary.warnings}</strong></CardBody></Card></div>;
  if (!cards.length) return <EmptyState title={t.maintenance.emptyTitle} />;
  return <Table><TableHeader><TableRow><TableHead>{t.maintenance.provider}</TableHead><TableHead>{t.maintenance.destination}</TableHead><TableHead>{t.maintenance.channel}</TableHead><TableHead>{t.maintenance.category}</TableHead><TableHead>{t.maintenance.status}</TableHead></TableRow></TableHeader><TableBody>{cards.map((card) => <TableRow key={card.id}><TableCell>{card.provider}</TableCell><TableCell>{card.destination}</TableCell><TableCell>{card.channel}</TableCell><TableCell>{card.category || "—"}</TableCell><TableCell><Badge tone={card.status === "blocked" ? "danger" : card.status === "warning" ? "warning" : "success"}>{card.status === "blocked" ? t.maintenance.blocked : card.status === "warning" ? t.maintenance.warning : t.maintenance.ready}</Badge></TableCell></TableRow>)}</TableBody></Table>;
}
