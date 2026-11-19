// The reservation API accepts 15-minute slots at least five minutes ahead,
// within the next 90 days, using the Minsk (UTC+03:00) clock all year.
const QUARTER=15*60*1000;
const MIN_NOTICE=5*60*1000;
const MAX_AHEAD=90*24*60*60*1000;
const MINSK_OFFSET=3*60*60*1000;
const localISO=ms=>new Date(ms+MINSK_OFFSET).toISOString().slice(0,16);

export function bookingWindow(now=Date.now()){
 const firstSlot=Math.ceil((now+MIN_NOTICE+1)/QUARTER)*QUARTER;
 const lastSlot=Math.floor((now+MAX_AHEAD)/QUARTER)*QUARTER;
 const firstISO=localISO(firstSlot),lastISO=localISO(lastSlot);
 return {firstISO,lastISO,firstDate:firstISO.slice(0,10),firstTime:firstISO.slice(11),
  lastDate:lastISO.slice(0,10),lastTime:lastISO.slice(11)};
}

export function availableBookingTimes(date,now=Date.now()){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return [];
 const {firstISO,lastISO}=bookingWindow(now);
 const options=[];
 for(let i=0;i<96;i++){
  const hour=String(Math.floor(i/4)).padStart(2,'0');
  const minute=String((i%4)*15).padStart(2,'0');
  const time=hour+':'+minute,iso=date+'T'+time;
  if(iso>=firstISO&&iso<=lastISO)options.push(time);
 }
 return options;
}

export function isValidBookingTime(date,time,now=Date.now()){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||
    !/^([01]\d|2[0-3]):(00|15|30|45)$/.test(time||''))return false;
 const iso=date+'T'+time;
 const {firstISO,lastISO}=bookingWindow(now);
 return iso>=firstISO&&iso<=lastISO;
}

// Keep the native and custom controls synchronized as time passes or dates change.
export function enhanceBookingTiming(form){
 const date=form.elements.date,time=form.elements.time;
 if(!date||!time)return ()=>false;
 const refresh=({preferEarliest=false}={})=>{
  const now=Date.now(),{firstDate,lastDate}=bookingWindow(now);
  const previousDate=date.value,previousTime=time.value;
  date.min=firstDate;
  date.max=lastDate;
  if(!date.value||date.value<firstDate||date.value>lastDate)date.value=firstDate;
  let times=availableBookingTimes(date.value,now);
  if(!times.length){date.value=firstDate;times=availableBookingTimes(firstDate,now)}
  const selected=preferEarliest||!times.includes(previousTime)?times[0]:previousTime;
  const oldOptions=[...time.options].map(o=>o.value);
  const changedOptions=oldOptions.length!==times.length||oldOptions.some((value,i)=>value!==times[i]);
  if(changedOptions){
   time.replaceChildren(...times.map(value=>new Option(value,value)));
   time.value=selected;
   time.dispatchEvent(new Event('booking-options-changed'));
  }else if(time.value!==selected)time.value=selected;
  if(previousTime!==time.value)time.dispatchEvent(new Event('change',{bubbles:true}));
  if(previousDate!==date.value)date.dispatchEvent(new Event('change',{bubbles:true}));
  return previousDate!==date.value||previousTime!==time.value;
 };
 date.addEventListener('change',()=>refresh({preferEarliest:true}));
 form.addEventListener('focusin',()=>refresh());
 form.addEventListener('pointerdown',()=>refresh());
 const timer=setInterval(()=>{
  if(!form.isConnected||!form.closest('dialog')?.open){clearInterval(timer);return}
  refresh();
 },10000);
 form.closest('dialog')?.addEventListener('close',()=>clearInterval(timer),{once:true});
 refresh();
 return ()=>refresh();
}
