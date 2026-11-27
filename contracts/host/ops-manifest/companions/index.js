export {default as OPS_TEXT_PAGE_SCHEMA} from './texts.schema.json' with {type: 'json'};
export {default as OPS_ACCESS_PAGE_SCHEMA} from './access.schema.json' with {type: 'json'};
export {default as OPS_ROUTE_PAGE_SCHEMA} from './routes.schema.json' with {type: 'json'};

export const OPS_COMPANION_LIMITS = Object.freeze({
  pageItems: 200,
  responseBytes: 256 * 1024,
  manifestEntries: 512,
});
