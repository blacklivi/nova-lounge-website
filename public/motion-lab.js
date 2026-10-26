// NOVA editorial motion experiment. Kept entirely separate from the production branch.
// Native browser transforms and a single reveal timeline, no third-party animation engine.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopMotion = window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
let observer = null;
let listenersInstalled = false;
let parallaxFrame = 0;
let parallaxCurrent = 0;
let parallaxTarget = 0;
let introShown = false;

function updateParallaxTarget() {
  const photo = document.querySelector('#app .hero-photo');
  if (!photo || reducedMotion.matches || !desktopMotion.matches) {
    parallaxTarget = 0;
  } else {
    const rect = photo.getBoundingClientRect();
    // No work after the hero scrolls entirely out of view.
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    parallaxTarget = Math.max(0, Math.min(16, window.scrollY * 0.04));
  }
  if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(animateParallax);
}

function animateParallax() {
  const photo = document.querySelector('#app .hero-photo');
  if (!photo) {
    parallaxFrame = 0;
    parallaxCurrent = 0;
    return;
  }
  // Small inertial lag removes the single-frame steps of scroll-driven styling.
  parallaxCurrent += (parallaxTarget - parallaxCurrent) * 0.14;
  if (Math.abs(parallaxTarget - parallaxCurrent) < 0.08) {
    parallaxCurrent = parallaxTarget;
    parallaxFrame = 0;
  } else {
    parallaxFrame = window.requestAnimationFrame(animateParallax);
  }
  photo.style.setProperty('--lab-drift', parallaxCurrent.toFixed(2) + 'px');
}

function updateVenueVisibility() {
 const venue=document.querySelector('#app .venues');
 if (!venue) return;
 if (reducedMotion.matches) {
   venue.classList.add('lab-venues-visible');
   return;
 }
 // On a fresh load the heading and cards remain hidden even if the viewport
 // happens to include their top edge. Reveal only during a real downward scroll.
 const bounds=venue.getBoundingClientRect();
 if (window.scrollY > 70 && bounds.top < innerHeight * 0.96 && bounds.bottom > 0) {
   venue.classList.add('lab-venues-visible');
 }
}

function revealSections() {
  if (observer) observer.disconnect();
  document.querySelectorAll('.lab-reveal').forEach(el => {
    el.classList.remove('lab-reveal');
    el.classList.remove('lab-visible');
    el.style.removeProperty('--lab-order');
  });
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
  observer = new IntersectionObserver((entries, activeObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('lab-visible');
      activeObserver.unobserve(entry.target);
    }
  }, {rootMargin: '0px 0px -10% 0px', threshold: 0.08});

  const selectors = [
    '.story-copy', '.story-photo',
    '.home-events .section-link', '.home-events .event-card',
    '.book-strip .book-image', '.book-strip .book-main',
    '.events-intro', '.events-section',
    '.detail-copy', '.detail-image', '.detail-bottom > div'
  ].join(',');
  let venueIndex = 0;
  for (const element of document.querySelectorAll(selectors)) {
    const rect = element.getBoundingClientRect();
    // Content already near the viewport must never blink out when we hydrate.
    if (rect.top <= window.innerHeight * 0.48 || rect.bottom < 0) {
      element.classList.add('lab-visible');
      continue;
    }
    element.classList.add('lab-reveal');
    if (element.classList.contains('venue-card')) {
      element.style.setProperty('--lab-order', String(venueIndex++ % 3));
    }
    observer.observe(element);
  }
}

export function initMotionLab() {
  if (reducedMotion.matches) {
    document.documentElement.classList.remove('motion-lab');
    observer?.disconnect();
    document.querySelectorAll('.lab-reveal').forEach(el => el.classList.add('lab-visible'));
    updateVenueVisibility();
    updateParallaxTarget();
    return;
  }
  document.documentElement.classList.add('motion-lab');
  // The venue cards are controlled by scroll gating instead of the generic
  // observer, so they cannot show for one frame and then disappear.
  updateVenueVisibility();
  revealSections();
  updateParallaxTarget();

  if (!listenersInstalled) {
    listenersInstalled = true;
    window.addEventListener('scroll', updateParallaxTarget, {passive:true});
    window.addEventListener('scroll', updateVenueVisibility, {passive:true});
    window.addEventListener('resize', updateParallaxTarget, {passive:true});
    window.addEventListener('resize', updateVenueVisibility, {passive:true});
    desktopMotion.addEventListener('change', updateParallaxTarget);
    reducedMotion.addEventListener('change', initMotionLab);
  }
}

export function enterMotionHome() {
  if (introShown || reducedMotion.matches || window.scrollY > 40 ||
      location.hash || location.pathname !== '/' || document.body.dataset.page !== 'home') return;
  const hero = document.querySelector('.hero');
  if (!hero) return;
  introShown = true;
  // Animate the intact word, not individual glyphs. This preserves kerning and layout.
  hero.classList.add('lab-intro');
}
