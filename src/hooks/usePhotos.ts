import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError, getAdminKey, setAdminKey } from "../services/api";
import { uniqueCaptions } from "../utils/captions";
import type { Photo, ServerHealth, Slot, SlotKind } from "../types/photo";

/**
 * Reads the 10 slots from public/photos/manifest.json. Only slots that have BOTH an original and an
 * anime image become `photos`, so the gallery and slideshow can never show a mismatched or half pair.
 */
export function usePhotos() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([api.slots(), api.health()]);
      setSlots(s);
      setHealth(h);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const photos = useMemo<Photo[]>(() => {
    const pairs = slots.filter((s): s is Slot & { original: { url: string }; anime: { url: string } } => Boolean(s.original && s.anime));
    const captions = uniqueCaptions(pairs.map((s) => s.caption)); // blank or repeated messages get a fresh one
    return pairs.map((s, i) => ({ id: `slot-${String(s.n).padStart(2, "0")}`, n: s.n, title: "", caption: captions[i], original: s.original, anime: s.anime }));
  }, [slots]);

  const canManage = Boolean(health?.canUpload && (!health.adminProtected || health.isAdmin));

  const uploadSlot = useCallback(async (n: number, kind: SlotKind, file: File) => setSlots(await api.upload(n, kind, file)), []);
  const clearSlot = useCallback(async (n: number, kind: SlotKind) => setSlots(await api.clear(n, kind)), []);
  const saveCaption = useCallback(async (n: number, caption: string) => setSlots(await api.caption(n, caption)), []);

  const unlock = useCallback(
    async (key: string) => {
      setAdminKey(key.trim());
      const h = await api.health();
      if (!h || (h.adminProtected && !h.isAdmin)) {
        setAdminKey("");
        throw new ApiError("That key isn't right.", 401);
      }
      setHealth(h);
    },
    [],
  );

  return { slots, photos, health, loading, loadError, canManage, hasKey: Boolean(getAdminKey()), refresh, uploadSlot, clearSlot, saveCaption, unlock };
}
