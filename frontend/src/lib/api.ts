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
  signup: (data: { email: string; password: string; name?: string }) =>
    request<{ user: any; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  login: (data: { email: string; password: string }) =>
    request<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  me: () => request<any>('/api/auth/me'),
};

// Alias for auth
export const authApi = auth;

// Users
export const users = {
  profile: () => request<any>('/api/users/profile'),
  dashboard: () => request<any>('/api/users/dashboard'),
  updateProfile: (data: { name?: string; email?: string }) =>
    request<any>('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<any>('/api/users/password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Alias for users
export const usersApi = users;

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
  getLogs: (id: string, limit?: number) =>
    request<any[]>(`/api/agents/${id}/logs${limit ? `?limit=${limit}` : ''}`),
  getConnected: () =>
    request<{ connectedAgents: string[] }>('/api/agents/connected'),
  stopTask: (agentId: string, taskId: string) =>
    request<{ success: boolean }>(`/api/agents/${agentId}/command/stop`, {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    }),
  cancelTask: (agentId: string, taskId: string) =>
    request<{ success: boolean }>(`/api/agents/${agentId}/command/cancel`, {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    }),
};

// Alias for agents
export const agentsApi = agents;

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

// Alias for credentials
export const credentialsApi = credentials;

// Scraped Links
export const scrapedLinks = {
  list: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return request<any[]>(`/api/scraped-links${query}`);
  },
  stats: () => request<any>('/api/scraped-links/stats'),
  pending: () => request<any[]>('/api/scraped-links/pending'),
  create: (data: any) =>
    request<any>('/api/scraped-links', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  bulkCreate: (links: any[]) =>
    request<{ created: number; duplicates: number }>('/api/scraped-links/bulk', {
      method: 'POST',
      body: JSON.stringify({ links }),
    }),
  delete: (id: string) =>
    request<any>(`/api/scraped-links/${id}`, { method: 'DELETE' }),
  deleteAll: () =>
    request<any>('/api/scraped-links', { method: 'DELETE' }),
  
  // Operations
  startScrape: (keywords: string[], limit?: number, agentId?: string) =>
    request<any>('/api/scraped-links/scrape/start', {
      method: 'POST',
      body: JSON.stringify({ keywords, limit, agentId }),
    }),
  startSignupSingle: (linkId: string, agentId?: string, credentialId?: string) =>
    request<any>(`/api/scraped-links/signup/single/${linkId}`, {
      method: 'POST',
      body: JSON.stringify({ agentId, credentialId }),
    }),
  startSignupSelected: (linkIds: string[], agentId?: string, credentialId?: string) =>
    request<any>('/api/scraped-links/signup/selected', {
      method: 'POST',
      body: JSON.stringify({ linkIds, agentId, credentialId }),
    }),
  startSignupAll: (agentId?: string, credentialId?: string) =>
    request<any>('/api/scraped-links/signup/all', {
      method: 'POST',
      body: JSON.stringify({ agentId, credentialId }),
    }),
  addCustomLink: (url: string, startSignup?: boolean, agentId?: string, credentialId?: string) =>
    request<any>('/api/scraped-links/custom', {
      method: 'POST',
      body: JSON.stringify({ url, startSignup, agentId, credentialId }),
    }),
};

