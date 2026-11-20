import { randomInt } from 'node:crypto';

const SCALE = 1_000_000_000;

// Conditional prize table. Balance, player identity and previous results never change the odds.
const prizes = [
  { multiplier: 2, weight: 50 },
  { multiplier: 4, weight: 28 },
  { multiplier: 10, weight: 16 },
  { multiplier: 25, weight: 6 },
] as const;
const conditionalMean = prizes.reduce((sum, prize) => sum + prize.multiplier * prize.weight, 0) / 100;

export function scratchRtpModel(rtpPercent: number) {
  if (!Number.isFinite(rtpPercent) || rtpPercent < 0.1 || rtpPercent > 100) throw new Error('RTP da raspadinha inválido.');
  const winThreshold = Math.round(SCALE * rtpPercent / (100 * conditionalMean));
  return { winThreshold, expectedRtpPercent: 100 * conditionalMean * winThreshold / SCALE };
}

export function drawScratchPrize(price: number, rtpPercent: number, draw = randomInt) {
  const stakeCents = Math.round(price * 100);
  if (!Number.isSafeInteger(stakeCents) || stakeCents <= 0 || !Number.isSafeInteger(stakeCents * 25)) throw new Error('Preço da raspadinha inválido.');
  const { winThreshold } = scratchRtpModel(rtpPercent);
  if (draw(0, SCALE) >= winThreshold) return 0;
  let roll = draw(0, 100);
  for (const prize of prizes) {
    if (roll < prize.weight) return stakeCents * prize.multiplier / 100;
    roll -= prize.weight;
  }
  throw new Error('Sorteio inválido.');
}
