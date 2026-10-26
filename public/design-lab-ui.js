// One-time cinematic introduction; never hide functional content indefinitely.
(() => {
 const root=document.documentElement,app=document.getElementById('app');
 if(!app)return;
 let started=false;
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const imageReady=img=>new Promise(resolve=>{
   if(!img||img.complete){resolve();return;}
   img.addEventListener('load',resolve,{once:true});
   img.addEventListener('error',resolve,{once:true});
 });
 const onRender=()=>{
   if(!app.querySelector('main'))return;
   root.classList.add('lab-app-rendered');
   const hero=app.querySelector('.hero-editorial');
   if(!hero){root.classList.remove('lab-hero-preparing');return;}
   if(started)return;
   started=true;
   const font=document.fonts?.load?document.fonts.load('300 48px Manrope','NOVA').catch(()=>{}):Promise.resolve();
   Promise.race([Promise.all([font,imageReady(hero.querySelector('.hero-photo img'))]),sleep(2300)])
    .then(()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok))))
    .then(()=>{root.classList.add('lab-hero-ready');root.classList.remove('lab-hero-preparing')})
    .catch(()=>{root.classList.add('lab-hero-ready');root.classList.remove('lab-hero-preparing')});
 };
 const change=new MutationObserver(onRender);
 change.observe(app,{childList:true});onRender();
 const onScroll=()=>document.body.classList.toggle('lab-hero-scrolled',scrollY>40);
 addEventListener('scroll',onScroll,{passive:true});onScroll();
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{
  if(e.matches){root.classList.remove('lab-hero-preparing');root.classList.add('lab-hero-ready');}
 });
})();

// Original NOVA site, only in design-lab branch.
// Scroll reveal is purely cosmetic: never hide above-the-fold content.
(() => {
  const app=document.querySelector('#app');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(!app||!('IntersectionObserver' in window)||reduced.matches)return;
  const selector='.venues-heading,.venue-card,.story-editorial-heading,.story-copy,.story-photo,.home-events-top,.home-events .event-card,.book-main,.lab-detail-story-copy,.lab-detail-gallery,.lab-detail-next,.events-intro,.events-section';
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      entry.target.classList.remove('lab-pending');
      entry.target.classList.add('lab-visible');
      observer.unobserve(entry.target);
    }
  },{threshold:.08,rootMargin:'0px 0px -28px 0px'});
  let queued=false;
  const refresh=()=>{
    queued=false;
    for(const el of app.querySelectorAll(selector)){
      if(el.dataset.labObserved)continue;
      el.dataset.labObserved='1';
      el.classList.add('lab-reveal');
      const top=el.getBoundingClientRect().top;
      if(top>innerHeight*.94){
        el.classList.add('lab-pending');
        observer.observe(el);
      }else el.classList.add('lab-visible');
    }
  };
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(refresh)};
  const mutation=new MutationObserver(schedule);
  mutation.observe(app,{childList:true,subtree:false});
  refresh();
  reduced.addEventListener('change',event=>{
    if(!event.matches)return;
    observer.disconnect();
    mutation.disconnect();
    for(const el of app.querySelectorAll('.lab-reveal')){
      el.classList.remove('lab-pending');
      el.classList.add('lab-visible');
    }
  },{once:true});
})();
