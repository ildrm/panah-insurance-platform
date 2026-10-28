import { Checkout } from '../../../components/purchase';
import { SessionScope } from '../../../components/protected-session';
export default async function Page({searchParams}:{params:Promise<{applicationId:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const query=await searchParams;return <SessionScope><Checkout sessionId={typeof query.session==='string'?query.session:''} offerId={typeof query.offer==='string'?query.offer:''}/></SessionScope>}
