import {randomUUID} from 'node:crypto';
import {Database} from '@st/database';
import {ControlsService} from '@st/controls';
import type {Actor} from '@st/contracts';
const db=new Database();
const id=(n:number)=>`00000000-0000-4000-8000-${n.toString().padStart(12,'0')}`;
async function actor(n:number):Promise<Actor>{const row=(await db.query<{roles:string[];permissions:string[];permission_revision:number}>("SELECT m.roles,m.permissions,u.permission_revision FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.user_id=$1 AND m.context_id=$2 AND m.active",[id(n),id(130)])).rows[0];if(!row)throw new Error('Seed the known synthetic control maker/checker first.');return{userId:id(n),contextId:id(130),contextKind:'platform',roles:row.roles,permissions:row.permissions,permissionRevision:row.permission_revision,sessionId:id(n)};}
async function main(){if((process.env.APP_MODE??'sandbox')!=='sandbox'||!['127.0.0.1','localhost','db'].includes(new URL(process.env.DATABASE_URL??'postgresql://st@127.0.0.1:55432/st_local').hostname))throw new Error('Only the synthetic local environment can publish fixture controls.');
  const service=new ControlsService(db),maker=await actor(6),checker=await actor(8),current=await service.current(maker);
  if(current.revision!==1||current.ruleCount!==0){console.log('Existing scoped control configuration preserved; no fixture overwrite.');return;}
  const changes=service.catalog().capabilities.filter(row=>!row.default&&!row.mandatory&&row.key!=='security.quarantine').map(row=>({key:row.key,enabled:true,scope:{global:true as const},effectiveFrom:'2020-01-01T00:00:00Z'}));
  if(changes.length>100)throw new Error('Review fixture batching before expanding this registry.');
  const proposal=await service.propose(maker,{changes,reason:'Explicit fictional local sandbox availability fixture; no live authority or human sign-off'},{idempotencyKey:randomUUID(),expectedRevision:current.revision});
  await service.preview(maker,proposal.id,[{capability:'COM-01',context:{purpose:'new_sales',environment:'sandbox',channel:'b2c',productId:'PRD-01',carrierId:'rest',customerId:id(1),cohortKey:id(1)}}],{idempotencyKey:randomUUID()});
  await service.approve(checker,proposal.id,{idempotencyKey:randomUUID(),expectedRevision:current.revision,reason:'Automated independent synthetic checker fixture; live operations remain unavailable'});
  console.log(`Published ${changes.length} fictional local availability rules; no real approval or partner authority inferred.`);
}
void main().finally(()=>db.close());
