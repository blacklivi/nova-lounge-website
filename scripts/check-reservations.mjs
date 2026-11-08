import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateReservation} from '../src/reservations.js';

const worker=readFileSync('src/index.js','utf8');
const module=readFileSync('src/reservations.js','utf8');
const app=readFileSync('public/app.js','utf8');
const staff=readFileSync('public/reserved.js','utf8');
const html=readFileSync('public/reserved.html','utf8');
const css=readFileSync('public/reserved.css','utf8');
const migration=readFileSync('migrations/0003_reservations.sql','utf8');
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
assert.match(worker,/reservationsApi\(request,env,url\)/,'Worker must route reservation APIs');
assert.match(worker,/p==='\/reserved'/,'Worker must serve protected route');
assert.match(worker,/X-Frame-Options/,'Private staff app must not be embedded');
assert.match(module,/env\.RESERVATIONS_PASSWORD/,'Staff login must use separate secret');
assert.match(module,/Secure; HttpOnly; SameSite=Strict/,'Staff cookie must be secure');
assert.match(module,/x-nova-reserved/,'Staff writes must use custom CSRF header');
assert.match(module,/SELECT id,venue,guest_name,phone/,'Staff list requires authenticated PII access');
assert.match(module,/if\(!await loggedIn\(req,env\)\)return fail\('unauthorized',401\)/,'Staff APIs must require session');
assert.match(module,/INSERT INTO reservations/,'Guest POST must insert a record in D1');
assert.match(module,/INSERT INTO reservation_audit/,'Status updates must be audited');
assert.match(module,/telegram_sent_at/,'Future Telegram integration must be possible without reshaping bookings');
assert.match(app,/fetch\('\/api\/reservations'/,'Public form must call the persistence API');
assert.match(app,/consent:true/,'Guest consent must be recorded');
assert.match(html,/id="login-form"/,'Password screen must exist');
assert.match(html,/id="filter-venue"/,'Staff should filter by venue');
assert.match(html,/id="filter-status"/,'Staff should filter by status');
assert.match(staff,/textContent/,'Guest names and comments must be rendered as text');
assert.doesNotMatch(staff,/innerHTML/,'Staff dashboard must not inject guest strings as markup');
assert.match(css,/\.reservation\{/,'Staff cards need responsive layout');
assert.match(config,/"\/reserved"/,'Worker must intercept private page route');
assert.doesNotMatch(worker,/RESERVATIONS_PASSWORD\s*=|ADMIN_SIGNING_KEY\s*=/,'No staff password or signing key in source');
console.log('Reservations validation, privacy and protected staff UI checks passed');
