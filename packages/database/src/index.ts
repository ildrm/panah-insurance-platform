import {Pool, type PoolClient, type QueryResult, type QueryResultRow} from 'pg';
export type {QueryResult,QueryResultRow} from 'pg';
export interface SqlClient { query<T extends QueryResultRow=QueryResultRow>(sql:string,params?:unknown[]):Promise<QueryResult<T>> }
export class Database implements SqlClient {
  readonly pool:Pool;
  private closing:Promise<void>|undefined;
  constructor(url=process.env.DATABASE_URL??'postgresql://st@127.0.0.1:55432/st_local',options:{max?:number}={}) {
    const target=new URL(url);if(!['127.0.0.1','localhost','db'].includes(target.hostname))throw new Error('Only the isolated local database is enabled; remote database authority is not configured.');
    const max=options.max??20;if(!Number.isInteger(max)||max<1||max>20)throw new Error('Database process pool must contain1 to20 connections.');
    this.pool=new Pool({connectionString:url,max,idleTimeoutMillis:30000,connectionTimeoutMillis:3000,application_name:'panah-local'});
  }
  query<T extends QueryResultRow=QueryResultRow>(sql:string,params:unknown[]=[]):Promise<QueryResult<T>> {return this.pool.query<T>(sql,params);}
  async transaction<T>(fn:(tx:SqlClient)=>Promise<T>):Promise<T> {
    const client:PoolClient=await this.pool.connect();
    try {await client.query('BEGIN'); const result=await fn(client);await client.query('COMMIT');return result;}
    catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }
  close():Promise<void>{this.closing??=this.pool.end();return this.closing;}
  onModuleDestroy():Promise<void>{return this.close();}
}
