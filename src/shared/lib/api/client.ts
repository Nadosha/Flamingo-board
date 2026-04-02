/**
 * Base fetch wrapper for HolyMoly REST API.
 * Sends cookies with every request (credentials: 'include').
 */
import type { Card, Column } from '@/shared/types';

const API_BASE =
  (typeof window === 'undefined'
    ? process.env.BACKEND_INTERNAL_URL
    : process.env.NEXT_PUBLIC_API_URL) ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getServerCookieHeader(): Promise<Record<string, string>> {
  if (typeof window !== 'undefined') return {};
  try {
    // Dynamic import to avoid including next/headers in client bundle
    const { cookies } = await import('next/headers');
    const store = await cookies();
    const token = store.get('token')?.value;
    if (token) return { Cookie: `token=${token}` };
  } catch {
    // Not in a request context (e.g., during build)
  }
  return {};
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const serverCookies = await getServerCookieHeader();
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...serverCookies,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.message ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ message: string; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, full_name: string) =>
    request<{ message: string; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  me: () => request<{ id: string; email: string; full_name: string | null; avatar_url: string | null }>('/auth/me'),
};

// ─── Workspaces ──────────────────────────────────────────────────────────────

export const workspacesApi = {
  list: () =>
    request<Array<{ role: string; workspace: { id: string; name: string; slug: string; owner_id: string; created_at: string } | null }>>('/workspaces'),

  create: (name: string) =>
    request('/workspaces', { method: 'POST', body: JSON.stringify({ name }) }),

  delete: (id: string) =>
    request(`/workspaces/${id}`, { method: 'DELETE' }),

  createInvite: (workspaceId: string) =>
    request<{ url: string; token: string }>(`/workspaces/${workspaceId}/invite`, { method: 'POST' }),

  acceptInvite: (token: string) =>
    request<{ workspace_id: string }>(`/workspaces/invites/${token}/accept`, { method: 'POST' }),
};

// ─── Boards ───────────────────────────────────────────────────────────────────

export const boardsApi = {
  list: (workspaceId: string) =>
    request<Array<{ id: string; name: string; workspace_id: string; color: string; description: string | null; created_by: string | null; created_at: string }>>(`/boards?workspace_id=${workspaceId}`),

  create: (data: { name: string; workspace_id: string; color?: string; description?: string }) =>
    request('/boards', { method: 'POST', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request(`/boards/${id}`, { method: 'DELETE' }),

  getWithColumns: (boardId: string) =>
    request<any>(`/boards/${boardId}`),

  getMembers: (boardId: string) =>
    request<Array<{ user_id: string; role: string; profile: { id: string; full_name: string | null; avatar_url: string | null } | null }>>(`/boards/${boardId}/members`),

  getLabels: (boardId: string) =>
    request<Array<{ id: string; name: string; color: string }>>(`/boards/${boardId}/labels`),
};

// ─── Columns ──────────────────────────────────────────────────────────────────

export const columnsApi = {
  create: (boardId: string, name: string, position: number) =>
    request<Column>('/columns', { method: 'POST', body: JSON.stringify({ board_id: boardId, name, position }) }),

  update: (id: string, updates: { name?: string; position?: number }) =>
    request(`/columns/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  delete: (id: string) =>
    request(`/columns/${id}`, { method: 'DELETE' }),

  reorder: (updates: Array<{ id: string; position: number }>, boardId?: string) =>
    request('/columns/reorder', { method: 'PATCH', body: JSON.stringify({ updates, board_id: boardId }) }),
};

// ─── Cards ────────────────────────────────────────────────────────────────────

export const cardsApi = {
  create: (columnId: string, title: string, position: number) =>
    request<Card>('/cards', { method: 'POST', body: JSON.stringify({ column_id: columnId, title, position }) }),

  get: (id: string) =>
    request<any>(`/cards/${id}`),

  update: (id: string, updates: { title?: string; description?: string; column_id?: string; position?: number; due_date?: string | null }) =>
    request<Card>(`/cards/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  move: (cardId: string, targetColumnId: string, targetPosition: number, sourceColumnId: string) =>
    request(`/cards/${cardId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ target_column_id: targetColumnId, target_position: targetPosition, source_column_id: sourceColumnId }),
    }),

  delete: (id: string) =>
    request(`/cards/${id}`, { method: 'DELETE' }),

  reorder: (updates: Array<{ id: string; position: number; column_id: string }>, boardId?: string) =>
    request('/cards/reorder', { method: 'PATCH', body: JSON.stringify({ updates, board_id: boardId }) }),

  addComment: (cardId: string, content: string) =>
    request(`/cards/${cardId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),

  addAssignee: (cardId: string, userId: string) =>
    request(`/cards/${cardId}/assignees`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),

  removeAssignee: (cardId: string, userId: string) =>
    request(`/cards/${cardId}/assignees/${userId}`, { method: 'DELETE' }),

  addLabel: (cardId: string, labelId: string) =>
    request(`/cards/${cardId}/labels`, { method: 'POST', body: JSON.stringify({ label_id: labelId }) }),

  removeLabel: (cardId: string, labelId: string) =>
    request(`/cards/${cardId}/labels/${labelId}`, { method: 'DELETE' }),
};

// ─── Labels ───────────────────────────────────────────────────────────────────

export const labelsApi = {
  getByWorkspace: (workspaceId: string) =>
    request<Array<{ id: string; name: string; color: string }>>(`/labels?workspace_id=${workspaceId}`),

  create: (workspaceId: string, name: string, color: string) =>
    request<{ id: string; name: string; color: string }>('/labels', { method: 'POST', body: JSON.stringify({ workspace_id: workspaceId, name, color }) }),

  delete: (id: string) =>
    request(`/labels/${id}`, { method: 'DELETE' }),
};
