import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('../src/startup.js',import.meta.url),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function boot(ensure){
 const nodes=Object.fromEntries(['startup','startup-status','startup-progress','startup-retry'].map(id=>[id,{hidden:id==='startup-retry',focus(){},addEventListener(type,fn){this.click=fn;}}]));
 let covered=true;
 const window={MovieKombatAssets:{ready:Promise.resolve(),files:['a','b'],ensure}};
 const document={querySelector:()=>null,addEventListener(){},getElementById:id=>nodes[id],fonts:{ready:Promise.resolve()},querySelectorAll:()=>[],documentElement:{classList:{remove(){covered=false;}}}};
 vm.runInNewContext(code,{window,document,setTimeout,requestAnimationFrame:fn=>fn(),location:{reload(){}}});
 return {api:window.MKStartup,nodes,covered:()=>covered};
}
test('startup waits for every asset before allowing the interface to appear',async()=>{
 let finish;const gate=new Promise(resolve=>finish=resolve);const app=boot(file=>file==='b'?gate:Promise.resolve());let ready=false;app.api.ready.then(()=>ready=true);
 await flush();assert.equal(ready,false);assert.equal(app.covered(),true);assert.equal(app.nodes['startup-progress'].value,1);
 finish();await app.api.ready;assert.equal(app.covered(),true);await app.api.reveal();assert.equal(app.covered(),false);assert.equal(app.nodes.startup.hidden,true);
});
test('failed preload stays covered and can retry successfully',async()=>{
 let fail=true;const app=boot(()=>fail?Promise.reject(Error('offline')):Promise.resolve());let ready=false;app.api.ready.then(()=>ready=true);
 await flush();assert.equal(ready,false);assert.equal(app.nodes['startup-retry'].hidden,false);assert.equal(app.covered(),true);
 fail=false;app.nodes['startup-retry'].click();await app.api.ready;assert.equal(app.nodes['startup-progress'].value,2);
});
