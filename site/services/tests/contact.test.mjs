import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transform} from 'esbuild';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../src/feedback.ts',import.meta.url),'utf8').replace(/import\('firebase\/(app|auth|firestore)'\)/g,"Promise.resolve(services['$1'])");
const {code}=await transform(source,{loader:'ts',format:'esm'});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture({enabled=true,fail=false,search='?poem=poem-1.html',defer=false}={}){
 const status={textContent:''},button={},poemField={value:''},fields={disabled:true},writes=[];
 let handler,resets=0,commits=0,resolveCommit,signins=0;
 const values={name:'Reader',email:'reader@example.test',message:'A private reading note.',reason:'note'};
 const form={querySelector:s=>s.includes('role=')?status:s.includes('name=poem')?poemField:s.includes('button')?button:fields,reportValidity:()=>true,addEventListener:(_,fn)=>handler=fn,reset:()=>{resets++;poemField.value=''}};
 const auth={currentUser:null,authStateReady:async()=>{auth.currentUser={uid:'returning-reader'}}};
 const location={origin:'https://singhasan.kabitawithoutborders.org',protocol:'https:',hostname:'singhasan.kabitawithoutborders.org',search,href:''};
 runInNewContext(code,{document:{querySelector:()=>form},location,URLSearchParams,fetch:async()=>({ok:true,json:async()=>({engagement:{privateFeedback:enabled},firebase:{enabled:true,projectId:'singhasan',apiKey:'public-key',authDomain:'singhasan.firebaseapp.com',appId:'app',allowedHosts:['singhasan.kabitawithoutborders.org']}})}),FormData:class{get(key){return values[key]}},services:{app:{getApps:()=>[],initializeApp:()=>({})},auth:{getAuth:()=>auth,signInAnonymously:async()=>{signins++;return{user:{uid:'new'}}}},firestore:{getFirestore:()=>({}),collection:(_,name)=>name,doc:(...args)=>({id:'test-feedback-id',path:args.join('/')}),serverTimestamp:()=>123,writeBatch:()=>({set:(ref,data)=>writes.push({ref,data}),commit:async()=>{commits++;if(defer)await new Promise(r=>resolveCommit=r);if(fail)throw Error('offline')}})}}});
 await tick();return {status,button,poemField,location,values,writes,submit:()=>handler({preventDefault(){}}),resets:()=>resets,commits:()=>commits,signins:()=>signins,release:()=>resolveCommit()};
}
test('private form saves one atomic message and throttle, uses restored identity and confirms after success',async()=>{
 const f=await fixture();await f.submit();assert.equal(f.writes.length,2);assert.equal(f.commits(),1);assert.equal(f.signins(),0);assert.equal(f.writes[0].data.uid,'returning-reader');assert.equal(f.writes[0].data.poemPath,'/poem-1.html');assert.equal(f.writes[0].data.status,'received');assert.equal(f.writes[1].data.lastFeedbackId,'test-feedback-id');assert.equal(f.resets(),1);assert.equal(f.poemField.value,'/poem-1.html');assert.match(f.status.textContent,/received/);assert.equal(f.location.href,'');
});
test('a repeated click cannot duplicate an in-flight message',async()=>{
 const f=await fixture({defer:true});const pending=f.submit();await tick();assert.equal(f.button.disabled,true);await f.submit();assert.equal(f.commits(),1);assert.doesNotMatch(f.status.textContent,/received/);f.release();await pending;assert.equal(f.button.disabled,false);
});
test('failed submission preserves the message and allows retry',async()=>{
 const f=await fixture({fail:true});await f.submit();assert.equal(f.resets(),0);assert.equal(f.button.disabled,false);assert.match(f.status.textContent,/could not be saved/);assert.equal(f.location.href,'');
});
test('unavailable service never opens email or claims receipt',async()=>{
 const f=await fixture({enabled:false});await f.submit();assert.equal(f.commits(),0);assert.equal(f.button.disabled,true);assert.equal(f.location.href,'');assert.match(f.status.textContent,/unavailable/);
});
test('external poem context is excluded from the stored private message',async()=>{
 const f=await fixture({search:'?poem=https://untrusted.example'});await f.submit();assert.equal(f.writes[0].data.poemPath,'');
});
test('blank message and invalid email are rejected before Firebase writes',async()=>{
 for(const invalid of [{message:'  '},{email:'invalid'},{reason:'admin'}]){const f=await fixture();Object.assign(f.values,invalid);await f.submit();assert.equal(f.commits(),0);assert.match(f.status.textContent,/Please enter/);}
});
