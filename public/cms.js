// Read-only site content. Admin edits are stored in D1 and images in R2.
const txt=s=>String(s||'');
function eventTime(v){const d=new Date(v+':00+03:00');return Number.isNaN(d.getTime())?v:new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Minsk'}).format(d)}
function minskNow(){return new Date(Date.now()+3*3600*1000).toISOString().slice(0,16)}
function putContent(data){for(const [key,value] of Object.entries(data||{})){
 document.querySelectorAll('[data-content="'+key+'"]').forEach(el=>{el.textContent=value});
 document.querySelectorAll('[data-image="'+key+'"]').forEach(img=>{if(value&&(/^\/media\/[\w.-]+$/.test(value)))img.src=value});
}window.NOVA_CONTENT=data||{};
}
async function applyContent(){try{const r=await fetch('/api/content',{cache:'no-store'});if(!r.ok)return;const b=await r.json();putContent(b.content)}catch(e){console.warn('Content service is unavailable',e)}}
function makeEventCard(ev){let a=document.createElement('a');a.className='live-event';a.href='/events.html#event-'+ev.id;let im=document.createElement('img');im.src=ev.image_url||document.querySelector('.venue-img img')?.src||'';im.alt='Афиша: '+ev.title;im.loading='lazy';a.append(im);let div=document.createElement('div');div.className='live-event-text';let small=document.createElement('span');small.className='eyebrow dim';small.textContent='NOVA / '+({'zyb':'Зыбицкая','pob':'Победителей','east':'Восток'}[ev.venue]||'Минск');let h=document.createElement('h3');h.textContent=ev.title;let time=document.createElement('time');time.dateTime=ev.starts_at;time.textContent=eventTime(ev.starts_at)+' →';div.append(small,h,time);a.append(div);return a}
async function applyEvents(){const home=document.getElementById('upcoming-event');if(!home)return;try{const r=await fetch('/api/events',{cache:'no-store'});if(!r.ok)return;const b=await r.json();const next=(b.events||[]).filter(e=>e.starts_at>=minskNow()).sort((a,b)=>a.starts_at.localeCompare(b.starts_at))[0];if(next){home.replaceChildren(makeEventCard(next))}else {home.innerHTML='<div class="events-empty"><span class="eyebrow dim">NOVA / АФИША</span><p>Скоро здесь появятся новые события.</p></div>'}}catch(e){console.warn('Events service is unavailable',e)}}
async function start(){await Promise.all([applyContent(),applyEvents()]);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
