import {monitorEventLoopDelay} from 'node:perf_hooks';
import {DomainError,authorize,type Actor} from '@st/contracts';
import type {Database} from '@st/database';
const buckets=[5,10,25,50,100,250,500,1000,2500,5000,10000];
interface Series {count:number;errors:number;sumMs:number;le:number[]}
export class OperationalMetrics {
  private readonly series=new Map<string,Series>();
  private readonly startedAt=new Date().toISOString();
  private readonly loop=monitorEventLoopDelay({resolution:20});
  constructor(private readonly db:Database){this.loop.enable();}
  observe(method:string,route:string,status:number,durationMs:number){const key=method+' '+route;let value=this.series.get(key);if(!value){if(this.series.size>=512)return;value={count:0,errors:0,sumMs:0,le:buckets.map(()=>0)};this.series.set(key,value);}value.count++;value.errors+=status>=500?1:0;value.sumMs+=durationMs;for(const[index,bound]of buckets.entries())if(durationMs<=bound)value.le[index]=(value.le[index]??0)+1;}
  async snapshot(actor:Actor){authorize(actor,'operations.metrics.read');if(actor.contextKind!=='platform')throw new DomainError('forbidden_action',403,'Platform operations context is required.');
    const outbox=(await this.db.query("SELECT event_type,state,count(*)::text AS count,COALESCE(EXTRACT(EPOCH FROM now()-min(created_at)),0)::text AS oldest_age_seconds FROM outbox GROUP BY event_type,state ORDER BY event_type,state")).rows;
    const obligations=(await this.db.query("SELECT count(*) FILTER(WHERE state='committed' AND issuance_state<>'issued')::text AS committed_unissued,count(*) FILTER(WHERE exception_code IS NOT NULL)::text AS exception_count,count(*) FILTER(WHERE issuance_state='external_outcome_unknown')::text AS unknown_count FROM orders")).rows[0];
    return{asOf:new Date().toISOString(),startedAt:this.startedAt,scope:'single-process local sandbox; not a production SLO',http:[...this.series.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([route,value])=>({route,count:value.count,serverErrors:value.errors,sumMs:Math.round(value.sumMs*100)/100,durationLeMs:buckets.map((le,index)=>({le,count:value.le[index]}))})),databasePool:{max:this.db.pool.options.max,total:this.db.pool.totalCount,idle:this.db.pool.idleCount,waiting:this.db.pool.waitingCount},eventLoop:{meanMs:Number.isFinite(this.loop.mean)?Math.round(this.loop.mean/1e4)/100:0,p99Ms:Math.round(this.loop.percentile(99)/1e4)/100,maxMs:Math.round(this.loop.max/1e4)/100},outbox,obligations,synthetic:true};
  }
}
