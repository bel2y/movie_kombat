// Usage: node scripts/optimize-images.cjs /path/to/cwebp
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const encoder = process.argv[2] || 'cwebp';
const out = path.join(root, 'src/optimized');
fs.mkdirSync(out, {recursive:true});
const entries = [];
for (const folder of ['ui','fighters','posters']) {
  for (const name of fs.readdirSync(path.join(root,'src',folder))) {
    if (!(folder === 'posters' ? /^tmdb-.*\.jpg$/ : /\.png$/).test(name)) continue;
    const source = `src/${folder}/${name}`;
    const temporary = path.join(out,'encoding.webp');
    execFileSync(encoder, ['-quiet','-q','86','-m','6','-alpha_q','95',path.join(root,source),'-o',temporary]);
    const bytes = fs.readFileSync(temporary);
    const hash = crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12);
    const file = `src/optimized/${path.parse(name).name}.${hash}.webp`;
    fs.renameSync(temporary,path.join(root,file));
    entries.push({source,file,before:fs.statSync(path.join(root,source)).size,after:bytes.length});
  }
}
// Rewrite existing references, retaining originals as editable source assets.
const files = ['index.html',...fs.readdirSync(path.join(root,'src')).filter(n=>/\.(js|css)$/.test(n)).map(n=>'src/'+n)];
const old = fs.existsSync(path.join(out,'manifest.json')) ? JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8')) : [];
for (const file of files) {
  const absolute = path.join(root,file);
  let text = fs.readFileSync(absolute,'utf8');
  for (const entry of entries) {
    const relative = p => file==='index.html' ? p : file.endsWith('.css') ? p.replace(/^src\//,'') : p;
    text = text.split(relative(entry.source)).join(relative(entry.file));
    const prior = old.find(item=>item.source===entry.source);
    if(prior) text = text.split(relative(prior.file)).join(relative(entry.file));
    if(file==='src/fighters.js') {
      text = text.split('"'+path.basename(entry.source)+'"').join('"../optimized/'+path.basename(entry.file)+'"');
      if(prior) text=text.split('../optimized/'+path.basename(prior.file)).join('../optimized/'+path.basename(entry.file));
    }
  }
  fs.writeFileSync(absolute,text);
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(entries,null,2)+'\n');
fs.writeFileSync(path.join(root,'src/art-manifest.js'),'window.MK_ART = '+JSON.stringify(entries.map(entry=>entry.file))+';\n');
const before=entries.reduce((n,e)=>n+e.before,0),after=entries.reduce((n,e)=>n+e.after,0);
console.log(JSON.stringify({images:entries.length,before,after,reduction:Math.round((1-after/before)*100)+'%'}));
