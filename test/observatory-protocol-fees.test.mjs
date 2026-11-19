import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv';
import {OBSERVATORY_SCHEMA} from '@hanamesh/api-contracts/ops/observatory';
const validate = new Ajv({strict:true}).compile(OBSERVATORY_SCHEMA);
const address=n=>'0x'+n.toString(16).padStart(40,'0');
const source={module:'chain',port:'readHanaSwapProtocolFeePositions',definition:'HanaSwap feeTo protocol fee: held LP and same-block redeemable underlying amounts; not realized cash',asOf:'2026-11-19T00:00:00.000Z'};
const network={chainId:97,kind:'testnet',blockNumber:'123'};
const settings=()=>({factory:address(1),feeTo:address(2),feeToSetter:address(3),platformWallet:address(2),enabled:true,platformIsRecipient:true,rateBps:5,network});
const position=()=>({pool:address(4),lpBalance:'100',totalSupply:'1000',withdrawalSupply:'1010',unmintedProtocolLp:'10',share:{numerator:'100',denominator:'1010'},withdrawable:[{amount:'200',currency:address(5),decimals:18,network},{amount:'300',currency:address(6),decimals:18,network}]});
const body=()=>({schemaVersion:1,generatedAt:source.asOf,timezone:'UTC',income:[{id:'rev.protocolFee',source,availability:'available',value:{accounting:'revenue',amounts:[],protocolFees:{settings:settings(),scope:'explicit-pool-page',positions:[position()]}}}],spending:[],people:[],health:[],parameters:[{id:'params.protocolFee',source:{...source,port:'readHanaSwapProtocolFeeSettings'},availability:'available',value:{value:true,unit:'enabled',changedBy:'operations',effective:'running',meaning:'协议手续费（feeTo，0.05%）：开关与可修改地址',impact:'feeToSetter controls feeTo and feeToSetter',protocolFee:settings()}}]});

test('feeTo protocol fee income and its actual setter parameter are structured read-only facts',()=>{
 assert.equal(validate(body()),true,JSON.stringify(validate.errors));
});
test('disabled feeTo preserves already held LP; unavailable protocol income never pretends to be a structural zero',()=>{
 const value=body();const settings=value.income[0].value.protocolFees.settings;
 Object.assign(settings,{feeTo:address(0),enabled:false,platformIsRecipient:false});
 value.parameters[0].value.protocolFee={...settings};value.parameters[0].value.value=false;
 assert.equal(validate(value),true,JSON.stringify(validate.errors));
 const pending={id:'rev.protocolFee',source:{...source,asOf:null},availability:'pending',reason:'CHAIN_PROTOCOL_FEE_PORT_PENDING'};
 assert.equal(validate({...body(),income:[pending]}),true);
 pending.value={accounting:'revenue',amounts:[]};assert.equal(validate({...body(),income:[pending]}),false);
});
test('settings require Factory feeTo and feeToSetter, actual network and the 0.05 percent protocol rate',()=>{
 for(const key of Object.keys(settings())){const value=body();delete value.income[0].value.protocolFees.settings[key];assert.equal(validate(value),false,key);}
 for(const field of ['factory','feeTo','feeToSetter','platformWallet']){const value=body();value.income[0].value.protocolFees.settings[field]='not-an-address';assert.equal(validate(value),false,field);}
 const value=body();value.income[0].value.protocolFees.settings.rateBps=30;assert.equal(validate(value),false);
 value.income[0].value.protocolFees.settings.rateBps=5;value.parameters[0].value.protocolFee.setFeeTo='write';assert.equal(validate(value),false);
});
test('held LP, unminted fees and diluted withdrawal quantities cannot lose integer precision or become an unbounded pool scan',()=>{
 const value=body();const p=value.income[0].value.protocolFees.positions[0];
 p.lpBalance='123456789012345678901234567890';assert.equal(validate(value),true);
 for(const key of ['lpBalance','totalSupply','withdrawalSupply','unmintedProtocolLp','share','withdrawable']){const invalid=body();delete invalid.income[0].value.protocolFees.positions[0][key];assert.equal(validate(invalid),false,key);}
 p.lpBalance=0.5;assert.equal(validate(value),false);
 const invalid=body();invalid.income[0].value.protocolFees.positions=Array.from({length:65},()=>position());assert.equal(validate(invalid),false);
 const more=body();more.income[0].value.protocolFees.positions[0].withdrawable.push({...position().withdrawable[0]});assert.equal(validate(more),false);
});
