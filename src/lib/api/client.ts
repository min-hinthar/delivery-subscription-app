export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      message: string;
      status: number;
    };

type ApiPayload<T> =
  | { ok: true; data: T }
  | { ok: false; error?: { message?: string } };

export async function parseApiResponse<T>(response: Response): Promise<ApiResult<T>> {
  let payload: ApiPayload<T> | null = null;

  try {
    payload = (await response.json()) as ApiPayload<T>;
  } catch {
    payload = null;
  }

  if (response.ok && payload?.ok) {
    return { ok: true, data: payload.data };
  }

  return {
    ok: false,
    status: response.status,
    message: resolveErrorMessage(response.status, payload?.ok ? null : payload?.error?.message),
  };
}

function resolveErrorMessage(status: number, fallback?: string | null) {
  if (status === 401) {
    return "Please sign in to continue.";
  }
  if (status === 403) {
    return "You don’t have access to do that. Contact support if you think this is a mistake.";
  }
  if (status === 422) {
    return fallback ?? "Check the highlighted fields and try again.";
  }
  if (status === 429) {
    return "That’s too many requests in a row. Please wait a moment and try again.";
  }
  return fallback ?? "Something went wrong. Please try again.";
}
