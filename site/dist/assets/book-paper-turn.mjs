import {clampTurn,turnAngle,settleDuration} from './book-turn-state.mjs';
/* Selectable live pages beneath a temporary, inert sheet turning at the binding. */
let activeTurn=null;
export function cancelPaperTurn(){activeTurn?.cancel()}
export function capturePaper(book){
 cancelPaperTurn();
 if(matchMedia('(prefers-reduced-motion:reduce)').matches)return null;
 const box=book.getBoundingClientRect(),sheet=book.cloneNode(true);
 const sources=[book,...book.querySelectorAll('*')],copies=[sheet,...sheet.querySelectorAll('*')];
 for(let i=0;i<sources.length;i++){
  const from=sources[i],to=copies[i],style=getComputedStyle(from);
  // Freeze the outgoing spread before render changes art/text visibility and columns.
  to.style.cssText=Array.from(style,name=>name+':'+style.getPropertyValue(name)).join(';');
  to.removeAttribute('id');to.removeAttribute('tabindex');to.removeAttribute('data-line');
 }
 Object.assign(sheet.style,{position:'absolute',left:-book.clientLeft+'px',top:-book.clientTop+'px',margin:'0',width:box.width+'px',height:box.height+'px',boxShadow:'none'});
 // Clip at the inside of the binding, not at the text or illustration rectangle.
 // Keeping a separate wrapper lets the fold include headings, margins and folios.
 const copy=document.createElement('div');copy.className='turn-snapshot';
 Object.assign(copy.style,{width:book.clientWidth+'px',height:book.clientHeight+'px'});
 copy.append(sheet);
 return {copy,width:book.clientWidth,height:book.clientHeight,left:0,top:0};
}
export function beginPaperTurn(direction,paper,book,{onComplete=()=>{},onCancel=()=>{}}={}){
 if(!paper||matchMedia('(prefers-reduced-motion:reduce)').matches)return null;
 cancelPaperTurn();
 const w=paper.width,h=paper.height,wide=book.dataset.spread==='2',leafWidth=wide?w/2:w;
 const incoming=wide?capturePaper(book):null;
 const layer=document.createElement('div');layer.className='paper-turn-layer hinged-turn';layer.setAttribute('aria-hidden','true');layer.inert=true;
 Object.assign(layer.style,{left:'0',top:'0',width:w+'px',height:h+'px',perspective:Math.max(1000,w*1.8)+'px'});
 // The unturned side stays in place while the incoming leaf lands over it.
 if(wide){
  const resting=paper.copy.cloneNode(true);
  resting.style.clipPath=direction>0?'inset(0 50% 0 0)':'inset(0 0 0 50%)';
  layer.append(resting);
 }
 const sheet=document.createElement('div');sheet.className='turn-sheet';
 Object.assign(sheet.style,{left:(wide&&direction>0?w/2:0)+'px',width:leafWidth+'px',transformOrigin:direction>0?'left center':'right center'});
 const face=(name,snapshot,offset)=>{
  const el=document.createElement('div');el.className='turn-face '+name;
  if(snapshot){snapshot.style.left=-offset+'px';el.append(snapshot)}
  const shading=document.createElement('div');shading.className='turn-face-shading';el.append(shading);
  return el;
 };
 const front=face('turn-front',paper.copy,wide&&direction>0?w/2:0);
 const back=face('turn-back',incoming?.copy,wide&&direction<0?w/2:0);
 sheet.append(front,back);layer.append(sheet);book.append(layer);
 let progress=0,frame=0,closed=false,settling=false;
 const clean=()=>{cancelAnimationFrame(frame);layer.remove();if(activeTurn===controller)activeTurn=null;closed=true};
 const paint=value=>{
  if(closed)return;progress=clampTurn(value);layer.dataset.progress=progress.toFixed(3);
  sheet.style.transform=`rotateY(${turnAngle(direction,progress)}deg)`;
  const shade=Math.sin(Math.PI*progress);
  sheet.style.boxShadow=`${direction*-8*shade}px 2px ${18*shade}px rgb(0 0 0 / ${.13*shade})`;
  front.lastElementChild.style.opacity=String(.14*shade);
  back.lastElementChild.style.opacity=String(.1*shade);
 };
 const controller={
  setProgress:paint,
  settle(complete=true){
   if(closed||settling)return;settling=true;
   const from=progress,to=complete?1:0,duration=settleDuration(from,complete),start=performance.now();
   function tick(now){
    if(closed)return;
    const t=Math.min(1,(now-start)/duration),ease=1-Math.pow(1-t,3);
    paint(from+(to-from)*ease);
    if(t<1)frame=requestAnimationFrame(tick);else {clean();(complete?onComplete:onCancel)()}
   }
   frame=requestAnimationFrame(tick);
  },
  cancel(){if(closed)return;clean();onCancel()}
 };
 activeTurn=controller;paint(0);return controller;
}
export function paperTurn(direction,paper,book){const turn=beginPaperTurn(direction,paper,book);turn?.settle()}
