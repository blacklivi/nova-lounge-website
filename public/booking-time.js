// Branded desktop time chooser with free HH:MM typing.
export function enhanceBookingTime(form,language){
 if(!matchMedia('(hover: hover) and (pointer: fine)').matches)return;
 const input=form.elements.time;if(!input)return;
 input.type='text';input.inputMode='numeric';input.pattern='(?:[01][0-9]|2[0-3]):[0-5][0-9]';input.autocomplete='off';input.placeholder='HH:MM';
 const field=input.closest('.field');field.classList.add('nova-time-field');
 const control=document.createElement('div');control.className='nova-time-control';input.before(control);control.append(input);
 const trigger=document.createElement('button');trigger.type='button';trigger.className='nova-time-toggle';trigger.textContent='';trigger.setAttribute('aria-label',language==='en'?'Choose time':'Выбрать время');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-controls','nova-time-options');
 const list=document.createElement('div');list.className='nova-time-list';list.setAttribute('role','listbox');list.id='nova-time-options';list.hidden=true;
 const close=()=>{list.hidden=true;trigger.setAttribute('aria-expanded','false')};
 const items=[];
 for(let i=0;i<96;i++){
   const value=String(Math.floor(i/4)).padStart(2,'0')+':'+String((i%4)*15).padStart(2,'0');
   const item=document.createElement('button');item.type='button';item.className='nova-select-option';item.role='option';item.textContent=value;
   item.addEventListener('click',()=>{input.value=value;input.setCustomValidity('');input.dispatchEvent(new Event('input',{bubbles:true}));close();input.focus()});
   item.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();items[(items.indexOf(item)+items.length+(e.key==='ArrowDown'?1:-1))%items.length].focus()}else if(e.key==='Escape'){e.preventDefault();close();input.focus()}});
   list.append(item);items.push(item);
 }
 trigger.addEventListener('click',()=>{if(!list.hidden){close();return}list.hidden=false;trigger.setAttribute('aria-expanded','true');const match=items.find(x=>x.textContent===input.value)||items[76];list.scrollTop=Math.max(0,match.offsetTop-list.offsetTop-list.clientHeight/2)});
 input.addEventListener('input',()=>input.setCustomValidity(''));
 control.append(trigger,list);
 control.addEventListener('focusout',e=>{if(!control.contains(e.relatedTarget))close()});
 const outside=e=>{if(!control.contains(e.target))close()};document.addEventListener('pointerdown',outside);
 form.closest('dialog')?.addEventListener('close',()=>document.removeEventListener('pointerdown',outside),{once:true});
}