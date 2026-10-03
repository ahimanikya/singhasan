(() => {
  const tracks = JSON.parse(document.getElementById('audio-catalog').textContent);
  if (!tracks.length) return;
  const audio = document.getElementById('book-audio');
  const status = document.getElementById('audio-status');
  const previous = document.getElementById('audio-previous');
  const next = document.getElementById('audio-next');
  const speed = document.getElementById('audio-speed');
  const continuous = document.getElementById('audio-continuous');
  const buttons = [...document.querySelectorAll('[data-track]')];
  const key = 'singhasan-listening-place-v1';
  let index = 0, saved = {}, lastSave = 0, restoreTime = 0;
  try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
  function save() {
    try { localStorage.setItem(key, JSON.stringify({id: tracks[index].id, time: audio.currentTime, speed: speed.value, continuous: continuous.checked})); } catch {}
  }
  async function play() {
    try { await audio.play(); status.textContent = ''; }
    catch { status.textContent = 'Press play to continue listening.'; }
  }
  function select(n, autoplay = false, time = 0) {
    index = Math.max(0, Math.min(n, tracks.length - 1));
    const track = tracks[index];
    restoreTime = time;
    audio.src = track.src;
    audio.playbackRate = Number(speed.value);
    document.getElementById('audio-label').textContent = track.label;
    const title = document.getElementById('audio-title');
    title.textContent = track.title;
    title.lang = track.language || (track.poem ? 'or' : 'en');
    document.getElementById('audio-read').href = track.reading_route || (track.poem ? `poem-${track.poem}.html` : 'book.html');
    document.getElementById('audio-follow').href = `read-along.html?track=${encodeURIComponent(track.id)}`;
    document.getElementById('audio-read').textContent = track.id === 'introduction' ? 'Read ସିଂହଦ୍ଵାର' : (track.poem ? 'Read the poem' : track.id === 'closing' ? 'Back cover' : 'Open the book');
    const review = document.getElementById('audio-review-note');
    review.textContent = track.review_note || ''; review.hidden = !track.review_note;
    previous.disabled = index === 0;
    next.disabled = index === tracks.length - 1;
    buttons.forEach(button => {
      if (button.dataset.track === track.id) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    history.replaceState(null, '', `#${track.id}`);
    status.textContent = time > 0 ? 'Your listening place has been restored. Press play to continue.' : 'Press play to listen.';
    if (autoplay) play();
  }
  document.getElementById('audio-follow').addEventListener('click', event => {
    const link = event.currentTarget, url = new URL(link.href);
    url.searchParams.set('time', String(audio.currentTime));
    link.href = url.href;
    audio.pause();
  });
  audio.addEventListener('loadedmetadata', () => {
    if (restoreTime > 0 && Number.isFinite(audio.duration)) audio.currentTime = Math.min(restoreTime, Math.max(0, audio.duration - 1));
    restoreTime = 0;
    audio.playbackRate = Number(speed.value);
  });
  audio.addEventListener('timeupdate', () => { if (Date.now() - lastSave > 3000) { save(); lastSave = Date.now(); } });
  audio.addEventListener('pause', save);
  audio.addEventListener('play', () => { status.textContent = ''; });
  audio.addEventListener('ended', () => {
    if (continuous.checked && index < tracks.length - 1) select(index + 1, true);
    else { status.textContent = index === tracks.length - 1 ? 'You’ve reached the end of the available readings.' : 'This reading has ended.'; save(); }
  });
  audio.addEventListener('error', () => { status.textContent = 'This recording could not load. Check your connection and try this track again.'; });
  previous.addEventListener('click', () => select(index - 1, !audio.paused));
  next.addEventListener('click', () => select(index + 1, !audio.paused));
  buttons.forEach(button => button.addEventListener('click', () => select(tracks.findIndex(t => t.id === button.dataset.track), true)));
  speed.addEventListener('change', () => { audio.playbackRate = Number(speed.value); save(); });
  continuous.addEventListener('change', save);
  window.addEventListener('pagehide', save);
  window.addEventListener('hashchange', () => {
    const n = tracks.findIndex(track => track.id === location.hash.slice(1));
    if (n >= 0 && n !== index) select(n);
  });
  if ([...speed.options].some(option => option.value === saved.speed)) speed.value = saved.speed;
  if (typeof saved.continuous === 'boolean') continuous.checked = saved.continuous;
  const requested = location.hash.slice(1);
  const start = tracks.findIndex(track => track.id === (requested || saved.id));
  select(start < 0 ? 0 : start, false, (!requested || requested === saved.id) && Number.isFinite(saved.time) ? saved.time : 0);
})();
