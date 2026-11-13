// A Belarusian mobile reservation number is always +375 (25|29|33|44) XXX-XX-XX.
// The helpers are pure so both the browser and the Worker validate the same rule.
const OPERATORS=/^(?:25|29|33|44)\d{7}$/;
const ALLOWED=/^[+\d()\s-]+$/;
const NATIONAL_PREFIX='375';
export function nationalDigits(value){
 let digits=String(value??'').replace(/\D/g,'');
 if(digits.startsWith(NATIONAL_PREFIX))digits=digits.slice(3);
 else if(digits.length===11&&digits.startsWith('80'))digits=digits.slice(2);
 else if(digits.length===10&&digits.startsWith('0'))digits=digits.slice(1);
 return digits.slice(0,9);
}
function partialDigits(value){
 const digits=nationalDigits(value);
 if(!digits||!['2','3','4'].includes(digits[0]))return '';
 if(digits.length>=2&&!['25','29','33','44'].includes(digits.slice(0,2)))return digits.slice(0,1);
 return digits;
}
export function formatBelarusPhone(value){
 const digits=partialDigits(value);
 if(!digits)return '+375 ';
 let output='+375 ('+digits.slice(0,2);
 if(digits.length>=2)output+=')';
 if(digits.length>=3)output+=' '+digits.slice(2,5);
 if(digits.length>=6)output+='-'+digits.slice(5,7);
 if(digits.length>=8)output+='-'+digits.slice(7,9);
 return output;
}
export function normalizeBelarusPhone(value){
 const raw=String(value??'').trim();
 if(!raw||!ALLOWED.test(raw)|| (raw.includes('+')&&(!raw.startsWith('+')||raw.indexOf('+',1)!==-1)))return null;
 const digits=raw.replace(/\D/g,'');
 let local;
 if(raw.startsWith('+')){
  if(!digits.startsWith(NATIONAL_PREFIX)||digits.length!==12)return null;
  local=digits.slice(3);
 }else if(digits.startsWith(NATIONAL_PREFIX)&&digits.length===12)local=digits.slice(3);
 else if(digits.startsWith('80')&&digits.length===11)local=digits.slice(2);
 else if(digits.startsWith('0')&&digits.length===10)local=digits.slice(1);
 else if(digits.length===9)local=digits;
 else return null;
 return OPERATORS.test(local)?'+375'+local:null;
}
function caretAfterDigits(mask,digitsBefore){
 if(digitsBefore<=0)return Math.min(5,mask.length);
 let seen=0;
 for(let i=5;i<mask.length;i++)if(/\d/.test(mask[i])&&++seen===digitsBefore)return i+1;
 return mask.length;
}
export function enhanceBelarusPhone(form,language='ru'){
 const input=form.querySelector('input[name="phone"]');
 if(!input)return;
 const error=language==='en'
  ?'Use a Belarusian number with operator 25, 29, 33 or 44.'
  :'Укажите номер РБ с кодом 25, 29, 33 или 44.';
 input.setAttribute('aria-description',error);
 input.addEventListener('paste',event=>{
  const pasted=event.clipboardData?.getData('text')||'';
  if(!pasted)return;
  event.preventDefault();
  const formatted=formatBelarusPhone(pasted);
  input.value=formatted;
  input.dataset.lastDigits=partialDigits(formatted);
  input.setSelectionRange(formatted.length,formatted.length);
 });
 input.addEventListener('focus',()=>{
  if(!input.value){
   input.value='+375 ';
   input.setSelectionRange(input.value.length,input.value.length);
  }
 });
 input.addEventListener('input',event=>{
  const before=input.value;
  const at=input.selectionStart??before.length;
  const rawDigits=before.replace(/\D/g,'');
  let digitsBefore=Math.max(0,before.slice(0,at).replace(/\D/g,'').length-(rawDigits.startsWith('375')?3:0));
  let next=partialDigits(before);
  const previous=partialDigits(input.dataset.lastDigits||'');
  // Backspacing over a closing bracket, space, or dash should remove the preceding digit.
  if(event.inputType==='deleteContentBackward'&&next===previous&&digitsBefore>0){
   next=previous.slice(0,digitsBefore-1)+previous.slice(digitsBefore);
   digitsBefore--;
  }
  input.value=formatBelarusPhone(next);
  input.dataset.lastDigits=next;
  input.setSelectionRange(caretAfterDigits(input.value,Math.min(digitsBefore,next.length)),caretAfterDigits(input.value,Math.min(digitsBefore,next.length)));
 });
 input.addEventListener('blur',()=>{
  if(!nationalDigits(input.value))input.value='';
  input.dataset.lastDigits=partialDigits(input.value);
 });
 input.addEventListener('change',()=>{
  if(input.value)input.value=formatBelarusPhone(input.value);
  input.dataset.lastDigits=partialDigits(input.value);
 });
}
