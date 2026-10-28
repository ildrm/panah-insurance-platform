import Link from 'next/link';
import { formatRials, formatToman } from '@st/ui';
import type { Money } from '@st/api-client';
import type { ReactNode } from 'react';
export function Icon({ name = 'shield', size = 24 }: { name?: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    shield: <><path d="M12 3 20 6v6c0 5-8 9-8 9S4 17 4 12V6l8-3Z"/><path d="m8 12 3 3 5-6"/></>,
    car: <><path d="m5 10 2-5h10l2 5M3 10h18v8H3zM6 18v3m12-3v3M6 14h2m8 0h2"/></>,
    health: <><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/></>,
    home: <><path d="m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7"/></>,
    plane: <><path d="m3 11 7-1 1-7 3-1 1 8 6 2v2l-6 1-1 6-3-1-1-5-7-1z"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12l9 4 9-4"/></>,
    arrow: <><path d="M20 12H4m6-6-6 6 6 6"/></>,
    search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0v8l3 2H3l3-2zM9 21h6"/></>,
    user: <><circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    check: <path d="m4 12 5 5L20 6"/>,
    document: <><path d="M5 2h10l4 4v16H5zM14 2v5h5M8 11h8M8 15h8M8 19h5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
    lock: <><rect x="4" y="10" width="16" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3M12 14v4"/></>,
    menu: <><path d="M3 6h18M3 12h18M3 18h18"/></>,
    plus: <path d="M12 4v16M4 12h16"/>,
    refresh: <><path d="M20 8a9 9 0 1 0 1 7M20 2v6h-6"/></>,
    exit: <><path d="M9 3H3v18h6M8 12h13m-5-5 5 5-5 5"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.shield}</svg>;
}
const statusNames: Record<string, string> = { draft: 'پیش‌نویس', pending: 'در انتظار', collecting: 'در حال دریافت پیشنهاد', completed: 'تکمیل‌شده', complete: 'تکمیل‌شده', valid: 'قابل انتخاب', expired: 'منقضی', committed: 'خرید ثبت شده', awaiting_payment: 'در انتظار پرداخت', awaiting_approval: 'در انتظار تأیید', verified: 'تأیید پرداخت', paid: 'پرداخت‌شده', issued: 'صادرشده', active: 'فعال', future: 'آغاز پوشش در آینده', failed: 'نیازمند پیگیری', rejected: 'ردشده', cancelled: 'لغوشده', cancellation_requested: 'درخواست لغو', acknowledged: 'دریافت بیمه‌گر', sending: 'در حال ارسال', not_started: 'شروع نشده', available: 'در دسترس', queued: 'در صف', scheduled: 'زمان‌بندی‌شده', submitted: 'ارسال‌شده', evidence_required: 'نیازمند مدرک', assessing: 'در حال بررسی', approved: 'تأییدشده', external_outcome_unknown: 'نتیجه در حال تطبیق', quarantined: 'متوقف برای بررسی', delivered: 'تحویل‌شده', reserved: 'رزروشده', partial: 'نتیجه جزئی', processing: 'در حال پردازش', confirmed: 'قطعی', closed: 'بسته‌شده', open: 'باز', proposed: 'پیشنهادشده', enabled: 'فعال', disabled: 'غیرفعال' };
export function Status({ value }: { value: string }) { const tone = ['active','verified','issued','paid','approved','completed','complete','delivered','confirmed'].includes(value) ? 'success' : ['failed','rejected','cancelled','quarantined'].includes(value) ? 'danger' : ['external_outcome_unknown','partial','evidence_required','expired'].includes(value) ? 'warning' : 'neutral'; return <span className={`status status-${tone}`}><span className="status-dot"/>{statusNames[value] ?? (value || 'ثبت‌شده')}</span>; }
export function MoneyText({ value, secondary = false }: { value: Money; secondary?: boolean }) { return <span className="money"><bdi>{formatRials(value.amount)}</bdi> <span className="money-unit">{value.currency === 'IRR' ? 'ریال' : value.currency}</span>{secondary && value.currency === 'IRR' ? <small><bdi>{formatToman(value.amount)}</bdi> تومان</small> : null}</span>; }
export function Notice({ children, tone = 'info', title }: { children: ReactNode; tone?: 'info' | 'error' | 'success' | 'warning'; title?: string }) { return <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{title ? <strong>{title}</strong> : null}<div>{children}</div></div>; }
export function Loading({ text = 'در حال دریافت اطلاعات…' }: { text?: string }) { return <div className="loading" role="status"><span className="spinner"/>{text}</div>; }
export function Empty({ title = 'هنوز موردی ثبت نشده است', description, action }: { title?: string; description?: string; action?: ReactNode }) { return <div className="empty-state"><span className="empty-icon"><Icon name="document" size={32}/></span><h3>{title}</h3>{description ? <p>{description}</p> : null}{action}</div>; }
export function BackLink({ href = '/insurance', children = 'بازگشت' }: { href?: string; children?: ReactNode }) { return <Link className="text-link" href={href}><span className="back-arrow">→</span>{children}</Link>; }
export function DateText({ value }: { value: string }) { if (!value) return <span>—</span>; const date = new Date(value); if (Number.isNaN(date.getTime())) return <bdi>{value}</bdi>; return <time dateTime={value}>{new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeZone: 'Asia/Tehran' }).format(date)}</time>; }
