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
    if (url.includes("' +")) continue; // 内联 JS 里拼接出来的 href，不是真实链接
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

/* labs.json 是首页卡片的数据源（JS 渲染，上面的 href 扫描覆盖不到），单独校验 */
{
  const labsFile = join(ROOT, 'labs.json');
  const { labs } = JSON.parse(readFileSync(labsFile, 'utf8'));
  for (const lab of labs) {
    const required = ['path', 'tag', 'title', 'sub', 'topics'];
    for (const key of required) {
      if (!lab[key] || (key === 'topics' && !lab[key].length)) {
        console.error(`✗ labs.json → ${lab.path || '(no path)'} 缺少字段: ${key}`);
        errors++;
      }
    }
    if (lab.path && !existsSync(join(ROOT, lab.path, 'index.html'))) {
      console.error(`✗ labs.json → ${lab.path} (missing: ${lab.path.slice(1)}index.html)`);
      errors++;
    }
    for (const child of lab.children || []) {
      if (!child.title || !child.path) {
        console.error(`✗ labs.json → ${lab.path} children 缺少 title/path`);
        errors++;
      }
      if (child.path && !existsSync(join(ROOT, child.path, 'index.html'))) {
        console.error(`✗ labs.json → ${child.path} (missing: ${child.path.slice(1)}index.html)`);
        errors++;
      }
    }
  }
}

/* 各 lab 的 tutorials.json 是子教程导航的数据源（JS 渲染），单独校验 */
for (const dir of readdirSync(ROOT)) {
  const tutorialsFile = join(ROOT, dir, 'tutorials.json');
  if (dir.startsWith('.') || !existsSync(tutorialsFile)) continue;
  const rel = `${dir}/tutorials.json`;
  const { root, tutorials } = JSON.parse(readFileSync(tutorialsFile, 'utf8'));
  if (!root?.path || !root?.title || !root?.description) {
    console.error(`✗ ${rel} → root 缺少 path/title/description`);
    errors++;
  }
  if (root?.path && !existsSync(join(ROOT, root.path, 'index.html'))) {
    console.error(`✗ ${rel} → ${root.path} (missing: ${root.path.slice(1)}index.html)`);
    errors++;
  }

  const ids = new Set();
  const orders = new Set();
  for (const tutorial of tutorials || []) {
    const required = ['id', 'order', 'path', 'title', 'label', 'description'];
    for (const key of required) {
      if (tutorial[key] === undefined || tutorial[key] === '') {
        console.error(`✗ ${rel} → ${tutorial.path || tutorial.id || '(unknown)'} 缺少字段: ${key}`);
        errors++;
      }
    }
    if (ids.has(tutorial.id)) {
      console.error(`✗ ${rel} → 重复 id: ${tutorial.id}`);
      errors++;
    }
    ids.add(tutorial.id);
    if (orders.has(tutorial.order)) {
      console.error(`✗ ${rel} → 重复 order: ${tutorial.order}`);
      errors++;
    }
    orders.add(tutorial.order);
    if (tutorial.path && !existsSync(join(ROOT, tutorial.path, 'index.html'))) {
      console.error(`✗ ${rel} → ${tutorial.path} (missing: ${tutorial.path.slice(1)}index.html)`);
      errors++;
    }
  }
}

if (errors) {
  console.error(`\n${errors} broken link(s).`);
  process.exit(1);
}
console.log('✓ all internal links resolve.');
