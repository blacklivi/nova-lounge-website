#!/usr/bin/env node
/**
 * NOVA design-lab CSS assembler. Author styles in styles/design-lab/*.css.
 * Runtime ships ONE ordered file public/design-lab.css to avoid additional
 * browser requests, cascade changes and flashes during first paint.
 *
 * --check fails the CI build if the output is stale. Without --check it
 * rewrites the generated file byte-for-byte from source modules.
 */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';

const sources=[
  '01-foundation-and-spaces.css',
  '02-story-events-booking.css',
  '03-venue-details-and-density.css',
  '04-cover-motion-and-typography.css',
  '05-interactions-and-mobile.css',
  '06-hallmark-accessibility.css',
  '07-art-direction.css',
  '08-venue-utility.css',
  '09-photo-light-foundation.css',
].map(name=>resolve('styles/design-lab',name));
const destination=resolve('public/design-lab.css');
const checkOnly=process.argv.includes('--check');
const sourceText=sources.map(path=>{
  assert.ok(existsSync(path),'Missing CSS source module: '+path);
  return readFileSync(path,'utf8');
});

// The original CSS uses media queries and keyframes. Splits must be made
// ONLY outside braces/strings/comments, never in the middle of a rule.
function validateStandaloneCSS(s,path){
  let depth=0,quote='',comment=false;
  for(let i=0;i<s.length;i++){
    const c=s[i],n=s[i+1];
    if(comment){if(c==='*'&&n==='/'){comment=false;i++}continue}
    if(quote){if(c==='\\'){i++;continue}if(c===quote)quote='';continue}
    if(c==='/'&&n==='*'){comment=true;i++;continue}
    if(c==="'"||c==='"'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}')depth--;
    assert.ok(depth>=0,'Mismatched closing CSS brace in '+path);
  }
  assert.equal(depth,0,'Unclosed CSS rule in '+path);
  assert.equal(quote,'','Unclosed CSS string in '+path);
  assert.equal(comment,false,'Unclosed CSS comment in '+path);
  assert.doesNotMatch(s,/@import\s+url\(/i,'No runtime CSS import in '+path);
}
for(let i=0;i<sourceText.length;i++)validateStandaloneCSS(sourceText[i],sources[i]);
const output=sourceText.join('');
assert.ok(output.length>40000,'Unexpected missing CSS sections');
assert.match(output,/NOVA MOBILE VENUE OVERLAY PARITY/);
assert.match(output,/NOVA RESTORED DARK CTA/);
assert.match(output,/NOVA MOBILE DOCK/);
assert.ok(output.includes('NOVA / Hallmark-inspired polish'));
assert.ok(existsSync(destination),'Generated output must be checked into the branch');
if(checkOnly){
  const current=readFileSync(destination,'utf8');
  assert.equal(current,output,
    'public/design-lab.css is stale. Run npm run css:design-lab and commit the generated output.');
  console.log('NOVA CSS modules verified: '+sources.length+' files, '+output.length+' bytes, identical to browser asset.');
}else{
  writeFileSync(destination,output);
  console.log('NOVA design-lab CSS assembled: '+sources.length+' modules, '+output.length+' bytes.');
}
