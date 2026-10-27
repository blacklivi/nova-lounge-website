import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const site = readFileSync('public/site.css','utf8');
const css = readFileSync('public/design-lab.css','utf8');
const ui = readFileSync('public/design-lab-ui.js','utf8');
const app = readFileSync('public/app.js','utf8');
const worker = readFileSync('src/design-lab.js','utf8');
const design = readFileSync('design.md','utf8');
const source = JSON.parse(readFileSync('hallmark-source.json','utf8'));

// This is a NOVA-specific small regression suite, not Hallmark's full 57 gates.
assert.equal(source.repository,'https://github.com/Nutlope/hallmark');
assert.match(source.commit,/^[0-9a-f]{40}$/);
assert.match(design,/Manrope/);
assert.match(design,/#384929/);
assert.match(design,/fixed booking dock/);
assert.match(readFileSync('.agents/skills/nova-hallmark/SKILL.md','utf8'),/project-specific adaptation/);
for(const [name,style] of [['site',site],['design-lab',css]]){
 assert.doesNotMatch(style,/transition\s*:\s*all\b/i,name+': avoid transition all');
 assert.doesNotMatch(style,/100vw\b/,name+': avoid root viewport width');
 assert.match(style,/:focus-visible/,name+': visible keyboard focus required');
 assert.match(style,/prefers-reduced-motion/,name+': reduced motion required');
}
assert.match(css,/overflow-x:clip/);
assert.match(css,/text-wrap:pretty/);
assert.match(css,/text-wrap:balance/);
assert.match(css,/outline:2px solid var\(--olive\)/);
assert.match(ui,/let scrollFrame=0/);
assert.match(ui,/scrollFrame=requestAnimationFrame/);
assert.match(ui,/lab-hero-ready/);
for(const venue of ['zyb','pob','east'])assert.match(app,new RegExp('venue-card-editorial-\\$\\{id\\}'));
for(const route of ['publicPage','isPublicPage'])assert.ok(worker.includes(route));
assert.doesNotMatch(worker,/env\.DB|env\.MEDIA/,'Laboratory worker stays read-only');
console.log('NOVA Hallmark-adapted craft checks passed (subset, not official sloplint).');
