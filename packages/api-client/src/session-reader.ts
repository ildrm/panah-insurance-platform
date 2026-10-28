import { ApiError, parseSession, type Session } from './session-view.js';
export type { Session } from './session-view.js';
/** Read-only browser bootstrap; commands and their headers stay out of the public shell. */
export async function readSession(signal?: AbortSignal): Promise<Session> {
  const response = await fetch('/api/v1/session', { credentials: 'include', cache: 'no-store', ...(signal ? { signal } : {}) });
  if (!response.ok) throw new ApiError('unauthenticated', response.status, 'برای ادامه وارد حساب خود شوید.');
  return parseSession(await response.json());
}
