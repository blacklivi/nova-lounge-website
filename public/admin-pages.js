import {EDITOR_PAGES,EDITOR_BY_KEY,ICON_CHOICES} from './editor-schema.js';

const $=s=>document.querySelector(s);
const getPage=()=>EDITOR_PAGES.find(p=>p.id===$('#page-editor-select').value)||EDITOR_PAGES[1];
const request=async(path,method='GET',data)=>{
 const options={method,credentials:'same-origin',headers:{'X-Nova-Admin':'1'}};
 if(data!==undefined){options.headers['Content-Type']='application/json';options.body=JSON.stringify(data)}
 const res=await fetch(path,options),body=await res.json().catch(()=>({error:'invalid_response'}));
 if(!res.ok)throw Error(body.error||('HTTP '+res.status));
 return body;
};
let defaults={content:{},content_en:{}},saved={content:{},content_en:{}};
const drafts={ru:new Map(),en:new Map()},images=new Map();
let ready=false,busy=false;
const status=(message,error=false)=>{
 const el=$('#page-editor-status');
 el.textContent=message;
 el.style.color=error?'#9c3e31':'#46553e';
};
const editableLanguage=field=>!['link','icon','image'].includes(field.type);
const lang=()=>$('#page-editor-language').value;
function fallback(field,l){
 const standard=defaults[l==='en'?'content_en':'content']||{};
 return standard[field.key]??(l==='en'?(field.en||field.ru):(field.ru||''));
}
function current(field,l){
 return drafts[l].has(field.key)?drafts[l].get(field.key):
   (saved[l==='en'?'content_en':'content'][field.key]??fallback(field,l));
}
const pageUrl=()=>getPage().path;
function previewUrl(){
 const u=new URL(pageUrl(),location.origin);
 u.searchParams.set('cms_preview','1');
 u.searchParams.set('editor_lang',lang());
 u.searchParams.set('v',String(Date.now()));
 return u.pathname+u.search;
}
function updatePreview(){
 const page=getPage();
 $('#editor-new-tab').href=page.path;
 $('#page-editor-frame').src=previewUrl();
}
function dirtyCount(){return drafts.ru.size+drafts.en.size+images.size}
function dirtyMessage(){status(dirtyCount()?dirtyCount()+' несохранённых изменений':'Все изменения опубликованы')}
function remember(field,value,l=lang()){
 if(!editableLanguage(field))l='ru';
 const prev=saved[l==='en'?'content_en':'content'][field.key]??fallback(field,l);
 if(value===String(prev))drafts[l].delete(field.key);
 else drafts[l].set(field.key,value);
 dirtyMessage();
}
function linkIsValid(value){
 if(!value)return true;
 if(/[\\\u0000-\u001f\u007f]/.test(value))return false;
 if(/^#[A-Za-z0-9_-]+$/.test(value))return true;
 if(/^\/(?!\/)[A-Za-z0-9_/#?&.=%+~-]*$/.test(value)&&!/%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(value))return true;
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')}catch{return false}
}
function create(tag,cls,text){
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(text!==undefined)el.textContent=text;
 return el;
}
function buildField(field){
 const box=create('div','editor-field');
 box.dataset.editorField=field.key;
 const label=create('label','editor-field-label',field.label);
 label.htmlFor='editor-field-'+field.key;
 box.append(label);
 const meta=create('small','editor-field-meta',
   field.type==='link'?'Ссылка / адрес назначения':field.type==='image'?'Изображение':field.type==='icon'?'Иконка':lang()==='en'?'English':'Русский');
 box.append(meta);
 let input;
 if(field.type==='textarea'){
  input=create('textarea','editor-input');
  input.rows=3;input.maxLength=1600;
 }else if(field.type==='icon'){
  input=create('select','editor-input');
  for(const value of ICON_CHOICES){const option=create('option','',value);option.value=value;input.append(option)}
 }else{
  input=create('input','editor-input');input.type='text';input.maxLength=1600;
 }
 input.id='editor-field-'+field.key;
 input.value=String(current(field,editableLanguage(field)?lang():'ru')??'');
 input.addEventListener('input',()=>{
  if(field.type==='link'){
   input.setCustomValidity(linkIsValid(input.value.trim())?'':'Допустимы HTTPS, /страница или #раздел');
  }
  remember(field,input.value.trim(),editableLanguage(field)?lang():'ru');
  if(field.type==='image'){
   preview.src=input.value.trim();
   preview.hidden=!input.value.trim();
  }
 });
 box.append(input);
 if(field.type==='image'){
  const preview=create('img','editor-image-preview');
  preview.alt='Текущая фотография / логотип';
  preview.loading='lazy';
  preview.src=input.value.trim();
  preview.hidden=!input.value.trim();
  box.append(preview);
  const uploadInput=create('input','editor-upload');
  uploadInput.type='file';uploadInput.accept='image/jpeg,image/png,image/webp';
  uploadInput.addEventListener('change',()=>{
   const file=uploadInput.files?.[0];
   if(!file)return;
   if(file.size>8*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type)){
    status('Разрешены JPG, PNG, WebP до 8 МБ',true);uploadInput.value='';return;
   }
   images.set(field.key,file);
   preview.src=URL.createObjectURL(file);preview.hidden=false;
   dirtyMessage();
  });
  box.append(uploadInput);
  box.append(create('small','editor-field-help','Можно загрузить новый файл или указать путь существующего /media/…; для фирменных SVG используется готовый файл.'));
 }
 if(field.type==='link'){
  const note=create('p','editor-link-note','');
  const update=()=>{
   const value=input.value.trim();
   if(!value){note.textContent='Ссылка пока не задана. Для меню переход не активен.';return}
   const a=create('a','','Проверить переход ↗');
   a.href=value;a.target='_blank';a.rel='noopener noreferrer';
   note.replaceChildren(a);
  };
  input.addEventListener('input',update);update();box.append(note);
 }
 if(field.type==='icon')box.append(create('small','editor-field-help','Выбор из безопасного набора иконок. «none» убирает иконку.'));
 return box;
}
function renderFields(){
 const page=getPage(),box=$('#page-editor-fields');
 box.replaceChildren();
 for(const section of page.sections){
  const wrapper=create('details','editor-group');
  wrapper.open=true;
  wrapper.dataset.section=section.id;
  wrapper.append(create('summary','',section.title+' · '+section.fields.length));
  const inner=create('div','editor-group-fields');
  for(const field of section.fields)inner.append(buildField(field));
  wrapper.append(inner);box.append(wrapper);
 }
 searchFields();
}
function searchFields(){
 const query=$('#page-editor-search').value.trim().toLocaleLowerCase('ru');
 let matched=0;
 for(const group of $('#page-editor-fields').querySelectorAll('.editor-group')){
  let visible=0;
  for(const item of group.querySelectorAll('.editor-field')){
   const field=EDITOR_BY_KEY[item.dataset.editorField],hit=!query||field.label.toLocaleLowerCase('ru').includes(query)||field.key.includes(query);
   item.hidden=!hit;
   if(hit){matched++;visible++}
  }
  group.hidden=!visible;
  if(query&&visible)group.open=true;
 }
 if(query&&!matched)status('По заданному запросу полей не найдено');
}
function selectField(key){
 const field=EDITOR_BY_KEY[key];
 if(!field){status('Этот элемент пока относится к системному шаблону; его нельзя редактировать как контент.',true);return}
 const page=EDITOR_PAGES.find(p=>p.sections.some(s=>s.fields.some(f=>f.key===key)));
 if(page&&getPage().id!==page.id){$('#page-editor-select').value=page.id;renderFields();updatePreview()}
 $('#page-editor-search').value='';searchFields();
 const target=[...document.querySelectorAll('[data-editor-field]')].find(x=>x.dataset.editorField===key);
 if(!target){status('Поле найдено в реестре, но отсутствует на выбранной странице',true);return}
 const group=target.closest('details');if(group)group.open=true;
 target.classList.add('editor-selected');
 target.scrollIntoView({block:'center',behavior:'smooth'});
 target.querySelector('input:not([type=file]),textarea,select')?.focus({preventScroll:true});
 setTimeout(()=>target.classList.remove('editor-selected'),2500);
 status('Выбран элемент: '+field.label);
}
async function upload(file){
 const r=await fetch('/api/admin/upload',{method:'POST',credentials:'same-origin',headers:{'X-Nova-Admin':'1','Content-Type':file.type},body:file});
 const data=await r.json().catch(()=>({error:'upload_failed'}));
 if(!r.ok)throw Error(data.error||'upload_failed');
 return data.url;
}
async function publish(){
 if(busy)return;
 if(!dirtyCount()){status('Нет несохранённых изменений');return}
 busy=true;const button=$('#page-editor-save');button.disabled=true;
 try{
  status('Загружаем фотографии…');
  for(const [key,file] of [...images]){
   const url=await upload(file);
   drafts.ru.set(key,url);images.delete(key);
  }
  let pending=0;
  while(drafts.ru.size||drafts.en.size){
   const ru=[...drafts.ru].slice(0,24);
   const en=[...drafts.en].slice(0,24);
   for(const [key,value] of [...ru,...en]){
    const field=EDITOR_BY_KEY[key];
    if(field?.type==='link'&&!linkIsValid(value))throw Error('Недопустимая ссылка: '+field.label);
   }
   status('Сохраняем в Cloudflare D1…');
   const result=await request('/api/admin/content','PUT',{
    content:Object.fromEntries(ru),content_en:Object.fromEntries(en)
   });
   pending+=result.translation_pending||0;
   for(const [key,value] of ru){saved.content[key]=value;drafts.ru.delete(key)}
   for(const [key,value] of en){saved.content_en[key]=value;drafts.en.delete(key)}
  }
  renderFields();updatePreview();
  status(pending?'Опубликовано, но '+pending+' автоматических переводов не получилось. Откройте English и введите перевод вручную.':'Опубликовано. Текст, ссылки, иконки и фотографии обновлены на сайте.',Boolean(pending));
 }catch(e){status('Ошибка публикации: '+e.message,true)}
 finally{busy=false;button.disabled=false}
}
function switchPage(){
 if(dirtyCount())status('Несохранённые изменения сохранены в редакторе до нажатия «Опубликовать»');
 renderFields();updatePreview();
}
async function activate(){
 if(ready)return;ready=true;
 try{
  const [data,def]=await Promise.all([request('/api/admin/content'),fetch('/content-defaults.json',{cache:'no-store'}).then(r=>r.json())]);
  saved={content:data.content||{},content_en:data.content_en||{}};
  defaults={content:def.content||{},content_en:def.content_en||{}};
  renderFields();updatePreview();dirtyMessage();
 }catch(e){ready=false;status('Не удалось загрузить содержимое: '+e.message,true)}
}
for(const page of EDITOR_PAGES){const option=create('option','',page.title);option.value=page.id;$('#page-editor-select').append(option)}
$('#page-editor-select').value='home';
$('#page-editor-select').addEventListener('change',switchPage);
$('#page-editor-language').addEventListener('change',switchPage);
$('#page-editor-search').addEventListener('input',searchFields);
$('#page-editor-save').addEventListener('click',publish);
document.querySelectorAll('[data-tab]').forEach(tab=>{
 tab.addEventListener('click',()=>{
  $('#pages-section').hidden=tab.dataset.tab!=='pages';
  if(tab.dataset.tab==='pages'&&!ready)activate();
 });
});
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==$('#page-editor-frame').contentWindow)return;
 if(event.data?.source==='nova-cms-inspector')selectField(String(event.data.key||''));
});
const workspace=$('#workspace');
new MutationObserver(()=>{if(!workspace.hidden&&!ready)activate()}).observe(workspace,{attributes:true,attributeFilter:['hidden']});
if(!workspace.hidden)activate();
window.addEventListener('beforeunload',event=>{if(dirtyCount()){event.preventDefault();event.returnValue=''}});
