export { renderers } from '../../../renderers.mjs';

// With `output: 'static'` configured:
// export const prerender = false;

const GET = async ({ cookies, redirect }) => {
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });
    return redirect("/signin");
  };

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
