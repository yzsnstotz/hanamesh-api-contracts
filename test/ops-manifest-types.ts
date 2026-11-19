import type {OpsManifest, OpsPageContribution, OpsPageGroup, OpsPagePermission} from '@hanamesh/api-contracts/host/ops-manifest';
const group: OpsPageGroup = {id:'operations',labelKey:'ops.group',order:10};
const permission: OpsPagePermission = {policyId:'module.admin-and-owner'};
const page: OpsPageContribution = {id:'module.page',moduleId:'module',href:'/ops/module',kind:'page',titleKey:'ops.title',descriptionKey:'ops.description',group,order:20,permission};
const manifest: OpsManifest = {schemaVersion:2,paths:['/ops/module','/ops/module/page.js'],pages:[page]};
// @ts-expect-error No implicit group, order or permission defaults.
const undeclared: OpsPageContribution = {id:'module.page',moduleId:'module',href:'/ops/module',kind:'page',titleKey:'ops.title',descriptionKey:'ops.description'};
// @ts-expect-error A policy reference does not grant access.
const granted: OpsPagePermission = {policyId:'module.read',canManage:true};
// @ts-expect-error Old paths-only transport is not the page-declaring protocol.
const old: OpsManifest = {schemaVersion:1,paths:[]};
// @ts-expect-error Host consumers cannot rewrite the module's declaration.
page.order = 0;
void [manifest,undeclared,granted,old];
