// Read-only site content. Admin edits are stored in D1 and images in R2.
const txt=s=>String(s||'');
function eventTime(v){const d=new Date(v+':00+03:00');return Number.isNaN(d.getTime())?v:new Intl.DateTimeFormat(window.NOVAI18N?.language==='en'?'en-GB':'ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Minsk'}).format(d)}
function minskNow(){return new Date(Date.now()+3*3600*1000).toISOString().slice(0,16)}
function putContent(data){for(const [key,value] of Object.entries(data||{})){
 document.querySelectorAll('[data-content="'+key+'"]').forEach(el=>{el.textContent=value});
 document.querySelectorAll('[data-image="'+key+'"]').forEach(img=>{if(value&&(/^\/media\/[\w.-]+$/.test(value)))img.src=value});
}window.NOVA_CONTENT=data||{};
}
let sourceRU={},sourceEN={},cachedEventRows=null;
function localizedContent(){const en=window.NOVAI18N?.language==='en';const data={...sourceRU};if(en)for(const [key,value] of Object.entries(sourceEN)){if(value&&![ 'menu_','instagram_','telegram_','phone_' ].some(prefix=>key.startsWith(prefix)))data[key]=value}return data}
async function applyContent(){try{const r=await fetch('/api/content',{cache:'no-store'});if(!r.ok)return;const b=await r.json();sourceRU=b.content||{};sourceEN=b.content_en||{};putContent(localizedContent())}catch(e){console.warn('Content service is unavailable',e)}}
function makeEventCard(ev){const en=window.NOVAI18N?.language==='en';let a=document.createElement('a');a.className='live-event';a.href='/events.html#event-'+ev.id;let im=document.createElement('img');im.src=ev.image_url||document.querySelector('.venue-img img')?.src||'';im.alt=(en?'Event poster: ':'Афиша: ')+(en?(ev.title_en||ev.title):ev.title);im.loading='lazy';a.append(im);let div=document.createElement('div');div.className='live-event-text';let small=document.createElement('span');small.className='eyebrow dim';small.textContent='NOVA / '+(en?({'zyb':'Zybitskaya','pob':'Pobediteley','east':'Vostok'}[ev.venue]||'Minsk'):({'zyb':'Зыбицкая','pob':'Победителей','east':'Восток'}[ev.venue]||'Минск'));let h=document.createElement('h3');h.textContent=en?(ev.title_en||ev.title):ev.title;let time=document.createElement('time');time.dateTime=ev.starts_at;time.textContent=eventTime(ev.starts_at)+' →';div.append(small,h,time);a.append(div);return a}
async function applyEvents(){const home=document.getElementById('upcoming-event');if(!home)return;try{if(!cachedEventRows){const r=await fetch('/api/events',{cache:'no-store'});if(!r.ok)return;cachedEventRows=(await r.json()).events||[]}const next=cachedEventRows.filter(e=>e.starts_at>=minskNow()).sort((a,b)=>a.starts_at.localeCompare(b.starts_at))[0];if(next){home.replaceChildren(makeEventCard(next))}else {home.innerHTML='<div class="events-empty"><span class="eyebrow dim">NOVA / АФИША</span><p>Скоро здесь появятся новые события.</p></div>'}}catch(e){console.warn('Events service is unavailable',e)}}
async function start(){await Promise.all([applyContent(),applyEvents()]);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();

// Keep venue detail screens and action links in sync with editorial changes.
const firstPutContent=putContent;
putContent=function(data){
 firstPutContent(data);
 if(typeof venues!=='undefined'){
  for(const [code,key] of [['zyb','zyb'],['pob','pob'],['east','east']]){
   for(const [suffix,prop] of [['subtitle','sub'],['desc','desc'],['second','second'],['features','features']]){const value=data['venue_'+key+'_'+suffix];if(value!==undefined)venues[code][prop]=value}for(const [idx,imageKey] of [[0,'gallery_'+key+'_1_image'],[1,'gallery_'+key+'_2_image']]){if(data[imageKey]&&venues[code].gallery)venues[code].gallery[idx]=data[imageKey]}
   if(data['venue_'+key+'_image'])venues[code].photo=data['venue_'+key+'_image'];
  }
 }
};
const originalShowModal=window.showModal;
if(typeof originalShowModal==='function'){
 window.showModal=function(kind,venue){
  const key=venue||(typeof selected!=='undefined'?selected:'');
  const content=window.NOVA_CONTENT||{};
  if(kind==='menu-location'&&key&&content['menu_'+key]){
   window.open(content['menu_'+key],'_blank','noopener,noreferrer');return;
  }
  originalShowModal(kind,venue);
  if(kind==='contacts'&&key){
   const el=document.getElementById('modal-body')||document.querySelector('.modal-body');
   if(!el)return;
   const address=content['address_'+key],phone=content['phone_'+key],instagram=content['instagram_'+key],telegram=content['telegram_'+key];
   if(![address,phone,instagram,telegram].some(Boolean))return;
   el.querySelectorAll('.intro,.demo-note').forEach(x=>x.remove());
   let panel=document.createElement('div');panel.className='contact-actual';
   const row=(label,value,href)=>{if(!value)return;let outer=document.createElement('div');outer.className='contact-actual-row';let small=document.createElement('span');small.textContent=label;let body=href?document.createElement('a'):document.createElement('p');body.textContent=value;if(href){body.href=href;body.target='_blank';body.rel='noopener noreferrer'}outer.append(small,body);panel.append(outer)};
   row('Адрес',address);row('Телефон',phone,phone?'tel:'+phone.replace(/[^+\d]/g,''):null);row('Instagram','Открыть Instagram ↗',instagram);row('Telegram','Открыть Telegram ↗',telegram);
   el.append(panel);
  }
 }
}

document.addEventListener('nova:languagechange',()=>{
 putContent(localizedContent());
 if(typeof selected!=='undefined'&&selected&&typeof venues!=='undefined'&&venues[selected]){
  const v=venues[selected];const d=document.getElementById('detail');
  if(d){const detailTitle=d.querySelector('.detail-left h1'),sub=d.querySelector('.detail-left .subtitle'),desc=d.querySelector('.detail-left p.text'),second=d.querySelector('.detail-bottom p');
   if(detailTitle)detailTitle.textContent=window.NOVAI18N?.language==='en'?window.NOVAI18N.translate(v.name):v.name;
   if(sub)sub.textContent=v.sub;if(desc)desc.textContent=v.desc;if(second)second.textContent=v.second;
  }
 }
 applyEvents();
});