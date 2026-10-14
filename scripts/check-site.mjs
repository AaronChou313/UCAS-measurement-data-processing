import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.vitepress/dist');
const base = '/UCAS-measurement-data-processing/';
const origin = 'https://aaronchou313.github.io';
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}
const htmlFiles = files(root).filter(file => file.endsWith('.html'));
const errors = [];
let checked = 0, formulas = 0;
const cache = new Map();
function html(file) { if (!cache.has(file)) cache.set(file, fs.readFileSync(file, 'utf8')); return cache.get(file); }
function unescape(value) { return value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'"); }
for (const file of htmlFiles) {
  const content = html(file).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  formulas += (content.match(/<mjx-container\b/g) || []).length;
  if (/<mjx-merror\b|data-mjx-error=/.test(content)) errors.push(`${path.relative(root, file)}: MathJax error`);
  // A successful static-file request is insufficient: the VitePress router
  // intercepts same-origin HTML links unless they have a target/download.
  for (const match of content.matchAll(/<a\b[^>]*>/g)) {
    const tag = match[0];
    if (/href="[^"]*\/learning-map\.html(?:#[^"]*)?"/.test(tag) && !/\btarget="_self"/.test(tag)) {
      errors.push(`${path.relative(root, file)}: learning map link must use normal browser navigation`);
    }
  }
  const current = new URL(base + path.relative(root, file), origin);
  for (const match of content.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const href = unescape(match[1]);
    if (/^(?:https?:|mailto:|data:|javascript:|tel:)/.test(href)) continue;
    const url = new URL(href, current);
    if (!url.pathname.startsWith(base)) { errors.push(`${current.pathname}: link misses Pages base: ${href}`); continue; }
    let dest = path.join(root, decodeURIComponent(url.pathname.slice(base.length)));
    if (fs.existsSync(dest) && fs.statSync(dest).isDirectory()) dest = path.join(dest, 'index.html');
    if (!path.extname(dest)) dest += '.html';
    if (!fs.existsSync(dest)) { errors.push(`${path.relative(root, file)} -> missing ${href}`); continue; }
    if (url.hash && dest.endsWith('.html')) {
      const id = decodeURIComponent(url.hash.slice(1));
      if (!html(dest).includes(`id="${id}"`) && !html(dest).includes(`id='${id}'`)) errors.push(`${path.relative(root, file)} -> missing anchor ${href}`);
    }
    checked++;
  }
}
if (formulas < 1000) errors.push(`Expected at least 1000 rendered formulas, found ${formulas}.`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Verified ${htmlFiles.length} HTML files, ${checked} local links/assets, ${formulas} MathJax formulas.`);
