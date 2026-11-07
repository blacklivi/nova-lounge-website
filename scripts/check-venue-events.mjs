import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync('public/app.js','utf8');
const backend=readFileSync('src/index.js','utf8');
const seo=readFileSync('src/seo.js','utf8');
const schema=readFileSync('public/editor-schema.js','utf8');
const admin=readFileSync('public/admin.js','utf8');
const html=readFileSync('public/admin.html','utf8');
const css=readFileSync('public/site.css','utf8');

for(const [slug,id] of [['hof','zyb'],['pobediteley','pob'],['vostok','east']]){
 assert.ok(app.includes(slug+':\''+id+'\''),'Scoped route must resolve: '+slug);
 assert.ok(app.includes('/events/'+slug),'Venue deep-link should exist: '+slug);
 assert.ok(seo.includes(slug),'SEO direct route should exist: '+slug);
 assert.ok(html.includes('value="'+id+'"'),'Admin event venue option must exist: '+id);
}
assert.match(seo,/isPublicPage=p=>[\s\S]*?events\\\/\\\(\\\?:hof\|pobediteley\|vostok/,'Scoped event routes must be valid at the Worker edge');
assert.match(app,/function venueEventsPage\(id\)/,'One themed listing component for all venues');
assert.match(app,/events\.filter\(e=>e\.venue===id&&!e\.demo\)/,'Scoped venue calendars must exclude all other venues and demos');
assert.match(app,/if\(scopedEventVenue\)return venueEventsPage\(scopedEventVenue\)/,'Global and venue pages must share same event source');
assert.match(app,/function hofLineupLink\(\)/,'HOF lineup needs a venue-aware link');
assert.match(app,/url==='\/events'\?'\/events\/hof':url/,'Legacy HOF /events CMS links must redirect to HOF');
assert.match(app,/eventCard\(e,true,'\/events\/hof'\)/,'HOF preview cards must lead to HOF events');
assert.match(app,/venueEventsPreview\(id\)/,'Pobediteley/Vostok need direct events previews');
assert.match(app,/function displayEvents\(\)/,'Global events calendar must remain present');
assert.match(backend,/if\(path==='\/api\/events'&&request.method==='GET'\)/,'No duplicate API events source');
assert.match(admin,/function renderEventList\(\)/,'Admin must filter event list by venue');
assert.match(admin,/ev\.venue===scope/,'Admin filter must preserve venue key');
assert.match(admin,/venueEventPaths=\{/,'Admin must offer venue preview links');
assert.match(schema,/f\('hof_events_more_url','Адрес афиши HÓF','link','\/events\/hof'\)/,'CMS default HOF event link must be venue scoped');
assert.match(css,/\.hof-events-page\{background:#12110f;color:#fff/,'HOF event listing must have dedicated dark theme');
assert.match(css,/\.hof-events-page \.event-location\{color:#F04902/,'HOF event location styling must use brand orange');
assert.match(css,/\.venue-events-page \.events-list/,'Scoped listings must have own event card layout');
console.log('Scoped HOF/NOVA events, CMS linkage, SEO, and shared data checks passed');
