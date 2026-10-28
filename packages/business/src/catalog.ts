import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { DomainError } from '@st/contracts';
import templates from './products/templates.json';
import { object, type Input } from './validation';

// The reviewed schemas use `then.required` for properties declared on the outer
// object. AJV's optional strictRequired lint rejects that legal JSON Schema form.
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false, validateFormats: true });
addFormats(ajv);
const validators = new Map(templates.map(template => [template.id, ajv.compile(template.schema)]));
export function catalog() { return templates.map(({ schema, example, ...product }) => ({ ...product, fieldCount: Object.keys(schema.properties).length, assisted: ['PRD-07', 'PRD-17', 'PRD-18', 'PRD-19', 'PRD-20', 'PRD-21', 'PRD-24'].includes(product.id) })); }
export function product(id: string) {
  const template = templates.find(item => item.id === id);
  if (template === undefined) throw new DomainError('resource_not_found', 404, 'Product not found');
  return template;
}
export function validateRisk(productId: string, risk: unknown, now = new Date()): Input {
  const input = object(risk, 'answers');
  const validate = validators.get(productId);
  if (validate === undefined) throw new DomainError('resource_not_found', 404, 'Product not found');
  if (!validate(input)) throw new DomainError('risk_validation_failed', 422, (validate.errors ?? []).map(error => `${error.instancePath || '/'} ${error.message ?? 'invalid'}`).slice(0, 8).join('; '));
  for (const [from, to] of [['departureDate', 'returnDate'], ['tripStart', 'tripEnd'], ['projectStart', 'projectEnd']] as const) {
    if (typeof input[from] === 'string' && typeof input[to] === 'string' && input[from] > input[to]) throw new DomainError('invalid_effective_period', 422, `${to} must not precede ${from}`);
  }
  const today = now.toISOString().slice(0, 10);
  if (typeof input.birthDate === 'string' && input.birthDate > today) throw new DomainError('birth_date_invalid', 422, 'Birth date cannot be in the future');
  if (input.birthDates !== undefined) for (const birth of Object.values(object(input.birthDates, 'birthDates'))) if (typeof birth === 'string' && birth > today) throw new DomainError('birth_date_invalid', 422, 'Birth date cannot be in the future');
  if (Array.isArray(input.beneficiaries)) {
    const total = input.beneficiaries.reduce((sum: number, item: unknown) => {
      const row = object(item, 'beneficiary');
      return sum + (typeof row.basisPoints === 'number' ? row.basisPoints : 0);
    }, 0);
    if (total !== 10_000) throw new DomainError('beneficiary_allocation_invalid', 422, 'Beneficiary allocation must total 10000 basis points');
  }
  if ((productId === 'PRD-05' || productId === 'PRD-23') && input.coverageMode === 'rider' && input.basePolicyOrQuoteRef === undefined) throw new DomainError('base_cover_required', 422, 'A rider requires compatible base coverage');
  if (productId === 'PRD-06' && Array.isArray(input.memberRefs)) {
    const relationships = object(input.relationshipCodes, 'relationshipCodes');
    const births = object(input.birthDates, 'birthDates');
    for (const member of input.memberRefs) if (typeof member !== 'string' || relationships[member] === undefined || births[member] === undefined) throw new DomainError('member_schedule_mismatch', 422, 'Every member needs relationship and birth-date data');
  }
  return structuredClone(input);
}
