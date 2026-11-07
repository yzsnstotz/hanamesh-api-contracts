import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {QUOTE_V2_CONTRACT as c} from '@hanamesh/api-contracts/chain/quote-v2';
test('quote-v2 source manifest and all six exported artifacts are pinned',async()=>{const dir=new URL('../contracts/chain/quote-v2/',import.meta.url),raw=await readFile(new URL('manifest.json',dir));assert.equal(createHash('sha256').update(raw).digest('hex'),c.manifestSHA256);const m=JSON.parse(raw);assert.equal(m.revision,c.revision);assert.equal(Object.keys(m.contracts).length,6);for(const [name,pin]of Object.entries(m.contracts)){const a=await readFile(new URL(name+'.json',dir));assert.equal(createHash('sha256').update(a).digest('hex'),pin.fileSHA256);}});
test('quote-v2 consumer metadata exposes pending semantics without provider runtime stubs',async()=>{const mod=await import('@hanamesh/api-contracts/chain/quote-v2');assert.deepEqual(Object.keys(mod),['QUOTE_V2_CONTRACT']);assert.equal(c.launcherDomainVersion,'4');assert.equal(c.releaseDomainVersion,'3');assert.equal(c.migrationReasons[1],'HistoryUnavailable');assert.deepEqual(c.migrationReasons,['None','HistoryUnavailable','PriceOutsideBand','NoFeasibleLiquidity']);});

test('root exposes only real current metadata and old declaration families are absent',async()=>{
 const root=await import('@hanamesh/api-contracts');
 assert.deepEqual(Object.keys(root),['QUOTE_V2_CONTRACT']);assert.equal(root.QUOTE_V2_CONTRACT,c);
 for(const path of ['chain','contracts-abi','points','claim','catalog','usage','semantic'])
  await assert.rejects(import('@hanamesh/api-contracts/'+path),{code:'ERR_PACKAGE_PATH_NOT_EXPORTED'});
});

test('current token artifact exposes timestamp voting and EIP-2612 without administration',async()=>{
 const {default:token}=await import('@hanamesh/api-contracts/chain/quote-v2/HanaTokenQuoteV2.json',{with:{type:'json'}});
 const functions=new Map(token.abi.filter(a=>a.type==='function').map(a=>[a.name,a]));
 for(const name of ['permit','nonces','DOMAIN_SEPARATOR','delegate','delegateBySig','delegates','getVotes','getPastVotes','getPastTotalSupply','clock','CLOCK_MODE'])assert.ok(functions.has(name),name);
 assert.equal(functions.get('clock').outputs[0].type,'uint48');
 assert.deepEqual(functions.get('permit').inputs.map(x=>x.type),['address','address','uint256','uint256','uint8','bytes32','bytes32']);
 for(const name of ['owner','mint','burn','upgradeTo','transferOwnership'])assert.equal(functions.has(name),false,name);
 assert.equal(c.revision,'2.3.0');
});

test('provider declarations match their recorded source snapshot without loading provider implementation',async()=>{
 const dir=new URL('../contracts/chain/quote-v2/',import.meta.url),provenance=JSON.parse(await readFile(new URL('provenance.json',dir),'utf8'));
 const declarations=await readFile(new URL('provider.d.ts',dir));
 assert.equal(createHash('sha256').update(declarations).digest('hex'),provenance.providerDeclarationsSHA256);
 assert.equal(provenance.providerVersion,'0.39.13');assert.match(provenance.providerCommit,/^[0-9a-f]{40}$/);
 assert.match(declarations.toString(),/readMarketHistoryBatch\(input:QuoteV2MarketHistoryBatchQuery\)/);
 assert.match(declarations.toString(),/withMarketHistoryBatch<T>/);
});
