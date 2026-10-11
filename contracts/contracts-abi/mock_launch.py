"""Minimal consumer fixture for C-CONTRACTS-ABI LaunchFee.pay + HanaLauncher.launch.

In-memory, no RPC, no ECDSA: only the signatures in launch-example.json are "valid".
It reproduces the documented order of checks and error names, not real token transfers.
"""
import json
import pathlib

ZERO = '0x' + '00' * 32
EXAMPLE = json.loads(pathlib.Path(__file__).with_name('launch-example.json').read_text())
TOTAL = 10**27


class ContractError(Exception):
    """Carries the custom error name exactly as in the ABI."""


class MockLaunch:
    def __init__(self, example=EXAMPLE):
        self.example = example
        self.launcher = example['launch']['domain']['verifyingContract']
        self.payments = {}
        self.issuances = {}
        self.requests = {}

    def pay(self, hana_id, request_id, sender):
        if hana_id == ZERO or request_id == ZERO:
            raise ContractError('InvalidRequest')
        if request_id in self.payments:
            raise ContractError('RequestAlreadyPaid')
        self.payments[request_id] = {'payer': sender, 'hanaId': hana_id, 'amount': self.example['pay']['feeAmount']}
        return {'name': 'LaunchFeePaid', 'hanaId': hana_id, 'requestId': request_id, 'payer': sender,
                'token': self.example['pay']['feeToken'], 'treasury': self.example['pay']['treasury'],
                'amount': self.example['pay']['feeAmount']}

    def launch(self, a, signature, now):
        required = ['hanaId', 'requestId', 'subject', 'snapshot']
        if (any(a[k] == ZERO for k in required) or int(a['harnUsdE18']) == 0 or not a['name']
                or not a['symbol'] or int(a['deadline']) < now):
            raise ContractError('InvalidAuthorization')
        if a['hanaId'] in self.issuances or a['requestId'] in self.requests:
            raise ContractError('AlreadyIssued')
        signed = self.example['launch']['args']
        if a != signed['authorization'] or signature.lower() != signed['signature'].lower():
            raise ContractError('InvalidAuthorization')
        paid = self.pay(a['hanaId'], a['requestId'], self.launcher)
        ret = self.example['launch']['mockReturn']
        self.requests[a['requestId']] = a['hanaId']
        self.issuances[a['hanaId']] = dict(ret, payer=a['payer'])
        issued = {'name': 'Issued', 'hanaId': a['hanaId'], 'requestId': a['requestId'], 'token': ret['token'],
                  'bond': ret['bond'], 'payer': a['payer'], 'authorizationHash': self.example['launch']['digest']}
        return ret, [paid, issued], TOTAL


if __name__ == '__main__':
    args = EXAMPLE['launch']['args']
    print(json.dumps(MockLaunch().launch(args['authorization'], args['signature'], now=1)[1][-1]))
