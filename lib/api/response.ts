import { NextResponse } from 'next/server';

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

export const jsonResponse = <T>(
  status: number,
  data: T | null,
  error: string | null,
): NextResponse<ApiResponse<T>> => NextResponse.json({ data, error, status }, { status });
