/* NOVA bilingual interface. Static UI is curated; CMS translations are supplied by D1. */
(function(){
"use strict";
const WORDS={
"Пространства":"Locations","События":"Events","СОБЫТИЯ":"EVENTS","О нас":"About","Контакты":"Contacts","Забронировать":"Book a table","Забронировать стол":"Book a table","Забронировать стол ↗":"Book a table ↗",
"Выбрать":"Choose","заведение":"location","Выбрать заведение":"Choose a location","Заведения":"Locations","Все пространства NOVA":"All NOVA locations",
"Три пространства.":"Three locations.","Один ритм.":"One rhythm.","Зыбицкая":"Zybitskaya","Победителей":"Pobediteley","Восток":"Vostok","Минск":"Minsk",
"Вечеринки / DJ / Городская энергия":"Parties / DJs / City energy","Пространство для встреч":"A place to meet","Своя атмосфера":"A familiar atmosphere",
"NOVA — больше, чем кафе":"NOVA — more than a café","Еда,":"Food,","люди,":"people,","музыка":"music","и атмосфера.":"and atmosphere.","Еда":"Food","Люди":"People","Музыка":"Music","Атмосфера":"Atmosphere",
"Три пространства в Минске":"Three locations in Minsk","с разным ритмом, но одной":"with different rhythms and one","философией — создавать места,":"idea — creating places","в которые хочется возвращаться.":"you want to return to.",
"NOVA / АФИША":"NOVA / EVENTS","Скоро здесь появятся новые события.":"New events will appear here soon.","Все события и архив":"All events and archive","Ваш стол ждёт":"Your table awaits","стол":"table","MINSK · ТРИ ПРОСТРАНСТВА":"MINSK · THREE LOCATIONS","БРОНИ НЕ ОТПРАВЛЯЮТСЯ":"BOOKING REQUESTS ARE NOT SENT",
"Здесь встречаются музыка и город. Днём — ланчи и кухня, вечером — DJ-сеты, вечеринки и люди, которые собираются вместе.":"Music meets the city here. Lunch and food by day, DJ sets, parties and a lively crowd by night.",
"Актуальные вечеринки и DJ-сеты публикуются отдельно. Точные даты появятся после подключения афиши.":"Upcoming parties and DJ sets are announced separately. Dates will appear in the events calendar.",
"Вечеринки · DJ-сеты · Ланчи · Вечернее меню":"Parties · DJ sets · Lunch · Evening menu",
"Просторное заведение для встреч, общения и долгих вечеров. Здесь собираются компании, играют в настольные игры, проводят мероприятия и возвращаются к своим привычным столикам.":"A spacious setting for meeting friends and spending long evenings together. Come for board games, private gatherings and your familiar favourite table.",
"Вечерняя музыка, кухня, постоянные гости и возможность собраться большой компанией.":"Evening music, good food, familiar faces and room for a larger group.",
"Большие компании · Настольные игры · Вечерний DJ · Ланчи":"Groups · Board games · Evening DJ · Lunch",
"Более спокойная, знакомая атмосфера для тех, кто ценит хорошую кухню и возможность провести вечер в своём кругу.":"A quieter, familiar atmosphere for good food and evenings with your own circle.",
"Кухня, кальяны, ланчи и гости, которые давно считают NOVA своим местом.":"Food, shisha, lunch and regulars who think of NOVA as their own place.",
"Кухня · Кальяны · Ланчи · Вечернее меню":"Food · Shisha · Lunch · Evening menu",
"Атмосфера NOVA":"NOVA atmosphere","Для своих людей.":"For your kind of people.","Посмотреть меню ↗":"View menu ↗","Контакты и расположение":"Contacts and directions","Адрес":"Address","Телефон":"Phone","Открыть Instagram ↗":"Open Instagram ↗","Открыть Telegram ↗":"Open Telegram ↗",
"Локация закреплена":"Location selected","Заведение":"Location","Выберите заведение":"Choose a location","Дата":"Date","Время":"Time","Количество гостей":"Guests","Ваше имя":"Your name","Имя":"Name","Номер телефона":"Phone number",
"Проверить заявку →":"Review request →","Наше меню.":"Our menus.","У каждого заведения NOVA отдельное QR-меню. Выберите локацию.":"Each NOVA location has its own QR menu. Choose your location.",
"Оставьте заявку.":"Send a request.","свяжется с вами, чтобы уточнить детали и подтвердить бронирование.":"will contact you to confirm the details and your reservation.",
"Администратор выбранного заведения":"The team at your chosen location","Администратор NOVA на":"The NOVA team at",
"Демонстрационный режим: заявка не будет отправлена в Telegram и не будет сохранена. Не вводите реальные персональные данные для тестирования.":"Demo mode: this request is not sent to Telegram or saved. Do not enter real personal information.",
"Посмотреть нашу атмосферу":"Explore the atmosphere","Закрыть меню":"Close menu","Открыть меню":"Open menu","Закрыть окно":"Close dialog",
"Встречи, музыка и вечера,":"Gatherings, music and evenings","которые хочется повторить.":"worth repeating.","Афиша сети NOVA / Минск":"NOVA events / Minsk","БЛИЖАЙШИЕ":"UPCOMING","01 / СЕЙЧАС":"01 / NOW","АРХИВ":"ARCHIVE","02 / ПРОШЕДШИЕ":"02 / PAST",
"Сейчас нет анонсированных мероприятий.":"No upcoming events announced yet.","Архив мероприятий пока пуст.":"No past events yet.","Не удалось загрузить афишу.":"Could not load events.","Архив временно недоступен.":"Archive is temporarily unavailable.","Загрузка афиши…":"Loading events…","Все события":"All events","Назад на главную":"Back to home","Афиша":"Events",
"Все пространство":"All locations","Показать меню":"View menu","Выбрать локацию":"Choose location","Ожидает подтверждения":"Awaiting confirmation",
"Заявка отправлена":"Request submitted","Заявка подготовлена":"Request prepared","Скопировать заявку":"Copy request","Вернуться":"Back",
"Пожалуйста, заполните форму.":"Please complete the form.","Выбрать заведение для брони":"Choose a location to book"
};

Object.assign(WORDS,{
"Вернуться к заведению →":"Return to location →",
"Прямые ссылки на QR-меню пока не предоставлены, поэтому переходы к ним не активированы.":"QR menu links have not yet been provided, so these links are inactive.",
"Здесь будет открываться QR-меню именно заведения NOVA / ":"The QR menu for NOVA / ",
"на отдельной платформе.":"will open on its dedicated platform.",
"Ссылка на меню пока не подключена. В прототипе никаких переходов на меню других заведений нет.":"The menu link is not connected yet. This preview will not open a menu from another location.",
"Вернуться к заведению":"Return to location",
"Вечеринки и DJ-сеты проходят на Зыбицкой. Раздел готов к подключению актуальной афиши — без выдуманных дат и артистов.":"Parties and DJ sets take place at Zybitskaya. The events page will show confirmed dates and performers only.",
"Подробнее о Зыбицкой →":"Explore Zybitskaya →",
"Здесь будут только адрес, телефон, Instagram и часы работы NOVA / ":"This page will show the address, phone, Instagram and opening hours for NOVA / ",
"Реальные контактные данные ещё не предоставлены. Они будут добавлены после подтверждения.":"Confirmed contact information will be added here when available.",
"Выберите заведение, чтобы посмотреть его адрес, телефон и часы работы.":"Choose a location to see its address, phone and opening hours.",
"Музыка, кухня и наши пространства. Здесь появится видео о NOVA, когда будет готов реальный видеоматериал.":"Music, food and our spaces. A NOVA film will appear here once original footage is available.",
"Видео отсутствует — вместо него показан демонстрационный кадр.":"Video is not available yet; this is a temporary image.",
"Предпросмотр • Telegram-бот":"Preview · Telegram bot","Заявка":"Request","готова.":"ready.","Такое сообщение получит администратор после подключения Telegram.":"This is the message the team will receive once Telegram is connected.",
"Новая заявка на бронь":"New reservation request","Гостей:":"Guests:","Имя:":"Name:","Телефон:":"Phone:","Дата:":"Date:","Время:":"Time:",
"Это только предварительный просмотр.":"This is a preview only.","Сообщение никому не отправлено, бронь не оформлена, введённые данные не сохранены.":"No message has been sent, no table is reserved, and the entered information is not saved.",
"Проверить другую заявку →":"Review another request →",
"NOVA / Зыбицкая, Минск":"NOVA / Zybitskaya, Minsk",
"NOVA / проспект Победителей, Минск":"NOVA / Pobediteley Avenue, Minsk",
"NOVA / район Восток, Минск":"NOVA / Vostok, Minsk",
"проспект Победителей":"Pobediteley Avenue","район Восток":"Vostok district",
"Меню":"Menu","Наше меню.":"Our menu.","Забронировать":"Reserve","Открыть форму бронирования":"Open booking form",
"Демонстрационный режим":"Demo mode","Городская энергия":"City energy",
"Ланчи":"Lunch","Вечернее меню":"Evening menu","Кальяны":"Shisha",
"Основная навигация":"Main navigation","Навигация в подвале":"Footer navigation","Три заведения NOVA":"Three NOVA locations",
"Пространства Минска":"Minsk locations",
"СОБЫТИЯ NOVA":"NOVA EVENTS","Мероприятия":"Events",
"Локация":"Location","Закрыть":"Close",
"INSTAGRAM — ССЫЛКИ БУДУТ ДОБАВЛЕНЫ":"INSTAGRAM — LINKS COMING SOON"
});
const ordered=Object.entries(WORDS).sort((a,b)=>b[0].length-a[0].length);
let lang="ru";try{lang=localStorage.getItem("nova-language")==="en"?"en":"ru"}catch(e){}
const memory=new WeakMap();
const attrs=new WeakMap();
function english(s){
 if(!s||!/[А-Яа-яЁё]/.test(s))return s;
 const trim=s.trim();if(WORDS[trim]!==undefined)return s.slice(0,s.indexOf(trim))+WORDS[trim]+s.slice(s.indexOf(trim)+trim.length);
 let out=s;
 for(const [ru,en] of ordered){if(out.includes(ru))out=out.split(ru).join(en)}
 return out;
}
function updateNode(node){
 if(node.nodeType===3){
   const parent=node.parentElement;if(!parent||parent.closest("script,style,textarea,[data-no-translate]"))return;
   if(!memory.has(node))memory.set(node,node.nodeValue);
   const base=memory.get(node);const next=lang==="en"?english(base):base;
   if(node.nodeValue!==next)node.nodeValue=next;
 }else if(node.nodeType===1){
   if(node.matches("[data-no-translate],script,style"))return;
   for(const attr of ["placeholder","aria-label","title"]){if(node.hasAttribute(attr)){
      if(!attrs.has(node))attrs.set(node,{});
      const record=attrs.get(node);if(!(attr in record))record[attr]=node.getAttribute(attr);
      const value=lang==="en"?english(record[attr]):record[attr];if(node.getAttribute(attr)!==value)node.setAttribute(attr,value);
   }}
 }
}
function visit(root){if(root.nodeType===3){updateNode(root);return}if(root.nodeType!==1&&root.nodeType!==9)return;
 if(root.nodeType===1)updateNode(root);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
 let node;while((node=walker.nextNode()))updateNode(node);
}
function sync(){document.documentElement.lang=lang;document.querySelectorAll("[data-language]").forEach(btn=>{
 const v=btn.dataset.language;btn.setAttribute("aria-pressed",String(v===lang));btn.classList.toggle("is-active",v===lang);
});visit(document.body);if(document.title.includes("Пространства Минска")||document.title.includes("Minsk locations"))document.title=lang==="en"?"NOVA — Minsk locations": "NOVA — Пространства Минска";else if(document.title.includes("События — NOVA")||document.title==="Events — NOVA Minsk")document.title=lang==="en"?"Events — NOVA Minsk":"События — NOVA Minsk";}
function set(next){if(next!=="en"&&next!=="ru")return;if(lang===next)return;lang=next;try{localStorage.setItem("nova-language",lang)}catch(e){}sync();document.dispatchEvent(new CustomEvent("nova:languagechange",{detail:{language:lang}}));}
window.NOVAI18N={get language(){return lang},setLanguage:set,translate:english,apply:sync};
function init(){document.addEventListener("click",e=>{const b=e.target.closest("[data-language]");if(b){e.preventDefault();set(b.dataset.language)}});sync();const observer=new MutationObserver(m=>{for(const entry of m){for(const node of entry.addedNodes)visit(node)}});observer.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();