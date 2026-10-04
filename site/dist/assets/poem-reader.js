import {snap as snapRange, normalized as normalizeRanges, subtract, poemMarkKey, stanzaLines} from "./poem-marks.mjs?v=2";
(()=>{
'use strict';
const payload=document.querySelector('#reading-data');if(!payload)return;
const data=JSON.parse(payload.textContent);
const tabs=[...document.querySelectorAll('[data-reading-language]:not(:disabled)')],verse=document.querySelector('#experience-verse'),panel=document.querySelector('#reading-panel');
if(!verse||!panel)return;
const clear=document.querySelector('#clear-marks');
let language=data.source_language,marks=[],pending=[],storageOK=true;
const selectionBar=document.querySelector('#selection-tools');
const memory={};
function read(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback;}catch{storageOK=false;return memory[key]??fallback;}}
function save(key,value){memory[key]=value;try{localStorage.setItem(key,JSON.stringify(value));}catch{storageOK=false;}}
function markKey(){return poemMarkKey(data.id,language);}
function lines(){return stanzaLines(data.variants[language]);}
function snap(text,start,end){return snapRange(text,start,end,language);}
function normalized(input){return normalizeRanges(input,lines(),language);}
function appendVerseText(parent,text,start,end){
 let cursor=start;
 for(const item of (data.variants[language].inline_breaks||[]).filter(item=>item.at>start&&item.at<=end)){
  parent.append(document.createTextNode(text.slice(cursor,item.at)));
  const gap=document.createElement('span');gap.className='inline-verse-break'+(item.blank?' stanza-break':'');gap.setAttribute('aria-hidden','true');parent.append(gap);cursor=item.at;
 }
 parent.append(document.createTextNode(text.slice(cursor,end)));
}
function drawMarks(){
 verse.querySelectorAll('[data-line]').forEach(line=>{
  const n=Number(line.dataset.line),text=lines()[n],words=line.querySelector('.line-words');words.replaceChildren();let pos=0;
  for(const m of marks.filter(x=>x.line===n)){appendVerseText(words,text,pos,m.start);const span=document.createElement('span');span.className='pencil-mark';appendVerseText(span,text,m.start,m.end);words.append(span);pos=m.end;}
  appendVerseText(words,text,pos,text.length);
 });
 clear.hidden=!marks.length;
}
function selectionRanges(){
 const selection=window.getSelection();if(!selection||selection.isCollapsed||!selection.rangeCount)return [];
 const range=selection.getRangeAt(0);if(!verse.contains(range.startContainer)||!verse.contains(range.endContainer))return [];
 const result=[];
 verse.querySelectorAll('[data-line]').forEach(line=>{
  const words=line.querySelector('.line-words');if(!range.intersectsNode(words))return;
  const offset=(node,at,fallback)=>{if(node!==words&&!words.contains(node))return fallback;const prefix=document.createRange();prefix.selectNodeContents(words);prefix.setEnd(node,at);return prefix.toString().length;};
  let start=offset(range.startContainer,range.startOffset,0),end=offset(range.endContainer,range.endOffset,words.textContent.length);
  if(start===end)return;[start,end]=snap(words.textContent,start,end);result.push({line:Number(line.dataset.line),start,end});
 });return result;
}
function rememberSelection(){
 if(document.querySelector('#focus-reader')?.open){pending=[];selectionBar.hidden=true;return;}
 const selected=selectionRanges();if(selected.length){pending=selected;selectionBar.hidden=false;}
 else if(!selectionBar.contains(document.activeElement)){pending=[];selectionBar.hidden=true;}
}
function applySelection(remove=false){
 if(!pending.length){return;}
 if(remove)marks=subtract(marks,pending);else marks=normalized([...marks,...pending]);
 save(markKey(),marks);document.dispatchEvent(new CustomEvent('poem-marks-changed'));pending=[];selectionBar.hidden=true;window.getSelection()?.removeAllRanges();drawMarks();
}
function render(choice){
 const code=choice==='original'?data.source_language:choice;if(!data.variants[code])return;
 pending=[];selectionBar.hidden=true;language=code;
 const v=data.variants[code];tabs.forEach(t=>{const on=t.dataset.readingLanguage===choice;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;});
 if(tabs.length)panel.setAttribute('aria-labelledby','tab-'+choice);verse.lang=code;verse.className='verse '+code+(data.kind==='prose'?' prose':'');
 const title=document.querySelector('.poem-heading h1');title.textContent=v.title;title.lang=code;title.className=code;title.classList.toggle('long-title',Array.from(v.title).length>42);
 verse.replaceChildren();
 let idx=0;
 v.stanzas.forEach((stanza,si)=>{const p=document.createElement('p');p.className='stanza';
  stanza.forEach((text,li)=>{const lineIndex=idx++;if(text.trim()==='∎'||(v.hidden_lines||[]).includes(lineIndex))return;const line=document.createElement('span');line.className='poem-line';
   line.dataset.line=String(lineIndex);
   const words=document.createElement('span');words.className='line-words';words.textContent=text;line.append(words);p.append(line);
   if(li<stanza.length-1)p.append(document.createTextNode('\n'));
  });if(p.querySelector('.poem-line'))verse.append(p);
 });
 let saved=read(markKey(),null);
 if(saved===null&&data.id===810){
  saved=read('singhasan-reader-study-v2:810:marks:'+language,null);
  if(saved===null){const old=read('singhasan-reader-study-v1:810:marks:'+language,[]);saved=Array.isArray(old)?old.filter(n=>Number.isInteger(n)&&lines()[n]).map(n=>({line:n,start:0,end:lines()[n].length})):[];}
  save(markKey(),saved);
 }
 marks=normalized(Array.isArray(saved)?saved:[]);drawMarks();
 document.querySelectorAll('.reader-listen,[data-odia-audio]').forEach(link=>{link.hidden=language!=='or'});
 document.dispatchEvent(new CustomEvent('reading-language-changed',{detail:{language}}));
}
tabs.forEach((tab,index)=>{
 tab.addEventListener('click',()=>render(tab.dataset.readingLanguage));
 tab.addEventListener('keydown',event=>{let n=null;if(event.key==='ArrowRight')n=(index+1)%tabs.length;if(event.key==='ArrowLeft')n=(index+tabs.length-1)%tabs.length;if(event.key==='Home')n=0;if(event.key==='End')n=tabs.length-1;if(n!==null){event.preventDefault();tabs[n].focus();render(tabs[n].dataset.readingLanguage);}});
});
document.addEventListener('selectionchange',rememberSelection);
for(const button of selectionBar.querySelectorAll('button'))button.addEventListener('pointerdown',event=>event.preventDefault());
document.querySelector('#underline-selection').addEventListener('click',()=>applySelection());
document.querySelector('#erase-selection').addEventListener('click',()=>applySelection(true));
document.querySelector('#dismiss-selection').addEventListener('click',()=>{pending=[];selectionBar.hidden=true;window.getSelection()?.removeAllRanges();});
clear.addEventListener('click',()=>{marks=[];save(markKey(),marks);document.dispatchEvent(new CustomEvent('poem-marks-changed'));pending=[];selectionBar.hidden=true;window.getSelection()?.removeAllRanges();drawMarks();panel.focus();});
panel.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='u'){event.preventDefault();rememberSelection();applySelection();}});
document.addEventListener('poem-marks-changed',()=>{marks=normalized(read(markKey(),[]));drawMarks()});
render(tabs.some(t=>t.dataset.readingLanguage==='original')?'original':data.source_language);
})();
