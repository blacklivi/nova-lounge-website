import {preparePhoto,uploadPhoto,validatePhoto,formatBytes,IMAGE_ACCEPT} from './image-upload.js';
import {minskNow} from './core.js';
const $=q=>document.querySelector(q),$$=q=>[...document.querySelectorAll(q)];
const keySpecs=[
 ['hero_kicker','Первый экран · верхняя подпись','textarea'],['hero_tagline','Первый экран · слоган','textarea'],['hero_image','Первый экран · фотография','image'],
 ['story_kicker','О нас · надпись над заголовком','text'],['story_title','Основной заголовок','textarea'],['story_description','Основной текст','textarea'],['story_image','Кухня · фотография','image'],
 ['booking_title','Бронирование · заголовок','textarea'],['booking_image','Бронирование · фотография','image'],['footer_tagline','Футер · подпись NOVA','textarea'],['media_note','Изображения · отметка о демонстрационном контенте','textarea'],
 ['venue_zyb_subtitle','Зыбицкая · подпись','text'],['venue_zyb_desc','Зыбицкая · описание','textarea'],['venue_zyb_second','Зыбицкая · второй блок текста','textarea'],['venue_zyb_features','Зыбицкая · особенности','text'],['gallery_zyb_1_image','Зыбицкая · галерея 1','image'],['gallery_zyb_2_image','Зыбицкая · галерея 2','image'],['venue_zyb_image','Зыбицкая · фотография','image'],
 ['venue_pob_subtitle','Победителей · подпись','text'],['venue_pob_desc','Победителей · описание','textarea'],['venue_pob_second','Победителей · второй блок текста','textarea'],['venue_pob_features','Победителей · особенности','text'],['gallery_pob_1_image','Победителей · галерея 1','image'],['gallery_pob_2_image','Победителей · галерея 2','image'],['venue_pob_image','Победителей · фотография','image'],
 ['venue_east_subtitle','Восток · подпись','text'],['venue_east_desc','Восток · описание','textarea'],['venue_east_second','Восток · второй блок текста','textarea'],['venue_east_features','Восток · особенности','text'],['gallery_east_1_image','Восток · галерея 1','image'],['gallery_east_2_image','Восток · галерея 2','image'],['venue_east_image','Восток · фотография','image'],
 ...['zyb','pob','east'].flatMap((v,i)=>[['address_'+v,['Зыбицкая','Победителей','Восток'][i]+' · адрес','text'],['phone_'+v,'Телефон','text'],['hours_'+v,'Часы работы','text'],['map_'+v,'Маршрут на Яндекс Картах (https://)','text'],['instagram_'+v,'Instagram (https://)','text'],['telegram_'+v,'Telegram (https://)','text'],['menu_'+v,'Ссылка на QR-меню (https://)','text']])];
const sourceDefaults={};let currentContent={},currentContentEN={},currentEvents=[];
function status(el,msg,err=false){el.textContent=msg;el.style.color=err?'#a44c43':'#414a36'}
async function request(path,method='GET',body){const opts={method,credentials:'same-origin',headers:{'X-Nova-Admin':'1'}};if(body!==undefined){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body)}const r=await fetch(path,opts),b=await r.json().catch(()=>({error:'invalid_response'}));if(!r.ok)throw Error(b.error||('HTTP '+r.status));return b}
async function upload(file,key='general'){
 if(!file)return '';
 return (await uploadPhoto(file,key)).url;
}
function initFields(){const box=$('#content-fields');box.replaceChildren();for(const [key,title,type] of keySpecs){let field=document.createElement('div');field.className='field';const label=document.createElement('label');label.htmlFor='field-'+key;label.textContent=title;field.append(label);if(type==='image'){const im=document.createElement('img');im.className='photo-preview';im.alt='Изображение';im.dataset.preview=key;im.hidden=true;field.append(im);const inp=document.createElement('input');inp.type='file';inp.id='field-'+key;inp.accept=IMAGE_ACCEPT;inp.dataset.image=key;
 inp.addEventListener('change',async()=>{
  const file=inp.files?.[0];if(!file)return;
  const preview=im;
  try{
   validatePhoto(file);
   status($('#content-status'),'Готовим WebP из '+file.name+'…');
   const result=await preparePhoto(file,key);
   if(inp.files?.[0]!==file)return;
   if(preview.dataset.objectUrl)URL.revokeObjectURL(preview.dataset.objectUrl);
   preview.dataset.objectUrl=URL.createObjectURL(result.file);
   preview.src=preview.dataset.objectUrl;preview.hidden=false;
   status($('#content-status'),'WebP: '+result.originalWidth+'×'+result.originalHeight+' → '+result.width+'×'+result.height+
     ', '+formatBytes(result.originalBytes)+' → '+formatBytes(result.bytes)+'. Нажмите «Сохранить».');
  }catch(err){status($('#content-status'),'Не удалось обработать изображение: '+err.message,true);inp.value=''}
 });
 field.append(inp);const small=document.createElement('small');small.textContent='JPEG / PNG / WebP / AVIF / HEIC → WebP автоматически · оригинал до 80 МБ';field.append(small)}else{let inp=document.createElement(type==='textarea'?'textarea':'input');inp.id='field-'+key;inp.dataset.field=key;if(type==='textarea')inp.rows=3;else inp.type='text';field.append(inp)}box.append(field)}}
async function loadContent(){const r=await request('/api/admin/content');currentContent=r.content||{};currentContentEN=r.content_en||{};for(const [k] of keySpecs){const field=$('[data-field="'+k+'"]'),img=$('[data-preview="'+k+'"]');if(field)field.value=currentContent[k]??sourceDefaults[k]??'';if(img){let val=currentContent[k]||sourceDefaults[k];if(val){img.src=val;img.hidden=false}else img.hidden=true}}}
function notifyEventChanged(){
 // Notify other open NOVA tabs immediately; no event content or admin data is sent.
 if(typeof BroadcastChannel==='undefined')return;
 const channel=new BroadcastChannel('nova-events-changed');
 channel.postMessage('changed');
 channel.close();
}
const venueEventPaths={zyb:'/events/hof',pob:'/events/pobediteley',east:'/events/vostok'};
const adminVenueNames={zyb:'HÓF / Зыбицкая',pob:'NOVA / Победителей',east:'NOVA / Восток'};
function updateVenueEventPreview(){
 const choice=$('#event-form')?.elements.venue.value||'zyb';
 const a=$('#event-venue-preview');
 if(a)a.href=venueEventPaths[choice]||'/events';
}
function renderEventList(){
 const box=$('#events-items');
 box.replaceChildren();
 const scope=$('#events-venue-filter')?.value||'all';
 const items=currentEvents.filter(ev=>scope==='all'||ev.venue===scope);
 for(const ev of items){
  const row=document.createElement('div');row.className='item';
  const div=document.createElement('div');
  const label=document.createElement('span');
  const isPast=ev.starts_at<minskNow();
  const publication=ev.published?(isPast?'ОПУБЛИКОВАНО · АРХИВ':'ОПУБЛИКОВАНО · БЛИЖАЙШИЕ'):'ЧЕРНОВИК · НЕ ВИДНО НА САЙТЕ';
  label.textContent=ev.starts_at.replace('T',' ')+' · '+(adminVenueNames[ev.venue]||ev.venue)+' · '+publication;
  const title=document.createElement('strong');title.textContent=ev.title;
  div.append(label,title);
  const actions=document.createElement('div');actions.className='event-row-actions';
  if(ev.published){
   const preview=document.createElement('a');
   preview.href=(venueEventPaths[ev.venue]||'/events')+'#event-'+encodeURIComponent(ev.id);
   preview.textContent='На сайте ↗';preview.target='_blank';preview.rel='noopener noreferrer';
   actions.append(preview);
  }
  const button=document.createElement('button');button.type='button';button.textContent='Изменить';
  button.addEventListener('click',()=>editEvent(ev.id));
  actions.append(button);row.append(div,actions);box.append(row);
 }
 if(!items.length){
  const p=document.createElement('p');p.className='muted';
  p.textContent=scope==='all'?'Событий пока нет. Добавьте первую афишу.':'Для выбранного заведения пока нет событий.';
  box.append(p);
 }
}
async function loadEvents(){
 const r=await request('/api/admin/events');currentEvents=r.events||[];
 renderEventList();
}
function editEvent(id){let e=currentEvents.find(x=>x.id===id);if(!e)return;const f=$('#event-form');for(const k of ['title','description','starts_at','venue','image_url'])f.elements[k].value=e[k]||'';f.elements.published.checked=!!e.published;f.elements.id.value=e.id;updateVenueEventPreview();$('#event-form-title').textContent='Редактировать событие';$('#event-delete').hidden=false;const img=$('#event-image-preview');img.src=e.image_url||'';img.hidden=!e.image_url;$('#event-image').value='';$('#event-status').textContent='';window.scrollTo({top:f.getBoundingClientRect().top+window.scrollY-35,behavior:'smooth'})}
function resetEvent(){const f=$('#event-form');f.reset();f.elements.id.value='';f.elements.image_url.value='';updateVenueEventPreview();$('#event-form-title').textContent='Новое событие';$('#event-delete').hidden=true;$('#event-image-preview').hidden=true;$('#event-status').textContent=''}
async function authorized(){try{await request('/api/admin/session');return true}catch(e){return false}}
async function start(){initFields();
 // Public pages are rendered client-side. Read the same versioned defaults JSON used by the site.
 try{const r=await fetch('/content-defaults.json',{cache:'no-cache'});if(!r.ok)throw Error('defaults_unavailable');const defaults=await r.json();Object.assign(sourceDefaults,defaults.content||{});}catch(e){console.warn('NOVA defaults unavailable',e)}
 if(await authorized())showWorkspace();else {$('#login').hidden=false;$('#workspace').hidden=true}}
async function showWorkspace(){$('#login').hidden=true;$('#workspace').hidden=false;$('#logout').hidden=false;try{await Promise.all([loadContent(),loadEvents()])}catch(e){status($('#content-status'),'Ошибка загрузки: '+e.message,true)}}
$('#login-form').addEventListener('submit',async e=>{e.preventDefault();const btn=e.currentTarget.querySelector('button');btn.disabled=true;try{const b=await request('/api/admin/login','POST',{password:$('#password').value});if(b.ok){$('#password').value='';await showWorkspace()}}catch(err){status($('#login-message'),err.message==='invalid_password'?'Неверный пароль':err.message==='too_many_attempts'?'Слишком много попыток. Повторите позже.':'Ошибка входа: '+err.message,true)}finally{btn.disabled=false}});
$('#logout').addEventListener('click',async()=>{await request('/api/admin/logout','POST');location.reload()});
$$('[data-tab]').forEach(b=>b.addEventListener('click',()=>{$$('[data-tab]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-selected',String(x===b))});$('#content-section').hidden=b.dataset.tab!=='content';$('#events-section').hidden=b.dataset.tab!=='events'}));
$('#content-form').addEventListener('submit',async e=>{e.preventDefault();const btn=e.currentTarget.querySelector('button[type=submit]');btn.disabled=true;status($('#content-status'),'Сохраняем…');try{const content={};for(const [key,,type] of keySpecs){if(type==='image'){const file=$('[data-image="'+key+'"]').files[0];if(file){status($('#content-status'),'Сжимаем и загружаем WebP для '+key+'…');content[key]=await upload(file,key);const img=$('[data-preview="'+key+'"]');img.src=content[key];img.hidden=false}}else{const value=$('[data-field="'+key+'"]').value.trim();if(value!==String(currentContent[key]??sourceDefaults[key]??'')||((currentContent[key]!==undefined)&&/[А-Яа-яЁё]/.test(value)&&!currentContentEN[key]&&!['address_','phone_'].some(p=>key.startsWith(p))))content[key]=value}}if(Object.keys(content).length){const saved=await request('/api/admin/content','PUT',{content});window.NOVA_LAST_TRANSLATION_PENDING=saved.translation_pending||0;Object.assign(currentContent,content);await loadContent()}status($('#content-status'),window.NOVA_LAST_TRANSLATION_PENDING?'Русская версия сохранена. Перевод '+window.NOVA_LAST_TRANSLATION_PENDING+' полей пока не удался; требуется повторное сохранение.':'Сохранено на двух языках. Изменения уже доступны на сайте.',Boolean(window.NOVA_LAST_TRANSLATION_PENDING))}catch(err){status($('#content-status'),'Не удалось сохранить: '+err.message,true)}finally{btn.disabled=false}});
$('#event-image').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;
 try{
  validatePhoto(file);status($('#event-status'),'Готовим WebP для афиши…');
  const result=await preparePhoto(file,'event');
  if(e.target.files?.[0]!==file)return;
  const im=$('#event-image-preview');
  if(im.dataset.objectUrl)URL.revokeObjectURL(im.dataset.objectUrl);
  im.dataset.objectUrl=URL.createObjectURL(result.file);
  im.src=im.dataset.objectUrl;im.hidden=false;
  status($('#event-status'),'WebP готов: '+result.width+'×'+result.height+', '+formatBytes(result.originalBytes)+' → '+formatBytes(result.bytes));
 }catch(err){status($('#event-status'),'Ошибка обработки афиши: '+err.message,true);e.target.value=''}
});
$('#event-form').addEventListener('submit',async e=>{
 e.preventDefault();
 const f=e.currentTarget,btn=f.querySelector('button[type=submit]');
 btn.disabled=true;
 status($('#event-status'),'Сохраняем…');
 try{
  let image_url=f.elements.image_url.value;
  const file=$('#event-image').files[0];
  if(file){
   status($('#event-status'),'Сжимаем афишу в WebP…');
   image_url=await upload(file,'event');
  }
  const event={
   title:f.elements.title.value,
   description:f.elements.description.value,
   starts_at:f.elements.starts_at.value,
   venue:f.elements.venue.value,
   image_url,
   published:f.elements.published.checked
  };
  const id=f.elements.id.value;
  const saved=await request(id?'/api/admin/events/'+id:'/api/admin/events',id?'PUT':'POST',event);
  notifyEventChanged();
  resetEvent();
  try{await loadEvents()}catch(err){status($('#event-status'),'Событие сохранено, но не удалось обновить список в админке: '+err.message,true);return}
  if(!event.published){
   status($('#event-status'),'Событие сохранено как черновик. На сайте оно не отображается, пока вы не включите «Опубликовать на сайте».');
   return;
  }
  let live;
  try{
   live=await request('/api/events');
  }catch(err){
   status($('#event-status'),'Событие сохранено. Не удалось проверить публичную афишу: '+err.message,true);
   return;
  }
  const exists=Array.isArray(live.events)&&live.events.some(e=>e.id===(saved.id||id));
  if(!exists){
   status($('#event-status'),'Событие сохранено в админке, но пока не найдено в публичной афише. Проверьте публикацию и повторите обновление.',true);
   return;
  }
  if(event.starts_at<minskNow()){
   status($('#event-status'),'Событие опубликовано и проверено на сайте. Его дата уже прошла — ищите афишу в архиве.');
  }else if(saved.translation_pending){
   status($('#event-status'),'Событие опубликовано и проверено на сайте. Английский перевод пока недоступен — используется русский текст.');
  }else{
   status($('#event-status'),'Событие опубликовано и проверено на сайте. На главной отображается ближайшее событие, все остальные — в полной афише.');
  }
 }catch(err){
  status($('#event-status'),'Ошибка: '+err.message,true);
 }finally{btn.disabled=false}
});
$('#event-form').elements.venue.addEventListener('change',updateVenueEventPreview);
$('#events-venue-filter').addEventListener('change',renderEventList);
updateVenueEventPreview();
$('#event-reset').addEventListener('click',resetEvent);$('#reload-events').addEventListener('click',loadEvents);
$('#event-delete').addEventListener('click',async()=>{const id=$('#event-id').value;if(!id||!confirm('Удалить событие без возможности восстановления?'))return;try{await request('/api/admin/events/'+id,'DELETE');notifyEventChanged();resetEvent();await loadEvents();status($('#event-status'),'Событие удалено.')}catch(e){status($('#event-status'),e.message,true)}});
start();
