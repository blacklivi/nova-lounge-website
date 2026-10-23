// NOVA bilingual events list; content translations are persisted server-side.
function minskNow(){return new Date(Date.now()+3*3600*1000).toISOString().slice(0,16)}
function language(){return window.NOVAI18N?.language==='en'?'en':'ru'}
function fmt(s){const d=new Date(s+':00+03:00');return new Intl.DateTimeFormat(language()==='en'?'en-GB':'ru-RU',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Minsk'}).format(d)}
const VENUE_NAMES={ru:{zyb:'Зыбицкая',pob:'Победителей',east:'Восток'},en:{zyb:'Zybitskaya',pob:'Pobediteley',east:'Vostok'}};
function card(e){const en=language()==='en';const a=document.createElement('article');a.className='e-card';a.id='event-'+e.id;
 if(e.image_url){const img=document.createElement('img');img.loading='lazy';img.src=e.image_url;img.alt=(en?'Event poster: ':'Афиша ')+(en?(e.title_en||e.title):e.title);a.append(img)}
 const box=document.createElement('div');box.className='e-card-info';
 const time=document.createElement('time');time.dateTime=e.starts_at;time.textContent=fmt(e.starts_at)+(en?' / Minsk':' / Минск');
 const h=document.createElement('h3');h.textContent=en?(e.title_en||e.title):e.title;
 const p=document.createElement('p');p.textContent=en?(e.description_en||e.description||''):(e.description||'');
 const loc=document.createElement('div');loc.className='venue';loc.textContent='NOVA / '+(VENUE_NAMES[language()][e.venue]||(en?'Minsk':'Минск'));
 box.append(time,h,p,loc);a.append(box);return a}
function empty(t){const e=document.createElement('div');e.className='e-empty';e.textContent=t;return e}
let cachedEvents=null;
async function showEvents(){
 const future=document.getElementById('future'),archive=document.getElementById('archive');if(!future||!archive)return;
 try{
  if(!cachedEvents){const r=await fetch('/api/events',{cache:'no-store'});if(!r.ok)throw Error('fetch');cachedEvents=(await r.json()).events||[]}
  const now=minskNow(),en=language()==='en';
  const upcoming=cachedEvents.filter(x=>x.starts_at>=now).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
  const past=cachedEvents.filter(x=>x.starts_at<now).sort((a,b)=>b.starts_at.localeCompare(a.starts_at));
  future.replaceChildren(...(upcoming.length?upcoming.map(card):[empty(en?'No upcoming events announced yet.':'Сейчас нет анонсированных мероприятий.')]));
  archive.replaceChildren(...(past.length?past.map(card):[empty(en?'No past events yet.':'Архив мероприятий пока пуст.')]));
  if(location.hash)document.getElementById(location.hash.slice(1))?.scrollIntoView();
 }catch(e){future.replaceChildren(empty(language()==='en'?'Could not load events.':'Не удалось загрузить афишу.'));archive.replaceChildren(empty(language()==='en'?'Archive temporarily unavailable.':'Архив временно недоступен.'))}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',showEvents);else showEvents();
document.addEventListener('nova:languagechange',showEvents);
