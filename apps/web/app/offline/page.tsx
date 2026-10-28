import Link from 'next/link';
export const dynamic='force-static';
export const metadata={title:'ارتباط برقرار نیست'};
export default function OfflinePage(){return <div className="container page-space narrow"><h1>برای این کار، ارتباط لازم است</h1><p>وضعیت معتبر بیمه‌نامه، پرداخت و درخواست‌های خصوصی فقط با اتصال به سرویس دریافت می‌شود. اطلاعات حساب یا فرمان خرید به‌صورت آفلاین ذخیره نشده است.</p><Link className="button" href="/">بررسی دوباره ارتباط</Link></div>}
