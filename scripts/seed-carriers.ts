import {Database} from '@st/database';import {StudioService,defaultPartnerMapping,type CarrierId} from '@st/integrations';import type {Actor} from '@st/contracts';
async function main():Promise<void>{
  if((process.env.APP_MODE??'sandbox')!=='sandbox')throw new Error('Automated fixture approval is restricted to the local sandbox.');
  const db=new Database(),studio=new StudioService(db,{signingSecret:process.env.SIM_SIGNING_SECRET??process.env.SIMULATOR_SIGNING_SECRET}),contextId='00000000-0000-4000-8000-000000000130';
  const maker:Actor={userId:'00000000-0000-4000-8000-000000000006',contextId,contextKind:'platform',roles:['synthetic-seed-maker'],permissions:['integrations.configure','integrations.validate','integrations.read'],sessionId:'local-fixture-seed',permissionRevision:1};
  const checker:Actor={...maker,userId:'00000000-0000-4000-8000-000000000008',roles:['synthetic-seed-checker'],permissions:['integrations.approve']};
  try{for(const carrierId of ['rest','soap','signed'] as CarrierId[]){
    const baseUrl=process.env.CARRIER_BASE_URL??'http://127.0.0.1:3100';
    const current=await studio.resolveVersion(carrierId).catch(()=>null);if(current?.config.baseUrl===baseUrl&&current.state==='enabled'&&current.config.secretRef==='secret://sandbox/'+carrierId+'-v1')continue;
    const proposed=await studio.propose(maker,{carrierId,environment:'sandbox',baseUrl,secretRef:'secret://sandbox/'+carrierId+'-v1',products:['PRD-01','PRD-07','PRD-24'],channels:['b2c','corporate','commercial','reseller','b2b2c'],capabilities:carrierId==='signed'?['quote','submit','retrieve_document','callback']:['quote','submit','status','retrieve_document'],mapping:defaultPartnerMapping(carrierId),reason:'Automated synthetic local fixture publication; not human approval or live certification'});
    const validated=await studio.validate(maker,proposed.id,proposed.revision);await studio.approve(checker,validated.id,validated.revision,'Automated synthetic checker fixture; not production or human approval');
  }console.log('Published three fictional sandbox connections with local contract evidence.');}finally{await db.close();}
}
void main();
