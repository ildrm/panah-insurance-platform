import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const folder=dirname(fileURLToPath(import.meta.url)),docs=resolve(folder,'../..');
const require=createRequire(resolve(process.env.ST_DOC_TOOLS_ROOT??folder,'package.json'));
const SwaggerParser=require('@apidevtools/swagger-parser'),{Parser}=require('@asyncapi/parser');
const outcomes=[];
try{const api=await SwaggerParser.validate(resolve(docs,'06-contracts/openapi.yaml'),{resolve:{http:false}});outcomes.push({kind:'OpenAPI',version:api.openapi,valid:true,operations:Object.values(api.paths).reduce((sum,item)=>sum+Object.keys(item).filter(key=>['get','post','put','patch','delete','head','options','trace'].includes(key)).length,0),engine:'@apidevtools/swagger-parser13.1.0'});}catch(error){outcomes.push({kind:'OpenAPI',valid:false,engine:'@apidevtools/swagger-parser13.1.0',error:error instanceof Error?error.message:String(error)});}
try{const path=resolve(docs,'06-contracts/asyncapi.yaml'),parser=new Parser(),parsed=await parser.parse(await readFile(path,'utf8'),{source:path});const diagnostics=parsed.diagnostics??[];outcomes.push({kind:'AsyncAPI',version:'3.0.0',valid:!!parsed.document&&!diagnostics.some(item=>item.severity===0),engine:'@asyncapi/parser3.6.6',diagnostics});}catch(error){outcomes.push({kind:'AsyncAPI',valid:false,engine:'@asyncapi/parser3.6.6',error:error instanceof Error?error.message:String(error)});}
const inputs=[];for(const path of ['06-contracts/openapi.yaml','06-contracts/asyncapi.yaml'])inputs.push({path,sha256:createHash('sha256').update(await readFile(resolve(docs,path))).digest('hex')});
const report={id:'REPORT-CONTRACT-STANDARDS',version:'1.0.0',status:outcomes.every(item=>item.valid)?'complete':'partial',updated:'2026-10-28',checkedAt:new Date().toISOString(),runtime:process.version,valid:outcomes.every(item=>item.valid),inputs,outcomes,scope:'Static target contract standards checks only; not proof that runtime implements all operations or that partners certified these contracts.'};
if(!process.argv.includes('--check'))await writeFile(resolve(docs,'_meta/contract-standards-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.valid)process.exitCode=1;
