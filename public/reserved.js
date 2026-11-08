const $=selector=>document.querySelector(selector);
const venues={zyb:'HÓF / Зыбицкая',pob:'Победителей',east:'Восток'};
const statuses={new:'Новая',confirmed:'Подтверждена',cancelled:'Отменена',completed:'Завершена',no_show:'Не пришли'};
const auth=$('#login-panel'),dashboard=$('#dashboard'),staff=$('#staff-actions'),listing=$('#reservations');
let page=0,busy=false,initialized=false;
function message(element,text='',error=false){element.textContent=text;element.classList.toggle('error',error)}
async function api(url,method='GET',body){
 const opts={method,credentials:'same-origin',cache:'no-store',headers:{'X-Nova-Reserved':'1'}};
 if(body){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body)}
 let response;try{response=await fetch(url,opts)}catch{throw new Error('Нет соединения с сервером.')}
 let json;try{json=await response.json()}catch{throw new Error('Некорректный ответ сервера.')}
 if(!response.ok){
  const code=json?.error;
  if(response.status===401){showLogin();throw new Error('Требуется повторный вход.')}
  throw new Error(code==='too_many_attempts'?'Слишком много попыток входа. Повторите позже.':
    code==='not_configured'?'Доступ пока не настроен.':code==='invalid_password'?'Неверный пароль.':
    code==='forbidden'?'Действие запрещено.':'Ошибка сервера. Повторите попытку.');
 }
 return json;
}
function showLogin(){auth.hidden=false;dashboard.hidden=true;staff.hidden=true;initialized=false}
function showDashboard(){auth.hidden=true;dashboard.hidden=false;staff.hidden=false;initialized=true;load()}
function labelDate(value){
 const d=new Date(value+'T12:00:00Z');
 return Number.isNaN(d.getTime())?value:new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(d);
}
function element(tag,cls,text){
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(text!==undefined)el.textContent=String(text);
 return el;
}
function renderCard(r){
 const card=element('article','reservation');
 const when=element('div','reservation-main');
 when.append(element('span','reservation-venue',venues[r.venue]||r.venue));
 when.append(element('span','reservation-date',labelDate(r.booking_date)+' · '+r.booking_time));
 when.append(element('span','reservation-created','Получена: '+(r.created_at||'')+' UTC'));
 const content=element('div','reservation-details');
 content.append(element('h2','reservation-name',r.guest_name));
 const phone=element('a','reservation-phone',r.phone);
 phone.href='tel:'+String(r.phone).replace(/[^+\d]/g,'');
 content.append(phone,element('span','',r.guests+' '+(r.guests===1?'гость':r.guests<5?'гостя':'гостей')));
 if(r.comment)content.append(element('p','reservation-note',r.comment));
 const controls=element('div','reservation-controls');
 const tag=element('span','reservation-status',statuses[r.status]||r.status);
 tag.dataset.status=r.status;
 const label=element('label','', 'Статус бронирования');
 const select=element('select');
 select.setAttribute('aria-label','Статус бронирования '+r.guest_name);
 Object.entries(statuses).forEach(([key,name])=>{
  const option=element('option','',name);option.value=key;option.selected=key===r.status;select.append(option);
 });
 const info=element('p','status');
 select.addEventListener('change',async()=>{
  const target=select.value,previous=r.status;
  select.disabled=true;message(info,'Сохраняем...');
  try{
   await api('/api/reserved/reservations/'+encodeURIComponent(r.id),'PATCH',{status:target});
   r.status=target;tag.textContent=statuses[target];tag.dataset.status=target;message(info,'Сохранено');
  }catch(error){select.value=previous;message(info,error.message,true)}
  finally{select.disabled=false}
 });
 label.append(select);controls.append(tag,label,info);
 card.append(when,content,controls);return card;
}
async function load(){
 if(!initialized||busy)return;
 busy=true;
 $('#refresh').disabled=true;
 message($('#dashboard-status'),'Загружаем бронирования...');
 const qs=new URLSearchParams({page:String(page),venue:$('#filter-venue').value,status:$('#filter-status').value});
 if($('#filter-date').value)qs.set('date',$('#filter-date').value);
 try{
  const data=await api('/api/reserved/reservations?'+qs);
  listing.replaceChildren();
  for(const reservation of data.reservations||[])listing.append(renderCard(reservation));
  if(!data.reservations?.length)listing.append(element('div','empty-state','Заявок по выбранным фильтрам нет.'));
  $('#total-count').textContent=data.total||'0';
  $('#page-number').textContent=String(page+1);
  $('#previous').disabled=page<=0;$('#next').disabled=(page+1)*100>=data.total;
  message($('#dashboard-status'),'');
 }catch(error){message($('#dashboard-status'),error.message,true)}
 finally{busy=false;$('#refresh').disabled=false}
}
$('#login-form').addEventListener('submit',async e=>{
 e.preventDefault();const btn=e.currentTarget.querySelector('button');
 btn.disabled=true;message($('#login-status'),'Проверяем доступ...');
 try{
  await api('/api/reserved/login','POST',{password:$('#password').value});
  $('#password').value='';message($('#login-status'));showDashboard();
 }catch(err){message($('#login-status'),err.message,true)}
 finally{btn.disabled=false}
});
$('#logout').addEventListener('click',async()=>{
 try{await api('/api/reserved/logout','POST')}catch{}
 showLogin();
});
$('#refresh').addEventListener('click',load);
for(const id of ['filter-venue','filter-status','filter-date']){
 $('#'+id).addEventListener('change',()=>{page=0;load()});
}
$('#reset-filters').addEventListener('click',()=>{
 $('#filter-venue').value='all';$('#filter-status').value='all';$('#filter-date').value='';page=0;load();
});
$('#previous').addEventListener('click',()=>{if(page>0){page--;load()}});
$('#next').addEventListener('click',()=>{page++;load()});
window.addEventListener('focus',()=>{if(initialized)load()});
setInterval(()=>{if(initialized&&!document.hidden)load()},30000);
api('/api/reserved/session').then(showDashboard).catch(showLogin);
