import assert from 'node:assert/strict';
import {after, before, test} from 'node:test';
import {adminPassword, staffPassword, startLocalWorker} from './local-worker.mjs';

let local;
before(async () => { local = await startLocalWorker(); });
after(async () => { await local?.worker.close(); });

function call(path, {method = 'GET', data, body, cookie, headers = {}} = {}) {
 return fetch(local.base + path, {
  method,
  headers: {
   'x-nova-reserved': '1',
   'x-nova-admin': '1',
   ...(data !== undefined || body !== undefined ? {'content-type': 'application/json'} : {}),
   ...(cookie ? {cookie} : {}),
   ...headers
  },
  body: data === undefined ? body : JSON.stringify(data)
 });
}
async function expectStatus(response, status) {
 const result = await response;
 assert.equal(result.status, status, await result.clone().text());
 return result;
}
function cookieFrom(response) {
 const value = response.headers.get('set-cookie');
 for (const flag of ['Secure', 'HttpOnly', 'SameSite=Strict']) assert.ok(value.split('; ').includes(flag));
 return value.split(';')[0];
}
const date = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
const booking = {venue: 'zyb', name: 'Local fixture', phone: '+375 25 000-00-01', date, time: '19:15', guests: 1, consent: true};
const submit = (data, options = {}) => call('/api/reservations', {method: 'POST', data, ...options});
const rows = async () => (await local.db.prepare('SELECT * FROM reservations ORDER BY venue, phone').all()).results;

test('guest bookings persist for all venues and equivalent retries create one row', async () => {
 for (const [venue, code, guests] of [['zyb', 25, 1], ['pob', 29, 16], ['east', 33, 2], ['east', 44, 3]]) {
  const data = {...booking, venue, phone: `+375 ${code} 000-00-01`, guests};
  const response = await expectStatus(submit(data), 201);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  assert.deepEqual(await response.json(), {ok: true, accepted: true});
 }
 const duplicate = {...booking, phone: '+375250000001'};
 await expectStatus(submit(duplicate), 202);
 const concurrent = {...booking, time: '19:30'};
 const responses = await Promise.all([submit(concurrent), submit(concurrent), submit(concurrent)]);
 assert.deepEqual(responses.map(r => r.status).sort(), [201, 202, 202]);
 const saved = await rows();
 assert.equal(saved.length, 5);
 const numberRows=(await local.db.prepare('SELECT number FROM reservation_numbers ORDER BY number').all()).results;
 assert.deepEqual(numberRows.map(r=>r.number),[1,2,3,4,5], 'Every saved reservation must get a unique, increasing number');
 assert.ok(saved.every(r => r.booking_date === date && r.consent_at && r.status === 'new'));
 assert.deepEqual(saved.filter(r => r.booking_time === '19:15').map(r => [r.venue, r.phone, r.guests]), [
  ['east', '+375330000001', 2], ['east', '+375440000001', 3], ['pob', '+375290000001', 16], ['zyb', '+375250000001', 1]
 ]);
});

test('Minsk validation, honeypot, rate limit and origin handling', async () => {
 const beforeCount = (await rows()).length;
 for (const fields of [
  {date: '2026-02-30'}, {time: '19:10'}, {phone: '+375 24 000-00-01'},
  {phone: '+375 29 000'}, {consent: false}, {guests: 17}, {venue: ''},
  {date: new Date(Date.now() - 86400000).toISOString().slice(0, 10)}
 ]) await expectStatus(submit({...booking, ...fields}), 400);
 await expectStatus(submit({...booking, website: 'filled'}), 202);
 await expectStatus(submit(booking, {headers: {origin: 'https://other.example'}}), 403);
 await expectStatus(submit(booking), 429);
 assert.equal((await rows()).length, beforeCount);
});

test('invalid booking JSON is a client error', async () => {
 await expectStatus(call('/api/reservations', {method: 'POST', body: '{'}), 400);
 await expectStatus(call('/api/reservations', {method: 'POST', body: '[]'}), 400);
 await expectStatus(call('/api/reservations', {method: 'POST', body: ' '.repeat(4097)}), 413);
});

test('staff roles, scoped totals, audit history, revocation and session expiry', async () => {
 const root = '/api/reserved';
 const login = async (username, password) => cookieFrom(await expectStatus(
  call(root + '/login', {method: 'POST', data: {username, password}}), 200));
 const owner = await login('owner', adminPassword);
 await expectStatus(call(root + '/reservations'), 401);
 for (const [username, role, venue] of [['manager', 'manager', 'zyb'], ['viewer', 'viewer', 'pob']]) {
  await expectStatus(call(root + '/users', {method: 'POST', cookie: owner,
   data: {username, role, venue, password: staffPassword, display_name: 'Local staff'}}), 201);
 }
 const manager = await login('manager', staffPassword);
 const viewer = await login('viewer', staffPassword);
 const listings = root + '/reservations';
 const list = async cookie => (await (await expectStatus(call(listings, {cookie}), 200)).json());
 const all = await list(owner);
 const own = await list(manager);
 const scoped = await list(viewer);
 assert.equal(all.total, 5);
 assert.equal(own.total, 2);
 assert.equal(scoped.total, 1);
 assert.ok(own.reservations.every(r => r.venue === 'zyb'));
 assert.ok(scoped.reservations.every(r => r.venue === 'pob'));
 await expectStatus(call(listings + '?venue=pob', {cookie: manager}), 403);
 await expectStatus(call(root + '/users', {cookie: manager}), 403);
 const update = (cookie, id, status, headers) => call(listings + '/' + id, {method: 'PATCH', cookie, data: {status}, headers});
 const foreign = scoped.reservations[0].id;
 const id = own.reservations[0].id;
 await expectStatus(update(manager, foreign, 'confirmed'), 404);
 await expectStatus(update(viewer, foreign, 'confirmed'), 403);
 await expectStatus(update(manager, id, 'confirmed', {'x-nova-reserved': '0'}), 403);
 await expectStatus(update(manager, id, 'confirmed'), 200);
 await expectStatus(update(manager, id, 'confirmed'), 200);
 assert.deepEqual((await local.db.prepare('SELECT from_status,to_status,actor FROM reservation_audit').all()).results,
  [{from_status: 'new', to_status: 'confirmed', actor: 'manager'}]);
 const changes = await Promise.all(['completed', 'cancelled'].map(status => update(manager, id, status)));
 assert.ok(changes.every(r => [200, 409].includes(r.status)));
 const history = (await local.db.prepare('SELECT from_status,to_status FROM reservation_audit WHERE reservation_id=? ORDER BY rowid').bind(id).all()).results;
 assert.ok(history.every((item, index) => !index || item.from_status === history[index - 1].to_status));
 assert.equal((await local.db.prepare('SELECT status FROM reservations WHERE id=?').bind(id).first()).status, history.at(-1).to_status);
 // Force a zero-row guarded update to exercise the conflict path without timing assumptions.
 await local.db.prepare("CREATE TRIGGER skip_fixture_update BEFORE UPDATE OF status ON reservations BEGIN SELECT RAISE(IGNORE); END").run();
 try {
  const next = history.at(-1).to_status === 'completed' ? 'cancelled' : 'completed';
  const conflict = await expectStatus(update(manager, id, next), 409);
  assert.deepEqual(await conflict.json(), {ok: false, error: 'status_changed'});
  assert.equal(await local.db.prepare('SELECT COUNT(*) AS total FROM reservation_audit WHERE reservation_id=?').bind(id).first('total'), history.length);
 } finally {
  await local.db.prepare('DROP TRIGGER skip_fixture_update').run();
 }
 const users = await (await call(root + '/users', {cookie: owner})).json();
 const record = users.users.find(u => u.username === 'manager');
 assert.equal('password_hash' in record, false);
 await expectStatus(call(root + '/users/' + record.id, {method: 'PATCH', cookie: owner, data: {active: false}}), 200);
 await expectStatus(call(root + '/session', {cookie: manager}), 401);
 await local.db.prepare('UPDATE reservation_sessions SET expires_at=0').run();
 await expectStatus(call(root + '/session', {cookie: owner}), 401);
});

test('CMS authorization, bilingual content and photo crop persist in D1 and R2', async () => {
 const prefix = '/api/admin';
 await expectStatus(call(prefix + '/content'), 401);
 const auth = await expectStatus(call(prefix + '/login', {method: 'POST', data: {password: adminPassword}}), 200);
 const cookie = cookieFrom(auth);
 const write = (data, headers) => call(prefix + '/content', {method: 'PUT', cookie, data, headers});
 await expectStatus(write({content: {hero_tagline: 'Тест'}}, {'x-nova-admin': '0'}), 403);
 await expectStatus(write({content: {menu_zyb: 'javascript:invalid'}}), 400);
 const {readFile} = await import('node:fs/promises');
 const image = await readFile(new URL('../public/media/base-53697fced412fd.webp', import.meta.url));
 const upload = body => call(prefix + '/upload', {method: 'POST', cookie, body, headers: {'content-type': 'image/webp'}});
 await expectStatus(upload(Buffer.alloc(256)), 400);
 const {url} = await (await expectStatus(upload(image), 201)).json();
 const retrieved = await expectStatus(call(url), 200);
 assert.equal(retrieved.headers.get('content-type'), 'image/webp');
 assert.deepEqual(Buffer.from(await retrieved.arrayBuffer()), image);
 const content = {hero_tagline: 'Тест <NOVA>', menu_zyb: 'https://example.com/menu', hero_image: url, hero_image_crop: '25,65,130'};
 const content_en = {hero_tagline: 'Test <NOVA>'};
 await expectStatus(write({content, content_en}), 200);
 const published = await (await expectStatus(call('/api/content'), 200)).json();
 for (const [key, value] of Object.entries(content)) assert.equal(published.content[key], value);
 assert.equal(published.content_en.hero_tagline, content_en.hero_tagline);
 const saved = await local.db.prepare('SELECT value FROM site_content WHERE key=?').bind('hero_image_crop').first();
 assert.equal(saved.value, '25,65,130');
});

test('event dates are valid calendar dates; draft and published events stay in sync', async () => {
 const prefix = '/api/admin';
 const cookie = cookieFrom(await expectStatus(call(prefix + '/login', {method: 'POST', data: {password: adminPassword}}), 200));
 const event = {title: 'Local <live> event', description: 'Fixture', venue: 'zyb', starts_at: date + 'T19:15', published: false};
 const create = data => call(prefix + '/events', {method: 'POST', cookie, data});
 await expectStatus(create({...event, starts_at: '2026-02-30T19:15'}), 400);
 const {id} = await (await expectStatus(create(event), 201)).json();
 const findPublic = async () => (await (await call('/api/events')).json()).events.find(e => e.id === id);
 assert.equal(await findPublic(), undefined);
 const edit = data => call(prefix + '/events/' + id, {method: 'PUT', cookie, data});
 await expectStatus(edit({...event, published: true}), 200);
 assert.equal((await findPublic()).title_en, event.title);
 const html = await (await expectStatus(call('/events/hof'), 200)).text();
 const boot = html.match(/<script type="application\/json" id="nova-events-bootstrap">(.*?)<\/script>/s)[1];
 assert.equal(JSON.parse(boot).find(e => e.id === id).title, event.title);
 await expectStatus(edit(event), 200);
 assert.equal(await findPublic(), undefined);
});

test('public routes serve crawlable metadata, valid assets and expected HTTP errors', async () => {
 const {seoRoute} = await import('../src/seo.js');
 for (const path of ['/', '/events', '/events/hof', '/events/pobediteley', '/events/vostok',
  '/spaces/zybitskaya', '/spaces/pobediteley', '/spaces/vostok']) {
  const res = await expectStatus(call(path), 200);
  const html = await res.text();
  assert.ok(html.includes('<link rel="canonical" href="' + local.base + path + '">'));
  assert.match(html, /<meta name="description" content="[^"]+"/);
  assert.match(html, /<script type="application\/ld\+json">/);
  assert.match(html, /id="seo-fallback"/);
 }
 for (const path of ['/favicon.svg', '/app.js', '/content-defaults.json']) await expectStatus(call(path), 200);
 for (const path of ['/unknown-route', '/api/unknown-route', '/media/upload-missing.webp']) await expectStatus(call(path), 404);
 const reserved = await expectStatus(call('/reserved'), 200);
 assert.match(reserved.headers.get('x-robots-tag'), /noindex/);
 assert.match(reserved.headers.get('cache-control'), /no-store/);
 assert.match(reserved.headers.get('content-security-policy'), /frame-ancestors 'none'/);
 const demo = 'https://nova-lounge-demo.blacklivi-olx.workers.dev';
 assert.match(await seoRoute(new Request(demo + '/robots.txt')).text(), /Disallow: \/\n/);
 assert.equal(seoRoute(new Request(demo + '/sitemap.xml')).status, 404);
 const domain = 'https://nova-lounge.by';
 assert.match(await seoRoute(new Request(domain + '/robots.txt')).text(), /Allow: \/\n/);
 const sitemap = await seoRoute(new Request(domain + '/sitemap.xml')).text();
 assert.equal(sitemap.match(/<loc>/g).length, 8);
 assert.ok(sitemap.includes(domain + '/spaces/zybitskaya'));
});

test('D1 write failure cannot return a successful booking or leave a booking row', async () => {
 const isolated = await startLocalWorker();
 try {
  await isolated.db.prepare("CREATE TRIGGER reject_fixture BEFORE INSERT ON reservations BEGIN SELECT RAISE(ABORT, 'fixture unavailable'); END").run();
  const response = await expectStatus(fetch(isolated.base + '/api/reservations', {
   method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(booking)
  }), 500);
  assert.deepEqual(await response.json(), {ok: false, error: 'request_failed'});
  assert.equal((await isolated.db.prepare('SELECT COUNT(*) AS total FROM reservations').first()).total, 0);
 } finally {
  await isolated.worker.close();
 }
});
