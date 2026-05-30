export const BOOK_FILE_MAX_BYTES = 50 * 1024 * 1024;

export const BOOK_FILE_ACCEPT =
  ".pdf,.epub,.mobi,application/pdf,application/epub+zip,application/vnd.epub+zip,application/x-mobipocket-ebook";

const ALLOWED_EXTENSIONS = [".pdf", ".epub", ".mobi"] as const;

export function isAcceptedBookFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))) return true;
  return (
    file.type === "application/pdf" ||
    file.type === "application/epub+zip" ||
    file.type === "application/vnd.epub+zip" ||
    file.type === "application/x-mobipocket-ebook"
  );
}

export function formatBookFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function bookFileKind(file: File): "pdf" | "epub" | "mobi" | "other" {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (name.endsWith(".epub")) return "epub";
  if (name.endsWith(".mobi")) return "mobi";
  return "other";
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(",");
  const mime = header?.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}
