import assert from 'node:assert/strict';
import {bookingWindow,availableBookingTimes,isValidBookingTime} from '../public/booking-time.js';

const inMinsk=value=>Date.parse(value+'+03:00');
const now=inMinsk('2026-11-19T22:50:00');
let window=bookingWindow(now);
assert.deepEqual([window.firstDate,window.firstTime],['2026-11-19','23:00']);
assert.deepEqual(availableBookingTimes('2026-11-19',now),['23:00','23:15','23:30','23:45']);
assert.deepEqual(availableBookingTimes('2026-11-18',now),[],'Yesterday must be unavailable');
assert.deepEqual(availableBookingTimes('2026-11-20',now).length,96,'Future day has 96 quarter-hour slots');
assert.equal(isValidBookingTime('2026-11-19','22:45',now),false);
assert.equal(isValidBookingTime('2026-11-19','23:00',now),true);
assert.equal(isValidBookingTime('2026-11-19','23:10',now),false);
assert.equal(isValidBookingTime('2026-11-18','23:45',now),false);
assert.equal(isValidBookingTime('2026-11-20','19:00',now),true);
assert.equal(isValidBookingTime('2026-11-19','23:00',inMinsk('2026-11-19T22:55:00')),false,
 'Times at exactly five minutes ahead must be rejected, as on the server');

window=bookingWindow(inMinsk('2026-11-19T23:54:00'));
assert.deepEqual([window.firstDate,window.firstTime],['2026-11-20','00:00'],
 'Last minutes of the day must automatically select the next valid date');
window=bookingWindow(inMinsk('2026-11-19T23:56:00'));
assert.deepEqual([window.firstDate,window.firstTime],['2026-11-20','00:15'],
 'Never show a midnight slot within the five-minute booking buffer');
assert.equal(availableBookingTimes('2026-11-19',inMinsk('2026-11-19T23:56:00')).length,0);
assert.equal(isValidBookingTime('2026-11-20','00:00',inMinsk('2026-11-19T23:56:00')),false);

window=bookingWindow(now);
const last=window.lastISO;
assert.equal(Date.parse(last+':00+03:00')<=now+90*86400000,true);
assert.equal(isValidBookingTime(last.slice(0,10),last.slice(11),now),true);
const beyond=new Date(Date.parse(last+':00+03:00')+900000+3*3600000).toISOString().slice(0,16);
assert.equal(isValidBookingTime(beyond.slice(0,10),beyond.slice(11),now),false,
 'Reservations outside the server 90-day horizon are not selectable');

const app=await import('node:fs').then(fs=>fs.readFileSync('public/app.js','utf8'));
const selects=await import('node:fs').then(fs=>fs.readFileSync('public/booking-selects.js','utf8'));
const calendar=await import('node:fs').then(fs=>fs.readFileSync('public/booking-date.js','utf8'));
assert.match(app,/enhanceBookingTiming\(form\)/);
assert.match(app,/min="\$\{day\}" max="\$\{window\.lastDate\}"/);
assert.match(app,/isValidBookingTime\(date,time\)/);
assert.match(app,/form\.refreshBookingTiming\?\.\(\)/,'Form must refresh before sending');
assert.match(selects,/booking-options-changed/,'HOF custom time options must be synchronized');
assert.match(calendar,/const current=field\.value\|\|field\.min/,'Custom calendar must reopen on the currently valid month');

console.log('NOVA future Minsk booking slots: past date, past time, midnight, custom selects and 90-day limit passed');
