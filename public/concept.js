// NOVA design presentation: isolated, read-only and accessible.
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const items = [...document.querySelectorAll('.reveal')];
  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, {threshold: .12, rootMargin: '0px 0px -28px 0px'});
    items.forEach(el => observer.observe(el));
    reducedMotion.addEventListener('change', e => {
      if (e.matches) { observer.disconnect(); items.forEach(el => el.classList.add('is-visible')); }
    }, {once:true});
  }

  // Fast, bounded scroll between presentation chapters. Native smooth scrolling
  // can take too long for anchors several screens below the current viewport.
  let frame = 0;
  const cancel = () => {if(frame) cancelAnimationFrame(frame); frame=0};
  const scrollToChapter = target => {
    cancel();
    const headingOffset = 0; // floating concept header does not occlude later sections
    const total = Math.max(0,document.documentElement.scrollHeight - innerHeight);
    const destination = Math.min(total,Math.max(0,Math.round(target.getBoundingClientRect().top + scrollY - headingOffset)));
    if(reducedMotion.matches || Math.abs(destination-scrollY)<4){
      scrollTo({top:destination,behavior:'instant'});
      return;
    }
    const start=scrollY,delta=destination-start;
    const duration=Math.min(730,300+Math.abs(delta)*.06);
    const begin=performance.now();
    const tick=now=>{
      const progress=Math.min(1,(now-begin)/duration);
      const eased=1-Math.pow(1-progress,3);
      scrollTo({top:start+delta*eased,behavior:'instant'});
      if(progress<1)frame=requestAnimationFrame(tick);
      else frame=0;
    };
    frame=requestAnimationFrame(tick);
  };
  for(const link of document.querySelectorAll('a[href^="#"]')){
    link.addEventListener('click',event=>{
      const hash=link.getAttribute('href');
      if(!hash||hash==='#')return;
      const target=document.getElementById(hash.slice(1));
      if(!target)return;
      event.preventDefault();
      scrollToChapter(target);
      history.replaceState(null,'',hash);
    });
  }
  addEventListener('wheel',cancel,{passive:true});
  addEventListener('touchstart',cancel,{passive:true});
  addEventListener('keydown',event=>{
    if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))cancel();
  });
})();
