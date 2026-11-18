import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const engine=fs.readFileSync(new URL('../src/battle.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function boot(storage,lists){
 const events={};const shell={dataset:{}};let destination;
 const main={innerHTML:'',addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null};
 const nav={querySelectorAll:()=>[]};
 const context={console, movieLists:lists, tmdbRatings:{movies:{1:{voteAverage:8,voteCount:1000},2:{voteAverage:6,voteCount:500},3:{voteAverage:7,voteCount:300}}},
  pickFighters:()=>[{image:'a'},{image:'b'}],buildReel:()=>({movies:[],from:0,to:0}),
  localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v},location:{search:'',assign:url=>destination=url},URLSearchParams,
  crypto:{getRandomValues:a=>{a[0]=0;return a;}},window:{innerWidth:1920},setTimeout:()=>1,clearTimeout(){},
  document:{querySelector:s=>s==='main'?main:s==='nav'?nav:s==='.shell'?shell:{},addEventListener:(type,fn)=>events[type]=fn}};
 vm.runInNewContext(engine+'\n'+app,context);
 return {shell,start:()=>events.click({target:{closest:()=>({dataset:{action:'start'}})}}),watch:()=>events.click({target:{closest:()=>({dataset:{action:'watch'}})}}),destination:()=>destination};
}
const film=id=>({id,title:'Film '+id,year:2000,genre:'Drama'});
test('live app persists loser bonus and uses it after reload',()=>{
 const storage={},lists=[[film(1),film(3)],[film(2)]];
 boot(storage,lists).start();
 let history=JSON.parse(storage['movie-kombat.history.v1']);
 assert.equal(history[0].formulaVersion,2);assert.equal(history[0].left.score.ratingAvailable,true);
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
