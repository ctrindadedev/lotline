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

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw await toApiError(response);
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
