import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {formatBelarusPhone,normalizeBelarusPhone,nationalDigits} from '../public/booking-phone.js';
import {validateReservation} from '../src/reservations.js';
for(const code of ['25','29','33','44']){
 const raw='+375'+code+'1234567';
 const masked='+375 ('+code+') 123-45-67';
 assert.equal(normalizeBelarusPhone(masked),raw);
 assert.equal(normalizeBelarusPhone(raw),raw);
 assert.equal(normalizeBelarusPhone('375'+code+'1234567'),raw);
 assert.equal(normalizeBelarusPhone('80'+code+'1234567'),raw,'Domestic 80 prefix must normalize to +375');
 assert.equal(normalizeBelarusPhone(code+'1234567'),raw,'Local number can be pasted');
 assert.equal(formatBelarusPhone(raw),masked);
 assert.equal(nationalDigits(masked),code+'1234567');
}
for(const [raw,expected] of [
 ['29','+375 (29)'],['291','+375 (29) 1'],['29123','+375 (29) 123'],
 ['291234','+375 (29) 123-4'],['29123456','+375 (29) 123-45-6'],
 ['291234567','+375 (29) 123-45-67'],['+375 ','+375 '],
 ['+375 (2','+375 (2'],['28','+375 (2'],['641234567','+375 ']
])assert.equal(formatBelarusPhone(raw),expected,'Mask partial value '+raw);
for(const bad of [
 '6457656595','+380291234567','+79123456789','+375171234567','+375241234567',
 '+375281234567','+375321234567','+37544123456','+3752912345678',
 '+375 29 123-45-6x', '375+291234567', '+375+291234567', 'random',''
])assert.equal(normalizeBelarusPhone(bad),null,'Must reject '+bad);
const now=Date.parse('2026-11-14T12:00:00+03:00');
const base={venue:'zyb',name:'Тестовый Гость',date:'2026-11-16',time:'19:00',guests:2,comment:'У окна',consent:true};
for(const code of ['25','29','33','44']){
 const phone='+375 ('+code+') 123-45-67';
 assert.equal(validateReservation({...base,phone},now)?.phone,'+375'+code+'1234567','Server must accept '+code);
}
for(const bad of ['6457656595','+375 17 123-45-67','+380 29 123-45-67','+375 (29) 123-45-6']){
 assert.equal(validateReservation({...base,phone:bad},now),null,'Server must reject '+bad);
}
const app=readFileSync('public/app.js','utf8');
const css=readFileSync('public/site.css','utf8');
const home=readFileSync('public/index.html','utf8');
const events=readFileSync('public/events.html','utf8');
assert.match(app,/enhanceBelarusPhone\(form,language\)/,'Phone mask must be attached to every guest booking modal');
assert.match(app,/normalizeBelarusPhone\(fd\.get\('phone'\)\|\|''\)/,'Guest booking must submit canonical +375');
assert.match(app,/inputmode="numeric" maxlength="19"/,'Phone keyboard must accept digits only');
assert.match(app,/if\(!phone\)\{showError/,'Invalid phone should show useful inline message');
assert.match(css,/Guest booking alignment, including iOS/,'Scoped mobile layout fixes must exist');
assert.match(css,/@media\(max-width:600px\)\{[\s\S]*\.modal\[data-kind="booking"\]/,'Only mobile booking modal is adjusted');
assert.match(css,/font-size:16px!important/,'iPhone inputs must not trigger autofocus zoom');
for(const page of [home,events]){
 assert.match(page,/site\.css\?v=by-phone-mask-20261114/,'CSS cache must be refreshed');
 assert.match(page,/app\.js\?v=by-phone-mask-20261114/,'JS cache must be refreshed');
}
console.log('BY phone mask, server operators and mobile booking alignment checks passed');