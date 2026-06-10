#!/usr/bin/env node
/* 内链检查：遍历所有 html，确认每个本地 href/src 指向的文件真实存在。
 * 零依赖，node scripts/check-links.mjs 直接跑；CI 里也用它兜底。 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const SKIP = /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i;
let errors = 0;

for (const file of htmlFiles(ROOT)) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/(?:href|src)\s*=\s*"([^"]+)"/g)) {
    const url = m[1];
    if (SKIP.test(url)) continue;
    const path = url.split(/[?#]/)[0];
    if (!path) continue;
    let target = path.startsWith('/')
      ? join(ROOT, path)
      : join(dirname(file), path);
    if (path.endsWith('/')) target = join(target, 'index.html');
    if (!existsSync(target)) {
      console.error(`✗ ${file.slice(ROOT.length + 1)} → ${url} (missing: ${target.slice(ROOT.length + 1)})`);
      errors++;
    }
  }
}

if (errors) {
  console.error(`\n${errors} broken link(s).`);
  process.exit(1);
}
console.log('✓ all internal links resolve.');
