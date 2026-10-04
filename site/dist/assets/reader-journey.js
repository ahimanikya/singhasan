/* A reader visit returns to its entry page, even after several chapters. */
(()=>{
 const visitKey='singhasan-reader-visit-v1',restoreKey='singhasan-reader-return-v1';
 const here=new URL(location.href);
 const local=value=>{if(typeof value!=='string'||!value.trim())return null;try{const u=new URL(value,location.href);return u.origin===here.origin&&(u.pathname.endsWith('.html')||u.pathname.endsWith('/'))?u:null}catch{return null}};
 const inReader=u=>!!u&&(/\/(book|back-cover|read-along)\.html$/.test(u.pathname)||(/\/(intro|poem-\d+|contents)\.html$/.test(u.pathname)&&(u.searchParams.get('view')==='book'||u.searchParams.has('page')||u.searchParams.get('leaf')==='last'||u.searchParams.get('focus')==='1'||u.searchParams.get('quiet')==='1')));
 const read=key=>{try{return JSON.parse(sessionStorage.getItem(key))}catch{return null}};
 const write=(key,value)=>{try{sessionStorage.setItem(key,JSON.stringify(value))}catch{}};
 const valid=value=>value&&local(value.url)&&!inReader(local(value.url))?value:null;
 const samePage=(a,b)=>a&&b&&a.origin===b.origin&&a.pathname===b.pathname&&a.search===b.search;
 const reader=inReader(here),referrer=local(document.referrer),saved=valid(read(visitKey));
 let entry=null;
 if(reader){
  // History belongs to this particular visit; session storage carries it to the next chapter.
  entry=valid(history.state?.readerEntry);
  if(!entry&&saved&&(inReader(referrer)||samePage(local(saved.from||saved.url),referrer)))entry=saved;
  if(!entry&&referrer&&!inReader(referrer))entry={url:referrer.href,x:0,y:0};
  if(entry){write(visitKey,entry);history.replaceState({...history.state,readerEntry:entry},'')}
  else {try{sessionStorage.removeItem(visitKey)}catch{}}
 }
 function remember(){
  if(reader)return;
  const u=new URL(location.href),verse=document.querySelector('#experience-verse');
  if(verse?.lang&&verse.lang!=='or')u.searchParams.set('lang',verse.lang);
  else if(verse)u.searchParams.delete('lang');
  if(document.body.classList.contains('intro-paginated')){
   u.searchParams.set('line',verse.dataset.pageLine||0);u.searchParams.set('offset',verse.dataset.pageOffset||0);
  }
  write(visitKey,{url:u.href,from:location.href,x:scrollX,y:scrollY});
 }
 // Capture before link-specific handlers update language or passage parameters.
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.hasAttribute('download'))return;
  if(inReader(local(link.href)))remember();
 },true);
 const restore=valid(read(restoreKey));
 if(!reader&&restore&&samePage(local(restore.url),here)){
  const scrollBack=()=>{requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({left:restore.x||0,top:restore.y||0,behavior:'instant'})))};
  document.addEventListener('DOMContentLoaded',async()=>{await document.fonts.ready;scrollBack()},{once:true});
  window.addEventListener('pageshow',async()=>{
   await document.fonts.ready;scrollBack();try{sessionStorage.removeItem(restoreKey)}catch{}
  },{once:true});
 }
 window.readerJourney={
  remember,
  destination:()=>entry?.url||null,
  prepareExit:()=>{if(entry)write(restoreKey,entry)}
 };
})();
