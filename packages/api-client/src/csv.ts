/** Bounded RFC4180-style CSV parser for enrollment previews; server remains authority. */
export function parseEnrollmentCsv(text: string): { externalId: string; name: string; relationship: string; effectiveFrom: string; effectiveUntil?: string }[] {
  if (new TextEncoder().encode(text).byteLength > 2_000_000) throw new Error('حجم فایل باید کمتر از ۲ مگابایت باشد.');
  const rows: string[][]=[]; let row: string[]=[]; let field=''; let quoted=false;
  for(let i=0;i<text.length;i++){const char=text[i];if(char==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else if(!field||quoted)quoted=!quoted;else throw new Error('ساختار نقل‌قول فایل معتبر نیست.');}else if(char===','&&!quoted){row.push(field);field='';}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(cell=>cell.trim()))rows.push(row);row=[];field='';}else field+=char;}
  if(quoted)throw new Error('یکی از نقل‌قول‌های فایل بسته نشده است.');row.push(field);if(row.some(cell=>cell.trim()))rows.push(row);
  const header=rows.shift()?.map(cell=>cell.replace(/^\uFEFF/,'').trim())??[];
  const required=['externalId','name','relationship','effectiveFrom'];for(const key of required)if(!header.includes(key))throw new Error(`ستون ${key} در فایل وجود ندارد.`);
  if(rows.length>20_000)throw new Error('هر نوبت حداکثر ۲۰٬۰۰۰ ردیف می‌پذیرد.');
  if(!rows.length)throw new Error('فایل هیچ ردیف اطلاعاتی ندارد.');
  return rows.map((values,index)=>{if(values.length!==header.length)throw new Error(`تعداد ستون‌های ردیف ${index+2} درست نیست.`);const get=(key:string)=>values[header.indexOf(key)]?.trim()??'';const result={externalId:get('externalId'),name:get('name'),relationship:get('relationship'),effectiveFrom:get('effectiveFrom')};if(!result.externalId||!result.name||!['employee','dependent'].includes(result.relationship)||!/^\d{4}-\d{2}-\d{2}$/.test(result.effectiveFrom))throw new Error(`اطلاعات ردیف ${index+2} را بررسی کنید.`);const until=get('effectiveUntil');return{...result,...(until?{effectiveUntil:until}:{})};});
}
