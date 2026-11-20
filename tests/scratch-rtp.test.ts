import test from 'node:test';
import assert from 'node:assert/strict';
import { drawScratchPrize, scratchRtpModel } from '../server/scratchRtp.ts';

test('configured RTP matches the mathematical expectation of all prize branches', () => {
  const meanMultiplier = Array.from({length:100}, (_, i) => drawScratchPrize(5, 95, (_, max) => max === 100 ? i : 0) / 5).reduce((a,b)=>a+b,0) / 100;
  for (const target of [0.1, 35.27, 65, 94, 99.9, 100]) {
    const {winThreshold} = scratchRtpModel(target);
    assert.ok(Math.abs(100 * meanMultiplier * winThreshold / 1_000_000_000 - target) < 0.000001);
    assert.equal(drawScratchPrize(5, target, () => winThreshold), 0);
  }
  for (const invalid of [0, 100.01, NaN, Infinity]) assert.throws(()=>scratchRtpModel(invalid));
});
