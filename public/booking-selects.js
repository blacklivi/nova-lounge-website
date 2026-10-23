export function enhanceBookingSelects(form, lang){
  if(!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  for(const select of form.querySelectorAll('select')){
    const originalRequired=select.required;
    select.required=false;select.tabIndex=-1;select.classList.add('nova-native-hidden');
    const box=document.createElement('div');box.className='nova-select';
    const trigger=document.createElement('button');trigger.type='button';trigger.className='nova-select-trigger';trigger.textContent=select.selectedOptions[0]?.textContent||'';
    trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
    trigger.setAttribute('aria-label',form.querySelector('label[for="'+select.id+'"]')?.textContent||'');
    const list=document.createElement('div');list.className='nova-select-list';list.role='listbox';list.hidden=true;
    const items=[...select.options].map(option=>{
      const item=document.createElement('button');item.type='button';item.role='option';item.className='nova-select-option';item.textContent=option.textContent;
      item.setAttribute('aria-selected',String(select.value===option.value));
      item.addEventListener('click',()=>{
        select.value=option.value;trigger.textContent=option.textContent;list.hidden=true;trigger.setAttribute('aria-expanded','false');
        items.forEach(el=>el.setAttribute('aria-selected',String(el===item)));
        select.dispatchEvent(new Event('change',{bubbles:true}));trigger.focus();
      });
      list.append(item);return item;
    });
    const close=()=>{list.hidden=true;trigger.setAttribute('aria-expanded','false')};
    const show=()=>{list.hidden=false;trigger.setAttribute('aria-expanded','true');items[Math.max(0,select.selectedIndex)]?.focus()};
    trigger.addEventListener('click',()=>list.hidden?show():close());
    box.addEventListener('keydown',e=>{
      const pos=items.indexOf(document.activeElement);
      if(e.key==='Escape'){e.preventDefault();close();trigger.focus()}
      if((e.key==='ArrowDown'||e.key==='ArrowUp')&&!list.hidden){e.preventDefault();items[(pos+items.length+(e.key==='ArrowDown'?1:-1))%items.length]?.focus()}
    });
    box.addEventListener('focusout',e=>{if(!box.contains(e.relatedTarget))close()});
    box.append(trigger,list);select.insertAdjacentElement('afterend',box);
    if(originalRequired)form.dataset.customVenueRequired='true';
  }
}