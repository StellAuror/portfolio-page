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

  // Sit just left of the music control, whatever its width (language, playing state)
  const music = document.getElementById('musicToggle');
  const place = () => {
    // On mobile the music control scrolls away and the button sits above the bottom bar instead
    float.style.right = music && innerWidth > 1000
      ? `${innerWidth - music.getBoundingClientRect().left + 12}px`
      : '';
  };
  if (music) new ResizeObserver(place).observe(music);
  window.addEventListener('resize', place);

  // A hidden section has no box, so it reports as not intersecting too
  new IntersectionObserver(([entry]) => show(!entry.isIntersecting), { threshold: 0 }).observe(inline);
})();
