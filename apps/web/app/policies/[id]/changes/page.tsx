import { PolicyChangeForm } from '../../../../components/special-pages';
import { SessionScope } from '../../../../components/protected-session';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <SessionScope><PolicyChangeForm policyId={id}/></SessionScope>}
