export * from './definition.js';
export * from './fixtures.js';
/** Baseline event of C-CORE: delivered as listener arguments `(state, changedAt)` through onConsentChange. */
export const CORE_EVENTS = Object.freeze({
    onConsentChange: Object.freeze({ payload: '{state: ConsentState, changedAt: ISO-8601 string}', delivery: 'listener(state, changedAt); no replay on subscribe; returns unsubscribe' }),
});
