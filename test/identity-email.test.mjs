import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv/dist/2020.js';
import {EMAIL_VERIFICATION_REQUEST_SCHEMA} from '@hanamesh/api-contracts/identity/email';
import schema from '@hanamesh/api-contracts/identity/email/request.schema.json' with {type:'json'};
const validate = new Ajv({strict:true}).compile(EMAIL_VERIFICATION_REQUEST_SCHEMA);
test('email request permits optional BCP47 input without inventing another supported locale enum', () => {
  assert.deepEqual(schema, EMAIL_VERIFICATION_REQUEST_SCHEMA);
  for (const locale of [undefined,'zh','en','ja','pt-BR','es','ko','vi','id','ru','pt','PT-br','es-MX','fr-CA']) {
    assert.equal(validate({email:'a@example.test',...(locale === undefined ? {} : {locale})}),true);
  }
  for (const input of [null,[],{}, {email:42},{email:'a@example.test',locale:null},
    {email:'a@example.test',locale:[]},{email:'a@example.test',locale:3},
    {email:'a@example.test',locale:'en',token:'extra'}]) assert.equal(validate(input),false,JSON.stringify(input));
});
