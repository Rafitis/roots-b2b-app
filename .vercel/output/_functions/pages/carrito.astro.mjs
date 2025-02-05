import { c as createComponent, a as createAstro, r as renderTemplate, b as renderComponent, m as maybeRenderHead } from '../chunks/astro/server_BFFKcOHT.mjs';
import { $ as $$Layout } from '../chunks/Layout_CypyUPBc.mjs';
import { g as getUser } from '../chunks/auth_DjuBR8u0.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const prerender = false;
const $$Carrito = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Carrito;
  const user = await getUser(Astro2.request);
  if (!user) {
    return Astro2.redirect("/signin");
  }
  const DNI = "05952652E";
  const IBAN = "ES8900730100530631563966";
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Welcome to Roots Barefoot Budget Generator" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto w-full"> <div class="p-8 bg-base-100"> ${renderComponent($$result2, "CartTable", null, { "client:only": "react", "DNI": DNI, "IBAN": IBAN, "client:component-hydration": "only", "client:component-path": "@components/CartTable", "client:component-export": "default" })} </div> </main> ` })}`;
}, "/home/rafitis/2025_projects/rootsbarefoot-b2b-app/src/pages/carrito.astro", undefined);
const $$file = "/home/rafitis/2025_projects/rootsbarefoot-b2b-app/src/pages/carrito.astro";
const $$url = "/carrito";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Carrito,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
