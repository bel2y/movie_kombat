export interface Movie { id: number; title: string; year: number; genre: string; poster?: string }
interface Entry { movie: Movie; rank: number }
export type Side = 'left' | 'right';
export interface BattleResult {
  left: Entry;
  right: Entry;
  winner: Side;
  chance: number;
  banner: string;
  date: string;
}

export function probability(left: number, right: number): number {
  return (17 - left) / (34 - left - right);
}

function random(): number {
  if (!globalThis.crypto?.getRandomValues) return Math.random();
  return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
}

export function battle(a: readonly Movie[], b: readonly Movie[], draw = random): BattleResult | null {
  if (!a.length || !b.length) return null;
  const i = Math.floor(draw() * a.length);
  const j = Math.floor(draw() * b.length);
  const left = { movie: a[i], rank: i + 1 };
  const right = { movie: b[j], rank: j + 1 };
  const same = left.movie.id === right.movie.id;
  const chance = probability(left.rank, right.rank);
  const winner = same || draw() < chance ? 'left' : 'right';
  const winningRank = winner === 'left' ? left.rank : right.rank;
  let banner = 'WINNER';
  if (same) banner = 'PERFECT MATCH';
  else if (i === j) banner = '50/50';
  else if (winningRank === 1) banner = 'FLAWLESS VICTORY';
  else if (winningRank > Math.min(left.rank, right.rank)) banner = 'UPSET!';
  return { left, right, winner, chance, banner, date: new Date().toISOString() };
}
