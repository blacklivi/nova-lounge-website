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
assert.match(design,/\.modal\[data-theme="hof"\] \.form-submit\{/,'HOF submit uses a brand-colour primary action');
assert.match(design,/\.modal \ .demo-note|\.modal \.demo-note/,'Demo warning must remain readable');
assert.match(design,/height:calc\(100svh - var\(--header\)\)/,'First-screen HOF hero fills available mobile viewport');
assert.match(design,/body\.hof-active\.hof-dock-visible \.mobile-cta/,'Mobile booking dock appears only when triggered');
assert.match(design,/@media\(prefers-reduced-motion:reduce\)/,'Animations respect reduced-motion preference');
assert.match(app,/dialog\.dataset\.theme=\(kind==='booking'\|\|kind==='contacts'\)&&id==='zyb'\?'hof':'nova'/,'Venue theme must not alter booking data');
assert.match(app,/const visible=Boolean\(hero&&hero\.getBoundingClientRect\(\)\.bottom<=header\+4&&!contactVisible\)/,'Dock must not duplicate hero or contact booking CTA');
assert.match(app,/dock\.inert=!visible/,'Hidden dock must be removed from keyboard order');
assert.match(app,/window\.addEventListener\('scroll',updateTop,\{passive:true\}\)/,'Mobile dock updates on scroll');
assert.match(app,/window\.addEventListener\('resize',updateTop,\{passive:true\}\)/,'Mobile dock responds to device orientation');
assert.match(app,/data-modal="booking" data-venue="zyb"/,'HOF fixed venue booking ID must be retained');
assert.match(app,/enhanceBookingDate/,'Existing date component must remain wired');
assert.match(app,/enhanceBookingSelects/,'Existing select component must remain wired');
assert.match(app,/function reviewBooking\(e\)/,'Booking review flow must not be removed');

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

// The complete HÓF action set is governed by one geometry token per viewport.
const hofMarkup=app.slice(app.indexOf('function hofLineup(){'),app.indexOf('function detail(id){'));
assert.equal((hofMarkup.match(/hof-action/g)||[]).length,6,'Hero, menu, events, and contacts must share one action class (6 total)');
const system=css.slice(css.indexOf('/* HÓF ACTION DESIGN SYSTEM v2'));
assert.ok(system.startsWith('/* HÓF ACTION DESIGN SYSTEM v2'),'Responsive action system must exist');
assert.match(system,/--hof-action-width:234px;\s*--hof-action-height:56px;/,'Desktop actions need uniform 234×56 sizing');
assert.match(system,/@media\(max-width:600px\)\s*\{\s*body\.hof-active\{\s*--hof-action-width:260px;\s*--hof-action-height:56px;/,'Mobile actions need uniform 260×56 sizing');
assert.match(system,/\.hof-page \.hof-hero-actions > \.hof-action,\s*\.hof-page \.hof-editorial-about \.hof-action,\s*\.hof-page \.hof-compact-events \.hof-action,\s*\.hof-page \.hof-compact-contact \.hof-bottom-actions > \.hof-action/,'All four HÓF CTA contexts must use exactly the same geometry rule');
assert.match(system,/height:var\(--hof-action-height\);\s*min-height:var\(--hof-action-height\);\s*max-height:var\(--hof-action-height\)/,'Height may not vary by content or parent');
assert.match(system,/\.hof-page \.hof-hero-actions\{\s*display:grid;/,'Hero actions must have a predictable grid');
assert.match(system,/\.hof-page \.hof-compact-contact \.hof-bottom-actions\{\s*display:grid;/,'Contacts must have a predictable grid');
assert.match(system,/\.hof-page \.hof-hero-actions\{\s*display:grid;\s*grid-template-columns:var\(--hof-action-width\)/,'Phone hero CTAs must stack instead of shrinking to half width');
assert.match(system,/body\.hof-active \.mobile-cta \.button\{/,'Mobile sticky reservation action must follow same geometry');
assert.match(system,/body\.hof-active \.header-book\{/,'Desktop header reservation action must follow same geometry');
assert.match(system,/@media\(max-width:600px\) and \(max-height:690px\)/,'Short phone poster needs a fit adjustment');

console.log('NOVA visual system, HOF theme and mobile booking behaviour checks passed');
