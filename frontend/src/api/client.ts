const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://trueclaim-backend.onrender.com/api";

const ACCESS_KEY = "pf_access_token";
const REFRESH_KEY = "pf_refresh_token";
const ANON_ID_KEY = "pf_anonymous_id";

/**
 * A random token generated once per browser and stored in localStorage.
 * It identifies a BROWSER, never a person — it's used purely so the
 * backend can stop the same browser from voting/reporting/reviewing the
 * same thing twice without requiring an account. It's never displayed
 * anywhere and carries no personal information.
 */
export function getAnonymousId(): string {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}
export function setTokens(access: string, refresh?: string) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}
export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any) {
    super(typeof body === "string" ? body : JSON.stringify(body));
    this.status = status;
    this.body = body;
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    clearTokens();
    return false;
  }
  const data = await res.json();
  setTokens(data.access);
  return true;
}

interface RequestOptions {
  method?: string;
  body?: any;
  isForm?: boolean;
  auth?: boolean; // attach access token if present
}

/**
 * Thin fetch wrapper: JSON in/out by default, auto-attaches the JWT
 * access token, and transparently retries once on 401 after refreshing.
 */
export async function apiRequest<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, isForm = false, auth = true } = opts;

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (!isForm) headers["Content-Type"] = "application/json";
    headers["X-Anonymous-Id"] = getAnonymousId();
    if (auth) {
      const token = getAccessToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  };

  let res = await doFetch();

  if (res.status === 401 && auth && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) res = await doFetch();
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data as T;
}

export { API_BASE };
