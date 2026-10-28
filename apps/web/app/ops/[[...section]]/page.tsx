import { DashboardScreen } from '../../../components/dashboard';
import { SessionScope } from '../../../components/protected-session';
export default async function Page({params}:{params:Promise<{section?:string[]}>}){const p=await params;return <SessionScope><DashboardScreen surface="operations" section={p.section?.join('/')??''}/></SessionScope>}
