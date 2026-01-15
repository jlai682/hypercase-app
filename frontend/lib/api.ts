import config from '@/config';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function apiFetch<T>(endpoint: string, token: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${config.BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiError(error.detail || 'Request failed', response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}
