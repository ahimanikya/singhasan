import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transform} from 'esbuild';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../src/engagement.ts',import.meta.url),'utf8').replace(/import\('firebase\/(app|auth|firestore)'\)/g, "Promise.resolve(services['$1'])");
const {code}=await transform(source,{loader:'ts'});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture({fail=false,enabled=true,commentsOpen=false}={}){
 const buttons=[true].map(hasLabel=>{
  const count={hidden:false,textContent:''},label={textContent:''};
  return {disabled:true,attrs:{},count,label,querySelector:s=>s==='[data-like-label]'?(hasLabel?label:null):count,setAttribute(k,v){this.attrs[k]=v},addEventListener(_,fn){this.click=fn}};
 });
 const status={textContent:''},details={open:commentsOpen,addEventListener(_,fn){this.toggle=fn}},form={querySelector:()=>({}),addEventListener(){}},field={disabled:true},note={hidden:false};
 const comments={textContent:'',childElementCount:0,replaceChildren(){this.textContent=''}};
 const section={dataset:{poemEngagement:'1'},querySelector:s=>({'[data-like-status]':status,details,form,fieldset:field,'[data-service-note]':note,'[data-comments-list]':comments,'[data-comments-more]':{addEventListener(){}}}[s]||{})};
 let storedCount=0,storedLike=false,transactions=0,reads=0,release;
 const store={where:()=>({}),orderBy:()=>({}),limit:()=>({}),collection:()=>({}),query:()=>({}),getDocs:async()=>{reads++;return{docs:[],size:0}},doc:(_, ...path)=>path.join('/'),getDoc:async()=>({exists:()=>false}),serverTimestamp:()=>0,runTransaction:async(_,fn)=>{
  transactions++;await new Promise(resolve=>release=resolve);if(fail)throw Error('offline');
  return fn({get:async path=>({exists:()=>true,data:()=>path.startsWith('poemStats')?{likes:storedCount}:{liked:storedLike}}),set:(path,data)=>{if(path.startsWith('poemStats'))storedCount=data.likes;else storedLike=data.liked}});
 }};
 const auth={authStateReady:async()=>{},currentUser:null};
 runInNewContext(code,{document:{body:{classList:{contains:()=>true}},querySelector:()=>section,querySelectorAll:()=>buttons},location:{protocol:'https:',hostname:'singhasan.poemwithoutborders.org'},fetch:async()=>({ok:true,json:async()=>({firebase:{enabled,allowedHosts:['singhasan.poemwithoutborders.org']},engagement:{likes:true,publicComments:true}})}),services:{app:{getApps:()=>[],initializeApp:()=>({})},auth:{getAuth:()=>auth,signInAnonymously:async()=>({user:{uid:'reader'}})},firestore:{...store,getFirestore:()=>({})}}});
 await tick();return {buttons,status,comments,details,reads:()=>reads,release:()=>release(),transactions:()=>transactions};
}
test('the response heart prevents duplicate votes and preserves saved state, undo, and accessible count',async()=>{
 const f=await fixture();
 assert.ok(f.buttons.every(b=>!b.disabled&&b.count.hidden===!b.querySelector('[data-like-label]')));
 const pending=f.buttons[0].click();await tick();
 assert.ok(f.buttons.every(b=>b.disabled));await f.buttons[0].click();assert.equal(f.transactions(),1);
 f.release();await pending;
 assert.ok(f.buttons.every(b=>b.attrs['aria-pressed']==='true'&&b.count.textContent==='1'&&!b.count.hidden&&!b.disabled));
 assert.match(f.buttons[0].attrs['aria-label'],/1 like$/);
 const undo=f.buttons[0].click();await tick();f.release();await undo;
 assert.ok(f.buttons.every(b=>b.attrs['aria-pressed']==='false'&&b.count.hidden===!b.querySelector('[data-like-label]')));
 assert.equal(f.transactions(),2);
});
test('a failed vote leaves the response heart unchanged and available to retry',async()=>{
 const f=await fixture({fail:true});const pending=f.buttons[0].click();await tick();f.release();await pending;
 assert.ok(f.buttons.every(b=>b.attrs['aria-pressed']==='false'&&!b.disabled&&b.count.hidden===!b.querySelector('[data-like-label]')));assert.match(f.status.textContent,/could not be saved/);
});
test('disabled service never enables the response heart',async()=>{
 const f=await fixture({enabled:false});assert.ok(f.buttons.every(b=>b.disabled&&!b.click));assert.equal(f.transactions(),0);
});

test('comments opened before service initialization still load without another click',async()=>{
 const f=await fixture({commentsOpen:true});assert.equal(f.reads(),1);assert.match(f.comments.textContent,/Be the first/);
 f.details.toggle();await tick();assert.equal(f.reads(),1);
});
test('closed comments stay lazy and load once when opened',async()=>{
 const f=await fixture();assert.equal(f.reads(),0);f.details.open=true;f.details.toggle();await tick();
 assert.equal(f.reads(),1);assert.match(f.comments.textContent,/Be the first/);
});
