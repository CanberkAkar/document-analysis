/**
 * API Client — Centralized fetch wrapper.
 *
 * Handles:
 *  - Base URL configuration
 *  - JWT token injection
 *  - JSON parsing / error handling
 *  - Content-type management (JSON vs multipart)
 */

import type { ApiError } from '@/types';
import { encryptPayload, decryptPayload } from '@/lib/crypto';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ─── Token helpers ───────────────────────────────────────────
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('access_token');
}

export function setToken(token: string): void {
  sessionStorage.setItem('access_token', token);
}

export function removeToken(): void {
  sessionStorage.removeItem('access_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ─── Core request function ───────────────────────────────────
interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  isFormData?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, isFormData = false, headers: customHeaders, ...restOptions } = options;

  const headers: Record<string, string> = {};

  // Attach JWT token
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set content-type (skip for FormData — browser sets boundary automatically)
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  let requestBody: string | FormData | undefined = undefined;
  if (body) {
    if (isFormData) {
      requestBody = body as FormData;
    } else {
      const bodyStr = JSON.stringify(body);
      const encrypted = await encryptPayload(bodyStr);
      requestBody = JSON.stringify(encrypted);
    }
  }

  const config: RequestInit = {
    ...restOptions,
    headers: {
      ...headers,
      ...(customHeaders as Record<string, string>),
    },
    body: requestBody,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorData: ApiError;
    try {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        if (json && typeof json === 'object' && 'iv' in json && 'data' in json) {
          const decryptedStr = await decryptPayload(json as { iv: string; data: string });
          errorData = JSON.parse(decryptedStr);
        } else {
          errorData = json;
        }
      } catch {
        errorData = {
          statusCode: response.status,
          message: text || 'Sunucu hatası',
        };
      }
    } catch {
      errorData = {
        statusCode: response.status,
        message: response.statusText || 'Sunucu hatası',
      };
    }

    // Auto-logout on 401 (only if we're not currently attempting to login)
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    throw errorData;
  }

  // Handle empty responses (e.g., 204 No Content)
  const text = await response.text();
  if (text) {
    try {
      const json = JSON.parse(text);
      if (json && typeof json === 'object' && 'iv' in json && 'data' in json) {
        const decryptedStr = await decryptPayload(json as { iv: string; data: string });
        return JSON.parse(decryptedStr);
      }
      return json as T;
    } catch {
      return text as unknown as T;
    }
  }
  return ({} as T);
}

// ─── HTTP method shortcuts ───────────────────────────────────
export const api = {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'POST', body });
  },

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'PUT', body });
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  /**
   * Upload a file via multipart/form-data.
   */
  upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  },
};
