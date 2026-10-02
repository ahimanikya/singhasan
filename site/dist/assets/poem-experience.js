import {normalized,subtract} from './poem-marks.mjs?v=2';
import {bookURL,legacyAnchor} from './reader-state.mjs?v=2';
const $=s=>document.querySelector(s),query=new URLSearchParams(location.search);
const pageData=JSON.parse($('#reading-data').textContent),pageVerse=$('#experience-verse');
const languageNames=Object.fromEntries(Object.entries(pageData.languages).map(([code,entry])=>[code,entry.name]));
const memory=new Map();
function readJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key))??memory.get(key)??fallback}catch{return memory.get(key)??fallback}}
function writeJSON(key,value){memory.set(key,value);try{localStorage.setItem(key,JSON.stringify(value));return true}catch{$('#page-saved-status').textContent='Device storage is unavailable; this change lasts for this visit.';return false}}
let library=[pageData],loaded=false;
async function loadLibrary(){if(loaded)return;try{const response=await fetch('assets/reading-book.json');if(!response.ok)throw Error();const data=await response.json();library=data.poems;loaded=true;migrateBookmarks()}catch{$('#book-search-status').textContent='The book list could not be loaded. Use Contents to choose a poem.'}}
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
$('#book-read-section').onclick=()=>{if($('#book-section').value)location.href=bookURL($('#book-section').value,{quiet:document.body.classList.contains('quiet-mode'),language:pageCode()})};
// One reader menu brings language, size and saved passages together.
const savedPanel=$('#page-bookmarks'),savedButton=$('#page-bookmarks-button'),pageBookKey=`singhasan-page-bookmarks-v1:${pageData.id}`;
let pageScrollTimer;
function pageCode(){return pageVerse?.lang||pageData.source_language}
function pageBooks(){const raw=readJSON(pageBookKey,[]);return Array.isArray(raw)?raw.filter(b=>b.id===pageData.id&&pageData.variants[b.language]&&Number.isInteger(b.line)&&b.line>=0&&b.line<pageData.variants[b.language].stanzas.flat().length):[]}
function pageMarks(code){const raw=readJSON(`singhasan-poem-marks-v1:${pageData.id}:${code}`,[]);return normalized(Array.isArray(raw)?raw:[],pageData.variants[code].stanzas.flat(),code)}
function currentPageLine(){if(document.body.classList.contains('pagination-on'))return Number(pageVerse.dataset.pageLine||0);const lines=[...pageVerse.querySelectorAll('[data-line]')];const visible=lines.find(n=>{const r=n.getBoundingClientRect();return r.bottom>100&&r.top<innerHeight*.8});return Number((visible||lines[0])?.dataset.line||0)}
function refreshSavedButton(){if(!pageVerse)return;savedButton.classList.toggle('has-saved',pageBooks().length>0||Object.keys(pageData.variants).some(code=>pageMarks(code).length));}
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
function jumpPage(code,line,offset=0){if(!pageVerse){location.href=bookURL(pageData.route,{quiet:document.body.classList.contains('quiet-mode'),language:code,line,offset});return}$(`[data-reading-language="${code===pageData.source_language?'original':code}"]`)?.click();closeSavedPage();const target=pageVerse.querySelector(`[data-line="${line}"]`);if(target){target.tabIndex=-1;if(document.body.classList.contains('pagination-on'))document.dispatchEvent(new CustomEvent('book-jump-line',{detail:{line,offset}}));else target.scrollIntoView({block:'center',behavior:'auto'});target.focus({preventScroll:true})}}
function renderPageSaved(){
 const list=$('#page-saved-list');list.replaceChildren();const current=pageBooks().find(b=>b.language===pageCode());$('#page-save-place').textContent=current?'Remove bookmark':pageData.id===0?'Bookmark the introduction':'Bookmark this poem';
 function row(label,detail,go,remove){const node=document.createElement('div'),button=document.createElement('button'),del=document.createElement('button');node.className='focus-saved-row';button.textContent=label;button.setAttribute('aria-label',label+' · '+detail);button.onclick=go;del.textContent='×';del.setAttribute('aria-label','Remove '+detail);del.onclick=()=>{remove();renderPageSaved();refreshSavedButton()};node.append(button,del);list.append(node)}
 for(const b of pageBooks())row('Continue reading · '+languageNames[b.language],pageData.variants[b.language].title,()=>jumpPage(b.language,b.line,b.offset||0),()=>writeJSON(pageBookKey,pageBooks().filter(x=>x.language!==b.language)));
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
savedButton.onclick=()=>{const open=savedPanel.hidden;savedPanel.hidden=!open;savedButton.setAttribute('aria-expanded',String(open));if(open){renderPageSaved();loadLibrary().then(()=>{renderPageSaved();fillLibrary()});placePageMenu();savedPanel.querySelector('[aria-selected="true"]')?.focus({preventScroll:true})}};
$('#page-bookmarks-close').onclick=()=>closeSavedPage(true);
$('#page-save-place').onclick=()=>{const code=pageCode(),saved=pageBooks(),exists=saved.some(b=>b.language===code);writeJSON(pageBookKey,exists?saved.filter(b=>b.language!==code):saved.concat({id:pageData.id,language:code,line:currentPageLine(),offset:Number(pageVerse.dataset.pageOffset||0)}));renderPageSaved();refreshSavedButton();$('#page-saved-status').textContent=exists?'Bookmark removed.':'Bookmarked. Your reading place will follow as you read.'};
document.addEventListener('click',e=>{if(!savedPanel.hidden&&!savedPanel.contains(e.target)&&!savedButton.contains(e.target))closeSavedPage()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!savedPanel.hidden){e.preventDefault();e.stopPropagation();closeSavedPage(true)}});
document.addEventListener('poem-marks-changed',()=>{refreshSavedButton();if(!savedPanel.hidden)renderPageSaved()});
window.addEventListener('scroll',()=>{clearTimeout(pageScrollTimer);pageScrollTimer=setTimeout(()=>{if(!pageVerse||document.body.classList.contains('pagination-on')||!savedPanel.hidden)return;const bounds=pageVerse.getBoundingClientRect();if(bounds.bottom<=100||bounds.top>=innerHeight*.8)return;const saved=pageBooks(),entry=saved.find(b=>b.language===pageCode());if(entry){entry.line=currentPageLine();writeJSON(pageBookKey,saved)}},180)},{passive:true});
document.querySelectorAll('[data-reading-language]').forEach(tab=>tab.addEventListener('click',()=>{if(!savedPanel.hidden)renderPageSaved()}));
document.addEventListener('book-page-turn',event=>{const saved=pageBooks(),entry=saved.find(b=>b.language===pageCode());if(entry){entry.line=event.detail.line;entry.offset=event.detail.offset;writeJSON(pageBookKey,saved)}});
refreshSavedButton();


// Shared text preferences apply to ordinary poem pages and both book modes.
let textSize=readJSON('singhasan-reading-size-v1',null);
if(![24,28,32].includes(textSize)){const old=readJSON('singhasan-quiet-reader-v1:assets/reading-book.json',{});textSize=[28,32].includes(Number(old.size))?Number(old.size):24}
document.querySelector(`[data-size="${textSize}"]`)?.click();
document.querySelectorAll('[data-size]').forEach(button=>button.addEventListener('click',()=>writeJSON('singhasan-reading-size-v1',Number(button.dataset.size))));
const effects=readJSON('singhasan-quiet-tools-v1',{}),reduced=matchMedia('(prefers-reduced-motion: reduce)');
function syncEffects(){document.body.dataset.pageMotion=String(effects.motion!==false&&!reduced.matches);document.body.dataset.pageSound=String(effects.sound===true);$('#book-motion').checked=effects.motion!==false&&!reduced.matches;$('#book-motion').disabled=reduced.matches;$('#book-sound').checked=effects.sound===true}
for(const [id,key] of [['book-motion','motion'],['book-sound','sound']])$('#'+id).onchange=e=>{effects[key]=e.target.checked;writeJSON('singhasan-quiet-tools-v1',effects);syncEffects()};
reduced.addEventListener('change',syncEffects);syncEffects();
let audioContext;
document.addEventListener('book-page-turn',()=>{if(!effects.sound)return;try{const Context=window.AudioContext||window.webkitAudioContext;audioContext??=new Context();audioContext.resume();const buffer=audioContext.createBuffer(1,Math.floor(audioContext.sampleRate*.22),audioContext.sampleRate),samples=buffer.getChannelData(0);let smooth=0;for(let i=0;i<samples.length;i++){smooth=.65*smooth+.35*(Math.random()*2-1);samples[i]=smooth}const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=1700;filter.Q.value=.55;const t=audioContext.currentTime;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.09,t+.04);gain.gain.exponentialRampToValueAtTime(.001,t+.21);source.connect(filter).connect(gain).connect(audioContext.destination);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()};source.start()}catch{$('#page-saved-status').textContent='Page sound is unavailable in this browser.'}});
const code=query.get('lang');if(code==='original'||pageData.variants[code])$(`[data-reading-language="${code===pageData.source_language?'original':code}"]`)?.click();
refreshSavedButton();fillLibrary();
