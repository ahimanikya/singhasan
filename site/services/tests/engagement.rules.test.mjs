import {test,before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,collection,writeBatch,serverTimestamp,getDoc,setDoc,deleteDoc,updateDoc,query,where,orderBy,limit,getDocs} from 'firebase/firestore';
const enabled=!!process.env.FIRESTORE_EMULATOR_HOST;let env;
before(async()=>{if(enabled)env=await initializeTestEnvironment({projectId:'demo-singhasan-engagement',firestore:{rules:readFileSync('firestore.rules','utf8')}});});
beforeEach(async()=>{if(enabled)await env.clearFirestore();});after(async()=>{if(env)await env.cleanup();});
const reader=uid=>env.authenticatedContext(uid).firestore();
function vote(db,uid,liked,count){const batch=writeBatch(db);batch.set(doc(db,'poemLikes','1','voters',uid),{liked,updatedAt:serverTimestamp()});batch.set(doc(db,'poemStats','1'),{likes:count,updatedAt:serverTimestamp()});return batch.commit();}
function comment(db,uid,extra={}){const ref=doc(collection(db,'commentSubmissions')),batch=writeBatch(db);batch.set(ref,{uid,poemId:'1',name:'Reader',message:'A thoughtful poem.',status:'pending',consentVersion:'public-comments-v1',createdAt:serverTimestamp(),...extra});batch.set(doc(db,'commentThrottle',uid),{lastSubmittedAt:serverTimestamp(),lastCommentId:ref.id});return {ref,commit:()=>batch.commit()};}
test('likes toggle atomically; shared count matches two private votes',{skip:!enabled},async()=>{
 const a=reader('a'),b=reader('b');await assertSucceeds(vote(a,'a',true,1));await assertSucceeds(vote(b,'b',true,2));await assertSucceeds(vote(a,'a',false,1));
 const publicDb=env.unauthenticatedContext().firestore();assert.equal((await assertSucceeds(getDoc(doc(publicDb,'poemStats','1')))).data().likes,1);
 await assertSucceeds(getDoc(doc(a,'poemLikes','1','voters','a')));await assertFails(getDoc(doc(b,'poemLikes','1','voters','a')));await assertFails(getDocs(collection(publicDb,'poemStats')));
});
test('forged, duplicate, unpaired and unauthenticated likes cannot inflate counts',{skip:!enabled},async()=>{
 const a=reader('a');await assertFails(vote(env.unauthenticatedContext().firestore(),'a',true,1));await assertFails(vote(a,'other',true,1));await assertFails(vote(a,'a',true,500));
 await assertFails(setDoc(doc(a,'poemStats','1'),{likes:1,updatedAt:serverTimestamp()}));await assertFails(setDoc(doc(a,'poemLikes','1','voters','a'),{liked:true,updatedAt:serverTimestamp()}));
 await assertSucceeds(vote(a,'a',true,1));await assertFails(vote(a,'a',true,2));await assertFails(vote(a,'a',false,-1));await assertFails(deleteDoc(doc(a,'poemLikes','1','voters','a')));
});
test('comment submission remains private and cannot self-publish or bypass cooldown',{skip:!enabled},async()=>{
 const db=reader('a'),pending=comment(db,'a');await assertSucceeds(pending.commit());
 await assertFails(getDoc(pending.ref));await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'commentSubmissions',pending.ref.id)));
 await assertFails(comment(db,'a').commit());await assertFails(updateDoc(pending.ref,{status:'published'}));
 await assertFails(setDoc(doc(db,'publicComments',pending.ref.id),{poemId:'1',name:'Reader',message:'A thoughtful poem.',publishedAt:serverTimestamp()}));
});
test('comment rules reject forged identities, extra private fields, oversized text and missing consent version',{skip:!enabled},async()=>{
 const db=reader('a');
 for(const extra of [{uid:'other'},{status:'published'},{email:'private@example.test'},{message:'x'.repeat(2001)},{name:''},{consentVersion:''},{createdAt:new Date(0)}])await assertFails(comment(db,'a',extra).commit());
 await assertFails(comment(env.unauthenticatedContext().firestore(),'a').commit());
});
test('editor publishes only approved original fields; public queries are bounded; withdrawal removes public text',{skip:!enabled},async()=>{
 const pending=comment(reader('a'),'a');await assertSucceeds(pending.commit());const ed=env.authenticatedContext('editor',{editor:true}).firestore(),pub=doc(ed,'publicComments',pending.ref.id),source=doc(ed,'commentSubmissions',pending.ref.id);
 await assertSucceeds(getDoc(source));await assertFails(setDoc(pub,{poemId:'1',name:'Reader',message:'A thoughtful poem.',publishedAt:serverTimestamp()}));
 const batch=writeBatch(ed);batch.update(source,{status:'published'});batch.set(pub,{poemId:'1',name:'Reader',message:'A thoughtful poem.',publishedAt:serverTimestamp()});await assertSucceeds(batch.commit());
 const publicDb=env.unauthenticatedContext().firestore();const rows=await assertSucceeds(getDocs(query(collection(publicDb,'publicComments'),where('poemId','==','1'),orderBy('publishedAt','desc'),limit(20))));assert.equal(rows.size,1);assert.deepEqual(Object.keys(rows.docs[0].data()).sort(),['message','name','poemId','publishedAt']);
 await assertFails(getDocs(collection(publicDb,'publicComments')));await assertFails(getDocs(query(collection(publicDb,'publicComments'),limit(21))));await assertFails(updateDoc(pub,{message:'changed'}));await assertSucceeds(deleteDoc(pub));
});
