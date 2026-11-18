import {test} from 'node:test';
import assert from 'node:assert/strict';
import reel from '../src/reel.js';
test('virtual reel keeps a bounded visible window and lands on the same winner',()=>{
 const films=Array.from({length:16},(_,id)=>({id}));
 for(const reverse of [false,true]){
  const strip=reel.buildReel(films,7,reverse,3840);
  for(let p=0;p<=1;p+=.01){
   const position=strip.from+(strip.to-strip.from)*p;
   const frame=reel.reelWindow(strip,position,3840,280);
   assert.ok(frame.movies.length<=23);
   assert.ok(frame.offset<=-10 && frame.offset>=-12);
   assert.ok(frame.movies.every(Boolean));
  }
  const end=reel.reelWindow(strip,strip.to,3840,280);
  assert.equal(end.movies[-end.offset].id,7);
 }
});

