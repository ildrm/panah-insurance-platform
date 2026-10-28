import {randomBytes,randomInt,randomUUID,createHash,createHmac,timingSafeEqual} from 'node:crypto';
import type {Request,Response} from 'express';
import {Database} from '@st/database';
import {DomainError,type Actor,type Clock,systemClock,text} from '@st/contracts';

export const digest=(v:string):string=>createHash('sha256').update(v).digest('hex');
export function totp(secret:string,now:Date):string {
  const buffer=Buffer.alloc(8);buffer.writeBigUInt64BE(BigInt(Math.floor(now.getTime()/30000)));
  const h=createHmac('sha1',Buffer.from(secret,'hex')).update(buffer).digest();const offset=(h[h.length-1]??0)&15;
  return ((h.readUInt32BE(offset)&0x7fffffff)%1000000).toString().padStart(6,'0');
}
const same=(a:string,b:string):boolean=>a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export class AuthService {
  constructor(private readonly db:Database,private readonly clock:Clock=systemClock){}
  async challenge(input:Record<string,unknown>):Promise<Record<string,unknown>> {
    const contact=text(input,'contact',40).replace(/[\s()-]/g,'');
    if(!/^\+[1-9][0-9]{7,14}$/.test(contact))throw new DomainError('invalid_contact',422,'Use an international phone number.');
    const user=(await this.db.query<{id:string;mfa_secret:string|null}>('SELECT id,mfa_secret FROM users WHERE contact=$1',[contact])).rows[0];
    const recent=await this.db.query<{count:string}>('SELECT count(*) FROM otp_challenges WHERE contact_hash=$1 AND created_at>$2',[digest(contact),new Date(this.clock.now().getTime()-60000)]);
    if(Number(recent.rows[0]?.count??0)>=3)throw new DomainError('rate_limited',429,'Wait before requesting another challenge.');
    const id=randomUUID(),code=randomInt(100000,1000000).toString();
    await this.db.query('INSERT INTO otp_challenges(id,user_id,contact_hash,code_hash,expires_at) VALUES($1,$2,$3,$4,$5)',[id,user?.id??null,digest(contact),digest(code),new Date(this.clock.now().getTime()+300000)]);
    return {challengeId:id,expiresIn:300,mfaRequired:!!user?.mfa_secret,sandboxCode:code,...(user?.mfa_secret?{sandboxMfaCode:totp(user.mfa_secret,this.clock.now())}:{})};
  }
  async verify(input:Record<string,unknown>,res:Response):Promise<Record<string,unknown>> {
    const id=text(input,'challengeId'),code=text(input,'code',8);
    const result=await this.db.transaction(async tx=>{
      const c=(await tx.query<{id:string;user_id:string|null;code_hash:string;expires_at:Date;attempts:number;consumed_at:Date|null}>('SELECT * FROM otp_challenges WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if(!c||c.consumed_at||c.attempts>=5||c.expires_at<=this.clock.now())return null;
      await tx.query('UPDATE otp_challenges SET attempts=attempts+1 WHERE id=$1',[id]);
      if(!same(c.code_hash,digest(code))||!c.user_id)return null;
      const user=(await tx.query<{id:string;permission_revision:number;mfa_secret:string|null}>('SELECT id,permission_revision,mfa_secret FROM users WHERE id=$1',[c.user_id])).rows[0];
      if(!user)return null;
      if(user.mfa_secret && ![-1,0,1].some(shift=>same(totp(user.mfa_secret!,new Date(this.clock.now().getTime()+shift*30000)),String(input.mfaCode??''))))return null;
      const membership=(await tx.query<{context_id:string}>(`SELECT m.context_id FROM memberships m JOIN contexts c ON c.id=m.context_id WHERE m.user_id=$1 AND active ORDER BY CASE WHEN 'admin'=ANY(m.roles) THEN 0 WHEN 'buyer'=ANY(m.roles) OR 'seller'=ANY(m.roles) OR 'operator'=ANY(m.roles) OR 'carrier'=ANY(m.roles) OR 'checker'=ANY(m.roles) THEN 1 WHEN c.kind='personal' THEN 2 ELSE 3 END LIMIT 1`,[user.id])).rows[0];
      if(!membership)return null;
      const token=randomBytes(32).toString('base64url'),csrf=randomBytes(24).toString('base64url'),sid=randomUUID();
      await tx.query('UPDATE otp_challenges SET consumed_at=$2 WHERE id=$1',[id,this.clock.now()]);
      await tx.query('INSERT INTO sessions(id,token_hash,user_id,context_id,csrf_hash,csrf_token,permission_revision,expires_at,step_up_until) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[sid,digest(token),user.id,membership.context_id,digest(csrf),csrf,user.permission_revision,new Date(this.clock.now().getTime()+3600000),user.mfa_secret?new Date(this.clock.now().getTime()+900000):null]);
      return {token,csrf};
    });
    if(!result)throw new DomainError('invalid_challenge',401,'The challenge or factor is invalid or expired.');
    res.cookie('st_session',result.token,{httpOnly:true,secure:process.env.APP_MODE==='production',sameSite:'lax',maxAge:3600000,path:'/'});
    return {authenticated:true,csrfToken:result.csrf};
  }
  private token(req:Request):string {
    const bearer=req.header('authorization');if(bearer?.startsWith('Bearer '))return bearer.slice(7);
    const item=req.header('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith('st_session='));return item?decodeURIComponent(item.slice(11)):'';
  }
  async actor(req:Request,mutate=false):Promise<Actor> {
    const token=this.token(req);if(!token)throw new DomainError('unauthenticated',401,'Sign in to continue.');
    const row=(await this.db.query<{id:string;user_id:string;context_id:string;permission_revision:number;current_revision:number;kind:Actor['contextKind'];roles:string[];permissions:string[];csrf_hash:string;expires_at:Date}>(`SELECT s.*,u.permission_revision AS current_revision,c.kind,m.roles,m.permissions FROM sessions s JOIN users u ON u.id=s.user_id JOIN memberships m ON m.user_id=s.user_id AND m.context_id=s.context_id AND m.active JOIN contexts c ON c.id=s.context_id WHERE token_hash=$1 AND s.expires_at>$2`,[digest(token),this.clock.now()])).rows[0];
    if(!row||row.permission_revision!==row.current_revision)throw new DomainError('session_revoked',401,'Sign in again after access changed.');
    if(mutate&&!req.header('authorization')){
      if(!same(row.csrf_hash,digest(req.header('x-csrf-token')??'')))throw new DomainError('csrf_invalid',403,'Refresh this page before continuing.');
      const origin=req.header('origin'),allowedOrigins=new Set([process.env.WEB_ORIGIN??'http://127.0.0.1:3000']);
      if((process.env.APP_MODE??'sandbox')==='sandbox'){allowedOrigins.add('http://127.0.0.1:3000');allowedOrigins.add('http://localhost:3000');}
      if(origin&&!allowedOrigins.has(origin))throw new DomainError('origin_forbidden',403,'The request origin is not permitted.');
    }
    return {userId:row.user_id,contextId:row.context_id,contextKind:row.kind,roles:row.roles,permissions:row.permissions,sessionId:row.id,permissionRevision:row.current_revision};
  }
  async session(req:Request):Promise<Record<string,unknown>> {
    const actor=await this.actor(req);const session=(await this.db.query<{csrf_token:string}>('SELECT csrf_token FROM sessions WHERE id=$1',[actor.sessionId])).rows[0];
    const contexts=(await this.db.query<{id:string;label:string;kind:string}>('SELECT c.id,c.label,c.kind,m.roles FROM contexts c JOIN memberships m ON c.id=m.context_id WHERE m.user_id=$1 AND m.active ORDER BY c.label',[actor.userId])).rows;
    const user=(await this.db.query<{display_name:string}>('SELECT display_name FROM users WHERE id=$1',[actor.userId])).rows[0];
    return {actor:{...actor,label:user?.display_name},csrfToken:session?.csrf_token,contexts};
  }
  async switchContext(actor:Actor,id:string):Promise<void>{
    const row=await this.db.query('SELECT 1 FROM memberships WHERE user_id=$1 AND context_id=$2 AND active',[actor.userId,id]);
    if(!row.rowCount)throw new DomainError('context_forbidden',403,'You do not belong to this context.');
    await this.db.query('UPDATE sessions SET context_id=$2,step_up_until=NULL WHERE id=$1',[actor.sessionId,id]);
  }
  async requireStepUp(actor:Actor):Promise<void>{
    const s=(await this.db.query<{step_up_until:Date|null}>('SELECT step_up_until FROM sessions WHERE id=$1',[actor.sessionId])).rows[0];
    if(!s?.step_up_until||s.step_up_until<=this.clock.now())throw new DomainError('step_up_required',403,'Verify the second factor again for this privileged action.');
  }
  async sandboxMfa(actor:Actor):Promise<{sandboxMfaCode:string}>{
    const user=(await this.db.query<{mfa_secret:string|null}>('SELECT mfa_secret FROM users WHERE id=$1',[actor.userId])).rows[0];
    if(!user?.mfa_secret)throw new DomainError('factor_not_enrolled',403,'No privileged factor is enrolled.');return {sandboxMfaCode:totp(user.mfa_secret,this.clock.now())};
  }
  async stepUp(actor:Actor,input:Record<string,unknown>):Promise<void>{
    const expected=(await this.sandboxMfa(actor)).sandboxMfaCode;if(!same(expected,text(input,'mfaCode',8)))throw new DomainError('invalid_factor',403,'Second factor is invalid.');
    await this.db.query('UPDATE sessions SET step_up_until=$2 WHERE id=$1',[actor.sessionId,new Date(this.clock.now().getTime()+900000)]);
  }
  async logout(actor:Actor,res:Response):Promise<void>{await this.db.query('DELETE FROM sessions WHERE id=$1',[actor.sessionId]);res.clearCookie('st_session',{path:'/'});}
}
