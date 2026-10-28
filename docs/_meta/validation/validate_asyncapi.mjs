// Optional full standards validation; installing the parser is a separate step.
import { readFile } from 'node:fs/promises';
import { Parser } from '@asyncapi/parser';
const text = await readFile(new URL('../../06-contracts/asyncapi.yaml', import.meta.url), 'utf8');
const parser = new Parser();
const result = await parser.parse(text);
const errors = (result.diagnostics ?? []).filter(d => d.severity === 0);
console.log(JSON.stringify({valid: Boolean(result.document) && errors.length === 0, diagnostics: result.diagnostics}, null, 2));
if (!result.document || errors.length) process.exitCode = 1;
