import { ProductPurchase } from '../../../components/purchase';
import { SessionScope } from '../../../components/protected-session';
export default async function Page({params}:{params:Promise<{productId:string}>}){const {productId}=await params;return <SessionScope><ProductPurchase productId={productId}/></SessionScope>}
