export * from './contracts.js';
import type {DeviceAuthRequest, IdentityServices, SessionCredentials, IdentityErrorCode, WriteContext} from '../identity/index.js';
import type {IdentityDeviceKey} from '../identity/fixtures.js';
import type {UsageErrorCode, UsageErrorResponse, UsageEventInput, IngestBatchResult, ContributionWindow, EligibilityContribution} from './contracts.js';
export type {DeviceAuthRequest, WriteContext};
export interface SubjectCredentials {readonly cookie?:string; readonly deviceRequest?:DeviceAuthRequest}
export interface WithdrawResult {readonly deletedEvents:number}
export interface WithdrawServiceResult extends WithdrawResult {readonly durability:'committed'|'pending-host-commit'}
/** Provider's existing three C-USAGE service ports; HTTP ingress only exposes committed results. */
export interface UsageEventService {
  ingestEvents(request:DeviceAuthRequest,input:unknown,context?:WriteContext):Promise<IngestBatchResult>;
  getContributions(credentials:SubjectCredentials,window:unknown,context?:WriteContext):Promise<EligibilityContribution>;
  withdrawEvents(credentials:SubjectCredentials,deviceId:string,context?:WriteContext):Promise<WithdrawServiceResult>;
}
export declare class UsageError extends Error {readonly code:UsageErrorCode; readonly statusCode:number; constructor(code:UsageErrorCode)}
/** Includes mapping IDENTITY_DEVICE_REPLAY to USAGE_AUTH_REQUIRED. */
export declare function identityError(error:unknown):UsageError;
export type UsageEventSignatureInput = Pick<UsageEventInput,'deviceId'|'hanaRef'|'action'|'occurredAt'|'eventId'|'nonce'>;
export declare function canonicalUsageEvent(event:UsageEventSignatureInput):string;
/** Includes event-level nonce and optional fields; excludes signature. Input must already be provider-validated. */
export declare function eventDigest(event:UsageEventInput):string;
export declare function validateUsageEvent(input:unknown):UsageEventInput;
export declare function validateEventBatch(input:unknown):readonly UsageEventInput[];
export declare function verifyEventSignature(event:UsageEventInput,rawPublicKey:string):boolean;
export interface UsageHttpCall {readonly method:'POST'|'GET'|'DELETE';readonly path:string;readonly input:string;readonly output:string;readonly status:200;readonly errors:readonly UsageErrorCode[];readonly rejectionCodes?:readonly UsageErrorCode[];readonly note:string}
export declare const USAGE_CONTRACT_DEFINITION: Readonly<{
  id:'C-USAGE';provider:'server-usage';protocolVersion:'1';
  calls:Readonly<Record<'ingestEvents'|'withdrawEvents'|'getContributions',UsageHttpCall>>;
  idempotency:Readonly<{scope:string;nonceScope:string;digest:string;precedence:string;retry:string}>;
  authentication:Readonly<{eventSignature:string;httpSignature:string;replay:string;mutations:string}>;
  errors:Readonly<Record<UsageErrorCode,{readonly status:number;readonly body:UsageErrorResponse}>>;
}>;
export declare function usageWithdrawWire(result:WithdrawServiceResult):WithdrawResult;
export declare const USAGE_FIXTURE_LABEL:string;
/** Explicitly excludes caller-managed transactions; no SQL, real HTTP server or rollups. */
export interface UsageProviderFixture {
  readonly label:string;
  readonly service:{
    ingestEvents(request:DeviceAuthRequest,input:unknown):Promise<IngestBatchResult>;
    getContributions(credentials:SubjectCredentials,window:unknown):Promise<EligibilityContribution>;
    withdrawEvents(credentials:SubjectCredentials,deviceId:string):Promise<WithdrawServiceResult>;
  };
  readonly identity:IdentityServices;
  readonly key:IdentityDeviceKey;
  readonly credentials:SessionCredentials;
  readonly window:ContributionWindow;
  /** Produces synthetic inputs with real Ed25519 event signatures. */
  event(overrides?:Partial<UsageEventInput>):UsageEventInput;
  /** Re-signs a request with a fresh HTTP authentication nonce; pair input with the service input. */
  request(method:string,path:string,input?:unknown):DeviceAuthRequest;
}
export declare function createUsageProviderFixture():Promise<UsageProviderFixture>;
export interface UsageClientExample {readonly input:readonly UsageEventInput[];readonly request:DeviceAuthRequest;readonly response:IngestBatchResult}
export interface UsageContractExamples {
  readonly label:string;
  readonly twoClients:{readonly clientA:UsageClientExample;readonly clientB:UsageClientExample;readonly digest:string};
  readonly negative:readonly {readonly input:readonly UsageEventInput[];readonly response:IngestBatchResult}[];
  readonly identityReplay:IdentityErrorCode;
  readonly usageReplay:UsageErrorResponse;
  readonly wire:{readonly UsageEventBatch:readonly (readonly UsageEventInput[])[];readonly IngestBatchResult:readonly IngestBatchResult[];readonly EligibilityContribution:readonly EligibilityContribution[];readonly WithdrawResult:readonly WithdrawResult[];readonly ErrorResponse:readonly UsageErrorResponse[]};
}
export declare function createUsageContractExamples():Promise<UsageContractExamples>;
// Q-33 (J2S3-APIC-16): host maintenance port, module configuration/injection types and an independent maintenance FIXTURE.
export * from './maintenance.js';
