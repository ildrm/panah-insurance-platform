import Link from 'next/link';
export default function NotFound() { return <div className="container page-space empty-state"><h1>این مسیر پیدا نشد</h1><p>ممکن است نشانی تغییر کرده باشد یا دسترسی لازم وجود نداشته باشد.</p><Link className="button" href="/">بازگشت به خانه</Link></div>; }
