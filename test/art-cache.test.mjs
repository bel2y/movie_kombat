import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const source=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
function setup(storageFails=false){
 const events={},saved=new Map();let requests=0;
 const cache={match:async r=>saved.get(r.url),put:async(r,v)=>saved.set(r.url,v),keys:async()=>[],delete:async()=>true};
 const context={URL,Request,self:{registration:{scope:'https://example.com/movie_kombat/'},addEventListener:(n,f)=>events[n]=f},
  caches:{open:async()=>{if(storageFails)throw Error('quota');return cache;}},fetch:async()=>{requests++;return new Response('image',{status:200});}};
 vm.runInNewContext(source,context);
 return {requests:()=>requests,get:async url=>{let response;events.fetch({request:new Request(url),respondWith:p=>response=p});return response;}};
}
const art='https://example.com/movie_kombat/src/optimized/test.123456abcdef.webp';
test('art cache reuses downloads and does not intercept code or other sites',async()=>{
 const app=setup();assert.equal(await (await app.get(art)).text(),'image');
 assert.equal(await (await app.get(art)).text(),'image');assert.equal(app.requests(),1);
 assert.equal(await app.get('https://example.com/movie_kombat/src/main.js'),undefined);
 assert.equal(await app.get('https://other.test/src/optimized/test.123456abcdef.webp'),undefined);
 assert.equal(app.requests(),1);
});
test('disabled storage falls back to network',async()=>{
 const app=setup(true);assert.equal(await (await app.get(art)).text(),'image');assert.equal(app.requests(),1);
});
test('optimized artwork files have valid WebP signatures and content hashes',()=>{
 const entries=JSON.parse(fs.readFileSync(new URL('../src/optimized/manifest.json',import.meta.url)));
 for(const item of entries){
  const bytes=fs.readFileSync(new URL('../'+item.file,import.meta.url));
  assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.ok(item.file.includes(crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12)));
 }
 assert.ok(entries.reduce((n,e)=>n+e.after,0)<entries.reduce((n,e)=>n+e.before,0)*.25);
});
