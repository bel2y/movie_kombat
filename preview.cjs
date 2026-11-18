const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let name;
  try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, ''); }
  catch { res.writeHead(400).end(); return; }
  if (!name || name.endsWith('/')) name += 'index.html';
  const file = path.resolve(root, name);
  const relative = path.relative(root, file);
  const allowed = name === 'index.html' || name === 'sw.js' || /^(src|design|msx)\//.test(name);
  if (!allowed || relative.startsWith('..') || path.isAbsolute(relative) || /(^|[\\/])\./.test(relative)) {
    res.writeHead(404).end(); return;
  }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': /^src\/optimized\/.*\.[a-f0-9]{12}\.webp$/.test(name) ? 'public, max-age=31536000, immutable' : 'no-store' });
    res.end(data);
  });
});
server.on('error', error => {
  if (error.code === 'EADDRINUSE') console.log('Preview is already running: http://127.0.0.1:4400/');
  else { console.error(error.message); process.exitCode = 1; }
});
server.listen(4400, '127.0.0.1', () => console.log('Movie Kombat preview: http://127.0.0.1:4400/'));

