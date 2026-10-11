const STATUS = { CUSTODY_AUTH_REQUIRED: 401, CUSTODY_FORBIDDEN: 403, CUSTODY_INPUT_INVALID: 400, CUSTODY_ORIGIN_REJECTED: 403, CUSTODY_CONTENT_TYPE_REQUIRED: 415, CUSTODY_HOST_TRANSACTION_REQUIRED: 500, CUSTODY_WITHDRAW_DISABLED: 409, CUSTODY_INSUFFICIENT_BALANCE: 409, CUSTODY_VOUCHER_NONCE_USED: 409, CUSTODY_SUMMARY_INVALID: 503, CUSTODY_UNAVAILABLE: 503, CUSTODY_ALLOCATION_POLICY_REQUIRED: 503, CUSTODY_ALLOCATION_INVALID: 503, CUSTODY_PAYMENT_NOT_CONFIRMED: 409, CUSTODY_SNAPSHOT_CONFLICT: 409, CUSTODY_SNAPSHOT_NOT_FOUND: 404, CUSTODY_OPENING_NOT_CONFIRMED: 409, CUSTODY_DISTRIBUTION_PROVIDER_REQUIRED: 503, CUSTODY_DISTRIBUTION_NOT_CONFIRMED: 409, CUSTODY_WALLET_BINDING_CONFLICT: 409 };
/** `need` names the missing owning input so a consumer can report what the plugin lacks; absent on ordinary errors. */
export class CustodyError extends Error {
    code;
    need;
    statusCode;
    constructor(code, message = code, need) {
        super(message);
        this.code = code;
        this.need = need;
        this.name = 'CustodyError';
        this.statusCode = STATUS[code];
    }
    toJSON() { return { error: { code: this.code, message: this.message, ...(this.need ? { need: this.need } : {}) } }; }
}
export function safeCustodyError(error) { return error instanceof CustodyError ? error : new CustodyError('CUSTODY_UNAVAILABLE'); }
