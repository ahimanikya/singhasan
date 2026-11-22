/* Manual navigation keeps long captions readable and never starts media. */
(() => {
  const section = document.querySelector('.author-posts');
  const slides = section ? [...section.querySelectorAll('.posts-list > li')] : [];
  let show = () => {};
  if (section && slides.length) {
    const controls = section.querySelector('.author-post-controls');
    const previous = section.querySelector('[data-post-prev]');
    const next = section.querySelector('[data-post-next]');
    const count = section.querySelector('.author-post-count');
    const choose = section.querySelector('#author-post-select');
    if (controls && previous && next && count && choose) {
      let current = 0;
      slides.forEach((slide, index) => {
        const article = slide.querySelector('article');
        const heading = article.querySelector('h2');
        article.setAttribute('aria-roledescription', 'slide');
        article.setAttribute('aria-label', `${index + 1} of ${slides.length}`);
        // The article heading supplies its title; the enclosing list retains order.
        article.removeAttribute('aria-labelledby');
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = `${index + 1}. ${heading.textContent}`;
        option.lang = heading.lang;
        choose.append(option);
      });
      show = (index, announce = true) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, i) => {
          if (i !== current) slide.querySelectorAll('video').forEach(video => video.pause());
          slide.hidden = i !== current;
        });
        choose.value = String(current);
        if (!announce) count.setAttribute('aria-live', 'off');
        count.textContent = `Post ${current + 1} of ${slides.length}`;
        if (!announce) requestAnimationFrame(() => count.setAttribute('aria-live', 'polite'));
      };
      previous.addEventListener('click', () => show(current - 1));
      next.addEventListener('click', () => show(current + 1));
      choose.addEventListener('change', () => show(Number(choose.value)));
      section.setAttribute('aria-roledescription', 'carousel');
      show(0, false);
      controls.hidden = slides.length < 2;
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) section.querySelectorAll('video').forEach(video => video.pause());
    });
  }

  // Works on both pages, even when the author page has no social carousel.
  const revealHash = () => {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const archiveLink = document.querySelector('.author-page [data-poetry-archive-ids]');
    if (archiveLink && (id === 'poetry-archive' || archiveLink.dataset.poetryArchiveIds.split(' ').includes(id))) {
      const destination = new URL(archiveLink.href);
      destination.hash = id;
      location.replace(destination.href);
      return;
    }
    const target = id && document.getElementById(id);
    if (!target) return;
    const index = slides.findIndex(slide => slide.contains(target));
    if (index !== -1) show(index, false);
    let ancestor = target.parentElement;
    while (ancestor) {
      if (ancestor.tagName === 'DETAILS') ancestor.open = true;
      ancestor = ancestor.parentElement;
    }
    if (target.matches('.poetry-archive article')) {
      const poem = target.querySelector('details');
      if (poem) poem.open = true;
    }
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }));
  };
  window.addEventListener('hashchange', revealHash);
  revealHash();
})();
