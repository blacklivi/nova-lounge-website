import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EDITOR_PAGES,EDITOR_FIELDS,EDITOR_BY_KEY,ICON_CHOICES} from '../public/editor-schema.js';
import {localizedValue} from '../public/core.js';

const app=readFileSync('public/app.js','utf8');
const admin=readFileSync('public/admin-pages.js','utf8');
const html=readFileSync('public/admin.html','utf8');
const server=readFileSync('src/index.js','utf8');
const css=readFileSync('public/admin.css','utf8');
const pageIDs=EDITOR_PAGES.map(p=>p.id);
assert.deepEqual(pageIDs,['shared','home','zyb','pob','east'],'All four public pages and shared UI must be editable');
const keys=EDITOR_FIELDS.map(f=>f.key);
assert.equal(new Set(keys).size,keys.length,'Editor keys must be unique');
assert.ok(keys.length>=105,'Page editor should expose granular content fields');
for(const k of ['menu_east','menu_pob','menu_zyb','map_east','instagram_east','home_card_east_url',
 'hof_logo_image','hof_about_mark_image','global_logo_image','home_events_icon','hof_events_button_url','hof_contact_title',
 'venue_east_name','venue_pob_booking_text','venue_east_gallery_visible','home_story_visible']){
 assert.ok(EDITOR_BY_KEY[k],'Missing user-facing editor field: '+k);
}
for(const item of EDITOR_FIELDS){
 assert.ok(['text','textarea','image','link','icon','toggle'].includes(item.type),'Unknown field type '+item.key);
 assert.ok(item.label && item.label.length>2,'Every field requires a readable label');
 if(item.type==='icon')assert.ok(!item.ru||ICON_CHOICES.includes(item.ru),'Unsafe icon default '+item.key);
}
assert.match(app,/isEditorPreview=editorParams.has\('cms_preview'\)/,'Inspector must be opt-in only');
assert.match(app,/window.parent.postMessage\(\{source:'nova-cms-inspector',key\},location.origin\)/,'Inspector messages must be same-origin');
assert.match(app,/data-editor-key="menu_\$\{id\}"/,'Venue menu action must be inspectable');
assert.match(app,/H\('home_card_'\+id\+'_url'/,'Homepage venue destinations must be editable');
assert.match(app,/hrefFor\('menu_'\+id,''\)/,'Menu destinations must support valid internal or external URLs');
assert.match(app,/function validCmsHref\(link\)/,'Public navigation must validate user-controlled destinations');
assert.match(app,/const E=key=>text\(editorValue\(key\)\)/,'Editable text must be escaped');
assert.match(server,/import \{EDITOR_FIELDS,ICON_CHOICES\}/,'Backend must use same whitelist');
assert.match(server,/function validLink\(v\)/,'Backend must validate destinations');
assert.match(server,/const ICON_KEYS =/,'Backend must validate icon choices');
assert.match(server,/Object\.entries\(b\.content_en\|\|\{\}\)/,'Manual EN input must be supported');
assert.match(server,/INSERT INTO site_content_en\(key,value,updated_at\)/,'English content must persist to D1');
assert.match(server,/if\(!await checkAuth\(request,env\)\)/,'Existing admin authentication must be preserved');
assert.match(server,/if\(request.method!=='GET'&&!jsonSecurity\(request\)\)/,'CSRF/origin protection must stay active');
assert.match(html,/id="page-editor-frame"/,'Editor visual preview missing');
assert.match(html,/id="page-editor-select"/,'Page selector missing');
assert.match(html,/id="page-editor-language"/,'Language selector missing');
assert.match(admin,/dirtyCount\(\)/,'Unsaved changes must be tracked');
assert.match(admin,/\['yes','Показывать'\]/,'Optional sections should be controllable');
assert.match(admin,/new URL\(pageUrl\(\),location.origin\)/,'Editor preview must stay same-origin');
assert.match(admin,/event.origin!==location.origin/,'Preview messages must be origin-checked');
assert.match(css,/page-editor-layout/,'Editor must have responsive layout');
// English data is editable independently of Russian even when no RU override exists.
assert.equal(localizedValue('hof_slogan','en',{content:{hof_slogan:'Музыка'},content_en:{hof_slogan:'Music'}},{content:{},content_en:{hof_slogan:'Custom English slogan'}}),'Custom English slogan');
assert.match(server,/function validImage\(v\)/,'Image whitelist is explicit');
assert.match(server,/hof-\(\?:wordmark\|mark\)/,'Brand SVGs must remain available');
assert.match(app,/nova-cms-draft/,'Draft live preview must not write D1');
assert.match(admin,/function sendPreview\(field,value\)/,'Editor must show unsaved draft changes');

// Venue tiles and venue hero photos have separate CMS keys and independent save paths.
for(const id of ['zyb','pob','east']){
 const card=EDITOR_BY_KEY['home_card_'+id+'_image'];
 const hero=EDITOR_BY_KEY['venue_'+id+'_image'];
 assert.ok(card&&hero,'Card and hero image fields must exist for '+id);
 assert.equal(card.type,'image');
 assert.equal(hero.type,'image');
 assert.ok(card.key!==hero.key,'A location tile cannot share its CMS key with the venue hero');
}
assert.match(app,/image\('home_card_'\+id\+'_image'/,'Homepage cards must render their dedicated image key');
assert.match(app,/false,'venue_'\+id\+'_image'\)/,'Existing homepage pictures must be inherited until explicitly changed');
assert.match(admin,/function inheritedCardImage\(field\)/,'Editor should preview inherited images instead of blank placeholders');
assert.match(css,/page-editor-layout/,'Editor layout must remain intact');

console.log('NOVA page CMS registry, link security and editor smoke guards passed');
