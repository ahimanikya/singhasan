import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cueAt,cueForAnchor,validateCues,clampPlaybackTime} from '../dist/assets/read-along-state.mjs';
const cues=[{start:2,end:3,line:0,offset:0,endOffset:8,stanza:0,score:.9},{start:4,end:5,line:0,offset:9,endOffset:16,stanza:0,score:.05},{start:8,end:9,line:1,offset:0,endOffset:8,stanza:1,score:.9}];
test('music, pauses and uncertain words do not receive invented highlights',()=>{
 assert.equal(cueAt(cues,0),null);assert.equal(cueAt(cues,2.5),cues[0]);assert.equal(cueAt(cues,3.8),null);assert.equal(cueAt(cues,4.5),null);assert.equal(cueAt(cues,8),cues[2]);assert.equal(cueAt(cues,10),null);
});
test('resuming from a reflowed source passage selects its spoken word',()=>{
 assert.equal(cueForAnchor(cues,0,10),cues[1]);assert.equal(cueForAnchor(cues,1,0),cues[2]);
});
test('a handoff time stays within the recording and malformed values cannot seek',()=>{
 assert.equal(clampPlaybackTime(40,30),29.9);assert.equal(clampPlaybackTime(12.3,30),12.3);
 assert.equal(clampPlaybackTime(-1,30),0);assert.equal(clampPlaybackTime(Infinity,30),0);assert.equal(clampPlaybackTime('not-a-time',30),0);
 assert.equal(clampPlaybackTime(10,NaN),10);assert.equal(clampPlaybackTime(10,.05),0);
});
test('replaced recordings and invalid timelines cannot drive page following',()=>{
 const track={sha256:'abc',duration_seconds:10},data={audioSha256:'abc',language:'or',cues};
 assert.equal(validateCues(data,track),true);assert.equal(validateCues(data,{...track,sha256:'new-take'}),false);
 assert.equal(validateCues({...data,cues:[cues[2],cues[0]]},track),false);
 assert.equal(validateCues({...data,cues:[{...cues[0],end:12}]},track),false);
});
test('published timings refer to the exact recording and original Odia word offsets',()=>{
 const root=new URL('../',import.meta.url),catalog=JSON.parse(fs.readFileSync(new URL('audio-edition.json',root))),book=JSON.parse(fs.readFileSync(new URL('dist/assets/reading-book.json',root)));
 for(const track of catalog.tracks){
  const path=new URL(`dist/assets/audio-sync/${track.id}.json`,root);if(!fs.existsSync(path))continue;
  const data=JSON.parse(fs.readFileSync(path));assert.equal(validateCues(data,track),true,track.id);
  const lines=book.poems.find(p=>p.id===data.section).variants.or.stanzas.flat();
  for(const c of data.cues)assert.equal(lines[c.line].slice(c.offset,c.endOffset),c.text,`${track.id} at ${c.start}`);
 }
});
