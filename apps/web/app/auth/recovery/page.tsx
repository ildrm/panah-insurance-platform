import Link from 'next/link';
import { Notice } from '../../../components/primitives';
export const metadata={title:'بازیابی دسترسی'};
export default function Page(){return <div className="container page-space narrow"><h1>بازیابی دسترسی به حساب</h1><p>اگر به شماره تأییدشده خود دسترسی دارید، کد ورود تازه دریافت کنید. جایگزینی شماره یا عامل امنیتی به بررسی مستقل هویت نیاز دارد.</p><Notice>پشتیبانی هرگز کد یک‌بارمصرف یا عامل امنیتی شما را درخواست نمی‌کند.</Notice><div className="form-actions"><Link className="button" href="/auth/sign-in">دریافت کد ورود تازه</Link><Link className="button button-outline" href="/help">راهنمای دسترسی</Link></div></div>}
