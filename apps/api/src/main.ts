import 'reflect-metadata';
import {Controller,Get,Post,Param,Query,Body,Req,Res,Inject,Module,Catch,HttpException,type ExceptionFilter,type ArgumentsHost} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import type {Request,Response} from 'express';
import {randomUUID} from 'node:crypto';
import {isUtf8} from 'node:buffer';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Database} from '@st/database';
import {DomainError,authorize,requireObject,text,type Actor,type Channel} from '@st/contracts';
import {BusinessService,businessOperations,businessKinds} from '@st/business';
import {createCarrierRegistry,IssuanceWorker,IntegrationError,SYNTHETIC_SIGNING_KEY,StudioService,defaultPartnerMapping} from '@st/integrations';
import {AuthService} from './auth';import {FeatureService} from './flags';import {CommerceService} from './commerce';
import {FinanceService,financeOperations} from '@st/finance';
import {SandboxFinancePorts} from './finance-ports';
import {OperationalMetrics} from './metrics';
import {ControlsService,permissions as controlPermissions} from '@st/controls';

const db=new Database(),flags=new FeatureService(db),auth=new AuthService(db);
const metrics=new OperationalMetrics(db);
const controls=new ControlsService(db,{cohortSecret:process.env.ST_CONTROL_COHORT_SECRET??process.env.ST_CURSOR_SECRET,regions:{'sandbox-region-a':'synthetic-region-evidence-v1'}});
if((process.env.APP_MODE??'sandbox')!=='sandbox')throw new Error('Live authentication, provider contracts and release approvals are not configured. Only explicit local sandbox mode can start.');
const gateway=createCarrierRegistry({baseUrl:process.env.CARRIER_BASE_URL??'http://127.0.0.1:3100',mode:'sandbox',signingSecret:process.env.SIM_SIGNING_SECRET??process.env.SIMULATOR_SIGNING_SECRET??SYNTHETIC_SIGNING_KEY});
const studio=new StudioService(db,{signingSecret:process.env.SIM_SIGNING_SECRET??process.env.SIMULATOR_SIGNING_SECRET??SYNTHETIC_SIGNING_KEY});
let commerce:CommerceService;
const business=new BusinessService(db,{
  quoteGateway:{quoteAll:(input,carriers)=>studio.quoteAll({...input,channel:input.channel as Channel},carriers)},
  policyAccess:async(actor,id)=>{const p=await commerce.policy(actor,id);return {id:String(p.id),carrierId:String(p.carrierId),productId:String(p.productId),state:String(p.state),effectiveFrom:String(p.effectiveFrom),effectiveUntil:String(p.effectiveUntil)};},
  checkAdmission:async(actor,operation,input)=>{
    if(['createListing','placeAuctionBid','createFinancialReferral','requestVehicleInquiry'].includes(operation))throw new DomainError('authority_not_configured',409,'This separately regulated/provider operation has no approved contract.');
    const pinned=operation==='quoteApplication'?await business.get(actor,'applications',String(input.id)):undefined;
    const channel=String(pinned?.data.channel??input.channel??(actor.contextKind==='organization'?'corporate':actor.contextKind==='seller'?'reseller':'b2c')) as Channel;
    if(channel==='b2c'&&actor.contextKind!=='personal')throw new DomainError('personal_context_required',403,'Switch to personal context for a personal purchase.');
    if(['corporate','commercial','b2b2c'].includes(channel)&&(!actor.roles.includes('buyer')))throw new DomainError('buyer_required',403,'An authorized organization buyer is required.');
    await db.transaction(tx=>flags.assertSales(tx,channel));
  }
});
commerce=new CommerceService(db,business,flags,controls);const worker=new IssuanceWorker(db,gateway,{objectStorageDir:process.env.OBJECT_STORAGE_DIR??'.local/objects',studio});
const financePorts=new SandboxFinancePorts(db,commerce),finance=new FinanceService(db,financePorts.options());
const key=(req:Request):string=>req.header('idempotency-key')??'';
const version=(req:Request):number|undefined=>{const s=req.header('if-match');return s?Number(s.replaceAll('"','')):undefined;};
@Catch()
class Errors implements ExceptionFilter {catch(error:unknown,host:ArgumentsHost):void{
  const response=host.switchToHttp().getResponse<Response>();const pgCode=error!==null&&typeof error==='object'&&'code' in error?String(error.code):'';
  const e=error instanceof DomainError?error:error instanceof IntegrationError?new DomainError(error.code,409,error.message):error instanceof HttpException?new DomainError(error.getStatus()===404?'resource_not_found':'request_rejected',error.getStatus(),'The requested route or input is not accepted.'):pgCode==='22P02'?new DomainError('validation_failed',422,'A supplied identifier or value is invalid.'):pgCode==='23505'?new DomainError('resource_conflict',409,'This operation conflicts with an existing record.'):new DomainError('internal_error',500,'The operation could not be completed.');
  if(e.status===500)console.error(JSON.stringify({level:'error',code:e.code,type:error instanceof Error?error.name:'unknown'}));
  response.status(e.status).type('application/problem+json').json({code:e.code,message:e.message,messageKey:'errors.'+e.code,correlationId:randomUUID(),retriable:e.status===503});
}}
@Controller()
class PlatformController {
  constructor(@Inject('database')private readonly database:Database){}
  @Get('health') health(){return {status:'ok',mode:'sandbox'};}
  @Get('ready')async ready(){await this.database.query('SELECT 1');return {ready:true};}
  @Get('v1/operations/metrics')async operationMetrics(@Req()req:Request){return metrics.snapshot(await auth.actor(req));}
  @Post('v1/auth/challenge')challenge(@Body()body:unknown){return auth.challenge(requireObject(body));}
  @Post('v1/auth/verify')verify(@Body()body:unknown,@Res({passthrough:true})res:Response){return auth.verify(requireObject(body),res);}
  @Get('v1/session')session(@Req()req:Request){return auth.session(req);}
  @Get('v1/contexts')contexts(@Req()req:Request){return auth.session(req).then(x=>({items:x.contexts}));}
  @Post('v1/contexts')async context(@Req()req:Request,@Body()value:unknown){const a=await auth.actor(req,true);await auth.switchContext(a,text(requireObject(value),'contextId'));return auth.session(req);}
  @Post('v1/auth/logout')async logout(@Req()req:Request,@Res({passthrough:true})res:Response){await auth.logout(await auth.actor(req,true),res);return {loggedOut:true};}
  @Get('v1/sandbox/mfa')async mfa(@Req()req:Request){return auth.sandboxMfa(await auth.actor(req));}
  @Post('v1/auth/step-up')async stepUp(@Req()req:Request,@Body()body:unknown){await auth.stepUp(await auth.actor(req,true),requireObject(body));return {verified:true};}
  @Get('v1/catalog')async catalog(){return {items:business.catalog(),capabilities:await flags.values(),mode:'sandbox'};}
  @Get('v1/catalog/carriers')carriers(){return {items:['rest','soap','signed'].map(id=>({id,label:'بیمه‌گر آزمایشی '+id,synthetic:true,liveEnabled:false}))};}
  @Get('v1/catalog/carriers/:id')carrier(@Param('id')id:string){if(!['rest','soap','signed'].includes(id))throw new DomainError('resource_not_found',404,'Carrier not found.');return {id,label:'بیمه‌گر آزمایشی '+id,synthetic:true,description:'Fictional local contract simulator; no real insurer connectivity.'};}
  @Get('v1/products/:id/form')form(@Param('id')id:string){const p=business.product(id);return {product:p,schema:p.schema,syntheticExample:p.example};}
  @Get('v1/applications/:id')async application(@Req()req:Request,@Param('id')id:string){return business.get(await auth.actor(req),'applications',id);}
  @Post('v1/applications')async applicationCreate(@Req()req:Request,@Body()body:unknown){return business.execute(await auth.actor(req,true),'createApplication',requireObject(body),{idempotencyKey:key(req)});}
  @Post('v1/quotes')async quote(@Req()req:Request,@Body()value:unknown){const a=await auth.actor(req,true),body=requireObject(value);const r=await business.execute(a,'quoteApplication',{id:text(body,'applicationId'),...(body.carrierIds?{carrierIds:body.carrierIds}:{})},{idempotencyKey:key(req)});return this.quoteProjection(r);}
  @Get('v1/quotes/:id')async quoteGet(@Req()req:Request,@Param('id')id:string){return this.quoteProjection(await business.get(await auth.actor(req),'quote_sessions',id));}
  private quoteProjection(r:{id:string;state:string;data:Record<string,unknown>}){const rows=Array.isArray(r.data.quotes)?r.data.quotes:[];return {id:r.id,state:r.state,offers:rows.map(x=>{const row=requireObject(x),data=requireObject(row.data);return {id:row.id,...Object.fromEntries(['carrierId','productId','premium','expiresAt','coverages','synthetic'].map(k=>[k,data[k]])),carrierName:'بیمه‌گر آزمایشی '+String(data.carrierId)};}),partial:r.data.partial,failures:r.data.failures};}
  @Post('v1/orders')async orderCreate(@Req()req:Request,@Body()body:unknown){return commerce.create(await auth.actor(req,true),text(requireObject(body),'quoteId'),key(req));}
  @Get('v1/orders/:id')async order(@Req()req:Request,@Param('id')id:string){return commerce.order(await auth.actor(req),id);}
  @Post('v1/orders/:id/pay')async pay(@Req()req:Request,@Param('id')id:string){return commerce.pay(await auth.actor(req,true),id,key(req));}
  @Post('v1/sandbox/payments/:id/confirm')async confirm(@Req()req:Request,@Param('id')id:string){return commerce.confirmSandbox(await auth.actor(req,true),id);}
  @Post('v1/orders/:id/credit')async credit(@Req()req:Request,@Param('id')id:string,@Body()body:unknown){return commerce.requestCredit(await auth.actor(req,true),id,text(requireObject(body),'reason',1000),key(req));}
  @Post('v1/credit/:id/approve')async creditApprove(@Req()req:Request,@Param('id')id:string){const a=await auth.actor(req,true);await auth.requireStepUp(a);return commerce.approveCredit(a,id);}
  @Post('v1/orders/:id/refunds')async refund(@Req()req:Request,@Param('id')id:string,@Body()v:unknown){const b=requireObject(v);return commerce.requestRefund(await auth.actor(req,true),id,text(b,'amount'),text(b,'reason',1000),key(req));}
  @Post('v1/refunds/:id/approve')async refundApprove(@Req()req:Request,@Param('id')id:string){const a=await auth.actor(req,true);await auth.requireStepUp(a);await commerce.approveRefund(a,id);return {state:'paid',synthetic:true};}
  @Get('v1/policies')async policies(@Req()req:Request){const a=await auth.actor(req);authorize(a,'policies.read');const r=await this.database.query<{id:string}>('SELECT id FROM policies WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 100',[a.contextId]);return {items:await Promise.all(r.rows.map(row=>commerce.policy(a,row.id)))};}
  @Get('v1/policies/:id')async policy(@Req()req:Request,@Param('id')id:string){const p=await commerce.policy(await auth.actor(req),id);delete p.documentKey;return p;}
  @Get('v1/policies/:id/document')async document(@Req()req:Request,@Param('id')id:string,@Res()res:Response){const a=await auth.actor(req);authorize(a,'documents.read');const p=await commerce.policy(a,id),documentKey=String(p.documentKey??'');if(!/^[a-f0-9-]+\.pdf$/.test(documentKey))throw new DomainError('document_pending',404,'The policy document is not yet available.');res.type('application/pdf').setHeader('Content-Disposition','attachment; filename="policy.pdf"');res.send(await readFile(resolve(process.env.OBJECT_STORAGE_DIR??'.local/objects',documentKey)));}
  @Get('v1/business/operations')async operations(@Req()req:Request){const a=await auth.actor(req);return {items:businessOperations.filter(op=>a.permissions.includes('business.'+op)).map(operationId=>({id:operationId,operationId})),kinds:businessKinds};}
  @Get('v1/finance/balances')async financeBalances(@Req()req:Request){return finance.balances(await auth.actor(req));}
  @Get('v1/finance/entries')async financeEntries(@Req()req:Request,@Query()q:Record<string,string>){return finance.entries(await auth.actor(req),{...(q.cursor?{cursor:q.cursor}:{}),...(q.limit?{limit:Number(q.limit)}:{})});}
  @Get('v1/finance/installments')async financeInstallments(@Req()req:Request,@Query()q:Record<string,string>){return finance.installments(await auth.actor(req),{...(q.cursor?{cursor:q.cursor}:{})});}
  @Get('v1/finance/commissions')async financeCommissions(@Req()req:Request,@Query()q:Record<string,string>){return finance.commissions(await auth.actor(req),{...(q.cursor?{cursor:q.cursor}:{})});}
  @Get('v1/finance/payouts')async financePayouts(@Req()req:Request,@Query()q:Record<string,string>){return finance.payouts(await auth.actor(req),{...(q.cursor?{cursor:q.cursor}:{})});}
  @Get('v1/finance/payout-review')async financePayoutReview(@Req()req:Request,@Query()q:Record<string,string>){return finance.payoutReviewQueue(await auth.actor(req),{purpose:q.purpose??'',...(q.cursor?{cursor:q.cursor}:{})});}
  @Get('v1/finance/references')async financeReferences(@Req()req:Request){return finance.references(await auth.actor(req));}
  @Get('v1/finance/reconciliation')async financeReconciliation(@Req()req:Request){return finance.reconciliation(await auth.actor(req));}
  @Get('v1/finance/resources/:kind')async financeResources(@Req()req:Request,@Param('kind')kind:string,@Query()q:Record<string,string>){if(!['wallet_reservation','wallet_spend','wallet_refund','funding','installment','commission','payout','invoice_payment','installment_payment'].includes(kind))throw new DomainError('resource_not_found',404,'Unknown financial resource kind.');return finance.list(await auth.actor(req),kind,{...(q.cursor?{cursor:q.cursor}:{})});}
  @Get('v1/finance/resources/:kind/:id')async financeResource(@Req()req:Request,@Param('kind')kind:string,@Param('id')id:string){const r=await finance.get(await auth.actor(req),id);if(r.kind!==kind)throw new DomainError('resource_not_found',404,'Financial resource not found.');return r;}
  @Post('v1/finance/:operation')async financeExecute(@Req()req:Request,@Param('operation')operation:string,@Body()body:unknown){const actor=await auth.actor(req,true);if(operation==='refundWalletSpend')throw new DomainError('refund_approval_not_configured',409,'An independent approved refund reference must be consumed transactionally before this action can be exposed.');if(['approvePayout','dispatchPayout','reconcilePayout','reverseCommission'].includes(operation))await auth.requireStepUp(actor);return finance.execute(actor,operation,body,{idempotencyKey:key(req),expectedVersion:version(req)});}
  @Get('v1/sandbox/finance/intents')async sandboxFinanceIntents(@Req()req:Request){return financePorts.intents(await auth.actor(req));}
  @Post('v1/sandbox/finance/intents')async sandboxFinanceIntent(@Req()req:Request,@Body()body:unknown){return financePorts.createIntent(await auth.actor(req,true),body,key(req));}
  @Post('v1/sandbox/finance/intents/:id/confirm')async sandboxFinanceConfirm(@Req()req:Request,@Param('id')id:string){return financePorts.confirmIntent(await auth.actor(req,true),id);}
  @Get('v1/business/:kind')async list(@Req()req:Request,@Param('kind')kind:string,@Query()q:Record<string,string>){return business.list(await auth.actor(req),kind,{limit:Math.min(Number(q.limit)||25,100),...(q.cursor?{cursor:q.cursor}:{}),...(q.search?{search:q.search}:{}),...(q.state?{state:q.state}:{})});}
  @Get('v1/business/:kind/:id')async get(@Req()req:Request,@Param('kind')kind:string,@Param('id')id:string,@Query('purpose')purpose?:string){return business.get(await auth.actor(req),kind,id,purpose);}
  @Get('v1/evidence/:id')async evidence(@Req()req:Request,@Param('id')id:string,@Query('purpose')purpose:string|undefined,@Res()res:Response){const file=await business.downloadEvidence(await auth.actor(req),id,purpose);res.type(file.mimeType).setHeader('Content-Disposition','attachment; filename="evidence"');res.send(file.bytes);}
  @Post('v1/business/:operation')async execute(@Req()req:Request,@Param('operation')operation:string,@Body()body:unknown){return business.execute(await auth.actor(req,true),operation,body,{idempotencyKey:key(req),expectedVersion:version(req)});}
  @Get('v1/flags')async flagList(@Req()req:Request){return flags.list(await auth.actor(req));}
  @Get('v1/controls/catalog')async controlsCatalog(@Req()req:Request){const actor=await auth.actor(req);authorize(actor,controlPermissions.read);if(actor.contextKind!=='platform')throw new DomainError('forbidden_action',403,'Platform configuration context required.');return{...controls.catalog(),runtimeEnforcement:{admissionOperations:['order.create','credit.approve','wallet.reserve','wallet.commit','sandbox.payment.verify'],capabilities:['COM-01','ORG-03'],otherCapabilities:'registered-and-previewable; runtime guards incomplete',workerQuarantine:'legacy global guard; scoped binding incomplete'}};}
  @Get('v1/controls/current')async controlsCurrent(@Req()req:Request){return controls.current(await auth.actor(req));}
  @Get('v1/controls/rules')async controlsRules(@Req()req:Request,@Query()q:Record<string,string>){return controls.listRules(await auth.actor(req),{...(q.cursor?{cursor:q.cursor}:{}),...(q.limit?{limit:Number(q.limit)}:{})});}
  @Post('v1/controls/proposals')async controlsPropose(@Req()req:Request,@Body()body:unknown){const actor=await auth.actor(req,true);await auth.requireStepUp(actor);return controls.propose(actor,body,{idempotencyKey:key(req),expectedRevision:version(req)??0});}
  @Post('v1/controls/proposals/:id/preview')async controlsPreview(@Req()req:Request,@Param('id')id:string,@Body()body:unknown){const actor=await auth.actor(req,true);await auth.requireStepUp(actor);const input=requireObject(body);if(Object.keys(input).some(k=>k!=='samples'))throw new DomainError('validation_failed',422,'Only explicit preview samples are accepted.');return controls.preview(actor,id,input.samples,{idempotencyKey:key(req)});}
  @Post('v1/controls/proposals/:id/approve')async controlsApprove(@Req()req:Request,@Param('id')id:string,@Body()body:unknown){const actor=await auth.actor(req,true);await auth.requireStepUp(actor);const input=requireObject(body);if(Object.keys(input).some(k=>k!=='reason'))throw new DomainError('validation_failed',422,'Only an approval reason is accepted.');return controls.approve(actor,id,{idempotencyKey:key(req),expectedRevision:version(req)??0,reason:text(input,'reason',1000)});}
  @Post('v1/controls/rollback')async controlsRollback(@Req()req:Request,@Body()body:unknown){const actor=await auth.actor(req,true);await auth.requireStepUp(actor);const input=requireObject(body);if(Object.keys(input).some(k=>!['targetRevision','reason'].includes(k)))throw new DomainError('validation_failed',422,'Use a historical revision and reason.');return controls.proposeRollback(actor,Number(input.targetRevision),text(input,'reason',1000),{idempotencyKey:key(req),expectedRevision:version(req)??0});}
  @Post('v1/flags/proposals')async flagPropose(@Req()req:Request,@Body()value:unknown){const a=await auth.actor(req,true),b=requireObject(value);await auth.requireStepUp(a);if(typeof b.enabled!=='boolean'||!Number.isInteger(b.revision))throw new DomainError('validation_failed',422,'A boolean and current revision are required.');return flags.propose(a,text(b,'key'),b.enabled,Number(b.revision),text(b,'reason',1000));}
  @Post('v1/flags/proposals/:id/approve')async flagApprove(@Req()req:Request,@Param('id')id:string){const a=await auth.actor(req,true);await auth.requireStepUp(a);await flags.approve(a,id);return {approved:true};}
  @Get('v1/integrations/partners')async partners(@Req()req:Request){authorize(await auth.actor(req),'integrations.read');return {items:['rest','soap','signed'].map(id=>({id,label:'Fictional '+id,environment:'sandbox',capabilities:gateway.getAdapter(id as 'rest'|'soap'|'signed').capabilities,status:'configured',liveEnabled:false}))};}
  @Get('v1/integrations/connections')async connections(@Req()req:Request){return {items:await studio.list(await auth.actor(req))};}
  @Get('v1/integrations/templates/:id')async connectionTemplate(@Req()req:Request,@Param('id')id:string){const a=await auth.actor(req);authorize(a,'integrations.configure');if(id!=='rest'&&id!=='soap'&&id!=='signed')throw new DomainError('resource_not_found',404,'Carrier template not found.');return {config:{baseUrl:process.env.CARRIER_BASE_URL??'http://127.0.0.1:3100',secretRef:'secret://sandbox/'+id+'-v1',products:['PRD-01','PRD-07','PRD-24'],channels:['b2c','corporate','commercial','reseller','b2b2c'],capabilities:Object.fromEntries((id==='signed'?['quote','submit','retrieve_document','callback']:['quote','submit','status','retrieve_document']).map(k=>[k,true])),mapping:defaultPartnerMapping(id)}};}
  @Post('v1/integrations/connections')async connectionPropose(@Req()req:Request,@Body()body:unknown){const a=await auth.actor(req,true);await auth.requireStepUp(a);return studio.propose(a,body);}
  @Post('v1/integrations/connections/:id/validate')async connectionValidate(@Req()req:Request,@Param('id')id:string,@Body()body:unknown){const a=await auth.actor(req,true);await auth.requireStepUp(a);return studio.validate(a,id,Number(requireObject(body).revision));}
  @Post('v1/integrations/connections/:id/approve')async connectionApprove(@Req()req:Request,@Param('id')id:string,@Body()body:unknown){const a=await auth.actor(req,true);await auth.requireStepUp(a);const b=requireObject(body);return studio.approve(a,id,Number(b.revision),text(b,'reason',1000));}
  @Post('v1/integrations/connections/:id/state')async connectionState(@Req()req:Request,@Param('id')id:string,@Body()body:unknown){const a=await auth.actor(req,true);await auth.requireStepUp(a);const b=requireObject(body),state=b.state;if(state!=='disabled'&&state!=='degraded'&&state!=='suspended')throw new DomainError('validation_failed',422,'Invalid connection state.');return studio.setState(a,id,Number(b.revision),state,text(b,'reason',1000));}
  @Get('v1/integrations/submissions')async submissions(@Req()req:Request){const a=await auth.actor(req);authorize(a,'integrations.read');return {items:(await db.query('SELECT s.id,s.order_id,s.carrier_id,s.state,s.external_ref,s.updated_at FROM submissions s JOIN orders o ON o.id=s.order_id WHERE ($1=true OR o.tenant_id=$2 OR o.carrier_id=$3) ORDER BY s.updated_at DESC LIMIT 100',[a.contextKind==='platform',a.contextId,a.contextKind==='carrier'?'rest':'__none__'])).rows};}
  @Get('v1/integrations/exceptions')async exceptions(@Req()req:Request){const a=await auth.actor(req);authorize(a,'integrations.read');return {items:(await db.query("SELECT id,aggregate_id,state,attempts,last_error,created_at FROM outbox WHERE state IN('dead','unknown') AND ($1=true OR tenant_id=$2) ORDER BY created_at LIMIT 100",[a.contextKind==='platform',a.contextId])).rows};}
  @Post('v1/integrations/submissions/:id/reconcile')async reconcile(@Req()req:Request,@Param('id')id:string,@Body()body:unknown){const a=await auth.actor(req,true);authorize(a,'integrations.reconcile');const reason=text(requireObject(body),'reason',1000);if(reason.length<10)throw new DomainError('reason_required',422,'Record a reconciliation reason.');await commerce.order(a,id);const result=await worker.reconcile(id);await db.query('INSERT INTO audit(id,actor_id,tenant_id,action,resource_id,reason) VALUES($1,$2,$3,\'submission.reconciled\',$4,$5)',[randomUUID(),a.userId,a.contextId,id,reason]);return result;}
  @Post('callbacks/sim-signed')callback(@Req()req:Request&{rawBody?:Buffer}){if(!req.rawBody||!isUtf8(req.rawBody))throw new DomainError('raw_body_required',400,'Exact UTF-8 signed bytes are required.');return worker.observeCallback(req.rawBody.toString('utf8'),Object.fromEntries(Object.entries(req.headers).map(([k,v])=>[k,Array.isArray(v)?v[0]:v])),'/callbacks/sim-signed');}
  @Get('v1/dashboard/:surface')async dashboard(@Req()req:Request,@Param('surface')surface:string,@Query()q:Record<string,string>){
    const a=await auth.actor(req);const allowed:Record<string,string[]>={customer:['customer'],corporate:['buyer','checker'],beneficiary:['employee'],seller:['seller'],carrier:['carrier'],admin:['admin','checker'],operations:['operator']};
    if(!allowed[surface]?.some(role=>a.roles.includes(role)))throw new DomainError('forbidden_action',403,'This dashboard is outside the active role.');
    const rows:Record<string,unknown>[]=[];const section=q.section??'orders';
    const sectionKind:Record<string,string>={quotes:'quotes',claims:'claims',support:'support',people:'profiles',enrollment:'enrollment',vehicles:'vehicles',content:'content',campaigns:'campaigns',bookings:'bookings',parts:'parts',referrals:'referrals',rewards:'rewards',providers:'providers',listings:'listings',changes:'service_requests'};
    if(sectionKind[section]){const list=await business.list(a,sectionKind[section]!,{limit:25,...(q.search?{search:q.search}:{}),...(q.cursor?{cursor:q.cursor}:{})});return {surface,summary:[],rows:list.items.map(r=>({id:r.id,title:String(r.data.label??r.data.title??r.kind),state:r.state,updatedAt:r.updatedAt,version:r.version})),actions:[],pageInfo:{hasMore:!!list.nextCursor,nextCursor:list.nextCursor}};}
    if(section==='policies'){const policies=await db.query<{id:string;reference:string;state:string;created_at:Date}>('SELECT id,reference,state,created_at FROM policies WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 25',[a.contextId]);for(const p of policies.rows)rows.push({id:p.id,title:p.reference,state:p.state,updatedAt:p.created_at,href:'/account/policies/'+p.id});}
    else {const orders=await db.query<OrderSummary>('SELECT id,product_id,state,payment_state,issuance_state,quote_snapshot,created_at FROM orders WHERE ($1=true OR tenant_id=$2) ORDER BY created_at DESC LIMIT 25',[a.contextKind==='platform',a.contextId]);for(const o of orders.rows)rows.push({id:o.id,title:business.product(o.product_id).title,state:o.state,paymentState:o.payment_state,issuanceState:o.issuance_state,amount:o.quote_snapshot.premium,updatedAt:o.created_at,href:'/orders/'+o.id});}
    return {surface,summary:[{label:'سوابق قابل دسترسی',value:rows.length}],rows,actions:[],pageInfo:{hasMore:false,nextCursor:null}};
  }
}
interface OrderSummary extends Record<string,unknown>{id:string;product_id:string;state:string;payment_state:string;issuance_state:string;quote_snapshot:Record<string,unknown>;created_at:Date}
@Module({controllers:[PlatformController],providers:[{provide:'database',useValue:db}]})class AppModule{}
async function main(){const app=await NestFactory.create(AppModule,{rawBody:true,logger:['error','warn']});app.useGlobalFilters(new Errors());app.use((req:Request,res:Response,next:()=>void)=>{res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');const start=performance.now();res.on('finish',()=>{const route=String(req.route?.path??'unmatched'),durationMs=Math.round((performance.now()-start)*100)/100;metrics.observe(req.method,route,res.statusCode,durationMs);console.log(JSON.stringify({level:'info',method:req.method,route,status:res.statusCode,durationMs}));});next();});app.enableShutdownHooks();await app.listen(Number(process.env.API_PORT??3001),process.env.API_HOST??'127.0.0.1');}
void main();
