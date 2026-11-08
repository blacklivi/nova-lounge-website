import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync('public/app.js','utf8');
const css=readFileSync('public/site.css','utf8');
const ix=css.indexOf('/* NOVA / HÓF design-system v1');
assert.ok(ix>=0,'Shared visual system missing');
const design=css.slice(ix);
assert.match(design,/--nova-grid-gap/,'Global grid gap must be explicit');
assert.match(design,/--gutter:clamp\(32px,3\.5vw,64px\)/,'Desktop page rails should be shared');
assert.match(design,/grid-template-columns:repeat\(12,minmax\(0,1fr\)\)/,'HOF desktop must use site 12-column grid');
assert.match(design,/grid-template-columns:repeat\(8,minmax\(0,1fr\)\)/,'Tablet grid must exist');
assert.match(design,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/,'Mobile grid must exist');
assert.match(design,/\.hof-editorial-about \.hof-about-details\{[\s\S]*?grid-column:4 \/ -1/,'HOF editorial copy should align to a grid track');
assert.match(design,/--nova-button-height:50px/,'Core buttons must share size');
assert.match(design,/\.hof-page \.hof-outline\{[\s\S]*?font-size:15px/,'HOF outlined actions should be readable');
assert.match(design,/\.hof-page \.hof-text-button,[\s\S]*?font-size:15px/,'Text actions should share typographic baseline');
assert.match(design,/\.modal \.field label\{font-size:14px/,'Form labels must be readable');
assert.match(design,/\.modal \.field input,\.modal \.field select/,'Modal inputs must share base geometry');
assert.match(design,/\.modal\[data-theme="hof"\]/,'HOF modal has its own colour theme');
assert.match(design,/\.modal\[data-theme="hof"\] \.booking-consent/,'HÓF booking consent must keep brand styling');
assert.match(design,/\.modal #booking-comment\{/,'Guest booking comments need responsive input styling');
assert.match(design,/height:calc\(100svh - var\(--header\)\)/,'First-screen HOF hero fills available mobile viewport');
assert.match(design,/body\.hof-active\.hof-dock-visible \.mobile-cta/,'Mobile booking dock appears only when triggered');
assert.match(design,/@media\(prefers-reduced-motion:reduce\)/,'Animations respect reduced-motion preference');
assert.match(app,/dialog\.dataset\.theme=\(kind==='booking'\|\|kind==='contacts'\)&&id==='zyb'\?'hof':'nova'/,'Venue theme must not alter booking data');
assert.match(app,/const visible=Boolean\(heroPassed&&!footerEntered\)/,'Dock must stay hidden during the hero and when the entire orange footer enters view');
assert.match(app,/hofDockObserver\.observe\(hero\);[\s\S]*?hofDockObserver\.observe\(contact\);/,'Dock must observe both the hero and orange contact section');
assert.match(app,/dock\.inert=!visible/,'Hidden dock must be removed from keyboard order');
assert.match(app,/window\.addEventListener\('scroll',updateTop,\{passive:true\}\)/,'Mobile dock updates on scroll');
assert.match(app,/window\.addEventListener\('resize',updateTop,\{passive:true\}\)/,'Mobile dock responds to device orientation');
assert.match(app,/data-modal="booking" data-venue="zyb"/,'HOF fixed venue booking ID must be retained');
assert.match(app,/function bookingFormHTML\(requestedVenue\)/,'Guests need a reservation form');
assert.match(app,/fetch\('\/api\/reservations'/,'Guest form must submit to Worker API');
assert.match(app,/if\(!response\.ok\|\|!answer\.ok\)throw new Error/,'Client cannot mark unsaved requests successful');

assert.match(css,/\.hof-page \.hof-compact-contact \.hof-bottom-actions\s*\{\s*display:grid;\s*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,'HOF contact buttons must use equal-width grid tracks');
assert.match(css,/\.hof-page \.hof-compact-contact \.hof-bottom-actions > button\s*\{[^}]*height:100%/s,'Both HOF contact buttons must share a common row height');
assert.match(css,/@media\(max-width:380px\)\s*\{\s*\.hof-page \.hof-compact-contact \.hof-bottom-actions\s*\{\s*grid-template-columns:minmax\(0,1fr\)/,'Narrow phones must stack equal-width buttons');
assert.match(css,/@media\(min-width:601px\) and \(max-width:900px\)/,'Narrow split panels on tablets must stack contact buttons');
assert.match(app,/data-editor-key="hof_contacts_button_text".*data-modal="contacts"/,'Contacts button remains wired and editable');
assert.match(app,/data-editor-key="hof_book_button_text".*data-modal="booking"/,'Booking button remains wired and editable');

assert.match(css,/\.hof-page \.hof-editorial-about \.hof-text-button,\s*\.hof-page \.hof-compact-events \.hof-event-more\s*\{/,'HOF kitchen and events actions must share outline button geometry');
assert.match(css,/border:1px solid currentColor/,'HOF outline actions must have a full rectangular border');
assert.match(css,/\.modal\[data-kind="contacts"\]\[data-theme="hof"\]/,'HOF contacts must have a dedicated brand theme');
assert.match(app,/dialog\.dataset\.kind=kind/,'Modal kind must be available for scoped styles');
assert.match(app,/\(kind==='booking'\|\|kind==='contacts'\)&&id==='zyb'/,'HOF contacts and booking must use the brand theme');
assert.match(app,/class="hof-contact-modal-actions"/,'HOF contacts must render a clear action group');
assert.match(app,/href="tel:\$\{esc\(phone\.replace/,'Contact phone must retain functional tel URL');

// Both secondary outline actions must use one width/height contract, not content-sized widths.
const auxiliaryRules=css.slice(css.indexOf('/* HÓF auxiliary actions:'));
assert.match(auxiliaryRules,/\.hof-page \.hof-editorial-about \.hof-text-button,\s*\.hof-page \.hof-compact-events \.hof-event-more\{\s*box-sizing:border-box;/,'Both HOF auxiliary actions share a selector');
assert.match(auxiliaryRules,/width:min\(100%,260px\);\s*max-width:100%;\s*min-height:52px;\s*height:52px;/,'Shared width and height must be fixed to 260×52 and adapt to narrow viewports');
assert.match(auxiliaryRules,/justify-content:space-between/,'Right-side arrows should align in a common column');
assert.match(auxiliaryRules,/\.hof-page \.hof-compact-events \.hof-event-more\{\s*color:#fff;/,'Dark panel keeps a high-contrast border');

// All HÓF actions use a shared responsive geometry system. Paired actions stay horizontal.
const hofMarkup=app.slice(app.indexOf('function hofLineupLink(){'),app.indexOf('function detail(id){'));
assert.equal((hofMarkup.match(/hof-action/g)||[]).length,6,'All 6 HOF CTAs must share the component class');
const system=css.slice(css.indexOf('/* HÓF ACTION DESIGN SYSTEM v2'));
assert.ok(system.startsWith('/* HÓF ACTION DESIGN SYSTEM v2'),'Shared action-system tokens must exist');
assert.match(system,/--hof-action-width:234px;\s*--hof-action-height:56px/,'Desktop sizes are shared 234×56');
const venueTheme=css.slice(css.indexOf('/* Venue-scoped event calendars'));
assert.match(venueTheme,/--hof-action-width:calc\(50vw - var\(--gutter\) - 4px\)/,'Mobile sizes must adapt to half-width button pairs');
assert.match(venueTheme,/--hof-action-height:64px/,'Mobile buttons must share 64px height');
assert.match(venueTheme,/\.hof-page \.hof-hero-actions,\s*\.hof-page \.hof-compact-contact \.hof-bottom-actions\{\s*display:grid;\s*grid-template-columns:repeat\(2,minmax\(0,var\(--hof-action-width\)\)\)/,'Desktop hero and contacts use two equal columns');
assert.match(venueTheme,/@media\(max-width:600px\)[\s\S]*?\.hof-page \.hof-hero-actions,\s*\.hof-page \.hof-compact-contact \.hof-bottom-actions\{\s*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,'Mobile hero/contact pairs never stack');
assert.match(venueTheme,/\.hof-page \.hof-hero-actions > \.hof-action,\s*\.hof-page \.hof-editorial-about \.hof-action,\s*\.hof-page \.hof-compact-events \.hof-action,\s*\.hof-page \.hof-compact-contact \.hof-bottom-actions > \.hof-action/,'Every CTA shares the same sizing rules');
assert.match(venueTheme,/\.hof-editorial-grid\{grid-template-columns:minmax\(0,1fr\)\}/,'Narrow tablet event/contact panels stack to leave room for two horizontal buttons');


/* The bottom NOVA booking dock must never compete with its in-flow booking
   control on mobile. This applies to the home green section and both venues. */
assert.match(app,/function novaInlineBookingVisible\(dock,header\)/,'Non-HÓF booking visibility must be computed independently');
assert.match(app,/matchMedia\('\(max-width:600px\)'\)\.matches/,'Handoff is restricted to mobile');
assert.match(app,/main \.book-main \.book-cta, main \.detail-actions \[data-modal="booking"\]/,'Observe in-page booking, not every link or whole booking panel');
assert.match(app,/visibleBottom=innerHeight-dock\.offsetHeight/,'Visibility must exclude the dock overlay area');
assert.match(app,/rect\.bottom>header&&rect\.top<visibleBottom/,'Hide only for booking CTA visible between header and dock');
assert.match(app,/document\.body\.classList\.toggle\('nova-inline-booking-visible',inlineVisible\)/,'Mobile dock updates in both scroll directions');
assert.match(app,/dock\.inert=inlineVisible\|\|document\.body\.classList\.contains\('lock'\)/,'Hidden dock must not receive keyboard focus');
assert.match(css,/body:not\(\.hof-active\)\.nova-inline-booking-visible \.mobile-cta\{/,'Only NOVA mobile dock may be suppressed');
assert.match(css,/visibility:hidden;\s*opacity:0;\s*transform:translate3d\(0,110%,0\);\s*pointer-events:none;/,'Hidden dock must be non-interactive and fully off screen');
assert.match(app,/const visible=Boolean\(heroPassed&&!footerEntered\)/,'Keep HÓF hero/footer conditions unchanged');
assert.match(app,/setupHofDockObserver\(\)/,'Keep HÓF dock observer wired');

console.log('NOVA visual system, HOF theme and mobile booking behaviour checks passed');
