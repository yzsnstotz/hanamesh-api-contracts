import schema from './schema.json' with {type:'json'};
import errors from './errors.json' with {type:'json'};
export const ISSUER_ACCOUNT_SCHEMA=schema;
export const ISSUER_ACCOUNT_ERRORS=Object.freeze(Object.fromEntries(Object.entries(errors).map(([group,codes])=>[group,Object.freeze(codes)])));
