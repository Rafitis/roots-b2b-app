import { c as createComponent, r as renderTemplate, m as maybeRenderHead, a as createAstro, d as addAttribute, e as renderHead, b as renderComponent, f as renderSlot } from './astro/server_BFFKcOHT.mjs';
/* empty css                           */

const $$NavBar = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<nav class="h-[60px] flex justify-center gap-10 p-8"> <div class="flex-1"> <a href="/" class="btn btn-ghost text-xl">Productos</a> </div> <div class="flex-1"> <a href="/carrito" class="btn btn-ghost text-xl">Pedido</a> </div> <div class="flex-1"> <a href="/api/auth/signout" class="btn btn-ghost text-xl">Logout</a> </div> </nav>`;
}, "/home/rafitis/2025_projects/rootsbarefoot-b2b-app/src/components/NavBar.astro", undefined);

const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate`<html lang="es"> <head><meta charset="UTF-8"><meta name="description" content="Astro description"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon_roots.webp"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title}</title>${renderHead()}</head> <body> <img src="src/assets/B2B_RootsBarefoot.png" alt="Roots Barefoot Logo" class="w-96 h-auto object-cover mt-20 rounded-2xl"> ${renderComponent($$result, "NavBar", $$NavBar, {})} <div> ${renderSlot($$result, $$slots["default"])} </div> </body></html>`;
}, "/home/rafitis/2025_projects/rootsbarefoot-b2b-app/src/layouts/Layout.astro", undefined);

export { $$Layout as $ };
