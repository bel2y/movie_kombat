import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {selectionRoute,rosterLayout}=createRequire(import.meta.url)('../src/grid-selection.js');
test('random jumps stay within eligible owner films, never repeat adjacent tiles, and land on result',()=>{
 for(const n of [1,2,3,16]){
  const films=Array.from({length:n},(_,i)=>({id:i}));
  for(const target of films){
   const route=selectionRoute(films,target.id,()=>.37);
   assert.equal(route.at(-1),target.id);
   assert.ok(route.every(id=>films.some(f=>f.id===id)));
   if(n>1)assert.ok(route.every((id,i)=>!i||id!==route[i-1]));
  }
 }
 assert.deepEqual(selectionRoute([],1),[]);
 assert.deepEqual(selectionRoute([{id:1}],2),[]);
 const films=Array.from({length:16},(_,id)=>({id}));
 assert.notDeepEqual(selectionRoute(films,4,()=>.1),selectionRoute(films,4,()=>.8));
});
test('mixed roster retains every entry and ownership even for shared movie IDs',()=>{
 const lists=[[{id:'same'},{id:'a'}],[{id:'same'},{id:'b'}]];
 const a=rosterLayout(lists,()=>.1),b=rosterLayout(lists,()=>.9);
 assert.equal(a.tiles.length,4);
 assert.deepEqual(a.tiles.map(t=>t.side+':'+t.movie.id).sort(),['0:a','0:same','1:b','1:same']);
 assert.notDeepEqual(a.tiles,b.tiles);
 assert.equal(new Set(a.tiles.map(t=>t.row+':'+t.column)).size,4);
 assert.equal(rosterLayout([[],[]]).tiles.length,0);
});

test('saved roster order survives reloads and appends new entries without reshuffling existing ones',()=>{
 const {savedRosterLayout}=createRequire(import.meta.url)('../src/grid-selection.js');
 const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 const lists=[[{id:1},{id:2}],[{id:1},{id:3}]];
 const keys=g=>g.tiles.map(t=>t.side+':'+t.movie.id);
 const first=savedRosterLayout(lists,storage,()=>.1);
 assert.deepEqual(keys(savedRosterLayout(lists,storage,()=>.9)),keys(first));
 const expanded=savedRosterLayout([[...lists[0],{id:4}],lists[1]],storage,()=>.7);
 assert.deepEqual(keys(expanded).slice(0,4),keys(first));
 assert.equal(keys(expanded).at(-1),'0:4');
});
