import {capturePaper,paperTurn,beginPaperTurn,cancelPaperTurn} from './book-paper-turn.mjs?v=4';
import {completesTurn,clampTurn} from './book-turn-state.mjs';
import {bookURL,leafNumbers} from './reader-state.mjs?v=2';
/* Native column fragmentation keeps the original verse and saved mark offsets intact. */
const body=document.body,book=document.querySelector('.printed-spread'),verse=document.querySelector('#experience-verse'),panel=document.querySelector('#reading-panel');
if(book&&verse&&panel&&body.classList.contains('illustrated-mode')){
 const previous=document.querySelector('#leaf-prev'),next=document.querySelector('#leaf-next'),status=document.querySelector('#leaf-progress'),nav=document.querySelector('.leaf-nav');
 const links=book.querySelectorAll('.page-nav>a'),before=links[0].getAttribute('href'),after=links[links.length-1].getAttribute('href');
 const mobile=matchMedia('(max-width:760px)'),query=new URLSearchParams(location.search);
 let index=0,textPages=1,textColumns=1,spread=1,gap=80,columnWidth=1,stride=1,ready=false,timer,language=verse.lang,anchor={line:0,offset:0},pendingJump=null,initial=true;
 let quiet=body.classList.contains('quiet-mode'),turning=false,gesture=null;
 const openingLeaves=()=>quiet?0:(mobile.matches?2:1);
 const isArt=()=>index<openingLeaves();
 const count=()=>textPages+openingLeaves();
 const blocked=()=>!!document.querySelector('dialog[open]')||!document.querySelector('#page-bookmarks').hidden;
 function textPosition(element,offset){const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let node,last;while(node=walker.nextNode()){last=node;if(offset<node.length)return {node,offset};offset-=node.length}return last?{node:last,offset:Math.max(0,last.length-1)}:null}
 function charRect(line,offset){const el=line.querySelector('.line-words')||line,p=textPosition(el,offset);if(!p)return null;const range=document.createRange();range.setStart(p.node,p.offset);range.setEnd(p.node,Math.min(p.offset+1,p.node.length));return range.getBoundingClientRect()}
 function visibleAnchor(){if(isArt())return anchor;const r=panel.getBoundingClientRect();for(const line of verse.querySelectorAll('[data-line]')){if(![...line.getClientRects()].some(x=>x.right>r.left+1&&x.left<r.right-1))continue;let lo=0,hi=line.textContent.length-1,best=0;while(lo<=hi){const mid=(lo+hi)>>1,rect=charRect(line,mid);if(rect&&rect.right<=r.left+1){lo=mid+1;best=lo}else hi=mid-1}return {line:Number(line.dataset.line),offset:best}}return anchor}
 function pageFor(a){const line=verse.querySelector(`[data-line="${a.line}"]`);if(!line)return openingLeaves();const r=charRect(line,a.offset||0)||line.getBoundingClientRect(),column=Math.floor((r.left-panel.getBoundingClientRect().left+2)/(columnWidth+gap));return openingLeaves()+Math.max(0,Math.min(textPages-1,Math.floor(column/spread)))}
 function url(){const u=new URL(location.href);u.searchParams.delete('leaf');u.searchParams.delete('focus');u.searchParams.delete('start');u.searchParams.delete('line');u.searchParams.delete('offset');u.searchParams.set('view','book');u.searchParams.set('quiet',quiet?'1':'0');if(verse.lang==='or')u.searchParams.delete('lang');else u.searchParams.set('lang',verse.lang);if(index)u.searchParams.set('page',String(index+1));else u.searchParams.delete('page');history.replaceState(history.state,'',u)}
 function render(updateURL=true,remember=false,preview=false){
  index=Math.max(0,Math.min(count()-1,index));const kind=isArt()?(mobile.matches&&index===1?'story':'art'):'text';
  book.classList.toggle('art-page',isArt());book.classList.toggle('story-page',kind==='story');
  book.dataset.poemComplete=String(!isArt()&&index===count()-1);
  const blankArt=book.querySelector('.blank-leaf-art');
  if(blankArt)blankArt.hidden=isArt()||spread!==2||index!==count()-1||textColumns%2===0;
  const endingCenter=spread===1?columnWidth/2:(textColumns%2?columnWidth/2:columnWidth+gap+columnWidth/2);
  book.style.setProperty('--ending-center',endingCenter+'px');
  verse.style.setProperty('--leaf-shift',-Math.max(0,index-openingLeaves())*stride+'px');panel.scrollLeft=panel.scrollTop=0;
  const ending=book.querySelector('.reader>.poem-ending');
  if(ending&&book.dataset.poemComplete==='true'){
   const lines=verse.querySelectorAll('[data-line]'),tail=lines[lines.length-1];
   const tailRect=tail?.getClientRects(),lastRect=tailRect?.[tailRect.length-1],bounds=panel.getBoundingClientRect();
   const below=lastRect?lastRect.bottom-bounds.top+10:bounds.height;
   const onRule=below+28>bounds.height;
   ending.classList.toggle('on-footer-rule',onRule);
   ending.style.setProperty('--ending-top',(onRule?bounds.height:below)+'px');
  }

  const folios=leafNumbers({quiet,mobile:mobile.matches,index,textColumns});
  document.querySelector('#leaf-folio-left').textContent=folios.first;document.querySelector('#leaf-folio-right').textContent=folios.second??'';
  status.textContent=mobile.matches?`${folios.first} / ${folios.total}`:`Page${folios.second?'s':''} ${folios.first}${folios.second?'–'+folios.second:''} of ${folios.total}`;
  const prose=verse.classList.contains('prose'),readLabel=prose?'Next':'Read poem';
  document.querySelector('#leaf-switch').textContent=readLabel;
  document.querySelector('#leaf-switch').hidden=quiet||!isArt()||!mobile.matches||kind==='story';
  next.querySelector('.leaf-button-label').textContent=kind==='art'&&mobile.matches?'Image story':isArt()?readLabel:index===count()-1?(after.includes('back-cover')?'Back cover':'Next poem'):'Next';
  panel.setAttribute('aria-label',`Book text, ${spread===2?'spread':'page'} ${Math.max(1,index-openingLeaves()+1)} of ${textPages}`);
  book.dataset.leaf=String(index+1);book.dataset.leaves=String(count());book.dataset.textLeaves=String(textPages);book.dataset.textColumns=String(textColumns);book.dataset.spread=String(spread);book.dataset.leafKind=kind;
  if(preview)return;
  anchor=visibleAnchor();if(!isArt()){try{localStorage.setItem('singhasan-book-place-v1',JSON.stringify({route:location.pathname.split('/').pop(),...anchor,language:verse.lang,quiet}))}catch{}}verse.dataset.pageLine=anchor.line;verse.dataset.pageOffset=anchor.offset;if(updateURL)url();document.dispatchEvent(new Event('book-page-rendered'));if(remember)document.dispatchEvent(new CustomEvent('book-page-turn',{detail:anchor}));
 }
 function layout(){
  if(!ready)return;cancelPaperTurn();const oldKind=book.dataset.leafKind,oldAnchor=anchor;book.classList.remove('art-page','story-page');
  const width=panel.getBoundingClientRect().width;if(width<1||panel.clientHeight<1)return;
  spread=mobile.matches?1:2;gap=mobile.matches?32:80;columnWidth=(width-gap*(spread-1))/spread;
  verse.style.setProperty('--leaf-width',columnWidth+'px');verse.style.setProperty('--leaf-gap',gap+'px');verse.style.setProperty('--leaf-shift','0px');stride=width+gap;
  textColumns=Math.max(1,Math.round((verse.scrollWidth+gap)/(columnWidth+gap)));textPages=Math.ceil(textColumns/spread);
  if(initial){index=query.has('line')?pageFor({line:Math.max(0,Number(query.get('line'))||0),offset:Math.max(0,Number(query.get('offset'))||0)}):query.get('leaf')==='last'?count()-1:Math.max(0,(Number(query.get('page'))||1)-1);initial=false}
  else if(pendingJump){index=pageFor(pendingJump);pendingJump=null}
  else if(verse.lang!==language){index=0;language=verse.lang}
  else if(oldKind==='art')index=0;else if(oldKind==='story')index=mobile.matches?1:0;else index=pageFor(oldAnchor);
  render();
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(layout,60)}
 function bookRoute(href,last=false){return bookURL(new URL(href,location.href).pathname.split('/').pop(),{quiet,language:verse.lang,last})}
 // Warm adjacent documents and their normal HTTP cache without executing them.
 const prefetched=new Set();
 function warmChapter(href){const target=bookRoute(href);if(prefetched.has(target))return;prefetched.add(target);const link=document.createElement('link');link.rel='prefetch';link.as='document';link.href=target;document.head.append(link)}
 document.addEventListener('book-page-rendered',()=>{warmChapter(before);warmChapter(after)});
 function turn(direction,interactive=false){
  if(blocked()||turning)return null;
  const target=index+direction;
  document.dispatchEvent(new Event('book-manual-turn'));
  window.getSelection()?.removeAllRanges();document.querySelector('#selection-tools').hidden=true;
  if(target<0||target>=count()){
   // A boundary swipe commits only on release, so a short drag never leaves a poem.
   if(!interactive)location.href=bookRoute(target<0?before:after,target<0);
   return null;
  }
  const paper=body.dataset.pageMotion==='true'?capturePaper(book):null;
  if(!paper){if(!interactive){index=target;render(true,true)}return null}
  const from=index;turning=true;index=target;render(false,false,true);
  const finish=complete=>{turning=false;book.classList.remove('is-dragging');index=complete?target:from;render(true,complete)};
  const animation=beginPaperTurn(direction,paper,book,{onComplete:()=>finish(true),onCancel:()=>finish(false)});
  if(!animation){finish(true);return null}
  if(!interactive)animation.settle();return animation;
 }
 document.addEventListener('book-set-quiet',event=>{if(!ready)return;cancelPaperTurn();const saved=visibleAnchor();quiet=event.detail;body.classList.toggle('quiet-mode',quiet);try{localStorage.setItem('singhasan-book-quiet-v1',String(quiet))}catch{}pendingJump=saved;layout();document.dispatchEvent(new Event('book-mode-changed'))});
 document.querySelector('#leaf-switch').addEventListener('click',()=>{if(blocked()||quiet)return;document.dispatchEvent(new Event('book-manual-turn'));index=isArt()?openingLeaves():0;render(true,true)});
 previous.addEventListener('click',()=>turn(-1));next.addEventListener('click',()=>turn(1));
 document.addEventListener('keydown',event=>{if(blocked()||event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||event.target.closest('input,select,textarea,[role=tab]')||!window.getSelection()?.isCollapsed)return;if(event.key==='ArrowRight'||event.key==='PageDown'){event.preventDefault();turn(1)}else if(event.key==='ArrowLeft'||event.key==='PageUp'){event.preventDefault();turn(-1)}});
 // Begin in the outer margin; long-press and text selection keep their normal behaviour.
 book.addEventListener('pointerdown',e=>{
  if(blocked()||turning||!e.isPrimary||e.button!==0||e.target.closest('a,button,input,select,textarea,summary,[data-line],.image-narrative')||!window.getSelection()?.isCollapsed)return;
  const box=book.getBoundingClientRect(),x=e.clientX-box.left,edge=Math.min(48,box.width*.13);
  if(x>edge&&x<box.width-edge)return;
  gesture={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),lastX:e.clientX,lastTime:performance.now(),velocity:0,direction:x<edge?-1:1,width:box.width,progress:0,started:false,animation:null};
 });
 book.addEventListener('pointermove',e=>{
  const g=gesture;if(!g||g.id!==e.pointerId)return;
  const dx=e.clientX-g.x,dy=e.clientY-g.y,travel=-dx*g.direction;
  if(!g.started){
   if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){gesture=null;return}
   if(travel<10||Math.abs(dx)<Math.abs(dy)*1.3)return;
   if(performance.now()-g.time>450||!window.getSelection()?.isCollapsed){gesture=null;return}
   g.started=true;book.setPointerCapture(e.pointerId);book.classList.add('is-dragging');g.animation=turn(g.direction,true);
  }
  e.preventDefault();const now=performance.now();g.velocity=-(e.clientX-g.lastX)*g.direction/Math.max(1,now-g.lastTime);g.lastX=e.clientX;g.lastTime=now;
  g.progress=clampTurn(travel/(g.width*.72));g.animation?.setProgress(g.progress);
 });
 function releaseGesture(e,cancelled=false){
  const g=gesture;if(!g||g.id!==e.pointerId)return;gesture=null;
  if(book.hasPointerCapture(e.pointerId))book.releasePointerCapture(e.pointerId);
  book.classList.remove('is-dragging');if(!g.started){if(!cancelled&&performance.now()-g.time<350&&Math.abs((e.clientX??g.x)-g.x)<8&&Math.abs((e.clientY??g.y)-g.y)<8)turn(g.direction);return;}
  const velocity=performance.now()-g.lastTime<100?g.velocity:0,complete=!cancelled&&completesTurn(g.progress,velocity);
  if(g.animation)g.animation.settle(complete);else if(complete)turn(g.direction);
 }
 book.addEventListener('pointerup',e=>releaseGesture(e));
 book.addEventListener('pointercancel',e=>releaseGesture(e,true));
 book.addEventListener('lostpointercapture',e=>releaseGesture(e,true));
 window.addEventListener('blur',()=>{if(gesture)releaseGesture({pointerId:gesture.id},true)});
 let lastWheel=0,wheelTotal=0,wheelTurned=false;book.addEventListener('wheel',e=>{if(blocked()||e.ctrlKey||e.metaKey||!window.getSelection()?.isCollapsed)return;const now=performance.now();if(now-lastWheel>220){wheelTotal=0;wheelTurned=false}lastWheel=now;if(Math.abs(e.deltaX)<Math.abs(e.deltaY)*1.35||Math.abs(e.deltaX)<1)return;e.preventDefault();if(wheelTurned)return;const delta=e.deltaX*(e.deltaMode===1?16:e.deltaMode===2?book.clientWidth:1);if(wheelTotal&&Math.sign(wheelTotal)!==Math.sign(delta))wheelTotal=0;wheelTotal+=delta;if(Math.abs(wheelTotal)>=65){wheelTurned=true;turn(wheelTotal>0?1:-1)}},{passive:false});
 document.addEventListener('book-jump-line',e=>{document.dispatchEvent(new Event('book-manual-turn'));pendingJump=e.detail;layout()});
 document.addEventListener('book-follow-anchor',e=>{
  if(!ready||blocked()||turning||gesture||verse.lang!=='or'||!window.getSelection()?.isCollapsed)return;
  const {line,offset=0,animate=true}=e.detail||{},element=verse.querySelector(`[data-line="${line}"]`);if(!element)return;
  const rect=charRect(element,offset);if(!rect)return;
  const unshifted=rect.left-panel.getBoundingClientRect().left+Math.max(0,index-openingLeaves())*stride;
  const target=openingLeaves()+Math.max(0,Math.min(textPages-1,Math.floor((unshifted+2)/stride)));
  if(target===index)return;
  const paper=animate&&body.dataset.pageMotion==='true'?capturePaper(book):null,direction=target>index?1:-1;
  index=target;render();paperTurn(direction,paper,book);
 });
 document.querySelectorAll('[data-size]').forEach(b=>b.addEventListener('click',schedule));
 new MutationObserver(schedule).observe(verse,{childList:true,subtree:true,attributes:true,attributeFilter:['lang']});
 new ResizeObserver(schedule).observe(panel);window.addEventListener('resize',schedule);
 await document.fonts.ready;body.classList.add('pagination-on');nav.hidden=false;ready=true;layout();
}
