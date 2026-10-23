// NOVA website — API for editorial content, events, media and protected admin.
// Secrets ADMIN_PASSWORD and ADMIN_SIGNING_KEY are Cloudflare Worker secrets, never committed.
const EDITABLE = new Set(['hero_tagline','hero_kicker','hero_image','story_title','story_description','story_kicker','story_image','booking_title','booking_image','venue_zyb_image','venue_pob_image','venue_east_image','venue_zyb_subtitle','venue_pob_subtitle','venue_east_subtitle','venue_zyb_desc','venue_pob_desc','venue_east_desc','venue_zyb_second','venue_pob_second','venue_east_second','venue_zyb_features','venue_pob_features','venue_east_features','gallery_zyb_1_image','gallery_zyb_2_image','gallery_pob_1_image','gallery_pob_2_image','gallery_east_1_image','gallery_east_2_image','instagram_zyb','instagram_pob','instagram_east','telegram_zyb','telegram_pob','telegram_east','menu_zyb','menu_pob','menu_east','address_zyb','address_pob','address_east','phone_zyb','phone_pob','phone_east']);
const IMAGE_KEYS = new Set([...EDITABLE].filter(k=>k.endsWith('_image')));
const MEDIA_RE=/^\/media\/[A-Za-z0-9_.-]+\.(?:jpg|png|webp)$/;
const noStore={ 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'};
function respond(data,status=200){return Response.json(data,{status,headers:noStore})}
function error(code,status=400){return respond({ok:false,error:code},status)}
function secureCookie(value,maxAge){return `nova_admin=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`}
const utf8=s=>new TextEncoder().encode(s);
const b64=buf=>btoa(String.fromCharCode(...new Uint8Array(buf))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
async function signature(secret,payload){const key=await crypto.subtle.importKey('raw',utf8(secret),'HMAC',false,['sign']);return b64(await crypto.subtle.sign('HMAC',key,utf8(payload)))}
async function authenticated(req,env){if(!env.ADMIN_SIGNING_KEY)return false;const m=(req.headers.get('cookie')||'').match(/(?:^|;\s*)nova_admin=([^;]+)/);if(!m)return false;const [expiry,sig]=m[1].split('.');if(!expiry||!sig||!/^[0-9]+$/.test(expiry)||Number(expiry)<Date.now())return false;return (await signature(env.ADMIN_SIGNING_KEY,expiry))===sig}
function originAllowed(request){const origin=request.headers.get('origin');return !origin||origin===new URL(request.url).origin}
async function payload(req){if(!req.headers.get('content-type')?.includes('application/json'))throw Error('json_required');const data=await req.json();if(!data||typeof data!=='object'||Array.isArray(data))throw Error('invalid_json');return data}
function short(v,n=180){return typeof v==='string'?v.trim().slice(0,n):''}
function validImage(v){return !v||MEDIA_RE.test(v)||(/^\/media\/base-[A-Za-z0-9]+\.jpg$/.test(v))}
function checkAuth(req,env){return authenticated(req,env)}
function jsonSecurity(req){return originAllowed(req) && req.headers.get('x-nova-admin')==='1'}
const venueIDs=new Set(['zyb','pob','east']);
function validateEvent(b){const title=short(b.title,110),description=short(b.description,1300),date=short(b.starts_at,16),venue=short(b.venue,8),image_url=short(b.image_url,220);
 if(!title||!/^20\d\d-(0[1-9]|1[0-2])-([0-2]\d|3[01])T([01]\d|2[0-3]):[0-5]\d$/.test(date)||!venueIDs.has(venue)||!validImage(image_url))throw Error('invalid_event');return {title,description,starts_at:date,venue,image_url,published:b.published===false||b.published===0?0:1}}
async function eventList(db,admin=false){const q=admin?'SELECT * FROM events ORDER BY starts_at DESC,created_at DESC':'SELECT id,title,description,starts_at,venue,image_url FROM events WHERE published = 1 ORDER BY starts_at ASC';return (await db.prepare(q).all()).results||[]}
async function api(request,env,url){const path=url.pathname;
 if(path==='/api/content'&&request.method==='GET'){const rows=(await env.DB.prepare('SELECT key,value FROM site_content').all()).results||[];return respond({content:Object.fromEntries(rows.map(r=>[r.key,r.value]))})}
 if(path==='/api/events'&&request.method==='GET'){return respond({events:await eventList(env.DB)})}
 if(path==='/api/admin/login'&&request.method==='POST'){
  if(!originAllowed(request))return error('origin_denied',403);
  const body=await payload(request);const password=short(body.password,256);const ip=(request.headers.get('CF-Connecting-IP')||'unknown').slice(0,80);
  const row=await env.DB.prepare('SELECT attempts,locked_until FROM login_limits WHERE ip = ?').bind(ip).first();
  if(row?.locked_until && row.locked_until>Date.now())return error('too_many_attempts',429);
  if(!env.ADMIN_PASSWORD||!env.ADMIN_SIGNING_KEY)return error('admin_not_configured',503);
  // Hashes reduce difference in comparison length; identical fixed-length digests.
  const hash=async s=>new Uint8Array(await crypto.subtle.digest('SHA-256',utf8(s)));
  const a=await hash(password),b=await hash(env.ADMIN_PASSWORD);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
  if(diff){const attempts=(row?.attempts||0)+1;await env.DB.prepare('INSERT INTO login_limits(ip,attempts,locked_until) VALUES(?,?,?) ON CONFLICT(ip) DO UPDATE SET attempts=excluded.attempts,locked_until=excluded.locked_until').bind(ip,attempts,attempts>=7?Date.now()+30*60*1000:0).run();return error('invalid_password',401)}
  await env.DB.prepare('DELETE FROM login_limits WHERE ip=?').bind(ip).run();const exp=Date.now()+12*3600*1000,token=exp+'.'+await signature(env.ADMIN_SIGNING_KEY,String(exp));
  const res=respond({ok:true});res.headers.set('Set-Cookie',secureCookie(token,12*3600));return res;
 }
 if(path==='/api/admin/logout'&&request.method==='POST'){const res=respond({ok:true});res.headers.set('Set-Cookie',secureCookie('',0));return res}
 if(!path.startsWith('/api/admin/'))return error('not_found',404);
 if(!await checkAuth(request,env))return error('unauthorized',401);
 if(request.method!=='GET'&&!jsonSecurity(request))return error('forbidden',403);
 if(path==='/api/admin/session'&&request.method==='GET')return respond({ok:true});
 if(path==='/api/admin/content'){
  if(request.method==='GET')return api(new Request(new URL('/api/content',request.url)),env,new URL('/api/content',request.url));
  if(request.method!=='PUT')return error('method_not_allowed',405);
  const b=await payload(request),entries=Object.entries(b.content||{});
  if(!entries.length||entries.length>32||entries.some(([k,v])=>!EDITABLE.has(k)||typeof v!=='string'||v.length>1600||(IMAGE_KEYS.has(k)&&!validImage(v))||((k.startsWith('instagram_')||k.startsWith('telegram_')||k.startsWith('menu_'))&&v&&!/^https:\/\/[\w.-]+(?:\/[^\s]*)?$/.test(v))))return error('invalid_content');
  await env.DB.batch(entries.map(([k,v])=>env.DB.prepare('INSERT INTO site_content(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP').bind(k,v)));
  return respond({ok:true,count:entries.length});
 }
 if(path==='/api/admin/events'){
  if(request.method==='GET')return respond({events:await eventList(env.DB,true)});
  if(request.method==='POST'){let b=validateEvent(await payload(request)),id=crypto.randomUUID();await env.DB.prepare('INSERT INTO events(id,title,description,starts_at,venue,image_url,published) VALUES(?,?,?,?,?,?,?)').bind(id,b.title,b.description,b.starts_at,b.venue,b.image_url,b.published).run();return respond({ok:true,id},201)}
 }
 if(path.startsWith('/api/admin/events/')){
  const id=path.slice('/api/admin/events/'.length);
  if(!/^[0-9a-f-]{36}$/.test(id))return error('invalid_id');
  if(request.method==='DELETE'){await env.DB.prepare('DELETE FROM events WHERE id=?').bind(id).run();return respond({ok:true})}
  if(request.method==='PUT'){const b=validateEvent(await payload(request));const r=await env.DB.prepare('UPDATE events SET title=?,description=?,starts_at=?,venue=?,image_url=?,published=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(b.title,b.description,b.starts_at,b.venue,b.image_url,b.published,id).run();return respond({ok:true,changed:r.meta?.changes||0})}
 }
 if(path==='/api/admin/upload'&&request.method==='POST'){
  const type=request.headers.get('content-type')||'';if(!['image/jpeg','image/png','image/webp'].includes(type))return error('unsupported_image_type');
  const size=Number(request.headers.get('content-length')||0);if(size>8*1024*1024)return error('image_too_large',413);
  const bytes=await request.arrayBuffer();if(bytes.byteLength>8*1024*1024||bytes.byteLength<128)return error('invalid_image',400);
  const x=new Uint8Array(bytes);const jpg=x[0]===255&&x[1]===216&&x[2]===255,png=x[0]===137&&x[1]===80&&x[2]===78&&x[3]===71,webp=String.fromCharCode(...x.slice(0,4))==='RIFF'&&String.fromCharCode(...x.slice(8,12))==='WEBP';
  if((type==='image/jpeg'&&!jpg)||(type==='image/png'&&!png)||(type==='image/webp'&&!webp))return error('invalid_image_signature');
  const key='upload-'+crypto.randomUUID()+'.'+({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[type]);
  await env.MEDIA.put(key,bytes,{httpMetadata:{contentType:type,cacheControl:'public, max-age=86400'}});
  return respond({ok:true,url:'/media/'+key},201)
 }
 return error('not_found',404)
}
export default {async fetch(request,env){const url=new URL(request.url),p=url.pathname;
 try{
  // Serve the homepage explicitly when HTML URL canonicalisation is disabled.
  if(p==='/')return env.ASSETS.fetch(new Request(new URL('/index.html',request.url),request));
  if(p==='/admin')return env.ASSETS.fetch(new Request(new URL('/admin.html',request.url),request));
  if(p==='/events')return env.ASSETS.fetch(new Request(new URL('/events.html',request.url),request));
  if(p.startsWith('/api/')){
    if(!env.DB)return error('database_not_connected',503);
    return await api(request,env,url);
  }
  if(p.startsWith('/media/upload-')&&MEDIA_RE.test(p)){
    const k=p.substring('/media/'.length),obj=await env.MEDIA.get(k);
    if(!obj)return new Response('Not found',{status:404});const h=new Headers({'Content-Type':obj.httpMetadata?.contentType||'application/octet-stream','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'});return new Response(obj.body,{headers:h});
  }
  return env.ASSETS.fetch(request);
 }catch(e){console.error('NOVA request error',p,String(e));return error('request_failed',500)}
}}
