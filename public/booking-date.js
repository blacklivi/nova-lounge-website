// Desktop calendar: the mobile version keeps the platform-native date picker.
export function enhanceBookingDate(form,language){
  if(!matchMedia('(hover: hover) and (pointer: fine)').matches)return;
  const field=form.elements.date;if(!field)return;
  const en=language==='en',panel=document.createElement('div'),trigger=document.createElement('button'),wrap=document.createElement('div');
  wrap.className='nova-select';panel.className='nova-calendar';panel.hidden=true;trigger.className='nova-select-trigger';trigger.type='button';
  trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label',en?'Choose a date':'Выбрать дату');
  let year=Number(field.value.slice(0,4)),month=Number(field.value.slice(5,7))-1;
  const iso=(y,m,d)=>String(y)+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
  const format=()=>new Intl.DateTimeFormat(en?'en-GB':'ru-RU',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'UTC'}).format(new Date(field.value+'T00:00:00Z'));
  const close=()=>{panel.hidden=true;trigger.setAttribute('aria-expanded','false')};
  const make=(label,cls,click)=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.addEventListener('click',click);return b};
  const draw=()=>{
    panel.replaceChildren();const bar=document.createElement('div');bar.className='nova-calendar-bar';
    const title=document.createElement('span');title.textContent=new Intl.DateTimeFormat(en?'en-GB':'ru-RU',{year:'numeric',month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(year,month,1)));
    const move=n=>{const d=new Date(Date.UTC(year,month+n,1));year=d.getUTCFullYear();month=d.getUTCMonth();draw()};
    const prev=make('‹','nova-cal-nav',()=>move(-1));const lastPrev=new Date(Date.UTC(year,month,0));
    prev.disabled=Boolean(field.min&&iso(lastPrev.getUTCFullYear(),lastPrev.getUTCMonth(),lastPrev.getUTCDate())<field.min);
    bar.append(prev,title,make('›','nova-cal-nav',()=>move(1)));panel.append(bar);
    const grid=document.createElement('div');grid.className='nova-cal-grid';
    (en?['Mo','Tu','We','Th','Fr','Sa','Su']:['Пн','Вт','Ср','Чт','Пт','Сб','Вс']).forEach(w=>{const d=document.createElement('span');d.className='nova-cal-weekday';d.textContent=w;grid.append(d)});
    const pad=(new Date(Date.UTC(year,month,1)).getUTCDay()+6)%7;
    for(let i=0;i<pad;i++){const a=document.createElement('span');grid.append(a)}
    const days=new Date(Date.UTC(year,month+1,0)).getUTCDate();
    for(let d=1;d<=days;d++){const day=iso(year,month,d),btn=make(String(d),'nova-cal-day',()=>{field.value=day;field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));trigger.textContent=format();close();trigger.focus()});
      btn.disabled=Boolean(field.min&&day<field.min);btn.setAttribute('aria-label',day);if(day===field.value)btn.setAttribute('aria-selected','true');grid.append(btn)}
    panel.append(grid);
  };
  trigger.textContent=format();field.classList.add('nova-native-hidden');field.required=false;field.tabIndex=-1;
  trigger.addEventListener('click',()=>{if(!panel.hidden){close();return}draw();panel.hidden=false;trigger.setAttribute('aria-expanded','true')});
  wrap.append(trigger,panel);field.insertAdjacentElement('afterend',wrap);
  wrap.addEventListener('keydown',e=>{if(e.key==='Escape'){close();trigger.focus()}});
  wrap.addEventListener('focusout',e=>{if(!wrap.contains(e.relatedTarget))close()});
}