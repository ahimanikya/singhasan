import {cueAt,cueForAnchor,validateCues,clampPlaybackTime} from './read-along-state.mjs';
const $=s=>document.querySelector(s),tracks=JSON.parse($('#read-along-catalog').textContent),frame=$('#follow-book'),audio=$('#follow-audio'),play=$('#follow-play'),seek=$('#follow-seek'),status=$('#follow-status'),follow=$('#follow-auto'),continuous=$('#follow-continuous'),query=new URLSearchParams(location.search);
const key='singhasan-read-along-v1',cache=new Map();
let saved={};try{saved=JSON.parse(localStorage.getItem(key))||{}}catch{}
let preferFollowing=saved.follow!==false;
let quiet=query.has('quiet')?query.get('quiet')==='1':typeof saved.quiet==='boolean'?saved.quiet:false;
if(!query.has('quiet')&&typeof saved.quiet!=='boolean'){try{quiet=localStorage.getItem('singhasan-book-quiet-v1')==='true'}catch{}}
let index=0,cues=[],frameDoc=null,frameReady=false,cuesReady=false,loading=0,highlight=null,syncing=false,pendingTime=null,requestedFrame=null,autoplayTicket=0,lastSave=0,playingIntent=false;
const format=t=>`${Math.floor(Math.max(0,t)/60)}:${String(Math.floor(Math.max(0,t)%60)).padStart(2,'0')}`;
const safeToFollow=()=>tracks[index].syncSafe!==false;
function setStatus(message=''){status.textContent=[safeToFollow()?'':tracks[index].syncNote||'Turn the pages manually for this recording.',message].filter(Boolean).join(' ')}
function save(){try{localStorage.setItem(key,JSON.stringify({id:tracks[index].id,time:pendingTime===null?audio.currentTime:clampPlaybackTime(pendingTime,tracks[index].duration_seconds),speed:audio.playbackRate,quiet,follow:preferFollowing,continuous:continuous.checked}))}catch{}}
function updateURL(){const u=new URL(location.href);u.search='';u.searchParams.set('track',tracks[index].id);u.searchParams.set('quiet',quiet?'1':'0');history.replaceState(null,'',u)}
function clearHighlight(){if(highlight){highlight.classList.remove('audio-stanza');highlight=null}}
function paint(){seek.max=Number.isFinite(audio.duration)?audio.duration:tracks[index].duration_seconds;seek.value=audio.currentTime;seek.setAttribute('aria-valuetext',`${format(audio.currentTime)} of ${format(Number(seek.max))}`);$('#follow-time').textContent=`${format(audio.currentTime)} / ${format(Number(seek.max))}`;const waiting=autoplayTicket===loading;play.textContent=audio.paused&&!waiting?'Play':'Pause';play.setAttribute('aria-label',audio.paused&&!waiting?'Play reading':'Pause reading')}
function sync(force=false){
 if(!safeToFollow()){clearHighlight();return}
 if(syncing||!frameReady||!frameDoc||!cuesReady||audio.paused&&!force)return;const cue=cueAt(cues,audio.currentTime);clearHighlight();
 if(frameDoc.querySelector('#experience-verse')?.lang!=='or')return;
 const position=cue||cues.findLast(c=>c.start<=audio.currentTime&&c.score>=.1);if(!position)return;
 if(follow.checked){syncing=true;try{frameDoc.dispatchEvent(new frame.contentWindow.CustomEvent('book-follow-anchor',{detail:{line:position.line,offset:position.offset,animate:!force}}))}finally{syncing=false}}
 if(!cue)return;const line=frameDoc.querySelector(`[data-line="${cue.line}"]`);if(line){highlight=line.closest('.stanza');highlight?.classList.add('audio-stanza')}
}
async function start(ticket=loading){
 if(ticket!==loading)return;
 if(!frameReady||!cuesReady||audio.readyState<1){autoplayTicket=ticket;setStatus('Opening the reading…');paint();return}
 autoplayTicket=0;
 try{await audio.play();if(ticket!==loading)return;setStatus(cues.length||!safeToFollow()?'':'Listen and turn the pages at your own pace.')}catch{if(ticket===loading){playingIntent=false;setStatus('Press play to continue listening.')}}if(ticket===loading)paint();
}
function finishLoading(){
 if(!cuesReady||audio.readyState<1)return;
 if(pendingTime!==null){audio.currentTime=clampPlaybackTime(pendingTime,audio.duration);pendingTime=null}
 if(frameReady){sync(true);if(autoplayTicket===loading)start(loading)}
}
function frameRoute(track){const route=track.id==='welcome'?'book.html':track.id==='closing'?'back-cover.html':track.id==='introduction'?'intro.html':`poem-${track.poem}.html`;return `${route}?view=book&quiet=${quiet?'1':'0'}`}
async function loadCues(track){
 if(!track.sync||track.syncSafe===false)return [];
 try{if(!cache.has(track.id)){const response=await fetch(track.sync);if(!response.ok)throw Error();const data=await response.json();if(!validateCues(data,track))throw Error();cache.set(track.id,data.cues)}return cache.get(track.id)}catch{return []}
}
async function select(n,{autoplay=false,time=0,keepFrame=false,anchor=null}={}){
 const ticket=++loading;audio.pause();clearHighlight();index=Math.max(0,Math.min(tracks.length-1,n));cues=[];cuesReady=false;pendingTime=time;frameReady=keepFrame&&!!frameDoc&&(!frameDoc.querySelector('#experience-verse')||frameDoc.body.classList.contains('pagination-on'));autoplayTicket=autoplay?ticket:0;
 const track=tracks[index];audio.src=track.src;audio.playbackRate=Number($('#follow-speed').value);audio.load();
 $('#follow-label').textContent=track.label;$('#follow-previous').disabled=index===0;$('#follow-next').disabled=index===tracks.length-1;
 setStatus('Opening the reading…');follow.disabled=!safeToFollow();follow.checked=safeToFollow()&&preferFollowing;$('#follow-resume').hidden=!safeToFollow()||follow.checked;updateURL();paint();
 if(!keepFrame){requestedFrame=frameRoute(track).split('?')[0];frame.src=frameRoute(track)}
 const result=await loadCues(track);if(ticket!==loading)return;cues=result;cuesReady=true;
 if(anchor&&cues.length)pendingTime=cueForAnchor(cues,anchor.line,anchor.offset)?.start||0;
 setStatus(!safeToFollow()?'Press play to listen.':cues.length?'Press play. The pages will follow the reading.':track.poem||track.id==='introduction'?'Page following is not available for this reading yet.':'Press play to listen.');
 finishLoading();
}
function manualBrowse(){if(syncing||!safeToFollow())return;follow.checked=false;$('#follow-resume').hidden=false;setStatus('Browse freely. Resume following to return to the reading.')}
frame.addEventListener('load',()=>{
 const doc=frame.contentDocument;if(!doc)return;
 const path=frame.contentWindow.location.pathname.split('/').pop();
 // A late load from a superseded chapter must never select its recording again.
 if(requestedFrame&&path!==requestedFrame)return;requestedFrame=null;
 const next=tracks.findIndex(t=>frameRoute(t).split('?')[0]===path);
 if(next<0){location.href=frame.contentWindow.location.href;return}
 frameDoc=doc;frameReady=!doc.querySelector('#experience-verse')||doc.body.classList.contains('pagination-on');
 if(next!==index){const wasPlaying=!audio.paused||autoplayTicket===loading;select(next,{autoplay:wasPlaying,keepFrame:true})}
 const exit=doc.querySelector('.exit-reader');if(exit)exit.target='_top';
 doc.addEventListener('book-manual-turn',manualBrowse);
 doc.addEventListener('book-page-rendered',()=>{if(frameDoc!==doc)return;frameReady=doc.body.classList.contains('pagination-on');finishLoading()});
 doc.addEventListener('book-mode-changed',()=>{if(frameDoc!==doc)return;quiet=doc.body.classList.contains('quiet-mode');updateURL();save();sync(true)});
 doc.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');if(!link)return;const url=new URL(link.href),route=url.pathname.split('/').pop();
  if(url.origin!==location.origin||!tracks.some(t=>frameRoute(t).split('?')[0]===route)||link.classList.contains('exit-reader')||(!url.searchParams.has('view')&&!/^(book|back-cover)\.html$/.test(route))){link.target='_top';return}
  event.preventDefault();const next=tracks.findIndex(t=>frameRoute(t).split('?')[0]===route);select(next,{autoplay:!audio.paused});
 });
 finishLoading();
});
audio.addEventListener('loadedmetadata',()=>{audio.playbackRate=Number($('#follow-speed').value);finishLoading();paint()});
audio.addEventListener('timeupdate',()=>{paint();sync();if(Date.now()-lastSave>2000){save();lastSave=Date.now()}});
audio.addEventListener('play',()=>{playingIntent=true;paint();setStatus();sync(true)});audio.addEventListener('pause',()=>{if(!audio.ended)playingIntent=false;paint();save()});
audio.addEventListener('seeked',()=>{paint();sync(true);save()});
audio.addEventListener('ended',()=>{clearHighlight();if(playingIntent&&continuous.checked&&index<tracks.length-1)select(index+1,{autoplay:true});else {setStatus(index===tracks.length-1?'You’ve reached the end of the book.':'This reading has ended.');save()}});
audio.addEventListener('error',()=>{autoplayTicket=0;playingIntent=false;setStatus('The recording could not load. Press play to try again.');paint()});
play.onclick=()=>{if(audio.paused){if(autoplayTicket===loading){autoplayTicket=0;setStatus('Press play when you’re ready.');paint()}else{if(audio.error)audio.load();start()}}else audio.pause()};
$('#follow-back').onclick=()=>{if(audio.readyState<1)return;pendingTime=null;audio.currentTime=Math.max(0,audio.currentTime-10);sync(true)};
seek.addEventListener('input',()=>{if(audio.readyState<1)return;pendingTime=null;audio.currentTime=clampPlaybackTime(Number(seek.value),audio.duration);paint();sync(true)});
$('#follow-speed').onchange=()=>{audio.playbackRate=Number($('#follow-speed').value);save()};
$('#follow-previous').onclick=()=>select(index-1,{autoplay:!audio.paused||autoplayTicket===loading});$('#follow-next').onclick=()=>select(index+1,{autoplay:!audio.paused||autoplayTicket===loading});
follow.onchange=()=>{if(!safeToFollow()){follow.checked=false;$('#follow-resume').hidden=true;setStatus();return}preferFollowing=follow.checked;save();$('#follow-resume').hidden=follow.checked;if(follow.checked){sync(true);setStatus('The pages are following the reading.')}else setStatus('Browse freely. Resume following to return to the reading.')};
$('#follow-resume').onclick=()=>{if(!safeToFollow())return;follow.checked=true;follow.dispatchEvent(new Event('change'))};
continuous.onchange=save;window.addEventListener('pagehide',()=>{autoplayTicket=0;save();audio.pause()});
if([...$('#follow-speed').options].some(o=>Number(o.value)===saved.speed))$('#follow-speed').value=String(saved.speed);
if(typeof saved.continuous==='boolean')continuous.checked=saved.continuous;
const requested=query.get('track')||saved.id||'welcome',initial=tracks.findIndex(t=>t.id===requested),explicitTime=query.has('time')&&Number.isFinite(Number(query.get('time'))),hasAnchor=query.has('line')&&!explicitTime;
select(initial<0?0:initial,{time:explicitTime?Number(query.get('time')):hasAnchor?0:saved.id===requested?Number(saved.time)||0:0,anchor:hasAnchor?{line:Number(query.get('line'))||0,offset:Number(query.get('offset'))||0}:null});
