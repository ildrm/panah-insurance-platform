import { IntegrationError } from './contracts.js';
const NS = 'urn:fictional:carrier:soap:v1';
export const xmlEscape = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
export function soapEnvelope(operation: string, fields: Record<string, string>): string {
  return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><c:${operation} xmlns:c="${NS}">${Object.entries(fields).map(([k, v]) => `<c:${k}>${xmlEscape(v)}</c:${k}>`).join('')}</c:${operation}></soap:Body></soap:Envelope>`;
}
export interface XmlPayload { operation: string; fields: Record<string, string> }
/** Deliberately restricted parser for the fictional flat SOAP vocabulary, never arbitrary XML. */
export function parseSoap(input: string): XmlPayload {
  const fail = (): never => { throw new IntegrationError('invalid_xml', 'mapping_error', false, 'Invalid bounded SOAP payload'); };
  if (Buffer.byteLength(input) > 65_536 || /<!|<\?(?!xml\s)/i.test(input) || !input.includes(NS) || !input.includes('http://schemas.xmlsoap.org/soap/envelope/')) return fail();
  const text = input.replace(/^\s*<\?xml\s+[^?]*\?>/, '').trim();
  const envelope = /^<([A-Za-z][\w.-]*:)?Envelope\s+[^>]*>([\s\S]*)<\/\1Envelope>$/.exec(text);
  if (!envelope) return fail();
  const body = /^\s*<([A-Za-z][\w.-]*:)?Body\s*>([\s\S]*)<\/\1Body>\s*$/.exec(envelope[2] ?? '');
  if (!body) return fail();
  const payload = /^\s*<([A-Za-z][\w.-]*:)?([A-Za-z][\w.-]*)(?:\s+[^>]*)?>([\s\S]*)<\/\1\2>\s*$/.exec(body[2] ?? '');
  if (!payload) return fail();
  const namespace = (prefix: string | undefined, expected: string): void => {
    if (!prefix) return fail();
    const name = prefix.slice(0, -1);
    const declarations = [...input.matchAll(new RegExp(`xmlns:${name}=["']([^"']+)["']`, 'g'))];
    if (declarations.length !== 1 || declarations[0]?.[1] !== expected) return fail();
  };
  namespace(envelope[1], 'http://schemas.xmlsoap.org/soap/envelope/');
  namespace(body[1], 'http://schemas.xmlsoap.org/soap/envelope/');
  namespace(payload[1], NS);
  const fields: Record<string, string> = {};
  let remaining = payload[3] ?? '';
  while (remaining.trim()) {
    const field = /^\s*<([A-Za-z][\w.-]*:)?([A-Za-z][\w.-]*)>([^<]*)<\/\1\2>/.exec(remaining);
    if (!field || !field[2] || Object.hasOwn(fields, field[2])) return fail();
    namespace(field[1], NS);
    const raw = field[3] ?? '';
    if (/&(?!amp;|lt;|gt;|quot;|apos;)/.test(raw)) return fail();
    fields[field[2]] = raw.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
    remaining = remaining.slice(field[0].length);
  }
  return { operation: payload[2] ?? '', fields };
}
