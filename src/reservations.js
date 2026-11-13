import {minskNow} from '../public/core.js';
import {normalizeBelarusPhone} from '../public/booking-phone.js';
import {currentReservedUser,publicIdentity,reservedLogin,reservedLogout,reservedUsers,reservedUserUpdate} from './reserved-auth.js';

const NO_STORE={'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const VENUES=new Set(['zyb','pob','east']);
const STATUSES=new Set(['new','confirmed','cancelled','completed','no_show']);
const encoder=new TextEncoder();
const ok=(data,status=200)=>Response.json(data,{status,headers:NO_STORE});
const fail=(code,status=400)=>ok({ok:false,error:code},status);
const cleanString=(value,max)=>typeof value==='string'&&value.trim().length<=max?value.trim():'';
const originOK=req=>{
 const origin=req.headers.get('origin');
 const site=req.headers.get('sec-fetch-site');
 return (!origin||origin===new URL(req.url).origin)&&site!=='cross-site';
};
const actionOK=req=>originOK(req)&&req.headers.get('x-nova-reserved')==='1';
const json=async req=>{
 if(!req.headers.get('content-type')?.toLowerCase().includes('application/json'))throw Error('json_required');
 const body=await req.json();
 if(!body||typeof body!=='object'||Array.isArray(body))throw Error('invalid_json');
 return body;
};
const digest=async text=>new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(text)));
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
function parseDate(value){
 if(typeof value!=='string'||!/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(value))return false;
 const d=new Date(value+'T00:00:00.000Z');
 return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value;
}
export function validateReservation(input,now=Date.now()){
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const venue=cleanString(input.venue,8);
 const name=cleanString(input.name,80);
 const phone=cleanString(input.phone,30);
 const canonicalPhone=normalizeBelarusPhone(phone);
 const date=cleanString(input.date,10);
 const time=cleanString(input.time,5);
 const guests=Number(input.guests);
 const comment=cleanString(input.comment||'',500);
 if(typeof input.comment!=='undefined'&&(typeof input.comment!=='string'||input.comment.length>500))return null;
 const consent=input.consent===true;
 if(!VENUES.has(venue)||name.length<2||name.length>80||!canonicalPhone||
    !parseDate(date)||!/^([01]\d|2[0-3]):(00|15|30|45)$/.test(time)||
    !Number.isInteger(guests)||guests<1||guests>16||!consent||comment.length>500)return null;
 // Use the venue's Minsk timezone (UTC+03:00, year-round).
 const at=Date.parse(date+'T'+time+':00+03:00');
 if(!Number.isFinite(at)||at<=now+5*60*1000||at>now+90*24*3600*1000)return null;
 return {venue,name,phone:canonicalPhone,date,time,guests,comment};
}
async function limitPublic(req,env){
 const ip=req.headers.get('cf-connecting-ip')||'unknown';
 const bytes=await digest((env.ADMIN_SIGNING_KEY||'nova')+'|reservations|'+ip);
 const hash=b64(bytes),now=Date.now(),cutoff=now-3600000;
 const row=await env.DB.prepare(`INSERT INTO reservation_rate_limits(ip_hash,window_started,attempts) VALUES(?,?,1)
 ON CONFLICT(ip_hash) DO UPDATE SET
 attempts=CASE WHEN window_started < ? THEN 1 ELSE attempts+1 END,
 window_started=CASE WHEN window_started < ? THEN ? ELSE window_started END
 RETURNING attempts`).bind(hash,now,cutoff,cutoff,now).first();
 return (row?.attempts||0)<=8;
}
async function submit(req,env){
 if(!originOK(req))return fail('forbidden',403);
 if(!env.DB||!env.ADMIN_SIGNING_KEY)return fail('booking_unavailable',503);
 const length=Number(req.headers.get('content-length')||0);
 if(length>4096)return fail('invalid_payload',413);
 const body=await json(req);
 // The honeypot traps basic bots without persisting their unsolicited data.
 if(body.website)return ok({ok:true,accepted:true},202);
 const data=validateReservation(body);
 if(!data)return fail('invalid_reservation',400);
 if(!await limitPublic(req,env))return fail('rate_limited',429);
 const duplicate=await env.DB.prepare(`SELECT id FROM reservations WHERE venue=? AND phone=? AND booking_date=?
 AND booking_time=? AND created_at>=datetime('now','-10 minutes') LIMIT 1`)
 .bind(data.venue,data.phone,data.date,data.time).first();
 if(duplicate)return ok({ok:true,accepted:true},202);
 await env.DB.prepare(`INSERT INTO reservations
 (id,venue,guest_name,phone,booking_date,booking_time,guests,comment,status,source,consent_at)
 VALUES(?,?,?,?,?,?,?,?,'new','website',CURRENT_TIMESTAMP)`)
 .bind(crypto.randomUUID(),data.venue,data.name,data.phone,data.date,data.time,data.guests,data.comment).run();
 return ok({ok:true,accepted:true},201);
}
async function list(req,env,url,actor){
 const venue=url.searchParams.get('venue')||'all',status=url.searchParams.get('status')||'all';
 if(venue!=='all'&&!VENUES.has(venue)||status!=='all'&&!STATUSES.has(status))return fail('invalid_filter');
 // The browser does not determine the staff member's venue. Every query,
 // including the COUNT query, is narrowed by the authenticated D1 identity.
 if(actor.role!=='owner'&&venue!=='all'&&venue!==actor.venue)return fail('forbidden',403);
 const day=url.searchParams.get('date')||'';
 if(day&&!parseDate(day))return fail('invalid_date');
 const page=Math.max(0,Math.min(1000,Number.parseInt(url.searchParams.get('page')||'0',10)||0));
 const where=['1=1'],params=[];
 if(actor.role!=='owner'){
  where.push('venue=?');params.push(actor.venue);
 }else if(venue!=='all'){
  where.push('venue=?');params.push(venue);
 }
 if(status!=='all'){where.push('status=?');params.push(status)}
 if(day){where.push('booking_date=?');params.push(day)}
 const clause=where.join(' AND ');
 const count=await env.DB.prepare('SELECT COUNT(*) AS total FROM reservations WHERE '+clause).bind(...params).first();
 const rows=await env.DB.prepare(`SELECT id,venue,guest_name,phone,booking_date,booking_time,guests,comment,status,source,telegram_sent_at,created_at,updated_at
  FROM reservations WHERE ${clause} ORDER BY
  CASE status WHEN 'new' THEN 0 WHEN 'confirmed' THEN 1 ELSE 2 END,
  booking_date ASC,booking_time ASC,created_at DESC LIMIT 100 OFFSET ?`)
 .bind(...params,page*100).all();
 return ok({ok:true,reservations:rows.results||[],total:count?.total||0,page});
}
async function changeStatus(req,env,id,actor){
 if(actor.role==='viewer')return fail('forbidden',403);
 if(!/^[0-9a-f-]{36}$/.test(id))return fail('invalid_id');
 const b=await json(req);
 const status=cleanString(b.status,16);
 if(!STATUSES.has(status))return fail('invalid_status');
 const old=await env.DB.prepare('SELECT status,venue FROM reservations WHERE id=?').bind(id).first();
 // Treat foreign reservations as nonexistent; their IDs must not be usable
 // for confirmation, cancellation, or even existence probing.
 if(!old||(actor.role!=='owner'&&old.venue!==actor.venue))return fail('not_found',404);
 if(old.status!==status){
  await env.DB.batch([
   env.DB.prepare('UPDATE reservations SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND venue=? AND status=?').bind(status,id,old.venue,old.status),
   env.DB.prepare('INSERT INTO reservation_audit(id,reservation_id,from_status,to_status,actor) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),id,old.status,status,actor.username)
  ]);
 }
 return ok({ok:true,status});
}
export async function reservationsApi(req,env,url){
 const path=url.pathname;
 if(path==='/api/reservations')return req.method==='POST'?submit(req,env):fail('method_not_allowed',405);
 if(path==='/api/reserved/login')return req.method==='POST'?reservedLogin(req,env):fail('method_not_allowed',405);
 if(!path.startsWith('/api/reserved/'))return fail('not_found',404);
 // Both the owner and every venue-scoped staff member have independently
 // revocable sessions. Never honor a client-supplied role/venue.
 const actor=await currentReservedUser(req,env);
 if(!actor)return fail('unauthorized',401);
 if(path==='/api/reserved/session'&&req.method==='GET')return ok({ok:true,user:publicIdentity(actor)});
 if(path==='/api/reserved/logout'&&req.method==='POST'){
  if(!actionOK(req))return fail('forbidden',403);
  return reservedLogout(req,env);
 }
 if(path==='/api/reserved/users'){
  if(!['GET','POST'].includes(req.method))return fail('method_not_allowed',405);
  return reservedUsers(req,env,actor);
 }
 if(path.startsWith('/api/reserved/users/')){
  if(req.method!=='PATCH')return fail('method_not_allowed',405);
  return reservedUserUpdate(req,env,actor,path.slice('/api/reserved/users/'.length));
 }
 if(path==='/api/reserved/reservations'&&req.method==='GET')return list(req,env,url,actor);
 if(path.startsWith('/api/reserved/reservations/')&&req.method==='PATCH'){
  if(!actionOK(req))return fail('forbidden',403);
  return changeStatus(req,env,path.slice('/api/reserved/reservations/'.length),actor);
 }
 return fail('not_found',404);
}
