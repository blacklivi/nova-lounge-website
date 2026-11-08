import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync('public/app.js','utf8');
const css=readFileSync('public/site.css','utf8');
const design=css.slice(css.lastIndexOf('/* NOVA × HÓF — unified site action geometry.'));
assert.ok(design.startsWith('/* NOVA × HÓF — unified site action geometry.'),'Sitewide action styles must be the last layer');

for(const rule of [
 '--nova-action-width:234px;',
 '--nova-action-height:56px;',
 '--nova-action-font:15px;',
 '--nova-action-icon:18px;',
 '--hof-action-width:var(--nova-action-width)',
 '--hof-action-height:var(--nova-action-height)',
 '--nova-action-width:calc(50vw - var(--gutter) - 4px)',
 '--nova-action-height:64px',
 '--nova-action-icon:16px',
 '.nova-action--primary',
 '.nova-action--outline',
 '.nova-action--light',
 '.home-events-heading',
 '.book-cta.nova-action',
 '.detail-actions',
 '.hof-events-page .nova-action--outline',
 'body.hof-events-active .site-header .header-book',
 'prefers-reduced-motion:reduce'
])assert.ok(design.includes(rule),'Shared action rule is missing: '+rule);

for(const fragment of [
 'class="button header-book nova-action nova-action--primary"',
 'class="button nova-action nova-action--primary" data-modal="booking"',
 'class="text-link nova-action nova-action--outline" data-editor-key="home_story_menu_text"',
 'class="home-events-heading"',
 'class="book-cta nova-action nova-action--light"',
 'class="detail-back nova-action nova-action--outline nova-action--back"',
 'class="button nova-action nova-action--primary" data-editor-key="venue_${id}_booking_text"',
 'class="button secondary nova-action nova-action--outline" data-editor-key="menu_${id}"',
 'class="text-link nova-action nova-action--outline" data-editor-key="venue_${id}_contacts_text"',
 'class="venue-events-link nova-action nova-action--outline"',
 'class="venue-events-all nova-action nova-action--outline"',
 'class="hof-event-more hof-action nova-action"',
 'class="hof-outline hof-primary-cta hof-action nova-action"',
 'class="hof-text-button hof-action nova-action"'
])assert.ok(app.includes(fragment),'Action must use the shared component: '+fragment);

assert.doesNotMatch(app,/class="section-link"/,'Events heading must no longer be a large inline text link');
assert.doesNotMatch(app,/class="text-link" data-editor-key=/,'Action-only underlined text links must be replaced');
assert.match(app,/data-editor-key="home_events_title"/,'The heading remains separately CMS-editable');
assert.match(app,/data-editor-key="home_events_url"/,'The event link destination remains CMS-editable');
assert.match(app,/data-modal="booking" data-venue="zyb"/,'HÓF booking remains venue-scoped');
assert.ok(app.includes('data-modal="booking" data-venue="${id}"'),'Other venue booking remains venue-scoped');
assert.ok(app.includes('data-modal="contacts" data-venue="${id}"'),'Venue contact action remains interactive');
assert.ok(app.includes('data-modal="menu-location" data-venue="${id}"'),'Venue menu action remains interactive');
assert.match(app,/href="\/events"/,'Calendar navigation remains a link');

console.log('NOVA/HÓF shared action geometry and route handlers passed');
