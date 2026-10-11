import {createHash, randomUUID} from 'node:crypto';
import {createIdentityDeviceKey, createIdentityServicesFixture, identityDeviceRequestHeaders} from '../identity/index.js';
import {canonicalUsageEvent, eventDigest} from './events.js';
import {USAGE_EVENT_ACTIONS} from './contracts.js';
import {createFixtureService} from './fixture-service.js';
import {usageWithdrawWire} from './definition.js';
export const USAGE_FIXTURE_LABEL = 'FIXTURE · C-USAGE · synthetic memory events and C-IDENTITY; no SQL, HTTP server, rollups or host commit';
const NOW = Date.parse('2026-10-11T00:00:00.000Z');
/** Uses actual signing and provider validation; storage/executor are synthetic consumer ports. */
export async function createUsageProviderFixture() {
    const deploymentId = 'fixture-usage';
    const identityFixture = createIdentityServicesFixture({deploymentId, now:()=>NOW});
    const identity = identityFixture.services, key = createIdentityDeviceKey();
    const challenge = await identity.deviceRegistration.createChallenge('register');
    await identity.deviceRegistration.registerDevice({publicKey:key.publicKey, nonce:challenge.nonce, signature:key.sign(challenge.nonce + key.publicKey)});
    let rows = [];
    const repository = {
        async insert(_executor, owner, event, digest) {
            // Same precedence and scopes as provider events-repository.ts: id lookup before nonce lookup.
            const scoped = rows.filter(row=>row.deploymentId === owner.deploymentId && row.event.deviceId === event.deviceId);
            const byId = scoped.find(row=>row.event.eventId === event.eventId);
            if (byId) return byId.digest === digest ? 'duplicate' : 'event-conflict';
            if (scoped.some(row=>row.event.nonce === event.nonce)) return 'nonce-reused';
            rows.push({deploymentId:owner.deploymentId,principalId:owner.principalId,event:structuredClone(event),digest});
            return 'accepted';
        },
        async contribution(_executor, deployment, principalIds, window) {
            const selected = rows.filter(row=>row.deploymentId === deployment && principalIds.includes(row.principalId) && row.event.occurredAt >= window.from && row.event.occurredAt < window.to);
            const groups = new Map();
            for (const {event} of selected) {
                let group = groups.get(event.hanaRef);
                if (!group) { group = {hanaRef:event.hanaRef,actions:Object.fromEntries(USAGE_EVENT_ACTIONS.map(action=>[action,0])),devices:new Set()}; groups.set(event.hanaRef,group); }
                group.actions[event.action]++; group.devices.add(event.deviceId);
            }
            return {byHana:[...groups.values()].sort((a,b)=>a.hanaRef.localeCompare(b.hanaRef)).map(group=>({...group,devices:group.devices.size})),sources:{events:selected.length,rollups:0},availability:'available'};
        },
        async withdraw(_executor, owner, deviceId) {
            const previous = rows.length;
            rows = rows.filter(row=>!(row.deploymentId === owner.deploymentId && row.principalId === owner.principalId && row.event.deviceId === deviceId));
            return {deletedEvents:previous-rows.length};
        }
    };
    const withExecutor = async (_pool, _owner, context, work) => {
        // Caller-managed transactions are outside this minimal fixture's evidence scope.
        if (context !== undefined) throw new Error('C-USAGE FIXTURE does not simulate host-managed transactions');
        const snapshot = structuredClone(rows);
        try { return await work({query:async()=>({rows:[],rowCount:0})}); }
        catch (error) { rows = snapshot; throw error; }
    };
    const service = createFixtureService({identity, deploymentId, now:()=>NOW},repository,withExecutor);
    return {
        label:USAGE_FIXTURE_LABEL, service, identity, key, credentials:identityFixture.credentials,
        window:{from:'2026-10-10T00:00:00.000Z',to:'2026-10-11T00:01:00.000Z'},
        event(overrides = {}) {
            const event = {deviceId:key.deviceId,hanaRef:'fixture.hana',action:'use',occurredAt:new Date(NOW).toISOString(),eventId:randomUUID(),nonce:randomUUID(),...overrides};
            return {...event,signature:key.sign(canonicalUsageEvent(event))};
        },
        request(method, path, input) {
            const body = input === undefined ? '' : JSON.stringify(input);
            return {method,path,bodyHash:createHash('sha256').update(body).digest('hex'),headers:identityDeviceRequestHeaders(key,{method,path,body},NOW)};
        }
    };
}
/** Executable two-client input/retry, negative cases and withdrawal; every value is FIXTURE. */
export async function createUsageContractExamples() {
    const fixture = await createUsageProviderFixture(), event = fixture.event(), inputA = [event], inputB = structuredClone(inputA);
    const requestA = fixture.request('POST','/v1/usage/events',inputA), requestB = fixture.request('POST','/v1/usage/events',inputB);
    const accepted = await fixture.service.ingestEvents(requestA,inputA), duplicate = await fixture.service.ingestEvents(requestB,inputB);
    const differentNonce = fixture.event({...event,nonce:randomUUID()}), differentDigest = fixture.event({...event,targetRef:'changed'}), reusedNonce = fixture.event({nonce:event.nonce});
    const negative = [];
    for (const value of [differentNonce,differentDigest,reusedNonce]) negative.push({input:[value],response:await fixture.service.ingestEvents(fixture.request('POST','/v1/usage/events',[value]),[value])});
    let identityReplay, usageReplay;
    try { await fixture.identity.deviceAuth.authenticateDevice(requestA); } catch (error) { identityReplay = error.code; }
    try { await fixture.service.ingestEvents(requestA,inputA); } catch (error) { usageReplay = {error:{code:error.code,message:error.message}}; }
    const contributions = await fixture.service.getContributions({deviceRequest:fixture.request('GET','/v1/usage/me/contributions')},fixture.window);
    const path = `/v1/usage/me/devices/${fixture.key.deviceId}/events`;
    const withdrawal = usageWithdrawWire(await fixture.service.withdrawEvents({deviceRequest:fixture.request('DELETE',path)},fixture.key.deviceId));
    const afterWithdrawal = await fixture.service.getContributions({deviceRequest:fixture.request('GET','/v1/usage/me/contributions')},fixture.window);
    return {label:USAGE_FIXTURE_LABEL,twoClients:{clientA:{input:inputA,request:requestA,response:accepted},clientB:{input:inputB,request:requestB,response:duplicate},digest:eventDigest(event)},negative,identityReplay,usageReplay,
        wire:{UsageEventBatch:[inputA,inputB,...negative.map(value=>value.input)],IngestBatchResult:[accepted,duplicate,...negative.map(value=>value.response)],EligibilityContribution:[contributions,afterWithdrawal],WithdrawResult:[withdrawal],ErrorResponse:[usageReplay]}};
}
