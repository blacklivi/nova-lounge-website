import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {typography} from '../public/core.js';

// NOVA-specific typography regression guard informed by design-lab Hallmark audits.
// Not a full Hallmark certification or the upstream rendered audit.
const app=readFileSync('public/app.js','utf8');
const css=readFileSync('public/site.css','utf8');
const hof=css.slice(css.indexOf('/* Experiment only: HOF by NOVA'));
assert.ok(hof.length>1000,'HOF styles should exist');
assert.doesNotMatch(hof,/letter-spacing:\s*-\d/i,'No negative tracking on HOF');
assert.match(hof,/text-wrap:balance/,'Headings should balance');
assert.match(hof,/text-wrap:pretty/,'Long body text should wrap naturally');
assert.match(hof,/@media\(max-width:400px\)/,'320px text treatment required');
assert.match(hof,/@media\(prefers-reduced-motion:reduce\)/,'Reduced-motion safeguard required');
assert.doesNotMatch(hof,/transition\s*:\s*all\b/i,'Never animate all properties');
assert.match(app,/hofDetail\(\)/,'HOF separate venue layout required');
assert.match(app,/id==='zyb'|'zyb'\?/, 'Keep HOF tied to the existing venue identity');
assert.doesNotMatch(app,/THE CONCEPT \/ 001|HOF \/ 001|HOF \/ 002/,'Avoid placeholder chapter numbers');
assert.doesNotMatch(app,/Свой ритм\.\\nСвои люди\.|Увидимся\\nна Зыбицкой/,'Avoid forced editorial line breaks');
assert.equal(typography('Увидимся на Зыбицкой.','ru'),'Увидимся на\u00a0Зыбицкой.');
assert.equal(typography('Мы и в доме, и на улице.','ru'),'Мы и\u00a0в\u00a0доме, и\u00a0на\u00a0улице.');
assert.equal(typography('House of Flow by NOVA','en'),'House of\u00a0Flow by\u00a0NOVA');

// Layout regressions: mobile actions must clear fixed booking dock, and the
// three desktop venue card dividers must share a single baseline.
assert.match(css,/--hof-booking-dock-height:calc\(69px \+ env\(safe-area-inset-bottom,0px\)\)/,
  'Account for the fixed booking dock including device safe area');
assert.match(css,/height:calc\(100svh - var\(--header\) - var\(--hof-booking-dock-height\)\)/,
  'HOF cover must fit the visible space above the booking dock');
assert.match(css,/\.venues>\.venue-card\{display:flex;flex-direction:column;align-self:stretch\}/,
  'Desktop venue cards must stretch to the shared baseline');
assert.match(css,/\.venues>\.venue-card \.venue-foot\{flex:1;display:flex;flex-direction:column\}/,
  'Venue footers must share bottom border position');

console.log('NOVA HOF typography checks passed (Hallmark-adapted subset, not official full audit).');
