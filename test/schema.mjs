import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
/** Compiles one $def of a contract schema so examples are checked against the published shape, not a copy. */
export function validatorFor(schemaUrl, def) {
    const schema = JSON.parse(readFileSync(schemaUrl, 'utf8'));
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    ajv.addSchema(schema);
    const validate = ajv.getSchema(`${schema.$id}#/$defs/${def}`);
    return value => { const ok = validate(value); return { ok, errors: validate.errors }; };
}
