import {randomBytes} from 'node:crypto';
import {Database} from '@st/database';
async function main():Promise<void>{
const db=new Database();const id=(n:number)=>`00000000-0000-4000-8000-${n.toString().padStart(12,'0')}`;
const customerOps=['saveProfile','createApplication','saveApplicationAnswers','quoteApplication','createClaim','requestPolicyChange','startRenewal','createSupportTicket','replySupportTicket','createReferral','redeemReward','saveVehicle','subscribeVehicleAlerts','requestVehicleInquiry','bookMaintenance','cancelBooking','reserveParts','requestPartsReturn','cancelPartsOrder','createListing','placeAuctionBid','createFinancialReferral','reservePromotion','createInspection','uploadEvidence','submitInspectionEvidence','createUnderwritingCase','submitUnderwritingEvidence'];
const financeCustomer=['read','fundWallet','grantPromotion','reserveWalletSpend','commitWalletSpend','releaseWalletSpend','createInstallments','allocateInstallmentPayment','allocateInvoicePayment','accrueCommission','vestCommission','requestPayout','cancelPayout'];
const base=['business.read','orders.read','orders.create','payments.create','policies.read','documents.read','refund.request',...customerOps.map(x=>'business.'+x),...financeCustomer.map(x=>'finance.'+x)];
const users=[['مشتری آزمایشی','customer'],['خریدار سازمانی','buyer'],['کارمند آزمایشی','employee'],['فروشنده آزمایشی','seller'],['کارشناس بیمه‌گر','carrier'],['مدیر پلتفرم','admin'],['کارشناس عملیات','operator'],['تأییدکننده مستقل','checker'],['مشتری سازمان دوم','customer'],['خریدار سازمان دوم','buyer']] as const;
try{await db.transaction(async tx=>{
  for(const [n,label,kind] of [[100,'سازمان آفتاب','organization'],[101,'سازمان باران','organization'],[110,'بیمه‌گر REST آزمایشی','carrier'],[120,'شبکه فروش آزمایشی','seller'],[130,'مدیریت پلتفرم','platform']] as const)await tx.query('INSERT INTO contexts(id,label,kind) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING',[id(n),label,kind]);
  for(const [index,[label,role]] of users.entries()){
    const uid=id(index+1),privileged=['admin','operator','checker','carrier'].includes(role);
    await tx.query('INSERT INTO users(id,contact,display_name,mfa_secret) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING',[uid,'+9890000000'+String(index+1).padStart(2,'0'),label,privileged?randomBytes(20).toString('hex'):null]);
    await tx.query('INSERT INTO contexts(id,label,kind) VALUES($1,$2,\'personal\') ON CONFLICT(id) DO NOTHING',[uid,'حساب شخصی — '+label]);
    await tx.query('INSERT INTO memberships(user_id,context_id,roles,permissions) VALUES($1,$1,$2,$3) ON CONFLICT(user_id,context_id) DO UPDATE SET roles=excluded.roles,permissions=excluded.permissions',[uid,['customer'],base]);
    let context:number|undefined;let grants:string[]=[];
    if(role==='buyer'){context=index===9?101:100;grants=[...base,'credit.request','business.createEnrollmentBatch','business.applyEnrollmentBatch'];}
    if(role==='employee'||(role==='customer'&&index===0)){context=100;grants=[...base];}
    if(role==='customer'&&index===8){context=101;grants=[...base];}
    if(role==='seller'){context=120;grants=[...base,'seller.read'];}
    if(role==='carrier'){context=110;grants=['orders.read','policies.read','integrations.read','carrier.rest','business.read','claims.review','claims.carrier.rest','business.requestClaimEvidence','business.decideClaim'];}
    if(role==='admin'){context=130;grants=['feature.read','feature.propose','integrations.read','integrations.reconcile','orders.read','policies.read','business.read','business.manage','audit.read','members.manage',...['publishContent','createCampaign','createReward','registerMaintenanceProvider','publishPart','accrueLoyalty','confirmLoyalty','qualifyReferral'].map(x=>'business.'+x)];}
    if(role==='operator'){context=130;grants=['integrations.read','integrations.reconcile','orders.read','policies.read','business.read','business.manage','claims.review','claims.tenant.'+id(100),'business.requestClaimEvidence','business.decideClaim','business.resolveSupportTicket','business.completeBooking','business.fulfillParts','business.approvePartsReturn','refund.approve','audit.read'];}
    if(role==='checker'){context=130;grants=['feature.read','feature.approve','integrations.read','orders.read','policies.read','refund.approve','audit.read'];await tx.query('INSERT INTO memberships(user_id,context_id,roles,permissions) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[uid,id(100),['checker'],['business.read','business.approveEnrollmentBatch','credit.approve','orders.read','policies.read']]);}
    if(role==='admin')grants.push('integrations.configure','integrations.validate');
    if(role==='admin')grants.push('finance.read','finance.reconcile','finance.manage','finance.manage.all','finance.dispatchPayout','finance.reconcilePayout','finance.reverseCommission');
    if(role==='checker')grants.push('finance.read','finance.manage','finance.manage.all','finance.approvePayout');
    if(role==='checker')grants.push('integrations.approve');
    if(role==='operator')grants.push('evidence.review','evidence.tenant.'+id(100),'business.reviewInspection','business.reviewUnderwriting');
    if(role==='operator'||role==='admin')grants.push('operations.metrics.read');
    if(role==='admin')grants.push('feature.CHN-04.read','feature.CHN-04.proposeScopedAvailability','feature.CHN-04.previewFeatureDependencies','feature.CHN-04.rollbackFeatureChange','feature.CHN-04.applySecurityQuarantine');
    if(role==='checker')grants.push('feature.CHN-04.read','feature.CHN-04.previewFeatureDependencies','feature.CHN-04.approveFeatureChange','feature.CHN-04.approveSecurityQuarantine');
    if(context!==undefined)await tx.query('INSERT INTO memberships(user_id,context_id,roles,permissions) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,context_id) DO UPDATE SET roles=excluded.roles,permissions=excluded.permissions',[uid,id(context),[role],grants]);
  }
  for(const [key,enabled,mandatory] of [['sales.b2c',true,false],['sales.b2b',true,false],['sales.b2b.corporate',true,false],['sales.b2b.commercial',true,false],['sales.b2b.reseller',true,false],['sales.b2b.b2b2c',true,false],['servicing.enabled',true,true],['partner_delivery.enabled',true,false],['security.quarantine',false,false],['foundation.authorization',true,true],['foundation.audit',true,true]] as const)await tx.query('INSERT INTO feature_controls(key,enabled,mandatory) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[key,enabled,mandatory]);
  await tx.query('INSERT INTO credit_accounts(tenant_id,credit_limit) VALUES($1,$2) ON CONFLICT DO NOTHING',[id(100),'100000000']);
});console.log('Synthetic local accounts and controls seeded; no messages or live operations sent.');}finally{await db.close();}

}
void main();
