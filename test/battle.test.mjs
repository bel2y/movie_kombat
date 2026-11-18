import { test } from 'node:test';
import assert from 'node:assert/strict';
import engine from '../src/battle.js';
const {battle, probability, strength, recordLoss} = engine;
const films = Array.from({ length: 16 }, (_, i) => ({ id: i, title: String(i), year: 2000, genre: 'Drama' }));
const other = films.map(movie => ({ ...movie, id: movie.id + 16 }));
const draws = (...values          ) => () => {
  assert.ok(values.length, 'extra random draw');
  return values.shift() ;
};
test('uses the specified rank weights', () => {
  assert.equal(probability(0, 0), .5);
  assert.ok(probability(1, 0) > .84 && probability(1, 0) < .85);
  assert.ok(Math.abs(probability(.7,.2) + probability(.2,.7) - 1) < 1e-12);
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
  assert.equal(battle(films.slice(0, 2), other.slice(0, 1), draws(.8, 0, 0))?.banner, 'UPSET!');
});

test('filtered lists preserve original desire ranks and matching-rank banner', () => {
  const a = [{ ...films[0], rank: 16, listSize:16 }];
  const b = [{ ...other[0], rank: 1, listSize:16 }];
  const result = battle(a, b, draws(0, 0, 0));
  assert.equal(result.chance, probability(.25*.65, .6+.25*.65));
  assert.equal(result.banner, 'UPSET!');
  assert.equal(result.left.rank, 16);
});
