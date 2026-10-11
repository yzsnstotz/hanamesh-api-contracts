import type { BindingDTO, DeviceAuthHeadersRecord, DeviceChallengeDTO, DeviceRegisterInput, DeviceRegisterResponse, DeviceBindInput, DeviceRegistrationResult, IdentityErrorCode, IdentityErrorResponse, IdentityServices, IdentityServicesHandshake, PrincipalResolution, SessionCredentials, WalletBindInput, WalletBindResponse, WalletBindingDTO, WalletBindingWriteResult, WalletChallengeDTO, WalletChallengeInput } from './definition.js';
export type * from './definition.js';
export declare const IDENTITY_FIXTURE_LABEL = "FIXTURE · C-IDENTITY (@hanamesh/server-identity contract v1) · in-memory synthetic data, not the product provider";
/** ed25519 device key with the encodings the contract uses. */
export interface IdentityDeviceKey { readonly publicKey: string; readonly deviceId: string; sign(message: string): string }
export declare function createIdentityDeviceKey(): IdentityDeviceKey;
/** The four X-HM-* headers for a device-authenticated request (`METHOD|PATH|TIMESTAMP|NONCE|hex(sha256(body))`). */
export declare function identityDeviceRequestHeaders(key: IdentityDeviceKey, input: { method: string; path: string; body?: string }, now?: number): DeviceAuthHeadersRecord;
export interface IdentityWire<T> { readonly status: 200 | 201; readonly body: T }
/** registerDevice service result → wire: 201 when created, 200 when the same key re-registered; body never carries `created`. */
export declare function identityDeviceRegisterWire(result: DeviceRegistrationResult): IdentityWire<DeviceRegisterResponse>;
/** bindWallet service result → wire: 201 when created, 200 when already proved on this chain. */
export declare function identityWalletBindWire(result: WalletBindingWriteResult): IdentityWire<WalletBindResponse>;
export interface IdentityServicesFixture {
    readonly label: typeof IDENTITY_FIXTURE_LABEL;
    readonly services: IdentityServices;
    /** A signed-in synthetic account. */
    readonly credentials: SessionCredentials;
    /** Adds another synthetic account and returns its credentials. */
    addAccount(displayName?: string): SessionCredentials;
}
/** In-memory provider fixture. Wallet challenge/bind need the optional peer `viem`. GitHub proof always answers GITHUB_TOKEN_INVALID. */
export declare function createIdentityServicesFixture(options?: { email?: boolean; deploymentId?: string; baseURL?: string; now?: () => number }): IdentityServicesFixture;
export interface IdentityHandshakeCase {
    readonly id: string;
    readonly value: unknown;
    readonly expect: { readonly status: 'present' | 'absent' | 'incompatible'; readonly reason?: string; readonly missing?: readonly string[]; readonly optional?: readonly string[] };
}
export declare function identityHandshakeCases(): readonly IdentityHandshakeCase[];
export interface IdentityErrorEnvelope { readonly status: number; readonly body: IdentityErrorResponse }
export declare function identityErrorEnvelopes(): readonly IdentityErrorEnvelope[];
export declare function createIdentityConsumerFixture(): {
    readonly label: string;
    readonly accept: (value: unknown) => IdentityServicesHandshake;
    readonly describeError: (status: number, body: unknown) => string;
};
export declare const IDENTITY_FIXTURE_WALLET_PRIVATE_KEY: `0x${string}`;
export interface IdentityRejection { readonly code: IdentityErrorCode; readonly statusCode: number }
export interface IdentityContractExamples {
    readonly label: typeof IDENTITY_FIXTURE_LABEL;
    readonly device: {
        readonly challengeInput: { readonly purpose: 'register' };
        readonly challenge: DeviceChallengeDTO;
        readonly registerInput: DeviceRegisterInput;
        readonly registerCreated: IdentityWire<DeviceRegisterResponse>;
        readonly registerAgain: IdentityWire<DeviceRegisterResponse>;
        readonly serviceResult: { readonly created: boolean; readonly againCreated: boolean };
        readonly authHeaders: DeviceAuthHeadersRecord;
        readonly bindInput: DeviceBindInput;
        readonly binding: BindingDTO;
        readonly errors: Readonly<Record<'IDENTITY_DEVICE_REPLAY' | 'IDENTITY_DEVICE_SIGNATURE_INVALID' | 'IDENTITY_DEVICE_ALREADY_BOUND' | 'authenticateDeviceReplay', IdentityRejection>>;
    };
    readonly canonical: { readonly beforeBind: PrincipalResolution; readonly afterBind: PrincipalResolution; readonly unknownPrincipalId: string; readonly unknown: PrincipalResolution };
    readonly getBinding: { readonly unbound: WalletBindingDTO | null; readonly unknownPrincipal: WalletBindingDTO | null; readonly IDENTITY_INPUT_INVALID: IdentityRejection };
    readonly github: { readonly GITHUB_TOKEN_INVALID: IdentityRejection };
    readonly authenticate: { readonly AUTH_REQUIRED: IdentityRejection };
    /** null when created with `{wallets:false}`. */
    readonly wallet: null | {
        readonly challengeInput: WalletChallengeInput;
        readonly challenge: WalletChallengeDTO;
        readonly bindInput: WalletBindInput;
        readonly bindCreated: IdentityWire<WalletBindResponse>;
        readonly bindExisting: IdentityWire<WalletBindResponse>;
        readonly getBinding: WalletBindingDTO | null;
        readonly errors: Readonly<Record<'IDENTITY_WALLET_REPLAY' | 'IDENTITY_WALLET_SIGNATURE_INVALID' | 'IDENTITY_WALLET_ALREADY_BOUND', IdentityRejection>>;
    };
    readonly errorEnvelopes: readonly IdentityErrorEnvelope[];
}
/** Sample data for every documented outcome (FIXTURE · synthetic). Wallet examples need the optional peer `viem`. */
export declare function createIdentityContractExamples(options?: { wallets?: boolean }): Promise<IdentityContractExamples>;
