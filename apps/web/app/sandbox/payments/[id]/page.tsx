import { SandboxPayment } from '../../../../components/purchase';
import { SessionScope } from '../../../../components/protected-session';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <SessionScope><SandboxPayment id={id}/></SessionScope>}
