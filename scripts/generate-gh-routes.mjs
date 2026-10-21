import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src/pages');
const outFile = path.join(process.cwd(), 'src/generated/gh-routes.json');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name) && !entry.name.startsWith('_')) {
      files.push(full);
    }
  }
  return files;
}

function toRoute(file) {
  let rel = path.relative(pagesDir, file).replace(/\\/g, '/');
  rel = rel.replace(/\.(tsx|ts|jsx|js)$/, '');
  if (rel.endsWith('/index')) rel = rel.slice(0, -'/index'.length);
  if (rel === 'index') return null;

  const parts = rel.split('/').filter(Boolean);
  if (!parts.some((part) => part.startsWith('['))) return null;

  const params = [];
  const dataParts = [];
  const regexParts = [];
  const pageParts = [];

  for (const part of parts) {
    const dynamic = part.match(/^\[(?:\.\.\.)?([^\]]+)\]$/);
    if (dynamic) {
      params.push(dynamic[1]);
      dataParts.push('__gh');
      regexParts.push('([^/]+)');
      pageParts.push(`[${dynamic[1]}]`);
    } else {
      dataParts.push(part);
      regexParts.push(part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      pageParts.push(part);
    }
  }

  const staticCount = parts.length - params.length;
  return {
    page: `/${pageParts.join('/')}`,
    regex: `^/${regexParts.join('/')}/?$`,
    params,
    dataPath: `/${dataParts.join('/')}`,
    dynamicCount: params.length,
    staticCount,
  };
}

const routes = walk(pagesDir)
  .map(toRoute)
  .filter(Boolean)
  .sort((a, b) => {
    if (a.dynamicCount !== b.dynamicCount) return a.dynamicCount - b.dynamicCount;
    if (a.staticCount !== b.staticCount) return b.staticCount - a.staticCount;
    return b.page.length - a.page.length;
  })
  .map(({ page, regex, params, dataPath }) => ({ page, regex, params, dataPath }));

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(routes, null, 2)}\n`);
console.log(`Wrote ${routes.length} dynamic routes to ${path.relative(process.cwd(), outFile)}`);
