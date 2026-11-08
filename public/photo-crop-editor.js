import {DEFAULT_CROP,parseCrop,serializeCrop,cropPresets,applyPhotoCrop,clamp} from './photo-crop.js';

// Editor is self-contained, keyboard accessible, and never uploads or mutates
// media. The author can preview multiple output aspect ratios before publishing.
let active=false;
function make(tag,cls,text){
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(text!==undefined)el.textContent=text;
 return el;
}
export async function openPhotoCropEditor({src,key='general',initial=DEFAULT_CROP,title='Кадрирование фотографии'}){
 if(!src||active) return null;
 active=true;
 const dialog=make('dialog','nova-crop-dialog');
 const shell=make('div','nova-crop-dialog-shell');
 const heading=make('div','nova-crop-heading');
 const h2=make('h2','',title),close=make('button','nova-crop-close','×');
 close.type='button';close.setAttribute('aria-label','Закрыть редактор кадра');
 heading.append(h2,close);
 const info=make('p','nova-crop-intro','Перетаскивайте изображение, изменяйте масштаб и переключайте формат предпросмотра. Оригинал останется без изменений.');
 const toolbar=make('div','nova-crop-toolbar');
 const ratioLabel=make('label','','Формат кадра');
 const ratioSelect=make('select');
 const presets=cropPresets(key);
 for(let i=0;i<presets.length;i++){
  const option=make('option','',presets[i].label);
  option.value=String(i);ratioSelect.append(option);
 }
 ratioLabel.append(ratioSelect);toolbar.append(ratioLabel);
 const frameWrap=make('div','nova-crop-canvas');
 const frame=make('div','nova-crop-frame');
 frame.setAttribute('aria-label','Перетащите фото для настройки кадра');
 const photo=make('img','nova-crop-photo');
 photo.alt='Предпросмотр выбранного кадра';
 photo.src=src;
 photo.draggable=false;
 frame.append(photo);frameWrap.append(frame);
 const controls=make('div','nova-crop-controls');
 const zoomLabel=make('label','', 'Масштаб');
 const zoom=make('input','nova-crop-zoom');
 zoom.type='range';zoom.min='100';zoom.max='250';zoom.step='1';
 const zoomOut=make('output','nova-crop-zoom-output');
 zoomLabel.append(zoom,zoomOut);controls.append(zoomLabel);
 const hint=make('p','nova-crop-intro','После применения проверьте фотографию в предпросмотре сайта. Положение и масштаб сохранятся только после публикации.');
 const buttons=make('div','nova-crop-actions');
 const cancel=make('button','nova-crop-cancel','Отмена');
 const reset=make('button','nova-crop-reset','По центру');
 const apply=make('button','nova-crop-apply','Применить кадр');
 for(const b of [cancel,reset,apply])b.type='button';
 buttons.append(cancel,reset,apply);
 shell.append(heading,info,toolbar,frameWrap,controls,hint,buttons);dialog.append(shell);document.body.append(dialog);
 let crop=parseCrop(initial),drag=null,finished=false;
 function draw(){
  applyPhotoCrop(photo,serializeCrop(crop));
  zoom.value=String(crop.zoom);
  zoomOut.value=String(crop.zoom)+'%';
  frame.style.aspectRatio=String(presets[Number(ratioSelect.value)||0].ratio);
 }
 zoom.addEventListener('input',()=>{crop.zoom=Number(zoom.value);draw()});
 ratioSelect.addEventListener('change',draw);
 reset.addEventListener('click',()=>{crop=parseCrop(DEFAULT_CROP);draw()});
 frame.addEventListener('pointerdown',event=>{
  if(event.button!==0&&event.pointerType!=='touch')return;
  event.preventDefault();
  drag={x:event.clientX,y:event.clientY,startX:crop.x,startY:crop.y};
  frame.setPointerCapture(event.pointerId);
  frame.classList.add('is-dragging');
 });
 frame.addEventListener('pointermove',event=>{
  if(!drag)return;
  const r=frame.getBoundingClientRect();
  // Moving an image to the right reveals more of the left edge, reducing x.
  // Extra zoom provides more freedom even if the source matches the frame ratio.
  const factor=Math.max(.25,crop.zoom/100-0.75);
  crop.x=clamp(drag.startX-(event.clientX-drag.x)*100/Math.max(1,r.width)/factor,0,100);
  crop.y=clamp(drag.startY-(event.clientY-drag.y)*100/Math.max(1,r.height)/factor,0,100);
  draw();
 });
 const endDrag=()=>{drag=null;frame.classList.remove('is-dragging')};
 frame.addEventListener('pointerup',endDrag);
 frame.addEventListener('pointercancel',endDrag);
 frame.addEventListener('lostpointercapture',endDrag);
 const result=new Promise(resolve=>{
  const finish=value=>{
   if(finished)return;
   finished=true;
   active=false;
   dialog.close?.();
   dialog.remove();
   resolve(value);
  };
  cancel.addEventListener('click',()=>finish(null));
  close.addEventListener('click',()=>finish(null));
  apply.addEventListener('click',()=>finish(serializeCrop(crop)));
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(null)});
  dialog.addEventListener('click',event=>{if(event.target===dialog)finish(null)});
 });
 try{
  draw();
  dialog.showModal();
  await photo.decode().catch(()=>{});
  if(!photo.naturalWidth){dialog.querySelector('.nova-crop-intro').textContent='Не удалось открыть изображение для предпросмотра.';apply.disabled=true}
 }catch(error){dialog.remove();active=false;throw error}
 return result;
}
