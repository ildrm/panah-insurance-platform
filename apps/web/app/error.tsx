'use client';
import { Notice } from '../components/primitives';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="container page-space"><Notice tone="error" title="دریافت صفحه انجام نشد">ارتباط یا دسترسی را بررسی کنید و دوباره تلاش کنید.</Notice><button className="button" onClick={reset}>تلاش دوباره</button></div>; }
