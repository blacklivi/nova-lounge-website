import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync('public/app.js','utf8');
const css=readFileSync('public/site.css','utf8');
const selects=readFileSync('public/booking-selects.js','utf8');
const home=readFileSync('public/index.html','utf8');
const events=readFileSync('public/events.html','utf8');
const extract=app.slice(app.indexOf('function bookingFormHTML('),app.indexOf('async function sendBooking('));
assert.ok(extract.length>1000,'Booking form must still exist');
for(const field of ['venue','date','time','guests','name','phone','comment','consent','website']){
 assert.ok(extract.includes('name="'+field+'"'),'Reservation payload field must remain: '+field);
}
assert.match(extract,/class="booking-form-scroll"/,'Mobile form has a separate scrolling region');
assert.match(extract,/class="booking-submit-bar"/,'Submit button stays in a footer region');
assert.match(extract,/class="booking-comment-details"/,'Optional note is collapsible on phones');
assert.match(extract,/type="submit"/,'Form must still be submittable');
assert.match(extract,/required><span>/,'Privacy consent remains required');
assert.match(app,/commentDetails\.open=true/,'Desktop must show the comment field without an extra action');
assert.match(app,/dialog\.classList\.remove\('booking-complete'\)/,'Reopened bookings restore the form layout');
assert.match(app,/dialog'\)\?\.classList\.add\('booking-complete'\)/,'Success state fits the sheet');
assert.match(app,/fetch\('\/api\/reservations'/,'Submission still reaches real booking API');
assert.match(selects,/if\(matchMedia\('\(max-width:600px\)'\)\.matches\) return/,'Native mobile selects replace obstructive touch menus');
assert.match(css,/@media \(max-width:600px\)\{[\s\S]*\.modal\[data-kind="booking"\]\.booking-complete/,'All changes are scoped to mobile booking dialogs');
assert.match(css,/\.modal\[data-kind="booking"\] \.booking-form-scroll\{[\s\S]*overflow-y:auto/,'Fields scroll separately');
assert.match(css,/\.modal\[data-kind="booking"\] \.booking-submit-bar\{[\s\S]*flex:none/,'Footer must remain visible');
assert.match(css,/safe-area-inset-bottom/,'iOS home indicator area must be padded');
assert.match(css,/\.modal\[data-kind="booking"\] \.booking-comment-details > summary/,'Expandable notes accessible on touch');
for(const html of [home,events]){
 assert.match(html,/site\.css\?v=mobile-booking-sheet-20261113/,'Fresh CSS for existing tabs');
 assert.match(html,/app\.js\?v=mobile-booking-sheet-20261113/,'Fresh app script for existing tabs');
}
console.log('Mobile booking sheet structure, submission, and responsive guard checks passed');
