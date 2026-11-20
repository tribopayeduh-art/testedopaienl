import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessAdmin } from '../src/admin/permissions';
test('admin access requires an active administrator account', () => {
  for (const user of [null, undefined, {}, {role:'affiliate'}, {role:'partner'}, {role:'admin',isBlocked:true}, {role:'superadmin',isBlocked:true}]) assert.equal(canAccessAdmin(user), false);
  for (const role of ['admin','superadmin']) assert.equal(canAccessAdmin({role,isBlocked:false}), true);
});
