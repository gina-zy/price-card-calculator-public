import type { PriceCardDocument, PriceCardVersion } from "./types";

// Public build notes:
// - The default API host is an internal FaaS endpoint that may be unreachable from external networks.
// - Keep the app functional by failing fast and falling back to built-in seed data.
const API_ORIGIN = (import.meta as any).env?.VITE_API_ORIGIN ?? "https://at2pkrw5.cn-east-fn.bytedance.net";
const DEFAULT_TIMEOUT_MS = Number((import.meta as any).env?.VITE_API_TIMEOUT_MS ?? 3000);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_ORIGIN}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { Accept: "application/json", ...init?.headers },
    });

    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const message = json && typeof json === "object"
        ? ("error" in json ? String((json as any).error)
          : "detail" in json ? String((json as any).detail)
          : `HTTP ${response.status}`)
        : `HTTP ${response.status}`;
      throw new Error(message);
    }
    return (json && typeof json === "object" && "data" in json ? (json as any).data : json) as T;
  } catch (error) {
    // Normalize AbortError so the caller can treat it as a normal fetch failure.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
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
