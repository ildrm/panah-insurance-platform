import { test, expect } from '@playwright/test';
import { parseEnrollmentCsv } from '../../packages/api-client/src/csv';
import { money } from '../../packages/api-client/src/index';
import { formatToman } from '../../packages/ui/src/index';
test('enrollment CSV preserves quoted member names and validates row semantics', () => {
  expect(parseEnrollmentCsv('externalId,name,relationship,effectiveFrom\r\nSYN-1,"Synthetic, Person",employee,2026-11-01')).toEqual([{externalId:'SYN-1',name:'Synthetic, Person',relationship:'employee',effectiveFrom:'2026-11-01'}]);
  expect(() => parseEnrollmentCsv('externalId,name\na,b')).toThrow('ستون relationship');
  expect(() => parseEnrollmentCsv('externalId,name,relationship,effectiveFrom\na,b,owner,2026-11-01')).toThrow('اطلاعات ردیف');
  expect(() => parseEnrollmentCsv('externalId,name,relationship,effectiveFrom\na,"b,employee,2026-11-01')).toThrow('بسته نشده');
});
test('money boundary rejects fabricated zero/float and toman display preserves fractional negative sign',()=>{
  expect(()=>money({amount:1.25,currency:'IRR',unit:'rial'})).toThrow();
  expect(()=>money({currency:'IRR',unit:'rial'})).toThrow();
  expect(formatToman('-1')).toBe('−۰٫۱');
  expect(formatToman('15')).toBe('۱٫۵');
});
