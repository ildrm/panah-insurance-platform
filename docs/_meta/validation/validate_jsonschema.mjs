// Full Draft2020-12 validation using the application's exact locked Ajv8.
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {readFileSync} from 'node:fs';
const cases=JSON.parse(readFileSync(0,'utf8'));
const errors=[];let checked=0;
for(const item of cases){
  try{
    const ajv=new Ajv2020({allErrors:true,strict:false,validateSchema:true});addFormats(ajv);
    const validator=ajv.compile(item.schema),valid=validator(item.value);
    if(valid!==(item.expectedValid??true))errors.push({label:item.label,expectedValid:item.expectedValid??true,errors:validator.errors});
    checked++;
  }catch(error){errors.push({label:item.label,error:error instanceof Error?error.message:'validator failure'});}
}
console.log(JSON.stringify({engine:'Ajv8 Draft2020-12 + ajv-formats (exact application lock)',checked,valid:errors.length===0,errors}));
if(errors.length)process.exitCode=1;
