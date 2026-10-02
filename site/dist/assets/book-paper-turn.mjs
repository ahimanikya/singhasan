/* Kabita Live's paper curl reveals the actual next page; text stays selectable. */
let turnLayer=null,turnFrame=0;
export function cancelPaperTurn(){cancelAnimationFrame(turnFrame);turnFrame=0;turnLayer?.remove();turnLayer=null}
export function capturePaper(leaf,book){
 cancelPaperTurn();const box=leaf.getBoundingClientRect(),shell=book.getBoundingClientRect(),copy=leaf.cloneNode(true);
 const sources=[leaf,...leaf.querySelectorAll('*')],copies=[copy,...copy.querySelectorAll('*')];
 for(let i=0;i<sources.length;i++){
  const from=sources[i],to=copies[i],style=getComputedStyle(from);
  // Preserve styles that depend on IDs or the direct-child reading layout.
  if(i===0||from.id)to.style.cssText=Array.from(style,name=>name+':'+style.getPropertyValue(name)).join(';');
  for(const name of ['break-inside','orphans','widows'])to.style.setProperty(name,style.getPropertyValue(name));
  to.removeAttribute('id');to.removeAttribute('tabindex');to.removeAttribute('data-line');
 }
 copy.classList.add('turn-snapshot');Object.assign(copy.style,{position:'absolute',left:'0',top:'0',margin:'0',width:box.width+'px',height:box.height+'px',visibility:'visible',backgroundColor:getComputedStyle(book).backgroundColor});
 return {copy,width:box.width,height:box.height,left:box.left-shell.left-book.clientLeft,top:box.top-shell.top-book.clientTop};
}
export function paperTurn(direction,paper,book){
 if(!paper||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 cancelPaperTurn();
 const {copy,width:w,height:h,left,top}=paper;
 const layer=document.createElement('div');layer.className='paper-turn-layer';layer.setAttribute('aria-hidden','true');layer.inert=true;
 Object.assign(layer.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px'});
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.classList.add('turn-fold');
 const defs=document.createElementNS(ns,'defs'),gradient=document.createElementNS(ns,'linearGradient');
 gradient.id='reader-paper-fold';gradient.setAttribute('x1',direction>0?'0%':'100%');gradient.setAttribute('x2',direction>0?'100%':'0%');
 const paperColour=getComputedStyle(book).backgroundColor;
 // Narrow graphite shading at the bend; the rest remains the actual paper colour.
 for(const [offset,colour] of [['0%',paperColour],['20%',paperColour],['100%',paperColour]]){const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color',colour);gradient.append(stop)}
 defs.append(gradient);svg.append(defs);
 const fold=document.createElementNS(ns,'path');fold.setAttribute('fill','url(#reader-paper-fold)');fold.classList.add('turn-fold-paper');fold.style.filter=`drop-shadow(${direction*8}px 3px 10px rgb(38 60 60 / .15))`;
 const shadeGradient=document.createElementNS(ns,'linearGradient');shadeGradient.id='reader-paper-shade';shadeGradient.setAttribute('x1',direction>0?'0%':'100%');shadeGradient.setAttribute('x2',direction>0?'100%':'0%');
 for(const [offset,opacity] of [['0%',.20],['13%',.07],['48%',0],['100%',.045]]){const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color','#263c3c');stop.setAttribute('stop-opacity',opacity);shadeGradient.append(stop)}
 defs.append(shadeGradient);
 const shade=document.createElementNS(ns,'path');shade.setAttribute('fill','url(#reader-paper-shade)');
 svg.append(fold,shade);layer.append(copy,svg);book.append(layer);turnLayer=layer;
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
