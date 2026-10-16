/**
 * Highlights the menu link of the section in view, drives the mobile menu and
 * turns the top bar opaque once the visitor has scrolled past the hero.
 */
export function setupNavigation({ sections, menu, toggle, topbar, hero }) {
  const links = new Map([...menu.querySelectorAll('a[href^="#"]')].map((link) => [link.getAttribute('href').slice(1), link]));
  let bounds = [];
  let current = -1;

  function measure() {
    bounds = sections.map((section) => ({ top: section.offsetTop }));
  }

  function update() {
    topbar.classList.toggle('is-solid', window.scrollY > hero.offsetHeight - topbar.offsetHeight);
    const center = window.scrollY + window.innerHeight / 2;
    let index = 0;
    while (index < bounds.length - 1 && center >= bounds[index + 1].top) index++;

    if (index !== current) {
      current = index;
      for (const [id, link] of links) {
        if (id === sections[index].id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
    }
  }

  function setMenuOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  }

  toggle.addEventListener('click', () => setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenuOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuOpen(false);
  });

  new ResizeObserver(() => {
    measure();
    update();
  }).observe(document.body);
  window.addEventListener('scroll', update, { passive: true });

  measure();
  update();
}

/** Fades blocks in once, the first time they enter the viewport. */
export function setupReveal(elements) {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  for (const element of elements) {
    // Siblings revealed together cascade in, one after the other.
    const siblings = [...element.parentElement.children].filter((child) => [...elements].includes(child));
    element.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(element), 5) * 90}ms`);
    element.classList.add('reveal');
    observer.observe(element);
  }
}
