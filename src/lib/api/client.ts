const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";
const API_TOKEN = process.env.NEXT_PUBLIC_ADMIN_BEARER_TOKEN ?? "";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export function isApiConfigured(): boolean {
  return Boolean(API_BASE_URL);
}

async function parseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!isApiConfigured()) {
    throw new Error("API non configurée (NEXT_PUBLIC_API_BASE_URL).");
  }

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (API_TOKEN && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${API_TOKEN}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const payload = await parseBody(response);
  if (!response.ok) {
    throw new ApiError(
      typeof payload === "string" ? payload : "Erreur API.",
      response.status,
      payload
    );
  }

  return payload as T;
}

