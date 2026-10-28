import { notFound } from 'next/navigation';
import { ServiceMarketplace } from '../../../components/special-pages';
import { SessionScope } from '../../../components/protected-session';
export default async function Page({params}:{params:Promise<{kind:string}>}){const {kind}=await params;if(kind!=='services'&&kind!=='parts'&&kind!=='trading')notFound();return <SessionScope><ServiceMarketplace kind={kind}/></SessionScope>}
