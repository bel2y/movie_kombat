import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../plugins/movie-kombat.js',import.meta.url),'utf8');
function boot(){
 const events={},nodes=[],cards=[],controllers={},messages=[];let launch,buttons=0,restored;
 const node=tag=>{const item={tag,style:{},children:[],contentWindow:{postMessage:(data,origin)=>messages.push({data,origin})},focus(){},remove(){this.removed=true;},appendChild(child){this.children.push(child);}};nodes.push(item);return item;};
 const Lampa={Menu:{addButton:(icon,title,fn)=>{buttons++;launch=fn;}},Activity:{push:card=>cards.push(card)},
  Controller:{enabled:()=>({name:'menu'}),add:(name,value)=>controllers[name]=value,toggle:name=>restored=name}};
 const window={Lampa,appready:true,addEventListener:(name,fn)=>events[name]=fn,removeEventListener:name=>delete events[name]};
 const context={window,Lampa,document:{currentScript:null,createElement:node,body:node('body')},location:{origin:'http://lampa.mx'},URL,setTimeout:()=>1,clearTimeout(){}};
 vm.runInNewContext(source,context);
 return {open:()=>launch(),nodes,cards,controllers,messages,buttons:()=>buttons,rerun:()=>vm.runInNewContext(source,context),restored:()=>restored,
  receive:(type,extra={},origin='https://bel2y.github.io',otherSource)=>{
   const frame=nodes.filter(n=>n.tag==='iframe').at(-1);
   const session=new URL(frame.src).searchParams.get('session');
   events.message?.({origin,source:otherSource||frame.contentWindow,data:{channel:'movie-kombat-v1',session,type,...extra}});
  }};
}
test('plugin installs once, opens once and passes correct TMDB card to Lampa',()=>{
 const app=boot();app.rerun();assert.equal(app.buttons(),1);
 app.open();app.open();assert.equal(app.nodes.filter(n=>n.tag==='iframe').length,1);
 app.receive('ready');assert.equal(app.messages.at(-1).data.type,'connected');
 app.receive('watch',{tmdbId:79433},'https://evil.test');assert.equal(app.cards.length,0);
 app.receive('watch',{tmdbId:79433},'https://bel2y.github.io',{});assert.equal(app.cards.length,0);
 app.receive('watch',{tmdbId:-1});assert.equal(app.cards.length,0);
 app.receive('watch',{tmdbId:79433,session:'old-session'});assert.equal(app.cards.length,0);
 app.receive('watch',{tmdbId:79433});assert.equal(app.cards.length,1);
 assert.equal(app.cards[0].component,'full');assert.equal(app.cards[0].id,79433);assert.equal(app.cards[0].source,'tmdb');
 app.open();assert.equal(app.nodes.filter(n=>n.tag==='iframe').length,2);
 app.receive('close');assert.equal(app.restored(),'menu');
});
test('remote fallback forwards arrows and Back closes overlay',()=>{
 const app=boot();app.open();app.controllers.movie_kombat.right();
 assert.equal(app.messages.at(-1).data.key,'ArrowRight');
 app.controllers.movie_kombat.back();assert.equal(app.restored(),'menu');
 assert.ok(app.nodes.find(n=>n.style.cssText?.includes('z-index:100000')).removed);
});
test('connected remote Back delegates to the game instead of discarding its current screen',()=>{
 const app=boot();app.open();app.receive('ready');app.controllers.movie_kombat.back();
 assert.equal(app.messages.at(-1).data.key,'Escape');
 assert.equal(app.restored(),'movie_kombat');
 app.receive('close');assert.equal(app.restored(),'menu');
});
