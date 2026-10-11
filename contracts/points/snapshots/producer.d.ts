import type {ConfirmedLaunch} from './contracts.js';
export interface ConfirmedLaunchSource {
    getConfirmedLaunch(input: {
        requestId: string;
    }): Promise<ConfirmedLaunch | null>;
}
