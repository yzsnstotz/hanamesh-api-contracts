"""Minimal consumer fixture for C-CONTRACTS-ABI Distributor.claim / ReservedDistributor.claim.

In-memory, no RPC, no ECDSA, no keccak: only the roots, signatures and proofs in
distributor-example.json are "valid". It reproduces the documented order of checks, error
names and Claimed event shapes, not real token transfers.
"""
import json
import pathlib

ZERO = '0x' + '00' * 32
ZERO_ADDRESS = '0x' + '00' * 20
CLAIM_WINDOW = 90 * 24 * 3600
EXAMPLE = json.loads(pathlib.Path(__file__).with_name('distributor-example.json').read_text())


class ContractError(Exception):
    """Carries the custom error name exactly as in the ABI."""


def _key(args, fields):
    return tuple(str(args[f]).lower() for f in fields) + (tuple(p.lower() for p in args['proof']),)


class _Base:
    tree = ''
    fields = ()

    def __init__(self, example=EXAMPLE):
        self.ex = example[self.tree]
        self.token = example['token']
        self.leaves = {_key(c['args'], self.fields) for c in self.ex['claims']}
        self.installed = False
        self.total_claimed = 0
        self.claimed = {}

    def set_root(self, message, signature, now):
        signed = self.ex['setRoot']
        if int(message[self.expiry]) < now:
            raise ContractError('ExpiredAuthorization')
        if message != signed['message'] or signature.lower() != signed['signature'].lower():
            raise ContractError('InvalidAuthorization')
        self.installed, self.opened_at = True, now

    def _pay(self, args, claim_key):
        if _key(args, self.fields) not in self.leaves:
            raise ContractError('InvalidProof')
        amount = int(args['cumulativeAmount']) - self.claimed.get(claim_key, 0)
        if amount <= 0:
            raise ContractError('NothingToClaim')
        if amount > int(self.ex['totalAmount']) - self.total_claimed:
            raise ContractError('ExcessAllocation')
        self.claimed[claim_key] = int(args['cumulativeAmount'])
        self.total_claimed += amount
        return amount


class MockDistributor(_Base):
    tree, fields, expiry = 'distributor', ('hanaId', 'account', 'cumulativeAmount'), 'deadline'

    def claim(self, args, caller):
        if not self.installed or args['account'] == ZERO_ADDRESS:
            raise ContractError('InvalidProof')
        amount = self._pay(args, (args['hanaId'], args['account'].lower()))
        return {'name': 'Claimed', 'hanaId': args['hanaId'], 'token': self.token, 'account': args['account'],
                'amount': str(amount), 'cumulativeAmount': args['cumulativeAmount'], 'rootNonce': 1,
                'caller': caller}


class MockReservedDistributor(_Base):
    tree, expiry = 'reservedDistributor', 'validUntil'
    fields = ('batchId', 'entitlementId', 'account', 'cumulativeAmount')

    def claim(self, args, now):
        if not self.installed or args['entitlementId'] == ZERO or args['account'] == ZERO_ADDRESS:
            raise ContractError('InvalidProof')
        if now >= self.opened_at + CLAIM_WINDOW:
            raise ContractError('ClaimWindowClosed')
        amount = self._pay(args, (args['batchId'], args['entitlementId']))
        return {'name': 'Claimed', 'batchId': args['batchId'], 'entitlementId': args['entitlementId'],
                'account': args['account'], 'amount': str(amount)}


if __name__ == '__main__':
    m = MockReservedDistributor()
    m.set_root(EXAMPLE['reservedDistributor']['setRoot']['message'],
               EXAMPLE['reservedDistributor']['setRoot']['signature'], now=1)
    print(json.dumps(m.claim(EXAMPLE['reservedDistributor']['claims'][0]['args'], now=1)))
