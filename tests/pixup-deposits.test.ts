import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesPixupDeposit, parsePixupDepositEvent, pixupDepositCents } from '../server/pixupDeposits.ts';
import { requestPixupCashin } from '../server/pixupCashin.ts';

const reference = 'inex-dep-' + 'a'.repeat(32);
const eventName = 'cashin.confirmed';
const data = { external_id:reference,transaction_id:'pix_123',type:'cashin',currency:'BRL',status:'confirmed',amount:'20.10' };
const event = {event:eventName,transaction_id:data.transaction_id,data};

test('only matches confirmed BRL Pixup deposits against the saved charge and exact amount', () => {
  const parsed = parsePixupDepositEvent(event,eventName)!;
  assert.equal(parsed.cents,2010);
  const charge = {id:'pix_123',gateway:'pixup',value:2010,userId:'player'};
  assert.equal(matchesPixupDeposit(charge,parsed),true);
  for (const override of [{value:2011},{gateway:'dotfy'},{userId:undefined},{id:'other'}]) assert.equal(matchesPixupDeposit({...charge,...override},parsed),false);
  assert.equal(parsePixupDepositEvent({...event,data:{...data,status:'pending'}},eventName),null);
  assert.equal(parsePixupDepositEvent({...event,data:{...data,external_id:'inex-admin-other'}},eventName),null);
  assert.throws(()=>parsePixupDepositEvent({...event,transaction_id:'other'},eventName));
  for (const invalid of ['20.101', '20xyz', -1, '0.99', Infinity]) assert.equal(pixupDepositCents(invalid),null);
});

test('cash-in sends the callback and rejects a provider charge with mismatched amount', async () => {
  process.env.PIXUP_CLIENT_ID='test-id';
  process.env.PIXUP_CLIENT_SECRET='test-secret';
  const input={amount:20.1,external_id:reference,postback_url:'https://example.com/api/webhooks/pixup'};
  const send = (remoteAmount:number):typeof fetch => async (url,init) => {
    if(String(url).endsWith('/oauth/token'))return Response.json({access_token:'fake-token',expires_in:3600});
    assert.deepEqual(JSON.parse(String(init?.body)),{...input,currency:'BRL'});
    return Response.json({success:true,data:{...data,amount:remoteAmount,payment_method:'pix',status:'pending',payment_info:{qrcode:'mock-pix'}}});
  };
  assert.equal((await requestPixupCashin(input,send(20.1))).qrcode,'mock-pix');
  assert.equal((await requestPixupCashin(input,send(21))).status,502);
});
