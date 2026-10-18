// Reveal a cited source even when its enclosing source list is collapsed.
(() => {
  function revealReference() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
    }
    const preview = target.querySelector('.lit-link-preview');
    if (preview) preview.open = true;
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }
  // Keep source previews usable without loading third-party players on page entry.
  document.querySelectorAll('.lit-video').forEach(container => {
    const poster = container.querySelector('.lit-video-poster');
    if (!poster || !/^[A-Za-z0-9_-]{11}$/.test(container.dataset.video)) return;
    const play = document.createElement('button');
    play.type = 'button';
    play.className = poster.className;
    play.setAttribute('aria-label', poster.getAttribute('aria-label'));
    play.append(...poster.childNodes);
    poster.replaceWith(play);
    play.querySelector('.lit-video-label').textContent = 'Play here · YouTube';
    play.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${container.dataset.video}?autoplay=1&playsinline=1&rel=0`;
      iframe.title = container.dataset.title;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      container.replaceChildren(iframe);
      iframe.focus();
    });
  });
  window.addEventListener('hashchange', revealReference);
  if (location.hash) revealReference();
})();
