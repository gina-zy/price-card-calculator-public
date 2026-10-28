import type { PriceCardDocument, PriceCardVersion } from "./types";

const API_ORIGIN = "https://at2pkrw5.cn-east-fn.bytedance.net";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_ORIGIN}${path}`, { ...init, headers: { Accept: "application/json", ...init?.headers } });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const message = json && typeof json === "object" ? ("error" in json ? String(json.error) : "detail" in json ? String(json.detail) : `HTTP ${response.status}`) : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return (json && typeof json === "object" && "data" in json ? json.data : json) as T;
}

export const priceCardApi = {
  current: () => request<PriceCardDocument>("/api/price-cards"),
  checkAdmin: (adminPassword: string) => {
    const body = new FormData();
    body.append("admin_password", adminPassword);
    return request<{ ok: boolean }>("/api/admin/check", { method: "POST", body });
  },
  publish: (document: PriceCardDocument, adminPassword: string) => request<PriceCardVersion>("/api/price-cards/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admin_password: adminPassword, document }),
  }),
};
