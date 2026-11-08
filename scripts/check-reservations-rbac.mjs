import assert from 'node:assert/strict';
import {reservationsApi} from '../src/reservations.js';

// A minimal parameterized D1 mock verifies the actual reservation router and
// its database WHERE clauses, not just static snippets of source code.
class MemoryDB{
 constructor(){
  this.users=new Map();this.sessions=new Map();this.loginLimits=new Map();
  this.reservations=new Map([
   ['11111111-1111-4111-8111-111111111111',{id:'11111111-1111-4111-8111-111111111111',venue:'zyb',guest_name:'Zybitskaya guest',phone:'+375291111111',booking_date:'2026-11-19',booking_time:'19:00',guests:2,comment:'',status:'new'}],
   ['22222222-2222-4222-8222-222222222222',{id:'22222222-2222-4222-8222-222222222222',venue:'pob',guest_name:'Pobediteley guest',phone:'+375292222222',booking_date:'2026-11-19',booking_time:'20:00',guests:2,comment:'',status:'new'}],
   ['33333333-3333-4333-8333-333333333333',{id:'33333333-3333-4333-8333-333333333333',venue:'east',guest_name:'Vostok guest',phone:'+375293333333',booking_date:'2026-11-20',booking_time:'18:00',guests:3,comment:'',status:'new'}]
  ]);
  this.staffAudit=[];this.statusAudit=[];this.restrictedSQL=0;
 }
 prepare(sql){
  const db=this;
  function filtered(p){
   let records=[...db.reservations.values()];
   const where=sql.split(' WHERE ')[1]?.split(' ORDER BY ')[0]||'';
   if(p[0]==='east')console.log('FILTER DEBUG',JSON.stringify({sql,params:p,where,records:[...db.reservations.values()].map(x=>({id:x.id,venue:x.venue}))}));
   let index=0;
   if(where.includes('venue=?')){db.restrictedSQL++;records=records.filter(x=>x.venue===p[index++])}
   if(where.includes('status=?'))records=records.filter(x=>x.status===p[index++]);
   if(where.includes('booking_date=?'))records=records.filter(x=>x.booking_date===p[index++]);
   return records;
  }
  const q=p=>({
   sql,params:p,
   async first(){
    if(sql.includes('FROM reservation_sessions s LEFT JOIN reservation_users u')){
     const row=db.sessions.get(p[0]);if(!row||row.expires_at<=p[1])return null;
     const u=row.user_id?db.users.get(row.user_id):null;
     return {user_id:row.user_id,expires_at:row.expires_at,
      username:u?.username||null,display_name:u?.display_name||null,
      role:u?.role||null,venue:u?.venue||null,active:u?.active??null};
    }
    if(sql.includes('FROM login_limits WHERE ip=?'))return db.loginLimits.get(p[0])||null;
    if(sql.includes('FROM reservation_users WHERE username=?'))return [...db.users.values()].find(u=>u.username===p[0])||null;
    if(sql.includes('FROM reservation_users WHERE id=?'))return db.users.get(p[0])||null;
    if(sql.includes('COUNT(*) AS n FROM reservation_users'))return {n:db.users.size};
    if(sql.includes('COUNT(*) AS total FROM reservations'))return {total:filtered(p).length};
    if(sql.includes('SELECT status,venue FROM reservations WHERE id=?'))return db.reservations.get(p[0])||null;
    throw Error('Unmocked D1 FIRST: '+sql);
   },
   async all(){
    if(sql.includes('FROM reservations WHERE')){
     const list=filtered(p);
     if(!sql.includes('LIMIT 100 OFFSET ?'))throw Error('Expected bounded reservation list');
     return {results:list.slice(p[p.length-1],p[p.length-1]+100)};
    }
    if(sql.includes('FROM reservation_users ORDER BY venue,username'))
     return {results:[...db.users.values()].map(({id,username,display_name,venue,role,active,created_at,updated_at})=>({id,username,display_name,venue,role,active,created_at,updated_at}))};
    throw Error('Unmocked D1 ALL: '+sql);
   },
   async run(){
    if(sql.startsWith('INSERT INTO reservation_users')){
     const [id,username,display_name,venue,role,salt,password_hash]=p;
     if([...db.users.values()].some(u=>u.username===username))throw Error('UNIQUE constraint failed: reservation_users.username');
     db.users.set(id,{id,username,display_name,venue,role,salt,password_hash,active:1});return {meta:{changes:1}};
    }
    if(sql.startsWith('INSERT INTO reservation_staff_audit')){
     db.staffAudit.push({id:p[0],actor:p[1],target:p[2],action:p[3]});return {meta:{changes:1}};
    }
    if(sql.startsWith('INSERT INTO reservation_sessions')){
     db.sessions.set(p[0],{user_id:p[1],expires_at:p[2]});return {meta:{changes:1}};
    }
    if(sql.startsWith('DELETE FROM reservation_sessions WHERE expires_at<')){
     for(const [key,row] of db.sessions)if(row.expires_at<p[0])db.sessions.delete(key);
     return {meta:{changes:1}};
    }
    if(sql.startsWith('DELETE FROM reservation_sessions WHERE token_hash=')){
     db.sessions.delete(p[0]);return {meta:{changes:1}};
    }
    if(sql.startsWith('DELETE FROM reservation_sessions WHERE user_id=')){
     for(const [key,row] of db.sessions)if(row.user_id===p[0])db.sessions.delete(key);
     return {meta:{changes:1}};
    }
    if(sql.startsWith('DELETE FROM login_limits WHERE ip=')){
     db.loginLimits.delete(p[0]);return {meta:{changes:1}};
    }
    if(sql.startsWith('INSERT INTO login_limits')){
     db.loginLimits.set(p[0],{attempts:p[1],locked_until:p[2]});return {meta:{changes:1}};
    }
    if(sql.startsWith('UPDATE reservation_users SET')){
     const user=db.users.get(p[6]);if(!user)return {meta:{changes:0}};
     Object.assign(user,{display_name:p[0],venue:p[1],role:p[2],active:p[3]});
     if(p[4]!==null)user.salt=p[4];
     if(p[5]!==null)user.password_hash=p[5];
     return {meta:{changes:1}};
    }
    if(sql.startsWith('UPDATE reservations SET')){
     assert.match(sql,/WHERE id=\? AND venue=\? AND status=\?/,'Status update must always re-check venue');
     const [next,id,venue,previous]=p;
     const r=db.reservations.get(id);
     if(!r||r.venue!==venue||r.status!==previous)return {meta:{changes:0}};
     r.status=next;return {meta:{changes:1}};
    }
    if(sql.startsWith('INSERT INTO reservation_audit')){
     db.statusAudit.push({id:p[0],target:p[1],from:p[2],to:p[3],actor:p[4]});
     return {meta:{changes:1}};
    }
    throw Error('Unmocked D1 RUN: '+sql);
   }
  });
  return {bind(...p){return q(p)},first:()=>q([]).first(),all:()=>q([]).all(),run:()=>q([]).run()};
 }
 async batch(items){const result=[];for(const item of items)result.push(await item.run());return result}
}
const DB=new MemoryDB();
const env={DB,ADMIN_SIGNING_KEY:'test-pepper-not-in-real-worker',ADMIN_PASSWORD:'owner-master-password-very-long'};
const HOST='https://nova.example';
function request(path,{method='GET',cookie='',json}={}){
 const headers={'x-nova-reserved':'1'};
 if(cookie)headers.cookie=cookie;
 if(method!=='GET')headers.origin=HOST;
 if(json!==undefined)headers['content-type']='application/json';
 return new Request(HOST+path,{method,headers,body:json===undefined?undefined:JSON.stringify(json)});
}
async function call(path,options={}){
 const req=request(path,options);
 const response=await reservationsApi(req,env,new URL(req.url));
 return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
function loginCookie(response){assert.equal(response.status,200);assert.match(response.cookie,/^nova_reserved=[A-Za-z0-9_-]{43}$/);return response.cookie}
const owner=loginCookie(await call('/api/reserved/login',{method:'POST',json:{username:'owner',password:env.ADMIN_PASSWORD}}));
const unauth=await call('/api/reserved/reservations');
assert.equal(unauth.status,401,'No cookie must never reveal reservations');
const ownerSession=await call('/api/reserved/session',{cookie:owner});
assert.deepEqual(ownerSession.body.user,{username:'owner',display_name:'Владелец NOVA',role:'owner',venue:null});

async function create(username,role,venue,password){
 const response=await call('/api/reserved/users',{method:'POST',cookie:owner,json:{username,display_name:username+' staff',venue,role,password}});
 assert.equal(response.status,201,JSON.stringify(response));
 const saved=[...DB.users.values()].find(u=>u.username===username);
 assert.ok(saved?.salt&&saved?.password_hash&&saved.password_hash!==password,'Credentials must be hashed and salted in D1');
 return response.body.user;
}
const zybUser=await create('hof_staff','manager','zyb','complex-hof-password-2026');
const pobUser=await create('pob_staff','manager','pob','complex-pob-password-2026');
const viewerUser=await create('east_reader','viewer','east','complex-east-password-2026');
const zyb=loginCookie(await call('/api/reserved/login',{method:'POST',json:{username:'hof_staff',password:'complex-hof-password-2026'}}));
const viewer=loginCookie(await call('/api/reserved/login',{method:'POST',json:{username:'east_reader',password:'complex-east-password-2026'}}));

let list=await call('/api/reserved/reservations?venue=all',{cookie:zyb});
assert.equal(list.status,200);
assert.deepEqual(list.body.reservations.map(r=>r.venue),['zyb'],'Own D1 venue must be applied even when query requests all');
assert.equal(list.body.total,1,'Count query must not leak other locations');
assert.ok(DB.restrictedSQL>=2,'Both count and list require SQL venue constraints');
list=await call('/api/reserved/reservations?venue=pob',{cookie:zyb});
assert.equal(list.status,403,'Forcing other venue query must be rejected');
list=await call('/api/reserved/reservations?venue=zyb',{cookie:viewer});
assert.equal(list.status,403,'Viewer cannot request other location');
list=await call('/api/reserved/reservations?venue=all',{cookie:viewer});
assert.equal(list.status,200);
console.log('VIEWER DEBUG',JSON.stringify({body:list.body,user:DB.users.get(viewerUser.id),restrictedSQL:DB.restrictedSQL}));
assert.deepEqual(list.body.reservations.map(r=>r.venue),['east'],'Viewer may only read assigned location');
assert.equal((await call('/api/reserved/users',{cookie:zyb})).status,403,'Staff must not enumerate users');
assert.equal((await call('/api/reserved/users',{method:'POST',cookie:zyb,json:{username:'evil',role:'owner'}})).status,403,'Staff must not create users');
assert.equal((await call('/api/reserved/users/'+viewerUser.id,{method:'PATCH',cookie:zyb,json:{venue:'zyb'}})).status,403,'Staff must not change another user venue');
assert.equal((await call('/api/reserved/reservations/22222222-2222-4222-8222-222222222222',{method:'PATCH',cookie:zyb,json:{status:'cancelled'}})).status,404,'Foreign booking id must be indistinguishable from missing');
assert.equal(DB.reservations.get('22222222-2222-4222-8222-222222222222').status,'new','Foreign booking status remains intact');
assert.equal((await call('/api/reserved/reservations/33333333-3333-4333-8333-333333333333',{method:'PATCH',cookie:viewer,json:{status:'cancelled'}})).status,403,'Viewer cannot change even own bookings');
assert.equal((await call('/api/reserved/reservations/11111111-1111-4111-8111-111111111111',{method:'PATCH',cookie:zyb,json:{status:'confirmed'}})).status,200);
assert.equal(DB.reservations.get('11111111-1111-4111-8111-111111111111').status,'confirmed','Manager can confirm own venue');
assert.equal(DB.statusAudit.at(-1).actor,'hof_staff','Every status edit must identify its actor');
list=await call('/api/reserved/reservations?venue=all',{cookie:owner});
assert.equal(list.body.total,3,'Owner may view all venues');

const disable=await call('/api/reserved/users/'+viewerUser.id,{method:'PATCH',cookie:owner,json:{active:false}});
assert.equal(disable.status,200);
assert.equal((await call('/api/reserved/reservations?venue=all',{cookie:viewer})).status,401,'Disabling staff must revoke active sessions immediately');
const switchVenue=await call('/api/reserved/users/'+zybUser.id,{method:'PATCH',cookie:owner,json:{venue:'pob',role:'viewer'}});
assert.equal(switchVenue.status,200);
assert.equal((await call('/api/reserved/reservations?venue=all',{cookie:zyb})).status,401,'Changing venue or role must revoke existing sessions');
const relogin=loginCookie(await call('/api/reserved/login',{method:'POST',json:{username:'hof_staff',password:'complex-hof-password-2026'}}));
assert.equal((await call('/api/reserved/reservations?venue=zyb',{cookie:relogin})).status,403,'Reassigned user cannot access previous venue');
list=await call('/api/reserved/reservations?venue=all',{cookie:relogin});
assert.deepEqual(list.body.reservations.map(r=>r.venue),['pob']);
assert.equal((await call('/api/reserved/reservations/22222222-2222-4222-8222-222222222222',{method:'PATCH',cookie:relogin,json:{status:'cancelled'}})).status,403,'Reassigned viewer has no edit rights');

assert.equal((await call('/api/reserved/reservations',{method:'DELETE',cookie:owner})).status,404,'No delete-reservation endpoint may exist');
assert.equal((await call('/api/reserved/logout',{method:'POST',cookie:owner})).status,200);
assert.equal((await call('/api/reserved/session',{cookie:owner})).status,401,'Logout must revoke owner session in D1');
assert.ok(DB.staffAudit.length>=4,'Staff creation and permission changes should be audited');
console.log('RESERVED D1 tenant isolation, cross-venue denial, viewer permissions, session revocation and owner scope checks passed');
