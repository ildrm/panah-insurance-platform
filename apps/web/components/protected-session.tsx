'use client';
import { useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { SessionClient as ApiClient, ApiError, contextHome, object, string } from '@st/api-client/session';
import { Icon, Loading, Notice } from './primitives';
import { useSession } from './session';
export function useCommand() {
  const { session } = useSession(); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const last = useRef<{ body: string; key: string } | null>(null);
  const run = async (path: string, body: unknown, expectedVersion?: number): Promise<unknown> => {
    if (!session) throw new ApiError('unauthenticated', 401, 'ابتدا وارد حساب خود شوید.');
    const signature = path + JSON.stringify(body); if (last.current?.body !== signature) last.current = { body: signature, key: crypto.randomUUID() };
    setBusy(true); setError('');
    try { const result = await new ApiClient().request(path, { method: 'POST', body, csrfToken: session.csrfToken, idempotencyKey: last.current.key, ...(expectedVersion !== undefined ? { expectedVersion } : {}) }); last.current = null; return result; }
    catch (cause) { const message = cause instanceof Error ? cause.message : 'درخواست انجام نشد.'; setError(message); throw cause; }
    finally { setBusy(false); }
  };
  return { run, busy, error, clearError: () => setError('') };
}
export function PrivateGate({ children }: { children: ReactNode }) { const { session, loading } = useSession(); if (loading) return <Loading text="در حال بررسی دسترسی…"/>; if (!session) return <div className="auth-required"><Icon name="lock" size={36}/><h2>برای ادامه وارد حساب خود شوید</h2><p>اطلاعات بیمه و پرداخت فقط در حساب مجاز نمایش داده می‌شود.</p><Link className="button" href="/auth/sign-in">ورود به حساب</Link></div>; return <>{children}</>; }
export function StepUpControl(){const [code,setCode]=useState('');const [factor,setFactor]=useState('');const [message,setMessage]=useState('');const command=useCommand();return <details className="panel step-up"><summary>تأیید امنیتی برای اقدام حساس</summary><p className="small-text">تأیید دوم به همین فضای کاری و بازه محدود وابسته است. پس از تغییر فضا یا پایان اعتبار، دوباره تأیید کنید.</p>{command.error?<Notice tone="error">{command.error}</Notice>:null}{message?<Notice tone="success">{message}</Notice>:null}<button type="button" className="text-link" onClick={()=>{void new ApiClient().request('/v1/sandbox/mfa').then(value=>{const data=object(value);setFactor(string(data.sandboxMfaCode));}).catch(()=>setMessage('دریافت عامل محلی مجاز نیست.'));}}>مشاهده عامل دوم حساب ساختگی</button>{factor?<p className="small-text">عامل دوم محلی: <bdi>{factor}</bdi><button type="button" className="text-link" onClick={()=>setCode(factor)}>استفاده از کد محلی</button></p>:null}<form className="inline-form" onSubmit={event=>{event.preventDefault();void command.run('/v1/auth/step-up',{mfaCode:code}).then(()=>{setMessage('تأیید امنیتی این فضای کاری ثبت شد.');setCode('');setFactor('');}).catch(()=>undefined);}}><label className="field"><span>کد عامل دوم</span><input inputMode="numeric" autoComplete="off" value={code} required onChange={event=>setCode(event.target.value)}/></label><button className="button button-small" disabled={command.busy}>تأیید امنیتی</button></form></details>}
export function ContextSwitcher() { const { session } = useSession(); const command = useCommand(); if (!session || session.contexts.length < 2) return null; return <label className="context-switch"><span>فضای کاری</span><select aria-label="تغییر فضای کاری" value={session.actor.contextId} disabled={command.busy} onChange={event => { const contextId = event.target.value; void command.run('/v1/contexts', { contextId }).then(async () => { const active=await new ApiClient().session();window.location.assign(contextHome(active.actor)); }).catch(() => undefined); }}>{session.contexts.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>{command.error ? <Notice tone="error">{command.error}</Notice> : null}</label>; }

/** Remount protected state synchronously whenever identity/context changes. */
export function SessionScope({children}:{children:ReactNode}){const {session}=useSession();return <div className="session-scope" key={`${session?.actor.userId??'anonymous'}:${session?.actor.contextId??'none'}:${session?.actor.permissionRevision??0}`}>{children}</div>}
