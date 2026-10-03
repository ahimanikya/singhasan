/* Paginate the standalone prose without replacing source text or saved marks. */
const body=document.body,verse=document.querySelector('#experience-verse'),panel=document.querySelector('#reading-panel');
if(body.classList.contains('standalone-page')&&verse?.classList.contains('prose')){
 await document.fonts.ready;
 const nav=document.createElement('nav');nav.className='intro-page-nav';nav.lang='en';nav.setAttribute('aria-label','Prose pages');
 const previous=document.createElement('button'),next=document.createElement('button'),status=document.createElement('span');
 previous.type=next.type='button';previous.textContent='← Previous';next.textContent='Next →';
 previous.setAttribute('aria-label','Previous prose page');next.setAttribute('aria-label','Next prose page');
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');nav.append(previous,status,next);panel.after(nav);
 body.classList.add('intro-paginated');
 let index=0,total=1,stride=1,anchor={line:0,offset:0},language=verse.lang,timer,pending=null;
 const companion=document.querySelector('.book-companion'),heading=document.querySelector('.poem-heading');
 const query=new URLSearchParams(location.search);
 if(query.has('line'))pending={line:Number(query.get('line'))||0,offset:Number(query.get('offset'))||0};
 function charRect(line,offset=0){
  const walker=document.createTreeWalker(line.querySelector('.line-words')||line,NodeFilter.SHOW_TEXT);let node;
  while(node=walker.nextNode()){if(offset<node.length){const r=document.createRange();r.setStart(node,Math.max(0,offset));r.setEnd(node,Math.min(node.length,offset+1));return r.getBoundingClientRect()}offset-=node.length}
  return line.getBoundingClientRect();
 }
 function visibleAnchor(){
  const bounds=panel.getBoundingClientRect();
  for(const line of verse.querySelectorAll('[data-line]')){
   if(![...line.getClientRects()].some(r=>r.right>bounds.left+1&&r.left<bounds.right-1))continue;
   let lo=0,hi=line.textContent.length-1;
   while(lo<=hi){const mid=(lo+hi)>>1;if(charRect(line,mid).right<=bounds.left+1)lo=mid+1;else hi=mid-1}
   return {line:Number(line.dataset.line),offset:lo};
  }
  return anchor;
 }
 function render(){
  verse.style.setProperty('--prose-shift',`${-index*stride}px`);panel.scrollLeft=0;
  previous.disabled=index===0;next.disabled=index===total-1;status.textContent=`Page ${index+1} of ${total}`;
  anchor=visibleAnchor();verse.dataset.pageLine=anchor.line;verse.dataset.pageOffset=anchor.offset;
  panel.setAttribute('aria-label',`ସିଂହଦ୍ଵାର, page ${index+1} of ${total}`);
  document.dispatchEvent(new Event('book-page-rendered'));
 }
 function layout(){
  const target=pending||anchor;pending=null;
  if(verse.lang!==language){target.line=0;target.offset=0;language=verse.lang}
  if(matchMedia('(min-width:761px)').matches&&companion){const height=Math.max(560,Math.round(companion.getBoundingClientRect().bottom-panel.getBoundingClientRect().top-nav.getBoundingClientRect().height-24));panel.style.setProperty('--prose-page-height',height+'px')}else panel.style.removeProperty('--prose-page-height');
  verse.style.setProperty('--prose-shift','0px');stride=panel.clientWidth+32;
  total=Math.max(1,Math.round((verse.scrollWidth+32)/stride));
  const line=verse.querySelector(`[data-line="${Math.max(0,target.line)}"]`);
  index=line?Math.max(0,Math.min(total-1,Math.floor((charRect(line,target.offset).left-panel.getBoundingClientRect().left+2)/stride))):0;
  render();
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(layout,60)}
 function turn(direction){
  index=Math.max(0,Math.min(total-1,index+direction));window.getSelection()?.removeAllRanges();
  document.querySelector('#selection-tools').hidden=true;render();
  panel.focus({preventScroll:true});panel.scrollIntoView({block:'start',behavior:'auto'});
 }
 previous.addEventListener('click',()=>turn(-1));next.addEventListener('click',()=>turn(1));
 panel.addEventListener('keydown',event=>{if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||!window.getSelection()?.isCollapsed)return;if(['ArrowRight','PageDown','ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();turn(['ArrowRight','PageDown'].includes(event.key)?1:-1)}});
 document.addEventListener('book-jump-line',event=>{pending=event.detail;layout();panel.scrollIntoView({block:'start',behavior:'auto'})});
 document.querySelectorAll('[data-size]').forEach(button=>button.addEventListener('click',schedule));
 const resize=new ResizeObserver(schedule);resize.observe(panel);if(companion)resize.observe(companion);if(heading)resize.observe(heading);
 new MutationObserver(schedule).observe(verse,{childList:true,subtree:true,attributes:true,attributeFilter:['lang']});
 layout();
}
