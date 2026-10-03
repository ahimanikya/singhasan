import {test, before, after, beforeEach} from 'node:test';
import {readFileSync} from 'node:fs';
import {initializeTestEnvironment, assertFails, assertSucceeds} from '@firebase/rules-unit-testing';
import {doc, collection, writeBatch, serverTimestamp, getDoc, setDoc, updateDoc} from 'firebase/firestore';
const enabled=!!process.env.FIRESTORE_EMULATOR_HOST;
let env;
before(async()=>{if(enabled) env=await initializeTestEnvironment({projectId:'demo-singhasan-live',firestore:{rules:readFileSync('firestore.rules','utf8')}});});
beforeEach(async()=>{if(enabled) await env.clearFirestore();});
after(async()=>{if(env) await env.cleanup();});
function send(db,uid,extra={}){
  const ref=doc(collection(db,'feedback'));const batch=writeBatch(db);
  batch.set(ref,{uid,name:'Test reader',email:'reader@example.test',message:'A private test note',reason:'note',poemPath:'/poem-dokana.html',status:'received',consentVersion:'private-feedback-v1',createdAt:serverTimestamp(),...extra});
  batch.set(doc(db,'feedbackThrottle',uid),{lastSubmittedAt:serverTimestamp(),lastFeedbackId:ref.id});
  return {ref,commit:()=>batch.commit()};
}
test('valid private submission; public, own-user and cross-user reads denied; editor can read',{skip:!enabled},async()=>{
  const db=env.authenticatedContext('reader').firestore();const request=send(db,'reader');await assertSucceeds(request.commit());
  await assertFails(getDoc(request.ref));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'feedback',request.ref.id)));
  await assertFails(getDoc(doc(env.authenticatedContext('other').firestore(),'feedback',request.ref.id)));
  await assertSucceeds(getDoc(doc(env.authenticatedContext('editor',{editor:true}).firestore(),'feedback',request.ref.id)));
});
test('unauthenticated writes and forged owner denied',{skip:!enabled},async()=>{
  await assertFails(send(env.unauthenticatedContext().firestore(),'reader').commit());
  await assertFails(send(env.authenticatedContext('other').firestore(),'reader').commit());
});
test('client cannot self-approve, add fields, backdate or oversize',{skip:!enabled},async()=>{
  const db=env.authenticatedContext('reader').firestore();
  for(const extra of [{status:'approved'},{role:'editor'},{createdAt:new Date(0)},{message:'x'.repeat(5001)},{email:'invalid'}])
    await assertFails(send(db,'reader',extra).commit());
});
test('cooldown and missing atomic throttle denied',{skip:!enabled},async()=>{
  const db=env.authenticatedContext('reader').firestore();await assertSucceeds(send(db,'reader').commit());
  await assertFails(send(db,'reader').commit());
  await assertFails(setDoc(doc(collection(db,'feedback')),{uid:'reader',message:'without required fields'}));
});
test('reader cannot edit, editor can change status but not rewrite text, comments collection denied',{skip:!enabled},async()=>{
  const db=env.authenticatedContext('reader').firestore();const request=send(db,'reader');await assertSucceeds(request.commit());
  await assertFails(updateDoc(request.ref,{status:'closed'}));
  const ed=doc(env.authenticatedContext('editor',{editor:true}).firestore(),'feedback',request.ref.id);
  await assertSucceeds(updateDoc(ed,{status:'reviewed'}));await assertFails(updateDoc(ed,{message:'rewritten'}));
  await assertFails(setDoc(doc(db,'comments','test'),{text:'public comment'}));
});
