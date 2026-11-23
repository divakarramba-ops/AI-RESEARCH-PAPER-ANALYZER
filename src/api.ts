import type {
  AuthUser,
  ChatMessageRecord,
  ComparisonRecord,
  DashboardPayload,
  PaperRecord,
} from './types.ts';

// Held strictly in memory (never written to localStorage/sessionStorage)
let sessionToken: string | null = null;

export function getSessionToken(): string | null {
  return sessionToken;
}

export function setSessionToken(token: string | null): void {
  sessionToken = token;
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(res.ok ? 'Invalid server response.' : `Request failed (${res.status}).`);
    }
  }
  if (!res.ok) {
    const errMsg = typeof data.error === 'string' ? data.error : `Request failed (${res.status}).`;
    throw new Error(errMsg);
  }
  return data as T;
}

export async function ensureWorkspaceToken(): Promise<{ token: string; user: AuthUser }> {
  if (sessionToken) {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    if (res.ok) {
      const data = await parseJsonResponse<{ user: AuthUser }>(res);
      return { token: sessionToken, user: data.user };
    }
  }

  const res = await fetch('/api/auth/guest', { method: 'POST' });
  const data = await parseJsonResponse<{ token: string; user: AuthUser }>(res);
  sessionToken = data.token;
  return data;
}

function authHeaders(): HeadersInit {
  return sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
}): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      guestToken: sessionToken,
    }),
  });
  const data = await parseJsonResponse<{ token: string; user: AuthUser }>(res);
  sessionToken = data.token;
  return data;
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      guestToken: sessionToken,
    }),
  });
  const data = await parseJsonResponse<{ token: string; user: AuthUser }>(res);
  sessionToken = data.token;
  return data;
}

export async function lookupSecurityQuestion(
  email: string
): Promise<{ email: string; securityQuestion: string }> {
  const res = await fetch('/api/auth/forgot-password/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return parseJsonResponse<{ email: string; securityQuestion: string }>(res);
}

export async function resetPasswordWithSecurityAnswer(input: {
  email: string;
  securityAnswer: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const res = await fetch('/api/auth/forgot-password/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonResponse<{ message: string }>(res);
}

export async function fetchDashboard(): Promise<DashboardPayload> {
  await ensureWorkspaceToken();
  const res = await fetch('/api/dashboard', { headers: authHeaders() });
  return parseJsonResponse<DashboardPayload>(res);
}

export async function listPapers(): Promise<PaperRecord[]> {
  await ensureWorkspaceToken();
  const res = await fetch('/api/papers', { headers: authHeaders() });
  const data = await parseJsonResponse<{ papers: PaperRecord[] }>(res);
  return data.papers;
}

export async function uploadAndAnalyzePdf(file: File): Promise<PaperRecord> {
  await ensureWorkspaceToken();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/papers/upload', {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  const data = await parseJsonResponse<{ paper: PaperRecord }>(res);
  return data.paper;
}

export async function deletePaper(paperId: string): Promise<void> {
  await ensureWorkspaceToken();
  const res = await fetch(`/api/papers/${encodeURIComponent(paperId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await parseJsonResponse<{ deleted: boolean }>(res);
}

export async function downloadPaperReport(paperId: string, paperTitle: string): Promise<void> {
  await ensureWorkspaceToken();
  const res = await fetch(`/api/papers/${encodeURIComponent(paperId)}/report`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    await parseJsonResponse(res);
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeTitle = paperTitle.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 70) || 'research-report';
  a.href = url;
  a.download = `${safeTitle}_Analysis_Report.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function fetchChatHistory(paperId: string): Promise<ChatMessageRecord[]> {
  await ensureWorkspaceToken();
  const res = await fetch(`/api/chat/${encodeURIComponent(paperId)}`, {
    headers: authHeaders(),
  });
  const data = await parseJsonResponse<{ messages: ChatMessageRecord[] }>(res);
  return data.messages;
}

export async function sendChatQuestion(
  paperId: string,
  question: string
): Promise<{ userMessage: ChatMessageRecord; assistantMessage: ChatMessageRecord }> {
  await ensureWorkspaceToken();
  const res = await fetch(`/api/chat/${encodeURIComponent(paperId)}`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });
  return parseJsonResponse<{
    userMessage: ChatMessageRecord;
    assistantMessage: ChatMessageRecord;
  }>(res);
}

export async function listComparisons(): Promise<ComparisonRecord[]> {
  await ensureWorkspaceToken();
  const res = await fetch('/api/compare', { headers: authHeaders() });
  const data = await parseJsonResponse<{ comparisons: ComparisonRecord[] }>(res);
  return data.comparisons;
}

export async function compareSelectedPapers(paperIds: string[]): Promise<ComparisonRecord> {
  await ensureWorkspaceToken();
  const res = await fetch('/api/compare', {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paperIds }),
  });
  const data = await parseJsonResponse<{ comparison: ComparisonRecord }>(res);
  return data.comparison;
}

export async function submitContactForm(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ submitted: boolean; message: string }> {
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonResponse<{ submitted: boolean; message: string }>(res);
}
