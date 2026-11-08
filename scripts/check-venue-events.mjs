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
assert.ok(seo.includes('export const isPublicPage=p=>')&&seo.includes('hof|pobediteley|vostok'),'Scoped event routes must be valid at the Worker edge');
assert.match(app,/function venueEventsPage\(id\)/,'One themed listing component for all venues');
assert.match(app,/events\.filter\(e=>e\.venue===id\)/,'Scoped venue calendars must include only published events at the selected location');
assert.doesNotMatch(app,/function demoEvents\(/,'Public pages must never generate fictional events');
assert.match(app,/if\(scopedEventVenue\)return venueEventsPage\(scopedEventVenue\)/,'Global and venue pages must share same event source');
assert.match(app,/function hofLineupLink\(\)/,'HOF lineup needs a venue-aware link');
assert.match(app,/url==='\/events'\?'\/events\/hof':url/,'Legacy HOF /events CMS links must redirect to HOF');
assert.match(app,/href="\/events\/hof#event-\$\{esc\(e\.id\)\}"/,'HOF editorial rows must link directly to each HOF event');
assert.match(app,/upcoming\.map\(hofEventRow\)/,'HOF preview must use the venue editorial row component');
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
// After publishing, refresh public lineups instead of preserving a stale empty state.
assert.match(app,/getJSON\('\/api\/events',\{cache:'no-store'\}\)/,'Initial event fetch must bypass browser caching');
assert.match(app,/async function refreshPublishedEvents\(force=false\)/,'Published events must be refreshable in an open tab');
assert.match(app,/window\.addEventListener\('focus',/,'Switching back from the admin must refresh events');
assert.match(app,/document\.addEventListener\('visibilitychange',/,'Returning to the tab must refresh events');
assert.match(app,/window\.addEventListener\('pageshow',e=>\{if\(e\.persisted\)/,'BFCache restore must refresh events');
assert.match(app,/BroadcastChannel\('nova-events-changed'\)/,'Public tabs must subscribe to admin publish notification');
assert.match(admin,/notifyEventChanged\(\);resetEvent\(\);await loadEvents\(\)/,'After every save/delete the admin should notify open site tabs');
assert.match(admin,/channel\.postMessage\('changed'\)/,'Admin publishes only an invalidation signal');
assert.match(app,/if\(changed\)patchEventSections\(\)/,'Skip UI replacements for unchanged API data');
assert.match(app,/if\(selected==='pob'\|\|selected==='east'\)/,'Pobediteley and Vostok previews must update too');

assert.match(app,/const EVENTS_POLL_INTERVAL=30000/,'Event updates must be checked automatically across devices');
assert.match(app,/window\.setInterval\(\(\)=>\{[\s\S]*?refreshPublishedEvents\(\)/,'An open visible tab must not rely exclusively on admin notifications');
assert.match(app,/window\.addEventListener\('online',\(\)=>void refreshPublishedEvents\(true\)\)/,'Event refresh must recover after network reconnection');
assert.match(app,/const wasHidden=section\.style\.display==='none'/,'Homepage lineup must detect a previously hidden empty section');
assert.match(app,/section\.style\.display=visible\?'':'none'/,'Homepage must reveal the section when upcoming events arrive');
assert.match(app,/if\(visible&&wasHidden\)\{[\s\S]*?el\.classList\.remove\('nova-reveal'\)/,'Async event cards must not remain invisible due to scroll animation');
assert.match(admin,/live=await request\('\/api\/events'\)/,'Admin must verify publication using public API');
assert.match(admin,/Событие сохранено как черновик/,'Drafts must not be falsely reported as published');
assert.match(admin,/ОПУБЛИКОВАНО · АРХИВ/,'Already-finished events need an archive label');

assert.match(app,/const current=app\.querySelector\('\.venue-events-teaser'\)/,'Venue preview must be patched without full page rerender');
assert.match(app,/if\(isEvents\)\{[\s\S]*?template\.innerHTML=eventsPage\(\)/,'Venue and global event pages must update their cards and counters');
assert.match(app,/eventsFailed&&!eventsLoaded\?t\('Не удалось загрузить афишу/,'Load failures must not masquerade as an empty venue calendar');
assert.match(backend,/const noStore=\{ 'Cache-Control':'no-store'/,'Public API response must not be cached');

console.log('Scoped HOF/NOVA events, CMS linkage, SEO, and shared data checks passed');
