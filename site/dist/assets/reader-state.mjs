/* Stable source anchors survive mode switches, text reflow and old saved places. */
export function legacyAnchor(unit){return {line:Math.max(0,Math.floor(unit/1000000)),offset:Math.max(0,unit)%1000000}}
export function bookURL(route,{quiet=false,language='or',line,offset=0,last=false}={}){
 if(!/^(intro|poem-([1-9]|[1-5][0-9]|6[0-8])|book|back-cover|contents)\.html$/.test(route))route='book.html';
 const query=new URLSearchParams({view:'book',quiet:quiet?'1':'0'});
 if(language!=='or'&&/^[a-z]{2,3}$/.test(language))query.set('lang',language);
 if(Number.isInteger(line)&&line>=0){query.set('line',line);query.set('offset',Math.max(0,Number(offset)||0))}
 if(last)query.set('leaf','last');return route+'?'+query;
}

export function leafNumbers({quiet,mobile,index,textColumns}){
 const opening=quiet?0:(mobile?2:1),spread=mobile?1:2,total=textColumns+(quiet?0:2);
 const first=index<opening?(mobile?index+1:1):(quiet?0:2)+(index-opening)*spread+1;
 return {first,second:spread===2&&first<total?first+1:null,total};
}
