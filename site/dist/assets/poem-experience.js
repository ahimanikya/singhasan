import {packReadingPages} from './reader-pagination.mjs';
import {normalized,subtract} from './poem-marks.mjs?v=2';
(()=>{
'use strict';
const $=s=>document.querySelector(s),query=new URLSearchParams(location.search);
const pageData=JSON.parse($('#reading-data').textContent),pageVerse=$('#experience-verse');
const dataset=JSON.parse($('#focus-edition-data').textContent),poems=[pageData];
const dialog=$('#focus-reader'),area=$('#focus-pages'),settings=$('#focus-settings');
const previous=$('#focus-prev'),next=$('#focus-next'),progress=$('#focus-progress');
let poemIndex=0,language='or',pageIndex=0,pages=[],units=[],spread=1,returnFocus,returnScroll=0,opening=false,editionLoaded=false;
const savedKey='singhasan-quiet-reader-v1:'+(dataset.url||pageData.id);
const languageNames=Object.fromEntries(Object.entries(pageData.languages).map(([code,entry])=>[code,entry.name]));

function chosen(p=poems[poemIndex]){return p.variants[language]?language:p.source_language}
function fillLanguages(){
 const select=$('#focus-language'),codes=[...new Set(poems.flatMap(p=>Object.keys(p.variants)))];
 select.replaceChildren(...codes.map(code=>{const option=document.createElement('option');option.value=code;option.textContent=languageNames[code]||code;return option}));
 if(!codes.includes(language))language=pageData.source_language;select.value=language;
}
function fillContents(){
 const select=$('#focus-poem');select.replaceChildren();
 function option(value,label){const el=document.createElement('option');el.value=value;el.textContent=label;select.append(el)}
 const term=($('#focus-search')?.value||'').trim().toLocaleLowerCase();
 if(!term)option('front','Title page');
 poems.forEach((p,i)=>{const v=p.variants[chosen(p)];if(!term||(v.title+' '+v.stanzas.flat().join(' ')).toLocaleLowerCase().includes(term))option(String(i),p.id?`Poem ${p.id} · ${v.stanzas.flat().find(line=>line.trim())||v.title}`:v.title)});
 if(!term)option('back','End of the book');
 $('#focus-read-section').disabled=!select.options.length;
 $('#focus-search-status').textContent=term?(select.options.length?`${select.options.length} matching section${select.options.length===1?'':'s'}.`:'No sections match. Try another word.'):'The introduction and all 68 poems.';

}
async function loadEdition(){
 if(editionLoaded)return true;
 try{const response=await fetch(dataset.url);if(!response.ok)throw Error();const edition=await response.json();
 if(!Array.isArray(edition.poems)||edition.poems.some(p=>!p.variants?.[p.source_language]))throw Error();
 poems.splice(0,poems.length,...edition.poems);editionLoaded=true;fillLanguages();fillContents();return true;
 }catch{return false}
}
function unitNode(unit,plain=false){
 const p=poems.find(p=>p.id===unit.poemId),v=p.variants[unit.code];
 if(unit.type==='title'){
 const group=document.createElement('div'),title=document.createElement('h2');
 group.className='focus-title'+(unit.poemIndex>0?' after-poem':'');group.lang=unit.code;group.dataset.poemId=unit.poemId;
 title.className='focus-poem-title';title.textContent=v.title;group.append(title);return group;
 }
 const line=document.createElement('div');line.className='focus-line'+(unit.stanza?' stanza-start':'');line.lang=unit.code;line.dataset.unit=unit.index;line.dataset.poemId=unit.poemId;line.dataset.sourceLine=unit.sourceLine;line.dataset.start=unit.start;
 let cursor=0;for(const m of plain?[]:readMarks(unit.poemId,unit.code).filter(m=>m.line===unit.sourceLine)){
 const a=Math.max(0,m.start-unit.start),b=Math.min(unit.text.length,m.end-unit.start);if(b<=a)continue;
 line.append(document.createTextNode(unit.text.slice(cursor,a)));const mark=document.createElement('span');mark.className='focus-pencil';mark.textContent=unit.text.slice(a,b);line.append(mark);cursor=b;
 }line.append(document.createTextNode(unit.text.slice(cursor)));return line;
}
function visibleCount(){return pages[pageIndex]?.cover?1:Math.min(spread,pages.length-1-pageIndex)}
function currentUnit(){const u=pages[pageIndex]?.[0];return u?{id:u.poemId,code:u.code,unit:u.index}:{cover:pages[pageIndex]?.cover||'front'}}
function save(){const anchor=currentUnit();try{localStorage.setItem(savedKey,JSON.stringify({...anchor,language,size:$('#focus-size').value}))}catch{}}
function pageFor(anchor){
 if(anchor?.cover)return anchor.cover==='back'?pages.length-1:0;
 const found=pages.findIndex(pg=>!pg.cover&&pg.some(u=>u.poemId===anchor?.id&&(u.index===anchor.unit||(u.type==='line'&&anchor.unit>=u.index&&anchor.unit<u.index+u.text.length))));
 return found<0?0:1+Math.floor((found-1)/spread)*spread;
}
function setReadingSize(){const size=$('#focus-size').value;dialog.style.setProperty('--focus-size',(size==='22'?(matchMedia('(min-width:761px)').matches?24:22):size)+'px')}
function paginate(anchor=currentUnit()){
 if(!dialog.open)return;setReadingSize();clearSelection();fillLanguages();fillContents();
 spread=matchMedia('(min-width:1000px) and (min-height:500px)').matches?2:1;
 area.classList.remove('has-cover');dialog.querySelector('.focus-book-frame').classList.remove('closed-book','back-facing');
 area.replaceChildren();for(let i=0;i<spread;i++){const slot=document.createElement('article');slot.className='focus-page';area.append(slot)}
 const slot=area.firstElementChild,style=getComputedStyle(slot),width=slot.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),height=slot.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
 const measure=document.createElement('article');measure.className='focus-page focus-measure';measure.style.width=width+'px';measure.style.padding='0';dialog.append(measure);
 units=[];
 for(const [poemIndex,p] of poems.entries()){const code=chosen(p),v=p.variants[code];units.push({type:'title',index:-1,poemId:p.id,poemIndex,code});let sourceLine=-1;
 for(const [si,stanza] of v.stanzas.entries())for(const [li,text] of stanza.entries()){
 sourceLine++;if(text.trim()==='∎'||(v.hidden_lines||[]).includes(sourceLine))continue;
 let remaining=text,start=0,first=true;const lineLimit=p.kind==='prose'?parseFloat(getComputedStyle(measure).fontSize)*1.8:height;
 while(remaining){const unit={type:'line',index:sourceLine*1000000+start,poemId:p.id,poemIndex,code,sourceLine,start,text:remaining,stanza:first&&si>0&&li===0};measure.replaceChildren(unitNode(unit,true));
 if(measure.scrollHeight<=lineLimit+1){units.push(unit);break}
 const ends=Array.from(new Intl.Segmenter(code,{granularity:'grapheme'}).segment(remaining),x=>x.index+x.segment.length);let low=1,high=ends.length,best=1;
 while(low<=high){const mid=Math.floor((low+high)/2);measure.replaceChildren(unitNode({...unit,text:remaining.slice(0,ends[mid-1])},true));if(measure.scrollHeight<=lineLimit+1){best=mid;low=mid+1}else high=mid-1}
 let end=ends[best-1],space=remaining.lastIndexOf(' ',end-1);if(space>0&&space>end*.7)end=space+1;
 units.push({...unit,text:remaining.slice(0,end)});remaining=remaining.slice(end);start+=end;first=false;
 }
 }
 }
 // Import the shared three-line opening rule, retaining this book's title/end leaves.
 const packed=packReadingPages(units,candidate=>{measure.replaceChildren(...candidate.map(u=>unitNode(u,true)));return measure.scrollHeight<=height+1});
 pages=[{cover:'front'},...packed,{cover:'back'}];measure.remove();pageIndex=pageFor(anchor);render();
}
function render(){
 cancelPaperTurn();const cover=pages[pageIndex]?.cover;area.replaceChildren();area.classList.toggle('has-cover',!!cover);dialog.querySelector('.focus-book-frame').classList.toggle('closed-book',!!cover);dialog.querySelector('.focus-book-frame').classList.toggle('back-facing',cover==='back');
 if(cover){const figure=document.createElement('figure');figure.className='focus-cover';figure.classList.add('quiet-title-leaf');const text=document.createElement('div');text.className='quiet-title-copy';text.innerHTML=cover==='front'?'<p class="quiet-edition-label" lang="en">Odia poetry</p><h1 lang="or">ସିଂହାସନ</h1>':'<p class="quiet-edition-label" lang="en">The end</p><h1 lang="or">ସମାପ୍ତ</h1><p class="quiet-title-author" lang="or">ସିଂହାସନ</p>';figure.append(text);area.append(figure);$('#focus-poem').value=cover;progress.textContent=cover==='front'?'Title page':'End of the book'}
 else{
 for(let i=0;i<visibleCount();i++){const pg=pages[pageIndex+i],slot=document.createElement('article');slot.className='focus-page';slot.setAttribute('aria-label',`Page ${pageIndex+i} of ${pages.length-2}`);slot.lang=pg[0].code;pg.forEach(u=>slot.append(unitNode(u)));area.append(slot)}
 const first=pages[pageIndex][0];poemIndex=Math.max(0,poems.findIndex(p=>p.id===first.poemId));$('#focus-poem').value=String(poemIndex);
 const end=pageIndex+visibleCount()-1;progress.textContent=`${pageIndex}${end>pageIndex?'–'+end:''}`;
 }
 previous.disabled=pageIndex===0;next.disabled=pageIndex===pages.length-1;previous.textContent='←';next.textContent='→';previous.setAttribute('aria-label','Previous page');next.setAttribute('aria-label','Next page');updateBookmark();
 area.dataset.page=pageIndex;area.dataset.pageCount=pages.length;area.dataset.poemId=cover||pages[pageIndex][0].poemId;area.dataset.lineCount=units.filter(u=>u.type==='line').length;
}
function turn(direction){
 if((direction<0&&previous.disabled)||(direction>0&&next.disabled))return;
 const paper=!pages[pageIndex]?.cover&&effects.motion&&!reduced.matches?capturePaper():null;clearSelection();
 if(direction>0)pageIndex+=visibleCount();else if(pageIndex===pages.length-1)pageIndex=1+Math.floor((pages.length-3)/spread)*spread;else pageIndex=Math.max(0,pageIndex-spread);
 render();save();if(!pages[pageIndex]?.cover)paperTurn(direction,paper);if(effects.sound)rustle();
}
function announcePoem(){$('#focus-announcement').textContent=pages[pageIndex]?.cover?(pages[pageIndex].cover==='front'?'Title page':'End of the book'):poems[poemIndex].variants[chosen()].title}
async function openReader(start='poem'){
 if(opening||dialog.open)return;opening=true;returnFocus=document.activeElement;returnScroll=scrollY;closeSavedPage();
 const entry=$('#open-focus');entry.setAttribute('aria-busy','true');const loaded=await loadEdition();entry.removeAttribute('aria-busy');
 language=document.querySelector('[data-reading-language][aria-selected=true]')?.dataset.readingLanguage||pageData.source_language;if(language==='original')language=pageData.source_language;
 try{const saved=JSON.parse(localStorage.getItem(savedKey));if(['22','28','32'].includes(saved?.size))$('#focus-size').value=saved.size;else if(saved?.size==='24')$('#focus-size').value='22';else if(saved?.size==='26')$('#focus-size').value='28';else if(saved?.size==='30')$('#focus-size').value='32'}catch{}
 const selectedSize=document.querySelector('[data-size][aria-pressed=true]')?.dataset.size;if(selectedSize&&selectedSize!=='24')$('#focus-size').value=selectedSize;setReadingSize();syncEffects();dialog.showModal();document.body.style.overflow='hidden';await document.fonts.ready;paginate(start==='cover'?{cover:'front'}:{id:pageData.id,unit:-1});area.focus();opening=false;
 $('#focus-load-note').hidden=loaded;$('#focus-load-note').textContent=loaded?'':'The complete book could not be loaded. Close and reopen to try again.';
}
function closeReader(){cancelPaperTurn();clearSelection();save();settings.hidden=true;$('#focus-settings-button').setAttribute('aria-expanded','false');dialog.close()}
$('#open-focus').addEventListener('click',()=>openReader(document.body.classList.contains('contents-page')?'cover':'poem'));$('#close-focus').addEventListener('click',closeReader);
dialog.addEventListener('close',()=>{cancelPaperTurn();save();document.body.style.overflow='';window.scrollTo(0,returnScroll);returnFocus?.focus({preventScroll:true})});
$('#focus-settings-button').addEventListener('click',()=>{settings.hidden=!settings.hidden;$('#focus-settings-button').setAttribute('aria-expanded',String(!settings.hidden));if(!settings.hidden){clearSelection();renderSaved();$('#focus-settings-close').focus()}});
$('#focus-settings-close').addEventListener('click',()=>dismissQuietSettings(true));
function dismissQuietSettings(restore=false){settings.hidden=true;$('#focus-settings-button').setAttribute('aria-expanded','false');if(restore)$('#focus-settings-button').focus({preventScroll:true})}
dialog.addEventListener('pointerdown',e=>{if(!settings.hidden&&!settings.contains(e.target)&&!$('#focus-settings-button').contains(e.target))dismissQuietSettings()});
dialog.addEventListener('cancel',e=>{if(!settings.hidden){e.preventDefault();dismissQuietSettings(true)}});
$('#focus-language').addEventListener('change',e=>{const anchor=currentUnit();language=e.target.value;paginate(anchor);save()});
$('#focus-size').addEventListener('change',()=>{const anchor=currentUnit();setReadingSize();paginate(anchor);save()});
$('#focus-read-section').addEventListener('click',()=>{const value=$('#focus-poem').value;if(!value)return;pageIndex=['front','back'].includes(value)?pageFor({cover:value}):pageFor({id:poems[Number(value)].id,unit:-1});dismissQuietSettings();render();save();area.focus();announcePoem()});
$('#focus-search').addEventListener('input',fillContents);
$('#focus-read-all').addEventListener('click',()=>{pageIndex=0;dismissQuietSettings();render();save();area.focus();announcePoem()});
previous.addEventListener('click',()=>turn(-1));next.addEventListener('click',()=>turn(1));
dialog.addEventListener('keydown',e=>{if(e.target.closest('select,input')||!settings.hidden)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='u'&&captureSelection().length){e.preventDefault();markSelection(false);return}if(e.shiftKey||!getSelection().isCollapsed)return;if(['ArrowRight','PageDown'].includes(e.key)){e.preventDefault();turn(1)}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();turn(-1)}});
let pointer=null;area.addEventListener('touchstart',e=>{if(e.touches.length===1)pointer={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});
area.addEventListener('touchend',e=>{if(!pointer||!getSelection().isCollapsed)return;const dx=e.changedTouches[0].clientX-pointer.x,dy=e.changedTouches[0].clientY-pointer.y;pointer=null;if(Math.abs(dx)>70&&Math.abs(dy)<40)turn(dx<0?1:-1)},{passive:true});
let lastWheel=0,wheelTotal=0,wheelTurned=false;area.addEventListener('wheel',e=>{if(!dialog.open||!settings.hidden||e.ctrlKey||e.metaKey||!getSelection().isCollapsed)return;const now=performance.now();if(now-lastWheel>220){wheelTotal=0;wheelTurned=false}lastWheel=now;if(Math.abs(e.deltaX)<Math.abs(e.deltaY)*1.35||Math.abs(e.deltaX)<1)return;e.preventDefault();if(wheelTurned)return;const delta=e.deltaX*(e.deltaMode===1?16:e.deltaMode===2?area.clientWidth:1);if(wheelTotal&&Math.sign(wheelTotal)!==Math.sign(delta))wheelTotal=0;wheelTotal+=delta;if(Math.abs(wheelTotal)>=65){wheelTurned=true;turn(wheelTotal>0?1:-1)}},{passive:false});
document.fonts.addEventListener('loadingdone',()=>{if(dialog.open)paginate(currentUnit())});
let resizeTimer;window.addEventListener('resize',()=>{cancelPaperTurn();clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>paginate(currentUnit()),150)});
// Device-local preferences and passages never modify publication text.
const prefKey='singhasan-quiet-tools-v1',bookKey='singhasan-quiet-bookmarks-v1';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const sessionMemory=new Map();
function readJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key))??sessionMemory.get(key)??fallback}catch{return sessionMemory.get(key)??fallback}}
function writeJSON(key,value){sessionMemory.set(key,value);try{localStorage.setItem(key,JSON.stringify(value));return true}catch{$('#focus-announcement').textContent=$('#page-saved-status').textContent='Device storage is unavailable; this change lasts for this visit.';return false}}
const storedEffects=readJSON(prefKey,{}),effects={motion:storedEffects.motion===true,sound:storedEffects.sound===true};
let audioContext,selectionCuts=[],selectionTimer,turnLayer=null,turnFrame=0;
const selectionTools=$('#focus-selection-tools');
function syncEffects(){
 $('#focus-motion').checked=effects.motion&&!reduced.matches;$('#focus-motion').disabled=reduced.matches;
 $('#focus-sound').checked=effects.sound;$('#focus-sound-test').hidden=!effects.sound;
 $('#focus-effects-note').textContent=reduced.matches?'Paper turns are off to match your reduced-motion setting.':'';
}
reduced.addEventListener('change',()=>{syncEffects();if(reduced.matches)cancelPaperTurn()});
$('#focus-motion').onchange=e=>{effects.motion=e.target.checked;if(!effects.motion)cancelPaperTurn();writeJSON(prefKey,effects);syncEffects()};
$('#focus-sound').onchange=e=>{effects.sound=e.target.checked;writeJSON(prefKey,effects);syncEffects();if(effects.sound)rustle()};
$('#focus-sound-test').onclick=()=>rustle();
// A temporary, inaccessible copy of the outgoing paper peels away over the
// newly rendered page. Real verse stays selectable and keeps its source offsets.
function cancelPaperTurn(){
 cancelAnimationFrame(turnFrame);turnFrame=0;turnLayer?.remove();turnLayer=null;
}
function capturePaper(){
 const box=area.getBoundingClientRect(),shell=dialog.querySelector('.focus-shell').getBoundingClientRect(),style=getComputedStyle(area);
 const copy=area.cloneNode(true);copy.removeAttribute('id');copy.removeAttribute('tabindex');copy.className='turn-snapshot';
 copy.querySelectorAll('[id],[data-unit],[data-source-line],[data-start]').forEach(e=>{e.removeAttribute('id');e.removeAttribute('data-unit');e.removeAttribute('data-source-line');e.removeAttribute('data-start')});
 Object.assign(copy.style,{display:'grid',gridTemplateColumns:style.gridTemplateColumns,gap:style.gap,padding:style.padding,width:box.width+'px',height:box.height+'px'});
 [...copy.children].forEach((node,i)=>{node.scrollTop=area.children[i].scrollTop});
 return {copy,width:box.width,height:box.height,left:box.left-shell.left,top:box.top-shell.top};
}
function paperTurn(direction,paper){
 if(!paper||!effects.motion||reduced.matches||!dialog.open)return;
 cancelPaperTurn();
 const {copy,width:w,height:h,left,top}=paper;
 const layer=document.createElement('div');layer.className='paper-turn-layer';layer.setAttribute('aria-hidden','true');layer.inert=true;
 Object.assign(layer.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px'});
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.classList.add('turn-fold');
 const defs=document.createElementNS(ns,'defs'),gradient=document.createElementNS(ns,'linearGradient');
 gradient.id='reader-paper-fold';gradient.setAttribute('x1',direction>0?'0%':'100%');gradient.setAttribute('x2',direction>0?'100%':'0%');
 const paperColour=getComputedStyle(area.querySelector('.focus-page')||dialog).backgroundColor;
 // Narrow graphite shading at the bend; the rest remains the actual paper colour.
 for(const [offset,colour] of [['0%',paperColour],['20%',paperColour],['100%',paperColour]]){const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color',colour);gradient.append(stop)}
 defs.append(gradient);svg.append(defs);
 const fold=document.createElementNS(ns,'path');fold.setAttribute('fill','url(#reader-paper-fold)');fold.classList.add('turn-fold-paper');fold.style.filter=`drop-shadow(${direction*8}px 3px 10px rgb(38 60 60 / .15))`;
 const shadeGradient=document.createElementNS(ns,'linearGradient');shadeGradient.id='reader-paper-shade';shadeGradient.setAttribute('x1',direction>0?'0%':'100%');shadeGradient.setAttribute('x2',direction>0?'100%':'0%');
 for(const [offset,opacity] of [['0%',.20],['13%',.07],['48%',0],['100%',.045]]){const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color','#263c3c');stop.setAttribute('stop-opacity',opacity);shadeGradient.append(stop)}
 defs.append(shadeGradient);
 const shade=document.createElementNS(ns,'path');shade.setAttribute('fill','url(#reader-paper-shade)');
 svg.append(fold,shade);layer.append(copy,svg);dialog.querySelector('.focus-shell').append(layer);turnLayer=layer;
 const duration=520,maxCurl=Math.min(140,w*.22),started=performance.now();
 function paint(now){
  if(turnLayer!==layer)return;
  const t=Math.min(1,(now-started)/duration),p=t*t*(3-2*t),curl=Math.sin(Math.PI*p)*maxCurl;
  const x=direction>0?w*(1-p):w*p,sign=direction>0?1:-1;
  const topX=x+sign*curl*.12,midX=x-sign*curl*.22,bottomX=x-sign*curl*.09;
  // A curved edge, rather than a rectangular wipe, gives the sheet its softness.
  const edge=`M ${topX} 0 Q ${midX} ${h*.48} ${bottomX} ${h}`;
  copy.style.clipPath=direction>0?`path("M 0 0 L ${topX} 0 Q ${midX} ${h*.48} ${bottomX} ${h} L 0 ${h} Z")`:`path("M ${w} 0 L ${topX} 0 Q ${midX} ${h*.48} ${bottomX} ${h} L ${w} ${h} Z")`;
  const outerTop=topX+sign*curl*.65,outerBottom=bottomX+sign*curl*.75;
  const shape=`${edge} L ${outerBottom} ${h} Q ${x+sign*curl*1.25} ${h*.5} ${outerTop} 0 Z`;
  fold.setAttribute('d',shape);shade.setAttribute('d',shape);svg.style.opacity=String(Math.min(1,Math.sin(Math.PI*t)*5));
  if(t<1)turnFrame=requestAnimationFrame(paint);else cancelPaperTurn();
 }
 paint(started);
}
async function rustle(){
 if(!effects.sound)return;
 try{
  const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw Error();
  audioContext??=new Context();await audioContext.resume();if(audioContext.state!=='running')throw Error();
  const length=Math.floor(audioContext.sampleRate*.22),buffer=audioContext.createBuffer(1,length,audioContext.sampleRate),samples=buffer.getChannelData(0);
  let smooth=0;for(let i=0;i<length;i++){smooth=.65*smooth+.35*(Math.random()*2-1);samples[i]=smooth;}
  const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=1700;filter.Q.value=.55;
  const t=audioContext.currentTime;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.09,t+.04);gain.gain.exponentialRampToValueAtTime(.001,t+.21);
  source.connect(filter).connect(gain).connect(audioContext.destination);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()};source.start();
  $('#focus-effects-note').textContent=reduced.matches?'Paper turns are off to match your reduced-motion setting.':'Soft page sound is on.';
 }catch{$('#focus-effects-note').textContent='Sound is unavailable in this browser. Reading still works.';}
}
function markKey(id=poems[poemIndex].id,code=chosen()){return `singhasan-poem-marks-v1:${id}:${code}`}
function readMarks(id=poems[poemIndex].id,code=chosen()){const p=poems.find(p=>p.id===id),saved=readJSON(markKey(id,code),[]);return normalized(Array.isArray(saved)?saved:[],p.variants[code].stanzas.flat(),code)}
function captureSelection(){
 const selection=getSelection();if(!selection.rangeCount||selection.isCollapsed)return [];const range=selection.getRangeAt(0);if(!area.contains(range.startContainer)||!area.contains(range.endContainer))return [];
 const cuts=[];for(const line of area.querySelectorAll('.focus-line')){if(!range.intersectsNode(line))continue;const within=node=>node===line||line.contains(node),prefix=document.createRange();prefix.selectNodeContents(line);let start=0,end=line.textContent.length;
 if(within(range.startContainer)){prefix.setEnd(range.startContainer,range.startOffset);start=prefix.toString().length}if(within(range.endContainer)){prefix.selectNodeContents(line);prefix.setEnd(range.endContainer,range.endOffset);end=prefix.toString().length}
 if(end>start)cuts.push({id:Number(line.dataset.poemId),code:line.lang,line:Number(line.dataset.sourceLine),start:Number(line.dataset.start)+start,end:Number(line.dataset.start)+end});
 }return cuts;
}
function clearSelection(){selectionCuts=[];selectionTools.hidden=true;getSelection()?.removeAllRanges()}
function showSelection(){if(!dialog.open||!settings.hidden)return;const cuts=captureSelection();if(!cuts.length){if(!selectionTools.contains(document.activeElement))selectionTools.hidden=true;return}selectionCuts=cuts;selectionTools.hidden=false;$('#focus-erase').hidden=!cuts.some(c=>readMarks(c.id,c.code).some(m=>m.line===c.line&&m.start<c.end&&c.start<m.end))}
document.addEventListener('selectionchange',()=>{clearTimeout(selectionTimer);selectionTimer=setTimeout(showSelection,100)});selectionTools.addEventListener('pointerdown',e=>e.preventDefault());
function markSelection(erase){
 const cuts=captureSelection().length?captureSelection():selectionCuts;if(!cuts.length)return;
 for(const key of new Set(cuts.map(c=>c.id+':'+c.code))){const group=cuts.filter(c=>c.id+':'+c.code===key),{id,code}=group[0],p=poems.find(p=>p.id===id),marks=readMarks(id,code),ranges=group.map(({line,start,end})=>({line,start,end}));writeJSON(markKey(id,code),normalized(erase?subtract(marks,ranges):marks.concat(ranges),p.variants[code].stanzas.flat(),code))}
 document.dispatchEvent(new CustomEvent('poem-marks-changed'));clearSelection();render();area.focus({preventScroll:true});$('#focus-announcement').textContent=erase?'Underline removed.':'Passage underlined.';
}
$('#focus-mark').onclick=()=>markSelection(false);$('#focus-erase').onclick=()=>markSelection(true);$('#focus-selection-close').onclick=()=>{clearSelection();area.focus({preventScroll:true})};
function bookmarks(){const list=readJSON(bookKey,[]);return Array.isArray(list)?list.filter(b=>poems.some(p=>p.id===b.id&&p.variants[b.language])&&Number.isInteger(b.unit)):[]}
function isHere(b){return pages.slice(pageIndex,pageIndex+visibleCount()).some(pg=>!pg.cover&&pg.some(u=>u.poemId===b.id&&u.code===b.language&&(u.index===b.unit||(u.type==='line'&&b.unit>=u.index&&b.unit<u.index+u.text.length))))}
function updateBookmark(){const active=bookmarks().some(isHere),button=$('#focus-bookmark');button.disabled=!!pages[pageIndex]?.cover;button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',active?'Remove page bookmark':'Bookmark this page');button.title=button.getAttribute('aria-label')}
$('#focus-bookmark').onclick=()=>{if(pages[pageIndex]?.cover)return;let list=bookmarks();const active=list.some(isHere),anchor=currentUnit();list=active?list.filter(b=>!isHere(b)):list.concat({id:anchor.id,language:anchor.code,unit:anchor.unit});writeJSON(bookKey,list);updateBookmark();$('#focus-announcement').textContent=active?'Bookmark removed.':'Page bookmarked.'};
function jumpSaved(id,code,unit){clearSelection();const changed=language!==code;language=code;dismissQuietSettings();if(changed)paginate({id,unit});else{pageIndex=pageFor({id,unit});render()}save();area.focus({preventScroll:true});announcePoem()}
function renderSaved(){
 const list=$('#focus-saved-list');list.replaceChildren();
 function item(label,detail,open,remove){const row=document.createElement('div'),link=document.createElement('button'),del=document.createElement('button');row.className='focus-saved-row';link.textContent=label;link.title=detail;link.onclick=open;del.textContent='×';del.setAttribute('aria-label','Remove '+detail);del.onclick=()=>{remove();document.dispatchEvent(new CustomEvent('poem-marks-changed'));render();renderSaved();updateBookmark()};row.append(link,del);list.append(row)}
 for(const b of bookmarks()){const p=poems.find(p=>p.id===b.id);item('Bookmark · '+p.variants[b.language].title,languageNames[b.language]+' bookmark',()=>jumpSaved(b.id,b.language,b.unit),()=>writeJSON(bookKey,bookmarks().filter(x=>!(x.id===b.id&&x.language===b.language&&x.unit===b.unit))))}
 for(const p of poems)for(const [code,v] of Object.entries(p.variants)){const key=markKey(p.id,code),texts=v.stanzas.flat(),marks=readMarks(p.id,code);for(const m of marks){const quote=texts[m.line].slice(m.start,m.end);item(quote,languageNames[code]+' passage in '+v.title,()=>jumpSaved(p.id,code,m.line*1000000+m.start),()=>writeJSON(key,subtract(marks,[m])))}}
 if(!list.childElementCount){const p=document.createElement('p');p.textContent='Your bookmarks and underlined passages will appear here.';list.append(p)}
}
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
function jumpPage(code,line,offset=0){$(`[data-reading-language="${code===pageData.source_language?'original':code}"]`)?.click();closeSavedPage();const target=pageVerse.querySelector(`[data-line="${line}"]`);if(target){target.tabIndex=-1;if(document.body.classList.contains('pagination-on'))document.dispatchEvent(new CustomEvent('book-jump-line',{detail:{line,offset}}));else target.scrollIntoView({block:'center',behavior:'auto'});target.focus({preventScroll:true})}}
function renderPageSaved(){
 if(!pageVerse)return;
 const list=$('#page-saved-list');list.replaceChildren();const current=pageBooks().find(b=>b.language===pageCode());$('#page-save-place').textContent=current?'Remove bookmark':pageData.id===0?'Bookmark the introduction':'Bookmark this poem';
 function row(label,detail,go,remove){const node=document.createElement('div'),button=document.createElement('button'),del=document.createElement('button');node.className='focus-saved-row';button.textContent=label;button.setAttribute('aria-label',label+' · '+detail);button.onclick=go;del.textContent='×';del.setAttribute('aria-label','Remove '+detail);del.onclick=()=>{remove();renderPageSaved();refreshSavedButton()};node.append(button,del);list.append(node)}
 for(const b of pageBooks())row('Continue reading · '+languageNames[b.language],pageData.variants[b.language].title,()=>jumpPage(b.language,b.line,b.offset||0),()=>writeJSON(pageBookKey,pageBooks().filter(x=>x.language!==b.language)));
 for(const [code,v] of Object.entries(pageData.variants))for(const m of pageMarks(code)){
  const quote=v.stanzas.flat()[m.line].slice(m.start,m.end),key=`singhasan-poem-marks-v1:${pageData.id}:${code}`;
  row(quote,languageNames[code]+' underlined passage',()=>jumpPage(code,m.line,m.start),()=>{writeJSON(key,subtract(pageMarks(code),[m]));document.dispatchEvent(new CustomEvent('poem-marks-changed'))});
 }
 if(!list.childElementCount){const empty=document.createElement('p');empty.className='page-tools-tip';empty.textContent='Your reading place and underlined passages will appear here.';list.append(empty)}
}
savedButton.onclick=()=>{const open=savedPanel.hidden;savedPanel.hidden=!open;savedButton.setAttribute('aria-expanded',String(open));if(open){renderPageSaved();placePageMenu();savedPanel.querySelector('[aria-selected="true"]')?.focus({preventScroll:true})}};
$('#page-bookmarks-close').onclick=()=>closeSavedPage(true);
$('#page-save-place').onclick=()=>{const code=pageCode(),saved=pageBooks(),exists=saved.some(b=>b.language===code);writeJSON(pageBookKey,exists?saved.filter(b=>b.language!==code):saved.concat({id:pageData.id,language:code,line:currentPageLine(),offset:Number(pageVerse.dataset.pageOffset||0)}));renderPageSaved();refreshSavedButton();$('#page-saved-status').textContent=exists?'Bookmark removed.':'Bookmarked. Your reading place will follow as you read.'};
document.addEventListener('click',e=>{if(!savedPanel.hidden&&!savedPanel.contains(e.target)&&!savedButton.contains(e.target))closeSavedPage()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!savedPanel.hidden){e.preventDefault();e.stopPropagation();closeSavedPage(true)}});
document.addEventListener('poem-marks-changed',()=>{refreshSavedButton();if(!savedPanel.hidden)renderPageSaved()});
window.addEventListener('scroll',()=>{clearTimeout(pageScrollTimer);pageScrollTimer=setTimeout(()=>{if(!pageVerse||document.body.classList.contains('pagination-on')||dialog.open||!savedPanel.hidden)return;const bounds=pageVerse.getBoundingClientRect();if(bounds.bottom<=100||bounds.top>=innerHeight*.8)return;const saved=pageBooks(),entry=saved.find(b=>b.language===pageCode());if(entry){entry.line=currentPageLine();writeJSON(pageBookKey,saved)}},180)},{passive:true});
document.querySelectorAll('[data-reading-language]').forEach(tab=>tab.addEventListener('click',()=>{if(!savedPanel.hidden)renderPageSaved()}));
document.addEventListener('book-page-turn',event=>{const saved=pageBooks(),entry=saved.find(b=>b.language===pageCode());if(entry){entry.line=event.detail.line;entry.offset=event.detail.offset;writeJSON(pageBookKey,saved)}});
refreshSavedButton();

// Sharing uses the site's complete share dialog.
document.querySelector('[data-share]')?.addEventListener('click',()=>closeSavedPage(),true);
window.addEventListener('load',()=>{const code=query.get('lang');if(code==='original'||pageData.variants[code])$(`[data-reading-language="${code===pageData.source_language?'original':code}"]`)?.click();refreshSavedButton();if(query.get('focus')==='1')openReader(query.get('start')==='cover'||pageData.id===0?'cover':'poem')});
})();
