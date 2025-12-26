import { NextResponse } from "next/server";

type ApiError = {
  message: string;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function bad(message: string, init?: ResponseInit) {
  const error: ApiError = { message };
  const status = init?.status ?? 400;
  return NextResponse.json({ ok: false, error }, { ...init, status });
}
