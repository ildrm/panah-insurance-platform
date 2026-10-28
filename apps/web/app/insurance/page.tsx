import { serverApi } from '../../lib/server-api';
import { Catalog } from '../../components/catalog';
import { Notice } from '../../components/primitives';
export const dynamic='force-dynamic';
export const metadata={title:'مقایسه و انتخاب بیمه'};
export default async function InsurancePage() { try { const products=await (await serverApi()).catalog(); return <div className="container page-space"><Catalog products={products}/></div>; } catch { return <div className="container page-space"><h1>فهرست بیمه‌ها</h1><Notice tone="error">سرویس فهرست در دسترس نیست. لطفاً اتصال را بررسی و صفحه را تازه کنید.</Notice></div>; } }
