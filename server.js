// Gidi Rush - tiny zero-dependency static server (optional; index.html also works by double-clicking)
// Usage: node server.js [port] [--open]
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = __dirname;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8'
};
const args = process.argv.slice(2);
let port = parseInt(args.find(a => /^\d+$/.test(a)) || process.env.PORT || '8080', 10);
const open = args.includes('--open');

const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

function listen(tries) {
  server.once('error', (e) => {
    if (e.code === 'EADDRINUSE' && tries > 0) { port++; listen(tries - 1); }
    else { console.error('Could not start server:', e.message); process.exit(1); }
  });
  server.listen(port, '127.0.0.1', () => {
    const url = 'http://localhost:' + port;
    console.log('\n  Gidi Rush is running at ' + url + '\n  Press Ctrl+C to stop.\n');
    if (open) {
      const cmd = process.platform === 'win32' ? 'start "" "' + url + '"' : process.platform === 'darwin' ? 'open "' + url + '"' : 'xdg-open "' + url + '"';
      exec(cmd, () => {});
    }
  });
}
listen(10);
