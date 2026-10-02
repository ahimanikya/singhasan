/* Pure timeline rules shared by the player and its tests. No duration estimates. */
export function clampPlaybackTime(value,duration){
 const time=Number(value);
 if(!Number.isFinite(time)||time<0)return 0;
 return Number.isFinite(duration)?Math.min(time,Math.max(0,duration-.1)):time;
}
export function cueAt(cues,time){
 let lo=0,hi=cues.length-1,found=-1;
 while(lo<=hi){const mid=(lo+hi)>>1;if(cues[mid].start<=time){found=mid;lo=mid+1}else hi=mid-1}
 if(found<0)return null;
 const cue=cues[found];
 // Clear highlights during musical breaks and uncertain acoustic matches.
 return time<=cue.end+.35&&cue.score>=.1?cue:null;
}
export function cueForAnchor(cues,line,offset=0){return cues.find(c=>c.line>line||c.line===line&&c.endOffset>offset)||cues.at(-1)||null}
export function validateCues(data,track){
 if(!data||data.audioSha256!==track.sha256||data.language!=='or'||!Array.isArray(data.cues)||!data.cues.length||!Number.isFinite(track.duration_seconds)||track.duration_seconds<=0)return false;
 let previous=0;
 for(const c of data.cues){if(!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<previous||c.end<c.start||c.end>track.duration_seconds+.1||!Number.isInteger(c.line)||c.line<0||!Number.isInteger(c.offset)||c.offset<0||!Number.isInteger(c.endOffset)||c.endOffset<=c.offset||!Number.isInteger(c.stanza)||c.stanza<0||!Number.isFinite(c.score)||c.score<0||c.score>1)return false;previous=c.end}
 return true;
}
