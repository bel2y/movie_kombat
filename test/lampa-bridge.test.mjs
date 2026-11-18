import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function boot(embedded=true,parentOrigin='http://lampa.mx'){
 const sent=[],events={},parent={postMessage:(data,origin)=>sent.push({data,origin})};
 const window={parent,addEventListener:(name,fn)=>events[name]=fn};
 if(!embedded) window.parent=window;
 vm.runInNewContext(fs.readFileSync(new URL('../src/lampa-bridge.js',import.meta.url),'utf8'),{
  window,URL,URLSearchParams,location:{search:embedded?'?host=lampa&parentOrigin='+encodeURIComponent(parentOrigin)+'&session=abc':''},
  document:{dispatchEvent(){}},KeyboardEvent:function(){},setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){}
 });
 const receive=(data,origin='http://lampa.mx',source=parent)=>events.message?.({data,origin,source});
 return {bridge:window.MovieKombatHost,sent,receive,parent};
}
test('standalone never delegates watch or close',()=>{
 const app=boot(false);assert.equal(app.bridge.watch(77),false);assert.equal(app.bridge.close(),false);assert.equal(app.sent.length,0);
});
test('packaged Lampa connects with source/session checks for opaque and extension origins',()=>{
 for(const origin of ['null','chrome-extension://abcdef']){
  const app=boot(true,origin);
  app.receive({channel:'movie-kombat-v1',type:'connected',session:'abc'},origin);
  assert.equal(app.bridge.watch(77),true);
  assert.equal(app.sent.at(-1).origin,origin==='null'?'*':origin);
 }
});
test('only authenticated parent handshake enables watch',()=>{
 const app=boot();assert.equal(app.bridge.watch(77),false);
 const ready={channel:'movie-kombat-v1',type:'connected',session:'abc'};
 app.receive(ready,'https://evil.test');assert.equal(app.bridge.watch(77),false);
 app.receive(ready,'http://lampa.mx',{});assert.equal(app.bridge.watch(77),false);
 app.receive({...ready,session:'wrong'});assert.equal(app.bridge.watch(77),false);
 app.receive(ready);assert.equal(app.bridge.watch(77),true);
 assert.equal(app.sent.at(-1).data.tmdbId,77);assert.equal(app.sent.at(-1).origin,'http://lampa.mx');
 assert.equal(app.bridge.watch(-1),false);assert.equal(app.bridge.watch('not-an-id'),false);
 assert.equal(app.bridge.close(),true);assert.equal(app.sent.at(-1).data.type,'close');
});
