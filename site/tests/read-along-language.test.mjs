import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as cueState from '../dist/assets/read-along-state.mjs';
const code=readFileSync(new URL('../dist/assets/read-along.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture(){
 const element=()=>({hidden:false,disabled:false,checked:true,value:'1',textContent:'',listeners:{},addEventListener(event,fn){this.listeners[event]=fn},setAttribute(){}});
 const nodes=Object.fromEntries(['read-along-catalog','follow-book','follow-audio','follow-play','follow-seek','follow-status','follow-auto','follow-continuous','follow-time','follow-label','follow-previous','follow-next','follow-resume','follow-speed','follow-back'].map(id=>['#'+id,element()]));
 nodes['#read-along-catalog'].textContent=JSON.stringify([{id:'poem-1',poem:1,label:'Poem 1',src:'one.mp3',duration_seconds:60},{id:'poem-2',poem:2,label:'Poem 2',src:'two.mp3',duration_seconds:60}]);
 nodes['.follow-settings']={open:false,contains:()=>false};
 nodes['#follow-speed'].options=[{value:'1'}];
 const audio=nodes['#follow-audio'];Object.assign(audio,{paused:true,currentTime:0,duration:60,readyState:1,playbackRate:1,plays:0,pause(){this.paused=true;this.listeners.pause?.()},async play(){this.paused=false;this.plays++;this.listeners.play?.()},load(){}});
 const verse={lang:'or'},listeners={};
 const doc={querySelector:selector=>selector==='#experience-verse'?verse:null,body:{classList:{contains:()=>true}},addEventListener:(event,fn)=>listeners[event]=fn};
 const frame=nodes['#follow-book'];frame.contentDocument=doc;frame.contentWindow={location:{pathname:'/poem-1.html'}};
 runInNewContext(code,{...cueState,createSpokenProgress:()=>({update(){},clear(){}}),requestAnimationFrame:()=>1,cancelAnimationFrame(){},document:{querySelector:s=>nodes[s],addEventListener(){}},location:{href:'https://example.org/read-along.html?track=poem-1&quiet=0',search:'?track=poem-1&quiet=0',origin:'https://example.org'},history:{state:null,replaceState(){}},localStorage:{getItem:()=>null,setItem(){}},window:{addEventListener(){}},URL,URLSearchParams,Event});
 await tick();frame.listeners.load();await tick();
 return {nodes,audio,verse,change(language){verse.lang=language;listeners['reading-language-changed']()}};
}
test('switching to a translation pauses audio and disables playback; returning to Odia requires Play',async()=>{
 const f=await fixture();f.nodes['#follow-play'].onclick();await tick();assert.equal(f.audio.paused,false);
 f.change('en');assert.equal(f.audio.paused,true);assert.equal(f.nodes['#follow-play'].disabled,true);assert.equal(f.nodes['#follow-next'].disabled,true);assert.match(f.nodes['#follow-status'].textContent,/available in Odia/);
 f.nodes['#follow-play'].onclick();await tick();assert.equal(f.audio.plays,1);
 f.change('or');assert.equal(f.nodes['#follow-play'].disabled,false);assert.equal(f.nodes['#follow-next'].disabled,false);assert.equal(f.audio.paused,true);
 f.nodes['#follow-play'].onclick();await tick();assert.equal(f.audio.paused,false);assert.equal(f.audio.plays,2);
});
test('all translated language selections block Odia playback',async()=>{
 const f=await fixture();for(const language of ['en','hi','bn','ta','te','ml','kn','mr','gu','as','ur']){
  f.change(language);f.nodes['#follow-play'].onclick();await tick();assert.equal(f.audio.paused,true);assert.equal(f.nodes['#follow-play'].disabled,true);
 }assert.equal(f.audio.plays,0);
});

test('audio opens text-first even when an illustrated-mode link is supplied',async()=>{
 const f=await fixture();assert.match(f.nodes['#follow-book'].src,/quiet=1/);
 await f.nodes['#follow-next'].onclick();await tick();assert.match(f.nodes['#follow-book'].src,/poem-2.html.*quiet=1/);
});
