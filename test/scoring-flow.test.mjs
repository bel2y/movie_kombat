import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const engine=fs.readFileSync(new URL('../src/battle.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function boot(storage,lists){
 const reelInputs=[];const events={};const shell={dataset:{}};let destination;const pending=[];
 const main={innerHTML:'',addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null};
 const nav={querySelectorAll:()=>[]};
 const context={console, movieLists:lists, tmdbRatings:{movies:{1:{voteAverage:8,voteCount:1000},2:{voteAverage:6,voteCount:500},3:{voteAverage:7,voteCount:300}}},
  pickFighters:()=>[{image:'a'},{image:'b'}],buildReel:(movies,id)=>{reelInputs.push({ids:movies.map(m=>m.id),selected:id});return {movies,from:0,to:0,static:movies.length===1};},
  localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},location:{search:'',assign:url=>destination=url},URLSearchParams,
  crypto:{getRandomValues:a=>{a[0]=0;return a;}},window:{innerWidth:1920},setTimeout:(fn,delay)=>{pending.push({fn,delay});return pending.length;},clearTimeout(id){if(pending[id-1])pending[id-1].done=true;},
  document:{querySelector:s=>s==='main'?main:s==='nav'?nav:s==='.shell'?shell:{},addEventListener:(type,fn)=>events[type]=fn}};
 vm.runInNewContext(engine+'\n'+app,context);
 return {reelInputs,shell,main,enter(action){context.document.activeElement={matches:()=>true,click:()=>events.click({target:{closest:()=>({dataset:{action}})}})};events.keydown({key:'Enter',repeat:false,preventDefault(){}});},click:action=>events.click({target:{closest:()=>({dataset:{action}})}}),runTimers:()=>pending.slice().sort((a,b)=>a.delay-b.delay).forEach(t=>{if(!t.done){t.done=true;t.fn();}}),start:()=>events.click({target:{closest:()=>({dataset:{action:'start'}})}}),watch:()=>events.click({target:{closest:()=>({dataset:{action:'watch'}})}}),destination:()=>destination};
}
const film=id=>({id,title:'Film '+id,year:2000,genre:'Drama'});
test('confirmed reset clears only game progress and restores both lists',()=>{
 const storage={'unrelated':'keep'};const session=boot(storage,[[film(1)],[film(2)]]);
 session.start();session.runTimers();session.click('continue');session.runTimers();
 const before=JSON.stringify(storage);session.click('reset');assert.equal(JSON.stringify(storage),before);
 session.click('reset-confirm');assert.equal(session.shell.dataset.scene,'home');
 assert.deepEqual(storage,{unrelated:'keep'});
 assert.match(session.main.innerHTML,/1 фильмов/);
});
test('score screen waits for Continue before revealing winner',()=>{
 const session=boot({},[[film(1)],[film(2)]]);session.start();session.runTimers();
 assert.equal(session.shell.dataset.scene,'versus');
 assert.match(session.main.innerHTML,/Продолжить/);
 session.runTimers();assert.equal(session.shell.dataset.scene,'versus');
 session.click('continue');assert.equal(session.shell.dataset.scene,'winner');
 session.runTimers();assert.equal(session.shell.dataset.scene,'result');
});
test('live app persists loser bonus and uses it after reload',()=>{
 const storage={},lists=[[film(1),film(3)],[film(2)]];
 boot(storage,lists).start();
 let history=JSON.parse(storage['movie-kombat.history.v1']);
 assert.equal(history[0].formulaVersion,4);assert.equal(history[0].left.score.ratingAvailable,true);
 assert.equal(JSON.parse(storage['movie-kombat.losses.v1'])['right:2'],1);
 boot(storage,lists).start();
 history=JSON.parse(storage['movie-kombat.history.v1']);
 assert.equal(history[0].right.score.losses,.2);
 assert.equal(history[0].left.rank,2);assert.equal(history[0].left.score.desire,0);
});
test('one remaining film goes directly to result and earns no loss',()=>{
 const storage={};const session=boot(storage,[[film(1)],[]]);session.start();
 assert.equal(session.shell.dataset.scene,'result');
 assert.deepEqual(JSON.parse(storage['movie-kombat.losses.v1']),{});
 assert.equal(JSON.parse(storage['movie-kombat.history.v1'])[0].solo,true);
});
test('watch opens the winning film in Lampa using TMDB identity',()=>{
 const storage={};const session=boot(storage,[[{...film(79443),tmdbId:79433}],[]]);
 session.watch();assert.equal(session.destination(),undefined);
 session.start();const saved=JSON.stringify(storage);session.watch();
 assert.equal(session.destination(),'http://lampa.mx/?card=79433&media=movie&source=tmdb');
 assert.equal(JSON.stringify(storage),saved);
});

test('remote Enter activates once without skipping the screen it opens',()=>{
 const session=boot({},[[film(1)],[film(2)]]);session.enter('start');
 assert.equal(session.shell.dataset.scene,'intro');
 session.runTimers();assert.equal(session.shell.dataset.scene,'versus');
});

test('reels exclude past winners but retain the current round winner',()=>{
 const session=boot({'movie-kombat.excluded.v1':'[1]'},[[film(1),film(3)],[film(2)]]);
 session.start();assert.deepEqual(session.reelInputs.map(r=>r.ids),[[3],[2]]);
 session.runTimers();assert.equal(session.shell.dataset.scene,'versus');
 session.click('home');session.click('home');session.start();
 assert.ok(session.reelInputs.slice(2).every(r=>!r.ids.includes(1)));
});
test('exhausted lists offer reset directly on the arena',()=>{
 const session=boot({'movie-kombat.excluded.v1':'[1,2]'},[[film(1)],[film(2)]]);
 assert.match(session.main.innerHTML,/data-action="reset"/);
});
