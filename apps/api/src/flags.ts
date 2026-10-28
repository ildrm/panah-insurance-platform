import {randomUUID} from 'node:crypto';
import {Database,type SqlClient} from '@st/database';
import {DomainError,authorize,type Actor,type Channel} from '@st/contracts';
export class FeatureService {
  constructor(private readonly db:Database){}
  async values():Promise<Record<string,boolean>>{const r=await this.db.query<{key:string;enabled:boolean}>('SELECT key,enabled FROM feature_controls ORDER BY key');return Object.fromEntries(r.rows.map(x=>[x.key,x.enabled]));}
  async assertSales(tx:SqlClient,channel:Channel):Promise<number>{
    const rows=(await tx.query<{key:string;enabled:boolean;revision:number}>('SELECT key,enabled,revision FROM feature_controls ORDER BY key FOR SHARE')).rows;
    const controls=Object.fromEntries(rows.map(r=>[r.key,r]));
    if(controls['security.quarantine']?.enabled)throw new DomainError('security_quarantine',409,'This operation is temporarily quarantined.');
    const required=channel==='b2c'?['sales.b2c']:['sales.b2b','sales.b2b.'+channel];
    if(required.some(k=>!controls[k]?.enabled))throw new DomainError('mode_disabled',409,'New sales are disabled for this channel.');
    return Math.max(...rows.map(r=>r.revision));
  }
  async list(actor:Actor):Promise<unknown>{authorize(actor,'feature.read');return {items:(await this.db.query('SELECT * FROM feature_controls ORDER BY key')).rows,proposals:(await this.db.query("SELECT * FROM feature_proposals WHERE state='proposed' ORDER BY created_at DESC LIMIT 50")).rows};}
  async propose(actor:Actor,key:string,enabled:boolean,revision:number,reason:string):Promise<{id:string}>{
    authorize(actor,'feature.propose');if(reason.length<10)throw new DomainError('reason_required',422,'Explain the change.');
    const control=(await this.db.query<{mandatory:boolean}>('SELECT mandatory FROM feature_controls WHERE key=$1',[key])).rows[0];
    if(!control)throw new DomainError('resource_not_found',404,'Unknown control.');if(control.mandatory&&!enabled)throw new DomainError('mandatory_foundation',422,'Mandatory foundations cannot be disabled.');
    const id=randomUUID();await this.db.query('INSERT INTO feature_proposals(id,key,enabled,maker_id,expected_revision,reason) VALUES($1,$2,$3,$4,$5,$6)',[id,key,enabled,actor.userId,revision,reason]);return {id};
  }
  async approve(actor:Actor,id:string):Promise<void>{
    authorize(actor,'feature.approve');await this.db.transaction(async tx=>{
      const p=(await tx.query<{key:string;enabled:boolean;maker_id:string;expected_revision:number;state:string;reason:string}>('SELECT * FROM feature_proposals WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if(!p)throw new DomainError('resource_not_found',404,'Proposal not found.');if(p.state!=='proposed')return;
      if(p.maker_id===actor.userId)throw new DomainError('maker_checker_required',403,'A different authorized checker must approve.');
      const result=await tx.query('UPDATE feature_controls SET enabled=$2,revision=revision+1,updated_at=now() WHERE key=$1 AND revision=$3 AND (NOT mandatory OR $2=true)',[p.key,p.enabled,p.expected_revision]);
      if(!result.rowCount)throw new DomainError('version_conflict',409,'Control changed; create a new proposal.');
      await tx.query("UPDATE feature_proposals SET state='approved',checker_id=$2 WHERE id=$1",[id,actor.userId]);
      await tx.query('INSERT INTO audit(id,actor_id,tenant_id,action,resource_id,reason,data) VALUES($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),actor.userId,actor.contextId,'feature.approved',id,p.reason,JSON.stringify({key:p.key,enabled:p.enabled})]);
    });
  }
}
