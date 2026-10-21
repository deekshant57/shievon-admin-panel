import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'out');
if (!fs.existsSync(outDir)) {
  console.log('No static export found; skipping GitHub Pages fallback.');
  process.exit(0);
}

const routes = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src/generated/gh-routes.json'), 'utf8')
);

function readHtml(route) {
  const candidates = [
    path.join(outDir, route.dataPath.slice(1), 'index.html'),
    path.join(outDir, `${route.dataPath.slice(1)}.html`),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return fs.readFileSync(candidate, 'utf8');
  }
  return null;
}

function extractAssets(html) {
  const stylesheets = [];
  const styleRe = /<link\b[^>]*>/g;
  let match;
  while ((match = styleRe.exec(html))) {
    const tag = match[0];
    if (!/rel="stylesheet"|rel='stylesheet'/.test(tag)) continue;
    const href = tag.match(/href="([^"]+)"/);
    if (href) stylesheets.push(href[1]);
  }

  const scripts = [];
  const scriptRe = /<script\b[^>]*\ssrc="([^"]+)"[^>]*>\s*<\/script>/g;
  while ((match = scriptRe.exec(html))) {
    scripts.push(match[1]);
  }
  return { stylesheets, scripts };
}

const indexHtml = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
const buildId = indexHtml.match(/"buildId":"([^"]+)"/)?.[1];
if (!buildId) {
  throw new Error('Could not read Next.js buildId from out/index.html');
}

const detectedBase = indexHtml.match(/(?:src|href)="([^"]*)\/_next\//)?.[1] || '';
const basePath = (process.env.BASE_PATH || detectedBase).replace(/\/$/, '');

const clientRoutes = [];
for (const route of routes) {
  const html = readHtml(route);
  if (!html) {
    console.warn(`Missing exported HTML for ${route.page} (${route.dataPath})`);
    continue;
  }
  const assets = extractAssets(html);
  clientRoutes.push({ ...route, ...assets });
}

const payload = JSON.stringify(clientRoutes).replace(/</g, '\\u003c');

const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Shievon Vendor Admin</title>
  </head>
  <body>
    <div id="__next"></div>
    <script>
      (function () {
        var BASE = ${JSON.stringify(basePath)};
        var BUILD_ID = ${JSON.stringify(buildId)};
        var ROUTES = ${payload};
        function strip(pathname) {
          var path = pathname || '/';
          if (BASE && path.indexOf(BASE) === 0) path = path.slice(BASE.length) || '/';
          if (path.length > 1 && path.charAt(path.length - 1) === '/') path = path.slice(0, -1);
          return path || '/';
        }
        function match(pathname) {
          var path = strip(pathname);
          for (var i = 0; i < ROUTES.length; i++) {
            var found = path.match(new RegExp(ROUTES[i].regex));
            if (found) return { route: ROUTES[i], found: found };
          }
          return null;
        }
        var hit = match(location.pathname);
        if (!hit) {
          location.replace((BASE || '') + '/');
          return;
        }
        var query = {};
        hit.route.params.forEach(function (name, index) {
          query[name] = decodeURIComponent(hit.found[index + 1]);
        });
        new URLSearchParams(location.search).forEach(function (value, key) {
          query[key] = value;
        });
        var dataUrl =
          (BASE || '') +
          '/_next/data/' +
          BUILD_ID +
          hit.route.dataPath +
          '.json';
        var request = new XMLHttpRequest();
        request.open('GET', dataUrl, false);
        request.send(null);
        if (request.status < 200 || request.status >= 300) {
          location.replace((BASE || '') + '/');
          return;
        }
        var data = JSON.parse(request.responseText);
        var nextData = {
          props: { pageProps: data.pageProps || {}, __N_SSG: true },
          page: hit.route.page,
          query: query,
          buildId: BUILD_ID,
          assetPrefix: BASE || '',
          nextExport: true,
          autoExport: true,
          isFallback: false,
          scriptLoader: []
        };
        var tags = hit.route.stylesheets
          .map(function (href) {
            return '<link rel="stylesheet" href="' + href + '" />';
          })
          .join('');
        tags +=
          '<script id="__NEXT_DATA__" type="application/json">' +
          JSON.stringify(nextData).replace(/</g, '\\\\u003c') +
          '<\\/script>';
        hit.route.scripts.forEach(function (src) {
          tags += '<script src="' + src + '"><\\/script>';
        });
        document.write(tags);
      })();
    </script>
  </body>
</html>
`;

fs.writeFileSync(path.join(outDir, '404.html'), html);
fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
console.log(`Wrote GitHub Pages fallback for ${clientRoutes.length} dynamic routes.`);
