/**
 * Spécifications couverture — alignées backend Cloudinary & app mobile.
 * @see backend/src/cloudinary/cloudinary.constants.ts COVER_TRANSFORM
 * @see apps/mobile/components/ui/BookCoverCard.tsx COVER_RATIO
 */

export const COVER_EXPORT_WIDTH = 800;
export const COVER_EXPORT_HEIGHT = 1200;
/** Ratio largeur / hauteur (portrait livre standard) */
export const COVER_ASPECT = COVER_EXPORT_WIDTH / COVER_EXPORT_HEIGHT; // 2:3
/** Ratio affichage cartes mobile (BookCoverCard) */
export const MOBILE_CARD_COVER_RATIO = 0.82;
export const COVER_MAX_BYTES = 5 * 1024 * 1024;
export const COVER_JPEG_QUALITY = 0.88;

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export type ProcessedCover = {
  dataUrl: string;
  width: number;
  height: number;
  bytesApprox: number;
};

export function isAcceptedCoverType(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type) || file.type.startsWith("image/");
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire l'image."));
    };
    img.src = url;
  });
}

/** Recadrage centré au ratio cible puis redimensionnement (max 800×1200). */
function cropAndResize(
  img: HTMLImageElement,
  targetW: number,
  targetH: number
): HTMLCanvasElement {
  const targetRatio = targetW / targetH;
  const srcRatio = img.width / img.height;

  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (srcRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  let outW = targetW;
  let outH = targetH;
  if (img.width < targetW && img.height < targetH) {
    outW = Math.round(sw);
    outH = Math.round(sh);
  } else {
    const scale = Math.min(targetW / sw, targetH / sh);
    outW = Math.round(sw * scale);
    outH = Math.round(sh * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non disponible.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
  return canvas;
}

function dataUrlByteSize(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.round((base64.length * 3) / 4);
}

/**
 * Prépare une couverture pour le catalogue et l'app mobile :
 * recadrage 2:3, compression JPEG, dimensions max 800×1200.
 */
export async function processCoverImage(file: File): Promise<ProcessedCover> {
  if (!isAcceptedCoverType(file)) {
    throw new Error("Format non supporté. Utilisez JPEG, PNG ou WebP.");
  }
  if (file.size > COVER_MAX_BYTES) {
    throw new Error("L'image ne doit pas dépasser 5 Mo.");
  }

  const img = await loadImageFromFile(file);
  const canvas = cropAndResize(img, COVER_EXPORT_WIDTH, COVER_EXPORT_HEIGHT);

  let quality = COVER_JPEG_QUALITY;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);

  const maxStored = 450_000;
  while (dataUrlByteSize(dataUrl) > maxStored && quality > 0.5) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  return {
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    bytesApprox: dataUrlByteSize(dataUrl),
  };
}

export function formatCoverSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
