import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, '.site');
import { pages } from './pages.mjs';
const routes = new Map(pages);
function target(href, source) {
  if (/^(?:[a-z]+:|\/\/|#)/i.test(href)) return href;
  const [file, ...fragments] = href.split('#');
  const suffix = fragments.length ? '#' + fragments.join('#') : '';
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(source), decodeURI(file)));
  if (routes.has(resolved)) return '/' + routes.get(resolved) + '.md' + suffix;
  if (resolved === '05_学习脉络树.html') return '/learning-map.html' + suffix;
  if (resolved.startsWith('source_pages/') || resolved.startsWith('results/')) return '/' + resolved + suffix;
  if (!fs.existsSync(path.join(root, resolved)) || resolved.startsWith('../')) throw new Error(`Invalid link: ${source} -> ${href}`);
  return '/downloads/' + resolved + suffix;
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(path.join(output, 'public/downloads'), { recursive: true });
for (const [source, route] of pages) {
  let markdown = fs.readFileSync(path.join(root, source), 'utf8');
  markdown = markdown.replace(/(!?\[(?:[^\[\]\n]|\[[^\]\n]*\])*\])\((<[^>\n]*>|[^)\n]+)\)/g, (_, label, href) => `${label}(${target(href.replace(/^<|>$/g, ''), source)})`);
  const sourceMeta = `sourceFile: ${JSON.stringify(source)}\n`;
  markdown = markdown.startsWith('---\n') ? markdown.replace(/^---\n/, '---\n' + sourceMeta) : '---\n' + sourceMeta + '---\n' + markdown;
  const dest = path.join(output, route + '.md');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, markdown);
}
for (const dir of ['results', 'source_pages']) fs.cpSync(path.join(root, dir), path.join(output, 'public', dir), { recursive: true, filter: file => !file.endsWith('.DS_Store') });
for (const file of ['data', 'course_work.py', 'mnist_optional.py', 'requirements.txt', 'requirements-optional.txt', '系统学习笔记']) {
  fs.cpSync(path.join(root, file), path.join(output, 'public/downloads', file), { recursive: true, filter: file => !file.endsWith('.DS_Store') });
}
let tree = fs.readFileSync(path.join(root, '05_学习脉络树.html'), 'utf8');
for (const [source, route] of pages) tree = tree.replaceAll(source, route + '.html');
// The tree is a static document at the project root, so its relative links retain the Pages base.
fs.writeFileSync(path.join(output, 'public/learning-map.html'), tree);
console.log(`Prepared ${pages.length} pages from original Markdown.`);
