// Staff dashboard never decides which venue a user may read or change;
// the Worker verifies tenant scope against D1 for every request.
const $=selector=>document.querySelector(selector);
const venues={zyb:'HÓF / Зыбицкая',pob:'Победителей',east:'Восток'};
const statuses={new:'Новая',confirmed:'Подтверждена',cancelled:'Отменена',completed:'Завершена',no_show:'Не пришли'};
const roles={owner:'Владелец',manager:'Администратор',viewer:'Наблюдатель'};
const auth=$('#login-panel'),dashboard=$('#dashboard'),staff=$('#staff-actions'),listing=$('#reservations');
let page=0,busy=false,initialized=false,identity=null,usersOpen=false,loadSerial=0;
const detailDialog=$('#reservation-detail-dialog');
let activeDetail=null;
function message(el,text='',error=false){if(!el)return;el.textContent=text;el.classList.toggle('error',error)}
function element(tag,cls,value){
 const el=document.createElement(tag);if(cls)el.className=cls;
 if(value!==undefined)el.textContent=String(value);
 return el;
}
async function api(url,method='GET',body){
 const opts={method,credentials:'same-origin',cache:'no-store',headers:{'X-Nova-Reserved':'1'}};
 if(body!==undefined){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body)}
 let response;try{response=await fetch(url,opts)}catch{throw new Error('Нет соединения с сервером.')}
 let data;try{data=await response.json()}catch{throw new Error('Некорректный ответ сервера.')}
 if(!response.ok){
  if(response.status===401&&url!=='/api/reserved/login')showLogin();
  const errors={
   invalid_credentials:'Неправильный логин или пароль.',
   too_many_attempts:'Слишком много попыток входа. Повторите позже.',
   not_configured:'Доступ пока не настроен.',
   forbidden:'Недостаточно прав. Действие запрещено.',
   username_taken:'Такой логин уже существует.',
   invalid_user:'Проверьте имя, логин, заведение, права и пароль (минимум 12 символов).',
   user_limit:'Достигнуто максимальное число сотрудников.',
   not_found:'Запись не найдена или недоступна.',
   unauthorized:'Сеанс завершён. Выполните вход снова.'
  };
  throw new Error(errors[data?.error]||'Ошибка сервера. Повторите попытку.');
 }
 return data;
}
function showLogin(){
 if(detailDialog.open)detailDialog.close();
 activeDetail=null;
 loadSerial++;busy=false;
 identity=null;initialized=false;usersOpen=false;
 auth.hidden=false;dashboard.hidden=true;staff.hidden=true;
 $('#users-panel').hidden=true;$('#users-toggle').hidden=true;
 listing.replaceChildren();$('#users-list').replaceChildren();
 $('#total-count').textContent='—';
}
function showDashboard(user){
 if(!user||!['owner','manager','viewer'].includes(user.role))return showLogin();
 loadSerial++;busy=false;listing.replaceChildren();
 identity=user;initialized=true;usersOpen=false;
 auth.hidden=true;dashboard.hidden=false;staff.hidden=false;
 const isOwner=user.role==='owner';
 $('#users-toggle').hidden=!isOwner;
 $('#users-panel').hidden=true;
 $('#staff-identity').textContent=user.display_name+' · '+(isOwner?'Все заведения':venues[user.venue]);
 $('#scope-label').textContent=isOwner?'Доступ ко всем заведениям':
  venues[user.venue]+' · '+roles[user.role]+(user.role==='viewer'?' (без изменения бронирований)':'');
 $('#filter-venue-wrap').hidden=!isOwner;
 if(!isOwner)$('#filter-venue').value=user.venue;
 else $('#filter-venue').value='all';
 page=0;void load();
}
function labelDate(value){
 const d=new Date(value+'T12:00:00Z');
 return Number.isNaN(d.getTime())?value:new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(d);
}
function mobileDate(value){
 const d=new Date(value+'T12:00:00Z');
 return Number.isNaN(d.getTime())?value:new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',timeZone:'UTC'}).format(d);
}
function guestsLabel(count){
 const n=Number(count);
 return n+' '+(n%10===1&&n%100!==11?'гость':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'гостя':'гостей');
}
function refreshReservationStatus(r,card){
 card.querySelectorAll('.reservation-status').forEach(el=>{
  el.textContent=statuses[r.status]||r.status;
  el.dataset.status=r.status;
 });
 const desktopSelect=card.querySelector('.reservation-controls select');
 if(desktopSelect)desktopSelect.value=r.status;
 if(activeDetail?.reservation===r){
  const badge=$('#detail-status');
  badge.textContent=statuses[r.status]||r.status;
  badge.dataset.status=r.status;
  $('#detail-status-select').value=r.status;
  $('#detail-save').disabled=true;
 }
}
function openReservationDetails(r,card){
 if(!identity||!initialized||detailDialog.open)return;
 activeDetail={reservation:r,card};
 $('#detail-venue').textContent=venues[r.venue]||r.venue;
 $('#detail-date').textContent=labelDate(r.booking_date);
 $('#detail-time').textContent=r.booking_time;
 $('#detail-title').textContent=r.guest_name;
 $('#detail-guests').textContent=guestsLabel(r.guests);
 const phone=String(r.phone||'');
 $('#detail-phone-number').textContent=phone;
 $('#detail-phone').href='tel:'+phone.replace(/[^+\\d]/g,'');
 const wrap=$('#detail-note-wrap');
 wrap.hidden=!r.comment;
 $('#detail-note').textContent=r.comment||'';
 $('#detail-created').textContent='Заявка получена: '+(r.created_at||'')+' UTC';
 const writable=identity.role!=='viewer';
 $('#detail-actions').hidden=!writable;
 $('#detail-status-select').value=r.status;
 $('#detail-save').disabled=true;
 message($('#detail-feedback'),'');
 refreshReservationStatus(r,card);
 detailDialog.showModal();
 $('#detail-close').focus({preventScroll:true});
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
 const tag=element('span','reservation-status',statuses[r.status]||r.status);tag.dataset.status=r.status;
 controls.append(tag);
 const mobile=element('div','reservation-mobile');
 const top=element('div','reservation-mobile-top');
 const dateWrap=element('div','reservation-mobile-date');
 dateWrap.append(element('span','reservation-mobile-date-day',mobileDate(r.booking_date)),element('strong','reservation-mobile-time',r.booking_time));
 const mobileTag=element('span','reservation-status reservation-mobile-status',statuses[r.status]||r.status);
 mobileTag.dataset.status=r.status;
 top.append(dateWrap,mobileTag);
 mobile.append(top,element('span','reservation-mobile-venue',venues[r.venue]||r.venue));
 mobile.append(element('h2','reservation-mobile-name',r.guest_name));
 const foot=element('div','reservation-mobile-foot');
 const meta=element('div','reservation-mobile-meta');
 meta.append(element('span','reservation-mobile-guests',guestsLabel(r.guests)));
 if(r.comment)meta.append(element('span','reservation-mobile-note-flag','Есть комментарий'));
 const open=element('button','reservation-mobile-open','Детали заявки');
 open.type='button';
 open.setAttribute('aria-label','Открыть заявку '+r.guest_name);
 open.addEventListener('click',()=>openReservationDetails(r,card));
 foot.append(meta,open);
 mobile.append(foot);
 if(identity?.role!=='viewer'){
  const label=element('label','', 'Статус бронирования');
  const select=element('select');
  select.setAttribute('aria-label','Статус бронирования '+r.guest_name);
  Object.entries(statuses).forEach(([key,name])=>{
   const option=element('option','',name);option.value=key;option.selected=key===r.status;select.append(option);
  });
  const info=element('p','status');
  select.addEventListener('change',async()=>{
   const next=select.value,previous=r.status;select.disabled=true;message(info,'Сохраняем...');
   try{
    await api('/api/reserved/reservations/'+encodeURIComponent(r.id),'PATCH',{status:next});
    r.status=next;refreshReservationStatus(r,card);message(info,'Сохранено');
   }catch(error){select.value=previous;message(info,error.message,true)}
   finally{select.disabled=false}
  });
  label.append(select);controls.append(label,info);
 }
 card.append(when,content,controls,mobile);return card;
}
async function load(){
 if(!initialized||busy||detailDialog.open)return;
 const serial=++loadSerial;
 busy=true;$('#refresh').disabled=true;
 message($('#dashboard-status'),'Загружаем бронирования...');
 const qs=new URLSearchParams({
  page:String(page),venue:identity?.role==='owner'?$('#filter-venue').value:identity.venue,status:$('#filter-status').value
 });
 if($('#filter-date').value)qs.set('date',$('#filter-date').value);
 try{
  const data=await api('/api/reserved/reservations?'+qs);
  if(serial!==loadSerial||!initialized)return; // stale account data cannot appear after logout / role switch
  listing.replaceChildren();
  for(const reservation of data.reservations||[])listing.append(renderCard(reservation));
  if(!data.reservations?.length)listing.append(element('div','empty-state','Заявок по выбранным фильтрам нет.'));
  $('#total-count').textContent=String(data.total||0);
  $('#page-number').textContent=String(page+1);
  $('#previous').disabled=page<=0;
  $('#next').disabled=(page+1)*100>=data.total;
  message($('#dashboard-status'),'');
 }catch(e){if(serial===loadSerial&&initialized)message($('#dashboard-status'),e.message,true)}
 finally{if(serial===loadSerial){busy=false;$('#refresh').disabled=false}}
}
function choice(values,selected){
 const select=element('select');
 for(const [key,text] of Object.entries(values)){
  const op=element('option','',text);op.value=key;op.selected=key===selected;select.append(op);
 }
 return select;
}
function labelled(label,input){
 const wrap=element('label','user-field',label);wrap.append(input);return wrap;
}
function userRow(u){
 const card=element('article','user-record');
 const head=element('div','user-record-head');
 head.append(element('h3','',u.display_name+' · '+u.username));
 head.append(element('span','user-state',u.active?'Активен':'Отключён'));
 const form=element('form','user-edit-form');
 const name=element('input');name.name='display_name';name.value=u.display_name;name.maxLength=80;name.required=true;
 const venue=choice(venues,u.venue);venue.name='venue';
 const role=choice({manager:'Администратор — менять брони',viewer:'Наблюдатель — только смотреть'},u.role);role.name='role';
 const active=choice({yes:'Доступ разрешён',no:'Доступ отключён'},u.active?'yes':'no');active.name='active';
 const password=element('input');password.name='password';password.type='password';password.autocomplete='new-password';
 password.placeholder='Не менять';password.minLength=12;password.maxLength=128;
 const grid=element('div','user-form-grid');
 grid.append(labelled('Имя',name),labelled('Заведение',venue),labelled('Права',role),
  labelled('Статус',active),labelled('Новый пароль (необязательно)',password));
 const button=element('button','primary-button','Сохранить изменения');button.type='submit';
 const hint=element('p','status');form.append(grid,button,hint);
 form.addEventListener('submit',async e=>{
  e.preventDefault();button.disabled=true;message(hint,'Сохраняем...');
  const patch={display_name:name.value.trim(),venue:venue.value,role:role.value,active:active.value==='yes'};
  if(password.value)patch.password=password.value;
  try{
   await api('/api/reserved/users/'+encodeURIComponent(u.id),'PATCH',patch);
   password.value='';
   message(hint,'Сохранено. Сессии сотрудника завершены.');
   await loadUsers();
  }catch(error){message(hint,error.message,true)}
  finally{button.disabled=false}
 });
 card.append(head,form);return card;
}
async function loadUsers(){
 if(identity?.role!=='owner')return;
 message($('#users-status'),'Загружаем список...');
 try{
  const data=await api('/api/reserved/users');
  if(identity?.role!=='owner'||!usersOpen)return;
  const list=$('#users-list');list.replaceChildren();
  if(!data.users?.length)list.append(element('div','empty-state','Пока нет сотрудников. Создайте учётную запись для каждого заведения.'));
  for(const user of data.users||[])list.append(userRow(user));
  message($('#users-status'),'');
 }catch(e){message($('#users-status'),e.message,true)}
}
$('#detail-close').addEventListener('click',()=>detailDialog.close());
detailDialog.addEventListener('click',event=>{
 if(event.target===detailDialog)detailDialog.close();
});
detailDialog.addEventListener('close',()=>{
 activeDetail=null;
 message($('#detail-feedback'),'');
});
$('#detail-status-select').addEventListener('change',()=>{
 if(!activeDetail||identity?.role==='viewer')return;
 $('#detail-save').disabled=$('#detail-status-select').value===activeDetail.reservation.status;
 message($('#detail-feedback'),'');
});
$('#detail-save').addEventListener('click',async()=>{
 if(!activeDetail||!identity||identity.role==='viewer')return;
 const {reservation:r,card}=activeDetail;
 const next=$('#detail-status-select').value;
 if(!Object.hasOwn(statuses,next)||next===r.status)return;
 const save=$('#detail-save'),select=$('#detail-status-select');
 save.disabled=true;select.disabled=true;
 message($('#detail-feedback'),'Сохраняем статус...');
 try{
  await api('/api/reserved/reservations/'+encodeURIComponent(r.id),'PATCH',{status:next});
  if(activeDetail?.reservation!==r)return;
  r.status=next;
  refreshReservationStatus(r,card);
  message($('#detail-feedback'),'Статус сохранён');
 }catch(error){
  if(activeDetail?.reservation===r)message($('#detail-feedback'),error.message,true);
 }finally{
  select.disabled=false;
  if(activeDetail?.reservation===r)save.disabled=select.value===r.status;
 }
});
$('#login-form').addEventListener('submit',async e=>{
 e.preventDefault();const button=e.currentTarget.querySelector('button');
 button.disabled=true;message($('#login-status'),'Проверяем доступ...');
 try{
  const result=await api('/api/reserved/login','POST',{username:$('#username').value.trim().toLowerCase(),password:$('#password').value});
  $('#password').value='';message($('#login-status'),'');
  showDashboard(result.user);
 }catch(e){message($('#login-status'),e.message,true)}
 finally{button.disabled=false}
});
$('#logout').addEventListener('click',async()=>{
 try{await api('/api/reserved/logout','POST')}catch{}
 showLogin();
});
$('#users-toggle').addEventListener('click',()=>{
 if(identity?.role!=='owner')return;
 usersOpen=!usersOpen;$('#users-panel').hidden=!usersOpen;
 $('#users-toggle').textContent=usersOpen?'Скрыть пользователей':'Пользователи';
 if(usersOpen)void loadUsers();
});
$('#users-close').addEventListener('click',()=>{
 usersOpen=false;$('#users-panel').hidden=true;$('#users-toggle').textContent='Пользователи';
});
$('#user-create-form').addEventListener('submit',async e=>{
 if(identity?.role!=='owner')return;
 e.preventDefault();
 const form=e.currentTarget,button=form.querySelector('[type=submit]');
 button.disabled=true;message($('#user-create-status'),'Создаём учётную запись...');
 const fd=new FormData(form);
 const data={username:String(fd.get('username')||'').trim().toLowerCase(),
  display_name:String(fd.get('display_name')||'').trim(),venue:fd.get('venue'),role:fd.get('role'),password:fd.get('password')};
 try{
  await api('/api/reserved/users','POST',data);
  form.reset();message($('#user-create-status'),'Сотрудник добавлен. Пароль больше не будет показан. Передайте его сотруднику лично.');
  await loadUsers();
 }catch(e){message($('#user-create-status'),e.message,true)}
 finally{button.disabled=false}
});
$('#refresh').addEventListener('click',load);
for(const id of ['filter-venue','filter-status','filter-date']){
 $('#'+id).addEventListener('change',()=>{page=0;void load()});
}
$('#reset-filters').addEventListener('click',()=>{
 $('#filter-venue').value=identity?.role==='owner'?'all':identity?.venue||'all';
 $('#filter-status').value='all';$('#filter-date').value='';page=0;void load();
});
$('#previous').addEventListener('click',()=>{if(page>0){page--;void load()}});
$('#next').addEventListener('click',()=>{page++;void load()});
window.addEventListener('focus',()=>{if(initialized)void load()});
setInterval(()=>{if(initialized&&!document.hidden)void load()},30000);
api('/api/reserved/session').then(data=>showDashboard(data.user)).catch(showLogin);
