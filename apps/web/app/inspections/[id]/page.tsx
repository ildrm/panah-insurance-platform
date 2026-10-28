import { InspectionDetail } from '../../../components/inspection';
import { SessionScope } from '../../../components/protected-session';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <SessionScope><InspectionDetail id={id}/></SessionScope>}
