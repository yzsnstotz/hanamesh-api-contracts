import {createIndexerContentHashExamples,createIndexerContentHashReadFixture,createIndexerProviderFixture} from '@hanamesh/api-contracts/indexer-catalog';
import type {IndexedHanaDTO,IndexedHanaWithContentHashDTO,IndexerService,IndexerReadService} from '@hanamesh/api-contracts/indexer-catalog';
const {contentHash: _hash,...legacy} = createIndexerContentHashExamples().item;
const oldItem: IndexedHanaDTO = legacy;
const oldService: IndexerService = createIndexerProviderFixture({items:[oldItem]}).service;
const port: Pick<IndexerReadService,'listItems'|'getItem'> = createIndexerContentHashReadFixture().service;
async function consume() {
 const item: IndexedHanaWithContentHashDTO = await port.getItem(oldItem.hanaId);
 const required: string = item.contentHash;
 const page = await port.listItems();
 const hashes: string[] = page.items.map(i=>i.contentHash);
 // @ts-expect-error contentHash is readonly
 item.contentHash = 'rewrite';
 // @ts-expect-error legacy constructor does not guarantee hash
 const invalid: IndexedHanaWithContentHashDTO = oldItem;
 // @ts-expect-error legacy service is not concrete provider's stronger guarantee
 const strong: IndexerReadService = oldService;
 // @ts-expect-error null is not a successful hash
 const nullHash: IndexedHanaWithContentHashDTO = {...oldItem,contentHash:null};
 void [required,hashes,invalid,strong,nullHash];
}
void consume;
