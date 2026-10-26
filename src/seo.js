// Server-rendered public SEO landing pages. The interactive UI is enhanced by /app.js.
// Demo Workers URLs remain noindex until NOVA is connected to its official domain.
const VENUES={
 zybitskaya:{id:'zyb',name:'Зыбицкая',nameEN:'Zybitskaya',street:'ул. Зыбицкая, 2',phone:'+375 25 722-33-33',map:'https://yandex.ru/maps/org/80044003602',image:'/media/clean-e333e88f87b3e9.jpg',title:'NOVA Зыбицкая — лаунж-кафе и DJ-вечеринки в Минске',description:'NOVA Зыбицкая, 2: кухня, ланчи, вечеринки и DJ-сеты в центре Минска. Телефон +375 25 722-33-33.',opening:[{days:['Monday','Tuesday','Wednesday','Thursday','Sunday'],closes:'02:00'},{days:['Friday','Saturday'],closes:'05:00'}]},
 pobediteley:{id:'pob',name:'Победителей',nameEN:'Pobediteley',street:'просп. Победителей, 89, корп. 3, 2-й этаж',phone:'+375 25 644-33-33',map:'https://yandex.ru/maps/org/myata_lounge/1498688403',image:'/media/clean-04578c785a8dd9.jpg',title:'NOVA Победителей — лаунж-кафе на проспекте Победителей, 89/3',description:'NOVA Победителей, 89/3: кухня, встречи с друзьями, настольные игры и вечерняя музыка. Телефон +375 25 644-33-33.',opening:[{days:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],closes:'02:00'}]},
 vostok:{id:'east',name:'Восток',nameEN:'Vostok',street:'ул. Франциска Скорины, 2',phone:'+375 44 791-33-33',map:'https://yandex.ru/maps/org/136614972290',image:'/media/clean-5cb8311007919b.jpg',title:'NOVA Восток — лаунж-кафе на Франциска Скорины, 2',description:'NOVA Восток, ул. Франциска Скорины, 2: кухня, ланчи, кальяны и встречи в Минске. Телефон +375 44 791-33-33.',opening:[{days:['Monday','Tuesday','Wednesday','Thursday','Sunday'],closes:'02:00'},{days:['Friday','Saturday'],closes:'04:00'}]}
};
const htmlEscape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const scriptJson=obj=>JSON.stringify(obj).replace(/</g,'\\u003c').replace(/>/g,'\\u003e');
const noindexHost=host=>host.endsWith('.workers.dev')||host==='localhost'||host.endsWith('.pages.dev');
function structuredBusiness(v,origin,override,defaults){
 const id=v.id,property=k=>override[k]??defaults.content?.[k]??'';
 return {
 '@context':'https://schema.org','@type':'CafeOrCoffeeShop',
 '@id':origin+'/spaces/'+Object.keys(VENUES).find(k=>VENUES[k]===v)+'#business',
 name:'NOVA — '+v.name,url:origin+'/spaces/'+Object.keys(VENUES).find(k=>VENUES[k]===v),
 description:property('venue_'+id+'_desc')||v.description,
 telephone:property('phone_'+id)||v.phone,
 address:{'@type':'PostalAddress',streetAddress:(property('address_'+id)||v.street).replace(/^Минск,?\s*/i,''),addressLocality:'Минск',addressCountry:'BY'},
 hasMap:property('map_'+id)||v.map,
 image:origin+(property('venue_'+id+'_image')||v.image),
 openingHoursSpecification:v.opening.map(x=>({'@type':'OpeningHoursSpecification',dayOfWeek:x.days,opens:'12:00',closes:x.closes})),
 parentOrganization:{'@type':'Organization',name:'NOVA'}
 };
}
async function overrides(env){
 if(!env.DB)return {};
 try{const r=await env.DB.prepare("SELECT key,value FROM site_content WHERE key LIKE 'address_%' OR key LIKE 'phone_%' OR key LIKE 'map_%' OR key LIKE 'venue_%_desc'").all();return Object.fromEntries((r.results||[]).map(x=>[x.key,x.value]));}
 catch{return {};}
}
async function defaultsFor(env,url){
 try{const r=await env.ASSETS.fetch(new Request(new URL('/content-defaults.json',url)));return await r.json();}
 catch{return {content:{}};}
}
function fallback(route,v,origin,over,def){
 if(v){
  const val=k=>over[k]??def.content?.[k]??'';
  const n=htmlEscape(v.name),desc=htmlEscape(val('venue_'+v.id+'_desc')||v.description);
  const address=htmlEscape(val('address_'+v.id)||v.street),phone=htmlEscape(val('phone_'+v.id)||v.phone);
  const map=htmlEscape(val('map_'+v.id)||v.map);
  return '<main id="seo-fallback"><h1>NOVA — '+n+'</h1><p>'+desc+'</p><address>'+address+', Минск</address><p><a href="tel:'+phone.replace(/[^\d+]/g,'')+'">'+phone+'</a></p><p><a href="'+map+'">Открыть карточку заведения на карте</a></p><nav><a href="/">Все пространства NOVA</a></nav></main>';
 }
 if(route==='/events')return '<main id="seo-fallback"><h1>События NOVA в Минске</h1><p>Афиша вечеринок и DJ-сетов NOVA.</p><a href="/">Все пространства</a></main>';
 return '<main id="seo-fallback"><h1>NOVA — три лаунж-кафе в Минске</h1><p>Зыбицкая, Победителей и Восток: кухня, встречи, вечеринки и ланчи.</p><ul>'+Object.entries(VENUES).map(([slug,item])=>'<li><a href="/spaces/'+slug+'">NOVA '+htmlEscape(item.name)+' — '+htmlEscape(item.street)+'</a></li>').join('')+'</ul></main>';
}
// Fast first-paint hero for the motion experiment. Styled by the existing site.css.
// The SEO text remains in the response for no-JS clients, but is never displayed
// ahead of the actual interface while JavaScript is enabled.
function firstPaint(route, defaults){
 if(route!=='/')return '';
 const ru=defaults.content||{},en=defaults.content_en||{};
 const bilingual=(ruText,enText)=>'<span data-boot-lang="ru">'+htmlEscape(ruText)+'</span><span data-boot-lang="en">'+htmlEscape(enText)+'</span>';
 const picture=/^\/media\/[\w.-]+\.(?:jpe?g|png|webp|avif)$/.test(ru.hero_image||'')?ru.hero_image:'/media/clean-076f0b2eaafa35.jpg';
 const nav=(labelRu,labelEn,href)=>'<a href="'+href+'">'+bilingual(labelRu,labelEn)+'</a>';
 return '<div id="nova-first-paint" aria-hidden="true">'+
  '<header class="site-header">'+
  '<a class="brand" href="/">NOVA</a>'+
  '<nav class="main-nav">'+
  nav('Пространства','Spaces','/#venues')+nav('События','Events','/events')+
  nav('О нас','About','/#about')+nav('Контакты','Contacts','/#contacts')+
  '</nav><div class="header-side"><div class="language"><span>RU</span><span>EN</span></div>'+
  '<span class="button header-book">'+bilingual('Забронировать стол','Reserve a table')+'</span></div></header>'+
  '<main><section class="hero lab-intro" id="nova-boot-hero">'+
  '<div class="hero-copy"><span class="eyebrow">'+htmlEscape(ru.hero_kicker||'MINSK · LOUNGE CAFÉ')+'</span>'+
  '<h1>NOVA</h1>'+
  '<p class="hero-tagline">'+bilingual(ru.hero_tagline||'Три пространства.\nОдин ритм.',en.hero_tagline||'Three spaces.\nOne rhythm.')+'</p></div>'+
  '<div class="hero-photo"><img src="'+htmlEscape(picture)+'" alt="" width="1200" height="900" fetchpriority="high" decoding="async">'+
  '<div class="photo-side">'+bilingual('Еда<br>Люди<br>Музыка<br>Атмосфера','Food<br>People<br>Music<br>Atmosphere').replaceAll('&lt;br&gt;','<br>')+'</div>'+
  '</div></section></main></div>'+
  // Match the photograph's left edge to the actual V glyph, not an approximate
  // viewport percentage. Runs before first paint; the same CSS variable styles
  // the bootstrap hero and its interactive replacement.
  '<script>(function(){'+
  'function align(){if(innerWidth<=900)return;var h=document.querySelector("#nova-boot-hero h1");'+
  'if(!h||!h.firstChild||h.firstChild.nodeType!==3)return;'+
  'var hero=h.closest(".hero"),r=document.createRange();r.setStart(h.firstChild,2);r.setEnd(h.firstChild,3);'+
  'var box=r.getBoundingClientRect(),base=hero.getBoundingClientRect();'+
  'var x=box.left-base.left+box.width*.5;'+
  'if(x>base.width*.24&&x<base.width*.55)document.documentElement.style.setProperty("--nova-hero-split",x.toFixed(1)+"px");'+
  '}align();document.fonts.ready.then(align);'+
  'var raf=0;addEventListener("resize",function(){cancelAnimationFrame(raf);raf=requestAnimationFrame(align)},{passive:true});'+
  '})();</script>';
}
export async function publicPage(request,env,route){
 const url=new URL(request.url),v=VENUES[route.split('/')[2]],origin=url.origin;
 const asset=route==='/events'?'/events.html':'/index.html';
 const [page,def,over]=await Promise.all([env.ASSETS.fetch(new Request(new URL(asset,request.url),request)),defaultsFor(env,request.url),overrides(env)]);
 if(!page.ok)return page;
 const title=v?v.title:route==='/events'?'События NOVA — афиша Минска':'NOVA — три лаунж-кафе в Минске';
 const desc=v?v.description:route==='/events'?'Афиша NOVA в Минске: DJ-сеты, вечеринки и ближайшие события.':'NOVA — три лаунж-кафе в Минске: Зыбицкая, Победителей, Восток. Кухня, ланчи и вечерние встречи.';
 const canonical=origin+route;
 const ld=v?structuredBusiness(v,origin,over,def):{'@context':'https://schema.org','@type':route==='/events'?'CollectionPage':'Organization',name:'NOVA',url:canonical,description:desc};
 const head='<link rel="canonical" href="'+htmlEscape(canonical)+'">'+
 '<meta property="og:site_name" content="NOVA">'+
 '<meta property="og:type" content="website">'+
 '<meta property="og:title" content="'+htmlEscape(title)+'">'+
 '<meta property="og:description" content="'+htmlEscape(desc)+'">'+
 '<meta property="og:url" content="'+htmlEscape(canonical)+'">'+
 (v?'<meta property="og:image" content="'+htmlEscape(origin+(over['venue_'+v.id+'_image']||def.content?.['venue_'+v.id+'_image']||v.image))+'">':'')+
 '<script type="application/ld+json">'+scriptJson(ld)+'</script>';
 let content=await page.text();
 content=content.replace(/<title>[^<]*<\/title>/,'<title>'+htmlEscape(title)+'</title>')
  .replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+htmlEscape(desc)+'">')
  .replace('</head>',head+'<script type="application/json" id="nova-initial-defaults">'+scriptJson(def)+'</script></head>')
  .replace('<div id="app"><p class="loading">NOVA</p></div>',firstPaint(route,def)+'<div id="app">'+fallback(route,v,origin,over,def)+'</div>');
 const headers=new Headers(page.headers);headers.set('Content-Type','text/html; charset=utf-8');
 headers.set('Cache-Control','public, max-age=120, must-revalidate');
 headers.set('X-Content-Type-Options','nosniff');
 if(noindexHost(url.hostname))headers.set('X-Robots-Tag','noindex, nofollow');
 return new Response(content,{status:200,headers});
}
export function seoRoute(request){
 const u=new URL(request.url),demo=noindexHost(u.hostname),p=u.pathname;
 if(p==='/robots.txt')return new Response(demo?'User-agent: *\nDisallow: /\n':'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: '+u.origin+'/sitemap.xml\n',{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=300'}});
 if(p==='/sitemap.xml'){
  if(demo)return new Response('Demo domain is not indexable',{status:404,headers:{'X-Robots-Tag':'noindex'}});
  const paths=['/','/events',...Object.keys(VENUES).map(x=>'/spaces/'+x)];
  const xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(x=>'<url><loc>'+htmlEscape(u.origin+x)+'</loc></url>').join('')+'</urlset>';
  return new Response(xml,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'}});
 }
 return null;
}
export const isPublicPage=p=>p==='/'||p==='/events'||/^\/spaces\/(?:zybitskaya|pobediteley|vostok)\/?$/.test(p);
