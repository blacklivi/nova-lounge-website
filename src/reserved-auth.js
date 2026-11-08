// Separate, revocable reservations authentication. Staff roles and venue scope
// are resolved from D1 on every API request, not trusted from a browser token.
const HEADERS={'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const send=(data,status=200)=>Response.json(data,{status,headers:HEADERS});
const denied=(error,status)=>send({ok:false,error},status);
const enc=new TextEncoder();
const COOKIE='nova_reserved';
const COOKIE_PATH='/api/reserved';
const DURATION=8*60*60*1000;
const VENUES=new Set(['zyb','pob','east']);
const ROLES=new Set(['manager','viewer']);
const USERNAME=/^[a-z][a-z0-9._-]{2,31}$/;
// Cloudflare Workers enforces a hard ceiling of 100,000 PBKDF2 iterations.
// The original 160,000 caused HTTP 500 on staff creation and login in production.
export const PBKDF2_ITERATIONS=100000;
const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const random=length=>b64(crypto.getRandomValues(new Uint8Array(length)));
const hash=async input=>b64(await crypto.subtle.digest('SHA-256',enc.encode(input)));
const safeEqual=(a,b)=>{
 const x=enc.encode(a),y=enc.encode(b);
 let delta=x.length^y.length;
 for(let i=0;i<Math.max(x.length,y.length);i++)delta|=(x[i]||0)^(y[i]||0);
 return delta===0;
};
const sessionHash=(token,env)=>hash('NOVA:reserved:session:v2:'+env.ADMIN_SIGNING_KEY+':'+token);
const cookies=(token,seconds)=>COOKIE+'='+token+'; Path='+COOKIE_PATH+'; Secure; HttpOnly; SameSite=Strict; Max-Age='+seconds;
function authToken(req){
 const value=req.headers.get('cookie')?.match(/(?:^|;\s*)nova_reserved=([A-Za-z0-9_-]+)/)?.[1];
 return value&&value.length===43?value:null;
}
function authAllowed(req){
 const origin=req.headers.get('origin'),site=req.headers.get('sec-fetch-site');
 return (!origin||origin===new URL(req.url).origin)&&site!=='cross-site'&&req.headers.get('x-nova-reserved')==='1';
}
async function bodyJSON(req){
 if(!req.headers.get('content-type')?.toLowerCase().includes('application/json'))throw Error('invalid_json');
 if(Number(req.headers.get('content-length')||0)>8192)throw Error('invalid_json');
 const b=await req.json();
 if(!b||typeof b!=='object'||Array.isArray(b))throw Error('invalid_json');
 return b;
}
async function passwordKey(password,salt,secret){
 const imported=await crypto.subtle.importKey('raw',enc.encode(password+':'+secret),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:enc.encode(salt),iterations:PBKDF2_ITERATIONS},imported,256);
 return b64(bits);
}
const pwValid=p=>typeof p==='string'&&p.length>=12&&p.length<=128&&!p.includes('\0');
const publicUser=u=>u.role==='owner'
 ?{username:'owner',display_name:'Владелец NOVA',role:'owner',venue:null}
 :{username:u.username,display_name:u.display_name,role:u.role,venue:u.venue};

export async function currentReservedUser(req,env){
 if(!env.DB||!env.ADMIN_SIGNING_KEY)return null;
 const token=authToken(req);if(!token)return null;
 const key=await sessionHash(token,env);
 const row=await env.DB.prepare('SELECT s.user_id,s.expires_at,u.username,u.display_name,u.role,u.venue,u.active FROM reservation_sessions s LEFT JOIN reservation_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? LIMIT 1').bind(key,Date.now()).first();
 if(!row)return null;
 if(row.user_id===null)return {id:null,role:'owner',username:'owner',display_name:'Владелец NOVA',venue:null};
 if(row.active!==1||!ROLES.has(row.role)||!VENUES.has(row.venue))return null;
 return {id:row.user_id,role:row.role,username:row.username,display_name:row.display_name,venue:row.venue};
}
export const publicIdentity=publicUser;
export async function reservedLogin(req,env){
 if(!authAllowed(req))return denied('forbidden',403);
 if(!env.DB||!env.ADMIN_SIGNING_KEY)return denied('not_configured',503);
 let data;
 try{data=await bodyJSON(req)}catch{return denied('invalid_json',400)}
 const username=typeof data.username==='string'?data.username.trim().toLowerCase():'';
 const password=typeof data.password==='string'&&data.password.length<=256?data.password:'';
 if(!password||!username||(!USERNAME.test(username)&&username!=='owner'))return denied('invalid_credentials',401);
 const client=req.headers.get('cf-connecting-ip')||'unknown';
 const ip='reserved-v2:'+await hash(env.ADMIN_SIGNING_KEY+':'+client);
 const entry=await env.DB.prepare('SELECT attempts,locked_until FROM login_limits WHERE ip=?').bind(ip).first();
 if(entry?.locked_until>Date.now())return denied('too_many_attempts',429);
 let user=null,allowed=false;
 if(username==='owner'){
  const secret=env.RESERVATIONS_PASSWORD||env.ADMIN_PASSWORD;
  allowed=!!secret&&safeEqual(await hash(password),await hash(secret));
 }else{
  user=await env.DB.prepare('SELECT id,username,display_name,venue,role,salt,password_hash,active FROM reservation_users WHERE username=? LIMIT 1').bind(username).first();
  // A real PBKDF2 operation occurs even for unknown usernames, avoiding a
  // fast account-enumeration path via timing differences.
  const value=await passwordKey(password,user?.salt||'NOVA-unused-salt',env.ADMIN_SIGNING_KEY);
  allowed=!!user&&user.active===1&&safeEqual(value,user.password_hash);
 }
 if(!allowed){
  const attempts=(entry?.attempts||0)+1;
  await env.DB.prepare('INSERT INTO login_limits(ip,attempts,locked_until) VALUES(?,?,?) ON CONFLICT(ip) DO UPDATE SET attempts=excluded.attempts,locked_until=excluded.locked_until').bind(ip,attempts,attempts>=6?Date.now()+30*60*1000:0).run();
  return denied('invalid_credentials',401);
 }
 await env.DB.prepare('DELETE FROM login_limits WHERE ip=?').bind(ip).run();
 const token=random(32),expires=Date.now()+DURATION;
 await env.DB.batch([
  env.DB.prepare('DELETE FROM reservation_sessions WHERE expires_at<?').bind(Date.now()),
  env.DB.prepare('INSERT INTO reservation_sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(await sessionHash(token,env),user?.id||null,expires)
 ]);
 const actor=user||{role:'owner'};
 const response=send({ok:true,user:publicUser(actor)});
 response.headers.set('Set-Cookie',cookies(token,DURATION/1000));
 return response;
}
export async function reservedLogout(req,env){
 const token=authToken(req);
 if(token&&env.DB&&env.ADMIN_SIGNING_KEY)await env.DB.prepare('DELETE FROM reservation_sessions WHERE token_hash=?').bind(await sessionHash(token,env)).run();
 const response=send({ok:true});
 response.headers.set('Set-Cookie',cookies('',0));
 return response;
}
export async function reservedUsers(req,env,actor){
 if(actor.role!=='owner')return denied('forbidden',403);
 if(req.method==='GET'){
  const r=await env.DB.prepare('SELECT id,username,display_name,venue,role,active,created_at,updated_at FROM reservation_users ORDER BY venue,username').all();
  return send({ok:true,users:r.results||[]});
 }
 if(req.method!=='POST')return denied('method_not_allowed',405);
 if(!authAllowed(req))return denied('forbidden',403);
 let b;try{b=await bodyJSON(req)}catch{return denied('invalid_json',400)}
 const username=typeof b.username==='string'?b.username.trim().toLowerCase():'';
 const display=typeof b.display_name==='string'?b.display_name.trim():'';
 if(!USERNAME.test(username)||username==='owner'||display.length<2||display.length>80||!VENUES.has(b.venue)||!ROLES.has(b.role)||!pwValid(b.password))return denied('invalid_user',400);
 const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM reservation_users').first();
 if(count.n>=40)return denied('user_limit',409);
 const id=crypto.randomUUID(),salt=random(16),pw=await passwordKey(b.password,salt,env.ADMIN_SIGNING_KEY);
 try{
  await env.DB.batch([
   env.DB.prepare('INSERT INTO reservation_users(id,username,display_name,venue,role,salt,password_hash) VALUES(?,?,?,?,?,?,?)').bind(id,username,display,b.venue,b.role,salt,pw),
   env.DB.prepare('INSERT INTO reservation_staff_audit(id,actor,target_user_id,action) VALUES(?,?,?,?)').bind(crypto.randomUUID(),actor.username,id,'created')
  ]);
 }catch(e){
  if(String(e).includes('UNIQUE'))return denied('username_taken',409);
  throw e;
 }
 return send({ok:true,user:{id,username,display_name:display,venue:b.venue,role:b.role,active:1}},201);
}
export async function reservedUserUpdate(req,env,actor,id){
 if(actor.role!=='owner')return denied('forbidden',403);
 if(!authAllowed(req))return denied('forbidden',403);
 if(!/^[a-f0-9-]{36}$/.test(id))return denied('not_found',404);
 const exists=await env.DB.prepare('SELECT id,username,display_name,venue,role,active FROM reservation_users WHERE id=?').bind(id).first();
 if(!exists)return denied('not_found',404);
 let b;try{b=await bodyJSON(req)}catch{return denied('invalid_json',400)}
 const allowedKeys=new Set(['display_name','venue','role','active','password']);
 if(!Object.keys(b).length||Object.keys(b).some(k=>!allowedKeys.has(k)))return denied('invalid_user',400);
 const display=b.display_name===undefined?exists.display_name:b.display_name;
 const venue=b.venue===undefined?exists.venue:b.venue;
 const role=b.role===undefined?exists.role:b.role;
 const active=b.active===undefined?exists.active:(b.active===true?1:b.active===false?0:null);
 if(typeof display!=='string'||display.trim().length<2||display.trim().length>80||!VENUES.has(venue)||!ROLES.has(role)||active===null||(b.password!==undefined&&!pwValid(b.password)))return denied('invalid_user',400);
 const salt=b.password!==undefined?random(16):null;
 const pw=b.password!==undefined?await passwordKey(b.password,salt,env.ADMIN_SIGNING_KEY):null;
 const changes=[env.DB.prepare('UPDATE reservation_users SET display_name=?,venue=?,role=?,active=?,salt=COALESCE(?,salt),password_hash=COALESCE(?,password_hash),updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(display.trim(),venue,role,active,salt,pw,id),
 env.DB.prepare('DELETE FROM reservation_sessions WHERE user_id=?').bind(id),
 env.DB.prepare('INSERT INTO reservation_staff_audit(id,actor,target_user_id,action) VALUES(?,?,?,?)').bind(crypto.randomUUID(),actor.username,id,b.password!==undefined?'password_or_access_changed':'access_changed')];
 await env.DB.batch(changes);
 return send({ok:true,user:{id,username:exists.username,display_name:display.trim(),venue,role,active}});
}
