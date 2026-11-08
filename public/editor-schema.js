// Shared site content registry: the admin, public renderer and API use one source of truth.
// Only a curated set of fields may be edited; layout and executable behavior stay code-owned.
export const ICON_CHOICES=['arrow-right','arrow-up-right','chevron-right','external-link','calendar-days','map-pin','phone','instagram','music-2','utensils','none'];
const f=(key,label,type='text',ru='',en='')=>({key,label,type,ru,en});
const g=(id,title,fields)=>({id,title,fields});
const shared=[
 g('navigation','Шапка и навигация',[
  f('nav_spaces_text','Кнопка «Пространства»','text','Пространства','Spaces'),f('nav_spaces_url','Адрес «Пространства»','link','/#venues'),
  f('nav_events_text','Кнопка «События»','text','События','Events'),f('nav_events_url','Адрес «События»','link','/events'),
  f('nav_about_text','Кнопка «О нас»','text','О нас','About'),f('nav_about_url','Адрес «О нас»','link','/#about'),
  f('nav_contacts_text','Кнопка «Контакты»','text','Контакты','Contacts'),f('nav_contacts_url','Адрес «Контакты»','link','#contacts'),
  f('global_booking_text','Бронирование в шапке и на телефоне','text','Забронировать стол','Reserve a table'),
  f('global_logo_url','Переход по логотипу NOVA','link','/'),
  f('global_logo_image','Логотип NOVA в шапке (необязательно)','image'),
 ]),
 g('footer','Общий подвал',[
  f('footer_tagline','Описание NOVA','textarea'),
  f('footer_left','Нижняя подпись слева','text','NOVA · MINSK','NOVA · MINSK'),
  f('footer_right','Нижняя подпись справа','textarea','Три пространства. Один ритм.','Three spaces. One rhythm.'),
  f('footer_logo_text','Текст логотипа в подвале','text','NOVA','NOVA'),
  f('global_instagram_icon','Иконка Instagram','icon','instagram'),f('global_map_icon','Иконка карты','icon','map-pin'),
 ])
];
const home=[
 g('hero','Первый экран NOVA',[
  f('hero_kicker','Верхняя подпись','textarea'),f('hero_tagline','Слоган','textarea'),f('hero_image','Главная фотография','image'),
  f('home_photo_side','Вертикальные слова на фотографии','textarea','Еда\nЛюди\nМузыка\nАтмосфера','Food\nPeople\nMusic\nAtmosphere'),
 ]),
 g('locations','Карточки заведений',[
  f('home_locations_title','Заголовок списка','text','ВЫБРАТЬ ЗАВЕДЕНИЕ','EXPLORE OUR SPACES'),
  f('home_card_zyb_image','Карточка HÓF · фотография на главной','image'),
  f('home_card_pob_image','Карточка Победителей · фотография на главной','image'),
  f('home_card_east_image','Карточка Восток · фотография на главной','image'),
  f('home_card_zyb_url','Куда ведёт карточка HÓF','link','/spaces/zybitskaya'),
  f('home_card_pob_url','Куда ведёт карточка Победителей','link','/spaces/pobediteley'),
  f('home_card_east_url','Куда ведёт карточка Восток','link','/spaces/vostok'),
  f('home_card_hof_title','Заголовок карточки HÓF справа','text','ЗЫБИЦКАЯ','ZYBITSKAYA'),
  f('home_card_hof_by','Подпись BY NOVA на фотографии рядом с логотипом','text','BY NOVA','BY NOVA'),
  f('home_card_hof_logo_image','Логотип HÓF поверх фотографии','image','/media/hof-wordmark-black.svg'),
 ]),
 g('story','О нас и кухня',[
  f('home_story_visible','Показывать раздел «О нас»','toggle','yes'),
  f('story_kicker','Подпись над блоком','text'),f('story_title','Основной заголовок','textarea'),
  f('story_description','Описание','textarea'),f('story_image','Фотография','image'),
  f('home_story_menu_text','Кнопка меню','text','Посмотреть меню','View the menu'),
  f('home_story_menu_icon','Иконка кнопки меню','icon','arrow-right')
 ]),
 g('events','Афиша главной',[
  f('home_events_visible','Показывать раздел событий','toggle','yes'),
  f('home_events_title','Заголовок','text','События','Events'),f('home_events_url','Переход к афише','link','/events'),
  f('home_events_icon','Иконка перехода','icon','arrow-right'),
  f('home_events_empty','Подпись, когда нет афиши','text','Афиша пока пуста.','No events yet.')
 ]),
 g('booking','Нижний блок бронирования',[
  f('home_booking_visible','Показывать нижний блок бронирования','toggle','yes'),
  f('booking_image','Фотография','image'),f('home_booking_welcome','Текст приглашения','textarea','Мы с нетерпением ждём встречи с вами.','We look forward to seeing you.'),
  f('booking_title','Надпись на кнопке','textarea'),f('home_booking_icon','Иконка бронирования','icon','arrow-right'),
 ])
];
const hof=[
 g('hof-hero','Первый экран HÓF',[
  f('venue_zyb_image','Заглавная фотография страницы HÓF (не карточки)','image'),
  f('hof_top_name','Малая подпись бренда','text','HOUSE OF FLOW','HOUSE OF FLOW'),
  f('hof_top_location','Адрес в верхнем углу','text','МИНСК · ЗЫБИЦКАЯ, 2','MINSK · 2 ZYBITSKAYA ST.'),
  f('hof_hero_kicker','Подпись над логотипом','text','МУЗЫКА / ВЕЧЕРИНКИ','MUSIC / PARTIES'),
  f('hof_by_nova','Подпись под логотипом','text','by NOVA','by NOVA'),
  f('hof_slogan','Большой слоган','text','Музыка. Люди. Ночи.','Music. People. Nights.'),
  f('hof_description_short','Малая подпись под слоганом','textarea','Встречаемся там, где начинается движение.','Where the night finds its rhythm.'),
  f('hof_events_button_text','Кнопка «Афиша»','text','Афиша','Events'),
  f('hof_events_button_url','Куда ведёт кнопка «Афиша»','link','#hof-lineup'),
  f('hof_booking_button_text','Текст кнопки бронирования','text','Забронировать стол','Reserve a table'),
  f('hof_hero_icon','Иконка кнопок первого экрана','icon','arrow-right'),
  f('hof_logo_image','Логотип первого экрана (по умолчанию фирменный)','image','/media/hof-wordmark-orange.svg'),
 ]),
 g('hof-about','Короткое описание HÓF',[
  f('hof_about_kicker','Малая подпись','text','О ПРОСТРАНСТВЕ','THE SPACE'),
  f('hof_about_mark_image','Фирменный знак в блоке «О пространстве»','image','/media/hof-mark-orange.svg'),
  f('hof_about_title','Крупный заголовок','textarea','Свой ритм. Свои люди.','Your rhythm. Your people.'),
  f('hof_about_description','Описание заведения','textarea','HÓF — новое направление NOVA на Зыбицкой. Здесь больше музыки, DJ-сетов и вечеринок. Кухня и бар остаются частью вечера.','HÓF is NOVA’s nightlife-led space on Zybitskaya. More music, DJ sets and parties, with food and drinks throughout the night.'),
  f('hof_menu_button_text','Кнопка меню','text','Кухня и бар','Food & bar'),
  f('hof_menu_button_icon','Иконка кнопки','icon','arrow-right'),
  f('menu_zyb','Адрес меню HÓF','link','https://menu.myata-qr.by/menu','https://menu.myata-qr.by/menu'),
 ]),
 g('hof-events','События HÓF',[
  f('hof_events_kicker','Малая подпись','text','HÓF / AFTER DARK','HÓF / AFTER DARK'),
  f('hof_events_title','Заголовок афиши','text','Афиша','Events'),
  f('hof_events_empty','Подпись при отсутствии событий','textarea','Следите за новыми вечеринками в афише HÓF.','Follow the HÓF events calendar for upcoming nights.'),
  f('hof_events_more_text','Кнопка перехода на события только HÓF','text','События HÓF','HÓF events'),
  f('hof_events_more_url','Адрес афиши HÓF','link','/events/hof'),
 ]),
 g('hof-contact','Контакты и бронирование HÓF',[
  f('hof_contact_kicker','Малая подпись','text','ЗЫБИЦКАЯ / МИНСК','ZYBITSKAYA / MINSK'),
  f('hof_contact_mark_image','Фирменный знак блока контактов','image','/media/hof-mark-black.svg'),
  f('hof_contact_title','Крупный заголовок','textarea','Ночь начинается здесь.','The night starts here.'),
  f('address_zyb','Адрес','text'),f('phone_zyb','Телефон','text'),f('hours_zyb','Часы работы','textarea'),
  f('hof_contacts_button_text','Кнопка контактов','text','Контакты','Contacts'),
  f('hof_book_button_text','Кнопка бронирования','text','Забронировать стол','Reserve a table'),
  f('map_zyb','Ссылка карты','link'),f('telegram_zyb','Telegram','link'),f('instagram_zyb','Instagram','link'),
 ]),
];
const venues={pob:'Победителей',east:'Восток'};
function venueGroups(id){
 return [
  g('main','Первый экран',[
   f('venue_'+id+'_image','Заглавная фотография страницы заведения (не карточки)','image'),
   f('venue_'+id+'_name','Название заведения','text',venues[id],id==='pob'?'Pobediteley':'Vostok'),
   f('venue_'+id+'_kicker','Надпись над заголовком','text','NOVA / MINSK','NOVA / MINSK'),
   f('venue_'+id+'_subtitle','Подпись под названием','text'),
   f('venue_'+id+'_desc','Главное описание','textarea'),
   f('venue_'+id+'_back_text','Кнопка назад','text','Все пространства NOVA','All NOVA spaces'),
   f('venue_'+id+'_back_url','Адрес кнопки назад','link','/#venues'),
   f('venue_'+id+'_booking_text','Бронирование — надпись кнопки','text','Забронировать стол','Reserve a table'),
   f('venue_'+id+'_menu_text','Меню — надпись кнопки','text','Посмотреть меню','View the menu'),
   f('menu_'+id,'Адрес QR-меню (выбранного заведения)','link',id==='east'?'https://menu.nova-vostok.by/menu':id==='pob'?'https://qr.myata-lounge.by/miata-pobeditelei':'',id==='east'?'https://menu.nova-vostok.by/menu':id==='pob'?'https://qr.myata-lounge.by/miata-pobeditelei':''),
   f('venue_'+id+'_events_button_text','Кнопка событий именно этого заведения','text','Афиша заведения','Venue events'),
   f('venue_'+id+'_events_button_url','Ссылка на события этого заведения','link','/events/'+(id==='pob'?'pobediteley':'vostok')),
  ]),
  g('atmosphere','Атмосфера и галерея',[
   f('venue_'+id+'_gallery_visible','Показывать фотографии галереи','toggle','yes'),
   f('venue_'+id+'_atmosphere_kicker','Малая подпись','text','Атмосфера NOVA','NOVA atmosphere'),
   f('venue_'+id+'_atmosphere_title','Крупный заголовок','textarea','В своём ритме.','Your kind of evening.'),
   f('venue_'+id+'_second','Описание','textarea'),
   f('venue_'+id+'_features','Особенности заведения','textarea'),
   f('gallery_'+id+'_1_image','Фотография галереи 1','image'),
   f('gallery_'+id+'_2_image','Фотография галереи 2','image'),
   f('venue_'+id+'_contacts_text','Кнопка контактов','text','Контакты и расположение','Contacts and directions'),
  ]),
  g('contacts','Адрес и переходы',[
   f('address_'+id,'Адрес','text'),f('phone_'+id,'Телефон','text'),f('hours_'+id,'Часы работы','textarea'),
   f('instagram_'+id,'Instagram','link'),f('telegram_'+id,'Telegram','link'),
   f('map_'+id,'Ссылка на карту','link'),
  ])
 ];
}
export const EDITOR_PAGES=[
 {id:'shared',title:'Общее',path:'/',sections:shared},
 {id:'home',title:'Главная NOVA',path:'/',sections:home},
 {id:'zyb',title:'HÓF by NOVA',path:'/spaces/zybitskaya',sections:hof},
 {id:'pob',title:'Победителей',path:'/spaces/pobediteley',sections:venueGroups('pob')},
 {id:'east',title:'Восток',path:'/spaces/vostok',sections:venueGroups('east')}
];
export const EDITOR_FIELDS=EDITOR_PAGES.flatMap(p=>p.sections.flatMap(s=>s.fields));
export const EDITOR_BY_KEY=Object.fromEntries(EDITOR_FIELDS.map(f=>[f.key,f]));
