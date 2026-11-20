import errors from './errors.json' with {type:'json'};
import schema from './schema.json' with {type:'json'};
export const ISSUER_READ_SCHEMA=schema;
export const ISSUER_READ_LIMITS=Object.freeze({wallets:10,pageDefault:20,pageMax:50,profileKeys:50,cursorBytes:2048,itemBytes:16384,responseBytes:1048576});
export const ISSUER_READ_ORDER='issued-time-token-desc';
export const ISSUER_READ_ERRORS=Object.freeze(Object.fromEntries(Object.entries(errors).map(([port,codes])=>[port,Object.freeze(codes)])));
