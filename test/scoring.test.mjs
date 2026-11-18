import {test} from 'node:test';
import assert from 'node:assert/strict';
import engine from '../src/battle.js';
import fs from 'node:fs';
import vm from 'node:vm';
const {strength,recordLoss,battle}=engine;
test('60/25/15 weights and vote-count shrinkage',()=>{
 const s=strength({rank:1,listSize:16,voteAverage:8,voteCount:500,losses:5});
 assert.equal(s.desire,1);assert.equal(s.rating,.725);assert.equal(s.losses,1);
 assert.equal(s.total,.6+.25*.725+.15);
 assert.ok(strength({voteAverage:10,voteCount:10}).rating < strength({voteAverage:8,voteCount:10000}).rating);
});
test('missing ratings use prior, losses cap, original size remains stable',()=>{
 assert.equal(strength({}).rating,.65);
 assert.equal(strength({voteAverage:NaN,voteCount:20}).rating,.65);
 assert.equal(strength({losses:99}).losses,1);
 assert.equal(strength({rank:8,listSize:16}).desire,8/15);
 assert.equal(strength({rank:1,listSize:1}).desire,1);
});
test('only actual loser gains bonus; matches and single selections do not',()=>{
 const counts={};const round={winner:'left',left:{movie:{id:1}},right:{movie:{id:2}}};
 for(let i=0;i<10;i++)recordLoss(counts,round);
 assert.deepEqual(counts,{'right:2':5});
 recordLoss(counts,{...round,solo:true});recordLoss(counts,{...round,right:round.left});
 assert.deepEqual(counts,{'right:2':5});
 assert.ok(strength({losses:5}).total>strength({losses:0}).total);
});
test('equal ranks with unequal ratings are not labelled 50/50',()=>{
 const a=[{id:1,rank:1,listSize:16,voteAverage:9,voteCount:10000}];
 const b=[{id:2,rank:1,listSize:16,voteAverage:4,voteCount:10000}];
 const r=battle(a,b,()=>0);
 assert.equal(r.winner,'left');assert.notEqual(r.banner,'50/50');assert.equal(r.formulaVersion,3);
});
test('greater visible power always wins without a winner random draw',()=>{
 const high={id:1,rank:1,listSize:16,voteAverage:9,voteCount:10000};
 const low={id:2,rank:16,listSize:16,voteAverage:4,voteCount:10000};
 for(const [a,b,expected] of [[high,low,'left'],[low,high,'right']]){
  let calls=0;const r=battle([a],[b],()=>{assert.ok(++calls<=2);return 0;});
  assert.equal(r.winner,expected);
  assert.ok(r[expected].score.power>r[expected==='left'?'right':'left'].score.power);
 }
});
test('equal displayed power uses a fair tie break',()=>{
 const a={id:1,rank:5,listSize:16,voteAverage:7,voteCount:1000};
 for(const [roll,winner] of [[.1,'left'],[.9,'right']]){
  const values=[0,0,roll];const r=battle([a],[{...a,id:2}],()=>values.shift());
  assert.equal(r.winner,winner);assert.equal(r.tied,true);
 }
});
test('rating snapshot covers every catalog entry and corrected identities',()=>{
 const films=vm.runInNewContext(fs.readFileSync(new URL('../src/movies.js',import.meta.url),'utf8')+';movieLists.flat()');
 const ratings=vm.runInNewContext(fs.readFileSync(new URL('../src/tmdb-ratings.js',import.meta.url),'utf8')+';tmdbRatings');
 for(const movie of films){const r=ratings.movies[movie.id];assert.ok(r, movie.title);assert.ok(r.voteCount>0);assert.ok(r.voteAverage>=0&&r.voteAverage<=10);}
 assert.equal(ratings.movies[79443].tmdbId,79433);assert.equal(ratings.movies[11823].tmdbId,15566);
});
