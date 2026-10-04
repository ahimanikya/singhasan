import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transform} from 'esbuild';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../src/engagement.ts',import.meta.url),'utf8').replace(/import\('firebase\/(app|auth|firestore)'\)/g, "Promise.resolve(services['$1'])");
const {code}=await transform(source,{loader:'ts'});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture({fail=false,enabled=true}={}){
 const buttons=[true,false].map(hasLabel=>{
  const count={hidden:false,textContent:''},label={textContent:''};
  return {disabled:true,attrs:{},count,label,querySelector:s=>s==='[data-like-label]'?(hasLabel?label:null):count,setAttribute(k,v){this.attrs[k]=v},addEventListener(_,fn){this.click=fn}};
 });
 const status={textContent:''},details={addEventListener(){}},form={querySelector:()=>({}),addEventListener(){}},field={disabled:true},note={hidden:false};
 const section={dataset:{poemEngagement:'1'},querySelector:s=>({'[data-like-status]':status,details,form,fieldset:field,'[data-service-note]':note,'[data-comments-more]':{addEventListener(){}}}[s]||{})};
 let storedCount=0,storedLike=false,transactions=0,release;
 const store={doc:(_, ...path)=>path.join('/'),getDoc:async()=>({exists:()=>false}),serverTimestamp:()=>0,runTransaction:async(_,fn)=>{
  transactions++;await new Promise(resolve=>release=resolve);if(fail)throw Error('offline');
  return fn({get:async path=>({exists:()=>true,data:()=>path.startsWith('poemStats')?{likes:storedCount}:{liked:storedLike}}),set:(path,data)=>{if(path.startsWith('poemStats'))storedCount=data.likes;else storedLike=data.liked}});
 }};
 const auth={authStateReady:async()=>{},currentUser:null};
 runInNewContext(code,{document:{body:{classList:{contains:()=>true}},querySelector:()=>section,querySelectorAll:()=>buttons},location:{protocol:'https:',hostname:'singhasan.poemwithoutborders.org'},fetch:async()=>({ok:true,json:async()=>({firebase:{enabled,allowedHosts:['singhasan.poemwithoutborders.org']},engagement:{likes:true,publicComments:true}})}),services:{app:{getApps:()=>[],initializeApp:()=>({})},auth:{getAuth:()=>auth,signInAnonymously:async()=>({user:{uid:'reader'}})},firestore:{...store,getFirestore:()=>({})}}});
 await tick();return {buttons,status,release:()=>release(),transactions:()=>transactions};
}
test('both hearts share one pending vote, saved state, undo, and accessible count',async()=>{
 const f=await fixture();
 assert.ok(f.buttons.every(b=>!b.disabled&&b.count.hidden));
 const pending=f.buttons[1].click();await tick();
 assert.ok(f.buttons.every(b=>b.disabled));await f.buttons[0].click();assert.equal(f.transactions(),1);
 f.release();await pending;
 assert.ok(f.buttons.every(b=>b.attrs['aria-pressed']==='true'&&b.count.textContent==='1'&&!b.count.hidden&&!b.disabled));
 assert.match(f.buttons[0].attrs['aria-label'],/1 like$/);
 const undo=f.buttons[0].click();await tick();f.release();await undo;
 assert.ok(f.buttons.every(b=>b.attrs['aria-pressed']==='false'&&b.count.hidden));
 assert.equal(f.transactions(),2);
});
test('a failed vote leaves both hearts unchanged and available to retry',async()=>{
 const f=await fixture({fail:true});const pending=f.buttons[1].click();await tick();f.release();await pending;
 assert.ok(f.buttons.every(b=>b.attrs['aria-pressed']==='false'&&!b.disabled&&b.count.hidden));assert.match(f.status.textContent,/could not be saved/);
});
test('disabled service never enables either heart',async()=>{
 const f=await fixture({enabled:false});assert.ok(f.buttons.every(b=>b.disabled&&!b.click));assert.equal(f.transactions(),0);
});
