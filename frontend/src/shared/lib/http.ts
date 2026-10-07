const BASE_URL = '/api/v1';

export interface FieldError {
  field: string;
  message: string;
}

interface ProblemDetail {
  title?: string;
  detail?: string;
  errors?: FieldError[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly errors: FieldError[];

  constructor(status: number, title: string, detail: string, errors: FieldError[] = []) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.title = title;
    this.errors = errors;
  }
}

export type QueryParams = Record<string, string | number | undefined>;

export function buildUrl(path: string, query: QueryParams = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.append(key, String(value));
    }
  }
  const search = params.toString();
  return `${BASE_URL}${path}${search ? `?${search}` : ''}`;
}

export function getJson<T>(path: string, query?: QueryParams, signal?: AbortSignal): Promise<T> {
  return request<T>(buildUrl(path, query), { method: 'GET', signal });
}

export function postJson<T>(path: string, body?: unknown): Promise<T> {
  return send<T>('POST', path, body);
}

export function putJson<T>(path: string, body: unknown): Promise<T> {
  return send<T>('PUT', path, body);
}

export function deleteJson<T = void>(path: string): Promise<T> {
  return send<T>('DELETE', path);
}

const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'X-XSRF-TOKEN';

/** Read on every write: the API replaces the token, for instance after a logout. */
export function csrfToken(): string | undefined {
  const cookie = document.cookie.split('; ').find((entry) => entry.startsWith(`${CSRF_COOKIE}=`));
  return cookie && decodeURIComponent(cookie.slice(CSRF_COOKIE.length + 1));
}

function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = csrfToken();
  if (token) {
    headers[CSRF_HEADER] = token;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  return request<T>(buildUrl(path), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw await toApiError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function toApiError(response: Response): Promise<ApiError> {
  const fallback = `Request failed with status ${response.status}`;
  if (!response.headers.get('Content-Type')?.includes('json')) {
    return new ApiError(response.status, response.statusText, fallback);
  }
  let problem: ProblemDetail;
  try {
    problem = (await response.json()) as ProblemDetail;
  } catch {
    return new ApiError(response.status, response.statusText, fallback);
  }
  return new ApiError(
    response.status,
    problem.title ?? response.statusText,
    problem.detail ?? fallback,
    problem.errors ?? [],
  );
}
