import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/asset-store.js',import.meta.url),'utf8');
const file='src/optimized/poster.123456abcdef.webp';
function boot(fetch,extra={}){
 const window={MK_ART:[file],addEventListener(){},dispatchEvent(){}};
 vm.runInNewContext(source,{window,location:{href:'https://example.com/movie_kombat/'},URL,Blob,Event,AbortController,fetch,setTimeout,clearTimeout,
  document:{documentElement:{style:{setProperty(){}}},querySelectorAll:()=>[]},performance:{getEntriesByType:()=>[]},...extra});
 return window.MovieKombatAssets;
}
const image=()=>new Response(new Blob(['RIFF0000WEBPtest'],{type:'image/webp'}));
test('blocked IndexedDB keeps game usable and reports memory-only files honestly',async()=>{
 let requests=0;const assets=boot(async()=>{requests++;return image();});await assets.ready;
 await Promise.all([assets.ensure(file),assets.ensure(file)]);
 assert.equal(requests,1);assert.match(assets.url(file),/^blob:/);
 assert.equal(assets.status().storage,'blocked');assert.equal(assets.status().saved,0);
 await assets.ensure(file);assert.equal(requests,1);
});
test('failed files retry once and are not reported as saved',async()=>{
 let requests=0;const assets=boot(async()=>{requests++;throw Error('offline');});await assets.ready;await assert.rejects(assets.ensure(file));
 assert.equal(requests,2);assert.equal(assets.status().saved,0);
 await assert.rejects(assets.ensure('https://other.test/image.webp'));assert.equal(requests,2);
});
test('manual bulk download API is removed',()=>{assert.equal(boot(async()=>image()).downloadAll,undefined);});
test('motion pauses queued downloads until the scene is stable',async()=>{
 let requests=0;const assets=boot(async()=>{requests++;return image();});await assets.ready;
 assets.setMotion(true);const pending=assets.ensure(file);await Promise.resolve();assert.equal(requests,0);
 assets.setMotion(false);await pending;assert.equal(requests,1);
});

test('TV engines without Blob.arrayBuffer or AbortController can load artwork',async()=>{
 const blob=new Blob(['RIFF0000WEBPtest'],{type:'image/webp'});
 blob.slice=()=>({});
 class Reader {readAsArrayBuffer(){this.result=new TextEncoder().encode('RIFF0000WEBP').buffer;this.onload();}}
 const assets=boot(async()=>({ok:true,blob:async()=>blob}),{FileReader:Reader,AbortController:undefined});
 await assets.ready;assert.match(await assets.ensure(file),/^blob:/);
});
test('blocked fetch falls back to normal image loading and reuses it',async()=>{
 let loads=0;class NativeImage{set src(value){loads++;queueMicrotask(()=>this.onload());}}
 const assets=boot(async()=>{throw TypeError('Failed to fetch');},{Image:NativeImage});await assets.ready;
 assert.match(await assets.ensure(file),/^https:/);await assets.ensure(file);assert.equal(loads,1);assert.equal(assets.status().saved,0);
});
test('failed native image fallback rejects so startup can offer retry',async()=>{
 class NativeImage{set src(value){queueMicrotask(()=>this.onerror());}}
 const assets=boot(async()=>{throw TypeError('Failed to fetch');},{Image:NativeImage});await assets.ready;
 await assert.rejects(assets.ensure(file),/Image unavailable/);
});
