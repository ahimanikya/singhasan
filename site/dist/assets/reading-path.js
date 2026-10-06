// Optional path navigation belongs to the poem page, outside the bound reader.
const panel = document.querySelector('[data-reading-path]');
const params = new URLSearchParams(location.search);
if (panel && params.get('path') === panel.dataset.readingPath) {
  panel.hidden = false;
  const update = language => {
    for (const link of panel.querySelectorAll('[data-path-link]')) {
      const url = new URL(link.getAttribute('href'), location.href);
      if (language && language !== 'or') url.searchParams.set('lang', language);
      else url.searchParams.delete('lang');
      link.setAttribute('href', url.pathname.split('/').pop() + url.search + url.hash);
    }
  };
  update(document.querySelector('#reading-panel')?.lang || params.get('lang'));
  document.addEventListener('reading-language-changed', event => update(event.detail.language));
}
// Keep the chosen language when returning to the overview and continuing again.
if (document.querySelector('.reading-path') && params.get('lang')) {
  for (const link of document.querySelectorAll('.reading-path a[href^="poem-"]')) {
    const url = new URL(link.getAttribute('href'), location.href);
    url.searchParams.set('lang', params.get('lang'));
    link.setAttribute('href', url.pathname.split('/').pop() + url.search + url.hash);
  }
}
