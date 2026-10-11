import type { CustodyErrorCode } from './contracts.js';
/** `need` names the missing owning input so a consumer can report what the plugin lacks; absent on ordinary errors. */
export declare class CustodyError extends Error {
    readonly code: CustodyErrorCode;
    readonly need?: Readonly<Record<string, string>> | undefined;
    readonly statusCode: number;
    constructor(code: CustodyErrorCode, message?: string, need?: Readonly<Record<string, string>> | undefined);
    toJSON(): {
        error: {
            need?: Readonly<Record<string, string>>;
            code: CustodyErrorCode;
            message: string;
        };
    };
}
export declare function safeCustodyError(error: unknown): CustodyError;
