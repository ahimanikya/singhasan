/* Paint existing text ranges: never split Odia letters or change the book layout. */
export function spokenPosition(cues,time){
 let lo=0,hi=cues.length-1,last=-1;
 while(lo<=hi){const mid=(lo+hi)>>1;if(cues[mid].start<=time){last=mid;lo=mid+1}else hi=mid-1}
 const cue=cues[last],active=cue&&time<cue.end?last:-1;
 return {completed:active<0?last:last-1,active,progress:active<0?1:Math.max(0,Math.min(1,(time-cue.start)/Math.max(.001,cue.end-cue.start)))};
}
export function createSpokenProgress(doc,source){
 const verse=doc.querySelector('#experience-verse');
 if(!verse||verse.lang!=='or')return {update(){},clear(){}};
 const cues=source.filter(c=>c.score>=.1),win=doc.defaultView,registry=win.CSS?.highlights;
 const supported=!!(registry&&win.Highlight),reduced=win.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let completed=-2,active=-2,lastLine=null;
 function textRange(cue){
  const words=verse.querySelector(`[data-line="${cue.line}"] .line-words`);if(!words)return null;
  const walker=doc.createTreeWalker(words,win.NodeFilter.SHOW_TEXT);let node,at=0,start=null,end=null;
  while(node=walker.nextNode()){
   if(!start&&cue.offset<at+node.length)start=[node,Math.max(0,cue.offset-at)];
   if(start&&cue.endOffset<=at+node.length){end=[node,cue.endOffset-at];break}at+=node.length;
  }
  if(!start||!end)return null;
  const range=doc.createRange();range.setStart(...start);range.setEnd(...end);return range;
 }
 const ranges=supported?cues.map(textRange):[];
 if(supported)verse.classList.add('audio-progress');
 return {
  update(time){
   const position=spokenPosition(cues,time);
   if(supported){
    if(completed!==position.completed){completed=position.completed;registry.set('spoken-words',new win.Highlight(...ranges.slice(0,completed+1).filter(Boolean)))}
    if(active!==position.active){active=position.active;registry.set('speaking-word',new win.Highlight(...(ranges[active]?[ranges[active]]:[])))}
    verse.style.setProperty('--spoken-progress',`${reduced?100:Math.round(position.progress*100)}%`);
   }else{
    // Older browsers follow the current line with a quiet colour transition.
    const cue=cues[position.active<0?position.completed:position.active];
    const line=cue?verse.querySelector(`[data-line="${cue.line}"]`):null;
    if(line!==lastLine){lastLine?.classList.remove('audio-current-line');line?.classList.add('audio-current-line');lastLine=line}
   }
  },
  clear(){
   if(supported){registry.delete('spoken-words');registry.delete('speaking-word')}
   verse.classList.remove('audio-progress');verse.style.removeProperty('--spoken-progress');lastLine?.classList.remove('audio-current-line');
  }
 };
}
