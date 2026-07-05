let observer;

function getObserver() {
  if (observer || typeof window === 'undefined') return observer;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
  );

  return observer;
}

function parseDelay(value) {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') return value.delay ?? 0;
  return 0;
}

export const vScrollReveal = {
  mounted(el, binding) {
    el.classList.add('scroll-reveal');

    const delay = parseDelay(binding.value);
    if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`);

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible');
      return;
    }

    const obs = getObserver();
    if (!obs) {
      el.classList.add('is-visible');
      return;
    }

    obs.observe(el);
  },
  unmounted(el) {
    getObserver()?.unobserve(el);
  },
};
