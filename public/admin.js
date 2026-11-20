import {preparePhoto,uploadPhoto,validatePhoto,formatBytes} from './image-upload.js';
import {DEFAULT_CROP,applyPhotoCrop} from './photo-crop.js';
import {openPhotoCropEditor} from './photo-crop-editor.js';
import {minskNow} from './core.js';
const $=q=>document.querySelector(q),$$=q=>[...document.querySelectorAll(q)];
let currentEvents=[];
function status(el,msg,err=false){if(!el)return;el.textContent=msg;el.style.color=err?'#a44c43':'#414a36'}
async function request(path,method='GET',body){const opts={method,credentials:'same-origin',headers:{'X-Nova-Admin':'1'}};if(body!==undefined){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body)}const r=await fetch(path,opts),b=await r.json().catch(()=>({error:'invalid_response'}));if(!r.ok)throw Error(b.error||('HTTP '+r.status));return b}
async function upload(file,key='event'){return (await uploadPhoto(file,key)).url}
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
  const row=document.createElement('div');row.className='item event-item';
  const isPast=ev.starts_at<minskNow();
  const publication=ev.published?(isPast?'ОПУБЛИКОВАНО · АРХИВ':'ОПУБЛИКОВАНО · БЛИЖАЙШИЕ'):'ЧЕРНОВИК · НЕ ВИДНО НА САЙТЕ';
  const top=document.createElement('div');top.className='event-item-top';
  const badges=document.createElement('div');badges.className='event-badges';
  const visibility=document.createElement('span');
  visibility.className='event-badge '+(ev.published?'event-badge--published':'event-badge--draft');
  visibility.textContent=ev.published?'ОПУБЛИКОВАНО':'ЧЕРНОВИК';
  const timing=document.createElement('span');timing.className='event-badge';
  timing.textContent=isPast?'АРХИВ':ev.published?'БЛИЖАЙШИЕ':'НЕ ОПУБЛИКОВАНО';
  badges.append(visibility,timing);
  const actions=document.createElement('div');actions.className='event-row-actions';
  if(ev.published){
   const preview=document.createElement('a');
   preview.href=(venueEventPaths[ev.venue]||'/events')+'#event-'+encodeURIComponent(ev.id);
   preview.textContent='На сайте ↗';preview.target='_blank';preview.rel='noopener noreferrer';
   actions.append(preview);
  }
  top.append(badges,actions);
  const title=document.createElement('strong');title.textContent=ev.title;
  const meta=document.createElement('span');meta.className='event-item-meta';
  const raw=String(ev.starts_at||'');
  const parts=raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  const months=['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  const formatted=parts?`${Number(parts[3])} ${months[Number(parts[2])-1]} ${parts[1]}, ${parts[4]}:${parts[5]}`:raw.replace('T',' ');
  meta.textContent=formatted+' · '+(adminVenueNames[ev.venue]||ev.venue);
  row.setAttribute('aria-label',publication+' · '+ev.title);
  const button=document.createElement('button');button.type='button';button.className='event-item-edit';button.textContent='Изменить';
  button.addEventListener('click',()=>editEvent(ev.id));
  row.append(top,title,meta,button);box.append(row);
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
function resizeEventDescription(){
 const field=$('#event-form')?.elements.description;
 if(!field)return;
 field.style.height='auto';
 field.style.height=Math.max(112,field.scrollHeight)+'px';
}
function syncEventImageControls(){
 const hasImage=!$('#event-image-preview').hidden;
 $('#event-upload-dropzone').hidden=hasImage;
 $('#event-image-tools').hidden=!hasImage;
 $('#event-image-state').textContent=$('#event-image').files?.length?'Новое изображение готово':'Афиша загружена';
}
function editEvent(id){let e=currentEvents.find(x=>x.id===id);if(!e)return;const f=$('#event-form');for(const k of ['title','description','starts_at','venue','image_url'])f.elements[k].value=e[k]||'';f.elements.published.checked=!!e.published;f.elements.id.value=e.id;updateVenueEventPreview();$('#event-form-title').textContent='Редактировать событие';$('#event-delete').hidden=false;const img=$('#event-image-preview');img.src=e.image_url||'';img.hidden=!e.image_url;
 $('#event-image-frame').hidden=!e.image_url;$('#event-crop-open').disabled=!e.image_url;
 f.elements.image_crop.value=e.image_crop||DEFAULT_CROP;
 applyPhotoCrop(img,f.elements.image_crop.value);
 $('#event-image').value='';syncEventImageControls();resizeEventDescription();$('#event-status').textContent='';window.scrollTo({top:f.getBoundingClientRect().top+window.scrollY-35,behavior:'smooth'})}
function resetEvent(){const f=$('#event-form');f.reset();f.elements.id.value='';f.elements.image_url.value='';updateVenueEventPreview();$('#event-form-title').textContent='Новое событие';$('#event-delete').hidden=true;$('#event-image-preview').hidden=true;$('#event-image-frame').hidden=true;$('#event-crop-open').disabled=true;
 f.elements.image_crop.value=DEFAULT_CROP;syncEventImageControls();resizeEventDescription();$('#event-status').textContent=''}
async function authorized(){try{await request('/api/admin/session');return true}catch(e){return false}}
async function showWorkspace(){
 $('#login').hidden=true;$('#workspace').hidden=false;$('#logout').hidden=false;
 try{await loadEvents()}catch(e){status($('#event-status'),'Не удалось загрузить афиши: '+e.message,true)}
}
async function start(){
 if(await authorized())await showWorkspace();
 else{$('#login').hidden=false;$('#workspace').hidden=true}
}
$('#login-form').addEventListener('submit',async e=>{e.preventDefault();const btn=e.currentTarget.querySelector('button');btn.disabled=true;try{const b=await request('/api/admin/login','POST',{password:$('#password').value});if(b.ok){$('#password').value='';await showWorkspace()}}catch(err){status($('#login-message'),err.message==='invalid_password'?'Неверный пароль':err.message==='too_many_attempts'?'Слишком много попыток. Повторите позже.':'Ошибка входа: '+err.message,true)}finally{btn.disabled=false}});
$('#logout').addEventListener('click',async()=>{await request('/api/admin/logout','POST');location.reload()});
$$('[data-tab]').forEach(b=>b.addEventListener('click',()=>{
 $$('[data-tab]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-selected',String(x===b))});
 $('#pages-section').hidden=b.dataset.tab!=='pages';
 $('#events-section').hidden=b.dataset.tab!=='events';
  if(b.dataset.tab==='events')requestAnimationFrame(resizeEventDescription);
}));
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
  $('#event-image-frame').hidden=false;$('#event-crop-open').disabled=false;syncEventImageControls();
  $('#event-form').elements.image_crop.value=DEFAULT_CROP;
  applyPhotoCrop(im,DEFAULT_CROP);
  const crop=await openPhotoCropEditor({src:im.dataset.objectUrl,key:'event',initial:DEFAULT_CROP,title:'Кадрирование афиши'});
  if(crop!==null){$('#event-form').elements.image_crop.value=crop;applyPhotoCrop(im,crop)}
  status($('#event-status'),'WebP готов: '+result.width+'×'+result.height+', '+formatBytes(result.originalBytes)+' → '+formatBytes(result.bytes));
 }catch(err){status($('#event-status'),'Ошибка обработки афиши: '+err.message,true);e.target.value=''}
});
$('#event-crop-open').addEventListener('click',async()=>{
 const photo=$('#event-image-preview');
 if(!photo.src)return;
 const field=$('#event-form').elements.image_crop;
 const crop=await openPhotoCropEditor({src:photo.src,key:'event',initial:field.value||DEFAULT_CROP,title:'Кадрирование афиши'});
 if(crop!==null){field.value=crop;applyPhotoCrop(photo,crop);status($('#event-status'),'Кадр обновлён. Сохраните событие для публикации.')}
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
   image_crop:f.elements.image_crop.value||DEFAULT_CROP,
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
$('#event-form').elements.description.addEventListener('input',resizeEventDescription);
window.addEventListener('resize',resizeEventDescription);
resizeEventDescription();syncEventImageControls();
updateVenueEventPreview();
$('#event-reset').addEventListener('click',resetEvent);$('#reload-events').addEventListener('click',loadEvents);
$('#event-delete').addEventListener('click',async()=>{const id=$('#event-id').value;if(!id||!confirm('Удалить событие без возможности восстановления?'))return;try{await request('/api/admin/events/'+id,'DELETE');notifyEventChanged();resetEvent();await loadEvents();status($('#event-status'),'Событие удалено.')}catch(e){status($('#event-status'),e.message,true)}});
start();
