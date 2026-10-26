// Original NOVA site, only in design-lab branch.
// Scroll reveal is purely cosmetic: never hide above-the-fold content.
(() => {
  const app=document.querySelector('#app');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(!app||!('IntersectionObserver' in window)||reduced.matches)return;
  const selector='.venues-heading,.venue-card,.story-copy,.story-photo,.home-events .section-link,.home-events .event-card,.book-main,.detail-grid,.detail-bottom,.events-intro,.events-section';
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
