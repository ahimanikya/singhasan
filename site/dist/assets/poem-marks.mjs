// UTF-16 offsets are snapped to full grapheme boundaries before rendering.
export function snap(text,start,end,language){
 const boundaries=[0,...Array.from(new Intl.Segmenter(language,{granularity:'grapheme'}).segment(text),x=>x.index+x.segment.length)];
 return [Math.max(...boundaries.filter(x=>x<=start)),Math.min(...boundaries.filter(x=>x>=end))];
}
export function normalized(input,texts,language){
 const valid=[];
 for(const m of input){
  if(!m||typeof m!=='object'||!Number.isInteger(m.line))continue;
  const text=texts[m.line];
  if(typeof text!=='string'||!Number.isInteger(m.start)||!Number.isInteger(m.end)||m.start<0||m.end>text.length||m.start>=m.end)continue;
  const [start,end]=snap(text,m.start,m.end,language);valid.push({line:m.line,start,end});
 }
 valid.sort((a,b)=>a.line-b.line||a.start-b.start);const merged=[];
 for(const m of valid){const prev=merged.at(-1);if(prev&&prev.line===m.line&&m.start<=prev.end)prev.end=Math.max(prev.end,m.end);else merged.push({...m});}
 return merged;
}
export function subtract(marks,cuts){
 let result=marks.map(m=>({...m}));
 for(const cut of cuts){const next=[];for(const m of result){
  if(m.line!==cut.line||cut.end<=m.start||cut.start>=m.end)next.push(m);
  else{if(m.start<cut.start)next.push({...m,end:cut.start});if(m.end>cut.end)next.push({...m,start:cut.end});}
 }result=next;}
 return result;
}

export function poemMarkKey(id,language){return `singhasan-poem-marks-v1:${id}:${language}`;}
export function stanzaLines(variant){return variant.stanzas.flat();}
