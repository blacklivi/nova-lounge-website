// NOVA Design Lab: real site UI, isolated read-only preview.
// No D1, R2, secrets, admin, Telegram delivery or persisted writes.
import {publicPage, isPublicPage, seoRoute} from './seo.js';
const HEADERS={
  'X-Robots-Tag':'noindex, nofollow',
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'strict-origin-when-cross-origin'
};
const STATIC=/^\/(?:app|core|booking-date|booking-selects|events|i18n|concept|design-lab-ui)\.(?:js|html|css)$|^\/(?:site|design-lab)\.css$|^\/content-defaults\.json$|^\/(?:fonts|media)\/[A-Za-z0-9_.-]+\.(?:woff2?|ttf|jpe?g|png|webp|svg)$/;
function secure(response,cache){
  const headers=new Headers(response.headers);
  for(const [k,v] of Object.entries(HEADERS))headers.set(k,v);
  if(cache)headers.set('Cache-Control',cache);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
export default {
  async fetch(request,env){
    const url=new URL(request.url),p=url.pathname;
    if(!['GET','HEAD'].includes(request.method))
      return new Response('Read-only preview',{status:405,headers:HEADERS});
    if(p==='/api/content')
      return secure(Response.json({content:{},content_en:{}}),'no-store');
    if(p==='/api/events')
      return secure(Response.json({events:[]}), 'no-store');
    if(p.startsWith('/api/')||p==='/admin'||p==='/admin.html'||p.startsWith('/admin/'))
      return new Response('Not found',{status:404,headers:HEADERS});
    if(p==='/robots.txt'||p==='/sitemap.xml')
      return secure(seoRoute(request),'no-cache');
    if(isPublicPage(p)){
      const response=await publicPage(request,env,p.replace(/\/$/,'')||'/');
      return secure(response,'no-store');
    }
    if(STATIC.test(p)){
      const response=await env.ASSETS.fetch(request);
      const cache=/\.(?:js|css|html|json)$/.test(p)?'no-cache, must-revalidate':'public, max-age=3600';
      return secure(response,cache);
    }
    return new Response('Not found',{status:404,headers:HEADERS});
  }
};
