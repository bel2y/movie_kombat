import { test } from 'node:test';
import assert from 'node:assert/strict';
import engine from '../src/battle.js';
const {battle, strength} = engine;
const films = Array.from({ length: 16 }, (_, i) => ({ id: i, title: String(i), year: 2000, genre: 'Drama' }));
const other = films.map(movie => ({ ...movie, id: movie.id + 16 }));
const draws = (...values          ) => () => {
  assert.ok(values.length, 'extra random draw');
  return values.shift() ;
};
test('visible power is the sum of visible component points', () => {
  const score=strength({rank:3,listSize:16,voteAverage:7.85,voteCount:1234,losses:2});
  assert.equal(score.power,Math.round(score.points.reduce((sum,n)=>sum+n,0)*10)/10);
});
test('all sixteen participants have equal selection intervals', () => {
  for (let i = 0; i < 16; i++) {
    const result = battle(films, other, draws((i + .5) / 16, 0, .99)) ;
    assert.equal(result.left.movie.id, i);
    assert.equal(result.right.movie.id, 16);
    assert.equal(result.winner, 'right');
  }
});
test('same ID wins without a third random draw', () => {
  assert.equal(battle(films, films, draws(0, 0))?.banner, 'PERFECT MATCH');
});
test('empty lists do not draw and short lists preserve absolute ranks', () => {
  assert.equal(battle([], films, draws()), null);
  assert.equal(battle(films, [], draws()), null);
  assert.equal(battle(films.slice(0, 2), other.slice(0, 1), draws(.8, 0))?.winner, 'right');
});

test('filtered lists preserve original desire ranks and matching-rank banner', () => {
  const a = [{ ...films[0], rank: 16, listSize:16 }];
  const b = [{ ...other[0], rank: 1, listSize:16 }];
  const result = battle(a, b, draws(0, 0, 0));
  assert.equal(result.winner,'right');
  assert.equal(result.banner, 'FLAWLESS VICTORY');
  assert.equal(result.left.rank, 16);
});
