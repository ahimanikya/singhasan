import {readerShortcut} from './reader-shortcuts.mjs';

function setupReaderControls(){
 if(!document.body.classList.contains('full-page-reader'))return;
 const bar=document.querySelector('.reader-topbar');if(!bar)return;
 // In Listen & follow, expand the whole player, keeping its audio controls visible.
 let screenDocument=document;
 try{if(parent!==window&&parent.document.querySelector('#follow-book')?.contentWindow===window)screenDocument=parent.document}catch{}
 const quietToggle=bar.querySelector('[data-quiet-toggle]');
 if(quietToggle&&!quietToggle.querySelector('svg'))quietToggle.insertAdjacentHTML('afterbegin','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/></svg>');
 const root=screenDocument.documentElement;
 const supported=!!root.requestFullscreen&&screenDocument.fullscreenEnabled;
 const tools=document.createElement('div');tools.className='reader-topbar-tools';
 for(const child of [...bar.children])if(!child.classList.contains('exit-reader'))tools.append(child);
 bar.append(tools);
 let button,busy=false;
 if(supported){
  button=document.createElement('button');button.type='button';button.className='reader-fullscreen';button.setAttribute('aria-keyshortcuts','f');
  button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="expand-screen" d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><path class="contract-screen" d="M3 8h5V3m13 5h-5V3M8 21v-5H3m13 5v-5h5"/></svg>';
  tools.append(button);
  const update=()=>{const active=!!screenDocument.fullscreenElement;button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',active?'Leave full screen':'Full screen');button.title=active?'Leave full screen (F or Esc)':'Full screen (F) · Turn pages with ← and →'};
  screenDocument.addEventListener('fullscreenchange',update);
  window.addEventListener('pagehide',()=>screenDocument.removeEventListener('fullscreenchange',update),{once:true});update();
  const notice=document.createElement('span');notice.className='sr-only';notice.setAttribute('role','status');bar.append(notice);
  button.addEventListener('click',async()=>{
   if(busy)return;busy=true;
   try{if(screenDocument.fullscreenElement)await screenDocument.exitFullscreen();else await root.requestFullscreen();notice.textContent=''}
   catch{notice.textContent='Full screen is unavailable. You can continue reading here.'}
   finally{busy=false;update()}
  });
 }
 const front=document.querySelector('.cover-entry'),back=document.querySelector('.bound-back')?document.querySelector('.book-cover-route a[href*="poem-68.html"]'):null;
 const previous=document.querySelector('#leaf-prev')||back,next=document.querySelector('#leaf-next')||front;
 if(previous){previous.setAttribute('aria-keyshortcuts','ArrowLeft PageUp');previous.title='Previous page (←)'}
 if(next){next.setAttribute('aria-keyshortcuts','ArrowRight PageDown');next.title='Next page (→)'}
 document.addEventListener('keydown',event=>{
  const blocked=!!document.querySelector('dialog[open],#page-bookmarks:not([hidden]),#selection-tools:not([hidden])');
  const action=readerShortcut(event,{blocked,selected:window.getSelection()?.isCollapsed===false});
  if(action==='fullscreen'&&button){event.preventDefault();button.click()}
  else if(action==='next'||action==='previous'){
   const control=action==='next'?next:previous;
   // A cover boundary is a no-op rather than a browser scroll or wraparound.
   event.preventDefault();control?.click();
  }
 });
}
if(document.readyState!=='complete')document.addEventListener('DOMContentLoaded',setupReaderControls);else setupReaderControls();
