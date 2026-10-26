import {escapeHTML as esc, typography, cleanPhone, validPhone, minskNow, splitEvents, safeURL, localImage, localizedValue} from './core.js';
import {enhanceBookingSelects} from './booking-selects.js';
import {enhanceBookingDate} from './booking-date.js';
import {initMotionLab, enterMotionHome} from './motion-lab.js';
const app = document.querySelector('#app');
const isEvents = document.body.dataset.page === 'events';
const ids = ['zyb','pob','east'];
const slugs={zyb:'zybitskaya',pob:'pobediteley',east:'vostok'};
const paths=Object.fromEntries(Object.entries(slugs).map(([id,slug])=>[slug,id]));
const venueURL=id=>'/spaces/'+slugs[id];
const names = {ru:{zyb:'Зыбицкая',pob:'Победителей',east:'Восток'},en:{zyb:'Zybitskaya',pob:'Pobediteley',east:'Vostok'}};
let language = 'ru';
try { language = localStorage.getItem('nova-language') === 'en' ? 'en' : 'ru'; } catch {}
let defaults = {content:{},content_en:{}}, source = {}, events = [], contentFailed = false, eventsFailed = false, eventsLoaded = false;
let selected = null, lastFocus = null, modalKind = '', modalVenue = '', drawerOpen = false;
// Keep keyboard focus restoration accessible without leaving a focus ring after touch taps.
let keyboardModalInteraction = false;
document.addEventListener('pointerdown',()=>{keyboardModalInteraction=false;},{capture:true});
document.addEventListener('touchstart',()=>{keyboardModalInteraction=false;},{capture:true,passive:true});
document.addEventListener('keydown',e=>{if(['Tab','Enter',' ','Escape'].includes(e.key))keyboardModalInteraction=true;},{capture:true});
const t = (ru,en) => language === 'en' ? en : ru;
const text = value => esc(typography(value,language));
const name = id => names[language][id] || 'NOVA';
const value = key => localizedValue(key,language,defaults,source);
const content = (key, fallback='') => text(value(key) || fallback);
const media = key => localImage(value(key)) || localImage(defaults.content[key]);
const arrow = '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h17m-7-7 7 7-7 7"/></svg>';
const bookingLabel = () => t('Забронировать стол','Reserve a table');
const image = (key,alt,priority=false) => `<img data-image="${key}" src="${esc(media(key))}?v=visual-2" alt="${text(alt)}" ${priority?'fetchpriority="high"':'loading="lazy"'} decoding="async" width="900" height="900">`;
const languages = () => `<div class="language" role="group" aria-label="${t('Язык сайта','Site language')}">${['ru','en'].map(l=>`<button type="button" data-language="${l}" aria-pressed="${l===language}" aria-label="${l==='ru'?'Русский язык':'English language'}">${l.toUpperCase()}</button>`).join('')}</div>`;
const nav = () => `<a href="/#venues" data-home="venues">${t('Пространства','Spaces')}</a><a href="/events" ${isEvents?'aria-current="page"':''}>${t('События','Events')}</a><a href="/#about" data-home="about">${t('О нас','About')}</a><a href="#contacts">${t('Контакты','Contacts')}</a>`;
function header(){return `<a class="skip" href="#main">${t('К содержимому','Skip to content')}</a><header class="site-header"><a class="brand" href="/" aria-label="${t('NOVA — на главную','NOVA — home')}">NOVA</a><nav class="main-nav" aria-label="${t('Основная навигация','Main navigation')}">${nav()}</nav><div class="header-side">${languages()}<button type="button" class="button header-book" data-modal="booking">${bookingLabel()}</button><button type="button" class="menu-toggle" data-drawer aria-controls="drawer" aria-expanded="false" aria-label="${t('Открыть меню','Open menu')}"><span></span><span></span></button></div></header>`;}
const instagramMark='<svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.6" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg>';
const locationMark='<svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.7"/></svg>';
function contactLinks(id){
 const phone=value('phone_'+id), instagram=safeURL(value('instagram_'+id)), telegram=safeURL(value('telegram_'+id)), route=safeURL(value('map_'+id));
 return `${phone&&validPhone(phone)?`<a class="footer-phone" href="tel:${esc(phone.replace(/[^+\d]/g,''))}">${text(phone)}</a>`:''}${instagram||telegram||route?`<div class="footer-socials">${instagram?`<a class="footer-social-icon" href="${esc(instagram)}" target="_blank" rel="noopener noreferrer" aria-label="Instagram NOVA ${name(id)}" title="Instagram">${instagramMark}<span class="sr-only">Instagram</span></a>`:''}${telegram?`<a class="footer-social-text" href="${esc(telegram)}" target="_blank" rel="noopener noreferrer">Telegram</a>`:''}${route?`<a class="footer-route footer-social-icon" href="${esc(route)}" target="_blank" rel="noopener noreferrer" aria-label="${t('Показать NOVA на карте','View NOVA on map')} ${name(id)}" title="${t('На карте','View on map')}">${locationMark}</a>`:''}</div>`:''}`;
}
function footer(){return `<footer class="site-footer" id="contacts"><div class="footer-top"><div><a class="brand" href="/">NOVA</a><p data-content="footer_tagline">${content('footer_tagline')}</p></div></div><div class="footer-locations">${ids.map(id=>`<div class="footer-location"><h3><a href="${venueURL(id)}" data-place="${id}">NOVA / ${name(id)}</a></h3>${value('address_'+id)?`<p class="venue-address">${content('address_'+id)}</p>`:''}${value('hours_'+id)?`<p class="venue-hours">${content('hours_'+id)}</p>`:''}${contactLinks(id)}${!['address_','phone_','instagram_','telegram_','hours_','map_'].some(k=>value(k+id))?`<p class="muted">${t('Контакты уточняются','Contact details coming soon')}</p>`:''}</div>`).join('')}</div><div class="footer-bottom"><span>NOVA · MINSK</span><span>${t('Демонстрационная версия · заявки не отправляются','Demo website · booking requests are not sent')}</span></div></footer>`;}
function layers(){return `<aside id="drawer" class="drawer" inert aria-hidden="true" aria-label="${t('Мобильная навигация','Mobile navigation')}"><nav>${nav()}</nav><button type="button" class="button" data-modal="booking">${bookingLabel()}</button><p>MINSK · LOUNGE CAFÉ</p></aside><div class="mobile-cta"><button class="button" data-modal="booking">${bookingLabel()}</button></div><button class="to-top" data-top hidden aria-label="${t('Наверх','Back to top')}">${arrow}</button><dialog class="modal" aria-labelledby="modal-title"><div class="modal-shell"><div class="modal-top"><span class="eyebrow">NOVA / <span id="modal-caption">MINSK</span></span><button class="close" data-close aria-label="${t('Закрыть окно','Close dialog')}">×</button></div><div id="modal-body"></div></div></dialog>`;}
function demoEvents(){
 // Presentation-only sample events; nothing is written to D1.
 const base=minskNow().slice(0,10);
 const at=(days,time)=>{
  const date=new Date(base+'T12:00:00Z');
  date.setUTCDate(date.getUTCDate()+days);
  return date.toISOString().slice(0,10)+'T'+time;
 };
 return [
  {id:'demo-after-dark',demo:true,published:true,venue:'zyb',starts_at:at(5,'21:00'),title:'NOVA AFTER DARK',title_en:'NOVA AFTER DARK',description:'Музыка, городской ритм и атмосфера Зыбицкой. Демонстрационный пример.',description_en:'Music, city nights and the atmosphere of Zybitskaya. Sample only.',image_url:media('venue_zyb_image')},
  {id:'demo-around-table',demo:true,published:true,venue:'pob',starts_at:at(11,'19:00'),title:'ЗА ОДНИМ СТОЛОМ',title_en:'AROUND THE TABLE',description:'Большие компании, разговоры и долгий вечер вместе. Пример будущей афиши.',description_en:'Good company, conversations and a long evening together. Example poster.',image_url:media('venue_pob_image')},
  {id:'demo-slow-sunday',demo:true,published:true,venue:'east',starts_at:at(18,'18:00'),title:'МЕДЛЕННОЕ ВОСКРЕСЕНЬЕ',title_en:'SLOW SUNDAY',description:'Спокойная музыка, кухня и время для себя. Макет события.',description_en:'Unhurried music, good food and time to unwind. Concept event.',image_url:media('venue_east_image')},
  {id:'demo-friday-frequency',demo:true,published:true,venue:'zyb',starts_at:at(25,'20:30'),title:'FRIDAY FREQUENCY',title_en:'FRIDAY FREQUENCY',description:'Вечер музыки и встреч в пространстве NOVA. Демонстрационный анонс.',description_en:'A night of music and people at NOVA. Sample event only.',image_url:media('gallery_zyb_1_image')},
  {id:'demo-jazz-evening',demo:true,published:true,venue:'pob',starts_at:at(-10,'20:00'),title:'ДЖАЗ И РАЗГОВОРЫ',title_en:'JAZZ & CONVERSATIONS',description:'Пример прошедшего события в архиве NOVA.',description_en:'An example of a past event in the NOVA archive.',image_url:media('gallery_pob_1_image')},
  {id:'demo-kitchen-details',demo:true,published:true,venue:'east',starts_at:at(-25,'19:30'),title:'ВКУС В ДЕТАЛЯХ',title_en:'DETAILS OF TASTE',description:'Демонстрация архивной карточки гастрономического вечера.',description_en:'Sample archive card for a food-focused evening.',image_url:media('story_image')}
 ];
}
function displayEvents(){
 // Show examples only if no real published upcoming event is available.
 // Past real events stay in the archive; demos keep the upcoming section populated.
 // Do not flash sample posters while an existing real event is still loading.
 if(!eventsLoaded&&!eventsFailed)return [];
 if(splitEvents(events).upcoming.length)return events;
 const samples=demoEvents();
 return events.length?[...events,...splitEvents(samples).upcoming]:samples;
}
function eventCard(e,home=false){
 const title=language==='en'?(e.title_en||t('','Event — translation pending')):e.title;
 const desc=language==='en'?(e.description_en||''):e.description;
 const date=new Date(e.starts_at+':00+03:00');
 const when=new Intl.DateTimeFormat(language==='en'?'en-GB':'ru-RU',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Minsk'}).format(date);
 const poster=localImage(e.image_url);
 const pic=poster?e.demo?`<div class="event-media"><img src="${esc(poster)}" alt="${text(title)}" loading="lazy" width="600" height="800"><span class="demo-poster-label">${t('ПРИМЕР АФИШИ','SAMPLE POSTER')}</span></div>`:`<img src="${esc(poster)}" alt="${text(title)}" loading="lazy" width="600" height="800">`:'';
 return `<${home?'a':'article'} ${home?`href="/events#event-${esc(e.id)}"`: `id="event-${esc(e.id)}"`} class="event-card ${poster?'':'no-image'} ${e.demo?'is-demo':''}">${pic}<div class="event-info">${e.demo?`<span class="event-demo-tag">${t('ДЕМО · НЕ РЕАЛЬНОЕ СОБЫТИЕ','DEMO · NOT A REAL EVENT')}</span>`:''}<time datetime="${esc(e.starts_at)}:00+03:00">${text(when)} · ${t('Минск','Minsk')}</time><h3>${text(title)}</h3>${!home&&desc?`<p>${text(desc)}</p>`:''}<div class="event-location">NOVA / ${name(e.venue)}</div></div></${home?'a':'article'}>`;
}
function home(){const next=splitEvents(displayEvents()).upcoming[0];return `<section class="hero" id="top"><div class="hero-copy"><span class="eyebrow" data-content="hero_kicker">${content('hero_kicker')}</span><h1>NOVA</h1><p class="hero-tagline" data-content="hero_tagline">${content('hero_tagline')}</p></div><div class="hero-photo">${image('hero_image',t('Интерьер и коктейль — концептуальное изображение','Interior and cocktail — concept image'),true)}<div class="photo-side">${t('Еда<br>Люди<br>Музыка<br>Атмосфера','Food<br>People<br>Music<br>Atmosphere')}</div></div></section><section class="venues" id="venues" aria-labelledby="venues-heading"><h2 class="venues-heading" id="venues-heading">${t('ВЫБРАТЬ ЗАВЕДЕНИЕ','EXPLORE OUR SPACES')}</h2>${ids.map(id=>`<a class="venue-card" href="${venueURL(id)}" data-place="${id}"><div class="venue-img">${image('venue_'+id+'_image',t('Концепция пространства ','Location concept: ')+name(id))}</div><div class="venue-foot"><h3 class="venue-title">${name(id)}</h3><p class="venue-description" data-content="venue_${id}_subtitle">${content('venue_'+id+'_subtitle')}</p></div></a>`).join('')}</section><section class="story" id="about"><div class="story-copy"><span class="eyebrow muted" data-content="story_kicker">${content('story_kicker')}</span><h2 data-content="story_title">${content('story_title')}</h2><p data-content="story_description">${content('story_description')}</p><button class="text-link" data-modal="menu">${t('Посмотреть меню','View the menu')}</button></div><figure class="story-photo">${image('story_image',t('Подача блюда — демонстрационное изображение','Food presentation — concept image'))}<figcaption class="image-note" data-content="media_note">${content('media_note')}</figcaption></figure></section><section class="home-events"><a class="section-link" href="/events"><h2>${t('События','Events')}</h2>${arrow}</a><div>${next?eventCard(next,true)+(next.demo?`<p class="demo-note">${t('Пример оформления. Мероприятие не проводится.','Design preview only. This event is not scheduled.')}</p>`:''):`<p class="event-empty">${!eventsLoaded&&!eventsFailed?t('Загружаем афишу…','Loading events…'):t('Афиша пока пуста.','No events yet.')}</p>`}</div></section><section class="book-strip" id="booking"><div class="book-image">${image('booking_image',t('Детали интерьера — концепция','Interior details — concept image'))}</div><button class="book-main" type="button" data-modal="booking"><span class="book-welcome">${t('Мы с нетерпением ждём встречи с вами.','We look forward to seeing you.')}</span><span class="book-cta"><span data-content="booking_title">${content('booking_title')}</span><svg class="book-cta-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></span></button></section>`;}
function detail(id){return `<article class="detail"><a href="#venues" data-home="venues" class="detail-back">${arrow}${t('Все пространства NOVA','All NOVA spaces')}</a><div class="detail-grid"><div class="detail-copy"><span class="eyebrow muted">NOVA / MINSK</span><h1>${name(id)}</h1><div class="subtitle" data-content="venue_${id}_subtitle">${content('venue_'+id+'_subtitle')}</div><p data-content="venue_${id}_desc">${content('venue_'+id+'_desc',t('Описание готовится.','Details coming soon.'))}</p><div class="detail-actions"><button class="button" data-modal="booking" data-venue="${id}">${bookingLabel()}</button><button class="button secondary" data-modal="menu-location" data-venue="${id}">${t('Посмотреть меню','View the menu')}</button></div></div><div class="detail-image">${image('venue_'+id+'_image',t('Концепция пространства ','Location concept: ')+name(id),true)}</div></div><div class="detail-bottom"><div><span class="eyebrow muted">${t('Атмосфера NOVA','NOVA atmosphere')}</span><h2>${t('В своём ритме.','Your kind of evening.')}</h2><p data-content="venue_${id}_second">${content('venue_'+id+'_second')}</p><p class="features" data-content="venue_${id}_features">${content('venue_'+id+'_features')}</p><button class="text-link" data-modal="contacts" data-venue="${id}">${t('Контакты и расположение','Contacts and directions')}</button></div><div><div class="detail-gallery">${[1,2].map(i=>image(`gallery_${id}_${i}_image`,t('Демонстрационное изображение','Concept image'))).join('')}</div><p class="image-note">${content('media_note')}</p></div></div></article>`;}
function eventsPage(){const visible=displayEvents(),demo=visible.some(e=>e.demo);const {upcoming,past}=splitEvents(visible);return `<div class="events-page"><section class="events-intro"><span class="eyebrow muted">NOVA / MINSK</span><h1>${t('События','Events')}</h1><p>${t('Встречи, музыка и вечера, которые хочется повторить.','Music, good company and nights worth remembering.')}</p>${demo?`<p class="events-demo-notice" role="note">${t('ДЕМОНСТРАЦИОННАЯ АФИША — названия, даты и события вымышлены. Когда появится предстоящее опубликованное мероприятие, примеры автоматически исчезнут.','SAMPLE EVENT LINEUP — all titles, dates and events are fictional. Examples automatically disappear when an upcoming real event is published.')}</p>`:''}</section>${[[upcoming,t('Ближайшие','Coming up'),'future'],[past,t('Архив','Archive'),'archive']].map(([list,title,id])=>`<section class="events-section ${id}"><h2>${title}</h2><div class="events-list" id="${id}">${list.length?list.map(e=>eventCard(e)).join(''):`<p class="event-empty">${!eventsLoaded&&!eventsFailed?t('Загружаем афишу…','Loading events…'):id==='future'?t('Сейчас нет анонсированных мероприятий.','No upcoming events announced yet.'):t('Архив мероприятий пока пуст.','No past events yet.')}</p>`}</div></section>`).join('')}</div>`;}
function render(){
 document.documentElement.lang=language;
 selected=!isEvents?(paths[location.pathname.split('/')[2]]||(ids.includes(location.hash.slice(1))?location.hash.slice(1):null)):null;
 const titles={
 zyb:['NOVA Зыбицкая — лаунж-кафе и DJ-вечеринки в Минске','NOVA Zybitskaya — DJ nights & lounge café in Minsk'],
 pob:['NOVA Победителей — лаунж-кафе на проспекте Победителей, 89/3','NOVA Pobediteley — lounge café in Minsk'],
 east:['NOVA Восток — лаунж-кафе на Франциска Скорины, 2','NOVA Vostok — lounge café in Minsk']
};
const descriptions={
 zyb:['NOVA Зыбицкая, 2: ланчи, кухня, DJ-сеты и вечеринки в центре Минска. Телефон +375 25 722-33-33.','NOVA at 2 Zybitskaya Street, Minsk: food, DJ sets and late-night events. Call +375 25 722-33-33.'],
 pob:['NOVA Победителей, 89/3: кухня, встречи, настольные игры и вечерняя музыка. Телефон +375 25 644-33-33.','NOVA at 89/3 Pobediteley Avenue, Minsk: food, board games and good company. Call +375 25 644-33-33.'],
 east:['NOVA Восток, ул. Франциска Скорины, 2: ланчи, кухня и вечера в своей атмосфере. Телефон +375 44 791-33-33.','NOVA Vostok at 2 Francyska Skaryny Street, Minsk: food and relaxed evenings. Call +375 44 791-33-33.']
};
document.title=isEvents?t('События — NOVA Minsk','Events — NOVA Minsk'):selected?titles[selected][language==='en'?1:0]:t('NOVA — три лаунж-кафе в Минске','NOVA — Three lounge cafés in Minsk');
const meta=document.querySelector('meta[name="description"]');
if(meta)meta.content=selected?descriptions[selected][language==='en'?1:0]:isEvents?t('Афиша NOVA в Минске: DJ-сеты, вечеринки и ближайшие события.','NOVA events in Minsk: parties, DJ sets and upcoming nights.'):t('NOVA — три лаунж-кафе в Минске: Зыбицкая, Победителей и Восток. Кухня, ланчи, вечерние встречи и события.','NOVA — three lounge cafés in Minsk: Zybitskaya, Pobediteley and Vostok. Food, music and gatherings.');
const canonical=document.querySelector('link[rel="canonical"]');if(canonical)canonical.href=location.origin+(isEvents?'/events':selected?venueURL(selected):'/');
 app.innerHTML=header()+`<main id="main" tabindex="-1">${isEvents?eventsPage():selected?detail(selected):home()}</main>`+footer()+layers();
 app.querySelector('dialog').addEventListener('cancel',e=>{e.preventDefault();closeModal();});
 app.querySelector('dialog').addEventListener('close',()=>{document.querySelector('dialog')?.classList.remove('is-visible');});
 app.querySelector('dialog').addEventListener('click',e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
 updateTop();
 initMotionLab();
}
// Coordinated, bounded-duration anchor scrolling. Native smooth scroll can take
// much longer for deep links and doesn't reliably account for the sticky header.
let scrollFrame=0;
function cancelGuidedScroll(){if(scrollFrame){cancelAnimationFrame(scrollFrame);scrollFrame=0;}}
function scrollToPosition(y,instant=false){
 cancelGuidedScroll();
 const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
 const end=Math.max(0,Math.min(max,Math.round(y)));
 const start=scrollY,delta=end-start,distance=Math.abs(delta);
 if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches||distance<3){
  window.scrollTo({top:end,behavior:'auto'});
  updateTop();return;
 }
 const duration=Math.min(680,330+distance*.065);
 const beginning=performance.now();
 const tick=now=>{
  const progress=Math.min(1,(now-beginning)/duration);
  const eased=(1-Math.cos(Math.PI*progress))/2;
  window.scrollTo({top:start+delta*eased,behavior:'auto'});
  if(progress<1)scrollFrame=requestAnimationFrame(tick);
  else{scrollFrame=0;updateTop();}
 };
 scrollFrame=requestAnimationFrame(tick);
}
function scrollToSection(id,instant=false){
 const el=document.getElementById(id);
 if(!el)return false;
 const top=id==='top'?0:el.getBoundingClientRect().top+scrollY-(document.querySelector('.site-header')?.getBoundingClientRect().height||0)-12;
 scrollToPosition(top,instant);return true;
}
function scrollToHash(instant=false){
 const hash=location.hash;
 if(hash.length>1)scrollToSection(decodeURIComponent(hash.slice(1)),instant);
}
// Allow visitors to interrupt a programmed scroll with ordinary touch, wheel or keyboard input.
document.addEventListener('touchstart',cancelGuidedScroll,{passive:true});
document.addEventListener('wheel',cancelGuidedScroll,{passive:true});
document.addEventListener('keydown',e=>{
 if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key))cancelGuidedScroll();
});
function setDrawer(open){
 drawerOpen=open;
 const toggle=document.querySelector('[data-drawer]');
 const drawer=document.querySelector('#drawer');
 if(!toggle||!drawer)return;
 toggle.setAttribute('aria-expanded',String(open));
 toggle.setAttribute('aria-label',open?t('Закрыть меню','Close menu'):t('Открыть меню','Open menu'));
 drawer.classList.toggle('is-open',open);
 drawer.inert=!open;
 drawer.setAttribute('aria-hidden',String(!open));
 document.body.classList.toggle('lock',open);
 for(const selector of ['main','.site-footer','.mobile-cta']){const el=document.querySelector(selector);if(el)el.inert=open;}
}
let modalCloseTimer=null;
function closeModal(instant=false){
 const dialog=document.querySelector('dialog');
 if(!dialog)return;
 if(modalCloseTimer!==null){
  if(!instant)return;
  clearTimeout(modalCloseTimer);modalCloseTimer=null;
 }
 const previousFocus=lastFocus;
 dialog.classList.remove('is-visible');
 const finish=()=>{
  modalCloseTimer=null;
  if(dialog.open)dialog.close();
  if(!drawerOpen)document.body.classList.remove('lock');
  modalKind='';
  lastFocus=null;
  if(!previousFocus?.isConnected)return;
  if(keyboardModalInteraction){
   previousFocus.focus({preventScroll:true});
  }else{
   // Avoid the full-panel focus ring iOS Safari shows after touch dismissal.
   if(document.activeElement===previousFocus)previousFocus.blur();
   requestAnimationFrame(()=>{if(document.activeElement===previousFocus)previousFocus.blur();});
  }
 };
 if(dialog.open&&!instant&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  modalCloseTimer=setTimeout(finish,260);
 }else finish();
}
function contactPanel(id){const address=value('address_'+id),hours=value('hours_'+id),links=contactLinks(id);return `${address||hours||links?`<div class="contact-list">${address?`<div><h3>${t('Адрес','Address')}</h3><p>${text(address)}</p></div>`:''}${hours?`<div><h3>${t('Часы работы','Opening hours')}</h3><p class="venue-hours">${text(hours)}</p></div>`:''}${links}</div>`:`<p class="intro">${t('Контакты этого заведения ещё уточняются.','Contact details for this space are coming soon.')}</p>`}`;}
function openModal(kind,id=selected){
 if(drawerOpen)setDrawer(false);
 if(kind==='menu-location'){const url=safeURL(value('menu_'+id));if(url){window.open(url,'_blank','noopener,noreferrer');return;}}
 const dialog=document.querySelector('dialog');if(!dialog.open)lastFocus=document.activeElement;
 modalKind=kind;modalVenue=id||'';
 document.getElementById('modal-caption').textContent=id?name(id):'MINSK';
 const body=document.getElementById('modal-body');
 if(kind==='booking'){
 const day=minskNow().slice(0,10);
 body.innerHTML=`<h2 id="modal-title">${bookingLabel()}</h2><p class="intro">${t('Выберите время и количество гостей. Пока здесь можно только проверить данные заявки.','Choose a time and the number of guests. This demo lets you review the request only.')}</p><form id="book-form"><div class="form-fields"><div class="field full"><label for="venue">${t('Заведение','Space')}</label>${id?`<div class="venue-context">NOVA / ${name(id)}</div><input id="venue" type="hidden" name="venue" value="${id}">`:`<select id="venue" name="venue" required><option value="">${t('Выберите заведение','Choose a space')}</option>${ids.map(i=>`<option value="${i}">${name(i)}</option>`).join('')}</select>`}</div><div class="field"><label for="date">${t('Дата','Date')}</label><input id="date" name="date" type="date" value="${day}" min="${day}" required></div><div class="field"><label for="time">${t('Время','Time')}</label><select id="time" name="time" required>${Array.from({length:96},(_,i)=>{const slot=`${String(Math.floor(i/4)).padStart(2,'0')}:${String((i%4)*15).padStart(2,'0')}`;return `<option value="${slot}" ${slot==='19:00'?'selected':''}>${slot}</option>`}).join('')}</select></div><div class="field"><label for="guests">${t('Количество гостей','Guests')}</label><select id="guests" name="guests">${Array.from({length:16},(_,i)=>`<option ${i===1?'selected':''}>${i+1}</option>`).join('')}</select></div><div class="field"><label for="guest-name">${t('Ваше имя','Your name')}</label><input id="guest-name" name="name" autocomplete="name" maxlength="60" required></div><div class="field full"><label for="phone">${t('Номер телефона','Phone number')}</label><input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="30" placeholder="+375 29 123-45-67" aria-describedby="phone-error" required><p id="phone-error" class="form-error" role="status"></p></div></div><button type="submit" class="button form-submit">${t('Проверить заявку','Review request')}</button><p class="demo-note">${t('Демонстрационный режим: заявка не отправляется и не сохраняется. Не вводите реальные персональные данные для тестирования.','Demo mode: requests are not sent or saved. Please do not enter real personal information for testing.')}</p></form>`;
 body.querySelector('#phone').addEventListener('input',e=>{const input=e.target,pos=input.selectionStart,before=input.value;input.value=cleanPhone(before);if(before!==input.value){const next=cleanPhone(before.slice(0,pos)).length;input.setSelectionRange(next,next);}input.setCustomValidity('');document.getElementById('phone-error').textContent='';});
 enhanceBookingSelects(body.querySelector('form'),language);
 enhanceBookingDate(body.querySelector('form'),language);
 body.querySelector('form').addEventListener('submit',reviewBooking);
 }else if(kind==='menu'){
 body.innerHTML=`<h2 id="modal-title">${t('Меню NOVA','NOVA menus')}</h2><p class="intro">${t('У каждого пространства своё меню.','Each space has its own menu.')}</p><div class="modal-list">${ids.map(i=>`<button class="button secondary" data-modal="menu-location" data-venue="${i}">${name(i)}</button>`).join('')}</div>`;
 }else if(kind==='menu-location'){
 body.innerHTML=`<h2 id="modal-title">${t('Меню','Menu')} / ${name(id)}</h2><p class="intro">${t('Ссылка на меню этого заведения пока не подключена.','The menu for this space is coming soon.')}</p><button class="button secondary" data-close>${t('Закрыть','Close')}</button>`;
 }else if(kind==='contacts')body.innerHTML=`<h2 id="modal-title">${t('Контакты','Contacts')} / ${name(id)}</h2>${contactPanel(id)}`;
 if(modalCloseTimer!==null){clearTimeout(modalCloseTimer);modalCloseTimer=null;}
 dialog.classList.remove('is-visible');
 if(!dialog.open)dialog.showModal();
 document.body.classList.add('lock');
 // Force the closed visual state before the entrance transition starts.
 void dialog.offsetWidth;
 requestAnimationFrame(()=>{if(dialog.open)dialog.classList.add('is-visible');});
 // Move initial focus to the labelled dialog heading; avoid an autofocus ring on Close in iOS Safari.
 const heading=body.querySelector('#modal-title');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
}
function reviewBooking(e){
 e.preventDefault();const form=e.currentTarget,fd=new FormData(form),phone=form.elements.phone;
 if(!ids.includes(fd.get('venue'))){const btn=form.querySelector('.nova-select-trigger');if(btn){btn.setAttribute('aria-invalid','true');btn.focus()}else{form.elements.venue.setCustomValidity(t('Выберите заведение','Choose a space'));form.elements.venue.reportValidity()}return;}
 const bookingTime=String(fd.get('time')||'');
 if(!/^(?:[01]\d|2[0-3]):(?:00|15|30|45)$/.test(bookingTime)){
  const field=form.elements.time;field.setCustomValidity(t('Выберите время с шагом 15 минут.','Choose a time in 15-minute intervals.'));field.reportValidity();field.addEventListener('change',()=>field.setCustomValidity(''),{once:true});return;
 }
 if(!validPhone(phone.value)){const error=t('Введите корректный номер: от 7 до 15 цифр; +375 и 9 цифр для Беларуси.','Enter a valid number: 7–15 digits, or +375 followed by 9 digits for Belarus.');phone.setCustomValidity(error);document.getElementById('phone-error').textContent=error;phone.reportValidity();return;}
 const nameInput=form.elements.name;nameInput.addEventListener('input',()=>nameInput.setCustomValidity(''),{once:true});nameInput.setCustomValidity(nameInput.value.trim()?'':t('Введите имя.','Enter your name.'));if(!form.reportValidity())return;
 const dateTime=fd.get('date')+'T'+fd.get('time');if(dateTime<minskNow()){form.elements.time.setCustomValidity(t('Выберите время в будущем по Минску.','Choose a future time in Minsk.'));form.elements.time.reportValidity();form.elements.time.addEventListener('input',()=>form.elements.time.setCustomValidity(''),{once:true});form.elements.date.addEventListener('input',()=>form.elements.time.setCustomValidity(''),{once:true});return;}
 const fields=[[t('Заведение','Space'),name(fd.get('venue'))],[t('Дата','Date'),fd.get('date')],[t('Время · Минск','Time · Minsk'),fd.get('time')],[t('Гостей','Guests'),fd.get('guests')],[t('Имя','Name'),fd.get('name').trim()],[t('Телефон','Phone'),phone.value]];
 document.getElementById('modal-body').innerHTML=`<h2 id="modal-title" tabindex="-1">${t('Проверьте данные','Review your details')}</h2><dl class="summary">${fields.map(([k,v])=>`<dt>${text(k)}</dt><dd>${text(v)}</dd>`).join('')}</dl><p class="demo-note">${t('Это только предварительный просмотр. Сообщение никому не отправлено, бронь не оформлена, данные не сохранены.','This is a preview only. No message has been sent, no table is reserved, and the information is not saved.')}</p><button class="button form-submit" data-close>${t('Закрыть','Close')}</button>`;
 document.getElementById('modal-title').focus();modalKind='review';
}
function updateTop(){const button=document.querySelector('[data-top]');if(button)button.hidden=scrollY<600;}
function navigate(id){
 closeModal(true);
 if(drawerOpen)setDrawer(false);
 const place=ids.includes(id);
 const target=place?venueURL(id):id?'/#'+id:'/';
 const current=location.pathname+location.hash;
 if(current!==target)history.pushState({},'',target);
 // Keeping the home DOM intact prevents the visible jump before smooth scrolling.
 if(!place&&!selected){scrollToSection(id);return;}
 cancelGuidedScroll();
 render();
 window.scrollTo({top:0,behavior:'instant'});
 if(place){
  document.querySelector('main')?.classList.add('route-enter');
  document.querySelector('main')?.focus({preventScroll:true});
 }else if(id){
  scrollToSection(id);
 }
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button,a');if(!b)return;
 if(b.matches('[data-language]')){const next=b.dataset.language;if(next===language)return;const open=drawerOpen,kind=modalKind,id=modalVenue;language=next;try{localStorage.setItem('nova-language',language)}catch{}drawerOpen=false;document.body.classList.remove('lock');render();if(open)setDrawer(true);if(kind&&kind!=='review')openModal(kind,id);document.querySelector(`[data-language="${next}"]`)?.focus();return;}
 if(b.matches('[data-drawer]')){setDrawer(!drawerOpen);return;}
 if(b.matches('[data-modal]')){openModal(b.dataset.modal,b.dataset.venue||selected);return;}
 if(b.matches('[data-close]')){closeModal();return;}
 if(b.matches('[data-top]')){scrollToPosition(0);document.querySelector('.brand').focus({preventScroll:true});return;}
 if(b.matches('[data-place],[data-home]')&&!isEvents){e.preventDefault();navigate(b.dataset.place||b.dataset.home);return;}
 // Footer anchors work from both the home page and /events without a native snap.
 if(b.getAttribute('href')==='#contacts'){
  e.preventDefault();
  if(drawerOpen)setDrawer(false);
  if(location.hash!=='#contacts')history.pushState({},'','#contacts');
  scrollToSection('contacts');
  return;
 }
});
document.addEventListener('keydown',e=>{
 if(drawerOpen&&e.key==='Escape'){setDrawer(false);document.querySelector('[data-drawer]').focus();}
 if(drawerOpen&&e.key==='Tab'){const controls=[...document.querySelectorAll('.site-header button,.site-header a,#drawer a,#drawer button')].filter(x=>x.offsetParent!==null),first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
window.addEventListener('scroll',updateTop,{passive:true});
window.addEventListener('popstate',()=>{
 cancelGuidedScroll();
 closeModal(true);
 if(drawerOpen)setDrawer(false);
 // Going back between anchors on the same home page must not remount the page.
 const stillOnHome=!isEvents&&!selected&&location.pathname==='/';
 if(stillOnHome){
  if(location.hash)scrollToHash(true);
  else scrollToPosition(0,true);
  return;
 }
 render();
 if(location.hash)scrollToHash(true);
 else window.scrollTo({top:0,behavior:'auto'});
});
matchMedia('(min-width:901px)').addEventListener('change',e=>{if(e.matches&&drawerOpen)setDrawer(false);});
async function getJSON(url){
 const controller=new AbortController();
 const deadline=setTimeout(()=>controller.abort(),5000);
 try{
  const r=await fetch(url,{signal:controller.signal,cache:url.startsWith('/api/')?'no-store':'default'});
  if(!r.ok)throw Error(url+': '+r.status);
  return await r.json();
 }finally{clearTimeout(deadline)}
}
// Server-inlined defaults eliminate another network roundtrip before first paint.
// Direct .html asset requests retain the network fallback.
try {
 const inline=document.getElementById('nova-initial-defaults');
 defaults=inline?JSON.parse(inline.textContent):await getJSON('/content-defaults.json');
} catch {
 defaults=await getJSON('/content-defaults.json').catch(()=>({content:{},content_en:{}}));
}
const editorLoad=Promise.allSettled([
 getJSON('/api/content').then(data=>{source=data;}).catch(()=>{contentFailed=true;}),
 getJSON('/api/events').then(data=>{events=Array.isArray(data.events)?data.events:[];eventsLoaded=true;}).catch(()=>{eventsFailed=true;})
]);
let editorReady=false;
editorLoad.then(()=>{editorReady=true;});
// Do not hold the initial interactive screen hostage to a slow CMS request.
await Promise.race([editorLoad, new Promise(resolve=>setTimeout(resolve,750))]);
const pendingRefresh=!editorReady;
render();
scrollToHash(true);

const firstPaint=document.getElementById('nova-first-paint');
if(firstPaint) {
 // The actual first-paint hero already played the entrance animation.
 // Keep it visible until its sequence finishes; hand over to identical live UI.
 const elapsed=performance.now()-(window.__novaBootStarted||performance.now());
 const hold=Math.max(0,1710-elapsed);
 setTimeout(()=>{
  // Both heroes now have the same V-aligned grid and image scale. Reveal
  // the live DOM under the bootstrap while fading out only the top layer.
  document.documentElement.classList.remove('nova-booting');
  if(firstPaint.isConnected){
   firstPaint.classList.add('nova-boot-exit');
   setTimeout(()=>firstPaint.remove(),480);
  }
 }, matchMedia('(prefers-reduced-motion: reduce)').matches||location.hash?0:hold);
} else {
 document.documentElement.classList.remove('nova-booting');
 enterMotionHome();
}
if(pendingRefresh) {
 editorLoad.then(()=>{
  // Update CMS/event information without restarting the large hero animation.
  if(modalKind||drawerOpen)return;
  const stableHero=!isEvents&&location.pathname==='/'?document.querySelector('main .hero'):null;
  render();
  if(stableHero) {
   const freshHero=document.querySelector('main .hero');
   if(freshHero) {
    for(const field of ['hero_kicker','hero_tagline']){
     const oldNode=stableHero.querySelector('[data-content="'+field+'"]');
     const newNode=freshHero.querySelector('[data-content="'+field+'"]');
     if(oldNode&&newNode)oldNode.textContent=newNode.textContent;
    }
    const oldImage=stableHero.querySelector('[data-image="hero_image"]');
    const newImage=freshHero.querySelector('[data-image="hero_image"]');
    if(oldImage&&newImage&&oldImage.getAttribute('src')!==newImage.getAttribute('src'))oldImage.setAttribute('src',newImage.getAttribute('src'));
    freshHero.replaceWith(stableHero);
   }
  }
 });
}
if(contentFailed)console.warn('NOVA content unavailable; bundled defaults are displayed.');
