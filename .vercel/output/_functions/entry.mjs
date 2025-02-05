import { renderers } from './renderers.mjs';
import { c as createExports } from './chunks/entrypoint_OVTLe7RW.mjs';
import { manifest } from './manifest_DdCPTcKh.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/auth/signin.astro.mjs');
const _page2 = () => import('./pages/api/auth/signout.astro.mjs');
const _page3 = () => import('./pages/carrito.astro.mjs');
const _page4 = () => import('./pages/signin.astro.mjs');
const _page5 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/.pnpm/astro@5.2.5_@types+node@22.13.1_jiti@2.4.2_lightningcss@1.29.1_rollup@4.34.3_typescript@5.7.3_yaml@2.7.0/node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/auth/signin.js", _page1],
    ["src/pages/api/auth/signout.js", _page2],
    ["src/pages/carrito.astro", _page3],
    ["src/pages/signin.astro", _page4],
    ["src/pages/index.astro", _page5]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "27acc43d-7f0b-486b-86d2-c4b36b5974e6",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;

export { __astrojsSsrVirtualEntry as default, pageMap };
