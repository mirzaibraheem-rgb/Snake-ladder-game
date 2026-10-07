import { defineConfig, type Plugin } from 'vite';
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

/** Serves /content/* in dev and copies the editable content/ folder into the build. */
function contentFolder(): Plugin {
  return {
    name: 'soft-content-folder',
    configureServer(server) {
      server.middlewares.use('/content', (req, res, next) => {
        const file = join('content', decodeURIComponent((req.url ?? '/').split('?')[0]));
        if (existsSync(file) && statSync(file).isFile()) {
          res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8');
          res.end(readFileSync(file));
        } else next();
      });
    },
    closeBundle() {
      cpSync('content', 'dist/content', { recursive: true });
    },
  };
}

/** Makes the build open straight from disk (file://): a classic deferred script instead of a module. */
function classicScript(): Plugin {
  return {
    name: 'soft-classic-script',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/, '<script defer src="$1"></script>')
        .replace(/<link rel="stylesheet" crossorigin /g, '<link rel="stylesheet" ')
        .replace(/<link rel="modulepreload"[^>]*>/g, '');
    },
  };
}

/** Writes a service worker that precaches every built file, so the web version works offline. */
function serviceWorker(): Plugin {
  return {
    name: 'soft-service-worker',
    apply: 'build',
    closeBundle() {
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const f of readdirSync(dir)) {
          const p = join(dir, f);
          if (statSync(p).isDirectory()) walk(p);
          else files.push(relative('dist', p).split('\\').join('/'));
        }
      };
      walk('dist');
      const list = ['./', ...files.filter((f) => f !== 'sw.js')];
      const version = `${pkg.version}-${Date.now()}`;
      writeFileSync(
        'dist/sw.js',
        `// Generated at build time. Precaches the whole game for offline play.
const CACHE = 'soft-sl-${version}';
const FILES = ${JSON.stringify(list)};
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Content files: network first so NGO edits on the server show up, cache as fallback.
  if (url.pathname.includes('/content/')) {
    e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
});
`,
      );
    },
  };
}

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [contentFolder(), classicScript(), serviceWorker()],
  build: {
    outDir: 'dist',
    target: 'es2019',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1200,
    rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } },
  },
  server: { port: 5173 },
});
