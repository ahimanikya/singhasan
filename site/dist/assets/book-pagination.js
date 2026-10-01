/* Native column fragmentation keeps the original verse and saved mark offsets intact. */
const body=document.body,book=document.querySelector('.printed-spread'),verse=document.querySelector('#experience-verse'),panel=document.querySelector('#reading-panel');
if(book&&verse&&panel&&body.classList.contains('illustrated-mode')){
 const previous=document.querySelector('#leaf-prev'),next=document.querySelector('#leaf-next'),status=document.querySelector('#leaf-progress'),nav=document.querySelector('.leaf-nav');
 const links=book.querySelectorAll('.page-nav>a'),before=links[0].getAttribute('href'),after=links[links.length-1].getAttribute('href');
 const mobile=matchMedia('(max-width:760px)'),query=new URLSearchParams(location.search);
 let index=0,textPages=1,textColumns=1,spread=1,gap=80,columnWidth=1,stride=1,ready=false,timer,language=verse.lang,anchor={line:0,offset:0},pendingJump=null,initial=true;
 const openingLeaves=()=>mobile.matches?2:1;
 const isArt=()=>index<openingLeaves();
 const count=()=>textPages+openingLeaves();
 const blocked=()=>!!document.querySelector('dialog[open]')||!document.querySelector('#page-bookmarks').hidden;
 function textPosition(element,offset){const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let node,last;while(node=walker.nextNode()){last=node;if(offset<node.length)return {node,offset};offset-=node.length}return last?{node:last,offset:Math.max(0,last.length-1)}:null}
 function charRect(line,offset){const el=line.querySelector('.line-words')||line,p=textPosition(el,offset);if(!p)return null;const range=document.createRange();range.setStart(p.node,p.offset);range.setEnd(p.node,Math.min(p.offset+1,p.node.length));return range.getBoundingClientRect()}
 function visibleAnchor(){if(isArt())return anchor;const r=panel.getBoundingClientRect();for(const line of verse.querySelectorAll('[data-line]')){if(![...line.getClientRects()].some(x=>x.right>r.left+1&&x.left<r.right-1))continue;let lo=0,hi=line.textContent.length-1,best=0;while(lo<=hi){const mid=(lo+hi)>>1,rect=charRect(line,mid);if(rect&&rect.right<=r.left+1){lo=mid+1;best=lo}else hi=mid-1}return {line:Number(line.dataset.line),offset:best}}return anchor}
 function pageFor(a){const line=verse.querySelector(`[data-line="${a.line}"]`);if(!line)return openingLeaves();const r=charRect(line,a.offset||0)||line.getBoundingClientRect(),column=Math.floor((r.left-panel.getBoundingClientRect().left+2)/(columnWidth+gap));return openingLeaves()+Math.max(0,Math.min(textPages-1,Math.floor(column/spread)))}
 function url(){const u=new URL(location.href);u.searchParams.delete('leaf');u.searchParams.set('view','book');if(index)u.searchParams.set('page',String(index+1));else u.searchParams.delete('page');history.replaceState(null,'',u)}
 function render(updateURL=true,remember=false){
  index=Math.max(0,Math.min(count()-1,index));const kind=isArt()?(mobile.matches&&index===1?'story':'art'):'text';
  book.classList.toggle('art-page',isArt());book.classList.toggle('story-page',kind==='story');
  verse.style.setProperty('--leaf-shift',-Math.max(0,index-openingLeaves())*stride+'px');panel.scrollLeft=panel.scrollTop=0;
  status.textContent=(kind==='art'?'Illustration · ':kind==='story'?'Image story · ':'')+`${index+1} / ${count()}`;
  panel.setAttribute('aria-label',`Book text, ${spread===2?'spread':'page'} ${Math.max(1,index-openingLeaves()+1)} of ${textPages}`);
  book.dataset.leaf=String(index+1);book.dataset.leaves=String(count());book.dataset.textLeaves=String(textPages);book.dataset.textColumns=String(textColumns);book.dataset.spread=String(spread);book.dataset.leafKind=kind;
  anchor=visibleAnchor();verse.dataset.pageLine=anchor.line;verse.dataset.pageOffset=anchor.offset;if(updateURL)url();if(remember&&!isArt())document.dispatchEvent(new CustomEvent('book-page-turn',{detail:anchor}));
 }
 function layout(){
  if(!ready)return;const oldKind=book.dataset.leafKind,oldAnchor=anchor;book.classList.remove('art-page','story-page');
  const width=panel.getBoundingClientRect().width;if(width<1||panel.clientHeight<1)return;
  spread=mobile.matches?1:2;gap=mobile.matches?32:80;columnWidth=(width-gap*(spread-1))/spread;
  verse.style.setProperty('--leaf-width',columnWidth+'px');verse.style.setProperty('--leaf-gap',gap+'px');verse.style.setProperty('--leaf-shift','0px');stride=width+gap;
  textColumns=Math.max(1,Math.round((verse.scrollWidth+gap)/(columnWidth+gap)));textPages=Math.ceil(textColumns/spread);
  if(initial){index=query.get('leaf')==='last'?count()-1:Math.max(0,(Number(query.get('page'))||1)-1);initial=false}
  else if(pendingJump){index=pageFor(pendingJump);pendingJump=null}
  else if(verse.lang!==language){index=0;language=verse.lang}
  else if(oldKind==='art')index=0;else if(oldKind==='story')index=mobile.matches?1:0;else index=pageFor(oldAnchor);
  render();
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(layout,60)}
 function bookRoute(href,last=false){const u=new URL(href,location.href);if(/\/(intro|poem-\d+)\.html$/.test(u.pathname)){u.searchParams.set('view','book');if(last)u.searchParams.set('leaf','last');const code=verse.lang;if(code&&code!=='or')u.searchParams.set('lang',code)}return u.href}
 function turn(direction){if(blocked())return;window.getSelection()?.removeAllRanges();document.querySelector('#selection-tools').hidden=true;const target=index+direction;if(target<0){location.href=bookRoute(before,true);return}if(target>=count()){location.href=bookRoute(after);return}index=target;render(true,true);if(!matchMedia('(prefers-reduced-motion:reduce)').matches){const leaf=isArt()?book.querySelector('.book-companion'):book.querySelector('.reader');leaf.animate([{opacity:.55,transform:`translateX(${direction*14}px)`},{opacity:1,transform:'translateX(0)'}],{duration:210,easing:'ease-out'})}}
 previous.addEventListener('click',()=>turn(-1));next.addEventListener('click',()=>turn(1));
 document.addEventListener('keydown',event=>{if(blocked()||event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||event.target.closest('input,select,textarea,[role=tab]'))return;if(event.key==='ArrowRight'||event.key==='PageDown'){event.preventDefault();turn(1)}else if(event.key==='ArrowLeft'||event.key==='PageUp'){event.preventDefault();turn(-1)}});
 let start=null;book.addEventListener('touchstart',e=>{if(e.touches.length===1)start={x:e.touches[0].clientX,y:e.touches[0].clientY,time:Date.now()}},{passive:true});book.addEventListener('touchend',e=>{if(!start||!window.getSelection()?.isCollapsed)return;const touch=e.changedTouches[0],dx=touch.clientX-start.x,dy=touch.clientY-start.y;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5&&Date.now()-start.time<650)turn(dx<0?1:-1);start=null},{passive:true});
 document.addEventListener('book-jump-line',e=>{pendingJump=e.detail;layout()});
 document.querySelectorAll('[data-size]').forEach(b=>b.addEventListener('click',schedule));
 new MutationObserver(schedule).observe(verse,{childList:true,subtree:true,attributes:true,attributeFilter:['lang']});
 new ResizeObserver(schedule).observe(panel);window.addEventListener('resize',schedule);
 await document.fonts.ready;body.classList.add('pagination-on');nav.hidden=false;ready=true;layout();
}
