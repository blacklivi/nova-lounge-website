import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {typography} from '../public/core.js';

const app=readFileSync('public/app.js','utf8');
const css=readFileSync('public/site.css','utf8');
const hof=css.slice(css.indexOf('/* HÓF / editorial nightlife direction.'));
const detail=app.slice(app.indexOf('function hofDetail(){'),app.indexOf('function detail(id){'));
const events=app.slice(app.indexOf('function hofLineup(){'),app.indexOf('function hofDetail(){'));
const orange=readFileSync('public/media/hof-wordmark-orange.svg','utf8');
const black=readFileSync('public/media/hof-wordmark-black.svg','utf8');
const white=readFileSync('public/media/hof-wordmark-white.svg','utf8');
const mark=readFileSync('public/media/hof-mark-black.svg','utf8');

assert.ok(hof.length>3000,'Dedicated compact HOF styles required');
assert.doesNotMatch(hof,/letter-spacing:\s*-\d/i,'No negative tracking in HOF typography');
assert.match(css,/text-wrap:balance/,'Balanced headings');
assert.match(css,/text-wrap:pretty/,'Natural body text wrapping');
assert.doesNotMatch(hof,/transition\s*:\s*all\b/i,'No broad transitions');
assert.match(hof,/@media\(prefers-reduced-motion:reduce\)/,'Reduced-motion support');
assert.equal(typography('Увидимся на Зыбицкой.','ru'),'Увидимся на\u00a0Зыбицкой.');
assert.equal(typography('Мы и в доме, и на улице.','ru'),'Мы и\u00a0в\u00a0доме, и\u00a0на\u00a0улице.');
assert.equal(typography('House of Flow by NOVA','en'),'House of\u00a0Flow by\u00a0NOVA');

assert.match(css,/--hof-ink:#000000;--hof-paper:#ffffff;--hof-amber:#F04902/,'Official brand palette');
for(const [asset,hex] of [[orange,'#F04902'],[black,'#000000'],[white,'#FFFFFF']]){
 assert.ok(asset.includes('viewBox="0 0 519 247"'),'Original vector proportions');
 assert.ok(asset.includes('fill="'+hex+'"'),'Official colour variant');
 assert.ok(asset.includes('182.88 60.24 275.62 60.24'),'Official geometries');
}
assert.match(mark,/fill="#000000"/,'Correct black brand mark for orange background');
assert.equal((detail.match(/<section /g)||[]).length,4,'Four concise sections including the shared events/contact row');
for(const name of ['hof-editorial-hero','hof-editorial-about','hof-compact-events','hof-compact-contact'])assert.ok(detail.includes(name),'Required section: '+name);
assert.doesNotMatch(detail,/hof-about-media|hof-concept-posters|hof-concept-card/,'No long decorative blocks or fake posters');
assert.match(detail,/src="\/media\/hof-wordmark-orange\.svg"/,'Use new official orange logo on black');
assert.match(detail,/class="hof-hero-image"/,'Hero must use real CMS venue imagery');
assert.match(detail,/src="\/media\/hof-mark-black\.svg"/,'Use new brand symbol on orange');
assert.match(app,/src="\/media\/hof-wordmark-black\.svg"/,'Use black official mark on home card');
assert.match(events,/!e\.demo/,'Do not display fictional event posters');
assert.match(events,/\.upcoming\.slice\(0,2\)/,'Keep event list compact');
assert.doesNotMatch(detail,/01 \/ HOUSE OF FLOW|02 \/ AFTER DARK|03 \/ /,'Avoid arbitrary decorative section numbers');
assert.match(css,/\.hof-page \.hof-compact-contact \.hof-outline,\.hof-page \.hof-compact-contact \.hof-primary-cta\{background:#000!important/,'Black CTA must contrast against orange contact section');
assert.match(app,/data-modal="booking" data-venue="zyb"/,'Preserve reservation venue id');
assert.match(app,/if\(id==='zyb'\)return hofDetail\(\)/,'Preserve other venue pages');
assert.match(css,/height:calc\(100svh - var\(--header\) - var\(--hof-booking-dock-height\)\)/,'Mobile cover must clear booking dock');
assert.match(css,/\.venues>\.venue-card\{display:flex;flex-direction:column;align-self:stretch\}/,'Keep aligned venue card dividers');
assert.match(css,/\.hero-copy\{[\s\S]*?padding-bottom:calc\(69px \+ env\(safe-area-inset-bottom,0px\)/,'Do not regress NOVA mobile hero');
console.log('HOF editorial brand and layout checks passed.');
