import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateReservation} from '../src/reservations.js';

const worker=readFileSync('src/index.js','utf8');
const module=readFileSync('src/reservations.js','utf8');
const auth=readFileSync('src/reserved-auth.js','utf8');
const {PBKDF2_ITERATIONS}=await import('../src/reserved-auth.js');
const app=readFileSync('public/app.js','utf8');
const staff=readFileSync('public/reserved.js','utf8');
const html=readFileSync('public/reserved.html','utf8');
const css=readFileSync('public/reserved.css','utf8');
const migration=readFileSync('migrations/0003_reservations.sql','utf8');
const staffMigration=readFileSync('migrations/0005_reservation_users.sql','utf8');
const admin=readFileSync('public/admin.html','utf8');
const adminJS=readFileSync('public/admin.js','utf8');
const config=readFileSync('wrangler.jsonc','utf8');
const now=Date.parse('2026-11-08T12:00:00+03:00');
const input={venue:'zyb',name:'Тестовый Гость',phone:'+375 29 123-45-67',date:'2026-11-10',time:'19:15',guests:2,comment:'У окна',consent:true};
assert.deepEqual(validateReservation(input,now),{venue:'zyb',name:'Тестовый Гость',phone:'+375291234567',date:'2026-11-10',time:'19:15',guests:2,comment:'У окна'});
for(const bad of [
 {...input,venue:'unknown'}, {...input,phone:'abc'}, {...input,date:'2026-02-30'},
 {...input,date:'2026-11-08',time:'12:00'}, {...input,time:'19:10'},
 {...input,guests:0}, {...input,guests:17}, {...input,guests:2.3}, {...input,consent:false},
 {...input,name:''}, {...input,comment:'x'.repeat(501)},
 {...input,date:'2027-09-20'}
])assert.equal(validateReservation(bad,now),null,'Invalid request must not be accepted: '+JSON.stringify(bad));
assert.match(migration,/CREATE TABLE IF NOT EXISTS reservations/,'Durable D1 table must exist');
assert.match(migration,/reservation_rate_limits/,'Public booking requests need database rate limiting');
assert.match(migration,/reservation_audit/,'Staff status changes need audit trail');
assert.match(staffMigration,/CREATE TABLE IF NOT EXISTS reservation_users/,'Staff credentials must be stored in D1');
assert.match(staffMigration,/CREATE TABLE IF NOT EXISTS reservation_sessions/,'Sessions must be revocable');
assert.match(staffMigration,/CREATE TABLE IF NOT EXISTS reservation_staff_audit/,'Changes to staff access must be auditable');
assert.match(worker,/reservationsApi\(request,env,url\)/,'Worker must route reservation APIs');
assert.match(worker,/p==='\/reserved'/,'Worker must serve protected route');
assert.match(worker,/X-Frame-Options/,'Private staff app must not be embedded');
assert.match(auth,/env\.RESERVATIONS_PASSWORD\|\|env\.ADMIN_PASSWORD/,'Owner login uses only configured Worker secret');
assert.match(auth,/Secure; HttpOnly; SameSite=Strict/,'Personal sessions must be secure HttpOnly cookies');
assert.match(auth,/currentReservedUser\(req,env\)/,'All sessions must be resolved against D1');
assert.match(auth,/DELETE FROM reservation_sessions WHERE user_id=/,'Password changes and deactivations must revoke staff sessions');
assert.match(auth,/PBKDF2/,'Staff passwords must have a slow salted key derivation');
assert.equal(PBKDF2_ITERATIONS,100000,'Cloudflare Workers PBKDF2 ceiling: values above 100,000 cause production HTTP 500');
assert.match(auth,/iterations:PBKDF2_ITERATIONS/,'Staff password hashing must use the safe Worker iteration limit');
assert.doesNotMatch(auth,/iterations:\s*(?:1[0-9]{5}|[2-9][0-9]{5,})/,'Never hardcode unsupported PBKDF2 costs in a Worker');
assert.match(auth,/actor\.role!=='owner'/,'Only owner can manage venue users');
assert.match(staffMigration,/active INTEGER NOT NULL DEFAULT 1/,'Staff accounts have a persisted deactivation state');
assert.match(auth,/b\.active===true\?1:b\.active===false\?0:null/,'Owner must be able to deactivate staff');
assert.match(module,/x-nova-reserved/,'Staff writes must use custom CSRF header');
assert.match(module,/SELECT id,venue,guest_name,phone/,'Reservation lists are fetched after authentication');
assert.match(module,/const actor=await currentReservedUser\(req,env\)/,'Role and venue must be resolved from verified session');
assert.match(module,/if\(actor\.role!=='owner'\)/,'Venue scope is enforced for staff queries');
assert.match(module,/where\.push\('venue=\?'\);params\.push\(actor\.venue\)/,'Count and rows require staff venue filtering');
assert.match(module,/old\.venue!==actor\.venue/,'Foreign reservation IDs must not allow cross-venue status edits');
assert.match(module,/actor\.role==='viewer'/,'Viewer must not modify reservation statuses');
assert.match(module,/WHERE id=\? AND venue=\? AND status=\?/,'Even SQL UPDATE must include venue guard');
assert.match(module,/INSERT INTO reservations/,'Guest POST must insert a record in D1');
assert.match(module,/INSERT INTO reservation_audit/,'Status updates must be audited');
assert.match(module,/telegram_sent_at/,'Future Telegram integration must be possible without reshaping bookings');
assert.match(module,/actor\.username/,'Reservation audit must identify the staff member who changed status');
assert.match(app,/fetch\('\/api\/reservations'/,'Public form must call the persistence API');
assert.match(app,/consent:true/,'Guest consent must be recorded');
assert.match(html,/id="login-form"/,'Password screen must exist');
assert.match(html,/id="username"/,'Staff must use personal logins');
assert.match(html,/name="username" pattern="\[A-Za-z\]\[A-Za-z0-9\._-\]\{2,31\}"/,'Staff usernames must accept iOS capitalized input before server normalization');
assert.match(html,/name="username" pattern="[^\"]+"[^>]*autocapitalize="none"/,'Safari must not auto-capitalize new account names');
assert.match(html,/id="users-panel"/,'Owner needs an interface to manage employees');
assert.match(staff,/if\(identity\?\.role!=='viewer'\)/,'Status controls must only be drawn for users with edit rights');
assert.match(staff,/if\(identity\?\.role!=='owner'\)return/,'Client account management must also be hidden from staff');
assert.match(admin,/id="page-editor-frame"/,'New visual page editor remains accessible');
assert.doesNotMatch(admin,/data-tab="content"|id="content-section"|Старый редактор/,'Old site editor must be removed from admin');
assert.doesNotMatch(adminJS,/initFields|content-form|pendingCrops|keySpecs/,'Unused legacy editor logic must be deleted');
assert.match(html,/id="filter-venue"/,'Staff should filter by venue');
assert.match(html,/id="filter-status"/,'Staff should filter by status');
assert.match(staff,/textContent/,'Guest names and comments must be rendered as text');
assert.doesNotMatch(staff,/innerHTML/,'Staff dashboard must not inject guest strings as markup');
assert.match(css,/\.reservation\{/,'Staff cards need responsive layout');
assert.match(config,/"\/reserved"/,'Worker must intercept private page route');
assert.doesNotMatch(worker,/RESERVATIONS_PASSWORD\s*=|ADMIN_SIGNING_KEY\s*=/,'No staff password or signing key in source');
console.log('Reservations validation, privacy and protected staff UI checks passed');
