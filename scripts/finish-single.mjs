// Copies the single file build to snake-and-ladder.html and checks it really is self contained.
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const OUT = 'snake-and-ladder.html';
// The bundle is a plain script (iife). Load it as a classic script: it runs in more browsers and in-app viewers.
let html = readFileSync('dist-single/index.html', 'utf8').replace(/<script type="module"( crossorigin)?>/g, '<script>');
if (/<script type="module"/.test(html)) throw new Error('module script left in the page');
if (/^\s*(import|export)\s/m.test(html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '')) throw new Error('script still uses module syntax');
// The game code must keep its own scope (an iife) so its short internal names never clash with browser globals.
if (!/<script>\s*\(function\s*\(\)\s*\{/.test(html)) throw new Error('game script is not wrapped in its own scope');
writeFileSync(OUT, html);
// Any src= or href= or url() that is not a data: URI, a fragment, or blob: would need a second file or the network.
const external = [...html.matchAll(/(?:\s(?:src|href)=["']|url\(["']?)(?!data:|#|blob:|\$\{|["'])([^"')\s>]+)/g)].map((m) => m[1]);
const remote = [...html.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith('http://www.w3.org/'));
const mb = statSync(OUT).size / 1024 / 1024;
console.log(`${OUT}: ${mb.toFixed(2)} MB`);
if (external.length) console.log('References to other files:', [...new Set(external)]);
if (remote.length) console.log('Web addresses in the file (text only, never loaded; the page blocks all network access):', [...new Set(remote)].slice(0, 20));
if (external.length) process.exit(1);
if (mb > 20) {
  console.error('Over 20 MB');
  process.exit(1);
}

// Website version for free hosts (Netlify Drop, GitHub Pages, Cloudflare Pages): the same file named index.html, in a folder.
rmSync('SOFT-Snakes-Ladders-website', { recursive: true, force: true });
mkdirSync('SOFT-Snakes-Ladders-website');
writeFileSync('SOFT-Snakes-Ladders-website/index.html', html);
rmSync('SOFT-Snakes-Ladders-website.zip', { force: true });
try {
  execSync('zip -qr -9 SOFT-Snakes-Ladders-website.zip SOFT-Snakes-Ladders-website');
  console.log('SOFT-Snakes-Ladders-website.zip: folder with index.html, ready for any free web host');
} catch {
  console.log('SOFT-Snakes-Ladders-website/index.html written (zip tool not found)');
}
