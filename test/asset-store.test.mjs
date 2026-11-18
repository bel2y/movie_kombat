import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/asset-store.js',import.meta.url),'utf8');
const file='src/optimized/poster.123456abcdef.webp';
function boot(fetch){
 const window={MK_ART:[file],addEventListener(){},dispatchEvent(){}};
 vm.runInNewContext(source,{window,location:{href:'https://example.com/movie_kombat/'},URL,Blob,Event,AbortController,fetch,setTimeout,clearTimeout,
  document:{documentElement:{style:{setProperty(){}}},querySelectorAll:()=>[]},performance:{getEntriesByType:()=>[]}});
 return window.MovieKombatAssets;
}
const image=()=>new Response(new Blob(['RIFF0000WEBPtest'],{type:'image/webp'}));
test('blocked IndexedDB keeps game usable and reports memory-only files honestly',async()=>{
 let requests=0;const assets=boot(async()=>{requests++;return image();});await assets.ready;
 await Promise.all([assets.ensure(file),assets.ensure(file)]);
 assert.equal(requests,1);assert.match(assets.url(file),/^blob:/);
 assert.equal(assets.status().storage,'blocked');assert.equal(assets.status().saved,0);
 await assets.downloadAll();assert.equal(assets.status().done,1);assert.equal(assets.status().failed,0);assert.equal(requests,1);
});
test('failed files retry once and are not reported as saved',async()=>{
 let requests=0;const assets=boot(async()=>{requests++;throw Error('offline');});await assets.ready;await assets.downloadAll();
 assert.equal(requests,2);assert.equal(assets.status().failed,1);assert.equal(assets.status().saved,0);assert.equal(assets.status().busy,false);
 await assert.rejects(assets.ensure('https://other.test/image.webp'));assert.equal(requests,2);
});
test('download completion is visible even when every file was already loaded',async()=>{
 const assets=boot(async()=>image());await assets.ready;await assets.ensure(file);await assets.downloadAll();
 assert.equal(assets.status().completed,true);
});
test('motion pauses queued downloads until the scene is stable',async()=>{
 let requests=0;const assets=boot(async()=>{requests++;return image();});await assets.ready;
 assets.setMotion(true);const pending=assets.ensure(file);await Promise.resolve();assert.equal(requests,0);
 assets.setMotion(false);await pending;assert.equal(requests,1);
});
