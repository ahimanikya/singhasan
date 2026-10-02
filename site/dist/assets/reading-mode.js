/* One book reader. Old quiet links resolve to its text-only setting. */
(()=>{
 const query=new URLSearchParams(location.search),cover=/\/(book|back-cover)\.html$/.test(location.pathname);
 const bookMode=query.get('view')==='book'||query.has('page')||query.get('leaf')==='last'||query.get('focus')==='1'||query.get('quiet')==='1';
 let saved=false;try{saved=localStorage.getItem('singhasan-book-quiet-v1')==='true'}catch{}
 const quiet=query.has('quiet')?query.get('quiet')==='1':query.get('focus')==='1'||saved;
 if(bookMode&&!cover){document.body.classList.remove('standalone-page');document.body.classList.add('illustrated-mode')}
 if((bookMode||cover)&&(query.has('quiet')||query.get('focus')==='1')){try{localStorage.setItem('singhasan-book-quiet-v1',String(quiet))}catch{}}
 if((bookMode||cover)&&quiet)document.body.classList.add('quiet-mode');
 const fullReader=cover||(bookMode&&/\/(intro|poem-\d+)\.html$/.test(location.pathname));
 if(fullReader)document.body.classList.add('full-page-reader');
 if(window.self!==window.top)document.body.classList.add('embedded-reader');
 function refresh(){
  const on=document.body.classList.contains('quiet-mode');
  for(const button of document.querySelectorAll('[data-quiet-toggle]')){button.querySelector('span').textContent=on?'Show illustrations':'Read quietly';if(bookMode||cover)button.setAttribute('aria-pressed',String(on))}
  if(bookMode||cover)for(const link of document.querySelectorAll('.page-nav a,.book-index a,a[href*="contents.html"],.book-cover-route a')){
   const url=new URL(link.href);if(/\/(intro|poem-\d+|contents|book|back-cover)\.html$/.test(url.pathname)){url.searchParams.set('view','book');url.searchParams.set('quiet',on?'1':'0');link.href=url.href}
  }
 }
 document.addEventListener('DOMContentLoaded',()=>{
  refresh();document.addEventListener('book-mode-changed',refresh);
  if(fullReader){
   const bar=document.createElement('header');bar.className='reader-topbar';bar.lang='en';
   const exit=document.createElement('a');exit.className='exit-reader';exit.href=cover?'index.html':location.pathname;exit.textContent='← Exit reader';
   const code=query.get('lang');if(!cover&&code)exit.href+='?lang='+encodeURIComponent(code);
   if(window.self!==window.top)exit.target='_top';bar.append(exit);const actions=document.querySelector('.poem-actions');if(actions)bar.append(actions);
   else {const toggle=document.querySelector('[data-quiet-toggle]');if(toggle)bar.append(toggle)}
   document.querySelector('#reading').before(bar);
   document.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||event.defaultPrevented||document.querySelector('dialog[open]')||document.querySelector('#page-bookmarks:not([hidden]),#selection-tools:not([hidden])'))return;
    event.preventDefault();exit.click();
   });
  }
  for(const button of document.querySelectorAll('[data-quiet-toggle]'))button.addEventListener('click',()=>{
   if(bookMode&&!cover&&document.querySelector('.printed-spread')){document.dispatchEvent(new CustomEvent('book-set-quiet',{detail:!document.body.classList.contains('quiet-mode')}));return}
   if(cover){const on=!document.body.classList.contains('quiet-mode');document.body.classList.toggle('quiet-mode',on);try{localStorage.setItem('singhasan-book-quiet-v1',String(on))}catch{}const url=new URL(location.href);url.searchParams.set('quiet',on?'1':'0');history.replaceState(null,'',url);refresh();document.dispatchEvent(new Event('book-mode-changed'));return}
   const url=new URL(document.body.classList.contains('contents-page')?'book.html':location.pathname,location.href);url.searchParams.set('view','book');url.searchParams.set('quiet','1');const verse=document.querySelector('#experience-verse');if(verse){url.searchParams.set('lang',verse.lang);const line=[...verse.querySelectorAll('[data-line]')].find(el=>el.getBoundingClientRect().bottom>100);if(line)url.searchParams.set('line',line.dataset.line)}location.href=url.href;
  });
  if(document.body.classList.contains('standalone-page')){
   const panel=document.querySelector('.book-glance'),companion=document.querySelector('.book-companion'),toolkit=document.querySelector('#page-bookmarks'),wide=matchMedia('(min-width:761px)');
   if(panel&&companion&&toolkit){const placePanel=()=>{const focused=document.activeElement,keepFocus=panel.contains(focused);(wide.matches?companion:toolkit).append(panel);if(keepFocus)focused.focus({preventScroll:true})};placePanel();wide.addEventListener('change',placePanel)}
  }
  for(const link of document.querySelectorAll('.read-in-book'))link.addEventListener('click',()=>{const url=new URL(link.href),code=document.querySelector('#experience-verse')?.lang;try{const place=JSON.parse(localStorage.getItem('singhasan-book-place-v1'));if(place?.route===url.pathname.split('/').pop()&&place.language===code){url.searchParams.set('line',place.line);url.searchParams.set('offset',place.offset||0)}}catch{}if(code&&code!=='or')url.searchParams.set('lang',code);else url.searchParams.delete('lang');link.href=url.href});
  for(const link of document.querySelectorAll('.reader-listen'))link.addEventListener('click',()=>{
   const url=new URL(link.href),verse=document.querySelector('#experience-verse');url.searchParams.set('quiet',document.body.classList.contains('quiet-mode')?'1':'0');
   if(document.body.classList.contains('pagination-on')&&verse&&document.querySelector('.printed-spread')?.dataset.leafKind==='text'){url.searchParams.set('line',verse.dataset.pageLine||0);url.searchParams.set('offset',verse.dataset.pageOffset||0)}link.href=url.href;
  });
  // A single continue link works from either entry, without hiding the front cover.
  if(document.body.classList.contains('home-page')||/\/book\.html$/.test(location.pathname)){
   try{let place=JSON.parse(localStorage.getItem('singhasan-book-place-v1'));if(!place){const old=JSON.parse(localStorage.getItem('singhasan-quiet-reader-v1:assets/reading-book.json'));if(Number.isInteger(old?.id)&&old.id>=0&&old.id<=68)place={route:old.id?`poem-${old.id}.html`:'intro.html',line:Math.max(0,Math.floor(old.unit/1000000)),offset:Math.max(0,old.unit)%1000000,language:old.language,quiet:true}}
   if(place&&/^(intro|poem-([1-9]|[1-5][0-9]|6[0-8]))\.html$/.test(place.route)){const q=new URLSearchParams({view:'book',quiet:place.quiet?'1':'0',line:Math.max(0,Number(place.line)||0),offset:Math.max(0,Number(place.offset)||0)});if(/^[a-z]{2,3}$/.test(place.language))q.set('lang',place.language);const a=document.createElement('a');a.href=place.route+'?'+q;a.textContent='Continue reading';a.className='continue-reading';(document.querySelector('.home-reading-links')||document.querySelector('.book-cover-route')).append(a)}}catch{}
  }
 });
})();
