import { serverApi } from '../../lib/server-api';
import { Catalog } from '../../components/catalog';
import { Notice } from '../../components/primitives';
export const dynamic='force-dynamic';
export default async function Page(){const products=await (await serverApi()).catalog().catch(()=>null);return <div className="container page-space">{products?<Catalog products={products}/>:<Notice tone="error">فهرست عمومی در دسترس نیست. هیچ سابقه خصوصی در جستجوی عمومی نمایش داده نمی‌شود.</Notice>}</div>}
