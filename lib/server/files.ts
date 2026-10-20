import "server-only";

/** Vercel serverless functions reject request bodies above ~4.5 MB, so stay under it. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

/** Don't trust the browser's Content-Type: check the file's real first bytes. */
export function matchesMagicBytes(type: string, b: Uint8Array): boolean {
  const starts = (...sig: number[]) => sig.every((v, i) => b[i] === v);
  switch (type) {
    case "application/pdf": return starts(0x25, 0x50, 0x44, 0x46); // %PDF
    case "image/jpeg": return starts(0xff, 0xd8, 0xff);
    case "image/png": return starts(0x89, 0x50, 0x4e, 0x47);
    case "image/webp": // RIFF....WEBP
      return starts(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
    default: return false;
  }
}

export const safeFileName = (name: string) => name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "file";
