import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {messageText,sendReservation,telegramScheduled,telegramWebhook,updateTelegramReservation} from '../src/telegram.js';
const worker=readFileSync('src/index.js','utf8');
const reservations=readFileSync('src/reservations.js','utf8');
const migration=readFileSync('migrations/0006_telegram.sql','utf8');
const config=readFileSync('wrangler.jsonc','utf8');
const numberMigration=readFileSync('migrations/0007_reservation_numbers.sql','utf8');
const id='11111111-1111-4111-8111-111111111111';

assert.match(worker,/telegramWebhook\(request,env\)/);
assert.match(worker,/telegramScheduled\(env\)/);
assert.match(reservations,/sendReservation\(env,id\)/);
assert.match(migration,/CREATE TABLE IF NOT EXISTS telegram_venue_chats/);
assert.match(migration,/telegram_message_id/);
assert.match(numberMigration,/AUTOINCREMENT/,'Booking numbers must never be reused');
assert.match(numberMigration,/CREATE TRIGGER IF NOT EXISTS reservation_number_after_insert/,'New bookings must be numbered automatically');
assert.match(readFileSync('src/telegram.js','utf8'),/AS booking_number FROM reservations WHERE id=\?/,'Booking number must be fetched from the persistent mapping');
assert.match(config,/"\*\/5 \* \* \* \*"/);
assert.doesNotMatch(worker,/8965559775|AAGN4/,'Telegram tokens must never be committed');
assert.doesNotMatch(readFileSync('src/telegram.js','utf8'),/8965559775|AAGN4/,'Telegram tokens must never be committed');
assert.equal(await sendReservation({},id),false);
await telegramScheduled({});
let response=await telegramWebhook(new Request('https://nova.test/api/telegram/webhook',{method:'GET'}),{});
assert.equal(response.status,405);
response=await telegramWebhook(new Request('https://nova.test/api/telegram/webhook',{method:'POST',body:'{}'}),{TELEGRAM_WEBHOOK_SECRET:'secret'});
assert.equal(response.status,403);

const calls=[];
const originalFetch=globalThis.fetch;
globalThis.fetch=async (url,options)=>{
 const method=String(url).split('/').at(-1);
 const body=JSON.parse(options.body);
 calls.push({method,body});
 if(method==='sendMessage')return Response.json({ok:true,result:{message_id:900}});
 if(method==='editMessageText')return Response.json({ok:true,result:{}});
 if(method==='getChatMember')return Response.json({ok:true,result:{status:'administrator'}});
 if(method==='answerCallbackQuery')return Response.json({ok:true,result:true});
 return Response.json({ok:true,result:{}});
};
const sample={id,venue:'zyb',guest_name:'Оля',phone:'+375296390777',booking_date:'2026-11-21',booking_time:'18:00',guests:4,comment:'Без повода, не в центре зала',status:'new',booking_number:36,telegram_sent_at:null,telegram_chat_id:null,telegram_message_id:null};
assert.equal(messageText(sample),[
 '🟡 Новая бронь №36','📅 21.11.2026','⏰ 18:00','👥 4','👤 Оля',
 '📞 +375296390777','💬 Без повода, не в центре зала'
].join('\n'),'The Telegram notification must match the screenshot');
assert.equal(messageText({...sample,comment:'  '}),messageText(sample).replace('\n💬 Без повода, не в центре зала',''));
assert.match(messageText({...sample,status:'cancelled'}),/^🔴 Бронь №36 отменена\n/);
assert.match(messageText({...sample,booking_number:undefined}),/^🟡 Новая бронь\n/);
const updates=[];
const env={
 TELEGRAM_BOT_TOKEN:'fake-token',TELEGRAM_WEBHOOK_SECRET:'secret',TELEGRAM_SETUP_CODE:'pair-key',
 DB:{prepare(sql){return {
  bind(...args){return {
   async first(){
    if(sql.includes('FROM reservations WHERE id=?'))return sample;
    if(sql.includes('FROM telegram_venue_chats WHERE venue=?'))return {chat_id:'-100123'};
    return null;
   },
   async run(){updates.push({sql,args});return {meta:{changes:1}}},
   async all(){return {results:[]}}
  }},
  async first(){return {n:0}}
 }}}
};
try{
 assert.equal(await sendReservation(env,id),true);
 assert.equal(calls[0].method,'sendMessage');
 assert.equal(calls[0].body.chat_id,'-100123');
 assert.equal(calls[0].body.text,messageText(sample));
 assert.equal(calls[0].body.parse_mode,undefined,'Guest comments must not be parsed as HTML or Markdown');
 assert.match(calls[0].body.text,/Оля/);
 assert.equal(calls[0].body.reply_markup.inline_keyboard[0][0].callback_data,'nova:c:'+id);
 assert.equal(updates.length,1);
 assert.match(updates[0].sql,/telegram_sent_at/);
 sample.telegram_chat_id='-100123';sample.telegram_message_id=900;sample.status='confirmed';
 await updateTelegramReservation(env,id);
 assert.equal(calls.at(-1).method,'editMessageText');
 assert.match(calls.at(-1).body.text,/подтверждена/);
 assert.equal(calls.at(-1).body.reply_markup,undefined);
}finally{
 globalThis.fetch=originalFetch;
}
console.log('NOVA Telegram integration checks passed');
