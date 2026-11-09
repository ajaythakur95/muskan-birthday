export type SlotKind = "original" | "anime";

/** One of the 10 fixed slots. The slot number pairs the original photo with its anime illustration. */
export interface Slot {
  n: number;
  caption: string;
  original: { url: string } | null;
  anime: { url: string } | null;
}

/** A slot that has BOTH images: the only thing the gallery and slideshow ever show. */
export interface Photo {
  id: string;
  n: number;
  title: string;
  caption: string;
  original: { url: string };
  anime: { url: string };
}

export interface ServerHealth {
  ok: boolean;
  adminProtected: boolean;
  isAdmin: boolean;
  canUpload: boolean;
  maxUploadMb: number;
}
