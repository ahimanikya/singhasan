import {normalized,subtract} from './poem-marks.mjs?v=2';
import {bookURL,legacyAnchor,readerEffects} from './reader-state.mjs?v=5';
const $=s=>document.querySelector(s),query=new URLSearchParams(location.search);
const pageData=JSON.parse($('#reading-data').textContent),pageVerse=$('#experience-verse');
const languageNames=Object.fromEntries(Object.entries(pageData.languages).map(([code,entry])=>[code,entry.name]));
const memory=new Map();
function readJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key))??memory.get(key)??fallback}catch{return memory.get(key)??fallback}}
function writeJSON(key,value){memory.set(key,value);try{localStorage.setItem(key,JSON.stringify(value));return true}catch{$('#page-saved-status').textContent='Device storage is unavailable; this change lasts for this visit.';return false}}
let library=[pageData],loaded=false;
async function loadLibrary(){if(loaded)return;try{const response=await fetch('assets/reading-book.json');if(!response.ok)throw Error();const data=await response.json();library=data.poems;loaded=true;migrateBookmarks()}catch{$('#book-search-status').textContent='The book list could not be loaded. Use Poems to choose a poem.'}}
function migrateBookmarks(){
 const old=readJSON('singhasan-quiet-bookmarks-v1',[]);if(!Array.isArray(old))return;let copied=true;
 for(const b of old){const p=library.find(p=>p.id===b.id&&p.variants[b.language]);if(!p||!Number.isInteger(b.unit))continue;
 const key=`singhasan-page-bookmarks-v1:${p.id}`,list=readJSON(key,[]);if(!Array.isArray(list)||list.some(x=>x.language===b.language&&x.line===legacyAnchor(b.unit).line&&(x.offset||0)===legacyAnchor(b.unit).offset))continue;
 copied=writeJSON(key,[...list,{id:p.id,language:b.language,...legacyAnchor(b.unit)}])&&copied;
 }
 // Remove only after each valid legacy bookmark is durably copied.
 if(copied&&old.every(b=>{const p=library.find(p=>p.id===b.id&&p.variants[b.language]);return !p||readJSON(`singhasan-page-bookmarks-v1:${p.id}`,[]).some(x=>x.language===b.language&&x.line===legacyAnchor(b.unit).line&&(x.offset||0)===legacyAnchor(b.unit).offset)}))writeJSON('singhasan-quiet-bookmarks-v1',[]);
}
function fillLibrary(){const select=$('#book-section'),term=$('#book-search').value.trim().toLocaleLowerCase();select.replaceChildren();
 for(const p of library){const v=p.variants[pageCode()]||p.variants[p.source_language];if(term&&!(v.title+' '+v.stanzas.flat().join(' ')).toLocaleLowerCase().includes(term))continue;const o=document.createElement('option');o.value=p.route;o.textContent=p.id?`Poem ${p.id} · ${v.stanzas.flat().find(t=>t.trim())||v.title}`:v.title;select.append(o)}
 if(!term)select.value=pageData.route;$('#book-read-section').disabled=!select.options.length;$('#book-search-status').textContent=loaded?`${select.options.length} section${select.options.length===1?'':'s'}.`:'';
}
$('#book-search').addEventListener('input',fillLibrary);
$('#book-size').onchange=e=>document.querySelector(`[data-size="${e.target.value}"]`)?.click();
$('#book-language').onchange=e=>{const note=$('#reader-language-note');if(note)note.hidden=true;$(`[data-reading-language="${e.target.value===pageData.source_language?'original':e.target.value}"]`)?.click();fillLibrary()};

$('#book-read-section').onclick=()=>{
 const route=$('#book-section').value;if(!route)return;
 if(document.body.classList.contains('full-page-reader'))location.href=bookURL(route,{quiet:document.body.classList.contains('quiet-mode'),language:pageCode()});
 else location.href=route+(pageCode()==='or'?'':'?lang='+encodeURIComponent(pageCode()));
};
// A language selector is useful only when this text has another edition.
$('#book-language').closest('label').hidden=!pageVerse||$('#book-language').options.length<2;
// One reader menu brings language, size and saved passages together.
const savedPanel=$('#page-bookmarks'),savedButton=$('#page-bookmarks-button'),pageBookKey=`singhasan-page-bookmarks-v1:${pageData.id}`;
let pageScrollTimer;
function pageCode(){return pageVerse?.lang||pageData.source_language}
function pageBooks(){const raw=readJSON(pageBookKey,[]);return Array.isArray(raw)?raw.filter(b=>b.id===pageData.id&&pageData.variants[b.language]&&Number.isInteger(b.line)&&b.line>=0&&b.line<pageData.variants[b.language].stanzas.flat().length):[]}
function pageMarks(code){const raw=readJSON(`singhasan-poem-marks-v1:${pageData.id}:${code}`,[]);return normalized(Array.isArray(raw)?raw:[],pageData.variants[code].stanzas.flat(),code)}
function currentPageLine(){if((document.body.classList.contains('pagination-on')||document.body.classList.contains('intro-paginated')))return Number(pageVerse.dataset.pageLine||0);const lines=[...pageVerse.querySelectorAll('[data-line]')];const visible=lines.find(n=>{const r=n.getBoundingClientRect();return r.bottom>100&&r.top<innerHeight*.8});return Number((visible||lines[0])?.dataset.line||0)}
function currentBookmark(){
 if(!pageVerse)return;
 const kind=document.querySelector('.printed-spread')?.dataset.leafKind;if(kind==='art'||kind==='story')return;
 return pageBooks().find(b=>{
  if(b.language!==pageCode())return false;
  if(!(document.body.classList.contains('pagination-on')||document.body.classList.contains('intro-paginated')))return b.line===currentPageLine();
  const line=pageVerse.querySelector(`[data-line="${b.line}"] .line-words`);if(!line)return false;
  const walker=document.createTreeWalker(line,NodeFilter.SHOW_TEXT);let node,offset=b.offset||0;
  while(node=walker.nextNode()){if(offset<node.length){const range=document.createRange();range.setStart(node,offset);range.setEnd(node,offset+1);const r=range.getBoundingClientRect(),bounds=$('#reading-panel').getBoundingClientRect();return r.right>bounds.left+1&&r.left<bounds.right-1&&r.bottom>bounds.top&&r.top<bounds.bottom}offset-=node.length}return false;
 });
}
function refreshSavedButton(){const quick=$('#quick-bookmark');if(!pageVerse){quick.hidden=true;return}const active=!!currentBookmark(),label=active?'Remove page bookmark':'Bookmark this page';quick.setAttribute('aria-pressed',String(active));quick.setAttribute('aria-label',label);quick.title=label;quick.disabled=document.querySelector('.printed-spread')?.dataset.leafKind==='art'||document.querySelector('.printed-spread')?.dataset.leafKind==='story';$('#page-save-place').disabled=quick.disabled;
savedButton.classList.toggle('has-saved',pageBooks().length>0||Object.keys(pageData.variants).some(code=>pageMarks(code).length));}
function placePageMenu(){
 if(savedPanel.hidden)return;
 const anchor=savedButton.getBoundingClientRect(),height=savedPanel.getBoundingClientRect().height;
 savedPanel.style.left=Math.max(16,Math.min(anchor.left,innerWidth-savedPanel.offsetWidth-16))+'px';
 savedPanel.style.top=Math.max(16,Math.min(anchor.bottom+8,innerHeight-height-16))+'px';
}
window.addEventListener('resize',placePageMenu);
$('#page-saved-details').addEventListener('toggle',placePageMenu);
$('#mobile-nearby')?.addEventListener('toggle',placePageMenu);
new ResizeObserver(placePageMenu).observe(savedPanel);
function closeSavedPage(restore=false){savedPanel.hidden=true;savedButton.setAttribute('aria-expanded','false');if(restore)savedButton.focus({preventScroll:true})}
function jumpPage(code,line,offset=0){if(!pageVerse){location.href=bookURL(pageData.route,{quiet:document.body.classList.contains('quiet-mode'),language:code,line,offset});return}$(`[data-reading-language="${code===pageData.source_language?'original':code}"]`)?.click();closeSavedPage();const target=pageVerse.querySelector(`[data-line="${line}"]`);if(target){target.tabIndex=-1;if((document.body.classList.contains('pagination-on')||document.body.classList.contains('intro-paginated')))document.dispatchEvent(new CustomEvent('book-jump-line',{detail:{line,offset}}));else target.scrollIntoView({block:'center',behavior:'auto'});target.focus({preventScroll:true})}}
function renderPageSaved(){
 const list=$('#page-saved-list');list.replaceChildren();const current=currentBookmark();$('#page-save-place').textContent=current?'Remove page bookmark':'Bookmark this page';
 function row(label,detail,go,remove){const node=document.createElement('div'),button=document.createElement('button'),del=document.createElement('button');node.className='focus-saved-row';button.textContent=label;button.setAttribute('aria-label',label+' · '+detail);button.onclick=go;del.textContent='×';del.setAttribute('aria-label','Remove '+detail);del.onclick=()=>{remove();renderPageSaved();refreshSavedButton()};node.append(button,del);list.append(node)}
 for(const b of pageBooks())row('Bookmark · '+pageData.variants[b.language].stanzas.flat()[b.line].slice(b.offset||0,70),languageNames[b.language],()=>jumpPage(b.language,b.line,b.offset||0),()=>writeJSON(pageBookKey,pageBooks().filter(x=>!(x.language===b.language&&x.line===b.line&&(x.offset||0)===(b.offset||0)))));
 for(const [code,v] of Object.entries(pageData.variants))for(const m of pageMarks(code)){
  const quote=v.stanzas.flat()[m.line].slice(m.start,m.end),key=`singhasan-poem-marks-v1:${pageData.id}:${code}`;
  row(quote,languageNames[code]+' underlined passage',()=>jumpPage(code,m.line,m.start),()=>{writeJSON(key,subtract(pageMarks(code),[m]));document.dispatchEvent(new CustomEvent('poem-marks-changed'))});
 }
 for(const p of library.filter(p=>p.id!==pageData.id)){
 const key=`singhasan-page-bookmarks-v1:${p.id}`,saved=readJSON(key,[]);
 for(const b of Array.isArray(saved)?saved:[]){if(!p.variants[b.language])continue;row('Bookmark · '+p.variants[b.language].title,languageNames[b.language],()=>location.href=bookURL(p.route,{quiet:document.body.classList.contains('quiet-mode'),language:b.language,line:b.line,offset:b.offset}),()=>writeJSON(key,saved.filter(x=>x!==b)))}
 for(const [code,v] of Object.entries(p.variants)){const markKey=`singhasan-poem-marks-v1:${p.id}:${code}`,raw=readJSON(markKey,[]),marks=normalized(Array.isArray(raw)?raw:[],v.stanzas.flat(),code);for(const m of marks)row(v.stanzas.flat()[m.line].slice(m.start,m.end),v.title,()=>location.href=bookURL(p.route,{quiet:document.body.classList.contains('quiet-mode'),language:code,line:m.line,offset:m.start}),()=>writeJSON(markKey,subtract(marks,[m])))}
 }
 if(!list.childElementCount){const empty=document.createElement('p');empty.className='page-tools-tip';empty.textContent='Your reading place and underlined passages will appear here.';list.append(empty)}
}
savedButton.onclick=()=>{const open=savedPanel.hidden;savedPanel.hidden=!open;savedButton.setAttribute('aria-expanded',String(open));if(open){renderPageSaved();loadLibrary().then(()=>{renderPageSaved();fillLibrary()});placePageMenu();$('#page-bookmarks-close').focus({preventScroll:true})}};
$('#page-bookmarks-close').onclick=()=>closeSavedPage(true);
function toggleBookmark(){if(!pageVerse||$('#quick-bookmark').disabled)return;const saved=pageBooks(),entry=currentBookmark();writeJSON(pageBookKey,entry?saved.filter(b=>!(b.language===entry.language&&b.line===entry.line&&(b.offset||0)===(entry.offset||0))):saved.concat({id:pageData.id,language:pageCode(),line:currentPageLine(),offset:Number(pageVerse.dataset.pageOffset||0)}));renderPageSaved();refreshSavedButton();$('#page-saved-status').textContent=entry?'Bookmark removed.':'Page bookmarked.'}
$('#page-save-place').onclick=toggleBookmark;$('#quick-bookmark').onclick=toggleBookmark;

document.addEventListener('click',e=>{if(!savedPanel.hidden&&!savedPanel.contains(e.target)&&!savedButton.contains(e.target))closeSavedPage()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!savedPanel.hidden){e.preventDefault();e.stopPropagation();closeSavedPage(true)}});
document.addEventListener('poem-marks-changed',()=>{refreshSavedButton();if(!savedPanel.hidden)renderPageSaved()});
window.addEventListener('scroll',()=>{clearTimeout(pageScrollTimer);pageScrollTimer=setTimeout(refreshSavedButton,120)},{passive:true});
document.querySelectorAll('[data-reading-language]').forEach(tab=>tab.addEventListener('click',()=>{if(!savedPanel.hidden)renderPageSaved()}));
document.addEventListener('book-page-rendered',refreshSavedButton);
refreshSavedButton();


// Shared text preferences apply to ordinary poem pages and both book modes.
let textSize=readJSON('singhasan-reading-size-v1',null);
if(![24,28,32].includes(textSize)){const old=readJSON('singhasan-quiet-reader-v1:assets/reading-book.json',{});textSize=[28,32].includes(Number(old.size))?Number(old.size):24}
document.querySelector(`[data-size="${textSize}"]`)?.click();$('#book-size').value=String(textSize);
document.querySelectorAll('[data-size]').forEach(button=>button.addEventListener('click',()=>{writeJSON('singhasan-reading-size-v1',Number(button.dataset.size));$('#book-size').value=button.dataset.size}));
const effects=readJSON('singhasan-quiet-tools-v1',{}),reduced=matchMedia('(prefers-reduced-motion: reduce)');
function syncEffects(){const state=readerEffects(effects,reduced.matches,document.body.classList.contains('quiet-mode'));document.body.dataset.pageMotion=String(state.motion);document.body.dataset.pageSound=String(state.sound);$('#book-motion').checked=state.motion;$('#book-motion').disabled=reduced.matches;$('#book-sound').checked=effects.sound===true;$('#book-sound-test').hidden=effects.sound!==true;$('#book-effects-note').textContent=reduced.matches?'Paper turns are off to match your reduced-motion setting.':''}
for(const [id,key] of [['book-motion','motion'],['book-sound','sound']])$('#'+id).onchange=e=>{effects[key==='motion'?(document.body.classList.contains('quiet-mode')?'motionQuiet':'motionIllustrated'):key]=e.target.checked;writeJSON('singhasan-quiet-tools-v1',effects);syncEffects()};
reduced.addEventListener('change',syncEffects);document.addEventListener('book-mode-changed',syncEffects);syncEffects();
let audioContext;
async function rustle(){if(!effects.sound)return;try{const Context=window.AudioContext||window.webkitAudioContext;audioContext??=new Context();await audioContext.resume();if(audioContext.state!=='running')throw Error();const buffer=audioContext.createBuffer(1,Math.floor(audioContext.sampleRate*.22),audioContext.sampleRate),samples=buffer.getChannelData(0);let smooth=0;for(let i=0;i<samples.length;i++){smooth=.65*smooth+.35*(Math.random()*2-1);samples[i]=smooth}const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=1700;filter.Q.value=.55;const t=audioContext.currentTime;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.09,t+.04);gain.gain.exponentialRampToValueAtTime(.001,t+.21);source.connect(filter).connect(gain).connect(audioContext.destination);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()};source.start();$('#book-effects-note').textContent='Soft page sound is on.'}catch{$('#book-effects-note').textContent='Page sound is unavailable in this browser.'}}
document.addEventListener('book-page-turn',rustle);$('#book-sound-test').onclick=rustle;
const code=query.get('lang');if(code==='original'||pageData.variants[code])$(`[data-reading-language="${code===pageData.source_language?'original':code}"]`)?.click();
const languageNote=$('#reader-language-note');if(languageNote&&code&&code!=='original'&&languageNames[code]&&!pageData.variants[code]){languageNote.textContent=`${languageNames[code]} is not available for this section yet. Showing ${languageNames[pageData.source_language]}.`;languageNote.hidden=false}
$('#book-language').value=pageCode();refreshSavedButton();fillLibrary();
