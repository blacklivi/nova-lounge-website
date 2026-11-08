import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCrop,serializeCrop,cropPattern,isPhotoKey,cropPresets,cropCSS} from '../public/photo-crop.js';
import {PHOTO_CROP_FIELDS,EDITOR_BY_KEY} from '../public/editor-schema.js';

const read=path=>readFileSync(path,'utf8');
const site=read('public/app.js'),css=read('public/site.css');
const pages=read('public/admin-pages.js'),eventsAdmin=read('public/admin.js'),ui=read('public/photo-crop-editor.js');
const adminHTML=read('public/admin.html'),adminCSS=read('public/admin.css');
const api=read('src/index.js'),seo=read('src/seo.js'),migration=read('migrations/0004_event_image_crop.sql');

assert.deepEqual(parseCrop('50,50,100'),{x:50,y:50,zoom:100});
assert.deepEqual(parseCrop('99,12,245'),{x:99,y:12,zoom:245});
assert.deepEqual(parseCrop('x,50,100'),{x:50,y:50,zoom:100});
assert.deepEqual(parseCrop('101,50,100'),{x:50,y:50,zoom:100});
assert.equal(serializeCrop({x:-10,y:200,zoom:300}),'0,100,250');
assert.equal(cropPattern.test('50,50,100'),true);
assert.equal(cropPattern.test('50,50,500'),false);
assert.ok(cropCSS('30,70,130').includes('--photo-zoom:1.30'));
assert.equal(isPhotoKey('gallery_pob_1_image'),true);
assert.equal(isPhotoKey('home_card_zyb_image'),true);
assert.equal(isPhotoKey('hof_contact_mark_image'),false,'Brand logos must never be cropped');
assert.equal(isPhotoKey('global_logo_image'),false,'Brand logos must remain intact');
assert.ok(cropPresets('event').length>=3,'Event preview should offer homepage, full listing and HÓF frame');
assert.ok(cropPresets('hero_image').length>=2,'Hero should preview mobile and desktop ratios');
assert.ok(PHOTO_CROP_FIELDS.length>=12,'Every photographic CMS field must have persisted crop metadata');
for(const f of PHOTO_CROP_FIELDS){
 assert.equal(f.type,'crop');assert.ok(EDITOR_BY_KEY[f.key]);assert.equal(f.ru,'50,50,100');
}
assert.match(api,/const CROP_KEYS=new Set\(PHOTO_CROP_FIELDS\.map/,'Server needs a strict allowlist for crop fields');
assert.match(api,/!k\.endsWith\('_crop'\)/,'Gallery crop settings must never be validated as image URLs');
assert.match(api,/cropPattern\.test\(v\)/,'Server must validate image crops');
assert.match(api,/image_crop=b\.image_crop===undefined/,'Event crop must default safely');
assert.match(api,/image_url,image_crop,published/,'Events must persist crop metadata');
assert.match(api,/SELECT id,title,description,title_en,description_en,starts_at,venue,image_url,image_crop/,'Public events need crop metadata');
assert.match(seo,/image_url,image_crop FROM events/,'SSR event snapshot must contain crop metadata');
assert.match(migration,/ALTER TABLE events ADD COLUMN image_crop/,'Existing event rows require forward-compatible migration');
assert.match(site,/class="event-media"><img class="cms-photo"/,'Event media must have an overflow-clipping frame');
assert.match(css,/\.home-events \.event-card \.event-media\{aspect-ratio:2\/3\}/,'Home poster should use accurate portrait crop and avoid blank gray space');
assert.match(css,/\.event-card \.event-media img\.cms-photo\{[\s\S]*?object-fit:cover/,'Poster image must fill actual photo frame');
assert.match(css,/img\.cms-photo\[data-image\]/,'Site photos must use saved focal point');
assert.match(site,/if\(type==='crop'\)/,'Site preview should apply crop drafts immediately');
assert.match(pages,/openPhotoCropEditor\(/,'Pages editor must open visual crop editor');
assert.match(pages,/remember\(cropField,changed,'ru'\)/,'Saved crop must be staged for publication');
assert.match(pages,/key\.endsWith\('_crop'\)/,'Preview must replay crop drafts on iframe reload');
assert.match(pages,/openPhotoCropEditor\(/,'Visual page editor must offer crop controls');
assert.match(pages,/remember\(cropField,changed,'ru'\)/,'Page photo crop must remain publishable');
assert.match(eventsAdmin,/openPhotoCropEditor\(/,'Event poster upload needs the visual crop editor');
assert.match(eventsAdmin,/image_crop:f\.elements\.image_crop\.value/,'Event form must persist its crop');
assert.match(adminHTML,/id="event-crop-open"/,'Event crop button must be visible');
assert.match(adminCSS,/\.nova-crop-frame\{[^}]*touch-action:none/,'Drag crop tool must support touch pointer events');
assert.match(ui,/frame\.setPointerCapture\(event\.pointerId\)/,'Cropping must allow drag to reposition');
assert.match(ui,/ratioSelect\.addEventListener\('change',draw\)/,'Cropping must preview multiple contexts');
assert.match(ui,/const zoom=make\('input'/,'Cropping must allow scaling');
assert.doesNotMatch(ui,/fetch\('\/api\/admin\/upload'/,'Cropping must never publish before the user saves');

console.log('NOVA visual crop, metadata persistence, and event height regression checks passed');
