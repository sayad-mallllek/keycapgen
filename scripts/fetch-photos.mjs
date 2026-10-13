// Downloads every maker photo the store uses into public/photos/ and records them in
// public/photos/manifest.json, so the site serves its own copies instead of hotlinking.
// Run with: npm run photos   (Node 18+)
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { PRODUCTS } from '../src/data/products.js';
import { KB_PHOTOS } from '../src/data/kbPhotos.js';

const dir = new URL('../public/photos/', import.meta.url);
await mkdir(dir, { recursive: true });
let manifest = {};
try { manifest = JSON.parse(await readFile(new URL('manifest.json', dir), 'utf8')); } catch {}

// The data modules already swap in local copies, so collect the original URLs from the manifest too
const urls = new Set();
const add = u => { const orig = Object.keys(manifest).find(k => '/photos/' + manifest[k] === u) || u; if (/^https?:/.test(orig)) urls.add(orig); };
PRODUCTS.forEach(p => p.options.forEach(o => (o.choices || []).forEach(c => (c.images || []).forEach(add))));
Object.values(KB_PHOTOS).forEach(eds => Object.values(eds).forEach(list => list.forEach(add)));

const ext = t => (/webp/.test(t) ? 'webp' : /png/.test(t) ? 'png' : /avif/.test(t) ? 'avif' : 'jpg');
let ok = 0, failed = [];
for (const u of urls) {
  if (manifest[u]) { ok++; continue; }
  try {
    const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36', Accept: 'image/avif,image/webp,image/png,image/jpeg,*/*' } });
    const type = r.headers.get('content-type') || '';
    if (!r.ok || !type.startsWith('image/')) throw new Error(`${r.status} ${type}`);
    const buf = Buffer.from(await r.arrayBuffer());
    const name = createHash('sha1').update(u).digest('hex').slice(0, 16) + '.' + ext(type);
    await writeFile(new URL(name, dir), buf);
    manifest[u] = name; ok++;
    process.stdout.write(`\r${ok}/${urls.size} downloaded`);
  } catch (e) { failed.push(`${u}  (${e.message})`); }
}
await writeFile(new URL('manifest.json', dir), JSON.stringify(manifest, null, 1));
console.log(`\n${ok} of ${urls.size} photos saved in public/photos/`);
if (failed.length) console.log(`Could not download ${failed.length}:\n` + failed.join('\n'));
