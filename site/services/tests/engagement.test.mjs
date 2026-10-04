import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transform} from 'esbuild';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../src/engagement.ts',import.meta.url),'utf8').replace(/import\('firebase\/(app|auth|firestore)'\)/g, "Promise.resolve(services['$1'])");
const {code}=await transform(source,{loader:'ts'});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture({fail=false,enabled=true,commentsOpen=false,failComment=false}={}){
 const buttons=[true].map(hasLabel=>{
  const count={hidden:false,textContent:''},label={textContent:''};
  return {disabled:true,attrs:{},count,label,querySelector:s=>s==='[data-like-label]'?(hasLabel?label:null):count,setAttribute(k,v){this.attrs[k]=v},addEventListener(_,fn){this.click=fn}};
 });
 const commentStatus={textContent:''},submitButton={disabled:false},writes=[];
 const form={message:'',resetCount:0,reportValidity:()=>true,querySelector:s=>s==='[role="status"]'?commentStatus:submitButton,addEventListener(_,fn){this.submit=fn},reset(){this.message='';this.resetCount++}};
 const status={textContent:''},details={open:commentsOpen,addEventListener(_,fn){this.toggle=fn}},field={disabled:true},note={hidden:false};
 const comments={textContent:'',childElementCount:0,replaceChildren(){this.textContent=''}};
 const section={dataset:{poemEngagement:'1'},querySelector:s=>({'[data-like-status]':status,details,form,fieldset:field,'[data-service-note]':note,'[data-comments-list]':comments,'[data-comments-more]':{addEventListener(){}}}[s]||{})};
 let storedCount=0,storedLike=false,transactions=0,reads=0,release;
 const store={where:()=>({}),orderBy:()=>({}),limit:()=>({}),collection:()=>({}),query:()=>({}),getDocs:async()=>{reads++;return{docs:[],size:0}},writeBatch:()=>({set:(ref,data)=>writes.push(data),commit:async()=>{if(failComment)throw Error('offline')}}),doc:(_, ...path)=>path.length?path.join('/'):{id:'comment-id'},getDoc:async()=>({exists:()=>false}),serverTimestamp:()=>0,runTransaction:async(_,fn)=>{
  transactions++;await new Promise(resolve=>release=resolve);if(fail)throw Error('offline');
  return fn({get:async path=>({exists:()=>true,data:()=>path.startsWith('poemStats')?{likes:storedCount}:{liked:storedLike}}),set:(path,data)=>{if(path.startsWith('poemStats'))storedCount=data.likes;else storedLike=data.liked}});
 }};
 const auth={authStateReady:async()=>{},currentUser:null};
 runInNewContext(code,{FormData:class{constructor(form){this.form=form}get(key){return this.form[key]}},document:{body:{classList:{contains:()=>true}},querySelector:()=>section,querySelectorAll:()=>buttons},location:{protocol:'https:',hostname:'singhasan.poemwithoutborders.org'},fetch:async()=>({ok:true,json:async()=>({firebase:{enabled,allowedHosts:['singhasan.poemwithoutborders.org']},engagement:{likes:true,publicComments:true}})}),services:{app:{getApps:()=>[],initializeApp:()=>({})},auth:{getAuth:()=>auth,signInAnonymously:async()=>({user:{uid:'reader'}})},firestore:{...store,getFirestore:()=>({})}}});
 await tick();return {buttons,status,comments,details,form,commentStatus,submitButton,writes,reads:()=>reads,release:()=>release(),transactions:()=>transactions};
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
 const f=await fixture({commentsOpen:true});assert.equal(f.reads(),1);assert.equal(f.comments.textContent,'');
 f.details.toggle();await tick();assert.equal(f.reads(),1);
});
test('closed comments stay lazy and load once when opened',async()=>{
 const f=await fixture();assert.equal(f.reads(),0);f.details.open=true;f.details.toggle();await tick();
 assert.equal(f.reads(),1);assert.equal(f.comments.textContent,'');
});

test('one comment field submits for review with an anonymous display name',async()=>{
 const f=await fixture();f.form.message='  This poem stayed with me.  ';
 await f.form.submit({preventDefault(){}});
 assert.equal(f.writes.length,2);
 assert.equal(f.writes[0].message,'This poem stayed with me.');
 assert.equal(f.writes[0].name,'Reader');assert.equal(f.writes[0].status,'pending');
 assert.equal(f.writes[0].consentVersion,'public-comments-v1');
 assert.equal(f.writes[1].lastCommentId,'comment-id');
 assert.equal(f.form.message,'');assert.equal(f.form.resetCount,1);
 assert.match(f.commentStatus.textContent,/awaiting review/);assert.equal(f.submitButton.disabled,false);
});
test('blank or oversized comments never submit',async()=>{
 const f=await fixture();
 for(const value of ['   ','x'.repeat(2001)]){
  f.form.message=value;await f.form.submit({preventDefault(){}});
  assert.equal(f.writes.length,0);assert.equal(f.form.message,value);
  assert.match(f.commentStatus.textContent,/write a comment/);
 }
});
test('failed comments retain the text for retry',async()=>{
 const f=await fixture({failComment:true});f.form.message='Keep my words';
 await f.form.submit({preventDefault(){}});
 assert.equal(f.form.message,'Keep my words');assert.equal(f.form.resetCount,0);
 assert.equal(f.submitButton.disabled,false);assert.match(f.commentStatus.textContent,/could not be saved/);
});
