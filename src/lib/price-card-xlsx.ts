import * as XLSX from "xlsx";
import type { ImportSummary, PreviewIssue, ServicePriceCard } from "../types";

const TITLE_FINGERPRINT = "统一价卡模板";
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const EXPECTED_PROVIDERS = new Set(["comone", "急速", "棋洋", "喜运达", "一代"]);
const MODES: Record<string, ServicePriceCard["billingMode"]> = {
  "每KG+操作费": "PER_KG",
  "重量分段每KG+操作费": "TIERED_PER_KG",
  "首重+续重": "FIRST_INCREMENT",
};

export interface ParsedPriceCards {
  cards: ServicePriceCard[];
  issues: PreviewIssue[];
  files: Array<{ filename: string; providers: string[]; rows: number }>;
  summary: ImportSummary;
}

function text(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function number(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  const direct = Number(value);
  if (Number.isFinite(direct)) return direct;
  const match = String(value).match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function bool(value: unknown): boolean | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;
  return new Set(["true", "1", "是", "含", "包含", "y", "yes", "√"]).has(text(value).toLowerCase());
}

function tags(value: unknown) {
  return String(value ?? "").split(/[/／\n、,，;；]+/).map((item) => item.trim()).filter(Boolean);
}

function destination(raw: string): [string, string] {
  if (raw === "西马" || raw === "东马") return ["马来西亚", raw];
  if (raw === "曼谷") return ["泰国", "曼谷"];
  if (["马尼拉大都会", "吕宋", "米沙鄢", "棉兰老", "其余外岛", "菲律宾远区"].includes(raw)) return ["菲律宾", raw];
  return [raw, ""];
}

function rounding(source: string, unit: "g" | "kg") {
  for (const pattern of [new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unit}\\s*进位`, "i"), new RegExp(`续量\\s*(\\d+(?:\\.\\d+)?)\\s*${unit}`, "i")]) {
    const match = source.match(pattern);
    if (match) return unit === "g" ? Number(match[1]) / 1000 : Number(match[1]);
  }
  return null;
}

function hash(input: string) {
  let value = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return (value >>> 0).toString(16).padStart(8, "0");
}

function cell(rows: unknown[][], row: number, col: number) {
  return rows[row - 1]?.[col - 1];
}

async function parseWorkbook(file: File) {
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name}: 文件超过 8 MiB`);
  const data = await file.arrayBuffer();
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: "array", cellDates: false });
  } catch (error) {
    throw new Error(`${file.name}: 无法读取 xlsx 文件`);
  }
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null });
  if (!text(cell(rows, 1, 1)).includes(TITLE_FINGERPRINT)) throw new Error(`${file.name}: 首个工作表 A1 缺少“统一价卡模板”标题指纹`);
  if (text(cell(rows, 3, 1)) !== "服务商" || text(cell(rows, 3, 7)) !== "计费模式") throw new Error(`${file.name}: 第 3-4 行表头不符合统一模板`);

  const cards: ServicePriceCard[] = [];
  const issues: PreviewIssue[] = [];
  for (let row = 5; row <= rows.length; row += 1) {
    const values = Array.from({ length: 28 }, (_, index) => cell(rows, row, index + 1));
    if (!text(values[0])) continue;
    const provider = text(values[0]);
    const destinationRaw = text(values[1]);
    const [country, region] = destination(destinationRaw);
    const restrictions = text(values[27]);
    const sourceMode = text(values[6]);
    const cbmMatch = restrictions.match(/纯\s*CBM计费[：:]\s*(\d+(?:\.\d+)?)元\/CBM/i);
    const minimumMatch = restrictions.match(/最低\s*(\d+(?:\.\d+)?)\s*CBM/i);
    const stepMatch = restrictions.match(/续量\s*(\d+(?:\.\d+)?)\s*CBM/i);
    const billingMode = cbmMatch ? "PER_CBM" : MODES[sourceMode];
    const blockers: string[] = [];
    const warnings: string[] = [];
    if (provider.toLowerCase() === "comone" && destinationRaw === "西马" && text(values[2]).includes("海运小包") && restrictions.includes("待服务商确认")) blockers.push("西马海运小包续重费来源冲突，须服务商确认");
    if (provider === "急速" && row === 93 && sourceMode === "重量分段每KG+操作费" && number(values[15]) === null && number(values[12]) !== null) blockers.push("主表第93行计费模式与首重/续重价格字段冲突");
    const handling = number(values[16]);
    if ((billingMode === "PER_KG" || billingMode === "TIERED_PER_KG") && handling === null) blockers.push("操作费为空；仅明确为 0 时才可计算");
    if (!["PER_KG", "TIERED_PER_KG", "FIRST_INCREMENT", "PER_CBM"].includes(billingMode ?? "")) blockers.push("未识别自动计费模式，明细仅供参考");
    if (billingMode === "PER_CBM" && !cbmMatch) blockers.push("CBM 单价缺失");
    if (!blockers.length && (billingMode === "PER_KG" || billingMode === "TIERED_PER_KG") && number(values[15]) === null) blockers.push("KG 单价缺失");
    if (!blockers.length && billingMode === "FIRST_INCREMENT" && [11, 12, 13, 14].some((index) => number(values[index]) === null)) blockers.push("首重或续重必要字段缺失");
    const addonValues = values.slice(20, 27).map(text);
    if (addonValues.some((item) => item && !["无", "/", "0", "False"].includes(item))) warnings.push("增值服务费用仅供参考，未自动计入");
    blockers.forEach((message) => issues.push({ level: "blocker", provider, row, message }));
    warnings.forEach((message) => issues.push({ level: "warning", provider, row, message }));
    cards.push({
      id: `${provider}-${row}-${hash(file.name)}`,
      provider,
      country,
      region,
      destination: destinationRaw,
      channel: text(values[2]),
      transportMode: text(values[3]),
      category: text(values[4]),
      categoryTags: tags(values[4]),
      chargeableWeightRule: text(values[5]),
      billingMode: billingMode ?? "REFERENCE_ONLY",
      billingModeSource: sourceMode,
      minWeightKg: number(values[7]),
      maxWeightKg: number(values[8]),
      minInclusive: bool(values[9]),
      maxInclusive: bool(values[10]),
      firstWeightKg: number(values[11]),
      firstWeightFee: number(values[12]),
      incrementWeightKg: number(values[13]),
      incrementFee: number(values[14]),
      ratePerKg: number(values[15]),
      handlingFee: handling,
      ratePerCbm: cbmMatch ? Number(cbmMatch[1]) : null,
      minimumCbm: minimumMatch ? Number(minimumMatch[1]) : null,
      cbmIncrement: stepMatch ? Number(stepMatch[1]) : null,
      kgIncrement: rounding(restrictions, "g") ?? rounding(restrictions, "kg"),
      volumetricDivisor: number(values[17]),
      shipmentLimitKg: number(values[18]),
      transitTime: text(values[19]),
      valueAddedServicesRaw: addonValues.filter(Boolean).join(" | "),
      nonKgDetails: { pod: addonValues[0], insurance: addonValues[1], storage: addonValues[2], redelivery: addonValues[3], returnShelving: addonValues[4], destruction: addonValues[5], forwarding: addonValues[6] },
      restrictions,
      sourceFile: file.name,
      sourceRow: row,
      status: blockers.length ? "blocked" : warnings.length ? "warning" : "ok",
      blockers,
      warnings,
    });
  }
  if (!cards.length) throw new Error(`${file.name}: 第 5 行起没有正式数据`);
  const providers = [...new Set(cards.map((card) => card.provider))].sort();
  const unknown = providers.filter((provider) => !EXPECTED_PROVIDERS.has(provider));
  if (unknown.length) issues.push({ level: "warning", provider: unknown.join(","), row: 0, message: "服务商名称不在标准清单" });
  return { filename: file.name, providers, cards, issues };
}

export async function parsePriceCardFiles(files: File[]): Promise<ParsedPriceCards> {
  if (files.length < 1 || files.length > 5) throw new Error("一次请选择 1-5 个 .xlsx 文件");
  if (files.some((file) => !file.name.toLowerCase().endsWith(".xlsx"))) throw new Error("仅支持 .xlsx 文件");
  const results = await Promise.all(files.map(parseWorkbook));
  const cards = results.flatMap((result) => result.cards);
  const providers: Record<string, number> = {};
  cards.forEach((card) => { providers[card.provider] = (providers[card.provider] ?? 0) + 1; });
  const summary = {
    providers,
    rows: cards.length,
    computable: cards.filter((card) => card.status !== "blocked").length,
    blockers: cards.filter((card) => card.status === "blocked").length,
    warnings: cards.reduce((total, card) => total + card.warnings.length, 0),
  };
  return { cards, issues: results.flatMap((result) => result.issues), files: results.map((result) => ({ filename: result.filename, providers: result.providers, rows: result.cards.length })), summary };
}
