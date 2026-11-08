import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EDITOR_BY_KEY} from '../public/editor-schema.js';

const app=readFileSync('public/app.js','utf8');
const css=readFileSync('public/site.css','utf8');
const content=JSON.parse(readFileSync('public/content-defaults.json','utf8'));

// A released guest website cannot create and display invented events.
assert.doesNotMatch(app,/function demoEvents\(|demo-after-dark|DEMO · NOT A REAL EVENT|ПРИМЕР АФИШИ|SAMPLE POSTER|ДЕМОНСТРАЦИОННАЯ АФИША/,'No fictional event examples on guest pages');
assert.match(app,/function displayEvents\(\)\{return events;\}/,'Only data from the published events API is displayed');
assert.match(app,/shown\('home_events_visible'\)&&next/,'Do not show an empty events teaser on the homepage');
assert.match(app,/id!=='archive'\|\|list\.length/,'Empty global archive must not appear');
assert.match(app,/key!=='archive'\|\|list\.length/,'Empty venue archives must not appear');

// Live reservations must only show success after a successful API response.
assert.match(app,/function bookingFormHTML\(requestedVenue\)/,'Public form must exist');
assert.match(app,/async function sendBooking\(e\)/,'Public form needs submit handler');
assert.match(app,/fetch\('\/api\/reservations'/,'Submissions must go to the real reservation API');
assert.match(app,/if\(!response\.ok\|\|!answer\.ok\)throw new Error/,'No false success when persistence fails');
assert.match(app,/data-close/,'Confirmation must be dismissible');
assert.doesNotMatch(app,/Это только предварительный просмотр|Demo mode/,'No demo booking messages');

assert.equal(EDITOR_BY_KEY.footer_right.ru,'Три пространства. Один ритм.');
assert.equal(EDITOR_BY_KEY.footer_right.en,'Three spaces. One rhythm.');
assert.ok(!Object.hasOwn(content.content,'media_note'),'Sample photo captions must be removed in RU');
assert.ok(!Object.hasOwn(content.content_en,'media_note'),'Sample photo captions must be removed in EN');
assert.doesNotMatch(app,/data-content="media_note"|class="image-note"/,'No sample image note should be displayed');
assert.doesNotMatch(css,/\.demo-note|\.events-demo-notice|\.event-demo-tag/,'Retired demo styles must be removed');

console.log('Guest-facing launch content and phone booking checks passed');
