// Shared photo pipeline for every NOVA admin upload: pages, gallery and events.
// Runs in the editor's browser before any bytes are sent to Cloudflare R2.
const SOURCE_MAX_BYTES = 80 * 1024 * 1024;
const SOURCE_MAX_PIXELS = 110_000_000;
const WEBP_MIME = 'image/webp';
const ALLOWED = new Set(['image/jpeg','image/png','image/webp','image/avif','image/heic','image/heif']);
const profiles = Object.freeze({
  hero:    {maxSide:2400,targetBytes:1_300_000},
  card:    {maxSide:1400,targetBytes:500_000},
  gallery: {maxSide:1800,targetBytes:850_000},
  event:   {maxSide:1400,targetBytes:500_000},
  general: {maxSide:2000,targetBytes:1_000_000}
});
const cache = new WeakMap();
export const IMAGE_ACCEPT = [...ALLOWED].join(',');

export function imageProfile(key=''){
 if(key==='hero_image'||key==='booking_image'||/^venue_(zyb|pob|east)_image$/.test(key))return 'hero';
 if(key.startsWith('home_card_')&&key.endsWith('_image'))return 'card';
 if(key.startsWith('gallery_'))return 'gallery';
 if(key==='event'||key==='event_image')return 'event';
 return 'general';
}
export function formatBytes(bytes){
 if(bytes>=1_000_000)return (bytes/1_000_000).toFixed(2)+' МБ';
 return Math.max(1,Math.round(bytes/1000))+' КБ';
}
function sourceType(file){
 const type=(file.type||'').toLowerCase();
 if(ALLOWED.has(type))return type;
 if(type && type!=='application/octet-stream')return '';
 const extension=(file.name||'').split('.').pop()?.toLowerCase();
 return ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:WEBP_MIME,avif:'image/avif',heic:'image/heic',heif:'image/heif'})[extension]||'';
}
export function validatePhoto(file){
 if(!file)throw Error('Фотография не выбрана.');
 if(!sourceType(file))throw Error('Поддерживаются JPEG, PNG, WebP, AVIF и HEIC/HEIF (если браузер умеет их читать).');
 if(file.size>SOURCE_MAX_BYTES)throw Error('Исходная фотография больше 80 МБ. Уменьшите её перед загрузкой.');
 if(file.size<64)throw Error('Файл пустой или повреждён.');
}
async function decodeSource(file){
 if(typeof createImageBitmap==='function'){
  try{
   let bitmap;
   try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});}
   catch{bitmap=await createImageBitmap(file);}
   return {image:bitmap,width:bitmap.width,height:bitmap.height,close:()=>bitmap.close?.()};
  }catch{/* Some browsers decode formats through the HTML Image element only. */}
 }
 const url=URL.createObjectURL(file);
 try{
  const im=new Image();
  im.decoding='async';
  im.src=url;
  if(im.decode)await im.decode();
  else await new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=reject});
  return {image:im,width:im.naturalWidth,height:im.naturalHeight,close:()=>{}};
 }catch{throw Error('Браузер не смог открыть изображение. Если это HEIC, экспортируйте его в JPEG.');}
 finally{URL.revokeObjectURL(url)}
}
function encodeWebP(canvas,quality){
 return new Promise((resolve,reject)=>{
  if(typeof canvas.toBlob!=='function'){reject(Error('В этом браузере недоступно сжатие WebP.'));return}
  canvas.toBlob(blob=>{
   if(!blob||blob.type!==WEBP_MIME){reject(Error('Браузер не поддерживает сохранение WebP. Используйте актуальную версию Chrome, Safari или Firefox.'));return}
   resolve(blob);
  },WEBP_MIME,quality);
 });
}
function sanitizedName(name){
 const stem=(name||'photo').replace(/\.[^.]+$/,'').replace(/[^A-Za-z0-9_-]/g,'-').replace(/-+/g,'-').slice(0,50)||'nova-photo';
 return stem+'.webp';
}
async function transform(file,profile){
 validatePhoto(file);
 const source=await decodeSource(file);
 const {width:originalWidth,height:originalHeight}=source;
 if(!originalWidth||!originalHeight||originalWidth*originalHeight>SOURCE_MAX_PIXELS){
  source.close();
  throw Error('Слишком большое или повреждённое изображение.');
 }
 const settings=profiles[profile]||profiles.general;
 const initialScale=Math.min(1,settings.maxSide/Math.max(originalWidth,originalHeight));
 const canvas=document.createElement('canvas');
 let best;
 try{
  for(const factor of [1,.85,.72,.6]){
   const width=Math.max(1,Math.round(originalWidth*initialScale*factor));
   const height=Math.max(1,Math.round(originalHeight*initialScale*factor));
   canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d',{alpha:true});
   if(!ctx)throw Error('Не удалось обработать фотографию в браузере.');
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.drawImage(source.image,0,0,width,height);
   for(const quality of [.82,.72,.62]){
    const blob=await encodeWebP(canvas,quality);
    if(!best||blob.size<best.blob.size)best={blob,width,height,quality};
    if(blob.size<=settings.targetBytes){
     const result=new File([blob],sanitizedName(file.name),{type:WEBP_MIME,lastModified:Date.now()});
     return {file:result,originalBytes:file.size,bytes:blob.size,originalWidth,originalHeight,width,height,quality,profile};
    }
   }
  }
  // No oversized originals are sent. Retain the smallest compressed WebP.
  if(!best||best.blob.size>7*1024*1024)throw Error('Не удалось достаточно сжать фото. Используйте более простой исходник.');
  const result=new File([best.blob],sanitizedName(file.name),{type:WEBP_MIME,lastModified:Date.now()});
  return {file:result,originalBytes:file.size,bytes:best.blob.size,originalWidth,originalHeight,width:best.width,height:best.height,quality:best.quality,profile};
 }finally{
  canvas.width=0;canvas.height=0;
  source.close();
 }
}
export function preparePhoto(file,key='general'){
 const profile=profiles[key]?key:imageProfile(key);
 let byProfile=cache.get(file);
 if(!byProfile){byProfile=new Map();cache.set(file,byProfile)}
 if(!byProfile.has(profile)){
  const pending=transform(file,profile);
  byProfile.set(profile,pending);
  pending.catch(()=>{if(byProfile.get(profile)===pending)byProfile.delete(profile)});
 }
 return byProfile.get(profile);
}
export async function uploadPhoto(file,key='general'){
 const converted=await preparePhoto(file,key);
 const r=await fetch('/api/admin/upload',{method:'POST',credentials:'same-origin',
  headers:{'X-Nova-Admin':'1','Content-Type':WEBP_MIME},body:converted.file});
 const body=await r.json().catch(()=>({error:'upload_failed'}));
 if(!r.ok)throw Error(body.error||'Ошибка отправки фотографии.');
 return {...converted,url:body.url};
}
