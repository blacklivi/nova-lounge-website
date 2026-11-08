import {escapeHTML as esc, typography, cleanPhone, validPhone, minskNow, splitEvents, safeURL, localImage, localizedValue} from './core.js';
import {enhanceBookingSelects} from './booking-selects.js';
import {enhanceBookingDate} from './booking-date.js';
import {EDITOR_BY_KEY,ICON_CHOICES} from './editor-schema.js';
const app = document.querySelector('#app');
const isEvents = document.body.dataset.page === 'events';
const eventVenueSlugs={hof:'zyb',pobediteley:'pob',vostok:'east'};
const scopedEventVenue=isEvents?(eventVenueSlugs[location.pathname.split('/')[2]]||null):null;
const venueEventURLs={zyb:'/events/hof',pob:'/events/pobediteley',east:'/events/vostok'};
const ids = ['zyb','pob','east'];
const slugs={zyb:'zybitskaya',pob:'pobediteley',east:'vostok'};
const paths=Object.fromEntries(Object.entries(slugs).map(([id,slug])=>[slug,id]));
const venueURL=id=>'/spaces/'+slugs[id];
const names = {ru:{zyb:'Зыбицкая',pob:'Победителей',east:'Восток'},en:{zyb:'Zybitskaya',pob:'Pobediteley',east:'Vostok'}};
let language = 'ru';
try { language = localStorage.getItem('nova-language') === 'en' ? 'en' : 'ru'; } catch {}
const editorParams=new URLSearchParams(location.search);
const isEditorPreview=editorParams.has('cms_preview')&&window.parent!==window;
if(isEditorPreview && ['ru','en'].includes(editorParams.get('editor_lang')))language=editorParams.get('editor_lang');
if(isEditorPreview)document.body.classList.add('cms-preview');
let defaults = {content:{},content_en:{}}, source = {}, events = [], contentFailed = false, eventsFailed = false, eventsLoaded = false;
let selected = null, lastFocus = null, modalKind = '', modalVenue = '', drawerOpen = false;
// Keep keyboard focus restoration accessible without leaving a focus ring after touch taps.
let keyboardModalInteraction = false;
document.addEventListener('pointerdown',()=>{keyboardModalInteraction=false;},{capture:true});
document.addEventListener('touchstart',()=>{keyboardModalInteraction=false;},{capture:true,passive:true});
document.addEventListener('keydown',e=>{if(['Tab','Enter',' ','Escape'].includes(e.key))keyboardModalInteraction=true;},{capture:true});
// Apply the same line-break protection to fixed UI copy and CMS copy.
const t = (ru,en) => typography(language === 'en' ? en : ru, language);
const text = value => esc(typography(value,language));
const name = id => text(value('venue_'+id+'_name') || names[language][id] || 'NOVA');
const brandName = id => id === 'zyb' ? 'HOF by NOVA' : 'NOVA / '+name(id);
const venueLabel = id => id === 'zyb' ? 'HOF by NOVA · '+name(id) : 'NOVA / '+name(id);
const value = key => localizedValue(key,language,defaults,source);

const editorValue=key=>{
 const spec=EDITOR_BY_KEY[key];
 const stored=value(key);
 return stored || (language==='en' ? (spec?.en||spec?.ru||'') : (spec?.ru||'')) || '';
};
const E=key=>text(editorValue(key));
function validCmsHref(link){
 if(typeof link!=='string'||!link||/[\\\u0000-\u001f\u007f]/.test(link))return false;
 if(/^#[A-Za-z0-9_-]+$/.test(link))return true;
 if(/^\/(?!\/)[A-Za-z0-9_/#?&.=%+~-]*$/.test(link)&&!/%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(link))return true;
 try{const url=new URL(link);return url.protocol==='https:'&&!url.username&&!url.password&&url.hostname.includes('.')}catch{return false}
}
const hrefFor=(key,alternative='/')=>{
 const val=editorValue(key)||alternative;
 return validCmsHref(val)?val:alternative;
};
const H=(key,alternative='/')=>esc(hrefFor(key,alternative));
const imageFor=(key,alternative='')=>{
 const value=editorValue(key)||alternative;
 return /^\/media\/[A-Za-z0-9_.-]+\.(?:svg|jpg|png|webp)$/.test(value)?esc(value):esc(alternative);
};
const editorAttribute=key=>EDITOR_BY_KEY[key]?' data-editor-key="'+key+'"':'';
const shown=key=>editorValue(key)!=='no';
const ICON_PATHS={
 'arrow-right':'<path d="M3 12h18m-7-7 7 7-7 7"/>',
 'arrow-up-right':'<path d="M5 19 19 5M8 5h11v11"/>',
 'chevron-right':'<path d="m9 18 6-6-6-6"/>',
 'external-link':'<path d="M14 4h6v6m0-6-9 9M20 14v6H4V4h6"/>',
 'calendar-days':'<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M7 3v4m10-4v4M3 10h18"/>',
 'map-pin':'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/>',
 'phone':'<path d="M6 3h4l2 5-2.5 2.5a17 17 0 0 0 5 5L17 13l4 2v5c-8 3-19-8-17-16z"/>',
 'instagram':'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17 7h.01"/>',
 'music-2':'<path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-3-3c2 0 3 1 3 3Zm12-2a3 3 0 1 1-3-3c2 0 3 1 3 3Z"/>',
 'utensils':'<path d="M4 3v7m4-7v7m-4 0h4m-2 0v11m9-18v18m0-18c6 1 6 9 0 9"/>'
};
function I(key,fallback='arrow-right'){
 const id=editorValue(key)||fallback;
 if(id==='none')return '';
 const path=ICON_PATHS[ICON_CHOICES.includes(id)?id:fallback]||ICON_PATHS['arrow-right'];
 return '<svg data-editor-icon="'+key+'" class="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
}

const content = (key, fallback='') => text(value(key) || fallback);
const media = key => localImage(value(key)) || localImage(defaults.content[key]);
const arrow = '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h17m-7-7 7 7-7 7"/></svg>';
const bookingLabel = () => E('global_booking_text');
const image = (key,alt,priority=false,fallbackKey='') => `<img data-image="${key}" src="${esc(media(key)||(fallbackKey?media(fallbackKey):''))}?v=visual-2" alt="${text(alt)}" ${priority?'fetchpriority="high"':'loading="lazy"'} decoding="async" width="900" height="900">`;
const languages = () => `<div class="language" role="group" aria-label="${t('Язык сайта','Site language')}">${['ru','en'].map(l=>`<button type="button" data-language="${l}" aria-pressed="${l===language}" aria-label="${l==='ru'?'Русский язык':'English language'}">${l.toUpperCase()}</button>`).join('')}</div>`;
const nav = () => `<a href="${H('nav_spaces_url','/#venues')}" ${hrefFor('nav_spaces_url','/#venues')==='/#venues'?'data-home="venues"':''} data-editor-key="nav_spaces_url">${E('nav_spaces_text')}</a><a href="${H('nav_events_url','/events')}" ${isEvents?'aria-current="page"':''} data-editor-key="nav_events_url">${E('nav_events_text')}</a><a href="${H('nav_about_url','/#about')}" ${hrefFor('nav_about_url','/#about')==='/#about'?'data-home="about"':''} data-editor-key="nav_about_url">${E('nav_about_text')}</a><a href="${H('nav_contacts_url','#contacts')}" data-editor-key="nav_contacts_url">${E('nav_contacts_text')}</a>`;
function header(){return `<a class="skip" href="#main">${t('К содержимому','Skip to content')}</a><header class="site-header"><a class="brand" href="${H('global_logo_url','/')}" data-editor-key="global_logo_url" aria-label="${t('NOVA — на главную','NOVA — home')}">${editorValue('global_logo_image')?'<img data-editor-key="global_logo_image" src="'+imageFor('global_logo_image')+'" alt="NOVA">':'NOVA'}</a><nav class="main-nav" aria-label="${t('Основная навигация','Main navigation')}">${nav()}</nav><div class="header-side">${languages()}<button type="button" class="button header-book" data-modal="booking">${bookingLabel()}</button><button type="button" class="menu-toggle" data-drawer aria-controls="drawer" aria-expanded="false" aria-label="${t('Открыть меню','Open menu')}"><span></span><span></span></button></div></header>`;}
const instagramMark=()=>I('global_instagram_icon','instagram').replace('class="arrow"','class="footer-icon"');
const locationMark=()=>I('global_map_icon','map-pin').replace('class="arrow"','class="footer-icon"');
function contactLinks(id){
 const phone=value('phone_'+id), instagram=id==='zyb'?'':safeURL(value('instagram_'+id)), telegram=safeURL(value('telegram_'+id)), route=safeURL(value('map_'+id));
 return `${phone&&validPhone(phone)?`<a class="footer-phone" href="tel:${esc(phone.replace(/[^+\d]/g,''))}">${text(phone)}</a>`:''}${instagram||telegram||route?`<div class="footer-socials">${instagram?`<a class="footer-social-icon" href="${esc(instagram)}" target="_blank" rel="noopener noreferrer" aria-label="Instagram NOVA ${name(id)}" title="Instagram">${instagramMark()}<span class="sr-only">Instagram</span></a>`:''}${telegram?`<a class="footer-social-text" href="${esc(telegram)}" target="_blank" rel="noopener noreferrer">Telegram</a>`:''}${route?`<a class="footer-route footer-social-icon" href="${esc(route)}" target="_blank" rel="noopener noreferrer" aria-label="${t('Показать NOVA на карте','View NOVA on map')} ${name(id)}" title="${t('На карте','View on map')}">${locationMark()}</a>`:''}</div>`:''}`;
}
function footer(){return `<footer class="site-footer" id="contacts"><div class="footer-top"><div><a class="brand" href="${H('global_logo_url','/')}" data-editor-key="global_logo_url">${E('footer_logo_text')}</a><p data-content="footer_tagline">${content('footer_tagline')}</p></div></div><div class="footer-locations">${ids.map(id=>`<div class="footer-location"><h3><a href="${venueURL(id)}" data-place="${id}">${brandName(id)}</a></h3>${value('address_'+id)?`<p class="venue-address">${content('address_'+id)}</p>`:''}${value('hours_'+id)?`<p class="venue-hours">${content('hours_'+id)}</p>`:''}${contactLinks(id)}${!['address_','phone_','instagram_','telegram_','hours_','map_'].some(k=>value(k+id))?`<p class="muted">${t('Контакты уточняются','Contact details coming soon')}</p>`:''}</div>`).join('')}</div><div class="footer-bottom"><span data-editor-key="footer_left">${E('footer_left')}</span><span data-editor-key="footer_right">${E('footer_right')}</span></div></footer>`;}
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
function eventCard(e,home=false,eventPath='/events'){
 const title=language==='en'?(e.title_en||t('','Event — translation pending')):e.title;
 const desc=language==='en'?(e.description_en||''):e.description;
 const date=new Date(e.starts_at+':00+03:00');
 const when=new Intl.DateTimeFormat(language==='en'?'en-GB':'ru-RU',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Minsk'}).format(date);
 const poster=localImage(e.image_url);
 const pic=poster?e.demo?`<div class="event-media"><img src="${esc(poster)}" alt="${text(title)}" loading="lazy" width="600" height="800"><span class="demo-poster-label">${t('ПРИМЕР АФИШИ','SAMPLE POSTER')}</span></div>`:`<img src="${esc(poster)}" alt="${text(title)}" loading="lazy" width="600" height="800">`:'';
 return `<${home?'a':'article'} ${home?`href="${eventPath}#event-${esc(e.id)}"`: `id="event-${esc(e.id)}"`} class="event-card ${poster?'':'no-image'} ${e.demo?'is-demo':''}">${pic}<div class="event-info">${e.demo?`<span class="event-demo-tag">${t('ДЕМО · НЕ РЕАЛЬНОЕ СОБЫТИЕ','DEMO · NOT A REAL EVENT')}</span>`:''}<time datetime="${esc(e.starts_at)}:00+03:00">${text(when)} · ${t('Минск','Minsk')}</time><h3>${text(title)}</h3>${!home&&desc?`<p>${text(desc)}</p>`:''}<div class="event-location">${brandName(e.venue)}</div></div></${home?'a':'article'}>`;
}
function home(){const next=splitEvents(displayEvents()).upcoming[0];return `<section class="hero" id="top"><div class="hero-copy"><span class="eyebrow" data-content="hero_kicker">${content('hero_kicker')}</span><h1 class="hero-title" aria-label="NOVA"><span class="hero-letter hero-letter-n" style="--letter-order:0" aria-hidden="true">N</span><span class="hero-letter hero-letter-o" style="--letter-order:1" aria-hidden="true">O</span><span class="hero-letter hero-letter-v" style="--letter-order:2" aria-hidden="true">V</span><span class="hero-letter hero-letter-a" style="--letter-order:3" aria-hidden="true">A</span></h1><p class="hero-tagline" data-content="hero_tagline">${content('hero_tagline')}</p></div><div class="hero-photo">${image('hero_image',t('Интерьер и коктейль — концептуальное изображение','Interior and cocktail — concept image'),true)}<div class="photo-side" data-editor-key="home_photo_side">${E('home_photo_side').replace(/\n/g,'<br>')}</div></div></section><section class="venues" id="venues" aria-labelledby="venues-heading"><h2 class="venues-heading" id="venues-heading" data-editor-key="home_locations_title">${E('home_locations_title')}</h2>${ids.map(id=>`<a class="venue-card ${id==='zyb'?'venue-card-hof':''}" href="${H('home_card_'+id+'_url',venueURL(id))}" ${hrefFor('home_card_'+id+'_url',venueURL(id))===venueURL(id)?'data-place="'+id+'"':''} data-editor-key="home_card_${id}_url"><div class="venue-img">${image('home_card_'+id+'_image',t('Концепция пространства ','Location concept: ')+name(id),false,'venue_'+id+'_image')}${id==='zyb'?'<span class="venue-hof-overlay"><img class="venue-hof-overlay-logo" data-editor-key="home_card_hof_logo_image" src="'+imageFor('home_card_hof_logo_image','/media/hof-wordmark-black.svg')+'" alt="HÓF" width="519" height="247"><span class="venue-hof-overlay-by" data-editor-key="home_card_hof_by">'+E('home_card_hof_by')+'</span></span>':''}</div><div class="venue-foot"><h3 class="venue-title"${id==='zyb'?' data-editor-key="home_card_hof_title"':''}>${id==='zyb'?E('home_card_hof_title'):name(id)}</h3><p class="venue-description" data-content="venue_${id}_subtitle">${content('venue_'+id+'_subtitle')}</p></div></a>`).join('')}</section><section class="story" id="about" ${shown('home_story_visible')?'':'style="display:none"'}><div class="story-copy"><span class="eyebrow muted" data-content="story_kicker">${content('story_kicker')}</span><h2 data-content="story_title">${content('story_title')}</h2><p data-content="story_description">${content('story_description')}</p><button class="text-link nova-compact-cta" data-editor-key="home_story_menu_text" data-modal="menu">${E('home_story_menu_text')} ${I('home_story_menu_icon')}</button></div><figure class="story-photo">${image('story_image',t('Подача блюда — демонстрационное изображение','Food presentation — concept image'))}<figcaption class="image-note" data-content="media_note">${content('media_note')}</figcaption></figure></section><section class="home-events" ${shown('home_events_visible')?'':'style="display:none"'}><a class="section-link" href="${H('home_events_url','/events')}" data-editor-key="home_events_url"><h2 data-editor-key="home_events_title">${E('home_events_title')}</h2>${I('home_events_icon')}</a><div>${next?eventCard(next,true)+(next.demo?`<p class="demo-note">${t('Пример оформления. Мероприятие не проводится.','Design preview only. This event is not scheduled.')}</p>`:''):`<p class="event-empty">${!eventsLoaded&&!eventsFailed?t('Загружаем афишу…','Loading events…'):E('home_events_empty')}</p>`}</div></section><section class="book-strip" id="booking" ${shown('home_booking_visible')?'':'style="display:none"'}><div class="book-image">${image('booking_image',t('Детали интерьера — концепция','Interior details — concept image'))}</div><button class="book-main" type="button" data-modal="booking"><span class="book-welcome" data-editor-key="home_booking_welcome">${E('home_booking_welcome')}</span><span class="book-cta nova-compact-cta nova-compact-cta--inverse"><span data-content="booking_title">${content('booking_title')}</span>${I('home_booking_icon')}</span></button></section>`;}


function hofLineupLink(){
 const raw=editorValue('hof_events_more_text'),label=(raw==='Общая афиша NOVA'||raw==='NOVA events')?t('События HÓF','HÓF events'):raw;
 const url=hrefFor('hof_events_more_url','/events/hof');
 // Honor custom editor URLs, but migrate legacy /events to this venue's lineup.
 const target=url==='/events'?'/events/hof':url;
 return `<a class="hof-event-more hof-action" href="${esc(target)}" data-editor-key="hof_events_more_url">${text(label)} ${arrow}</a>`;
}
const hofMonths={
 ru:['ЯНВ','ФЕВ','МАР','АПР','МАЙ','ИЮН','ИЮЛ','АВГ','СЕН','ОКТ','НОЯ','ДЕК'],
 en:['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
};
const hofDays={
 ru:['ВС','ПН','ВТ','СР','ЧТ','ПТ','СБ'],
 en:['SUN','MON','TUE','WED','THU','FRI','SAT']
};
function hofEventDate(date){
 // Stored event times are local to Minsk: don't let the viewer's timezone
 // change the weekday, displayed day or start time.
 const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(date||'');
 if(!match)return date||'';
 const [,year,month,day,hour,minute]=match;
 const index=new Date(Date.UTC(Number(year),Number(month)-1,Number(day))).getUTCDay();
 const lang=language==='en'?'en':'ru';
 return `${Number(day)} ${hofMonths[lang][Number(month)-1]}, ${hofDays[lang][index]} · ${hour}:${minute}`;
}
function hofEventRow(e){
 const title=language==='en'?(e.title_en||e.title):e.title;
 const poster=localImage(e.image_url);
 return `<a class="hof-event-row ${poster?'':'no-image'}" href="/events/hof#event-${esc(e.id)}" aria-label="${text(title)}, ${text(hofEventDate(e.starts_at))}">
  ${poster?`<img class="hof-event-poster" src="${esc(poster)}" alt="" loading="lazy" width="64" height="80">`:''}
  <span class="hof-event-copy">
   <time datetime="${esc(e.starts_at)}:00+03:00">${text(hofEventDate(e.starts_at))}</time>
   <span class="hof-event-title">${text(title)}</span>
  </span>
  <span class="hof-event-arrow" aria-hidden="true">${arrow}</span>
 </a>`;
}
function hofLineup(){
 const upcoming=splitEvents(events.filter(e=>e.venue==='zyb'&&!e.demo)).upcoming.slice(0,2);
 if(upcoming.length)return `<div class="hof-event-list">${upcoming.map(hofEventRow).join('')}</div><div class="hof-events-footer">${hofLineupLink()}</div>`;
 return `<div class="hof-events-empty"><p>${E('hof_events_empty')}</p>${hofLineupLink()}</div>`;
}
function venueEventsPreview(id){
 const upcoming=splitEvents(events.filter(e=>e.venue===id&&!e.demo)).upcoming.slice(0,2);
 const target=hrefFor('venue_'+id+'_events_button_url',venueEventURLs[id]);
 return `<section class="venue-events-teaser" aria-labelledby="venue-events-heading">
  <div class="venue-events-teaser-top"><span class="eyebrow muted">${t('АФИША ЗАВЕДЕНИЯ','VENUE LINEUP')}</span><h2 id="venue-events-heading">${t('События','Events')} / ${name(id)}</h2>
  <p>${upcoming.length?t('Ближайшие события этого пространства.','Coming up at this space.'):t('Пока нет анонсированных мероприятий.','No events announced yet.')}</p>
  <a class="venue-events-link" href="${esc(target)}" data-editor-key="venue_${id}_events_button_url">${E('venue_'+id+'_events_button_text')} ${arrow}</a></div>
  ${upcoming.length?`<div class="venue-events-teaser-list">${upcoming.map(e=>eventCard(e,true,venueEventURLs[id])).join('')}</div>`:''}
 </section>`;
}
function hofDetail(){
 return `<article class="detail hof-page hof-editorial">
  <section class="hof-cover hof-editorial-hero" aria-labelledby="hof-title">
   <div class="hof-hero-image">${image('venue_zyb_image',t('Музыкальная атмосфера HOF','HOF nightlife atmosphere'),true)}</div>
   <div class="hof-hero-overlay" aria-hidden="true"></div>
   <div class="hof-cover-inner">
    <div class="hof-cover-top"><span class="hof-top-brand"><span class="hof-top-marker" aria-hidden="true"></span><span data-editor-key="hof_top_name">${E('hof_top_name')}</span></span><span data-editor-key="hof_top_location">${E('hof_top_location')}</span></div>
    <div class="hof-cover-brand">
     <span class="hof-hero-eyebrow" data-editor-key="hof_hero_kicker">${E('hof_hero_kicker')}</span>
     <h1 id="hof-title"><img class="hof-wordmark" data-editor-key="hof_logo_image" src="${esc(/^\/media\/[A-Za-z0-9_.-]+\.(?:svg|jpg|png|webp)$/.test(editorValue('hof_logo_image'))?editorValue('hof_logo_image'):'/media/hof-wordmark-orange.svg')}" alt="HÓF" width="519" height="247" fetchpriority="high"></h1>
     <span class="hof-by-nova" data-editor-key="hof_by_nova">${E('hof_by_nova')}</span>
    </div>
    <div class="hof-cover-bottom">
     <div class="hof-hero-message"><p class="hof-manifesto" data-editor-key="hof_slogan">${E('hof_slogan')}</p><span data-editor-key="hof_description_short">${E('hof_description_short')}</span></div>
     <div class="hof-hero-actions"><a class="hof-outline hof-action" href="${H('hof_events_button_url','#hof-lineup')}" ${hrefFor('hof_events_button_url','#hof-lineup')==='#hof-lineup'?'data-scroll="hof-lineup"':''} data-editor-key="hof_events_button_url">${E('hof_events_button_text')} ${I('hof_hero_icon')}</a><button class="hof-outline hof-primary-cta hof-action" type="button" data-editor-key="hof_booking_button_text" data-modal="booking" data-venue="zyb">${E('hof_booking_button_text')} ${I('hof_hero_icon')}</button></div>
    </div>
   </div>
  </section>
  <section class="hof-compact-about hof-editorial-about" aria-labelledby="hof-about-heading">
   <div class="hof-editorial-symbol"><img data-editor-key="hof_about_mark_image" src="${imageFor('hof_about_mark_image','/media/hof-mark-orange.svg')}" width="95" height="126" alt="" aria-hidden="true" loading="lazy"><span>HOUSE OF FLOW</span></div>
   <div class="hof-about-details">
    <span class="hof-overline">${E('hof_about_kicker')}</span>
    <h2 id="hof-about-heading" data-editor-key="hof_about_title">${E('hof_about_title')}</h2>
    <p data-editor-key="hof_about_description">${E('hof_about_description')}</p>
    <button class="hof-text-button hof-action" data-editor-key="menu_zyb" type="button" data-modal="menu-location" data-venue="zyb">${E('hof_menu_button_text')} ${I('hof_menu_button_icon')}</button>
   </div>
  </section>
  <div class="hof-editorial-grid">
   <section class="hof-lineup hof-compact-events" id="hof-lineup" aria-labelledby="hof-lineup-title">
    <div class="hof-section-heading"><span class="hof-overline" data-editor-key="hof_events_kicker">${E('hof_events_kicker')}</span><h2 id="hof-lineup-title" data-editor-key="hof_events_title">${E('hof_events_title')}<span aria-hidden="true" class="hof-heading-period">.</span></h2></div>
    <div id="hof-lineup-content">${hofLineup()}</div>
   </section>
   <section class="hof-bottom hof-compact-contact" aria-label="${t('Контакты и бронирование','Contacts and reservations')}">
    <div class="hof-contact-top"><span class="hof-overline" data-editor-key="hof_contact_kicker">${E('hof_contact_kicker')}</span><img data-editor-key="hof_contact_mark_image" src="${imageFor('hof_contact_mark_image','/media/hof-mark-black.svg')}" width="56" height="74" alt="" aria-hidden="true" loading="lazy"></div>
    <h2 data-editor-key="hof_contact_title">${E('hof_contact_title')}</h2>
    <p data-content="address_zyb">${content('address_zyb')}</p>
    <div class="hof-bottom-actions">
     <button class="hof-outline hof-primary-cta hof-action" type="button" data-editor-key="hof_book_button_text" data-modal="booking" data-venue="zyb">${E('hof_book_button_text')} ${arrow}</button>
     <button class="hof-text-button hof-action" data-editor-key="hof_contacts_button_text" type="button" data-modal="contacts" data-venue="zyb">${E('hof_contacts_button_text')} ${arrow}</button>
    </div>
   </section>
  </div>
 </article>`;
}

function detail(id){if(id==='zyb')return hofDetail();return `<article class="detail"><a href="${H('venue_'+id+'_back_url','/#venues')}" ${hrefFor('venue_'+id+'_back_url','/#venues')==='/#venues'?'data-home="venues"':''} class="detail-back" data-editor-key="venue_${id}_back_url">${arrow}${E('venue_'+id+'_back_text')}</a><div class="detail-grid"><div class="detail-copy"><span class="eyebrow muted" data-editor-key="venue_${id}_kicker">${E('venue_'+id+'_kicker')}</span><h1 data-editor-key="venue_${id}_name">${name(id)}</h1><div class="subtitle" data-content="venue_${id}_subtitle">${content('venue_'+id+'_subtitle')}</div><p data-content="venue_${id}_desc">${content('venue_'+id+'_desc',t('Описание готовится.','Details coming soon.'))}</p><div class="detail-actions"><button class="button nova-compact-cta" data-editor-key="venue_${id}_booking_text" data-modal="booking" data-venue="${id}">${E('venue_'+id+'_booking_text')}</button><button class="button secondary nova-compact-cta" data-editor-key="menu_${id}" data-modal="menu-location" data-venue="${id}">${E('venue_'+id+'_menu_text')}</button></div></div><div class="detail-image">${image('venue_'+id+'_image',t('Концепция пространства ','Location concept: ')+name(id),true)}</div></div><div class="detail-bottom"><div><span class="eyebrow muted" data-editor-key="venue_${id}_atmosphere_kicker">${E('venue_'+id+'_atmosphere_kicker')}</span><h2 data-editor-key="venue_${id}_atmosphere_title">${E('venue_'+id+'_atmosphere_title')}</h2><p data-content="venue_${id}_second">${content('venue_'+id+'_second')}</p><p class="features" data-content="venue_${id}_features">${content('venue_'+id+'_features')}</p><button class="text-link nova-compact-cta" data-editor-key="venue_${id}_contacts_text" data-modal="contacts" data-venue="${id}">${E('venue_'+id+'_contacts_text')} ${arrow}</button></div><div><div class="detail-gallery" ${shown('venue_'+id+'_gallery_visible')?'':'style="display:none"'}>${[1,2].map(i=>image(`gallery_${id}_${i}_image`,t('Демонстрационное изображение','Concept image'))).join('')}</div><p class="image-note">${content('media_note')}</p></div></div>${venueEventsPreview(id)}</article>`;}
function venueEventsPage(id){
 const hof=id==='zyb';
 // Never show example events from other locations or fictional samples in a venue view.
 const live=events.filter(e=>e.venue===id&&!e.demo);
 const {upcoming,past}=splitEvents(live);
 const vname=hof?'HÓF':name(id);
 const back=venueURL(id);
 const brand=hof?`<img class="venue-events-logo" src="/media/hof-wordmark-orange.svg" alt="HÓF" width="290" height="140">`:`<span class="venue-events-nova-mark">NOVA</span>`;
 return `<div class="events-page venue-events-page ${hof?'hof-events-page':'nova-venue-events-page'}" data-venue="${id}">
 <section class="venue-events-intro" aria-labelledby="venue-events-title">
  <div class="venue-events-intro-top"><span>${hof?'HOUSE OF FLOW':'NOVA / MINSK'}</span><a href="${back}">${t('К заведению','Back to venue')} ${arrow}</a></div>
  ${brand}
  <div class="venue-events-headerline"><div><span class="venue-events-overline">${t('ТОЛЬКО ЭТО ПРОСТРАНСТВО','THIS SPACE ONLY')}</span><h1 id="venue-events-title">${t('События','Events')}<span class="venue-events-period">.</span></h1>
  <p>${hof?t('Музыка, вечеринки и встречи в HÓF на Зыбицкой.','Music, nights and events at HÓF on Zybitskaya.'):t('Афиша мероприятий именно этого заведения.','Events at this venue only.')}</p></div>
  <a class="venue-events-all" href="/events">${t('Все события NOVA','All NOVA events')} ${arrow}</a></div>
 </section>
 ${[[upcoming,t('Ближайшие','Coming up'),'future'],[past,t('Архив','Archive'),'archive']].map(([list,title,key])=>`<section class="venue-events-section ${key}"><div class="venue-events-section-head"><h2>${title}</h2><span>${list.length.toString().padStart(2,'0')}</span></div><div class="events-list" id="${key}">${list.length?list.map(e=>eventCard(e)).join(''):`<p class="event-empty">${!eventsLoaded&&!eventsFailed?t('Загружаем афишу…','Loading events…'):eventsFailed&&!eventsLoaded?t('Не удалось загрузить афишу. Проверьте соединение и повторите попытку.','Could not load events. Check your connection and try again.'):key==='future'?t('В этом заведении пока нет анонсированных событий.','No upcoming events at this venue yet.'):t('Архив мероприятий пока пуст.','No past events yet.')}</p>`}</div></section>`).join('')}
 </div>`;
}
function eventsPage(){if(scopedEventVenue)return venueEventsPage(scopedEventVenue);const visible=displayEvents(),demo=visible.some(e=>e.demo);const {upcoming,past}=splitEvents(visible);return `<div class="events-page"><section class="events-intro"><span class="eyebrow muted">NOVA / MINSK</span><h1>${t('События','Events')}</h1><p>${t('Встречи, музыка и вечера, которые хочется повторить.','Music, good company and nights worth remembering.')}</p>${demo?`<p class="events-demo-notice" role="note">${t('ДЕМОНСТРАЦИОННАЯ АФИША — названия, даты и события вымышлены. Когда появится предстоящее опубликованное мероприятие, примеры автоматически исчезнут.','SAMPLE EVENT LINEUP — all titles, dates and events are fictional. Examples automatically disappear when an upcoming real event is published.')}</p>`:''}</section>${[[upcoming,t('Ближайшие','Coming up'),'future'],[past,t('Архив','Archive'),'archive']].map(([list,title,id])=>`<section class="events-section ${id}"><h2>${title}</h2><div class="events-list" id="${id}">${list.length?list.map(e=>eventCard(e)).join(''):`<p class="event-empty">${!eventsLoaded&&!eventsFailed?t('Загружаем афишу…','Loading events…'):id==='future'?t('Сейчас нет анонсированных мероприятий.','No upcoming events announced yet.'):t('Архив мероприятий пока пуст.','No past events yet.')}</p>`}</div></section>`).join('')}</div>`;}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let heroIntroPending = !isEvents && location.pathname === '/' && !reducedMotion.matches;
let motionObserver = null;
const revealedSections = new Set();
let venuesRevealObserver = null;
let venuesRevealScrollHandler = null;
let venuesHeadingRevealed = false;
let venuesCardsRevealed = false;
const venuesMobileRevealed = new Set();

// Reveal desktop cards together with a subtle left-to-right stagger.
// On mobile each stacked card appears only when it enters the viewport.
function setupVenuesReveal(){
 venuesRevealObserver?.disconnect();
 if(venuesRevealScrollHandler){window.removeEventListener('scroll',venuesRevealScrollHandler);venuesRevealScrollHandler=null;}
 const section=app.querySelector('.venues');
 if(!section || reducedMotion.matches || !('IntersectionObserver' in window))return;
 const heading=section.querySelector('.venues-heading');
 const cards=[...section.querySelectorAll('.venue-card')];
 if(!heading || !cards.length)return;
 const mobile=matchMedia('(max-width:600px)').matches;
 const first=cards[0];
 section.classList.add('venues-motion');
 section.classList.toggle('venues-mobile-motion',mobile);
 cards.forEach((card,i)=>{
  card.style.setProperty('--venue-stagger',mobile?'0ms':i*130+'ms');
  // A lazy-loaded photograph must not pop in half-way through its card reveal.
  const image=card.querySelector('.venue-img img');
  if(!image)return;
  const showImage=()=>image.classList.add('venue-image-loaded');
  if(image.complete&&image.naturalWidth>0)showImage();
  else{
   image.addEventListener('load',()=>requestAnimationFrame(showImage),{once:true});
   image.addEventListener('error',showImage,{once:true});
  }
 });
 // Already-visible content is shown immediately, including after history restoration.
 if(scrollY>20 || heading.getBoundingClientRect().top < innerHeight)venuesHeadingRevealed=true;
 if(venuesHeadingRevealed)section.classList.add('venues-heading-entered');
 if(mobile){
  cards.forEach(card=>{
   if(venuesMobileRevealed.has(card.dataset.place) ||
      (scrollY>20 && card.getBoundingClientRect().top<innerHeight-12)){
    card.classList.add('venue-card-entered');
    venuesMobileRevealed.add(card.dataset.place);
   }
  });
 }else{
  // On first visit the font can reflow the cards while loading: do not auto-reveal at scrollY=0.
  if(scrollY>20 || (innerHeight>1150 && first.getBoundingClientRect().top < innerHeight-180))venuesCardsRevealed=true;
  if(venuesCardsRevealed)section.classList.add('venues-cards-entered');
 }
 if(venuesHeadingRevealed && (mobile?cards.every(c=>c.classList.contains('venue-card-entered')):venuesCardsRevealed))return;
 venuesRevealObserver=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting)continue;
   const el=entry.target;
   if(el===heading){
    venuesHeadingRevealed=true;
    section.classList.add('venues-heading-entered');
   }else if(mobile && el.matches('.venue-card')){
    venuesMobileRevealed.add(el.dataset.place);
    el.classList.add('venue-card-entered');
   }else if(el===first){
    venuesCardsRevealed=true;
    section.classList.add('venues-cards-entered');
   }
   venuesRevealObserver?.unobserve(el);
  }
 },{threshold:0,rootMargin:'0px'});
 if(!venuesHeadingRevealed)venuesRevealObserver.observe(heading);
 // At page load the first card can peek only 2-10px into the viewport.
 // Defer its observer until actual scrolling to avoid finishing the fade early.
 const observeFirst=()=>{
  if(scrollY<8){
   venuesRevealScrollHandler=()=>{
    if(scrollY<8)return;
    window.removeEventListener('scroll',venuesRevealScrollHandler);
    venuesRevealScrollHandler=null;
    venuesRevealObserver?.observe(first);
   };
   window.addEventListener('scroll',venuesRevealScrollHandler,{passive:true});
  }else venuesRevealObserver.observe(first);
 };
 if(mobile){
  cards.filter(card=>!card.classList.contains('venue-card-entered')).forEach(card=>{
   if(card===first)observeFirst();
   else venuesRevealObserver.observe(card);
  });
 }else if(!venuesCardsRevealed)observeFirst();
}

// Align to the painted V glyph, not to its letter-spacing-shortened DOM box.
// In Manrope 300, those centers differ by about 18px at 2048px viewport width.
function alignHeroPhoto() {
 const hero=app.querySelector('.hero');
 const letter=hero?.querySelector('.hero-letter-v');
 if(!hero||!letter||matchMedia('(max-width:600px)').matches){
  hero?.style.removeProperty('--hero-photo-start');
  return;
 }
 const heroBox=hero.getBoundingClientRect(),vBox=letter.getBoundingClientRect();
 if(!heroBox.width||!vBox.width)return;
 let centre=vBox.left+vBox.width/2;
 const style=getComputedStyle(letter);
 const ctx=document.createElement('canvas').getContext('2d');
 if(ctx){
  ctx.font=style.fontWeight+' '+style.fontSize+' '+style.fontFamily;
  const metrics=ctx.measureText('V');
  if(Number.isFinite(metrics.actualBoundingBoxRight) && Number.isFinite(metrics.actualBoundingBoxLeft)){
   centre=vBox.left+(metrics.actualBoundingBoxRight-metrics.actualBoundingBoxLeft)/2;
  }
 }
 const percent=(centre-heroBox.left)/heroBox.width*100;
 if(percent>20&&percent<75)hero.style.setProperty('--hero-photo-start',percent.toFixed(4)+'%');
}
let alignmentFrame=0;
window.addEventListener('resize',()=>{
 cancelAnimationFrame(alignmentFrame);
 alignmentFrame=requestAnimationFrame(alignHeroPhoto);
},{passive:true});
document.fonts?.ready.then(alignHeroPhoto);

// Animate small content groups, not whole full-width sections and large images.
function attachMotion() {
 motionObserver?.disconnect();
 setupVenuesReveal();
 const hero=app.querySelector('.hero');
 if(hero&&heroIntroPending)hero.classList.add('hero-intro');
 alignHeroPhoto();
 if(reducedMotion.matches || !('IntersectionObserver' in window))return;
 motionObserver=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting)continue;
   const el=entry.target;
   el.classList.add('is-visible');
   revealedSections.add(el.dataset.motionKey);
   motionObserver.unobserve(el);
  }
 },{threshold:0.08,rootMargin:'0px 0px -28px 0px'});
 const targets=app.querySelectorAll(
  '.story-copy,.story-photo,.home-events .section-link,'+
  '.home-events .event-card,.book-welcome,.book-cta,.footer-location,'+
  '.detail-copy,.detail-image,.detail-bottom>div,.events-intro,.events-section h2,.events-list .event-card'
 );
 targets.forEach((el,index)=>{
  const key=location.pathname+'|'+index;
  el.dataset.motionKey=key;
  const top=el.getBoundingClientRect().top;
  // Never cover existing content when a page is rerendered or a link lands deep.
  if(revealedSections.has(key)||top<innerHeight*.82){
   revealedSections.add(key);
   return;
  }
  el.classList.add('nova-reveal');
  motionObserver.observe(el);
 });
}

// Apply late CMS updates in place. A second full render reset scroll position,
// recreated the hero and made animated sections flash during reading.
function patchLateContent(){
 app.querySelectorAll('[data-editor-key]').forEach(el=>{
  const key=el.dataset.editorKey,spec=EDITOR_BY_KEY[key];
  if(!spec)return;
  // A late CMS response must not leave the initial fallback text visible.
  if(['text','textarea'].includes(spec.type)&&!el.children.length&&el.tagName!=='INPUT'){
   el.textContent=typography(editorValue(key),language);
  }else if(spec.type==='image'&&el.tagName==='IMG'){
   const source=imageFor(key);
   if(source && el.getAttribute('src')!==source)el.src=source;
  }else if(spec.type==='link'&&el.tagName==='A'){
   const url=hrefFor(key);
   if(url && el.getAttribute('href')!==url)el.href=url;
  }
 });
 app.querySelectorAll('[data-content]').forEach(el=>{
  const updated=value(el.dataset.content);
  if(updated)el.textContent=typography(updated,language);
 });
 app.querySelectorAll('img[data-image]').forEach(el=>{
  const url=media(el.dataset.image);
  if(!url)return;
  const next=url+'?v=visual-2';
  if(el.getAttribute('src')===next)return;
  const loader=new Image();
  loader.onload=()=>{if(el.isConnected)el.src=next;};
  loader.src=next;
 });
 patchEventSections();
}
// When the published events change, update only the event-related fragments.
// Do not remount the entire site, reopen dialogs or reset scroll position.
function patchEventSections(){
 if(isEvents){
  const current=app.querySelector('.events-page');
  if(current){
   const template=document.createElement('template');
   template.innerHTML=eventsPage();
   current.replaceWith(template.content.firstElementChild);
   attachMotion();
  }
  return;
 }
 if(selected==='zyb'){
  const container=app.querySelector('#hof-lineup-content');
  if(container)container.innerHTML=hofLineup();
  return;
 }
 if(selected==='pob'||selected==='east'){
  const current=app.querySelector('.venue-events-teaser');
  if(current){
   const template=document.createElement('template');
   template.innerHTML=venueEventsPreview(selected);
   current.replaceWith(template.content.firstElementChild);
  }
  return;
 }
 if(!selected){
  const oldList=app.querySelector('.home-events > div');
  if(oldList){
   const template=document.createElement('template');
   template.innerHTML=home();
   const nextList=template.content.querySelector('.home-events > div');
   if(nextList)oldList.replaceChildren(...nextList.childNodes);
  }
 }
}

function render(){
 document.documentElement.lang=language;
 selected=!isEvents?(paths[location.pathname.split('/')[2]]||(ids.includes(location.hash.slice(1))?location.hash.slice(1):null)):null;
 document.body.classList.toggle('hof-active',selected==='zyb'||(isEvents&&scopedEventVenue==='zyb'));
 document.body.classList.toggle('hof-events-active',isEvents&&scopedEventVenue==='zyb');
 const titles={
 zyb:['HOF by NOVA (House of Flow) — музыка и вечеринки на Зыбицкой','HOF by NOVA (House of Flow) — Music and events on Zybitskaya'],
 pob:['NOVA Победителей — лаунж-кафе на проспекте Победителей, 89/3','NOVA Pobediteley — lounge café in Minsk'],
 east:['NOVA Восток — лаунж-кафе на Франциска Скорины, 2','NOVA Vostok — lounge café in Minsk']
};
const descriptions={
 zyb:['HOF by NOVA, Зыбицкая, 2. House of Flow: музыка, DJ-сеты, вечеринки, кухня и бар.','HOF by NOVA, 2 Zybitskaya Street, Minsk: music, DJ sets, parties, food and bar.'],
 pob:['NOVA Победителей, 89/3: кухня, встречи, настольные игры и вечерняя музыка. Телефон +375 25 644-33-33.','NOVA at 89/3 Pobediteley Avenue, Minsk: food, board games and good company. Call +375 25 644-33-33.'],
 east:['NOVA Восток, ул. Франциска Скорины, 2: ланчи, кухня и вечера в своей атмосфере. Телефон +375 44 791-33-33.','NOVA Vostok at 2 Francyska Skaryny Street, Minsk: food and relaxed evenings. Call +375 44 791-33-33.']
};
document.title=isEvents?(scopedEventVenue?(scopedEventVenue==='zyb'?t('События HÓF — House of Flow','HÓF events — House of Flow'):t('События — NOVA '+name(scopedEventVenue),'Events — NOVA '+name(scopedEventVenue))):t('События — NOVA Minsk','Events — NOVA Minsk')):selected?titles[selected][language==='en'?1:0]:t('NOVA — три лаунж-кафе в Минске','NOVA — Three lounge cafés in Minsk');
const meta=document.querySelector('meta[name="description"]');
if(meta)meta.content=selected?descriptions[selected][language==='en'?1:0]:isEvents?(scopedEventVenue?t('Афиша мероприятий '+(scopedEventVenue==='zyb'?'HÓF':name(scopedEventVenue))+' в Минске.','Events at '+(scopedEventVenue==='zyb'?'HÓF':name(scopedEventVenue))+' in Minsk.'):t('Афиша NOVA в Минске: DJ-сеты, вечеринки и ближайшие события.','NOVA events in Minsk: parties, DJ sets and upcoming nights.')):t('NOVA — три лаунж-кафе в Минске: Зыбицкая, Победителей и Восток. Кухня, ланчи, вечерние встречи и события.','NOVA — three lounge cafés in Minsk: Zybitskaya, Pobediteley and Vostok. Food, music and gatherings.');
const canonical=document.querySelector('link[rel="canonical"]');if(canonical)canonical.href=location.origin+(isEvents?(scopedEventVenue?venueEventURLs[scopedEventVenue]:'/events'):selected?venueURL(selected):'/');
 app.innerHTML=header()+`<main id="main" tabindex="-1">${isEvents?eventsPage():selected?detail(selected):home()}</main>`+footer()+layers();
 app.querySelector('dialog').addEventListener('cancel',e=>{e.preventDefault();closeModal();});
 app.querySelector('dialog').addEventListener('close',()=>{document.querySelector('dialog')?.classList.remove('is-visible');});
 app.querySelector('dialog').addEventListener('click',e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
 updateTop();
 setupHofDockObserver();
 attachMotion();
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
 // Zero velocity at both ends avoids abrupt starts and stops on anchor links.
 const duration=Math.min(980,Math.max(390,300+Math.sqrt(distance)*9));
 const beginning=performance.now();
 const tick=now=>{
  const progress=Math.min(1,(now-beginning)/duration);
  const eased=progress<.5?4*progress*progress*progress:1-Math.pow(-2*progress+2,3)/2;
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
function contactPanel(id){
 const address=value('address_'+id),hours=value('hours_'+id);
 if(id==='zyb'){
  const phone=value('phone_zyb'),route=safeURL(value('map_zyb')),telegram=safeURL(value('telegram_zyb'));
  const items=[
   address?`<div class="hof-contact-info"><span class="hof-contact-label">${t('Адрес','Address')}</span><p>${text(address)}</p></div>`:'',
   hours?`<div class="hof-contact-info"><span class="hof-contact-label">${t('Часы работы','Opening hours')}</span><p class="venue-hours">${text(hours)}</p></div>`:''
  ].filter(Boolean).join('');
  const actions=[
   phone&&validPhone(phone)?`<a class="hof-contact-action" href="tel:${esc(phone.replace(/[^+\d]/g,''))}"><span>${text(phone)}</span>${arrow}</a>`:'',
   route?`<a class="hof-contact-action" href="${esc(route)}" target="_blank" rel="noopener noreferrer"><span>${t('Построить маршрут','Get directions')}</span>${arrow}</a>`:'',
   telegram?`<a class="hof-contact-action" href="${esc(telegram)}" target="_blank" rel="noopener noreferrer"><span>Telegram</span>${arrow}</a>`:''
  ].filter(Boolean).join('');
  if(!items&&!actions)return `<p class="intro">${t('Контакты этого заведения ещё уточняются.','Contact details for this space are coming soon.')}</p>`;
  return `<div class="hof-contact-details">${items}${actions?`<div class="hof-contact-modal-actions">${actions}</div>`:''}</div>`;
 }
 const links=contactLinks(id);
 return `${address||hours||links?`<div class="contact-list">${address?`<div><h3>${t('Адрес','Address')}</h3><p>${text(address)}</p></div>`:''}${hours?`<div><h3>${t('Часы работы','Opening hours')}</h3><p class="venue-hours">${text(hours)}</p></div>`:''}${links}</div>`:`<p class="intro">${t('Контакты этого заведения ещё уточняются.','Contact details for this space are coming soon.')}</p>`}`;
}
function openModal(kind,id=selected){
 if(drawerOpen)setDrawer(false);
 if(kind==='menu-location'){
  const url=hrefFor('menu_'+id,'');
  if(url){
   if(id==='east'||id==='pob')window.location.assign(url);
   else window.open(url,'_blank','noopener,noreferrer');
   return;
  }
 }
 const dialog=document.querySelector('dialog');if(!dialog.open)lastFocus=document.activeElement;
 modalKind=kind;modalVenue=id||'';
 dialog.dataset.kind=kind;
 // A single booking component: HOF receives only a visual theme, not new data flow.
 dialog.dataset.theme=(kind==='booking'||kind==='contacts')&&id==='zyb'?'hof':'nova';
 dialog.dataset.bookingVenue=kind==='booking'?(id||'all'):'';
 document.getElementById('modal-caption').textContent=id?(id==='zyb'?'HOF':name(id)):'MINSK';
 const body=document.getElementById('modal-body');
 if(kind==='booking'){
 const day=minskNow().slice(0,10);
 body.innerHTML=`<h2 id="modal-title">${bookingLabel()}</h2><p class="intro">${t('Выберите время и количество гостей. Пока здесь можно только проверить данные заявки.','Choose a time and the number of guests. This demo lets you review the request only.')}</p><form id="book-form"><div class="form-fields"><div class="field full"><label for="venue">${t('Заведение','Space')}</label>${id?`<div class="venue-context">${venueLabel(id)}</div><input id="venue" type="hidden" name="venue" value="${id}">`:`<select id="venue" name="venue" required><option value="">${t('Выберите заведение','Choose a space')}</option>${ids.map(i=>`<option value="${i}">${venueLabel(i)}</option>`).join('')}</select>`}</div><div class="field"><label for="date">${t('Дата','Date')}</label><input id="date" name="date" type="date" value="${day}" min="${day}" required></div><div class="field"><label for="time">${t('Время','Time')}</label><select id="time" name="time" required>${Array.from({length:96},(_,i)=>{const slot=`${String(Math.floor(i/4)).padStart(2,'0')}:${String((i%4)*15).padStart(2,'0')}`;return `<option value="${slot}" ${slot==='19:00'?'selected':''}>${slot}</option>`}).join('')}</select></div><div class="field"><label for="guests">${t('Количество гостей','Guests')}</label><select id="guests" name="guests">${Array.from({length:16},(_,i)=>`<option ${i===1?'selected':''}>${i+1}</option>`).join('')}</select></div><div class="field"><label for="guest-name">${t('Ваше имя','Your name')}</label><input id="guest-name" name="name" autocomplete="name" maxlength="60" required></div><div class="field full"><label for="phone">${t('Номер телефона','Phone number')}</label><input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="30" placeholder="+375 29 123-45-67" aria-describedby="phone-error" required><p id="phone-error" class="form-error" role="status"></p></div></div><button type="submit" class="button form-submit">${t('Проверить заявку','Review request')}</button><p class="demo-note">${t('Демонстрационный режим: заявка не отправляется и не сохраняется. Не вводите реальные персональные данные для тестирования.','Demo mode: requests are not sent or saved. Please do not enter real personal information for testing.')}</p></form>`;
 body.querySelector('#phone').addEventListener('input',e=>{const input=e.target,pos=input.selectionStart,before=input.value;input.value=cleanPhone(before);if(before!==input.value){const next=cleanPhone(before.slice(0,pos)).length;input.setSelectionRange(next,next);}input.setCustomValidity('');document.getElementById('phone-error').textContent='';});
 enhanceBookingSelects(body.querySelector('form'),language,{forceCustom:id==='zyb'});
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
 const fields=[[t('Заведение','Space'),venueLabel(fd.get('venue'))],[t('Дата','Date'),fd.get('date')],[t('Время · Минск','Time · Minsk'),fd.get('time')],[t('Гостей','Guests'),fd.get('guests')],[t('Имя','Name'),fd.get('name').trim()],[t('Телефон','Phone'),phone.value]];
 document.getElementById('modal-body').innerHTML=`<h2 id="modal-title" tabindex="-1">${t('Проверьте данные','Review your details')}</h2><dl class="summary">${fields.map(([k,v])=>`<dt>${text(k)}</dt><dd>${text(v)}</dd>`).join('')}</dl><p class="demo-note">${t('Это только предварительный просмотр. Сообщение никому не отправлено, бронь не оформлена, данные не сохранены.','This is a preview only. No message has been sent, no table is reserved, and the information is not saved.')}</p><button class="button form-submit" data-close>${t('Закрыть','Close')}</button>`;
 document.getElementById('modal-title').focus();modalKind='review';
}
let hofDockObserver=null;
function setupHofDockObserver(){
 hofDockObserver?.disconnect();
 hofDockObserver=null;
 if(!document.body.classList.contains('hof-active')||!('IntersectionObserver' in window))return;
 const hero=document.querySelector('.hof-editorial-hero');
 const contact=document.querySelector('.hof-compact-contact');
 if(!hero||!contact)return;
 const header=document.querySelector('.site-header')?.getBoundingClientRect().height||72;
 // Observe the whole hero and orange panel, not the final booking button:
 // the dock should retreat at the first appearance of the footer panel.
 hofDockObserver=new IntersectionObserver(()=>syncBookingDock(),{
  rootMargin:`-${Math.round(header)}px 0px 0px 0px`,
  threshold:0
 });
 hofDockObserver.observe(hero);
 hofDockObserver.observe(contact);
}
// The NOVA dock retreats only when the *in-flow booking control* is readable,
// not merely when the tall green booking section starts to enter the screen.
// Measure against the space above the fixed dock, so both buttons never compete.
function novaInlineBookingVisible(dock,header){
 if(!matchMedia('(max-width:600px)').matches)return false;
 const visibleBottom=innerHeight-dock.offsetHeight;
 return [...document.querySelectorAll('main .book-main .book-cta, main .detail-actions [data-modal="booking"]')].some(button=>{
  if(!button.getClientRects().length)return false;
  const rect=button.getBoundingClientRect();
  return rect.bottom>header&&rect.top<visibleBottom;
 });
}
function syncBookingDock(){
 const active=document.body.classList.contains('hof-active');
 const hero=active?document.querySelector('.hof-editorial-hero'):null;
 const panel=active?document.querySelector('.hof-compact-contact'):null;
 const header=document.querySelector('.site-header')?.getBoundingClientRect().height||72;
 const dock=document.querySelector('.mobile-cta');
 const panelRect=panel?.getBoundingClientRect();
 const footerEntered=Boolean(panelRect&&panelRect.top<innerHeight&&panelRect.bottom>header);
 const heroPassed=Boolean(hero&&hero.getBoundingClientRect().bottom<=header+4);
 const visible=Boolean(heroPassed&&!footerEntered);
 document.body.classList.toggle('hof-dock-visible',visible);
 if(dock){
  if(active){
   document.body.classList.remove('nova-inline-booking-visible');
   dock.inert=!visible;dock.setAttribute('aria-hidden',String(!visible));
  }else{
   const inlineVisible=novaInlineBookingVisible(dock,header);
   document.body.classList.toggle('nova-inline-booking-visible',inlineVisible);
   dock.inert=inlineVisible||document.body.classList.contains('lock');
   if(inlineVisible)dock.setAttribute('aria-hidden','true');
   else dock.removeAttribute('aria-hidden');
  }
 }
}
function updateTop(){
 const button=document.querySelector('[data-top]');
 if(button)button.hidden=scrollY<600;
 syncBookingDock();
}
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
 document.querySelector('main')?.classList.add('route-enter');
 window.scrollTo({top:0,behavior:'instant'});
 if(place){
  document.querySelector('main')?.focus({preventScroll:true});
 }else if(id){
  scrollToSection(id);
 }
}
// Page preview is read-only. Click targets select fields in the authorized parent editor.
if(isEditorPreview){
 document.addEventListener('click',e=>{
  const node=e.target.closest('[data-editor-icon],[data-editor-key],[data-content],[data-image]');
  e.preventDefault();e.stopImmediatePropagation();
  const key=node?.dataset.editorIcon||node?.dataset.editorKey||node?.dataset.content||node?.dataset.image||'';
  window.parent.postMessage({source:'nova-cms-inspector',key},location.origin);
 },true);
  // Same-origin draft messages update the preview DOM only; never write to D1 or R2.
 window.addEventListener('message',event=>{
  if(event.source!==window.parent||event.origin!==location.origin||event.data?.source!=='nova-cms-draft')return;
  const {key,value,type}=event.data;
  if(typeof key!=='string'||!Object.hasOwn(EDITOR_BY_KEY,key)||typeof value!=='string'||value.length>1600)return;
  if(type==='toggle'){
   const selector=key==='home_story_visible'?'#about':
     key==='home_events_visible'?'.home-events':
     key==='home_booking_visible'?'#booking':
     /^venue_(pob|east)_gallery_visible$/.test(key)?'.detail-gallery':null;
   if(selector)document.querySelector(selector)?.style.setProperty('display',value==='no'?'none':'');
   return;
  }
  if(type==='icon'){
   if(!ICON_CHOICES.includes(value))return;
   document.querySelectorAll('[data-editor-icon="'+key+'"]').forEach(svg=>{
    if(value==='none'){svg.style.display='none';return}
    svg.style.display='';
    svg.innerHTML=ICON_PATHS[value]||ICON_PATHS['arrow-right'];
   });
   return;
  }
  const selectors=['[data-editor-key="'+key+'"]','[data-content="'+key+'"]','[data-image="'+key+'"]'];
  for(const node of document.querySelectorAll(selectors.join(','))){
   if(type==='image'){
    if(node.tagName==='IMG'&&(/^\/media\/[A-Za-z0-9_.-]+\.(jpg|png|webp|svg)$/.test(value)||value.startsWith('blob:'+location.origin+'/')))node.src=value;
   }else if(type==='link'){
    if(validCmsHref(value)&&node.tagName==='A')node.setAttribute('href',value);
    else node.title=value;
   }else if(type==='text'||type==='textarea'){
    const textNode=[...node.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
    if(textNode)textNode.textContent=typography(value,language);
    else if(node.children.length===0)node.textContent=typography(value,language);
   }
  }
 });
document.addEventListener('mouseover',e=>{
  document.querySelectorAll('.cms-inspect-highlight').forEach(n=>n.classList.remove('cms-inspect-highlight'));
  const el=e.target.closest('[data-editor-icon],[data-editor-key],[data-content],[data-image]');el?.classList.add('cms-inspect-highlight');
 },{passive:true});
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button,a');if(!b)return;
 if(b.matches('[data-language]')){const next=b.dataset.language;if(next===language)return;const open=drawerOpen,kind=modalKind,id=modalVenue;language=next;try{localStorage.setItem('nova-language',language)}catch{}drawerOpen=false;document.body.classList.remove('lock');render();document.querySelector('main')?.classList.add('route-enter');if(open)setDrawer(true);if(kind&&kind!=='review')openModal(kind,id);document.querySelector(`[data-language="${next}"]`)?.focus();return;}
 if(b.matches('[data-drawer]')){setDrawer(!drawerOpen);return;}
 if(b.matches('[data-scroll]')){e.preventDefault();scrollToSection(b.dataset.scroll);return;}
 if(b.matches('[data-modal]')){openModal(b.dataset.modal,b.dataset.venue||selected||(isEvents?scopedEventVenue:null));return;}
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
window.addEventListener('resize',updateTop,{passive:true});
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
 document.querySelector('main')?.classList.add('route-enter');
 if(location.hash)scrollToHash(true);
 else window.scrollTo({top:0,behavior:'auto'});
});
matchMedia('(min-width:901px)').addEventListener('change',e=>{if(e.matches&&drawerOpen)setDrawer(false);});

async function getJSON(url,options){const r=await fetch(url,options);if(!r.ok)throw Error(url+': '+r.status);return r.json();}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try {
 defaults=await getJSON('/content-defaults.json');
} catch {
 document.documentElement.classList.remove('nova-js');
 app.innerHTML='<p class="loading">NOVA — '+t('Не удалось загрузить страницу. Обновите её.','Could not load the page. Please reload.')+'</p>';
 throw Error('Defaults unavailable');
}
// Resolve CMS before the visible first paint, with an upper bound for stalled APIs.
let cmsSettled=false;
const cms=Promise.allSettled([
 getJSON('/api/content').then(data=>{source=data;}).catch(()=>{contentFailed=true;}),
 getJSON('/api/events',{cache:'no-store'}).then(data=>{if(!Array.isArray(data.events))throw Error('Invalid events response');events=data.events;eventsLoaded=true;eventsFailed=false;}).catch(()=>{eventsFailed=true;})
]).then(()=>{cmsSettled=true;});
await Promise.race([cms,pause(700)]);
render();
scrollToHash(true);
const heroImage=app.querySelector('.hero-photo img');
const imageDecoded=heroImage?.decode ? heroImage.decode().catch(()=>{}) : Promise.resolve();
// One stable first paint; never move the image or title after they appear.
await Promise.race([Promise.allSettled([document.fonts?.ready||Promise.resolve(),imageDecoded]),pause(1200)]);
alignHeroPhoto();
app.classList.add('nova-ready');
requestAnimationFrame(()=>{app.querySelector('.hero-intro')?.classList.add('hero-play');});
heroIntroPending=false;
if(!cmsSettled){
 await cms;
 patchLateContent();
}
if(contentFailed)console.warn('NOVA content unavailable; bundled defaults are displayed.');

/* Fresh event data after publication in another tab or after navigation.
   The Worker already sends Cache-Control: no-store; bypass client caches too. */
let eventRefreshPromise=null;
let lastEventCheck=Date.now();
async function refreshPublishedEvents(force=false){
 if(!force&&document.hidden)return;
 if(eventRefreshPromise)return eventRefreshPromise;
 const now=Date.now();
 if(!force&&now-lastEventCheck<1600)return;
 lastEventCheck=now;
 eventRefreshPromise=(async()=>{
  try{
   const data=await getJSON('/api/events',{cache:'no-store'});
   if(!Array.isArray(data.events))throw Error('Invalid events response');
   const changed=!eventsLoaded||eventsFailed||JSON.stringify(events)!==JSON.stringify(data.events);
   events=data.events;
   eventsLoaded=true;
   eventsFailed=false;
   if(changed)patchEventSections();
  }catch(e){
   // Never replace a previously valid lineup with an empty list on network failure.
   if(!eventsLoaded){eventsFailed=true;patchEventSections();}
   console.warn('NOVA events refresh failed',e);
  }
 })().finally(()=>{eventRefreshPromise=null;});
 return eventRefreshPromise;
}
document.addEventListener('visibilitychange',()=>{
 if(!document.hidden)void refreshPublishedEvents();
});
window.addEventListener('focus',()=>{if(!document.hidden)void refreshPublishedEvents();});
window.addEventListener('pageshow',e=>{if(e.persisted)void refreshPublishedEvents();});
if(typeof BroadcastChannel!=='undefined'){
 const eventUpdates=new BroadcastChannel('nova-events-changed');
 eventUpdates.addEventListener('message',event=>{
  if(event.data==='changed')void refreshPublishedEvents(true);
 });
}
