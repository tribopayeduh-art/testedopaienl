import {test} from 'node:test';import assert from 'node:assert/strict';import{buildReportCsv}from'../src/lib/reportExport.ts';
test('CSV protege células de texto sem corromper valores numéricos negativos',()=>{
 const csv=buildReportCsv(['Nome','Fluxo BRL'],[['=HYPERLINK("evil")',-40],['\t+SUM(1)',0],['José; "J"',12.5]]);
 assert.ok(csv.startsWith('\uFEFF'));
 assert.ok(csv.includes('"\'=HYPERLINK(""evil"")";"-40"'));
 assert.ok(csv.includes('"\'\t+SUM(1)";"0"'));
 assert.ok(csv.includes('"José; ""J""";"12.5"'));
});
