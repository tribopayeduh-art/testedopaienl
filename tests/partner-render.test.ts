import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PartnerCleanOverview, PartnerCleanAffiliates, partnerTabs } from '../src/components/partner/PartnerCleanUI';
const affiliate={id:'a1',name:'Afiliado teste',email:'teste@example.com',referralCode:'REF123',totalDeposited:1234.56,paidDepositsCount:4,totalPlayersInvited:12,commissionGeneratedForPartner:246.91,revSharePercent:75,isOnlineNow:true} as any;
const data={partner:{},metrics:{totalPartnerCommissions:543.21,totalDepositedByNetwork:9876.54,totalAffiliates:1,activeAffiliatesToday:1,totalPlayersInNetwork:12,ftdCount:4},affiliates:[affiliate],dailyTimeline:[]} as any;
test('partner summary reads financial fields from the dashboard API contract',()=>{
 const html=renderToStaticMarkup(React.createElement(PartnerCleanOverview,{data,link:'https://example.com/p/TEST',copied:false,onCopy:()=>{},onNavigate:()=>{},onQr:()=>{},onDetail:()=>{}}));
 for(const expected of ['543,21','9.876,54','1.234,56','12 jogadores','Sem movimentações disponíveis'])assert.ok(html.includes(expected),expected);
 assert.ok(!html.includes('NaN'));
});
test('affiliate table uses actual player, deposit and commission fields and valid filter statuses',()=>{
 const html=renderToStaticMarkup(React.createElement(PartnerCleanAffiliates,{affiliates:[affiliate],total:1,search:'',onSearch:()=>{},status:'all',onStatus:()=>{},sort:'deposits_desc',onSort:()=>{},advanced:true,onAdvanced:()=>{},revShare:'all',onRevShare:()=>{},onReset:()=>{},onDetail:()=>{},onBroadcast:()=>{}}));
 for(const expected of ['1.234,56','246,91','75%','value="idle"','commission_desc','partner-advanced-filters'])assert.ok(html.includes(expected),expected);
 assert.ok(!html.includes('value="inactive"'));
});
test('mobile overview target belongs to the partner navigation contract',()=>{
 assert.ok(partnerTabs.some(tab=>tab.id==='overview'));
 assert.ok(!partnerTabs.some(tab=>String(tab.id)==='dashboards'));
});
