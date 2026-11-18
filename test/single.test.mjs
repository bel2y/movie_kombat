import {createRequire} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {chooseRound}=createRequire(import.meta.url)('../src/battle.js');
const films=[{id:1,rank:3},{id:2,rank:8}];
test('remaining left list selects a film without an opponent',()=>{
 const r=chooseRound(films,[],()=>.9);
 assert.equal(r.solo,true);assert.equal(r.winner,'left');assert.equal(r.left.movie.id,2);assert.equal(r.right,undefined);
});
test('remaining right list and last movie are supported',()=>{
 const r=chooseRound([],films.slice(0,1),()=>.99);
 assert.equal(r.winner,'right');assert.equal(r.right.movie.id,1);assert.equal(r.left,undefined);
});
test('empty lists stop; two lists retain battle rules',()=>{
 assert.equal(chooseRound([],[]),null);
 const r=chooseRound(films,films,()=>0);
 assert.ok(r.left && r.right);assert.equal(r.solo,undefined);
});
