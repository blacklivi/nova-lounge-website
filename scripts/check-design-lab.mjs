// Static build checks for the client-safe NOVA concept.
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const html=readFileSync('public/concept.html','utf8');
const css=readFileSync('public/concept.css','utf8');
const js=readFileSync('public/concept.js','utf8');
const worker=readFileSync('src/design-lab.js','utf8');
const cfg=JSON.parse(readFileSync('wrangler.design-lab.jsonc','utf8'));
const sections=['cover','story','spaces','moments','mobile'];
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate ID');
for(const id of sections)assert.ok(ids.includes(id),'Missing concept section: '+id);
for(const href of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(href[1]),'Unresolved anchor '+href[1]);
for(const [,src] of html.matchAll(/(?:src|href)="(\/(?:media|fonts)\/[^"]+)"/g))
  assert.ok(existsSync(resolve('public',src.slice(1))),'Missing asset: '+src);
for(const file of ['concept.css','concept.js']) assert.ok(existsSync(resolve('public',file)),'Missing '+file);
assert.match(html,/name="robots" content="noindex,nofollow"/);
assert.match(html,/КОНЦЕПЦИЯ АФИШИ/);
assert.match(html,/class="browser-stage reveal"/);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.match(css,/browser-stage\{overflow-x:auto/);
assert.match(js,/IntersectionObserver/);
assert.equal(cfg.name,'nova-design-lab');
assert.equal(cfg.main,'./src/design-lab.js');
assert.equal(cfg.preview_urls,false);
assert.ok(!('d1_databases' in cfg||'r2_buckets' in cfg||'vars' in cfg),'Concept must have no database or secrets');
assert.match(worker,/Read-only preview/);
assert.match(worker,/publicPage/);
assert.match(worker,/isPublicPage/);
assert.match(worker,/api\/content/);
assert.match(worker,/api\/events/);
assert.ok(!worker.includes('env.DB')&&!worker.includes('env.MEDIA'),'Live data bindings cannot be used in lab worker');
for(const p of ['public/index.html','public/events.html','public/site.css','public/app.js','public/design-lab.css','public/design-lab-ui.js'])assert.ok(existsSync(p),'Missing original website file: '+p);
assert.ok(!/fetch\(['"]\/api\//.test(html+'\n'+js),'Concept must not contact APIs');
console.log('NOVA Design Lab: static safety & asset checks passed.');

assert.match(readFileSync('public/index.html','utf8'),/data-design-lab="true"/);
assert.match(readFileSync('public/events.html','utf8'),/data-design-lab="true"/);
assert.match(readFileSync('public/app.js','utf8'),/eventsLoaded=true;[\s\S]*?render\(\)/);
assert.match(readFileSync('public/design-lab-ui.js','utf8'),/IntersectionObserver/);
assert.match(readFileSync('public/design-lab.css','utf8'),/prefers-reduced-motion/);


// Editorial v2 regression guard: one coherent homepage, three functioning routes.
const homeSource=readFileSync('public/app.js','utf8');
const editorialCSS=readFileSync('public/design-lab.css','utf8');
assert.match(homeSource,/hero-editorial/);
assert.match(homeSource,/hero-space-link/);
assert.match(homeSource,/venue-card-editorial-/);
assert.match(homeSource,/hero-editorial-book/);
assert.match(homeSource,/data-modal='booking'/);
assert.match(homeSource,/data-place='\$\{id\}'/);
assert.match(homeSource,/data-content='hero_tagline'/);
assert.match(homeSource,/data-content='venue_\$\{id\}_subtitle'/);
assert.match(editorialCSS,/\.venues-editorial/);
assert.match(editorialCSS,/\.venue-card-editorial-pob/);
assert.match(editorialCSS,/\.venue-card-editorial-east/);
assert.match(editorialCSS,/\.hero-editorial \.hero-photo img/);


// Sprint 2: retain CMS translation hooks, real event links, and original modal routes.
const editorial2=readFileSync('public/app.js','utf8');
const editorial2css=readFileSync('public/design-lab.css','utf8');
for(const token of [
  "story story-editorial",
  "home-events home-events-editorial",
  "book-strip book-strip-editorial",
  "data-content='story_title'",
  "data-content='story_description'",
  "data-content='booking_title'",
  "data-modal='menu'",
  "data-modal='booking'",
  "splitEvents(displayEvents()).upcoming.slice(0,2)",
  "eventCard(event,true)"
]) assert.ok(editorial2.includes(token),'Missing sprint 2 hook: '+token);
for(const token of [
  ".story-editorial",
  ".home-events-gallery",
  ".book-strip-editorial",
  "@media(prefers-reduced-motion:reduce)"
]) assert.ok(editorial2css.includes(token),'Missing sprint 2 style: '+token);


// Full events page remains present and follows the new editorial design system.
const eventDesignCSS=readFileSync('public/design-lab.css','utf8');
const eventPageSource=readFileSync('public/app.js','utf8');
for(const token of ['.events-intro','.events-list','.events-section.archive'])
  assert.ok(eventDesignCSS.includes(token),'Missing events page editorial styling: '+token);
assert.match(eventPageSource,/function eventsPage\(\)/);
assert.match(eventPageSource,/eventCard\(e\)/);
assert.match(eventPageSource,/events-demo-notice/);

// Sprint 3: venue-page routes, CMS keys, modal actions, galleries.
const dSource=readFileSync('public/app.js','utf8');
const dCSS=readFileSync('public/design-lab.css','utf8');
for(const token of ["lab-detail-${id}","venue_${id}_subtitle","venue_${id}_desc","venue_${id}_second","venue_${id}_features","address_${id}","data-modal='menu-location'","data-modal='contacts'","data-modal='booking'","data-place='${other}'"])assert.ok(dSource.includes(token),'Missing detail view hook: '+token);
for(const token of ['.lab-detail-intro','.lab-detail-photo','.lab-detail-action-strip','.lab-detail-story','.lab-detail-next','.lab-detail-pob','.lab-detail-east'])assert.ok(dCSS.includes(token),'Missing venue style: '+token);

 
// Sprint 3 content audit: two gallery images per venue must be distinct,
// included in the repository, and preserve the same source in RU / EN.
const imageDefaults=JSON.parse(readFileSync('public/content-defaults.json','utf8'));
for(const id of ['zyb','pob','east']){
  for(const index of [1,2]){
    const key='gallery_'+id+'_'+index+'_image';
    const ru=imageDefaults.content[key],en=imageDefaults.content_en[key];
    assert.equal(ru,en,'Image differs across languages: '+key);
    assert.ok(typeof ru==='string'&&ru.startsWith('/media/'),'Missing media path: '+key);
    assert.ok(existsSync(resolve('public',ru.slice(1))),'Missing referenced gallery image: '+ru);
  }
  assert.notEqual(imageDefaults.content['gallery_'+id+'_1_image'],imageDefaults.content['gallery_'+id+'_2_image'],'Duplicate image in gallery '+id);
}


// Compact editorial density applies to every public chapter, only in the lab.
const densityCSS=readFileSync('public/design-lab.css','utf8');
assert.match(densityCSS,/COMPACT EDITORIAL SYSTEM/);
for(const target of [
  '.hero-editorial',
  '.venues-editorial',
  '.venue-card-editorial',
  '.story-editorial',
  '.home-events-editorial',
  '.book-strip-editorial',
  '.events-page',
  '.lab-detail-intro',
  '.lab-detail-photo',
  '.lab-detail-story',
  '.lab-detail-next'
])assert.ok(densityCSS.includes(target),'Density missing: '+target);
assert.match(densityCSS,/body\[data-design-lab=true\]/);
assert.match(densityCSS,/prefers-reduced-motion:reduce/);

// Full-screen cover, first-paint gating and editorial labels.
const revisedApp=readFileSync('public/app.js','utf8');
const revisedCSS=readFileSync('public/design-lab.css','utf8');
const revisedHTML=readFileSync('public/index.html','utf8');
const revisedUI=readFileSync('public/design-lab-ui.js','utf8');
assert.match(revisedHTML,/lab-hero-preparing/);
assert.match(revisedCSS,/height:100svh/);
assert.match(revisedCSS,/novaHeroWord/);
assert.match(revisedCSS,/#seo-fallback\{display:none/);
assert.match(revisedApp,/hero-title-mask/);
assert.match(revisedUI,/lab-hero-ready/);
assert.match(revisedUI,/document\.fonts\.load/);
const visibleViews=revisedApp.slice(revisedApp.indexOf('function home(){'),revisedApp.indexOf('function eventsPage(){'));
for(const token of ['01—03','04 / NOVA JOURNAL','05 / NOVA EVENTS','06 / NOVA RESERVATIONS','07 / NOVA MINSK','hero-space-number'])assert.ok(!visibleViews.includes(token),'Visible number remains: '+token);

// Do not mistake server SEO fallback for the hydrated homepage.
assert.match(readFileSync('public/index.html','utf8'),/main:not\(#seo-fallback\)/);
assert.match(readFileSync('public/design-lab-ui.js','utf8'),/main:not\(#seo-fallback\)/);


// Keep the final 'A' fully visible: negative letter spacing causes right overhang.
const titleInkCSS=readFileSync('public/design-lab.css','utf8');
assert.match(titleInkCSS,/Hero title ink safety/);
assert.match(titleInkCSS,/padding-inline-end:\.16em/);
assert.match(titleInkCSS,/margin-inline-end:-\.16em/);
assert.match(titleInkCSS,/padding-bottom:\.075em/);
