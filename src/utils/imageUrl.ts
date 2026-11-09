/**
 * Cloudinary can resize and re-encode on the fly. Inserting a transformation into the
 * delivery URL gives small, modern-format (WebP/AVIF) images instead of the full upload.
 * Local-disk URLs are returned unchanged.
 */
const MARK = "/image/upload/";

export function sized(url: string, width: number): string {
  if (!url.includes("res.cloudinary.com") || !url.includes(MARK)) return url;
  return url.replace(MARK, `${MARK}f_auto,q_auto,c_limit,w_${width}/`);
}

export const cardImage = (url: string) => sized(url, 720);
export const viewerImage = (url: string) => sized(url, 1600);
