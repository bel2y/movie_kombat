import { test } from 'node:test';
import assert from 'node:assert/strict';
import reelModule from '../src/reel.js';
const { buildReel } = reelModule;

test('repeated reels cover both viewport edges throughout travel and stop on the selected film', () => {
  for (const width of [360, 1920, 3840, 7680]) {
    for (const count of [1, 2, 16]) {
      const movies = Array.from({ length: count }, (_, id) => ({ id }));
      for (const selected of movies) {
        for (const reverse of [false, true]) {
          const reel = buildReel(movies, selected.id, reverse, width);
          assert.equal(reel.movies[reel.to].id, selected.id);
          assert.equal(reel.to - reel.from, reverse ? -44 : 44);
          const halfVisible = Math.ceil(width / 105 / 2);
          assert.ok(Math.min(reel.from, reel.to) >= halfVisible);
          assert.ok(reel.movies.length - 1 - Math.max(reel.from, reel.to) >= halfVisible);
          for (let i = 1; i < reel.movies.length; i++) {
            assert.equal(reel.movies[i].id, (reel.movies[i - 1].id + (reverse ? count - 1 : 1)) % count);
          }
        }
      }
    }
  }
});
