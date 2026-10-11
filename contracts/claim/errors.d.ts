import type { ClaimErrorCode, ClaimErrorResponse } from './contracts.js';
export declare class ClaimError extends Error {
    readonly code: ClaimErrorCode;
    readonly statusCode: number;
    constructor(code: ClaimErrorCode, options?: ErrorOptions);
    toJSON(): ClaimErrorResponse;
}
export declare function safeClaimError(error: unknown): ClaimError;
