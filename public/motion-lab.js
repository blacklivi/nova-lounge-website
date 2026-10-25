// NOVA editorial motion experiment.
// No data writes, tracking, third-party libraries or changes to the production Worker.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopMotion = window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
let observer = null;
let listenersInstalled = false;
let scrollFrame = 0;
let introShown = false;

function updatePhotoDrift() {
  scrollFrame = 0;
  const photo = document.querySelector('.hero-photo');
  if (!photo) return;
  if (reducedMotion.matches || !desktopMotion.matches) {
    photo.style.removeProperty('--lab-drift');
    return;
  }
  const distance = Math.max(0, Math.min(26, window.scrollY * 0.075));
  photo.style.setProperty('--lab-drift', distance.toFixed(1) + 'px');
}

function schedulePhotoDrift() {
  if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updatePhotoDrift);
}

function observeEditorialSections() {
  if (observer) observer.disconnect();
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
  observer = new IntersectionObserver((entries, activeObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('lab-visible');
      activeObserver.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -5% 0px', threshold: 0.08 });

  const selectors = [
    '.venues-heading', '.venue-card', '.story-copy', '.story-photo',
    '.home-events .section-link', '.home-events .event-card',
    '.book-strip .book-image', '.book-strip .book-main',
    '.events-intro', '.events-section',
    '.detail-copy', '.detail-image', '.detail-bottom > div'
  ].join(',');
  const elements = [...document.querySelectorAll(selectors)];
  elements.forEach((element, index) => {
    const rect = element.getBoundingClientRect();
    // Never hide a section that is already visible or above the viewport.
    if (rect.top < window.innerHeight * 0.83) {
      element.classList.add('lab-visible');
      return;
    }
    element.classList.add('lab-reveal');
    if (element.classList.contains('venue-card')) {
      element.style.setProperty('--lab-order', String(index % 3));
    }
    observer.observe(element);
  });
}

export function initMotionLab() {
  if (reducedMotion.matches) {
    document.documentElement.classList.remove('motion-lab');
    if (observer) observer.disconnect();
    return;
  }
  document.documentElement.classList.add('motion-lab');
  observeEditorialSections();
  schedulePhotoDrift();

  if (!listenersInstalled) {
    listenersInstalled = true;
    window.addEventListener('scroll', schedulePhotoDrift, { passive: true });
    window.addEventListener('resize', schedulePhotoDrift, { passive: true });
    reducedMotion.addEventListener('change', () => {
      initMotionLab();
      if (reducedMotion.matches) document.querySelectorAll('.lab-reveal').forEach(el => el.classList.add('lab-visible'));
    });
  }
}

export function enterMotionHome() {
  if (introShown || reducedMotion.matches || window.scrollY > 40 || location.hash ||
      location.pathname !== '/' || document.body.dataset.page !== 'home') return;
  const hero = document.querySelector('.hero');
  const headline = hero?.querySelector('h1');
  if (!headline) return;
  introShown = true;
  headline.setAttribute('aria-label', 'NOVA');
  headline.innerHTML = [...'NOVA'].map((letter, index) =>
    '<span class="lab-letter" aria-hidden="true" style="--letter-index:' + index + '">' + letter + '</span>'
  ).join('');
  hero.classList.add('lab-intro');
}
