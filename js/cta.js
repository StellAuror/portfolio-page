// "Let's talk": the pinned copy shows whenever the inline button on Home is out of view
(() => {
  const inline = document.getElementById('ctaInline');
  const float = document.getElementById('ctaFloat');
  if (!inline || !float) return;

  const show = (visible) => {
    float.classList.toggle('visible', visible);
    float.setAttribute('aria-hidden', String(!visible));
    float.tabIndex = visible ? 0 : -1;
  };

  // A hidden section has no box, so it reports as not intersecting too
  new IntersectionObserver(([entry]) => show(!entry.isIntersecting), { threshold: 0 }).observe(inline);
})();
