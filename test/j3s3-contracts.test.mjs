import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CONTRACTS} from '@hanamesh/api-contracts';
import * as claim from '@hanamesh/api-contracts/claim';
import * as indexer from '@hanamesh/api-contracts/indexer-catalog';

const ce = () => claim.createClaimContractExamples();
const hana = claim.CLAIM_EXAMPLE.hanaId;
const other = '22222222-2222-4222-8222-222222222222';
const errorWithCode = code => Object.assign(new Error('FIXTURE upstream'),{code});

test('J3S3 published entries have pinned provenance, complete error examples and no product factories', () => {
    for (const [id,entry,module,sha] of [
        ['C-CLAIM',claim,'claim','21a8b6dbc267ea6f9c016cbd7cabad559e4bc0eb'],
        ['C-INDEXER-CATALOG',indexer,'indexer-catalog','a5b47da8ee081ae25834e94aa8ff510478a0dae7'],
    ]) {
        assert.equal(CONTRACTS[id].definition,entry[id==='C-CLAIM' ? 'CLAIM_CONTRACT_DEFINITION' : 'INDEXER_CONTRACT_DEFINITION']);
        const p=JSON.parse(readFileSync(new URL(`../contracts/${module}/provenance.json`,import.meta.url)));
        assert.equal(p.commit,sha);
        assert.ok(Object.keys(p.sourceFiles).length>=8);
        for (const [file,hash] of Object.entries(p.publishedFiles)) {
            assert.equal(createHash('sha256').update(readFileSync(new URL(`../contracts/${module}/${file}`,import.meta.url))).digest('hex'),hash,file);
        }
    }
    assert.equal(claim.createClaimModule,undefined);
    assert.equal(indexer.createIndexerRunner,undefined);
    assert.deepEqual(Object.keys(ce().errors).sort(),[...claim.CLAIM_ERROR_CODES].sort());
    for (const code of claim.CLAIM_ERROR_CODES) {
        const error=new claim.ClaimError(code);
        assert.deepEqual(ce().errors[code],{status:error.statusCode,body:error.toJSON()});
    }
    assert.equal(ce().errors.CLAIM_NO_RELATION.status,403);
    assert.equal(ce().errors.CLAIM_PROOF_UNAVAILABLE.status,503);
});

test('Claim single start returns claimed; retries do not repeat proof/hook and share one executor', async () => {
    const f=claim.createClaimProviderFixture();
    assert.match(f.label,/FIXTURE/);
    const result=await f.service.startClaim({},hana);
    assert.equal(result.state,'claimed');
    assert.deepEqual(f.events.map(e=>e.toState),['claiming','claimed']);
    assert.equal(f.hookWrites.length,1);
    assert.equal(f.proofActors.length,1);
    assert.ok(f.usedExecutors.every(ex=>ex===f.transactions[0].executor));
    assert.equal(f.transactions[0].outcome,'committed');
    assert.deepEqual(await f.service.startClaim({},hana),result);
    assert.equal(f.proofActors.length,1); assert.equal(f.hookWrites.length,1);
    // start canonical comparison does not replace the actor supplied to proof.
    const alias=claim.createClaimProviderFixture({canonicalIds:{[other]:claim.CLAIM_EXAMPLE.principalId}});
    alias.setPrincipal(other);
    assert.equal((await alias.service.startClaim({},hana)).principalId,claim.CLAIM_EXAMPLE.principalId);
    assert.equal(alias.proofActors[0].principal.principalId,other);
});

test('Claim same-account pending reuses ID, other-account and future start stay 409', async () => {
    const f=claim.createClaimProviderFixture({claims:[ce().pending]});
    assert.equal((await f.service.startClaim({},hana)).claimId,ce().pending.claimId);
    assert.equal(f.claims.length,1); assert.equal(f.hookWrites.length,1);
    f.setPrincipal(other);
    await assert.rejects(f.service.startClaim({},hana),{code:'CLAIM_ALREADY_ACTIVE',statusCode:409});
    for (const state of ['on_chain','withdrawable']) {
        const future=claim.createClaimProviderFixture({claims:[{...ce().claimed,state}]});
        await assert.rejects(future.service.startClaim({},hana),{code:'CLAIM_ALREADY_ACTIVE',statusCode:409});
        await assert.rejects(future.service.verifyClaim({},ce().claimed.claimId),{code:'CLAIM_STAGE_NOT_AVAILABLE',statusCode:409});
    }
    const mismatch=claim.createClaimProviderFixture({claims:[{...ce().pending,githubRepo:'fixture/old'}]});
    await assert.rejects(mismatch.service.startClaim({},hana),{code:'CLAIM_CONFLICT'});
    assert.equal(mismatch.transactions[0].outcome,'rolled-back');
    assert.equal(mismatch.claims[0].githubRepo,'fixture/old');
});

test('Claim start none rejects before transaction; pending survives unavailable proof and can retry', async () => {
    for (const claims of [[],[ce().pending]]) {
        const f=claim.createClaimProviderFixture({claims}); f.setProof('none');
        await assert.rejects(f.service.startClaim({},hana),{code:'CLAIM_NO_RELATION',statusCode:403});
        assert.deepEqual(f.claims,claims); assert.equal(f.transactions.length,0); assert.equal(f.hookWrites.length,0);
        f.setProof('owner',errorWithCode('GITHUB_API_UNAVAILABLE'));
        await assert.rejects(f.service.startClaim({},hana),{code:'CLAIM_PROOF_UNAVAILABLE',statusCode:503});
        assert.deepEqual(f.claims,claims); assert.equal(f.transactions.length,0);
        f.setProof('owner'); assert.equal((await f.service.startClaim({},hana)).state,'claimed');
    }
    for (const [upstream,code] of [['GITHUB_TOKEN_INVALID','CLAIM_GITHUB_LOGIN_REQUIRED'],['IDENTITY_GITHUB_ALREADY_LINKED','CLAIM_GITHUB_ALREADY_LINKED'],['unknown','CLAIM_UNAVAILABLE']]) {
        const f=claim.createClaimProviderFixture(),cause=errorWithCode(upstream); f.setProof('owner',cause);
        await assert.rejects(f.service.startClaim({},hana),e=>e.code===code && e.cause===cause);
    }
});

test('Claim hook failure rolls back synthetic claim/events/host writes, then explicit retry succeeds', async () => {
    for (const claims of [[],[ce().pending]]) {
        const f=claim.createClaimProviderFixture({claims}); f.setHookError(new Error('FIXTURE hook failure'));
        await assert.rejects(f.service.startClaim({},hana),{message:'FIXTURE hook failure'});
        assert.deepEqual(f.claims,claims); assert.deepEqual(f.events,[]); assert.deepEqual(f.hookWrites,[]);
        assert.equal(f.transactions[0].outcome,'rolled-back');
        assert.ok(f.usedExecutors.every(ex=>ex===f.transactions[0].executor));
        f.setHookError(); await f.service.startClaim({},hana);
        assert.equal(f.hookWrites.length,1); assert.equal(f.transactions[1].outcome,'committed');
    }
});

test('Claim retains verify failure DTO and rejects already claimed; pre-opened context rejected before proof', async () => {
    const f=claim.createClaimProviderFixture({claims:[ce().pending]});
    f.setProof('none'); const failed=await f.service.verifyClaim({},ce().pending.claimId);
    assert.deepEqual(failed,ce().verifyNoRelation); assert.equal(f.hookWrites.length,0);
    const unavailable=claim.createClaimProviderFixture({claims:[ce().pending]});
    unavailable.setProof('owner',errorWithCode('GITHUB_API_UNAVAILABLE'));
    await assert.rejects(unavailable.service.verifyClaim({},ce().pending.claimId),{code:'CLAIM_PROOF_UNAVAILABLE'});
    assert.deepEqual(unavailable.claims,[ce().pending]);
    unavailable.setProof('owner'); await unavailable.service.verifyClaim({},ce().pending.claimId);
    await assert.rejects(unavailable.service.verifyClaim({},ce().pending.claimId),{code:'CLAIM_CONFLICT'});
    const unopened=claim.createClaimProviderFixture();
    const context={executor:{query:async()=>({rows:[],rowCount:0})}};
    await assert.rejects(unopened.service.startClaim({},hana,context),TypeError);
    await assert.rejects(unopened.service.verifyClaim({},ce().pending.claimId,context),TypeError);
    assert.equal(unopened.proofActors.length,0); assert.equal(unopened.transactions.length,0);
    assert.deepEqual(await unopened.service.getPublicStatus(hana),{state:'unclaimed',claimedByPrincipalId:null});
});

test('Indexer records actual wire, error channels, composition and all errors', () => {
    const d=indexer.INDEXER_CONTRACT_DEFINITION,e=indexer.createIndexerContractExamples();
    assert.match(e.label,/FIXTURE/);
    assert.equal(d.calls.items.output,'{items: IndexedHanaDTO[], next: string|null}');
    assert.equal(d.calls.hana.at,'GET /v1/indexer/hanas/:hanaId');
    assert.equal(d.calls.run.input,'{source: SourceId}'); assert.equal(d.calls.run.output,'RunResult');
    assert.deepEqual(e.request,{source:'awesome'});
    for (const field of ['runId','startedAt','finishedAt']) {
        assert.equal(field in e.result,false); assert.ok(field in e.runs.items[0]);
    }
    assert.equal('error' in e.result,false); assert.equal(e.runs.items[0].error,null);
    assert.deepEqual(Object.keys(e.errors).sort(),Object.keys(indexer.INDEXER_ERRORS).sort());
    assert.equal(e.errors.INDEXER_CONTENT_SOURCE_UNKNOWN.status,500);
    assert.equal(e.failures.unknownContent.status,502);
    assert.equal(e.failures.collision.status,409);
    for (const failure of Object.values(e.failures)) { assert.equal(failure.body.status,'failed'); assert.equal(typeof failure.body.error,'string'); }
    assert.equal(d.composition.export,'createIndexerComposition');
    assert.match(d.composition.invariant,/context.executor/);
    assert.ok(d.composition.ports.includes('UnitOfWork'));
});

test('Indexer seeded fixture exercises page cursor, filtering, get and run result port', async () => {
    const e=indexer.createIndexerContractExamples();
    const f=indexer.createIndexerProviderFixture({items:[...e.page1.items,...e.page2.items],results:{awesome:e.failures.source.body}});
    const first=await f.service.listItems({limit:1}); assert.deepEqual(first,e.page1);
    assert.deepEqual(await f.service.listItems({after:first.next,limit:1}),e.page2);
    assert.deepEqual(await f.service.getItem(e.item.hanaId),e.item);
    assert.deepEqual(await f.service.listItems({limit:1,updatedSince:'2026-10-12T00:00:00Z'}),{items:[],next:e.item.hanaId});
    await assert.rejects(f.service.listItems({limit:201}),{code:'INDEXER_INVALID_LIMIT',statusCode:400});
    await assert.rejects(f.service.listRuns(0),{code:'INDEXER_INVALID_LIMIT'});
    await assert.rejects(f.service.getItem('missing'),{code:'INDEXER_NOT_FOUND',statusCode:404});
    assert.deepEqual(await f.service.listRuns(),e.runs);
    assert.deepEqual(await f.service.runSource('FIXTURE',{sourceId:'awesome'}),e.failures.source.body);
    await assert.rejects(f.service.applyBatch('FIXTURE',[]),/not simulated/);
});

test('Indexer dedupe/backlink example preserves first identity and three independent source links', () => {
    const {dedupe}=indexer.createIndexerContractExamples();
    assert.deepEqual(new Set(dedupe.inputs.map(i=>i.dedupeKey)),new Set(['gh:example/plugin']));
    assert.equal(dedupe.output.sourceId,'1024store');
    assert.equal(dedupe.output.sourceRef,dedupe.inputs[0].source.sourceRef);
    assert.equal(dedupe.output.displayName,'FIXTURE hanamesh');
    assert.deepEqual(dedupe.output.sourceLinks.map(l=>l.sourceId),['1024store','awesome','hanamesh']);
    for (const [i,link] of dedupe.output.sourceLinks.entries()) {
        assert.equal(link.sourceUrl,dedupe.inputs[i].source.sourceUrl);
        assert.equal(link.sourceRef,dedupe.inputs[i].source.sourceRef);
        assert.ok(link.firstSeenAt); assert.ok(link.lastSeenAt); assert.equal('rawHash' in link,false);
    }
    assert.equal(dedupe.replay.unchanged,1);
});
