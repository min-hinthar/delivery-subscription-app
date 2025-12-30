import { NextResponse } from "next/server";

type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

type ErrorInit = ResponseInit & {
  code?: string;
  details?: unknown;
};

const STATUS_CODES: Record<number, string> = {
  400: "bad_request",
  401: "unauthenticated",
  403: "unauthorized",
  404: "not_found",
  409: "conflict",
  422: "validation_error",
  429: "rate_limited",
  500: "server_error",
  502: "upstream_error",
};

function statusToCode(status: number) {
  return STATUS_CODES[status] ?? "error";
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function bad(message: string, init: ErrorInit = {}) {
  const { code, details, ...rest } = init;
  const status = rest.status ?? 400;
  const error: ApiError = {
    code: code ?? statusToCode(status),
    message,
    ...(details === undefined ? {} : { details }),
  };
  return NextResponse.json({ ok: false, error }, { ...rest, status });
}
