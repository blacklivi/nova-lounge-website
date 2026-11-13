import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const guest=readFileSync('public/app.js','utf8');
const guestCSS=readFileSync('public/site.css','utf8');
const selects=readFileSync('public/booking-selects.js','utf8');
const home=readFileSync('public/index.html','utf8');
const events=readFileSync('public/events.html','utf8');
const html=readFileSync('public/reserved.html','utf8');
const css=readFileSync('public/reserved.css','utf8');
const staff=readFileSync('public/reserved.js','utf8');
assert.match(guest,/function bookingFormHTML\(requestedVenue\)/,'Original guest booking form must be present');
assert.match(guest,/enhanceBookingSelects\(form,language,\{forceCustom:id==='zyb'\}\)/,'HÓF guest-specific chooser must be retained');
assert.match(guest,/form\.addEventListener\('submit',sendBooking\)/,'Guest form submit must remain connected');
assert.match(guest,/fetch\('\/api\/reservations'/,'Guest submit must still write via the existing Worker API');
assert.doesNotMatch(guest,/enhanceMobileBooking|booking-form-scroll|booking-section-title booking-contact-title|booking-guest-stepper|booking-submit-bar/,'Guest v2/v3 UI must be fully reverted');
assert.doesNotMatch(guestCSS,/NOVA \/ booking v3|Mobile reservation redesign/,'No guest full-screen or bottom-sheet overrides remain');
assert.doesNotMatch(selects,/if\(matchMedia\('\(max-width:600px\)'\)\.matches\) return/,'Restore original HÓF custom mobile chooser behavior');
for(const page of [home,events]){
 assert.match(page,/site\.css\?v=(?:guest-booking-restored-20261113|by-phone-mask-20261114)/,'Old CSS cache must be replaced');
 assert.match(page,/app\.js\?v=(?:guest-booking-restored-20261113|by-phone-mask-20261114)/,'Old JS cache must be replaced');
}
for(const id of ['reservation-detail-dialog','detail-close','detail-venue','detail-date','detail-time','detail-title','detail-guests','detail-phone','detail-note-wrap','detail-status','detail-status-select','detail-save','detail-feedback']){
 assert.ok(html.includes('id="'+id+'"'),'Staff dialog element missing: '+id);
}
assert.match(html,/class="reservation-list"/,'Staff list is still present');
assert.match(css,/\.reservation-mobile\{display:none\}/,'New staff cards must not change desktop');
assert.match(css,/@media\(max-width:600px\)\{[\s\S]*\.reservation-mobile\{display:block/,'Compact staff booking cards appear on mobile only');
assert.match(css,/\.reservation-detail-dialog::backdrop/,'Private detail dialog must obscure underlying page');
assert.match(css,/safe-area-inset-bottom/,'Detail save footer must respect mobile safe area');
assert.match(staff,/function openReservationDetails\(r,card\)/,'Staff booking details must open in a dialog');
assert.match(staff,/open\.addEventListener\('click',\(\)=>openReservationDetails\(r,card\)\)/,'Mobile card button must open the correct reservation');
assert.match(staff,/detailDialog\.showModal\(\)/,'Booking details use native dialog focus trapping');
assert.match(staff,/if\(detailDialog\.open\)detailDialog\.close\(\)/,'Logging out must close and clear private detail dialog');
assert.match(staff,/identity\.role!=='viewer'/,'Viewer must have no editing actions');
assert.match(staff,/if\(!activeDetail\|\|!identity\|\|identity\.role==='viewer'\)return/,'Mobile save action must reject viewer edits');
assert.match(staff,/api\('\/api\/reserved\/reservations\/'\+encodeURIComponent\(r\.id\),'PATCH',\{status:next\}\)/,'Changes must use existing authenticated Worker status API');
assert.match(staff,/refreshReservationStatus\(r,card\)/,'Card and dialog status must stay synchronized');
assert.match(staff,/r\.guest_name\)/,'All personal data still comes from the authorized reservation response');
assert.match(staff,/phone\.replace\(\/\[\^\+\\d\]\/g,''\)/,'Phone links must preserve digits and strip unsafe characters');
assert.doesNotMatch(staff,/innerHTML\s*=.*guest_name/,'Guest data must not be interpolated into HTML');
console.log('Guest booking restore and protected staff mobile booking UI checks passed');
