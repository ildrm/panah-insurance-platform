import Link from 'next/link';
import { notFound } from 'next/navigation';
import { object, string } from '@st/api-client';
import { serverApi } from '../../../lib/server-api';
import { BackLink, Icon, Notice } from '../../../components/primitives';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const result=await (await serverApi()).request(`/v1/catalog/carriers/${encodeURIComponent(slug)}`).then(object).catch(()=>null);if(!result)notFound();return <div className="container page-space narrow"><BackLink/><span className="auth-icon"><Icon size={37}/></span><h1>{string(result.label,'بیمه‌گر')}</h1><p>{string(result.description)}</p>{result.synthetic===true?<Notice>این ارائه‌دهنده، قرارداد محلی ساختگی برای آزمون جریان بیمه است و اتصال به یک بیمه‌گر واقعی را نشان نمی‌دهد.</Notice>:null}<Link className="button" href="/insurance">مشاهده محصولات و پوشش‌ها</Link></div>}
