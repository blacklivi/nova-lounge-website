export function enhanceBookingSelects(form, lang, {forceCustom=false}={}){
  // HÓF uses a bounded brand-styled list on every device; other venues keep native touch pickers.
  if(!forceCustom&&!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
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
    const close=()=>{
      list.hidden=true;
      list.classList.remove('nova-select-above');
      trigger.setAttribute('aria-expanded','false');
    };
    const show=()=>{
      // This list stays in the dialog, rather than becoming the OS-native 96-row menu.
      list.hidden=false;
      list.classList.remove('nova-select-above');
      trigger.setAttribute('aria-expanded','true');
      const rect=trigger.getBoundingClientRect();
      const dialog=form.closest('dialog')?.getBoundingClientRect();
      const below=Math.min(window.innerHeight-12,dialog?.bottom??window.innerHeight)-rect.bottom;
      const above=rect.top-Math.max(12,dialog?.top??12);
      const needed=Math.min(248,window.innerHeight*.34);
      if(below<needed+6&&above>below&&above>125)list.classList.add('nova-select-above');
      const selected=items[Math.max(0,select.selectedIndex)];
      if(selected){
        list.scrollTop=Math.max(0,selected.offsetTop-list.clientHeight/2+selected.clientHeight/2);
        selected.focus({preventScroll:true});
      }
    };
    trigger.addEventListener('click',()=>list.hidden?show():close());
    box.addEventListener('keydown',e=>{
      const pos=items.indexOf(document.activeElement);
      if(e.key==='Escape'){e.preventDefault();close();trigger.focus()}
      if((e.key==='ArrowDown'||e.key==='ArrowUp')&&!list.hidden){e.preventDefault();items[(pos+items.length+(e.key==='ArrowDown'?1:-1))%items.length]?.focus()}
    });
    box.addEventListener('focusout',e=>{if(!box.contains(e.relatedTarget))close()});
    form.addEventListener('pointerdown',e=>{if(!box.contains(e.target))close()});
    box.append(trigger,list);select.insertAdjacentElement('afterend',box);
    if(originalRequired)form.dataset.customVenueRequired='true';
  }
}