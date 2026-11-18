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


test('one remaining film is a fixed card, never a repeated spinning strip',()=>{
 for(const reverse of [false,true]){
  const result=reel.buildReel([{id:4}],4,reverse,1920);
  assert.equal(result.static,true);assert.equal(result.from,result.to);assert.equal(result.movies.length,1);
 }
});
test('two to four films repeat without empty edges and land on each selected film',()=>{
 for(const count of [2,3,4])for(const reverse of [false,true]){
  const movies=Array.from({length:count},(_,id)=>({id}));
  for(const selected of movies){
   const result=reel.buildReel(movies,selected.id,reverse,1920);
   for(let t=0;t<=1;t+=.02){
    const window=reel.reelWindow(result,result.from+(result.to-result.from)*t,1920,240);
    assert.ok(window.movies.every(m=>movies.includes(m)));
   }
   assert.equal(result.movies[result.to].id,selected.id);
  }
 }
});
