import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
} from 'next/document';
import routes from '../generated/gh-routes.json';

const basePath = (process.env.BASE_PATH || '').replace(/\/$/, '');
const fallbackScript = `
(function () {
  var BASE = ${JSON.stringify(basePath)};
  var ROUTES = ${JSON.stringify(routes).replace(/</g, '\\u003c')};
  function strip(pathname) {
    var path = pathname || '/';
    if (BASE && path.indexOf(BASE) === 0) path = path.slice(BASE.length) || '/';
    var hash = path.indexOf('#');
    if (hash >= 0) path = path.slice(0, hash);
    var query = path.indexOf('?');
    if (query >= 0) path = path.slice(0, query);
    if (path.length > 1 && path.charAt(path.length - 1) === '/') path = path.slice(0, -1);
    return path || '/';
  }
  function match(pathname) {
    var path = strip(pathname);
    for (var i = 0; i < ROUTES.length; i++) {
      if (new RegExp(ROUTES[i].regex).test(path)) return ROUTES[i];
    }
    return null;
  }
  if (!window.fetch) return;
  var orig = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var marker = '/_next/data/';
    if (url.indexOf(marker) === -1) return orig(input, init);
    return orig(input, init).then(function (res) {
      if (res.ok) return res;
      var after = url.slice(url.indexOf(marker) + marker.length).split('?')[0];
      var slash = after.indexOf('/');
      if (slash < 0) return res;
      var route = match(after.slice(slash).replace(/\\.json$/, ''));
      if (!route) return res;
      var fallback =
        url.slice(0, url.indexOf(marker)) +
        marker +
        after.slice(0, slash) +
        route.dataPath +
        '.json';
      return orig(fallback, init);
    });
  };
})();
`;

export default class CustomDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    return Document.getInitialProps(ctx);
  }
  render() {
    return (
      <Html>
        <Head>
          {/* Inter loaded locally via next/font in _app.tsx */}
        </Head>
        <body>
          <script dangerouslySetInnerHTML={{ __html: fallbackScript }} />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
