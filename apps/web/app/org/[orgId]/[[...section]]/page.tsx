import { DashboardScreen } from '../../../../components/dashboard';
import { SessionScope } from '../../../../components/protected-session';
export default async function Page({params}:{params:Promise<{orgId:string;section?:string[]}>}){const p=await params;return <SessionScope><DashboardScreen surface="corporate" orgId={p.orgId} section={p.section?.join('/')??''}/></SessionScope>}
