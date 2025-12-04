const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Request failed' };
    }

    return { data };
  } catch (err) {
    return { error: 'Network error' };
  }
}

// Auth
export const auth = {
  signup: (email: string, password: string, name?: string) =>
    request<{ user: any; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
    
  login: (email: string, password: string) =>
    request<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
    
  me: () => request<any>('/api/auth/me'),
};

// Users
export const users = {
  profile: () => request<any>('/api/users/profile'),
  dashboard: () => request<any>('/api/users/dashboard'),
  updateProfile: (data: any) =>
    request<any>('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Agents
export const agents = {
  list: () => request<any[]>('/api/agents'),
  get: (id: string) => request<any>(`/api/agents/${id}`),
  update: (id: string, data: any) =>
    request<any>(`/api/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<any>(`/api/agents/${id}`, { method: 'DELETE' }),
  command: (id: string, command: string, params?: any) =>
    request<any>(`/api/agents/${id}/command`, {
      method: 'POST',
      body: JSON.stringify({ command, params }),
    }),
  getRegistrationToken: () =>
    request<{ token: string }>('/api/agents/registration-token', {
      method: 'POST',
    }),
};

// Tasks
export const tasks = {
  list: (params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ tasks: any[]; total: number }>(`/api/tasks${query}`);
  },
  create: (data: any) =>
    request<any>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createBulk: (data: any) =>
    request<{ created: number }>('/api/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (id: string) => request<any>(`/api/tasks/${id}`),
  cancel: (id: string) =>
    request<any>(`/api/tasks/${id}/cancel`, { method: 'POST' }),
};

// Signups
export const signups = {
  list: (params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ signups: any[]; total: number }>(`/api/signups${query}`);
  },
  stats: (days?: number) =>
    request<any>(`/api/signups/stats?days=${days || 30}`),
  get: (id: string) => request<any>(`/api/signups/${id}`),
};

// Credentials
export const credentials = {
  list: () => request<any[]>('/api/credentials'),
  create: (data: any) =>
    request<any>('/api/credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<any>(`/api/credentials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<any>(`/api/credentials/${id}`, { method: 'DELETE' }),
  setDefault: (id: string) =>
    request<any>(`/api/credentials/${id}/default`, { method: 'POST' }),
};

