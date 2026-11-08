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


const siteCss=readFileSync('public/site.css','utf8');
// The selected homepage variant overlays the official logo and BY NOVA on the CMS photo.
assert.equal(EDITOR_BY_KEY.home_card_hof_title.ru,'ЗЫБИЦКАЯ');
assert.equal(EDITOR_BY_KEY.home_card_hof_title.en,'ZYBITSKAYA');
assert.equal(EDITOR_BY_KEY.home_card_hof_location,undefined,'Removed HÓF subtitle must not remain in the CMS editor');
assert.match(app,/class="venue-hof-overlay-logo" data-editor-key="home_card_hof_logo_image"/,'HÓF SVG logo must be independently editable from the card photo');
assert.match(app,/class="venue-hof-overlay-by" data-editor-key="home_card_hof_by"/,'BY NOVA must be over the photo beside the logo');
assert.match(app,/class="venue-title"\$\{id==='zyb'\?' data-editor-key="home_card_hof_title"/,'Zybitskaya must replace the right-hand logo');
assert.doesNotMatch(app,/homeHofSubtitle|class="venue-hof-location"/,'HÓF card must show only venue title and description');
assert.doesNotMatch(app,/class="venue-hof-image-label"/,'The old top-left photo label must not compete with the wordmark');
assert.match(siteCss,/\.venue-card-hof \.venue-img \.venue-hof-overlay-logo\{/,'Logo needs a dedicated position and sizing');
assert.match(siteCss,/filter:brightness\(0\) invert\(1\)!important/,'Wordmark must always be white');

// Vostok menu: every entry point (venue page and the generic menu selector)
// must resolve to the same editable destination and navigate without an intermediate modal.
assert.equal(EDITOR_BY_KEY.menu_east.ru,'https://menu.nova-vostok.by/menu','Vostok RU menu link must be configured');
assert.equal(EDITOR_BY_KEY.menu_east.en,'https://menu.nova-vostok.by/menu','Vostok EN menu link must be configured');
assert.match(app,/data-modal="menu-location" data-venue="\$\{id\}"/,'Venue page menu uses shared action');
assert.match(app,/data-modal="menu-location" data-venue="\$\{i\}"/,'Home menu picker uses shared action');
assert.match(app,/const url=hrefFor\('menu_'\+id,''\)/,'All menu actions must use editable, validated CMS URLs');
assert.equal(EDITOR_BY_KEY.menu_pob.ru,'https://qr.myata-lounge.by/miata-pobeditelei','Pobediteley RU menu link must be configured');
assert.equal(EDITOR_BY_KEY.menu_pob.en,'https://qr.myata-lounge.by/miata-pobeditelei','Pobediteley EN menu link must be configured');
assert.equal(EDITOR_BY_KEY.menu_zyb.ru,'https://menu.myata-qr.by/menu','HÓF RU menu link must be configured');
assert.equal(EDITOR_BY_KEY.menu_zyb.en,'https://menu.myata-qr.by/menu','HÓF EN menu link must be configured');
assert.match(app,/data-modal="menu-location" data-venue="zyb"/,'HÓF kitchen and bar menu button must use the shared menu handler');
assert.match(app,/window\.location\.assign\(url\)/,'All three venue menus must navigate immediately in the current tab');
assert.doesNotMatch(app,/window\.open\(url,'_blank','noopener,noreferrer'\)/,'No venue menu should open an extra tab');

// HÓF Instagram must be restored everywhere the venue's social links appear.
const defaultsJSON=JSON.parse(readFileSync('public/content-defaults.json','utf8'));
const hofInstagram='https://www.instagram.com/myata.zybitskaya?cplk=MXE4OW5heml3NHQ1OA==';
assert.equal(defaultsJSON.content.instagram_zyb,hofInstagram,'RU Zybitskaya Instagram link must be updated');
assert.equal(defaultsJSON.content_en.instagram_zyb,hofInstagram,'EN Zybitskaya Instagram link must be updated');
assert.equal(EDITOR_BY_KEY.instagram_zyb.type,'link','HÓF Instagram must remain CMS-editable');
assert.match(app,/instagram=safeURL\(value\('instagram_'\+id\)\)/,'Do not suppress HÓF Instagram in general footer');
assert.doesNotMatch(app,/instagram=id==='zyb'\?'':/,'HÓF Instagram must not be hidden');
assert.doesNotMatch(app,/function hofInstagramSocial\(\)|\$\{hofInstagramSocial\(\)\}/,'No duplicate Instagram icon in HÓF orange footer');
assert.match(app,/instagram=hofInstagramURL\(\)/,'HÓF contact modal must resolve the same Instagram URL');
assert.match(app,/instagram\?\x60<a class="hof-contact-action"/,'HÓF contact modal must link to Instagram');
assert.doesNotMatch(siteCss,/\.hof-page \.hof-instagram-link\{/,'Removed orange footer Instagram styles must not linger');

console.log('NOVA page CMS registry, link security and editor smoke guards passed');
