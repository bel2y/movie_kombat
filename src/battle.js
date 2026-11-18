function probability(left        , right        )         {
  return (17 - left) / (34 - left - right);
}
function random()         {
  if (!(typeof crypto !== "undefined" && crypto.getRandomValues)) return Math.random();
  return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
}
function battle(a                  , b                  , draw = random)                      {
  if (!a.length || !b.length) return null;
  const i = Math.floor(draw() * a.length);
  const j = Math.floor(draw() * b.length);
  const left = { movie: a[i], rank: (a[i].rank == null ? i + 1 : a[i].rank) };
  const right = { movie: b[j], rank: (b[j].rank == null ? j + 1 : b[j].rank) };
  const same = left.movie.id === right.movie.id;
  const chance = probability(left.rank, right.rank);
  const winner = same || draw() < chance ? 'left' : 'right';
  const winningRank = winner === 'left' ? left.rank : right.rank;
  let banner = 'WINNER';
  if (same) banner = 'PERFECT MATCH';
  else if (left.rank === right.rank) banner = '50/50';
  else if (winningRank === 1) banner = 'FLAWLESS VICTORY';
  else if (winningRank > Math.min(left.rank, right.rank)) banner = 'UPSET!';
  return { left, right, winner, chance, banner, date: new Date().toISOString() };
}
if (typeof module !== "undefined") module.exports = {battle, probability};
