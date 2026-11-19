// Telegram venue notifications and secure venue-group pairing for NOVA.
// Tokens, webhook verification token and pairing code are Cloudflare secrets.
const LABELS={zyb:'Зыбицкая',pob:'Победителей',east:'Восток'};
const WEBHOOK_URL='https://nova-lounge-demo.blacklivi-olx.workers.dev/api/telegram/webhook';
const textReply=(value,status=200)=>Response.json({ok:value},{status,headers:{'Cache-Control':'no-store'}});
async function telegram(env,method,data){
 if(!env.TELEGRAM_BOT_TOKEN)throw Error('telegram_not_configured');
 let response,result;
 try{
  response=await fetch('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/'+method,{
   method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)
  });
  result=await response.json();
 }catch{throw Error('telegram_transport_error_'+method)}
 if(!response.ok||!result?.ok)throw Error('telegram_api_error_'+method+'_'+(result?.error_code||response.status));
 return result.result;
}
// Compact, plain-text message matching the restaurant's booking notification style.
// Plain text is intentional: guest input must never be interpreted as Telegram markup.
export function messageText(b){
 const heading={
  new:'🟡 Новая бронь',
  confirmed:'🟢 Бронь подтверждена',
  cancelled:'🔴 Бронь отменена',
  completed:'✅ Бронь завершена',
  no_show:'⚪ Бронь: гости не пришли'
 }[b.status]||'Бронь';
 const date=/^\d{4}-\d{2}-\d{2}$/.test(b.booking_date||'')?
  b.booking_date.slice(8,10)+'.'+b.booking_date.slice(5,7)+'.'+b.booking_date.slice(0,4):b.booking_date;
 const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
 const lines=[
  heading,
  '📅 '+date,
  '⏰ '+b.booking_time,
  '👥 '+b.guests,
  '👤 '+clean(b.guest_name),
  '📞 '+clean(b.phone)
 ];
 if(clean(b.comment))lines.push('💬 '+clean(b.comment));
 return lines.join('\n');
}
function markup(b){
 return b.status==='new'?{inline_keyboard:[[
  {text:'Подтвердить',callback_data:'nova:c:'+b.id},
  {text:'Отклонить',callback_data:'nova:x:'+b.id}
 ]]}:undefined;
}
async function booking(env,id){
 return env.DB.prepare('SELECT id,venue,guest_name,phone,booking_date,booking_time,guests,comment,status,telegram_sent_at,telegram_chat_id,telegram_message_id,created_at FROM reservations WHERE id=?').bind(id).first();
}
export async function sendReservation(env,id){
 if(!env.TELEGRAM_BOT_TOKEN||!env.DB)return false;
 try{
  const b=await booking(env,id);
  if(!b||b.telegram_sent_at||b.status!=='new')return false;
  const link=await env.DB.prepare('SELECT chat_id FROM telegram_venue_chats WHERE venue=?').bind(b.venue).first();
  if(!link)return false;
  const sent=await telegram(env,'sendMessage',{
   chat_id:link.chat_id,text:messageText(b),reply_markup:markup(b),
   disable_web_page_preview:true
  });
  await env.DB.prepare('UPDATE reservations SET telegram_sent_at=CURRENT_TIMESTAMP,telegram_chat_id=?,telegram_message_id=? WHERE id=? AND telegram_sent_at IS NULL')
   .bind(String(link.chat_id),sent.message_id,id).run();
  return true;
 }catch(e){
  // Do not log personally identifying booking data or bot credentials.
  console.error('NOVA telegram send failed',e instanceof Error?e.message:'unknown');
  return false;
 }
}
export async function updateTelegramReservation(env,id){
 if(!env.TELEGRAM_BOT_TOKEN||!env.DB)return;
 try{
  const b=await booking(env,id);
  if(!b?.telegram_chat_id||!b.telegram_message_id)return;
  await telegram(env,'editMessageText',{
   chat_id:b.telegram_chat_id,message_id:b.telegram_message_id,
   text:messageText(b),reply_markup:markup(b),disable_web_page_preview:true
  });
 }catch(e){
  // A deleted Telegram message should never roll back a booking status.
  console.error('NOVA telegram sync failed',e instanceof Error?e.message:'unknown');
 }
}
async function isGroupAdmin(env,chatId,userId){
 try{
  const member=await telegram(env,'getChatMember',{chat_id:chatId,user_id:userId});
  return member?.status==='creator'||member?.status==='administrator';
 }catch{return false}
}
async function bindGroup(env,update){
 const chat=update.chat,from=update.from;
 if(!['group','supergroup'].includes(chat?.type)||!from?.id)return;
 const pieces=(update.text||'').trim().split(/\s+/);
 // /bind zyb 1234...  (also accept /bind@bot_username)
 if(!/^\/bind(?:@\w+)?$/.test(pieces[0]||''))return;
 if(!await isGroupAdmin(env,chat.id,from.id)){
  await telegram(env,'sendMessage',{chat_id:chat.id,text:'Привязать заведение может только администратор группы. Бот также должен быть администратором.'});
  return;
 }
 const venue=pieces[1],code=pieces[2];
 if(!LABELS[venue]||!env.TELEGRAM_SETUP_CODE||code!==env.TELEGRAM_SETUP_CODE){
  await telegram(env,'sendMessage',{chat_id:chat.id,text:'Неверная команда привязки. Проверьте код и заведение.'});
  return;
 }
 // The one-time setup code stops working once all three venues are linked.
 const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM telegram_venue_chats').first();
 if(count?.n>=3){
  await telegram(env,'sendMessage',{chat_id:chat.id,text:'Все три заведения уже привязаны. Для изменения конфигурации нужен новый код.'});
  return;
 }
 const used=await env.DB.prepare('SELECT venue FROM telegram_venue_chats WHERE chat_id=?').bind(String(chat.id)).first();
 if(used&&used.venue!==venue){
  await telegram(env,'sendMessage',{chat_id:chat.id,text:'Эта группа уже привязана к другому заведению.'});
  return;
 }
 await env.DB.prepare('INSERT INTO telegram_venue_chats(venue,chat_id,linked_by) VALUES(?,?,?) ON CONFLICT(venue) DO UPDATE SET chat_id=excluded.chat_id,linked_by=excluded.linked_by,linked_at=CURRENT_TIMESTAMP')
  .bind(venue,String(chat.id),String(from.id)).run();
 await telegram(env,'sendMessage',{chat_id:chat.id,text:'Группа подключена: NOVA — '+LABELS[venue]+'. Новые бронирования будут поступать сюда.'});
}
async function callback(env,q){
 if(!q?.id)return;
 let reply='Не удалось обработать заявку.';
 try{
  const match=/^nova:([cx]):([a-f0-9-]{36})$/.exec(q.data||'');
  if(!match||!q.message?.chat||!q.from?.id){reply='Неизвестная команда.'}
  else{
   const id=match[2],chatId=String(q.message.chat.id),b=await booking(env,id);
   const link=b&&await env.DB.prepare('SELECT chat_id FROM telegram_venue_chats WHERE venue=?').bind(b.venue).first();
   if(!b||!link||String(link.chat_id)!==chatId){reply='Эта заявка не относится к данной группе.'}
   else if(!await isGroupAdmin(env,chatId,q.from.id)){reply='Подтверждать брони может только администратор группы.'}
   else if(b.status!=='new'){reply='Заявка уже обработана.';await updateTelegramReservation(env,id)}
   else{
    const status=match[1]==='c'?'confirmed':'cancelled';
    const changed=await env.DB.prepare("UPDATE reservations SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND venue=? AND status='new'")
     .bind(status,id,b.venue).run();
    if(changed.meta.changes===1){
     await env.DB.prepare('INSERT INTO reservation_audit(id,reservation_id,from_status,to_status,actor) VALUES(?,?,?,?,?)')
      .bind(crypto.randomUUID(),id,'new',status,'telegram:'+q.from.id).run();
     reply=status==='confirmed'?'Бронирование подтверждено.':'Бронирование отменено.';
    }else reply='Заявка уже обработана.';
    await updateTelegramReservation(env,id);
   }
  }
 }catch(e){console.error('NOVA telegram callback failed',e instanceof Error?e.message:'unknown')}
 try{await telegram(env,'answerCallbackQuery',{callback_query_id:q.id,text:reply,show_alert:false})}catch{}
}
export async function telegramWebhook(req,env){
 if(req.method!=='POST')return textReply(false,405);
 if(!env.TELEGRAM_WEBHOOK_SECRET||req.headers.get('x-telegram-bot-api-secret-token')!==env.TELEGRAM_WEBHOOK_SECRET)return textReply(false,403);
 if(Number(req.headers.get('content-length')||0)>15000)return textReply(false,413);
 try{
  const body=await req.json();
  if(body?.message)await bindGroup(env,body.message);
  if(body?.callback_query)await callback(env,body.callback_query);
 }catch(e){console.error('NOVA telegram webhook failed',e instanceof Error?e.message:'unknown');return textReply(false,500)}
 return textReply(true);
}
export async function telegramScheduled(env){
 if(!env.TELEGRAM_BOT_TOKEN||!env.TELEGRAM_WEBHOOK_SECRET||!env.DB)return;
 try{
  const target=env.TELEGRAM_WEBHOOK_URL||WEBHOOK_URL;
  const info=await telegram(env,'getWebhookInfo',{});
  if(info?.url!==target||!info?.has_custom_certificate&&info?.pending_update_count>1000){
   await telegram(env,'setWebhook',{url:target,secret_token:env.TELEGRAM_WEBHOOK_SECRET,allowed_updates:['message','callback_query'],drop_pending_updates:false});
  }
  // Retry only recent, upcoming bookings; do not send old demo bookings to new groups.
  const rows=await env.DB.prepare("SELECT id FROM reservations WHERE telegram_sent_at IS NULL AND status='new' AND created_at>=datetime('now','-24 hours') AND booking_date>=date('now') ORDER BY created_at ASC LIMIT 20").all();
  for(const item of rows.results||[])await sendReservation(env,item.id);
 }catch(e){console.error('NOVA telegram maintenance failed',e instanceof Error?e.message:'unknown')}
}
