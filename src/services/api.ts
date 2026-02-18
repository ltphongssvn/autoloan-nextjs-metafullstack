// autoloan-nextjs-metafullstack/src/services/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

let authToken: string | null = null;

// Only access localStorage in browser
if (typeof window !== 'undefined') {
  authToken = localStorage.getItem('authToken');
}

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }
};

export const getAuthToken = () => authToken;

export const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; headers: Headers }> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Extract JWT token from response headers (login/signup)
  const newToken = response.headers.get('Authorization');
  if (newToken) {
    setAuthToken(newToken.replace('Bearer ', ''));
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMessage =
      data.error || data.status?.message || 'API request failed';
    throw new Error(errorMessage);
  }

  return { data, headers: response.headers };
};
