(() => {
  const gallery = document.querySelector('.portrait-gallery');
  if (!gallery) return;
  const slides = [...gallery.querySelectorAll('.portrait-slide')];
  if (slides.length < 2) return;
  const controls = gallery.querySelector('.portrait-controls');
  const play = gallery.querySelector('[data-portrait-play]');
  const count = gallery.querySelector('.portrait-count');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let timer = null;
  function show(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    count.textContent = `${index + 1} of ${slides.length}`;
  }
  function stop() {
    clearInterval(timer);
    timer = null;
    play.textContent = 'Play slideshow';
    count.setAttribute('aria-live', 'polite');
  }
  controls.hidden = false;
  gallery.classList.add('is-slideshow');
  show(0);
  gallery.querySelector('[data-portrait-prev]').addEventListener('click', () => { stop(); show(index - 1); });
  gallery.querySelector('[data-portrait-next]').addEventListener('click', () => { stop(); show(index + 1); });
  play.addEventListener('click', () => {
    if (timer) { stop(); return; }
    count.setAttribute('aria-live', 'off');
    play.textContent = 'Pause slideshow';
    timer = setInterval(() => show(index + 1), 6000);
  });
  gallery.addEventListener('focusin', stop);
  gallery.addEventListener('pointerenter', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  reduced.addEventListener('change', stop);
  // Reading elsewhere on the page never leaves an unseen slideshow running.
  new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) stop();
  }).observe(gallery);
})();
