const SCORING = Object.freeze({desire: .60, rating: .25, losses: .15, priorRating: 6.5, priorVotes: 500, maxLosses: 5});
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function strength(movie, fallbackRank = 1, fallbackSize = 16) {
  const size = Math.max(1, Number(movie.listSize) || fallbackSize);
  const rank = clamp(Number(movie.rank) || fallbackRank, 1, size);
  const desire = size === 1 ? 1 : (size - rank) / (size - 1);
  const valid = Number.isFinite(movie.voteAverage) && movie.voteAverage >= 0 && movie.voteAverage <= 10 && Number.isFinite(movie.voteCount) && movie.voteCount > 0;
  const votes = valid ? movie.voteCount : 0;
  const average = valid ? movie.voteAverage : SCORING.priorRating;
  const rating = (votes * average + SCORING.priorVotes * SCORING.priorRating) / (votes + SCORING.priorVotes) / 10;
  const losses = clamp(Number(movie.losses) || 0, 0, SCORING.maxLosses) / SCORING.maxLosses;
  return {desire, rating, losses, ratingAvailable: valid, total: SCORING.desire * desire + SCORING.rating * rating + SCORING.losses * losses};
}
function probability(left, right) {
  return .15 + .70 / (1 + Math.exp(-5 * (left - right)));
}
function recordLoss(counts, result) {
  if (!result || result.solo || !result.left || !result.right || result.left.movie.id === result.right.movie.id) return counts;
  const side = result.winner === 'left' ? 'right' : result.winner === 'right' ? 'left' : null;
  if (!side) return counts;
  const key = side + ':' + result[side].movie.id;
  counts[key] = Math.min(SCORING.maxLosses, (Number(counts[key]) || 0) + 1);
  return counts;
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
  left.score = strength(a[i], left.rank, a[i].listSize || Math.max(a.length, ...a.map(m=>m.rank || 0)));
  right.score = strength(b[j], right.rank, b[j].listSize || Math.max(b.length, ...b.map(m=>m.rank || 0)));
  const chance = same ? 1 : probability(left.score.total, right.score.total);
  const winner = same || draw() < chance ? 'left' : 'right';
  const winningRank = winner === 'left' ? left.rank : right.rank;
  let banner = 'WINNER';
  if (same) banner = 'PERFECT MATCH';
  else if (Math.abs(chance - .5) < 1e-12) banner = '50/50';
  else if (winningRank === 1) banner = 'FLAWLESS VICTORY';
  else if ((winner === 'left' ? chance : 1 - chance) < .5) banner = 'UPSET!';
  return { formulaVersion: 2, left, right, winner, chance, banner, date: new Date().toISOString() };
}
function chooseRound(a, b, draw = random) {
  if (a.length && b.length) return battle(a, b, draw);
  if (!a.length && !b.length) return null;
  const side = a.length ? 'left' : 'right';
  const list = a.length ? a : b;
  const index = Math.floor(draw() * list.length);
  const movie = list[index];
  return {solo: true, winner: side, [side]: {movie, rank: movie.rank == null ? index + 1 : movie.rank}, date: new Date().toISOString()};
}
if (typeof module !== "undefined") module.exports = {battle, probability, chooseRound, strength, recordLoss, SCORING};
