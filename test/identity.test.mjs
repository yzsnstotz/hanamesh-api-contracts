import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    IDENTITY_CONTRACT_DEFINITION, IDENTITY_ERRORS, IDENTITY_ERROR_CODES, IDENTITY_FIXTURE_LABEL, IDENTITY_PROTOCOL_VERSION,
    IdentityError, checkIdentityProtocolHeader, checkIdentityServices, createIdentityConsumerFixture, createIdentityContractExamples,
    createIdentityServicesFixture, identityHandshakeCases, isIdentityError,
} from '@hanamesh/api-contracts/identity';
import { CONTRACTS } from '@hanamesh/api-contracts';
import { validatorFor } from './schema.mjs';

const schemaUrl = new URL('../contracts/identity/schema.json', import.meta.url);
const schema = JSON.parse(readFileSync(schemaUrl, 'utf8'));
const check = def => validatorFor(schemaUrl, def);
const calls = IDENTITY_CONTRACT_DEFINITION.calls;
const valid = (def, value) => { const verdict = check(def)(value); assert.ok(verdict.ok, `${def}: ${JSON.stringify(verdict.errors)} ${JSON.stringify(value)}`); };

test('C-IDENTITY definition covers every baseline call with the baseline error lists', () => {
    assert.equal(IDENTITY_CONTRACT_DEFINITION.id, 'C-IDENTITY');
    assert.equal(CONTRACTS['C-IDENTITY'].definition, IDENTITY_CONTRACT_DEFINITION);
    assert.deepEqual(Object.keys(calls), ['deviceRegister', 'githubSignIn', 'deviceBind', 'walletBind', 'walletSignIn', 'authenticateDevice', 'custodyAuthenticateResolve', 'githubProof', 'registryAuthenticate', 'hostGetBinding']);
    assert.deepEqual(calls.deviceRegister.baselineErrors, ['IDENTITY_DEVICE_SIGNATURE_INVALID', 'IDENTITY_DEVICE_REPLAY', 'IDENTITY_RATE_LIMITED']);
    assert.deepEqual(calls.custodyAuthenticateResolve.baselineErrors, ['AUTH_REQUIRED', 'IDENTITY_NOT_FOUND']);
    assert.deepEqual(calls.hostGetBinding.baselineErrors, ['IDENTITY_NOT_FOUND']);
    assert.deepEqual(calls.githubProof.baselineErrors, ['GITHUB_NO_RELATION', 'GITHUB_API_UNAVAILABLE', 'GITHUB_TOKEN_INVALID']);
    for (const [name, call] of Object.entries(calls)) {
        for (const code of call.errors) assert.ok(IDENTITY_ERROR_CODES.includes(code), `${name}: ${code} is a provider code`);
        for (const code of call.baselineErrors.filter(code => !call.errors.includes(code)))
            assert.match(call.note, new RegExp(code === 'AUTH_UNAVAILABLE' || code.startsWith('IDENTITY_WALLET') ? 'NOT IMPLEMENTED' : code), `${name}: dropping ${code} is explained`);
    }
});

test('C-IDENTITY states the provider as it is: no invented codes', () => {
    assert.ok(!calls.deviceRegister.errors.includes('IDENTITY_RATE_LIMITED'), 'device registration has no rate limit');
    assert.equal(IDENTITY_CONTRACT_DEFINITION.limits.deviceRegistrationRateLimit, null);
    assert.ok(!calls.custodyAuthenticateResolve.errors.includes('IDENTITY_NOT_FOUND'));
    assert.ok(!calls.hostGetBinding.errors.includes('IDENTITY_NOT_FOUND'));
    assert.ok(!calls.githubProof.errors.includes('GITHUB_NO_RELATION'), 'relation:"none" is a result');
    assert.equal(calls.walletSignIn.implemented, false);
    assert.equal(calls.walletSignIn.followUp, 'J4S1-IDENT-02');
    assert.match(calls.deviceRegister.note, /NO `created` field/);
    assert.deepEqual(calls.walletBind.at, ['POST /v1/identity/me/wallets/challenge', 'POST /v1/identity/me/wallets/bind']);
});

test('C-IDENTITY error table equals the schema (codes and HTTP status)', () => {
    assert.deepEqual([...IDENTITY_ERROR_CODES], schema.$defs.ErrorCode.enum);
    assert.deepEqual(Object.fromEntries(Object.entries(IDENTITY_ERRORS).map(([code, [status]]) => [code, status])), schema['x-hanamesh'].errors);
    const error = new IdentityError('IDENTITY_DEVICE_REPLAY');
    assert.deepEqual(error.toJSON(), { error: { code: 'IDENTITY_DEVICE_REPLAY', message: 'Device nonce was already used' } });
    assert.equal(error.statusCode, 401);
    assert.ok(isIdentityError({ code: 'AUTH_REQUIRED', statusCode: 401 }), 'matches by code, not by constructor');
    assert.ok(!isIdentityError(new Error('x')));
});

test('C-IDENTITY handshake matrix: the reference consumer classifies every case like checkIdentityServices', () => {
    const consumer = createIdentityConsumerFixture();
    for (const { id, value, expect } of identityHandshakeCases()) {
        const result = consumer.accept(value);
        assert.equal(result.status, expect.status, id);
        if (expect.reason) assert.equal(result.reason, expect.reason, id);
        if (expect.missing) assert.deepEqual(result.missing, expect.missing, id);
        if (expect.optional) assert.deepEqual(result.optional, expect.optional, id);
        assert.deepEqual(result, checkIdentityServices(value), id);
    }
    assert.deepEqual(checkIdentityProtocolHeader(IDENTITY_PROTOCOL_VERSION), { ok: true, protocolVersion: '1' });
    assert.equal(checkIdentityProtocolHeader(null).ok, false);
    assert.equal(consumer.describeError(418, { error: { code: 'IDENTITY_FUTURE_CODE' } }), '418 IDENTITY_FUTURE_CODE');
});

test('C-IDENTITY examples (FIXTURE) validate against the wire schema', async () => {
    const examples = await createIdentityContractExamples();
    assert.equal(examples.label, IDENTITY_FIXTURE_LABEL);
    assert.match(examples.label, /^FIXTURE/);
    const { device, canonical, wallet } = examples;
    valid('DeviceChallengeInput', device.challengeInput);
    valid('DeviceChallengeDTO', device.challenge);
    valid('DeviceRegisterInput', device.registerInput);
    assert.equal(device.registerCreated.status, 201);
    assert.equal(device.registerAgain.status, 200);
    assert.deepEqual(device.serviceResult, { created: true, againCreated: false });
    for (const wire of [device.registerCreated, device.registerAgain]) {
        valid('DeviceRegisterResponse', wire.body);
        assert.ok(!('created' in wire.body), 'created is not on the wire');
    }
    assert.equal(device.registerAgain.body.deviceId, device.registerCreated.body.deviceId);
    assert.deepEqual(device.registerAgain.body.label, device.registerCreated.body.label, 'label kept when re-registered without one');
    valid('DeviceAuthHeaders', device.authHeaders);
    valid('DeviceBindInput', device.bindInput);
    valid('BindingDTO', device.binding);
    assert.deepEqual(device.errors.IDENTITY_DEVICE_REPLAY, { code: 'IDENTITY_DEVICE_REPLAY', statusCode: 401 });
    assert.equal(device.errors.IDENTITY_DEVICE_SIGNATURE_INVALID.code, 'IDENTITY_DEVICE_SIGNATURE_INVALID');
    assert.equal(device.errors.IDENTITY_DEVICE_ALREADY_BOUND.statusCode, 409);
    assert.equal(device.errors.authenticateDeviceReplay.code, 'IDENTITY_DEVICE_REPLAY');

    for (const resolution of [canonical.beforeBind, canonical.afterBind, canonical.unknown]) valid('PrincipalResolution', resolution);
    assert.equal(canonical.beforeBind.canonicalPrincipalId, device.registerCreated.body.principalId, 'unlinked device resolves to itself');
    assert.equal(canonical.afterBind.canonicalPrincipalId, device.binding.accountPrincipalId);
    assert.deepEqual(canonical.afterBind.linkedDevicePrincipalIds, [device.registerCreated.body.principalId]);
    assert.deepEqual(canonical.unknown, { canonicalPrincipalId: canonical.unknownPrincipalId, linkedDevicePrincipalIds: [] }, 'unknown id returned as is, no IDENTITY_NOT_FOUND');

    assert.equal(examples.getBinding.unbound, null);
    assert.equal(examples.getBinding.unknownPrincipal, null, 'unknown principal → null, no IDENTITY_NOT_FOUND');
    assert.equal(examples.getBinding.IDENTITY_INPUT_INVALID.code, 'IDENTITY_INPUT_INVALID');
    assert.equal(examples.github.GITHUB_TOKEN_INVALID.code, 'GITHUB_TOKEN_INVALID');
    assert.equal(examples.authenticate.AUTH_REQUIRED.statusCode, 401);

    valid('WalletChallengeInput', wallet.challengeInput);
    valid('WalletChallengeDTO', wallet.challenge);
    assert.ok(wallet.challenge.message.includes(wallet.challenge.nonce) && wallet.challenge.message.includes(wallet.challenge.address));
    valid('WalletBindInput', wallet.bindInput);
    assert.equal(wallet.bindCreated.status, 201);
    assert.equal(wallet.bindExisting.status, 200);
    valid('WalletBindResponse', wallet.bindCreated.body);
    valid('WalletBindResponse', wallet.bindExisting.body);
    assert.equal(wallet.bindCreated.body.created, true);
    assert.equal(wallet.bindExisting.body.created, false);
    valid('WalletBindingDTO', wallet.getBinding);
    assert.deepEqual(wallet.getBinding, wallet.bindCreated.body.binding);
    assert.deepEqual(Object.fromEntries(Object.entries(wallet.errors).map(([k, v]) => [k, v.code])),
        { IDENTITY_WALLET_REPLAY: 'IDENTITY_WALLET_REPLAY', IDENTITY_WALLET_SIGNATURE_INVALID: 'IDENTITY_WALLET_SIGNATURE_INVALID', IDENTITY_WALLET_ALREADY_BOUND: 'IDENTITY_WALLET_ALREADY_BOUND' });

    const codes = new Set(examples.errorEnvelopes.map(envelope => envelope.body.error.code));
    for (const envelope of examples.errorEnvelopes) {
        valid('ErrorResponse', envelope.body);
        assert.equal(envelope.status, IDENTITY_ERRORS[envelope.body.error.code][0]);
    }
    for (const call of Object.values(calls)) for (const code of call.errors) assert.ok(codes.has(code), `${code} has an error envelope example`);
});

test('C-IDENTITY schema rejects the shapes the provider does not send or accept', () => {
    const principalId = '00000000-0000-4000-8000-000000000000', deviceId = 'A'.repeat(43);
    assert.equal(check('DeviceRegisterResponse')({ deviceId, principalId, created: true }).ok, false, 'no created on the wire');
    assert.equal(check('DeviceChallengeInput')({}).ok, false, 'purpose required');
    assert.equal(check('DeviceChallengeInput')({ purpose: 'login' }).ok, false);
    assert.equal(check('WalletBindInput')({ chainId: 1, address: '0x' + '1'.repeat(40), signature: '0x00' }).ok, false, 'bind takes {nonce, signature} only');
    assert.equal(check('WalletBindResponse')({ principalId, deploymentId: 'd', chainId: 1, address: '0x' + '1'.repeat(40), proofMethod: 'siwe-eoa', boundAt: '2026-10-11T00:00:00.000Z' }).ok, false, 'bind answers {binding, created}');
    assert.equal(check('ErrorResponse')({ error: { code: 'IDENTITY_UNKNOWN', message: 'x' } }).ok, false);
});

test('C-IDENTITY {wallets:false} skips the viem-only wallet examples; non-wallet ports never load viem', async () => {
    const examples = await createIdentityContractExamples({ wallets: false });
    assert.equal(examples.wallet, null);
    const { services, credentials } = createIdentityServicesFixture();
    const actor = await services.authenticate(credentials);
    assert.equal(await services.wallets.getBinding({ principalId: actor.principal.principalId, chainId: 1 }), null);
    await assert.rejects(services.authenticate({ cookie: 'nope' }), { code: 'AUTH_REQUIRED', statusCode: 401 });
});
