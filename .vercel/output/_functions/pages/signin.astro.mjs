import { c as createComponent, a as createAstro, r as renderTemplate, b as renderComponent, m as maybeRenderHead } from '../chunks/astro/server_BFFKcOHT.mjs';
import { $ as $$Layout } from '../chunks/Layout_CypyUPBc.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Signin = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Signin;
  const { cookies } = Astro2;
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");
  if (accessToken && refreshToken) {
    return Astro2.redirect("/");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Sign in" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<h1>Sign in</h1> <form action="/api/auth/signin" method="post"> <label for="email">Email</label> <input type="email" name="email" id="email"> <label for="password">Password</label> <input type="password" name="password" id="password"> <button type="submit">Login</button> </form> ` })}`;
}, "/home/rafitis/2025_projects/rootsbarefoot-b2b-app/src/pages/signin.astro", undefined);

const $$file = "/home/rafitis/2025_projects/rootsbarefoot-b2b-app/src/pages/signin.astro";
const $$url = "/signin";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Signin,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
