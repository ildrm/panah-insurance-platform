'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { ApiClient, array, object, string, parseEnrollmentCsv, type JsonObject } from '@st/api-client';
import { useSession } from './session';
import { useCommand } from './protected-session';
import { Icon, Notice } from './primitives';
type Field={name:string;label:string;kind?:'text'|'textarea'|'date'|'number'|'money'|'select'|'record'|'csv';required?:boolean;options?:{value:string;label:string}[];resource?:string;help?:string;min?:number};
export type BusinessFormDefinition={operation:string;title:string;description:string;button:string;fields:Field[]};
export const businessForms:Record<string,BusinessFormDefinition>={
 support:{operation:'createSupportTicket',title:'درخواست پشتیبانی',description:'موضوع و شرح درخواست را ثبت کنید. وضعیت پاسخ در همین حساب قابل پیگیری است.',button:'ثبت درخواست',fields:[{name:'subject',label:'موضوع',required:true},{name:'category',label:'دسته درخواست',kind:'select',required:true,options:[{value:'policy',label:'بیمه‌نامه'},{value:'payment',label:'پرداخت'},{value:'claim',label:'خسارت'},{value:'complaint',label:'شکایت'},{value:'general',label:'سایر'}]},{name:'description',label:'شرح درخواست',kind:'textarea',required:true}]},
 claims:{operation:'createClaim',title:'اعلام خسارت',description:'ثبت اعلام خسارت به معنای تأیید یا پرداخت آن نیست. مدارک و تصمیم مجاز بیمه‌گر در پرونده پیگیری می‌شود.',button:'ثبت اعلام خسارت',fields:[{name:'policyId',label:'بیمه‌نامه',kind:'record',resource:'policies',required:true},{name:'claimKind',label:'نوع خسارت',kind:'select',required:true,options:[{value:'health',label:'درمان'},{value:'property',label:'اموال'},{value:'liability',label:'مسئولیت'}]},{name:'incidentDate',label:'تاریخ رخداد',kind:'date',required:true},{name:'description',label:'شرح رخداد',kind:'textarea',required:true}]},
 profiles:{operation:'saveProfile',title:'ثبت شخص یا دارایی',description:'این سابقه تنها در حدود رابطه و مجوز شما برای درخواست‌های بعدی قابل استفاده است.',button:'ثبت سابقه',fields:[{name:'subjectKind',label:'نوع سابقه',kind:'select',required:true,options:[{value:'person',label:'شخص'},{value:'vehicle',label:'خودرو'},{value:'property',label:'ملک'},{value:'device',label:'دستگاه'}]},{name:'label',label:'عنوان یا نام',required:true},{name:'plate',label:'پلاک (در صورت نیاز)'},{name:'model',label:'مدل یا نوع'}]},
 enrollment:{operation:'createEnrollmentBatch',title:'ثبت فهرست افراد',description:'فایل ابتدا اعتبارسنجی و پیش‌نمایش می‌شود. اعمال پوشش به تأیید مستقل و پاسخ معتبر بیمه‌گر وابسته است.',button:'اعتبارسنجی و ساخت پیش‌نمایش',fields:[{name:'rows',label:'فایل فهرست افراد',kind:'csv',required:true,help:'ستون‌ها: externalId,name,relationship,effectiveFrom و اختیاری effectiveUntil؛ نسبت employee یا dependent است.'},{name:'mode',label:'رفتار با ردیف نامعتبر',kind:'select',required:true,options:[{value:'atomic',label:'توقف کل فهرست در صورت خطا'},{value:'partial_after_approval',label:'اعمال ردیف معتبر پس از تأیید صریح'}]}]},
 policy_change:{operation:'requestPolicyChange',title:'درخواست تغییر بیمه‌نامه',description:'این درخواست پوشش را تغییر نمی‌دهد. تغییر و آثار مالی پس از تأیید مجاز بیمه‌گر نمایش داده می‌شود.',button:'ثبت درخواست تغییر',fields:[{name:'policyId',label:'بیمه‌نامه',kind:'record',resource:'policies',required:true},{name:'changeKind',label:'نوع درخواست',kind:'select',required:true,options:[{value:'endorsement',label:'الحاقیه و اصلاح'},{value:'cancellation',label:'لغو بیمه‌نامه'}]},{name:'effectiveDate',label:'تاریخ درخواستی اثر',kind:'date',required:true},{name:'reason',label:'دلیل و شرح تغییر',kind:'textarea',required:true}]},
 booking:{operation:'bookMaintenance',title:'رزرو خدمات خودرو',description:'زمان و خدمت انتخاب‌شده باید توسط ارائه‌دهنده مجاز تأیید شود. پرداخت به‌تنهایی تأیید انجام خدمت نیست.',button:'ثبت درخواست رزرو',fields:[{name:'providerId',label:'ارائه‌دهنده',kind:'record',resource:'providers',required:true},{name:'vehicleId',label:'خودرو',kind:'record',resource:'profiles',required:true},{name:'serviceCode',label:'نوع خدمت',kind:'select',required:true,options:[{value:'oil',label:'تعویض روغن'},{value:'carwash',label:'کارواش'},{value:'inspection',label:'بازدید'},{value:'towing',label:'امداد و یدک‌کش'},{value:'battery',label:'باتری'},{value:'tire',label:'تایر'}]},{name:'slot',label:'زمان درخواستی',required:true,help:'تاریخ و ساعت با منطقه زمانی، مانند 2026-11-01T09:00:00+03:30'}]},
 parts:{operation:'reserveParts',title:'رزرو قطعه سازگار',description:'قیمت، موجودی و سازگاری هنگام رزرو دوباره بررسی می‌شود. هزینه ارسال و شرایط مرجوعی را پیش از پرداخت بررسی کنید.',button:'رزرو قطعه',fields:[{name:'partId',label:'قطعه',kind:'record',resource:'parts',required:true},{name:'quantity',label:'تعداد',kind:'number',min:1,required:true},{name:'vehicleModel',label:'مدل خودرو',required:true},{name:'address',label:'نشانی ارسال',kind:'textarea',required:true}]},
 part_publish:{operation:'publishPart',title:'افزودن کالای فروشنده',description:'قیمت ریالی، موجودی و مدل‌های سازگار به‌صورت مستقل ثبت می‌شوند.',button:'ثبت کالا',fields:[{name:'sku',label:'کد کالا',required:true},{name:'title',label:'نام کالا',required:true},{name:'stock',label:'موجودی',kind:'number',min:0,required:true},{name:'price',label:'قیمت (ریال)',kind:'money',required:true},{name:'compatibleModels',label:'مدل‌های سازگار',kind:'textarea',required:true,help:'هر مدل را در یک خط وارد کنید.'}]},
 listing:{operation:'createListing',title:'ثبت آگهی خودرو',description:'آگهی، ارزش‌گذاری و معامله هرکدام مجوز مستقل دارند. ثبت آگهی انتقال مالکیت یا تضمین قیمت نیست.',button:'ثبت آگهی',fields:[{name:'vehicleId',label:'خودرو',kind:'record',resource:'profiles',required:true},{name:'title',label:'عنوان آگهی',required:true},{name:'askingPrice',label:'قیمت درخواستی (ریال)',kind:'money',required:true}]},
 referral:{operation:'createReferral',title:'ساخت پیوند معرفی',description:'صلاحیت پاداش و تأیید آن براساس رویداد مجاز و شرایط طرح مشخص می‌شود. اطلاعات خصوصی شخص معرفی‌شده نمایش داده نمی‌شود.',button:'ساخت پیوند معرفی',fields:[]},
 content:{operation:'publishContent',title:'انتشار محتوای اصلی',description:'محتوا باید دارای منبع معتبر و از نظر ادعاهای بیمه‌ای بررسی شده باشد. هیچ محتوای غیرمجاز یا متعلق به رقبا کپی نشود.',button:'ثبت محتوا',fields:[{name:'slug',label:'نشانی کوتاه لاتین',required:true},{name:'title',label:'عنوان',required:true},{name:'body',label:'متن اصلی',kind:'textarea',required:true}]},
 campaign:{operation:'createCampaign',title:'ساخت پویش',description:'بودجه و بازه زمانی مستقل هستند. مصرف هم‌زمان بودجه در سرویس کنترل می‌شود.',button:'ثبت پویش',fields:[{name:'title',label:'عنوان',required:true},{name:'budget',label:'بودجه (ریال)',kind:'money',required:true},{name:'startsAt',label:'زمان شروع',required:true},{name:'endsAt',label:'زمان پایان',required:true}]},
 alerts:{operation:'subscribeVehicleAlerts',title:'تنظیم یادآوری خودرو',description:'یادآوری‌ها تنها برای خودروی مجاز و در کانال انتخاب‌شده ارسال می‌شوند. سرویس پیام واقعی در این محیط فعال نیست.',button:'ثبت تنظیم',fields:[{name:'vehicleId',label:'خودرو',kind:'record',resource:'profiles',required:true},{name:'channel',label:'کانال',kind:'select',required:true,options:[{value:'sms',label:'پیامک'},{value:'push',label:'اعلان وب'}]},{name:'enabled',label:'وضعیت',kind:'select',required:true,options:[{value:'true',label:'فعال'},{value:'false',label:'متوقف'}]}]},

"inspection":{"operation": "createInspection", "title": "درخواست بازدید خودرو", "description": "نوع بازدید و خودرو با رابطه مجاز ثبت می‌شود. تأیید عکس یا موعد بازدید به‌تنهایی پوشش ایجاد نمی‌کند.", "button": "ثبت درخواست بازدید", "fields": [{"name": "vehicleId", "label": "خودرو", "kind": "record", "required": true, "resource": "profiles"}, {"name": "mode", "label": "روش بازدید", "kind": "select", "required": true, "options": [{"value": "self", "label": "بارگذاری تصاویر"}, {"value": "in_person", "label": "بازدید حضوری"}]}]},
"underwriting":{"operation": "createUnderwritingCase", "title": "پرونده ارزیابی ریسک", "description": "بررسی ریسک باید با صلاحیت و نسخه قواعد همان محصول انجام شود.", "button": "ساخت پرونده بررسی", "fields": [{"name": "applicationId", "label": "درخواست بیمه", "kind": "record", "required": true, "resource": "applications"}]},
"underwriting_review":{"operation": "reviewUnderwriting", "title": "ثبت بررسی ارزیابی", "description": "تصمیم در حدود اختیار پرونده و پس از بررسی مدارک ثبت می‌شود؛ اختیار واقعی بیمه‌گر ایجاد نمی‌کند.", "button": "ثبت تصمیم بررسی", "fields": [{"name": "id", "label": "پرونده", "kind": "record", "required": true, "resource": "underwriting"}, {"name": "decision", "label": "تصمیم", "kind": "select", "required": true, "options": [{"value": "accepted", "label": "پذیرش بررسی"}, {"value": "rejected", "label": "رد با دلیل"}, {"value": "evidence_required", "label": "نیازمند مدرک"}]}, {"name": "reason", "label": "دلیل تصمیم", "kind": "textarea", "required": true}, {"name": "evidenceCodes", "label": "مدارک موردنیاز، هر عنوان در یک خط", "kind": "textarea", "required": false}]},
"claim_review":{"operation": "decideClaim", "title": "ثبت ارزیابی خسارت", "description": "در این محیط نتیجه ارزیابی مشورتی است و اختیار تصمیم یا پرداخت واقعی بیمه‌گر را ایجاد نمی‌کند.", "button": "ثبت ارزیابی", "fields": [{"name": "id", "label": "پرونده خسارت", "kind": "record", "required": true, "resource": "claims"}, {"name": "decision", "label": "نتیجه ارزیابی", "kind": "select", "required": true, "options": [{"value": "approved", "label": "ارزیابی مثبت"}, {"value": "rejected", "label": "ارزیابی منفی"}]}, {"name": "approvedAmount", "label": "مبلغ ارزیابی (ریال)", "kind": "money", "required": false}, {"name": "reason", "label": "دلیل ارزیابی", "kind": "textarea", "required": true}]},
"reward":{"operation": "createReward", "title": "تعریف پاداش", "description": "امتیاز با وجه نقد متفاوت است. سازوکارهای نیازمند مجوز مستقل، با تعریف این پاداش فعال نمی‌شوند.", "button": "ثبت پاداش", "fields": [{"name": "title", "label": "عنوان پاداش", "kind": "text", "required": true}, {"name": "points", "label": "امتیاز لازم", "kind": "number", "required": true}, {"name": "kind", "label": "نوع پاداش", "kind": "select", "required": true, "options": [{"value": "voucher", "label": "اعتبار غیرنقدی"}, {"value": "badge", "label": "نشان"}]}]},
"redeem":{"operation": "redeemReward", "title": "دریافت پاداش", "description": "موجودی امتیاز و شرایط پاداش در تراکنش بررسی می‌شود.", "button": "درخواست پاداش", "fields": [{"name": "rewardId", "label": "پاداش", "kind": "record", "required": true, "resource": "rewards"}]},
};
export function BusinessActionForm({definition,preset={},onSuccess,onClose}:{definition:BusinessFormDefinition;preset?:JsonObject;onSuccess?:()=>void;onClose?:()=>void}) {
  const [values,setValues]=useState<JsonObject>(preset);
  const [records,setRecords]=useState<Record<string,{id:string;title:string}[]>>({});
  const [message,setMessage]=useState('');
  const [localError,setLocalError]=useState('');
  const command=useCommand();
  const {session}=useSession();
  useEffect(()=>{
    let active=true;
    const resources=[...new Set(definition.fields.flatMap(field=>field.resource?[field.resource]:[]))];
    for(const resource of resources) {
      const path=resource==='policies'?'/v1/policies':`/v1/business/${resource}`;
      new ApiClient().request(path).then(value=>{
        if(!active)return;
        const envelope=object(value);
        const options=array(Array.isArray(value)?value:envelope.items??envelope.rows).map(item=>{
          const row=object(item);
          const data=object(row.data);
          const title=string(row.title,string(data.label,string(data.title,string(row.label,string(row.policyNumber,'سابقه مجاز')))));
          return {id:string(row.id),title};
        });
        setRecords(current=>({...current,[resource]:options}));
      }).catch(()=>{if(active)setRecords(current=>({...current,[resource]:[]}));});
    }
    return()=>{active=false;};
  },[definition,session?.actor.contextId]);
  async function submit(event:FormEvent) {
    event.preventDefault();setLocalError('');setMessage('');
    try {
      const body:JsonObject=Object.fromEntries(Object.entries(values).filter(([,value])=>value!==''));
      if(definition.operation==='createClaim')body.evidenceIds=[];
      if(definition.operation==='saveProfile') {body.attributes={plate:string(body.plate),model:string(body.model)};delete body.plate;delete body.model;}
      if(definition.operation==='createEnrollmentBatch')body.rows=parseEnrollmentCsv(string(body.rows));
      if(definition.operation==='reserveParts') {body.items=[{partId:body.partId,quantity:Number(body.quantity)}];delete body.partId;delete body.quantity;}
      if(definition.operation==='publishPart')body.compatibleModels=string(body.compatibleModels).split('\n').map(value=>value.trim()).filter(Boolean);
      for(const field of definition.fields) {
        if(field.kind==='money'&&body[field.name]!==undefined)body[field.name]={amount:string(body[field.name]),currency:'IRR',unit:'rial'};
        if(field.kind==='number')body[field.name]=Number(body[field.name]);
      }
      for(const field of ['retakeItems','evidenceCodes','requiredEvidence','documentIds'])if(typeof body[field]==='string')body[field]=string(body[field]).split('\n').map(value=>value.trim()).filter(Boolean);
      if(definition.operation==='subscribeVehicleAlerts')body.enabled=body.enabled==='true';
      const result=object(await command.run(`/v1/business/${definition.operation}`,body));
      setMessage(string(result.message,'درخواست ثبت شد. وضعیت معتبر در فهرست قابل پیگیری است.'));
      onSuccess?.();
    } catch(cause) {setLocalError(cause instanceof Error?cause.message:'ثبت درخواست انجام نشد.');}
  }
  return <section className="panel action-form">
    <div className="form-section-heading"><div><h2>{definition.title}</h2><p>{definition.description}</p></div>{onClose?<button className="icon-button" aria-label="بستن فرم" onClick={onClose}>×</button>:null}</div>
    {localError||command.error?<Notice tone="error">{localError||command.error}</Notice>:null}
    {message?<Notice tone="success">{message}</Notice>:null}
    <form onSubmit={event=>{void submit(event);}}><div className="form-grid">
      {definition.fields.map(field=><label className={`field ${field.kind==='textarea'||field.kind==='csv'?'field-wide':''}`} key={field.name}>
        <span>{field.label}{field.kind==='date'?' (میلادی)':''}{field.required?' *':''}</span>
        {field.kind==='select'?<select required={field.required} value={string(values[field.name])} onChange={event=>setValues(current=>({...current,[field.name]:event.target.value}))}><option value="">انتخاب کنید</option>{field.options?.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>
        :field.kind==='record'?<select required={field.required} value={string(values[field.name])} onChange={event=>setValues(current=>({...current,[field.name]:event.target.value}))}><option value="">یک سابقه مجاز انتخاب کنید</option>{(records[field.resource??'']??[]).map(record=><option key={record.id} value={record.id}>{record.title}</option>)}</select>
        :field.kind==='csv'?<><input type="file" accept=".csv,text/csv" aria-label="انتخاب فایل فهرست" onChange={event=>{const file=event.target.files?.[0];if(file){if(file.size>2_000_000){setLocalError('حجم فایل باید کمتر از ۲ مگابایت باشد.');return;}void file.text().then(text=>setValues(current=>({...current,[field.name]:text}))).catch(()=>setLocalError('خواندن فایل انجام نشد.'));}}}/><textarea rows={7} dir="ltr" required={field.required} value={string(values[field.name])} placeholder="externalId,name,relationship,effectiveFrom" onChange={event=>setValues(current=>({...current,[field.name]:event.target.value}))}/></>
        :field.kind==='textarea'?<textarea required={field.required} rows={4} maxLength={10000} value={string(values[field.name])} onChange={event=>setValues(current=>({...current,[field.name]:event.target.value}))}/>
        :<input type={field.kind==='date'?'date':field.kind==='number'?'number':'text'} inputMode={field.kind==='money'?'numeric':undefined} pattern={field.kind==='money'?'[0-9]+':undefined} required={field.required} min={field.min} value={typeof values[field.name]==='number'?String(values[field.name]):string(values[field.name])} onChange={event=>setValues(current=>({...current,[field.name]:event.target.value}))}/>}
        {field.help?<small>{field.help}</small>:null}
      </label>)}
    </div><button type="submit" className="button" disabled={command.busy}>{command.busy?'در حال بررسی…':definition.button}<Icon name="arrow" size={17}/></button></form>
  </section>;
}
