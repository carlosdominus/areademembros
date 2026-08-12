import { CourseData, Comment, WhitelistEntry, AuditLog, UserSession } from '../types';

const TOKEN_KEY = 'cakto_members_session_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 || response.status === 403) {
    // If token invalid, don't throw immediately for check-email route
    if (!url.includes('/api/auth/check-email') && !url.includes('/api/auth/verify-pin')) {
      // Clear token
      removeStoredToken();
    }
  }
  return response;
}

export async function checkEmailAuthorization(email: string): Promise<{
  authorized: boolean;
  email?: string;
  name?: string;
  message?: string;
  devPinHint?: string;
  error?: string;
}> {
  const res = await fetch('/api/auth/check-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  if (!res.ok) {
    return { authorized: false, error: data.error || 'Erro ao verificar e-mail autorização.' };
  }
  return data;
}

export async function verifyPinAndLogin(email: string, pin: string, masterKey?: string): Promise<{
  sessionToken?: string;
  user?: UserSession;
  error?: string;
}> {
  const res = await fetch('/api/auth/verify-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, pin, masterKey })
  });

  const data = await res.json();
  if (!res.ok) {
    return { error: data.error || 'Código incorreto ou inválido.' };
  }

  if (data.sessionToken) {
    setStoredToken(data.sessionToken);
  }
  return data;
}

export async function fetchCurrentUser(): Promise<UserSession | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetchWithAuth('/api/auth/me');
    if (!res.ok) {
      removeStoredToken();
      return null;
    }
    const data = await res.json();
    return {
      ...data,
      token
    };
  } catch (err) {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetchWithAuth('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    // ignore
  } finally {
    removeStoredToken();
  }
}

export async function fetchCourseContent(): Promise<CourseData> {
  const res = await fetchWithAuth('/api/content/course');
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Falha ao carregar conteúdo do curso. Acesso bloqueado.');
  }
  return res.json();
}

export async function toggleLessonComplete(lessonId: string): Promise<{ completed: boolean; completedLessonIds: string[] }> {
  const res = await fetchWithAuth(`/api/content/lessons/${lessonId}/complete`, {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error('Erro ao salvar progresso.');
  }
  return res.json();
}

export async function fetchComments(lessonId: string): Promise<Comment[]> {
  const res = await fetchWithAuth(`/api/content/lessons/${lessonId}/comments`);
  if (!res.ok) return [];
  return res.json();
}

export async function postComment(lessonId: string, text: string): Promise<Comment> {
  const res = await fetchWithAuth(`/api/content/lessons/${lessonId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text })
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Erro ao enviar comentário.');
  }
  return res.json();
}

export async function submitLessonRating(lessonId: string, rating: number): Promise<void> {
  await fetchWithAuth(`/api/content/lessons/${lessonId}/rating`, {
    method: 'POST',
    body: JSON.stringify({ rating })
  });
}

// ADMIN APIS
export async function fetchWhitelist(adminKey: string): Promise<WhitelistEntry[]> {
  const res = await fetch('/api/admin/whitelist', {
    headers: { 'x-admin-key': adminKey }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao carregar lista de e-mails.');
  }
  return res.json();
}

export async function addWhitelistEmail(adminKey: string, payload: {
  email?: string;
  name?: string;
  notes?: string;
  status?: 'active' | 'suspended';
  action?: 'bulk_import';
  emails?: string;
}): Promise<any> {
  const res = await fetch('/api/admin/whitelist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao atualizar lista.');
  }
  return res.json();
}

export async function deleteWhitelistEmail(adminKey: string, id: string): Promise<void> {
  const res = await fetch(`/api/admin/whitelist/${id}`, {
    method: 'DELETE',
    headers: { 'x-admin-key': adminKey }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao remover e-mail.');
  }
}

export async function fetchAuditLogs(adminKey: string): Promise<AuditLog[]> {
  const res = await fetch('/api/admin/audit-logs', {
    headers: { 'x-admin-key': adminKey }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao carregar logs.');
  }
  return res.json();
}

export async function updateLessonAdmin(adminKey: string, lessonId: string, payload: {
  title?: string;
  videoUrl?: string;
  description?: string;
  notes?: string;
}): Promise<void> {
  const res = await fetch(`/api/admin/lessons/${lessonId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao atualizar aula.');
  }
}

export async function fetchGoogleSheetConfig(adminKey: string): Promise<any> {
  const res = await fetch('/api/admin/google-sheet-config', {
    headers: { 'x-admin-key': adminKey }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao carregar configurações do Google Sheets.');
  }
  return res.json();
}

export async function triggerGoogleSheetSync(adminKey: string, payload: {
  sheetUrl?: string;
  strictGoogleSheetOnly?: boolean;
}): Promise<any> {
  const res = await fetch('/api/admin/google-sheet-sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao sincronizar planilha Google Sheets.');
  }
  return res.json();
}
