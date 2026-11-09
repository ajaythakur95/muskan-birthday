import type { ServerHealth, Slot } from "../types/photo";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/**
 * Backend address, used ONLY for the optional upload manager. Empty = same origin (local dev proxy).
 * Viewing photos never needs the backend: it reads the static files in public/photos.
 */
const API_BASE = String(import.meta.env.VITE_API_URL ?? "").trim().replace(/\/+$/, "");
const withBase = (path: string) => `${API_BASE}${path}`;

let adminKey = "";
try {
  adminKey = sessionStorage.getItem("muskan-admin-key") ?? "";
} catch {
  /* storage may be blocked; the key then lives only in memory */
}
export const getAdminKey = () => adminKey;
export function setAdminKey(key: string) {
  adminKey = key;
  try {
    if (key) sessionStorage.setItem("muskan-admin-key", key);
    else sessionStorage.removeItem("muskan-admin-key");
  } catch {
    /* ignore */
  }
}

interface RawManifest {
  slots?: { n: number; caption?: string; original?: { file: string; v: number } | null; anime?: { file: string; v: number } | null }[];
}

function toSlots(m: RawManifest): Slot[] {
  const url = (kind: string, f?: { file: string; v: number } | null) => (f ? { url: `/photos/${kind}/${f.file}?v=${f.v}` } : null);
  const byN = new Map((m.slots ?? []).map((s) => [s.n, s]));
  return Array.from({ length: 10 }, (_, i) => {
    const s = byN.get(i + 1);
    return { n: i + 1, caption: s?.caption ?? "", original: url("original", s?.original), anime: url("anime", s?.anime) };
  });
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (adminKey) headers.set("x-admin-key", adminKey);
  let res: Response;
  try {
    res = await fetch(withBase(path), { ...init, headers, signal: AbortSignal.timeout(60_000) });
  } catch {
    throw new ApiError("Can't reach the upload server. Start the site with `npm run dev` to manage photos.", 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(body?.error ?? `Request failed (${res.status}).`, res.status);
  return body as T;
}

export const api = {
  /** Reads the static manifest next to the photos (works with no backend, e.g. on Vercel). */
  async slots(): Promise<Slot[]> {
    let res: Response;
    try {
      res = await fetch("/photos/manifest.json", { cache: "no-store" });
    } catch {
      throw new ApiError("Couldn't load the photo list.", 0);
    }
    if (!res.ok) throw new ApiError("Couldn't load the photo list.", res.status);
    return toSlots((await res.json().catch(() => ({}))) as RawManifest);
  },

  /** Optional: only needed to show the upload manager. A missing backend is not an error for viewing. */
  health: () => request<ServerHealth>("/api/health").catch(() => null),

  upload(n: number, kind: "original" | "anime", file: File) {
    const form = new FormData();
    form.set("photo", file);
    return request<RawManifest>(`/api/slots/${n}/${kind}`, { method: "PUT", body: form }).then(toSlots);
  },
  clear: (n: number, kind: "original" | "anime") => request<RawManifest>(`/api/slots/${n}/${kind}`, { method: "DELETE" }).then(toSlots),
  caption: (n: number, caption: string) =>
    request<RawManifest>(`/api/slots/${n}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caption }) }).then(toSlots),
};
