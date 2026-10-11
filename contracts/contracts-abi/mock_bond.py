"""Minimal offline Bond consumer fixture: integer quotes/events, no tokens, router or RPC.

The reference is fixture-only (1e15 USD/HARN e18). Migration only closes the mock;
it supplies no Migrated receipt or pool proof. Use Foundry tests for contract security.
"""
import json
import pathlib

SALES = 650_000_000 * 10**18
VIRTUAL_HANA = 845_000_000 * 10**18
VIRTUAL_HARN = 2_957_500_000_000_000_000_000 * 10**18 // 10**15
PAYER = '0x0000000000000000000000000000000000000111'


class ContractError(ValueError):
    pass


def reserve(sold):
    return (VIRTUAL_HARN * sold + VIRTUAL_HANA - sold - 1) // (VIRTUAL_HANA - sold)


def fees(principal):
    hana = principal * 4 // 1000
    return hana, principal // 100 - hana


class MockBond:
    def __init__(self, sold=0):
        self.sold = sold

    def _valid(self, args, now):
        if self.sold >= SALES:
            raise ContractError('Closed')
        if int(args['recipient'], 16) == 0 or int(args['deadline']) < now:
            raise ContractError('InvalidTrade')

    def _buy(self, amount, args):
        principal = reserve(self.sold + amount) - reserve(self.sold)
        hana, mesh = fees(principal)
        self.sold += amount
        return amount, self._event('Bought', 'hanaOut', amount, principal, hana, mesh, args)

    def _event(self, name, amount_field, amount, principal, hana, mesh, args):
        return {'name': name, 'payer': PAYER, 'recipient': args['recipient'],
                amount_field: str(amount), 'principal': str(principal),
                'hanaFee': str(hana), 'meshFee': str(mesh)}

    def buyExact(self, args, now):
        self._valid(args, now)
        requested = int(args['requested'])
        if requested <= 0:
            raise ContractError('InvalidTrade')
        amount = min(requested, SALES - self.sold)
        principal = reserve(self.sold + amount) - reserve(self.sold)
        if principal + principal // 100 > int(args['maxSpend']):
            raise ContractError('Slippage')
        return self._buy(amount, args)

    def buyBudget(self, args, now):
        self._valid(args, now)
        budget = int(args['budget'])
        if budget <= 0:
            raise ContractError('InvalidTrade')
        lo, hi = 0, SALES - self.sold
        while lo < hi:
            mid = lo + (hi - lo + 1) // 2
            principal = reserve(self.sold + mid) - reserve(self.sold)
            if principal + principal // 100 <= budget:
                lo = mid
            else:
                hi = mid - 1
        if lo == 0:
            raise ContractError('InvalidTrade')
        if lo < int(args['minHana']):
            raise ContractError('Slippage')
        return self._buy(lo, args)

    def sell(self, args, now):
        self._valid(args, now)
        amount = int(args['amount'])
        if amount <= 0 or amount > self.sold:
            raise ContractError('InvalidTrade')
        principal = reserve(self.sold) - reserve(self.sold - amount)
        hana, mesh = fees(principal)
        result = principal - hana - mesh
        if result < int(args['minReceive']):
            raise ContractError('Slippage')
        self.sold -= amount
        return result, self._event('Sold', 'hanaIn', amount, principal, hana, mesh, args)


if __name__ == '__main__':
    example = json.loads(pathlib.Path(__file__).with_name('bond-example.json').read_text())
    print(json.dumps({name: getattr(MockBond(int(example[name]['soldBefore'])), name)(
        example[name]['args'], now=1) for name in ['buyExact', 'buyBudget', 'sell']}))
