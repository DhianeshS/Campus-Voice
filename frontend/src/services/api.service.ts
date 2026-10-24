import type { SystemHealthResponse } from '../types';

/**
 * Resolves the API base URL.
 * In production builds, avoids hardcoding localhost by defaulting to relative '/api/v1'
 * if VITE_API_URL is omitted.
 */
const resolveApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return (import.meta.env.VITE_API_URL as string).replace(/\/+$/, '');
  }
  if (import.meta.env.PROD) {
    return '/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

const API_BASE_URL = resolveApiBaseUrl();

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const apiService = {
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  async getHealth(): Promise<SystemHealthResponse> {
    const rootUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
    const res = await fetch(`${rootUrl}/api/health`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new ApiError(`Health check failed with status ${res.status}`, res.status);
    }

    return res.json();
  },
};
