// Copies the single file build to snake-and-ladder.html and checks it really is self contained.
import { copyFileSync, readFileSync, statSync } from 'node:fs';

const OUT = 'snake-and-ladder.html';
copyFileSync('dist-single/index.html', OUT);
const html = readFileSync(OUT, 'utf8');
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
