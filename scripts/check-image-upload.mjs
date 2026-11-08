import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {imageProfile,validatePhoto,formatBytes,IMAGE_ACCEPT} from '../public/image-upload.js';

const admin=readFileSync('public/admin.js','utf8');
const pages=readFileSync('public/admin-pages.js','utf8');
const html=readFileSync('public/admin.html','utf8');
const api=readFileSync('src/index.js','utf8');
const optimizer=readFileSync('public/image-upload.js','utf8');

assert.equal(imageProfile('hero_image'),'hero');
assert.equal(imageProfile('venue_zyb_image'),'hero');
assert.equal(imageProfile('venue_pob_image'),'hero');
assert.equal(imageProfile('venue_east_image'),'hero');
assert.equal(imageProfile('home_card_zyb_image'),'card');
assert.equal(imageProfile('home_card_east_image'),'card');
assert.equal(imageProfile('gallery_pob_1_image'),'gallery');
assert.equal(imageProfile('booking_image'),'hero');
assert.equal(imageProfile('event'),'event');
assert.equal(imageProfile('hof_logo_image'),'general');
assert.equal(formatBytes(1_200_000),'1.20 МБ');

assert.doesNotThrow(()=>validatePhoto({name:'large.jpg',type:'image/jpeg',size:23_000_000}),'High-resolution JPG originals over old 8 MB limit must be accepted');
assert.doesNotThrow(()=>validatePhoto({name:'large.heic',type:'image/heic',size:35_000_000}),'Browser-decodable HEIC source must be allowed');
assert.doesNotThrow(()=>validatePhoto({name:'untyped.jpeg',type:'',size:1_000_000}),'File extensions can identify an untyped photo');
assert.throws(()=>validatePhoto({name:'huge.jpg',type:'image/jpeg',size:85_000_000}),/80 МБ/);
assert.throws(()=>validatePhoto({name:'file.pdf',type:'application/pdf',size:4000}),/Поддерживаются/);
assert.ok(IMAGE_ACCEPT.includes('image/webp'));
assert.match(optimizer,/maxSide:2400,targetBytes:1_300_000/,'Full-screen photographs must be resized');
assert.match(optimizer,/maxSide:1400,targetBytes:500_000/,'Card and event images must use small budgets');
assert.match(optimizer,/canvas\.toBlob\(blob=>/,'Images are encoded locally');
assert.match(optimizer,/blob\.type!==WEBP_MIME/,'Unsupported WebP encoding must reject rather than upload PNG');
assert.match(optimizer,/new WeakMap\(\)/,'Multiple previews and saves must reuse a single conversion');
assert.match(optimizer,/headers:\{'X-Nova-Admin':'1','Content-Type':WEBP_MIME\}/,'Uploads must send WebP to API');

assert.match(admin,/import \{preparePhoto,uploadPhoto/,'Legacy editor must import shared compressor');
assert.match(admin,/await upload\(file,key\)/,'Legacy content uploader uses correct image profile');
assert.match(admin,/await upload\(file,'event'\)/,'Event poster uploader uses compact profile');
assert.match(pages,/import \{preparePhoto,uploadPhoto/,'Page editor must import shared compressor');
assert.match(pages,/await preparePhoto\(file,field\.key\)/,'Page editor previews optimized WebP');
assert.match(pages,/await upload\(file,key\)/,'Page editor uploads optimized WebP');
assert.match(html,/<script type="module" src="\/admin\.js">/,'Event administration script must remain a module');
assert.match(api,/if\(bytes\.byteLength>8\*1024\*1024/,'Backend still has safe upload size limit');
assert.match(api,/cacheControl:type==='image\/webp'\?'public, max-age=31536000, immutable'/,'Unique WebP assets get long-lived browser caching');

console.log('NOVA high-resolution WebP image-upload checks passed');
