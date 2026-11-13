import {escapeHTML as esc, typography, cleanPhone, validPhone, minskNow, splitEvents, safeURL, localImage, localizedValue} from './core.js';
import {enhanceBookingSelects} from './booking-selects.js';
import {enhanceBookingDate} from './booking-date.js';
import {EDITOR_BY_KEY,ICON_CHOICES} from './editor-schema.js?v=cms-preview-dialogs-20261113';
import {cropCSS,applyPhotoCrop,parseCrop,cropPattern,isPhotoKey,DEFAULT_CROP} from './photo-crop.js';
const app = document.querySelector('#app');
const isEvents = document.body.dataset.page === 'events';
// A previous visit to the Spaces section leaves /#venues in the address bar.
// On an explicit reload, treat it as reopening the homepage, not as a fresh
// request to jump past the NOVA cover. Internal links and intentional deep
// links on new navigations still go to the requested anchor.
const homeReloadNavigation=performance.getEntriesByType('navigation')[0]?.type==='reload';
const resetStaleVenueAnchor=!isEvents&&location.pathname==='/'&&location.hash==='#venues'&&homeReloadNavigation;
if(resetStaleVenueAnchor){
 // Keep the browser from overriding our scroll reset while scripts load.
 history.scrollRestoration='manual';
 history.replaceState(history.state,'',location.pathname+location.search);
 window.scrollTo({top:0,behavior:'instant'});
}
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
// The Worker embeds a snapshot of *published* D1 events in public HTML.
 // This keeps the actual lineup available even if an extra browser fetch fails.
let serverEvents=null;
try{
 const snapshot=document.getElementById('nova-events-bootstrap');
 if(snapshot){
  const parsed=JSON.parse(snapshot.textContent||'null');
  if(Array.isArray(parsed))serverEvents=parsed;
 }
}catch(error){console.warn('NOVA embedded events unavailable',error)}
let defaults = {content:{},content_en:{}}, source = {}, events = serverEvents||[], contentFailed = false, eventsFailed = false, eventsLoaded = serverEvents!==null;
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
const image = (key,alt,priority=false,fallbackKey='') => `<img class="cms-photo" data-image="${key}" src="${esc(media(key)||(fallbackKey?media(fallbackKey):''))}?v=visual-2" alt="${text(alt)}" style="${cropCSS(editorValue(key+'_crop')||(fallbackKey?editorValue(fallbackKey+'_crop'):'')||DEFAULT_CROP)}" ${priority?'fetchpriority="high"':'loading="lazy"'} decoding="async" width="900" height="900">`;
const languages = () => `<div class="language" role="group" aria-label="${t('Язык сайта','Site language')}">${['ru','en'].map(l=>`<button type="button" data-language="${l}" aria-pressed="${l===language}" aria-label="${l==='ru'?'Русский язык':'English language'}">${l.toUpperCase()}</button>`).join('')}</div>`;
const nav = () => `<a href="${H('nav_spaces_url','/#venues')}" ${hrefFor('nav_spaces_url','/#venues')==='/#venues'?'data-home="venues"':''} data-editor-key="nav_spaces_url">${E('nav_spaces_text')}</a><a href="${H('nav_events_url','/events')}" ${isEvents?'aria-current="page"':''} data-editor-key="nav_events_url">${E('nav_events_text')}</a><a href="${H('nav_about_url','/#about')}" ${hrefFor('nav_about_url','/#about')==='/#about'?'data-home="about"':''} data-editor-key="nav_about_url">${E('nav_about_text')}</a><a href="${H('nav_contacts_url','#contacts')}" data-editor-key="nav_contacts_url">${E('nav_contacts_text')}</a>`;
const hofSketchUnderline = '<svg class="hof-sketch-underline" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="100" d="M3 6.4 C17 4.8 25 7.8 40 6.4 S76 7.2 97 5.5"/><path pathLength="100" d="M9 9 C29 7.4 43 9.7 63 8.1 S84 8 93 7.3"/></svg>';
const novaHeaderMark="<svg class=\"brand-mark-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"36\" height=\"36\" viewBox=\"99 49 287 290\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M 282.87 58.11 C 283.29 59.82 281.06 59.04 279.93 58.87 C 276.83 58.4 273.13 58.28 270 58.41 C 259.96 58.85 249.89 59.46 240 61.3 C 212.98 66.31 187.15 79.78 168.12 99.83 C 163.88 104.29 160.46 109.5 156.34 113.95 C 155.38 114.98 152.3 118.41 152.59 119.92 C 152.79 120.96 154.62 119.63 154.93 119.42 C 156.69 118.27 158.44 117.03 160.11 115.76 C 164.29 112.61 169.28 109.66 174 107.4 C 190.41 99.53 207.02 92.24 225.01 88.76 C 251.74 83.6 279.59 83.44 306 90.42 C 316.3 93.14 325.53 97.92 335.03 102.45 C 347.17 108.24 359.13 118.81 366.76 129.9 C 375.3 142.33 380.75 155.86 382.16 171 C 382.65 176.32 382.07 181.67 382.25 187 C 383.04 210.68 378.28 232.64 368.87 254.12 C 366.11 260.43 362.83 267.54 358.58 273 C 354.34 278.43 350.2 283.84 345.76 289.12 C 337.46 299 326.34 309.08 314.88 315.13 C 306.64 319.48 298.67 324.05 289.95 327.36 C 271.1 334.53 251.06 336.25 231 335.46 C 223.62 335.17 215.05 333.92 208 331.66 C 206.94 331.32 201.48 330.64 201.74 329.02 C 201.82 328.5 203.71 328.52 204 328.51 C 206 328.39 208 328.47 210 328.48 C 219.06 328.51 228.08 327.02 237 325.73 C 244.26 324.68 251.73 322.54 258.6 320.02 C 279.13 312.49 297.71 303.75 314.18 288.89 C 319.31 284.27 324.02 278.85 327.88 273.13 C 328.62 272.03 331.89 268.42 331.57 267.06 C 331.23 265.59 327.47 268.68 327 269.03 C 321.76 272.89 315.95 276.97 310.02 279.65 C 293.75 287.01 278.2 293.76 260.7 298.01 C 212.97 309.62 153.91 300.48 120.43 262.01 C 109.89 249.89 103.32 233.89 101.58 218 C 100.78 210.75 101.51 203.28 101.34 196 C 100.03 140.07 134.49 83.82 187.03 62.55 C 204.88 55.32 223.6 51.39 243 51.39 C 256.66 51.39 270.13 53.68 282.87 58.11 Z M 322.13 109.11 C 313.48 104.87 305.26 101.27 295.97 98.69 C 283.1 95.12 269.14 95.43 256 96.52 C 216.96 99.77 183.37 119.58 156.1 146.75 C 149.54 153.28 144.72 161.51 139.95 169.32 C 125.44 193.06 122.23 221.84 132.98 247.65 C 138.68 261.32 150.99 271.04 162.87 278.89 C 167.92 282.22 173.97 283.9 179.56 286 C 194.9 291.76 212.84 292.67 229 290.54 C 259.61 286.51 290.11 274.81 313.44 253.97 C 322.6 245.78 330.48 236.9 337.9 227.17 C 356.44 202.87 365.09 164.21 348.98 136.55 C 342.26 125.03 333.23 116.32 322.13 109.11 Z\" fill=\"currentColor\" fill-rule=\"evenodd\" transform=\"translate(0.5 0.5)\"/></svg>";
function header(){return `<a class="skip" href="#main">${t('К содержимому','Skip to content')}</a><header class="site-header"><a class="brand brand-header-mark" href="${H('global_logo_url','/')}" data-editor-key="global_logo_url" aria-label="${t('NOVA — на главную','NOVA — home')}">${editorValue('global_logo_image')?'<img data-editor-key="global_logo_image" src="'+imageFor('global_logo_image')+'" alt="NOVA">':novaHeaderMark}</a><nav class="main-nav${selected==='zyb'?' hof-sketch-nav':''}" aria-label="${t('Основная навигация','Main navigation')}">${nav()}${selected==='zyb'?hofSketchUnderline:''}</nav><div class="header-side">${languages()}<button type="button" class="button header-book" data-modal="booking">${bookingLabel()}</button><button type="button" class="menu-toggle" data-drawer aria-controls="drawer" aria-expanded="false" aria-label="${t('Открыть меню','Open menu')}"><span></span><span></span></button></div></header>`;}
const instagramMark=()=>I('global_instagram_icon','instagram').replace('class="arrow"','class="footer-icon"');
const hofInstagramURL=()=>safeURL(value('instagram_zyb'));
const locationMark=()=>I('global_map_icon','map-pin').replace('class="arrow"','class="footer-icon"');
function contactLinks(id){
 const phone=value('phone_'+id), instagram=safeURL(value('instagram_'+id)), telegram=safeURL(value('telegram_'+id)), route=safeURL(value('map_'+id));
 return `${phone&&validPhone(phone)?`<a class="footer-phone" data-editor-key="phone_${id}" href="tel:${esc(phone.replace(/[^+\d]/g,''))}">${text(phone)}</a>`:''}${instagram||telegram||route?`<div class="footer-socials">${instagram?`<a class="footer-social-icon" data-editor-key="instagram_${id}" href="${esc(instagram)}" target="_blank" rel="noopener noreferrer" aria-label="${id==='zyb'?t('Instagram HÓF by NOVA — Зыбицкая','Instagram HÓF by NOVA — Zybitskaya'):'Instagram NOVA '+name(id)}" title="Instagram">${instagramMark()}<span class="sr-only">Instagram</span></a>`:''}${telegram?`<a class="footer-social-text" data-editor-key="telegram_${id}" href="${esc(telegram)}" target="_blank" rel="noopener noreferrer">Telegram</a>`:''}${route?`<a class="footer-route footer-social-icon" data-editor-key="map_${id}" href="${esc(route)}" target="_blank" rel="noopener noreferrer" aria-label="${t('Показать NOVA на карте','View NOVA on map')} ${name(id)}" title="${t('На карте','View on map')}">${locationMark()}</a>`:''}</div>`:''}`;
}
function footer(){return `<footer class="site-footer" id="contacts"><div class="footer-top"><div><a class="brand" href="${H('global_logo_url','/')}" data-editor-key="global_logo_url">${E('footer_logo_text')}</a><p data-content="footer_tagline">${content('footer_tagline')}</p></div></div><div class="footer-locations">${ids.map(id=>`<div class="footer-location"><h3><a href="${venueURL(id)}" data-place="${id}">${brandName(id)}</a></h3>${value('address_'+id)?`<p class="venue-address">${content('address_'+id)}</p>`:''}${value('hours_'+id)?`<p class="venue-hours">${content('hours_'+id)}</p>`:''}${contactLinks(id)}${!['address_','phone_','instagram_','telegram_','hours_','map_'].some(k=>value(k+id))?`<p class="muted">${t('Контакты уточняются','Contact details coming soon')}</p>`:''}</div>`).join('')}</div><div class="footer-bottom"><span data-editor-key="footer_left">${E('footer_left')}</span><span data-editor-key="footer_right">${E('footer_right')}</span></div></footer>`;}
function layers(){return `<aside id="drawer" class="drawer" inert aria-hidden="true" aria-label="${t('Мобильная навигация','Mobile navigation')}"><nav>${nav()}</nav><button type="button" class="button" data-modal="booking">${bookingLabel()}</button><p>MINSK · LOUNGE CAFÉ</p></aside><div class="mobile-cta"><button class="button" data-modal="booking">${bookingLabel()}</button></div><button class="to-top" data-top hidden aria-label="${t('Наверх','Back to top')}">${arrow}</button><dialog class="modal" aria-labelledby="modal-title"><div class="modal-shell"><div class="modal-top"><span class="eyebrow">NOVA / <span id="modal-caption">MINSK</span></span><button class="close" data-close aria-label="${t('Закрыть окно','Close dialog')}">×</button></div><div id="modal-body"></div></div></dialog>`;}
// Only real published events returned by the events API appear on public pages.
function displayEvents(){return events;}
function eventCard(e,home=false,eventPath='/events'){
 const title=language==='en'?(e.title_en||e.title):e.title;
 const desc=language==='en'?(e.description_en||''):e.description;
 const date=new Date(e.starts_at+':00+03:00');
 const when=new Intl.DateTimeFormat(language==='en'?'en-GB':'ru-RU',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Minsk'}).format(date);
 const poster=localImage(e.image_url);
 const pic=poster?`<span class="event-media"><img class="cms-photo" data-event-image="${esc(e.id)}" src="${esc(poster)}" alt="${text(title)}" loading="lazy" width="600" height="800" style="${cropCSS(e.image_crop||DEFAULT_CROP)}"></span>`:'';
 return `<${home?'a':'article'} ${home?`href="${eventPath}#event-${esc(e.id)}"`:`id="event-${esc(e.id)}"`} class="event-card ${poster?'':'no-image'}">${pic}<div class="event-info"><time datetime="${esc(e.starts_at)}:00+03:00">${text(when)} · ${t('Минск','Minsk')}</time><h3>${text(title)}</h3>${!home&&desc?`<p>${text(desc)}</p>`:''}<div class="event-location">${brandName(e.venue)}</div></div></${home?'a':'article'}>`;
}
function home(){const next=splitEvents(displayEvents()).upcoming[0];return `<section class="hero" id="top"><div class="hero-copy"><span class="eyebrow" data-content="hero_kicker">${content('hero_kicker')}</span><h1 class="hero-title" aria-label="NOVA"><span class="hero-letter hero-letter-n" style="--letter-order:0" aria-hidden="true"><svg class="hero-letter-image" xmlns="http://www.w3.org/2000/svg" width="259" height="262" viewBox="104 79 259 262" focusable="false" preserveAspectRatio="xMidYMid meet"><path d="M 106.10 81.90 L 132.88 81.90 L 342.88 305.63 L 342.88 81.90 L 360.63 81.90 L 360.63 338.88 L 344.13 338.13 L 127.70 105.12 L 127.70 338.63 L 106.10 338.38 Z" fill="currentColor"/></svg></span><span class="hero-letter hero-letter-o" style="--letter-order:1" aria-hidden="true"><svg class="hero-letter-image" xmlns="http://www.w3.org/2000/svg" width="287" height="290" viewBox="99 49 287 290" focusable="false" preserveAspectRatio="xMidYMid meet"><path d="M 282.87 58.11 C 283.29 59.82 281.06 59.04 279.93 58.87 C 276.83 58.4 273.13 58.28 270 58.41 C 259.96 58.85 249.89 59.46 240 61.3 C 212.98 66.31 187.15 79.78 168.12 99.83 C 163.88 104.29 160.46 109.5 156.34 113.95 C 155.38 114.98 152.3 118.41 152.59 119.92 C 152.79 120.96 154.62 119.63 154.93 119.42 C 156.69 118.27 158.44 117.03 160.11 115.76 C 164.29 112.61 169.28 109.66 174 107.4 C 190.41 99.53 207.02 92.24 225.01 88.76 C 251.74 83.6 279.59 83.44 306 90.42 C 316.3 93.14 325.53 97.92 335.03 102.45 C 347.17 108.24 359.13 118.81 366.76 129.9 C 375.3 142.33 380.75 155.86 382.16 171 C 382.65 176.32 382.07 181.67 382.25 187 C 383.04 210.68 378.28 232.64 368.87 254.12 C 366.11 260.43 362.83 267.54 358.58 273 C 354.34 278.43 350.2 283.84 345.76 289.12 C 337.46 299 326.34 309.08 314.88 315.13 C 306.64 319.48 298.67 324.05 289.95 327.36 C 271.1 334.53 251.06 336.25 231 335.46 C 223.62 335.17 215.05 333.92 208 331.66 C 206.94 331.32 201.48 330.64 201.74 329.02 C 201.82 328.5 203.71 328.52 204 328.51 C 206 328.39 208 328.47 210 328.48 C 219.06 328.51 228.08 327.02 237 325.73 C 244.26 324.68 251.73 322.54 258.6 320.02 C 279.13 312.49 297.71 303.75 314.18 288.89 C 319.31 284.27 324.02 278.85 327.88 273.13 C 328.62 272.03 331.89 268.42 331.57 267.06 C 331.23 265.59 327.47 268.68 327 269.03 C 321.76 272.89 315.95 276.97 310.02 279.65 C 293.75 287.01 278.2 293.76 260.7 298.01 C 212.97 309.62 153.91 300.48 120.43 262.01 C 109.89 249.89 103.32 233.89 101.58 218 C 100.78 210.75 101.51 203.28 101.34 196 C 100.03 140.07 134.49 83.82 187.03 62.55 C 204.88 55.32 223.6 51.39 243 51.39 C 256.66 51.39 270.13 53.68 282.87 58.11 Z M 322.13 109.11 C 313.48 104.87 305.26 101.27 295.97 98.69 C 283.1 95.12 269.14 95.43 256 96.52 C 216.96 99.77 183.37 119.58 156.1 146.75 C 149.54 153.28 144.72 161.51 139.95 169.32 C 125.44 193.06 122.23 221.84 132.98 247.65 C 138.68 261.32 150.99 271.04 162.87 278.89 C 167.92 282.22 173.97 283.9 179.56 286 C 194.9 291.76 212.84 292.67 229 290.54 C 259.61 286.51 290.11 274.81 313.44 253.97 C 322.6 245.78 330.48 236.9 337.9 227.17 C 356.44 202.87 365.09 164.21 348.98 136.55 C 342.26 125.03 333.23 116.32 322.13 109.11 Z" fill="currentColor" transform="translate(0.5 0.5)" fill-rule="evenodd"/></svg></span><span class="hero-letter hero-letter-v" style="--letter-order:2" aria-hidden="true"><svg class="hero-letter-image" xmlns="http://www.w3.org/2000/svg" width="316" height="251" viewBox="62 71 316 251" focusable="false" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="nova-hero-v-split" x1="0" x2="1" y1="0" y2="0"><stop offset="50%" stop-color="#23351F"/><stop offset="50%" stop-color="#F3E9DD"/></linearGradient></defs><path d="M 63.807 73.834 L 209.668 318.825 L 230.838 317.645 L 374.679 75.187 L 349.335 74.518 L 219.750 296.373 L 90.339 75.355 Z" fill="url(#nova-hero-v-split)"/></svg></span><span class="hero-letter hero-letter-a" style="--letter-order:3" aria-hidden="true"><svg class="hero-letter-image" xmlns="http://www.w3.org/2000/svg" width="327" height="273" viewBox="60 54 327 273" focusable="false" preserveAspectRatio="xMidYMid meet"><path d="M68,315 L68,317 L86,317 L93,304 L105,291 L120,280 L142,269 L179,258 L200,255 L229,254 L265,258 L301,269 L320,278 L343,294 L354,306 L360,317 L378,317 L368,298 L352,273 L348,264 L329,234 L228,62 L218,62Z M223,96 L317,256 L316,259 L303,251 L283,243 L259,237 L237,234 L210,234 L182,238 L163,243 L143,251 L131,258 L129,257 L171,183 L174,180 L174,178Z" fill="currentColor" fill-rule="evenodd"/></svg></span></h1><p class="hero-descriptor" aria-label="Lounge, Kitchen, Bar">LOUNGE <span aria-hidden="true">•</span> KITCHEN <span aria-hidden="true">•</span> BAR</p><p class="hero-tagline" data-content="hero_tagline">${content('hero_tagline')}</p></div><div class="hero-photo">${image('hero_image',t('Интерьер и коктейль','Interior and cocktail'),true)}<div class="photo-side" data-editor-key="home_photo_side">${E('home_photo_side').replace(/\n/g,'<br>')}</div></div></section><section class="venues" id="venues" aria-labelledby="venues-heading"><h2 class="venues-heading" id="venues-heading" data-editor-key="home_locations_title">${E('home_locations_title')}</h2>${ids.map(id=>`<a class="venue-card ${id==='zyb'?'venue-card-hof':''}" href="${H('home_card_'+id+'_url',venueURL(id))}" ${hrefFor('home_card_'+id+'_url',venueURL(id))===venueURL(id)?'data-place="'+id+'"':''} data-editor-key="home_card_${id}_url"><div class="venue-img">${image('home_card_'+id+'_image',t('Пространство ','Location: ')+name(id),false,'venue_'+id+'_image')}${id==='zyb'?'<span class="venue-hof-overlay"><img class="venue-hof-overlay-logo" data-editor-key="home_card_hof_logo_image" src="'+imageFor('home_card_hof_logo_image','/media/hof-wordmark-black.svg')+'" alt="HÓF" width="519" height="247"><span class="venue-hof-overlay-by" data-editor-key="home_card_hof_by">'+E('home_card_hof_by')+'</span></span>':''}</div><div class="venue-foot"><h3 class="venue-title"${id==='zyb'?' data-editor-key="home_card_hof_title"':''}>${id==='zyb'?E('home_card_hof_title'):name(id)}</h3><p class="venue-description" data-content="venue_${id}_subtitle">${content('venue_'+id+'_subtitle')}</p></div></a>`).join('')}</section><section class="story" id="about" ${shown('home_story_visible')?'':'style="display:none"'}><div class="story-copy"><span class="eyebrow muted" data-content="story_kicker">${content('story_kicker')}</span><h2 data-content="story_title">${content('story_title')}</h2><p data-content="story_description">${content('story_description')}</p><button class="text-link nova-compact-cta" data-editor-key="home_story_menu_text" data-modal="menu">${E('home_story_menu_text')} ${I('home_story_menu_icon')}</button></div><figure class="story-photo">${image('story_image',t('Подача блюда','Food presentation'))}</figure></section><section class="home-events" ${shown('home_events_visible')&&next?'':'style="display:none"'}><a class="section-link" href="${H('home_events_url','/events')}" data-editor-key="home_events_url"><h2 data-editor-key="home_events_title">${E('home_events_title')}</h2>${I('home_events_icon')}</a><div>${next?eventCard(next,true):`<p class="event-empty">${!eventsLoaded&&!eventsFailed?t('Загружаем афишу…','Loading events…'):E('home_events_empty')}</p>`}</div></section><section class="book-strip" id="booking" ${shown('home_booking_visible')?'':'style="display:none"'}><div class="book-image">${image('booking_image',t('Детали интерьера','Interior details'))}</div><button class="book-main" type="button" data-modal="booking"><span class="book-welcome" data-editor-key="home_booking_welcome">${E('home_booking_welcome')}</span><span class="book-cta nova-compact-cta nova-compact-cta--inverse"><span data-content="booking_title">${content('booking_title')}</span>${I('home_booking_icon')}</span></button></section>`;}


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
 const upcoming=splitEvents(events.filter(e=>e.venue==='zyb')).upcoming.slice(0,2);
 if(upcoming.length)return `<div class="hof-event-list">${upcoming.map(hofEventRow).join('')}</div><div class="hof-events-footer">${hofLineupLink()}</div>`;
 return `<div class="hof-events-empty"><p>${E('hof_events_empty')}</p>${hofLineupLink()}</div>`;
}
function venueEventsPreview(id){
 const upcoming=splitEvents(events.filter(e=>e.venue===id)).upcoming.slice(0,2);
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

function detail(id){if(id==='zyb')return hofDetail();return `<article class="detail"><a href="${H('venue_'+id+'_back_url','/#venues')}" ${hrefFor('venue_'+id+'_back_url','/#venues')==='/#venues'?'data-home="venues"':''} class="detail-back" data-editor-key="venue_${id}_back_url">${arrow}${E('venue_'+id+'_back_text')}</a><div class="detail-grid"><div class="detail-copy"><span class="eyebrow muted" data-editor-key="venue_${id}_kicker">${E('venue_'+id+'_kicker')}</span><h1 data-editor-key="venue_${id}_name">${name(id)}</h1><div class="subtitle" data-content="venue_${id}_subtitle">${content('venue_'+id+'_subtitle')}</div><p data-content="venue_${id}_desc">${content('venue_'+id+'_desc',t('Описание готовится.','Details coming soon.'))}</p><div class="detail-actions"><button class="button nova-compact-cta" data-editor-key="venue_${id}_booking_text" data-modal="booking" data-venue="${id}">${E('venue_'+id+'_booking_text')}</button><button class="button secondary nova-compact-cta" data-editor-key="menu_${id}" data-modal="menu-location" data-venue="${id}">${E('venue_'+id+'_menu_text')}</button></div></div><div class="detail-image">${image('venue_'+id+'_image',t('Пространство ','Location: ')+name(id),true)}</div></div><div class="detail-bottom"><div><span class="eyebrow muted" data-editor-key="venue_${id}_atmosphere_kicker">${E('venue_'+id+'_atmosphere_kicker')}</span><h2 data-editor-key="venue_${id}_atmosphere_title">${E('venue_'+id+'_atmosphere_title')}</h2><p data-content="venue_${id}_second">${content('venue_'+id+'_second')}</p><p class="features" data-content="venue_${id}_features">${content('venue_'+id+'_features')}</p><button class="text-link nova-compact-cta" data-editor-key="venue_${id}_contacts_text" data-modal="contacts" data-venue="${id}">${E('venue_'+id+'_contacts_text')} ${arrow}</button></div><div><div class="detail-gallery" ${shown('venue_'+id+'_gallery_visible')?'':'style="display:none"'}>${[1,2].map(i=>'<span class="cms-photo-clip">'+image(`gallery_${id}_${i}_image`,t('Фотография заведения','Venue photo'))+'</span>').join('')}</div></div></div>${venueEventsPreview(id)}</article>`;}
function venueEventsPage(id){
 const hof=id==='zyb';
 // Never show example events from other locations or fictional samples in a venue view.
 const live=events.filter(e=>e.venue===id);
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
 ${[[upcoming,t('Ближайшие','Coming up'),'future'],[past,t('Архив','Archive'),'archive']].filter(([list,,key])=>key!=='archive'||list.length).map(([list,title,key])=>`<section class="venue-events-section ${key}"><div class="venue-events-section-head"><h2>${title}</h2><span>${list.length.toString().padStart(2,'0')}</span></div><div class="events-list" id="${key}">${list.length?list.map(e=>eventCard(e)).join(''):`<p class="event-empty">${!eventsLoaded&&!eventsFailed?t('Загружаем афишу…','Loading events…'):eventsFailed&&!eventsLoaded?t('Не удалось загрузить афишу. Проверьте соединение и повторите попытку.','Could not load events. Check your connection and try again.'):key==='future'?t('В этом заведении пока нет анонсированных событий.','No upcoming events at this venue yet.'):t('Архив мероприятий пока пуст.','No past events yet.')}</p>`}</div></section>`).join('')}
 </div>`;
}
function eventsPage(){
 if(scopedEventVenue)return venueEventsPage(scopedEventVenue);
 const {upcoming,past}=splitEvents(displayEvents());
 return `<div class="events-page"><section class="events-intro"><span class="eyebrow muted">NOVA / MINSK</span><h1>${t('События','Events')}</h1><p>${t('Встречи, музыка и вечера, которые хочется повторить.','Music, good company and nights worth remembering.')}</p></section>
 ${[[upcoming,t('Ближайшие','Coming up'),'future'],[past,t('Архив','Archive'),'archive']].filter(([list,,id])=>id!=='archive'||list.length).map(([list,title,id])=>`<section class="events-section ${id}"><h2>${title}</h2><div class="events-list" id="${id}">${list.length?list.map(e=>eventCard(e)).join(''):`<p class="event-empty">${!eventsLoaded&&!eventsFailed?t('Загружаем афишу…','Loading events…'):eventsFailed&&!eventsLoaded?t('Не удалось загрузить афишу. Повторите попытку позже.','Could not load events. Please try again later.'):t('На данный момент нет запланированных событий.','There are no upcoming events at the moment.')}</p>`}</div></section>`).join('')}</div>`;
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let heroIntroPending = !isEvents && location.pathname === '/' && !reducedMotion.matches;
let motionObserver = null;
const revealedSections = new Set();
let venuesRevealObserver = null;
let venuesHeadingRevealed = false;
let venuesCardsRevealed = false;
const venuesMobileRevealed = new Set();

// Keep anything already visible on the first screen visible from the first paint.
// This is based on actual element geometry, not device type or hard-coded iPad heights.
// Below-the-fold headings/cards still reveal as they enter the viewport on scroll.
function elementInViewport(el){
 const rect=el.getBoundingClientRect();
 const headerBottom=app.querySelector('.site-header')?.getBoundingClientRect().bottom||0;
 return rect.width>0 && rect.height>0 && rect.top<window.innerHeight && rect.bottom>Math.max(0,headerBottom);
}

// Reveal desktop cards together with a subtle left-to-right stagger.
// On mobile each stacked card appears only when it first enters the viewport.
function setupVenuesReveal(){
 venuesRevealObserver?.disconnect();
 const section=app.querySelector('.venues');
 if(!section || reducedMotion.matches || !('IntersectionObserver' in window))return;
 const heading=section.querySelector('.venues-heading');
 const cards=[...section.querySelectorAll('.venue-card')];
 if(!heading || !cards.length)return;
 const mobile=matchMedia('(max-width:600px)').matches;
 const first=cards[0];

 // Measure BEFORE adding venues-motion, which otherwise hides elements.
 // Once content has been visible it must never disappear on rerender/resize.
 if(elementInViewport(heading))venuesHeadingRevealed=true;
 if(mobile){
  cards.forEach(card=>{
   if(elementInViewport(card))venuesMobileRevealed.add(card.dataset.place);
   if(venuesMobileRevealed.has(card.dataset.place))card.classList.add('venue-card-entered');
  });
 }else if(cards.some(elementInViewport)){
  venuesCardsRevealed=true;
 }
 if(venuesHeadingRevealed)section.classList.add('venues-heading-entered');
 if(venuesCardsRevealed)section.classList.add('venues-cards-entered');

 // All state classes above are set BEFORE the hiding rules take effect.
 section.classList.add('venues-motion');
 section.classList.toggle('venues-mobile-motion',mobile);
 cards.forEach((card,i)=>{
  card.style.setProperty('--venue-stagger',mobile?'0ms':i*130+'ms');
  const image=card.querySelector('.venue-img img');
  if(!image)return;
  const showImage=()=>image.classList.add('venue-image-loaded');
  if(image.complete&&image.naturalWidth>0)showImage();
  else{
   image.addEventListener('load',()=>requestAnimationFrame(showImage),{once:true});
   image.addEventListener('error',showImage,{once:true});
  }
 });

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
 if(mobile){
  cards.filter(card=>!card.classList.contains('venue-card-entered')).forEach(card=>venuesRevealObserver.observe(card));
 }else if(!venuesCardsRevealed)venuesRevealObserver.observe(first);
}

// The split follows the visual centre of the provided V SVG, not font metrics.
// The SVG has explicit dimensions, so this is stable even before image decoding.
function alignHeroPhoto() {
 const hero=app.querySelector('.hero');
 const letter=hero?.querySelector('.hero-letter-v .hero-letter-image');
 if(!hero||!letter||matchMedia('(max-width:600px)').matches){
  hero?.style.removeProperty('--hero-photo-start');
  return;
 }
 const heroBox=hero.getBoundingClientRect(),vBox=letter.getBoundingClientRect();
 if(!heroBox.width||!vBox.width)return;
 const centre=vBox.left+vBox.width/2;
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
  const key=el.dataset.image;
  if(isPhotoKey(key))applyPhotoCrop(el,editorValue(key+'_crop')||(/^home_card_/.test(key)?editorValue('venue_'+key.split('_')[2]+'_image_crop'):'')||DEFAULT_CROP);
  const url=media(key);
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
  const section=app.querySelector('.home-events');
  if(!section)return;
  const visible=shown('home_events_visible')&&splitEvents(displayEvents()).upcoming.length>0;
  const wasHidden=section.style.display==='none';
  const oldList=section.querySelector(':scope > div');
  if(oldList){
   const template=document.createElement('template');
   template.innerHTML=home();
   const nextList=template.content.querySelector('.home-events > div');
   if(nextList)oldList.replaceChildren(...nextList.childNodes);
  }
  section.style.display=visible?'':'none';
  // An initially hidden home lineup can have reveal elements left unobserved.
  // When fresh data makes it visible, guarantee that its live cards can be read.
  if(visible&&wasHidden){
   section.querySelectorAll('.section-link,.event-card').forEach(el=>{
    motionObserver?.unobserve(el);
    el.classList.remove('nova-reveal');
    el.classList.add('is-visible');
   });
  }
 }
}

// HÓF only: animated hand-drawn underline for the existing navigation links.
// These are ordinary links, not Radix tabs: routes, CMS, and mobile drawer stay intact.
let hofSketchResizeObserver=null;
function setupHofSketchNav(){
 hofSketchResizeObserver?.disconnect();
 hofSketchResizeObserver=null;
 const nav=app.querySelector('.hof-sketch-nav');
 if(!nav)return;
 const marker=nav.querySelector('.hof-sketch-underline');
 const links=[...nav.querySelectorAll(':scope > a')];
 if(!marker||!links.length)return;
 // No default or persistent active link. Show only on pointer hover or
 // keyboard-visible focus; a mouse click must not leave an underline behind.
 let hoveredLink=null;
 let focusedLink=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const position=(link,redraw=true)=>{
  if(!nav.isConnected||!link.offsetWidth)return;
  marker.style.left=(link.offsetLeft+7)+'px';
  marker.style.width=Math.max(18,link.offsetWidth-14)+'px';
  marker.style.opacity='1';
  if(!redraw||reduced){marker.classList.add('is-drawn');return;}
  marker.classList.remove('is-drawn');
  // Reflow the tiny marker, not the page, to replay its stroke animation.
  void marker.getBoundingClientRect().width;
  marker.classList.add('is-drawn');
 };
 const sync=(redraw=false)=>{
  const current=hoveredLink||(focusedLink?.matches(':focus-visible')?focusedLink:null);
  if(current)position(current,redraw);
  else marker.style.opacity='0';
 };
 for(const link of links){
  link.addEventListener('mouseenter',()=>{hoveredLink=link;sync(true);});
  link.addEventListener('mouseleave',()=>{if(hoveredLink===link)hoveredLink=null;sync(false);});
  link.addEventListener('focus',()=>{focusedLink=link;sync(true);});
  link.addEventListener('blur',()=>{if(focusedLink===link)focusedLink=null;sync(false);});
 }
 nav.addEventListener('mouseleave',()=>{hoveredLink=null;sync(false);});
 if('ResizeObserver' in window){
  hofSketchResizeObserver=new ResizeObserver(()=>sync(false));
  hofSketchResizeObserver.observe(nav);
  for(const link of links)hofSketchResizeObserver.observe(link);
 }
 sync(false);
 document.fonts?.ready.then(()=>sync(false));
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
 setupHofSketchNav();
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
  const phone=value('phone_zyb'),route=safeURL(value('map_zyb')),telegram=safeURL(value('telegram_zyb')),instagram=hofInstagramURL();
  const items=[
   address?`<div class="hof-contact-info"><span class="hof-contact-label">${t('Адрес','Address')}</span><p data-content="address_zyb">${content('address_zyb')}</p></div>`:'',
   hours?`<div class="hof-contact-info"><span class="hof-contact-label">${t('Часы работы','Opening hours')}</span><p class="venue-hours" data-content="hours_zyb">${content('hours_zyb')}</p></div>`:''
  ].filter(Boolean).join('');
  const actions=[
   phone&&validPhone(phone)?`<a class="hof-contact-action" href="tel:${esc(phone.replace(/[^+\d]/g,''))}"><span data-editor-key="phone_zyb">${text(phone)}</span>${arrow}</a>`:'',
   route?`<a class="hof-contact-action" data-editor-key="map_zyb" href="${esc(route)}" target="_blank" rel="noopener noreferrer"><span>${t('Построить маршрут','Get directions')}</span>${arrow}</a>`:'',
   telegram?`<a class="hof-contact-action" data-editor-key="telegram_zyb" href="${esc(telegram)}" target="_blank" rel="noopener noreferrer"><span>Telegram</span>${arrow}</a>`:'',
   instagram?`<a class="hof-contact-action" data-editor-key="instagram_zyb" href="${esc(instagram)}" target="_blank" rel="noopener noreferrer" aria-label="${t('Instagram HÓF by NOVA — Зыбицкая','Instagram HÓF by NOVA — Zybitskaya')}"><span>Instagram</span>${arrow}</a>`:''
  ].filter(Boolean).join('');
  if(!items&&!actions)return `<p class="intro">${t('Контакты этого заведения ещё уточняются.','Contact details for this space are coming soon.')}</p>`;
  return `<div class="hof-contact-details">${items}${actions?`<div class="hof-contact-modal-actions">${actions}</div>`:''}</div>`;
 }
 const links=contactLinks(id);
 return `${address||hours||links?`<div class="contact-list">${address?`<div><h3>${t('Адрес','Address')}</h3><p data-content="address_${id}">${text(address)}</p></div>`:''}${hours?`<div><h3>${t('Часы работы','Opening hours')}</h3><p class="venue-hours" data-content="hours_${id}">${text(hours)}</p></div>`:''}${links}</div>`:`<p class="intro">${t('Контакты этого заведения ещё уточняются.','Contact details for this space are coming soon.')}</p>`}`;
}
// Native selects remain the source of truth for validation and FormData.
// Mobile-only visible venue options and guest stepper replace generic controls.
function enhanceMobileBooking(form,language){
 if(!matchMedia('(max-width:600px)').matches)return;
 const en=language==='en';
 const venue=form.elements.venue;
 if(venue?.tagName==='SELECT'){
  const group=document.createElement('div');
  group.className='booking-venue-options';
  group.setAttribute('role','radiogroup');
  group.setAttribute('aria-label',en?'Venue':'Заведение');
  const labels={zyb:'HÓF',pob:en?'Pobediteley':'Победителей',east:en?'Vostok':'Восток'};
  const buttons=ids.map(id=>{
   const button=document.createElement('button');
   button.type='button';
   button.className='booking-venue-option';
   button.setAttribute('role','radio');
   button.setAttribute('aria-checked',String(venue.value===id));
   button.textContent=labels[id];
   button.addEventListener('click',()=>{
    venue.value=id;
    venue.dispatchEvent(new Event('change',{bubbles:true}));
    sync();
   });
   group.append(button);
   return button;
  });
  function sync(){
   buttons.forEach((button,index)=>{
    const selected=venue.value===ids[index];
    button.setAttribute('aria-checked',String(selected));
    button.tabIndex=selected?0:(venue.value? -1 : index===0?0:-1);
   });
  }
  group.addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
   event.preventDefault();
   const current=ids.indexOf(venue.value);
   const step=['ArrowRight','ArrowDown'].includes(event.key)?1:-1;
   const next=(current+step+ids.length)%ids.length;
   buttons[next].click();
   buttons[next].focus();
  });
  venue.addEventListener('change',sync);
  venue.insertAdjacentElement('afterend',group);
  // Manual submit validation reports an inline error rather than focusing a hidden select.
  venue.required=false;
  sync();
 }
 const guests=form.elements.guests;
 if(guests?.tagName==='SELECT'){
  const wrapper=document.createElement('div');
  wrapper.className='booking-guest-stepper';
  wrapper.setAttribute('role','group');
  wrapper.setAttribute('aria-label',en?'Number of guests':'Количество гостей');
  const minus=document.createElement('button');
  minus.type='button';minus.className='booking-stepper-minus';minus.textContent='−';
  minus.setAttribute('aria-label',en?'Remove a guest':'Уменьшить количество гостей');
  const display=document.createElement('output');
  display.className='booking-guest-count';
  display.setAttribute('aria-live','polite');
  const plus=document.createElement('button');
  plus.type='button';plus.className='booking-stepper-plus';plus.textContent='+';
  plus.setAttribute('aria-label',en?'Add a guest':'Добавить гостя');
  function sync(){
   const num=Number(guests.value)||2;
   display.textContent=String(num)+' '+(en?(num===1?'guest':'guests'):(num%10===1&&num%100!==11?'гость':num%10>=2&&num%10<=4&&(num%100<12||num%100>14)?'гостя':'гостей'));
   minus.disabled=num<=1;
   plus.disabled=num>=16;
  }
  function move(delta){
   const next=Math.max(1,Math.min(16,(Number(guests.value)||2)+delta));
   guests.value=String(next);
   guests.dispatchEvent(new Event('change',{bubbles:true}));
   sync();
  }
  minus.addEventListener('click',()=>move(-1));
  plus.addEventListener('click',()=>move(1));
  guests.addEventListener('change',sync);
  wrapper.append(minus,display,plus);
  guests.insertAdjacentElement('afterend',wrapper);
  sync();
 }
 form.classList.add('booking-enhanced');
}
// Booking requests are stored in the NOVA D1 database before showing success.
function bookingFormHTML(requestedVenue){
 const day=minskNow().slice(0,10),fixed=ids.includes(requestedVenue);
 return `<h2 id="modal-title" data-editor-key="global_booking_text">${bookingLabel()}</h2>
 <p class="intro"><span class="booking-desktop-copy">${t('Оставьте заявку. Администратор свяжется с вами для подтверждения бронирования.','Send a request. The venue will contact you to confirm your reservation.')}</span><span class="booking-mobile-copy">${t('Выберите дату, время и оставьте контакты. Администратор подтвердит бронь.','Choose a date and time. The venue will contact you to confirm.')}</span></p>
 <form id="book-form">
  <div class="booking-form-scroll">
  <div class="form-fields">
   <div class="booking-section-title booking-visit-title"><span>01</span><strong>${t('ВАШ ВИЗИТ','YOUR VISIT')}</strong></div>
   <div class="field full booking-venue"><label for="venue">${t('Заведение','Venue')}</label>
    ${fixed?`<div class="venue-context">${venueLabel(requestedVenue)}</div><input type="hidden" id="venue" name="venue" value="${requestedVenue}">`:
    `<select id="venue" name="venue" required><option value="">${t('Выберите заведение','Choose a venue')}</option>${ids.map(id=>`<option value="${id}">${venueLabel(id)}</option>`).join('')}</select>`}</div>
   <div class="field booking-date"><label for="date">${t('Дата','Date')}</label><input id="date" name="date" type="date" min="${day}" value="${day}" required></div>
   <div class="field booking-time"><label for="time">${t('Время · Минск','Time · Minsk')}</label><select id="time" name="time" required>${Array.from({length:96},(_,i)=>{const hour=String(Math.floor(i/4)).padStart(2,'0'),mins=String(i%4*15).padStart(2,'0');const value=hour+':'+mins;return `<option value="${value}" ${value==='19:00'?'selected':''}>${value}</option>`}).join('')}</select></div>
   <div class="field booking-guests"><label for="guests"><span class="booking-desktop-copy">${t('Количество гостей','Guests')}</span><span class="booking-mobile-copy">${t('Гостей','Guests')}</span></label><select id="guests" name="guests">${Array.from({length:16},(_,i)=>`<option value="${i+1}" ${i===1?'selected':''}>${i+1}</option>`).join('')}</select></div>
   <div class="booking-section-title booking-contact-title"><span>02</span><strong>${t('ВАШИ КОНТАКТЫ','YOUR CONTACTS')}</strong></div>
   <div class="field booking-name"><label for="guest-name">${t('Ваше имя','Your name')}</label><input id="guest-name" name="name" autocomplete="name" maxlength="80" required></div>
   <div class="field full booking-phone"><label for="phone">${t('Номер телефона','Phone number')}</label><input id="phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="30" placeholder="+375 29 123-45-67" required></div>
   <details class="booking-comment-details">
    <summary>${t('Добавить пожелание','Add a request')}<span aria-hidden="true" class="booking-comment-toggle"></span></summary>
    <div class="field full"><label for="booking-comment">${t('Комментарий (необязательно)','Comment (optional)')}</label><textarea id="booking-comment" name="comment" maxlength="500" rows="2" placeholder="${t('Пожелания к столику','Table preferences')}"></textarea></div>
   </details>
  </div>
  <div class="booking-honeypot" aria-hidden="true"><label for="booking-website">Website</label><input id="booking-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
  <label class="booking-consent"><input name="consent" type="checkbox" required><span>${t('Согласен(на) на использование имени, телефона и деталей заявки для организации бронирования.','I agree to my name, phone number and reservation details being used to process this request.')}</span></label>
  </div>
  <div class="booking-submit-bar">
  <p id="booking-error" class="booking-error" role="alert" aria-live="polite"></p>
  <button class="button form-submit" type="submit">${t('Отправить заявку','Send request')}</button>
  <p class="booking-assurance"><span class="booking-desktop-copy">${t('Заявка не означает подтверждённую бронь. При необходимости срочного ответа свяжитесь с заведением по телефону.','A request is not a confirmed reservation. For an urgent reply, call the venue directly.')}</span><span class="booking-mobile-copy">${t('Бронь действительна после подтверждения.','Your table is reserved only after confirmation.')}</span></p>
  </div>
 </form>`;
}
async function sendBooking(e){
 e.preventDefault();
 const form=e.currentTarget, fd=new FormData(form);
 const venue=String(fd.get('venue')||''),phone=cleanPhone(fd.get('phone')||'');
 const output=form.querySelector('#booking-error');
 const showError=message=>{output.textContent=message};
 showError('');
 if(!ids.includes(venue)){showError(t('Выберите заведение.','Choose a venue.'));form.querySelector('.booking-venue-options button')?.focus();return}
 if(!validPhone(phone)){showError(t('Введите корректный номер телефона.','Enter a valid phone number.'));form.elements.phone.focus();return}
 if(!form.elements.consent.checked){showError(t('Подтвердите согласие на обработку заявки.','Please consent to the use of your reservation details.'));return}
 const date=String(fd.get('date')||''),time=String(fd.get('time')||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):(00|15|30|45)$/.test(time)||date+'T'+time<=minskNow()){
  showError(t('Выберите дату и время в будущем по Минску.','Choose a future date and time in Minsk.'));return;
 }
 const button=form.querySelector('[type="submit"]');
 button.disabled=true;button.textContent=t('Отправляем…','Sending…');
 try{
  const response=await fetch('/api/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   venue,name:String(fd.get('name')||'').trim(),phone,date,time,guests:Number(fd.get('guests')),comment:String(fd.get('comment')||'').trim(),consent:true,website:fd.get('website')||''
  }),credentials:'same-origin',cache:'no-store'});
  const answer=await response.json();
  if(!response.ok||!answer.ok)throw new Error(response.status===429?t('Слишком много запросов. Свяжитесь с заведением по телефону.','Too many requests. Please call the venue.'):response.status===400?t('Проверьте данные и выберите время не раньше чем через 5 минут.','Check the details and choose a time at least 5 minutes ahead.'):t('Не удалось отправить заявку. Попробуйте ещё раз или позвоните.','Could not send your request. Try again or call.'));
  const body=document.getElementById('modal-body');
  document.querySelector('dialog')?.classList.add('booking-complete');
  body.innerHTML=`<h2 id="modal-title" tabindex="-1">${t('Заявка получена','Request received')}</h2><p class="intro">${t('Заявка сохранена и передана администратору заведения. Бронь будет действовать после подтверждения.','Your request has been saved for the venue team. Your reservation is valid only once confirmed.')}</p><div class="booking-confirmation"><strong>${venueLabel(venue)}</strong><span>${text(date)} · ${text(time)} · ${text(String(fd.get('guests')))} ${t('гостей','guests')}</span></div><button type="button" class="button form-submit" data-close>${t('Закрыть','Close')}</button>`;
  body.querySelector('#modal-title')?.focus();
 }catch(error){showError(error.message||t('Ошибка соединения. Попробуйте снова.','Network error. Please retry.'));button.disabled=false;button.textContent=t('Отправить заявку','Send request')}
}
function openModal(kind,id=selected){
 if(drawerOpen)setDrawer(false);
 if(kind==='menu-location'){
  const url=hrefFor('menu_'+id,'');
  if(url){
   window.location.assign(url);
   return;
  }
 }
 const dialog=document.querySelector('dialog');if(!dialog.open)lastFocus=document.activeElement;
 modalKind=kind;modalVenue=id||'';
 dialog.dataset.kind=kind;
 dialog.classList.remove('booking-complete');
 // A single booking component: HOF receives only a visual theme, not new data flow.
 dialog.dataset.theme=(kind==='booking'||kind==='contacts')&&id==='zyb'?'hof':'nova';
 dialog.dataset.bookingVenue=kind==='booking'?(id||'all'):'';
 document.getElementById('modal-caption').textContent=id?(id==='zyb'?'HOF':name(id)):'MINSK';
 const body=document.getElementById('modal-body');
 if(kind==='booking'){
  body.innerHTML=bookingFormHTML(id);
  const form=body.querySelector('#book-form');
  enhanceBookingSelects(form,language,{forceCustom:id==='zyb'});
  enhanceMobileBooking(form,language);
  const commentDetails=form.querySelector('.booking-comment-details');
  if(commentDetails){
   const desktop=matchMedia('(min-width:601px)');
   const setCommentMode=()=>{if(desktop.matches)commentDetails.open=true;};
   setCommentMode();
   desktop.addEventListener('change',setCommentMode,{once:true});
  }
  enhanceBookingDate(form,language);
  form.addEventListener('submit',sendBooking);
 }else if(kind==='menu'){
 body.innerHTML=`<h2 id="modal-title" data-editor-key="home_menu_modal_title">${E('home_menu_modal_title')}</h2><p class="intro" data-editor-key="home_menu_modal_intro">${E('home_menu_modal_intro')}</p><div class="modal-list">${ids.map(i=>`<button class="button secondary" type="button" data-editor-key="menu_${i}" data-modal="menu-location" data-venue="${i}"><span data-editor-key="home_menu_modal_${i}_label">${E('home_menu_modal_'+i+'_label')}</span></button>`).join('')}</div>`;
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
 if(isEditorPreview)window.parent.postMessage({source:'nova-cms-modal-opened',kind},location.origin);
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
 // The inline "HÓF events" link must not be blocked by the fixed booking dock.
 const eventAction=active?document.querySelector('.hof-events-footer .hof-event-more'):null;
 const eventActionRect=eventAction?.getBoundingClientRect();
 const eventActionVisible=Boolean(eventActionRect&&eventActionRect.bottom>header&&
  eventActionRect.top<innerHeight-(dock?.offsetHeight||0));
 const visible=Boolean(heroPassed&&!footerEntered&&!eventActionVisible);
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
// The CMS iframe is interactive for local UI only: open dialogs and controls,
// inspect their fields, but never navigate, place bookings or send external requests.
if(isEditorPreview){
 const inspect=key=>window.parent.postMessage({source:'nova-cms-inspector',key},location.origin);
 document.addEventListener('submit',e=>{
  e.preventDefault();e.stopImmediatePropagation();
  window.parent.postMessage({source:'nova-cms-preview-info',message:'Это предпросмотр: отправка заявок отключена.'},location.origin);
 },true);
 document.addEventListener('click',e=>{
  const target=e.target instanceof Element?e.target:null;
  if(!target)return;
  // Inputs and calendar/custom dropdown buttons remain usable for previewing
  // how a form looks, but the capture-phase submit guard blocks any POST.
  if(target.closest('.modal input,.modal select,.modal textarea,.modal label,.modal .nova-select,.modal .nova-calendar,.modal .booking-venue-options,.modal .booking-guest-stepper'))return;
  const action=target.closest('[data-modal],[data-close],[data-drawer]');
  const node=target.closest('[data-editor-icon],[data-editor-key],[data-content],[data-image]');
  e.preventDefault();e.stopImmediatePropagation();
  if(action?.hasAttribute('data-close')){closeModal();return}
  if(action?.hasAttribute('data-drawer')){setDrawer(!drawerOpen);return}
  if(action?.hasAttribute('data-modal')){
   const kind=action.dataset.modal;
   const id=action.dataset.venue||selected||(isEvents?scopedEventVenue:null);
   // Never let a preview menu choice call window.location.assign().
   if(kind==='menu-location'){inspect(ids.includes(id)?'menu_'+id:'');return}
   if(['menu','booking','contacts'].includes(kind)){openModal(kind,id);return}
  }
  const key=node?.dataset.editorIcon||node?.dataset.editorKey||node?.dataset.content||node?.dataset.image||'';
  if(key)inspect(key);
 },true);
 // Same-origin draft messages update the preview DOM only; never write to D1 or R2.
 window.addEventListener('message',event=>{
  if(event.source!==window.parent||event.origin!==location.origin||event.data?.source!=='nova-cms-draft')return;
  const {key,value,type}=event.data;
  if(typeof key!=='string'||!Object.hasOwn(EDITOR_BY_KEY,key)||typeof value!=='string'||value.length>1600)return;
  if(type==='crop'){
   if(!cropPattern.test(value)||!key.endsWith('_crop'))return;
   const imageKey=key.slice(0,-5);
   if(!isPhotoKey(imageKey))return;
   document.querySelectorAll('img[data-image="'+imageKey+'"],img[data-editor-key="'+imageKey+'"]').forEach(node=>applyPhotoCrop(node,value));
   return;
  }
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
 getJSON('/api/events',{cache:'no-store'}).then(data=>{
  if(!Array.isArray(data.events))throw Error('Invalid events response');
  events=data.events;eventsLoaded=true;eventsFailed=false;
 }).catch(error=>{
  // Never discard the server-rendered published events due to a client network failure.
  if(!eventsLoaded)eventsFailed=true;
  console.warn('NOVA events API unavailable; keeping HTML event snapshot',error);
 })
]).then(()=>{cmsSettled=true;});
await Promise.race([cms,pause(700)]);
render();
if(resetStaleVenueAnchor)scrollToPosition(0,true);
else scrollToHash(true);
const heroImage=app.querySelector('.hero-photo img');
const imageDecoded=heroImage?.decode ? heroImage.decode().catch(()=>{}) : Promise.resolve();
// One stable first paint; never move the image or title after they appear.
await Promise.race([Promise.allSettled([document.fonts?.ready||Promise.resolve(),imageDecoded]),pause(1200)]);
alignHeroPhoto();
app.classList.add('nova-ready');
if(resetStaleVenueAnchor){
 scrollToPosition(0,true);
 history.scrollRestoration='auto';
}
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
// Cross-device publication is not guaranteed to send a BroadcastChannel signal.
// Check for new events while the tab remains open; pause polling when hidden.
const EVENTS_POLL_INTERVAL=30000;
window.setInterval(()=>{
 if(!document.hidden)void refreshPublishedEvents();
},EVENTS_POLL_INTERVAL);
window.addEventListener('online',()=>void refreshPublishedEvents(true));
