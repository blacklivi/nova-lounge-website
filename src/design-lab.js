// Isolated static client presentation worker for NOVA.
// This Worker MUST NOT bind D1, R2, AI, secrets or live booking services.
// It serves only the design concept page and the exact static asset directories it needs.
const noindex={ 'X-Robots-Tag':'noindex, nofollow', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer' };
export default {
  async fetch(request,env) {
    if (request.method!=='GET' && request.method!=='HEAD') {
      return new Response('Method not allowed',{status:405,headers:noindex});
    }
    const url=new URL(request.url);
    if(url.pathname==='/') {
      return Response.redirect(new URL('/concept.html',url),302);
    }
    if(!(/^\/concept\.(?:html|css|js)$/.test(url.pathname)
         || /^\/media\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|webp|png)$/.test(url.pathname)
         || /^\/fonts\/[a-zA-Z0-9_.-]+\.(?:woff2?|ttf)$/.test(url.pathname))) {
      return new Response('Not found',{status:404,headers:noindex});
    }
    const asset=await env.ASSETS.fetch(request);
    const headers=new Headers(asset.headers);
    for(const [name,value] of Object.entries(noindex))headers.set(name,value);
    headers.set('Cache-Control',/^\/concept\.(?:html|css|js)$/.test(url.pathname)?'no-cache, must-revalidate':'public, max-age=3600');
    return new Response(asset.body,{status:asset.status,statusText:asset.statusText,headers});
  }
};
