import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {QUOTE_V2_CONTRACT as contract} from '@hanamesh/api-contracts/chain/quote-v2';
test('the consumer mirror advertises ABI 2.4.0 and contains only atomic graduation interfaces',async()=>{
 assert.equal(contract.revision,'2.4.0');assert.equal(contract.sourceCommit,'ea2d77cee056a575c2f6232281c03ff014cf8612');
 assert.equal(Object.hasOwn(contract,'migrationReasons'),false);
 const artifact=JSON.parse(await readFile(new URL('../contracts/chain/quote-v2/HanaBondQuoteV2.json',import.meta.url)));
 for(const name of ['migrationStatus','migrationHana','migrationPoolHana','migrate','MigrationDeferred'])assert.equal(artifact.abi.some(x=>x.name===name),false,name);
 const declarations=await readFile(new URL('../contracts/chain/quote-v2/provider.d.ts',import.meta.url),'utf8');
 for(const name of ['QuoteV2MigrationStatus','QuoteV2MigrationReason','migrationHana','migrationPoolHana','MigrationDeferred'])assert.doesNotMatch(declarations,new RegExp('\\b'+name+'\\b'));
 assert.match(declarations,/readonly migrated:boolean/);assert.match(declarations,/quoteV2AdvanceEpochTypedData/);
});
