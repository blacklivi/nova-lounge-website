// Shared, non-destructive crop position used by site photos and event posters.
// Format: horizontal focal point %, vertical focal point %, zoom %.
export const DEFAULT_CROP='50,50,100';
export const cropPattern=/^(?:100|[1-9]?\d),(?:100|[1-9]?\d),(?:1\d\d|2[0-4]\d|250)$/;
export const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export function parseCrop(value){
 const s=typeof value==='string'?value.trim():'';
 if(!cropPattern.test(s))return {x:50,y:50,zoom:100};
 const [x,y,zoom]=s.split(',').map(Number);
 return {x,y,zoom};
}
export function serializeCrop({x=50,y=50,zoom=100}={}){
 return [Math.round(clamp(Number(x)||0,0,100)),Math.round(clamp(Number(y)||0,0,100)),
   Math.round(clamp(Number(zoom)||100,100,250))].join(',');
}
export const isPhotoKey=key=>typeof key==='string'&&(
 key==='hero_image'||key==='story_image'||key==='booking_image'||
 /^home_card_(?:zyb|pob|east)_image$/.test(key)||
 /^venue_(?:zyb|pob|east)_image$/.test(key)||
 /^gallery_(?:zyb|pob|east)_[12]_image$/.test(key));
export const cropKey=key=>key+'_crop';
export function cropCSS(value){
 const {x,y,zoom}=parseCrop(value);
 return '--photo-x:'+x+'%;--photo-y:'+y+'%;--photo-zoom:'+(zoom/100).toFixed(2);
}
export function applyPhotoCrop(image,value){
 if(!image)return;
 const {x,y,zoom}=parseCrop(value);
 image.classList.add('cms-photo');
 image.style.setProperty('--photo-x',x+'%');
 image.style.setProperty('--photo-y',y+'%');
 image.style.setProperty('--photo-zoom',(zoom/100).toFixed(2));
}
export function cropPresets(key){
 if(key==='event'||key==='event_image')return [
  {label:'Главная · мобильная (2:3)',ratio:2/3},
  {label:'Полная афиша (3:4)',ratio:3/4},
  {label:'HÓF · список (5:6)',ratio:5/6}
 ];
 if(key==='hero_image'||key==='venue_zyb_image')return [
  {label:'Первый экран · телефон (9:16)',ratio:9/16},
  {label:'Широкий экран (16:9)',ratio:16/9}
 ];
 if(key.startsWith('home_card_'))return [
  {label:'Карточка · телефон (10:11)',ratio:10/11},
  {label:'Карточка · большой экран (1.55:1)',ratio:1.55}
 ];
 if(key.startsWith('gallery_'))return [
  {label:'Галерея (5:6)',ratio:5/6},
  {label:'Квадрат (1:1)',ratio:1}
 ];
 if(key==='story_image')return [{label:'Фото о нас (10:11)',ratio:10/11}];
 if(key==='booking_image')return [{label:'Бронирование · широкий кадр (16:9)',ratio:16/9}];
 return [
  {label:'Мобильный экран (1:1)',ratio:1},
  {label:'Десктоп (20:21)',ratio:20/21}
 ];
}
