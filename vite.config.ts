import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import sharp from 'sharp';
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

/**
 * Board art. Normal builds use the paths in boards.json (public/boards/*.jpg, easy for the NGO to swap).
 * The single file build embeds each board as WebP (80% quality, 1280 px: the largest size it is ever shown).
 */
function boardImages(embed: boolean): Plugin {
  const ID = 'virtual:board-images';
  return {
    name: 'soft-board-images',
    resolveId: (id) => (id === ID ? `\0${ID}` : null),
    async load(id) {
      if (id !== `\0${ID}`) return null;
      if (!embed) return 'export default {};';
      const boards = JSON.parse(readFileSync('src/config/boards.json', 'utf8')).boards as { image: string }[];
      const map: Record<string, string> = {};
      for (const b of boards) {
        const webp = await sharp(join('public', b.image)).resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
        map[b.image] = `data:image/webp;base64,${webp.toString('base64')}`;
        console.log(`[single file] ${b.image}: ${(webp.length / 1024).toFixed(0)} KB as WebP`);
      }
      return `export default ${JSON.stringify(map)};`;
    },
  };
}

/** Single file build: strip links to separate files and lock the page to its own inline content (no network at all). */
function singleFileHtml(): Plugin {
  return {
    name: 'soft-single-file-html',
    apply: 'build',
    enforce: 'post',
    async transformIndexHtml(html) {
      // A 64 px tab icon is plenty and costs a few KB instead of 60.
      const png = await sharp('public/icons/icon-192.png').resize(64, 64).png({ compressionLevel: 9, palette: true }).toBuffer();
      const icon = `data:image/png;base64,${png.toString('base64')}`;
      return html
        .replace(/<link rel="manifest"[^>]*>\s*/g, '')
        .replace(/<link rel="(icon|apple-touch-icon)"[^>]*>/g, `<link rel="$1" type="image/png" href="${icon}" />`)
        .replace(
          /<meta http-equiv="Content-Security-Policy" content="[^"]*" \/>/,
          `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'" />`,
        );
    },
  };
}

export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    define: { __APP_VERSION__: JSON.stringify(pkg.version), __SINGLE_FILE__: JSON.stringify(single) },
    plugins: single
      ? [boardImages(true), viteSingleFile({ removeViteModuleLoader: true }), singleFileHtml()]
      : [boardImages(false), contentFolder(), classicScript(), serviceWorker()],
    // The single file build must not copy public/ (board JPGs, icons, manifest): everything it needs is inlined.
    publicDir: single ? false : 'public',
    build: {
      outDir: single ? 'dist-single' : 'dist',
      target: 'es2019',
      assetsInlineLimit: single ? 100_000_000 : 0,
      cssCodeSplit: !single,
      chunkSizeWarningLimit: 4000,
      rollupOptions: { output: { format: single ? 'es' : 'iife', inlineDynamicImports: true } },
    },
    server: { port: 5173 },
  };
});
