import { ApiError, object, string, parseSession, type Session } from './session-view.js';
export * from './session-view.js';
export { readSession } from './session-reader.js';
export type RequestOptions = { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; csrfToken?: string; idempotencyKey?: string; expectedVersion?: number; signal?: AbortSignal };
export class SessionClient {
  constructor(private readonly base = '/api', private readonly cookie = '') {}
  async request(path: string, options: RequestOptions = {}): Promise<unknown> {
    if (!path.startsWith('/v1/') && !path.startsWith('/admin/v1/') && !path.startsWith('/internal/v1/')) throw new ApiError('invalid_path', 400, 'مسیر درخواست معتبر نیست.');
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.cookie) headers.Cookie = this.cookie;
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.csrfToken) headers['X-CSRF-Token'] = options.csrfToken;
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
    if (options.expectedVersion !== undefined) headers['If-Match'] = `"${options.expectedVersion}"`;
    let response: Response;
    try { response = await fetch(this.base + path, { method: options.method ?? 'GET', headers, credentials: 'include', cache: 'no-store', ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}), ...(options.signal ? { signal: options.signal } : {}) }); }
    catch (error) { if (error instanceof Error && error.name === 'AbortError') throw error; throw new ApiError('network_unavailable', 0, 'ارتباط با سرویس برقرار نشد. اطلاعات شما ارسال نشده یا نتیجه هنوز تأیید نشده است.'); }
    const content = response.headers.get('content-type') ?? '';
    const value: unknown = content.includes('json') ? await response.json() : null;
    if (!response.ok) { if(typeof window!=='undefined'&&path!=='/v1/session'&&[401,403].includes(response.status))window.dispatchEvent(new Event('panah:authorization-recheck'));const e = object(value); throw new ApiError(string(e.code, 'request_failed'), response.status, string(e.message, 'درخواست انجام نشد. لطفاً ورودی و دسترسی خود را بررسی کنید.'), object(e.fieldErrors ?? e.fields)); }
    return value;
  }
  async session(signal?: AbortSignal): Promise<Session> { return parseSession(await this.request('/v1/session', signal ? { signal } : {})); }
}
