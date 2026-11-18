import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';
import {chromium, firefox, webkit, devices} from 'playwright';
import {adminPassword, startLocalWorker} from './local-worker.mjs';

const profiles = [
 ['iphone-small', 'webkit', {...devices['iPhone SE'], viewport: {width: 320, height: 568}}, '/', 'ru', 'pob'],
 ['iphone-se', 'webkit', devices['iPhone SE'], '/spaces/zybitskaya', 'ru', 'zyb'],
 ['iphone-13', 'webkit', devices['iPhone 13'], '/spaces/zybitskaya', 'en', 'zyb'],
 ['android', 'chromium', devices['Pixel 7'], '/spaces/vostok', 'ru', 'east'],
 ['ipad', 'webkit', {...devices['iPad Mini'], viewport: {width: 768, height: 1024}}, '/spaces/pobediteley', 'en', 'pob'],
 ['tablet-landscape', 'chromium', {viewport: {width: 1024, height: 768}, hasTouch: true}, '/', 'en', 'east'],
 ['desktop', 'firefox', {viewport: {width: 1440, height: 900}}, '/spaces/zybitskaya', 'ru', 'zyb']
];
const artifactDir = process.env.NOVA_TEST_ARTIFACTS;
const browsers = {chromium, firefox, webkit};

test('public booking works at phone, tablet and desktop sizes', {timeout: 180000}, async t => {
 const local = await startLocalWorker();
 t.after(() => local.worker.close());
 if (artifactDir) await mkdir(artifactDir, {recursive: true});

 for (const [index, [label, engine, device, path, lang, venue]] of profiles.entries()) {
  await t.test(label, {timeout: 30000}, async t => {
   const fallback = process.env.NOVA_CHROMIUM_PATH;
   const browser = fallback ? await chromium.launch({executablePath: fallback}) : await browsers[engine].launch();
   t.after(() => browser.close());
   // Chromium cannot use Safari's device identity in the fallback run.
   const {defaultBrowserType, userAgent, ...deviceOptions} = device;
   const context = await browser.newContext({...deviceOptions, ...(fallback ? {} : {userAgent}),
    timezoneId: 'America/Los_Angeles', reducedMotion: 'reduce'});
   await context.addInitScript(value => localStorage.setItem('nova-language', value), lang);
   const page = await context.newPage();
   const errors = [];
   page.on('pageerror', error => errors.push(error.message));
   assert.equal((await page.goto(local.base + path, {waitUntil: 'domcontentloaded'})).status(), 200);
   await page.getByRole('button', {name: /^RU .*Русский язык$/}).waitFor();
   await page.getByRole('button', {name: /^EN .*English language$/}).waitFor();
   const trigger = page.locator('button[data-modal="booking"]:visible').first();
   if (label === 'desktop') {
    await trigger.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('dialog').evaluate(dialog => dialog.contains(document.activeElement)), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('dialog').evaluate(dialog => dialog.contains(document.activeElement)), true);
    await page.keyboard.press('Escape');
    await page.locator('dialog:not([open])').waitFor({state: 'attached'});
    assert.equal(await trigger.evaluate(button => button === document.activeElement), true);
   }
   await trigger.click();
   const form = page.locator('#book-form');
   await form.waitFor();
   assert.equal(await page.locator('html').getAttribute('lang'), lang);
   assert.equal(await form.locator('#date').getAttribute('min'),
    new Intl.DateTimeFormat('sv-SE', {timeZone: 'Europe/Minsk'}).format(new Date()));
   if (path === '/') {
    await form.locator('#venue').selectOption(venue);
   } else {
    assert.equal(await form.locator('#venue').inputValue(), venue);
   }
   assert.equal(await form.locator('#time option').count(), 96);
   const date = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);
   await form.locator('#date').fill(date);
   if (venue === 'zyb') {
    const time = form.locator('#time + .nova-select .nova-select-trigger');
    assert.match(await time.getAttribute('aria-label'), /19:00$/);
    await time.click();
    await form.getByRole('listbox').getByRole('option', {name: '18:45', exact: true}).click();
    assert.match(await time.getAttribute('aria-label'), /18:45$/);
   } else {
    await form.locator('#time').selectOption('18:45', {force: true});
   }
   const calendar = form.locator('#date + .nova-select .nova-select-trigger');
   if (await calendar.count()) {
    assert.ok((await calendar.getAttribute('aria-label')).includes(await calendar.textContent()));
   }
   await form.locator('#guest-name').fill('Local browser fixture');
   const phone = form.locator('#phone');
   await phone.fill('');
   await phone.pressSequentially('29000010' + index);
   await phone.focus();
   const geometry = await phone.evaluate(el => {
    const rect = el.getBoundingClientRect();
    const dialog = el.closest('dialog').getBoundingClientRect();
    return {inside: rect.left >= dialog.left - 1 && rect.right <= dialog.right + 1,
     rootFits: document.documentElement.scrollWidth <= innerWidth + 1,
     fieldSize: parseFloat(getComputedStyle(el).fontSize)};
   });
   assert.ok(geometry.inside && geometry.rootFits, JSON.stringify(geometry));
   if (device.isMobile) assert.ok(geometry.fieldSize >= 16);
   const consent = form.locator('input[name="consent"]');
   const submit = form.locator('button[type="submit"]');
   await submit.click();
   assert.equal(await consent.evaluate(el => el.validity.valueMissing), true);
   await consent.check();
   if (artifactDir) await page.screenshot({path: artifactDir + '/' + label + '.png'});
   if (index === 0) {
    await page.route('**/api/reservations', route => route.abort(), {times: 1});
    await submit.click();
    await form.locator('#booking-error').filter({hasText: 'Ошибка соединения. Попробуйте снова.'}).waitFor({timeout: 3000});
    assert.equal(await submit.isEnabled(), true);
    await page.route('**/api/reservations', route => route.fulfill({
     status: 502, contentType: 'text/html', body: '<h1>Bad gateway</h1>'
    }), {times: 1});
    await submit.click();
    await form.locator('#booking-error').filter({hasText: 'Не удалось отправить заявку.'}).waitFor();
    assert.equal(await submit.isEnabled(), true);
    assert.equal(await local.db.prepare('SELECT COUNT(*) AS total FROM reservations').first('total'), 0);
   }
   const [response] = await Promise.all([
    page.waitForResponse(r => r.url().endsWith('/api/reservations') && r.request().method() === 'POST'), submit.click()
   ]);
   assert.equal(response.status(), 201, await response.text());
   await page.getByRole('heading', {name: /Заявка получена|Request received/}).waitFor();
   const saved = await local.db.prepare('SELECT venue, booking_date, booking_time FROM reservations WHERE phone=?')
    .bind('+37529000010' + index).first();
   assert.deepEqual(saved, {venue, booking_date: date, booking_time: '18:45'});
   await page.locator('#modal-body button[data-close]').click();
   assert.equal(await page.locator('dialog').evaluate(el => el.open), false);
   assert.deepEqual(errors, []);
  });
 }
});

test('staff mobile details and CMS editor save through the real Worker', {timeout: 45000}, async t => {
 const local = await startLocalWorker();
 t.after(() => local.worker.close());
 const browser = await chromium.launch({executablePath: process.env.NOVA_CHROMIUM_PATH});
 t.after(() => browser.close());
 const page = await browser.newPage({...devices['Pixel 7']});
 const date = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);
 const response = await fetch(local.base + '/api/reservations', {
  method: 'POST', headers: {'content-type': 'application/json'},
  body: JSON.stringify({venue: 'zyb', name: 'Local staff fixture', phone: '+375440000001',
   date, time: '19:15', guests: 2, comment: 'Local note', consent: true})
 });
 assert.equal(response.status, 201);
 await page.goto(local.base + '/reserved');
 await page.locator('#password').fill(adminPassword);
 await page.locator('#login-form button[type="submit"]').click();
 await page.locator('.reservation-mobile-open').click();
 assert.equal(await page.locator('#detail-phone').getAttribute('href'), 'tel:+375440000001');
 assert.equal(await page.locator('#detail-note').textContent(), 'Local note');
 await page.locator('#detail-status-select').selectOption('confirmed');
 await page.locator('#detail-save').click();
 await page.locator('#detail-status[data-status="confirmed"]').waitFor();
 const audit = await local.db.prepare('SELECT actor,to_status FROM reservation_audit').first();
 assert.deepEqual(audit, {actor: 'owner', to_status: 'confirmed'});
 await page.locator('#detail-close').click();
 await page.locator('#logout').click();
 await page.locator('#login-form').waitFor();

 const editor = await browser.newPage({viewport: {width: 1440, height: 900}});
 await editor.goto(local.base + '/admin');
 await editor.locator('#password').fill(adminPassword);
 await editor.locator('#login-form button').click();
 await editor.locator('#editor-field-hero_tagline').fill('Локальный тест NOVA');
 await editor.locator('#page-editor-language').selectOption('en');
 await editor.locator('#editor-field-hero_tagline').fill('Local NOVA test');
 await editor.locator('#page-editor-language').selectOption('ru');
 const photo = fileURLToPath(new URL('../public/media/clean-e333e88f87b3e9.jpg', import.meta.url));
 await editor.locator('[data-editor-field="hero_image"] input[type="file"]').setInputFiles(photo);
 const crop = editor.locator('.nova-crop-dialog[open]');
 await crop.locator('.nova-crop-zoom').fill('130');
 await crop.locator('.nova-crop-apply').click();
 await editor.locator('#page-editor-status').filter({hasText: 'WebP готов'}).waitFor();
 const beforePublish = await (await fetch(local.base + '/api/content')).json();
 assert.notEqual(beforePublish.content.hero_tagline, 'Локальный тест NOVA');
 assert.notEqual(beforePublish.content.hero_image_crop, '50,50,130');
 const [published] = await Promise.all([
  editor.waitForResponse(r => r.url().endsWith('/api/admin/content') && r.request().method() === 'PUT'),
  editor.locator('#page-editor-save').click()
 ]);
 assert.equal(published.status(), 200, await published.text());
 const guest = await browser.newPage();
 await guest.goto(local.base + '/');
 await guest.locator('.hero-tagline').filter({hasText: 'Локальный тест NOVA'}).waitFor({state: 'attached'});
 const image = guest.locator('.hero-photo img');
 const imageURL = await image.getAttribute('src');
 assert.match(new URL(imageURL, local.base).pathname, /^\/media\/upload-.*\.webp$/);
 assert.equal((await guest.request.get(local.base + imageURL)).headers()['content-type'], 'image/webp');
 assert.equal(await image.evaluate(el => el.style.getPropertyValue('--photo-zoom')), '1.30');
 const cropRow = await local.db.prepare("SELECT value FROM site_content WHERE key='hero_image_crop'").first();
 assert.equal(cropRow.value, '50,50,130');
 await guest.locator('[data-language="en"]:visible').click();
 await guest.locator('.hero-tagline').filter({hasText: 'Local NOVA test'}).waitFor({state: 'attached'});
 const png = await guest.screenshot({clip: {x: 0, y: 0, width: 160, height: 160}});
 await editor.locator('[data-editor-field="hero_image"] input[type="file"]').setInputFiles({
  name: 'synthetic-local.png', mimeType: 'image/png', buffer: png
 });
 await crop.locator('.nova-crop-apply').click();
 await editor.locator('#page-editor-status').filter({hasText: 'WebP готов'}).waitFor();
 const [upload] = await Promise.all([
  editor.waitForResponse(r => r.url().endsWith('/api/admin/upload') && r.request().method() === 'POST'),
  editor.locator('#page-editor-save').click()
 ]);
 assert.equal(upload.status(), 201);
 const pngResult = await upload.json();
 assert.match(pngResult.url, /\.webp$/);
 const converted = await guest.request.get(local.base + pngResult.url);
 assert.equal(converted.status(), 200);
 assert.equal(converted.headers()['content-type'], 'image/webp');
});
