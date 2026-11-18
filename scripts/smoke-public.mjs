import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium, webkit, devices} from 'playwright';

const base = 'https://nova-lounge-demo.blacklivi-olx.workers.dev';
const report = [];
const errors = [];
const output = process.env.NOVA_TEST_ARTIFACTS || 'artifacts/public-smoke';
const routes = [
 ['/', 200], ['/spaces/zybitskaya', 200], ['/spaces/pobediteley', 200], ['/spaces/vostok', 200],
 ['/events', 200], ['/events/hof', 200], ['/events/pobediteley', 200], ['/events/vostok', 200],
 ['/favicon.svg', 200], ['/app.js', 200], ['/site.css', 200], ['/api/content', 200],
 ['/api/events', 200], ['/robots.txt', 200], ['/sitemap.xml', 404], ['/reserved', 200], ['/admin', 200],
 ['/api/reserved/session', 401], ['/api/reserved/reservations', 401], ['/api/reserved/users', 401],
 ['/api/admin/session', 401], ['/api/admin/content', 401], ['/api/admin/events', 401],
 ['/nova-smoke-nonexistent', 404]
];
await mkdir(output, {recursive: true});

for (const [path, expected] of routes) {
 const method = path === '/favicon.svg' || path === '/site.css' || path === '/app.js' ? 'HEAD' : 'GET';
 try {
  const response = await fetch(base + path, {method, redirect: 'manual', signal: AbortSignal.timeout(8000)});
  const headers = Object.fromEntries(['cache-control', 'x-robots-tag', 'x-frame-options', 'content-type', 'cf-ray']
   .map(key => [key, response.headers.get(key)]));
  report.push({utc: new Date().toISOString(), url: base + path, method, status: response.status, ...headers});
  assert.equal(response.status, expected);
  if (expected === 401) {
   assert.match(headers['cache-control'], /no-store/);
   assert.deepEqual(await response.json(), {ok: false, error: 'unauthorized'});
  }
  if (path === '/reserved') {
   assert.match(headers['cache-control'], /no-store/);
   assert.equal(headers['x-frame-options'], 'DENY');
  }
  if (path === '/robots.txt') assert.match(await response.text(), /Disallow: \/\s*$/);
  if (path === '/api/content') {
   const data = await response.json();
   assert.ok(data.content && data.content_en);
   const byLanguage = Object.fromEntries(['content', 'content_en'].map(key => [
    key, Object.fromEntries(Object.entries(data[key]).filter(([name]) => /^(menu|instagram|address|hours|phone)_(zyb|pob|east)$/.test(name)))
   ]));
   report.push({publicEditableFields: byLanguage});
  }
  if (path === '/api/events') {
   const data = await response.json();
   assert.ok(Array.isArray(data.events));
   report.push({publishedEvents: data.events.length});
  }
 } catch (error) {
  errors.push(`${method} ${path}: ${error.message}`);
 }
}

if (report.some(row => row.url === base + '/' && row.status === 200)) {
 const profiles = [
  ['iphone-320', webkit, {...devices['iPhone SE'], viewport: {width: 320, height: 568}}, '/spaces/zybitskaya'],
  ['iphone-375', webkit, devices['iPhone SE'], '/spaces/pobediteley'],
  ['iphone-390', webkit, devices['iPhone 13'], '/spaces/vostok'],
  ['android', chromium, devices['Pixel 7'], '/']
 ];
 for (const [label, engine, device, path] of profiles) {
  const browser = await engine.launch();
  try {
   const context = await browser.newContext({...device, serviceWorkers: 'block'});
   await context.route('**/*', route => ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
   const page = await context.newPage();
   page.setDefaultTimeout(7000);
   const browserErrors = [];
   page.on('pageerror', error => browserErrors.push(error.name));
   page.on('response', response => {
    if (response.url().startsWith(base + '/') && response.status() >= 400) {
     browserErrors.push(response.status() + ' ' + new URL(response.url()).pathname);
    }
   });
   await page.goto(base + path, {waitUntil: 'domcontentloaded', timeout: 12000});
   await page.locator('button[data-modal="booking"]:visible').first().click();
   const form = page.locator('#book-form');
   assert.equal(await form.locator('#time option').count(), 96);
   const phone = form.locator('#phone');
   await phone.pressSequentially('290000001');
   assert.equal(await phone.inputValue(), '+375 (29) 000-00-01');
   await form.locator('button[type="submit"]').scrollIntoViewIfNeeded();
   const stats = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return {ttfbMs: Math.round(nav.responseStart), domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
     rootFits: document.documentElement.scrollWidth <= innerWidth + 1};
   });
   await page.screenshot({path: output + '/' + label + '.png'});
   report.push({utc: new Date().toISOString(), url: base + path, label, ...stats, browserErrors});
   assert.ok(stats.rootFits);
   assert.deepEqual(browserErrors, []);
  } catch (error) {
   errors.push(label + ': ' + error.message);
  } finally {
   await browser.close();
  }
 }
}

await writeFile(output + '/results.json', JSON.stringify({report, errors}, null, 2) + '\n');
console.log(JSON.stringify({report, errors}, null, 2));
if (errors.length) process.exitCode = 1;
