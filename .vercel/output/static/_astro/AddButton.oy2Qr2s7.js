import{j as p,a as F}from"./useCart.eXAi_GMG.js";import{r as u}from"./index.Dv2fXs56.js";function H(){return p.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:"icon icon-tabler icons-tabler-outline icon-tabler-shopping-cart",children:[p.jsx("path",{stroke:"none",d:"M0 0h24v24H0z",fill:"none"}),p.jsx("path",{d:"M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"}),p.jsx("path",{d:"M17 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"}),p.jsx("path",{d:"M17 17h-11v-14h-2"}),p.jsx("path",{d:"M6 5l14 1l-1 7h-13"})]})}let L={data:""},_=e=>typeof window=="object"?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||L,q=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,B=/\/\*[^]*?\*\/|  +/g,A=/\n+/g,x=(e,t)=>{let a="",i="",s="";for(let r in e){let n=e[r];r[0]=="@"?r[1]=="i"?a=r+" "+n+";":i+=r[1]=="f"?x(n,r):r+"{"+x(n,r[1]=="k"?"":t)+"}":typeof n=="object"?i+=x(n,t?t.replace(/([^,])+/g,o=>r.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,l=>/&/.test(l)?l.replace(/&/g,o):o?o+" "+l:l)):r):n!=null&&(r=/^--/.test(r)?r:r.replace(/[A-Z]/g,"-$&").toLowerCase(),s+=x.p?x.p(r,n):r+":"+n+";")}return a+(t&&s?t+"{"+s+"}":s)+i},y={},T=e=>{if(typeof e=="object"){let t="";for(let a in e)t+=a+T(e[a]);return t}return e},R=(e,t,a,i,s)=>{let r=T(e),n=y[r]||(y[r]=(l=>{let c=0,d=11;for(;c<l.length;)d=101*d+l.charCodeAt(c++)>>>0;return"go"+d})(r));if(!y[n]){let l=r!==e?e:(c=>{let d,h,m=[{}];for(;d=q.exec(c.replace(B,""));)d[4]?m.shift():d[3]?(h=d[3].replace(A," ").trim(),m.unshift(m[0][h]=m[0][h]||{})):m[0][d[1]]=d[2].replace(A," ").trim();return m[0]})(e);y[n]=x(s?{["@keyframes "+n]:l}:l,a?"":"."+n)}let o=a&&y.g?y.g:null;return a&&(y.g=y[n]),((l,c,d,h)=>{h?c.data=c.data.replace(h,l):c.data.indexOf(l)===-1&&(c.data=d?l+c.data:c.data+l)})(y[n],t,i,o),n},U=(e,t,a)=>e.reduce((i,s,r)=>{let n=t[r];if(n&&n.call){let o=n(a),l=o&&o.props&&o.props.className||/^go/.test(o)&&o;n=l?"."+l:o&&typeof o=="object"?o.props?"":x(o,""):o===!1?"":o}return i+s+(n??"")},"");function O(e){let t=this||{},a=e.call?e(t.p):e;return R(a.unshift?a.raw?U(a,[].slice.call(arguments,1),t.p):a.reduce((i,s)=>Object.assign(i,s&&s.call?s(t.p):s),{}):a,_(t.target),t.g,t.o,t.k)}let M,N,z;O.bind({g:1});let b=O.bind({k:1});function V(e,t,a,i){x.p=t,M=e,N=a,z=i}function v(e,t){let a=this||{};return function(){let i=arguments;function s(r,n){let o=Object.assign({},r),l=o.className||s.className;a.p=Object.assign({theme:N&&N()},o),a.o=/ *go\d+/.test(l),o.className=O.apply(a,i)+(l?" "+l:"");let c=e;return e[0]&&(c=o.as||e,delete o.as),z&&c[0]&&z(o),M(c,o)}return s}}var Q=e=>typeof e=="function",D=(e,t)=>Q(e)?e(t):e,W=(()=>{let e=0;return()=>(++e).toString()})(),I=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),Y=20,P=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,Y)};case 1:return{...e,toasts:e.toasts.map(r=>r.id===t.toast.id?{...r,...t.toast}:r)};case 2:let{toast:a}=t;return P(e,{type:e.toasts.find(r=>r.id===a.id)?1:0,toast:a});case 3:let{toastId:i}=t;return{...e,toasts:e.toasts.map(r=>r.id===i||i===void 0?{...r,dismissed:!0,visible:!1}:r)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(r=>r.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let s=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(r=>({...r,pauseDuration:r.pauseDuration+s}))}}},k=[],$={toasts:[],pausedAt:void 0},w=e=>{$=P($,e),k.forEach(t=>{t($)})},Z={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},G=(e={})=>{let[t,a]=u.useState($);u.useEffect(()=>(k.push(a),()=>{let s=k.indexOf(a);s>-1&&k.splice(s,1)}),[t]);let i=t.toasts.map(s=>{var r,n,o;return{...e,...e[s.type],...s,removeDelay:s.removeDelay||((r=e[s.type])==null?void 0:r.removeDelay)||e?.removeDelay,duration:s.duration||((n=e[s.type])==null?void 0:n.duration)||e?.duration||Z[s.type],style:{...e.style,...(o=e[s.type])==null?void 0:o.style,...s.style}}});return{...t,toasts:i}},J=(e,t="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:a?.id||W()}),E=e=>(t,a)=>{let i=J(t,e,a);return w({type:2,toast:i}),i.id},f=(e,t)=>E("blank")(e,t);f.error=E("error");f.success=E("success");f.loading=E("loading");f.custom=E("custom");f.dismiss=e=>{w({type:3,toastId:e})};f.remove=e=>w({type:4,toastId:e});f.promise=(e,t,a)=>{let i=f.loading(t.loading,{...a,...a?.loading});return typeof e=="function"&&(e=e()),e.then(s=>{let r=t.success?D(t.success,s):void 0;return r?f.success(r,{id:i,...a,...a?.success}):f.dismiss(i),s}).catch(s=>{let r=t.error?D(t.error,s):void 0;r?f.error(r,{id:i,...a,...a?.error}):f.dismiss(i)}),e};var K=(e,t)=>{w({type:1,toast:{id:e,height:t}})},X=()=>{w({type:5,time:Date.now()})},j=new Map,ee=1e3,te=(e,t=ee)=>{if(j.has(e))return;let a=setTimeout(()=>{j.delete(e),w({type:4,toastId:e})},t);j.set(e,a)},ae=e=>{let{toasts:t,pausedAt:a}=G(e);u.useEffect(()=>{if(a)return;let r=Date.now(),n=t.map(o=>{if(o.duration===1/0)return;let l=(o.duration||0)+o.pauseDuration-(r-o.createdAt);if(l<0){o.visible&&f.dismiss(o.id);return}return setTimeout(()=>f.dismiss(o.id),l)});return()=>{n.forEach(o=>o&&clearTimeout(o))}},[t,a]);let i=u.useCallback(()=>{a&&w({type:6,time:Date.now()})},[a]),s=u.useCallback((r,n)=>{let{reverseOrder:o=!1,gutter:l=8,defaultPosition:c}=n||{},d=t.filter(g=>(g.position||c)===(r.position||c)&&g.height),h=d.findIndex(g=>g.id===r.id),m=d.filter((g,S)=>S<h&&g.visible).length;return d.filter(g=>g.visible).slice(...o?[m+1]:[0,m]).reduce((g,S)=>g+(S.height||0)+l,0)},[t]);return u.useEffect(()=>{t.forEach(r=>{if(r.dismissed)te(r.id,r.removeDelay);else{let n=j.get(r.id);n&&(clearTimeout(n),j.delete(r.id))}})},[t]),{toasts:t,handlers:{updateHeight:K,startPause:X,endPause:i,calculateOffset:s}}},re=b`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,se=b`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,oe=b`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,ie=v("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${re} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${se} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${oe} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,ne=b`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,le=v("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${ne} 1s linear infinite;
`,de=b`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,ce=b`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,ue=v("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${de} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${ce} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,pe=v("div")`
  position: absolute;
`,fe=v("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,me=b`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,he=v("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${me} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,ge=({toast:e})=>{let{icon:t,type:a,iconTheme:i}=e;return t!==void 0?typeof t=="string"?u.createElement(he,null,t):t:a==="blank"?null:u.createElement(fe,null,u.createElement(le,{...i}),a!=="loading"&&u.createElement(pe,null,a==="error"?u.createElement(ie,{...i}):u.createElement(ue,{...i})))},ye=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,be=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,xe="0%{opacity:0;} 100%{opacity:1;}",ve="0%{opacity:1;} 100%{opacity:0;}",we=v("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,je=v("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Ee=(e,t)=>{let a=e.includes("top")?1:-1,[i,s]=I()?[xe,ve]:[ye(a),be(a)];return{animation:t?`${b(i)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${b(s)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},Ce=u.memo(({toast:e,position:t,style:a,children:i})=>{let s=e.height?Ee(e.position||t||"top-center",e.visible):{opacity:0},r=u.createElement(ge,{toast:e}),n=u.createElement(je,{...e.ariaProps},D(e.message,e));return u.createElement(we,{className:e.className,style:{...s,...a,...e.style}},typeof i=="function"?i({icon:r,message:n}):u.createElement(u.Fragment,null,r,n))});V(u.createElement);var ke=({id:e,className:t,style:a,onHeightUpdate:i,children:s})=>{let r=u.useCallback(n=>{if(n){let o=()=>{let l=n.getBoundingClientRect().height;i(e,l)};o(),new MutationObserver(o).observe(n,{subtree:!0,childList:!0,characterData:!0})}},[e,i]);return u.createElement("div",{ref:r,className:t,style:a},s)},$e=(e,t)=>{let a=e.includes("top"),i=a?{top:0}:{bottom:0},s=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:I()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(a?1:-1)}px)`,...i,...s}},De=O`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,C=16,Oe=({reverseOrder:e,position:t="top-center",toastOptions:a,gutter:i,children:s,containerStyle:r,containerClassName:n})=>{let{toasts:o,handlers:l}=ae(a);return u.createElement("div",{id:"_rht_toaster",style:{position:"fixed",zIndex:9999,top:C,left:C,right:C,bottom:C,pointerEvents:"none",...r},className:n,onMouseEnter:l.startPause,onMouseLeave:l.endPause},o.map(c=>{let d=c.position||t,h=l.calculateOffset(c,{reverseOrder:e,gutter:i,defaultPosition:t}),m=$e(d,h);return u.createElement(ke,{id:c.id,key:c.id,onHeightUpdate:l.updateHeight,className:c.visible?De:"",style:m},c.type==="custom"?D(c.message,c):s?s(c):u.createElement(Ce,{toast:c,position:d}))}))},Se=f;function Ae({product:e,tag:t}){const a=()=>Se.success("Producto añadido al carrito");function i(){console.log(s,l,n),F({tag:t,product:e,quantity:s,size:l,color:n});const d=document.getElementById("cantidad-producto"+e.id);console.log(d),d.value="",r(0),o(""),c(""),a()}const[s,r]=u.useState(0),[n,o]=u.useState(""),[l,c]=u.useState("");return p.jsxs(p.Fragment,{children:[p.jsxs("div",{class:"flex flex-row gap-2 pb-4",children:[e?.Colores&&p.jsxs("select",{defaultValue:"Color",class:"select select-bordered w-full max-w-xs",onChange:d=>o(d.target.value),children:[p.jsx("option",{disabled:!0,children:"Color"}),e?.Colores.map(d=>p.jsx("option",{value:d,children:d},d))]},"color"),e?.Talla&&p.jsxs("select",{defaultValue:"Talla",class:"select select-bordered w-full max-w-xs",onChange:d=>c(d.target.value),children:[p.jsx("option",{disabled:!0,children:"Talla"}),e?.Talla.map(d=>p.jsx("option",{value:d,children:d},d))]},"size")]}),p.jsx("div",{class:"pb-2",children:p.jsx("input",{id:"cantidad-producto"+e?.id,type:"text",placeholder:"Cantidad",class:"input input-bordered w-full max-w-xs",onChange:d=>r(Number(d.target.value))})}),p.jsx("div",{class:"card-actions justify-center pb-4",children:p.jsxs("button",{className:"btn btn-primary btn-md",onClick:i,children:[p.jsx(Oe,{position:"top-right",reverseOrder:!1}),p.jsx(H,{}),"Añadir producto"]})})]})}export{Ae as default};
