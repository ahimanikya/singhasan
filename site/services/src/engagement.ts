type Runtime = {firebase:{enabled:boolean,projectId:string,apiKey:string,authDomain:string,appId:string,allowedHosts:string[]},engagement:{likes?:boolean,publicComments?:boolean}};
const section=document.querySelector<HTMLElement>('[data-poem-engagement]');
if(section&&document.body.classList.contains('standalone-page')) void start(section);
async function start(section:HTMLElement){
 const poemId=section.dataset.poemEngagement!;
 const likes=[...document.querySelectorAll<HTMLButtonElement>('[data-like]')];
 const busy=(value:boolean)=>likes.forEach(button=>{button.disabled=value;});
 const likeStatus=section.querySelector<HTMLElement>('[data-like-status]')!;
 const details=section.querySelector<HTMLDetailsElement>('details')!;
 const list=section.querySelector<HTMLElement>('[data-comments-list]')!;
 const more=section.querySelector<HTMLButtonElement>('[data-comments-more]')!;
 const form=section.querySelector<HTMLFormElement>('form')!;
 const status=form.querySelector<HTMLElement>('[role="status"]')!;
 let runtime:Runtime;
 try{const response=await fetch('runtime-config.json');if(!response.ok)return;runtime=await response.json();}catch{return;}
 const f=runtime.firebase;
 if(!f?.enabled||location.protocol!=='https:'||!f.allowedHosts?.includes(location.hostname)||!/^([1-9]|[1-5][0-9]|6[0-8])$/.test(poemId))return;
 const likesEnabled=runtime.engagement.likes===true,commentsEnabled=runtime.engagement.publicComments===true;
 if(!likesEnabled&&!commentsEnabled)return;
 section.querySelector<HTMLElement>('[data-service-note]')!.hidden=true;section.querySelector<HTMLFieldSetElement>('fieldset')!.disabled=false;likes.forEach(button=>{button.hidden=!likesEnabled;});details.hidden=!commentsEnabled;
 let service:Promise<any>|undefined;
 const connect=()=>service??=(async()=>{
  const [app,auth,store]=await Promise.all([import('firebase/app'),import('firebase/auth'),import('firebase/firestore')]);
  const instance=app.getApps().find(a=>a.name==='singhasan-engagement')||app.initializeApp(f,'singhasan-engagement');
  return {auth,store,instance,db:store.getFirestore(instance)};
 })().catch(error=>{service=undefined;throw error;});
 const identity=async(s:any)=>{const auth=s.auth.getAuth(s.instance);await auth.authStateReady();return auth.currentUser||(await s.auth.signInAnonymously(auth)).user;};
 let liked=false;
 const showLike=(count:number)=>likes.forEach(button=>{
  button.setAttribute('aria-pressed',String(liked));
  const label=(liked?'Remove your like':'Like this poem')+(count>0?`. ${count} ${count===1?'like':'likes'}`:'');
  button.setAttribute('aria-label',label);button.title=label;
  const text=button.querySelector('[data-like-label]');if(text)text.textContent=liked?'Liked':'Like';
  const total=button.querySelector<HTMLElement>('[data-like-count]')!;total.textContent=String(count);total.hidden=count===0&&!text;
 });
 // One public count read. Anonymous sign-in is reserved for a reader action.
 if(likesEnabled){busy(true);connect().then(async s=>{
  const auth=s.auth.getAuth(s.instance);await auth.authStateReady();
  const snap=await s.store.getDoc(s.store.doc(s.db,'poemStats',poemId));
  if(auth.currentUser){const vote=await s.store.getDoc(s.store.doc(s.db,'poemLikes',poemId,'voters',auth.currentUser.uid));liked=vote.exists()&&vote.data().liked===true;}
  showLike(snap.exists()?snap.data().likes:0);
 }).catch(()=>{likeStatus.textContent='The like count is unavailable. You can try again.';}).finally(()=>{busy(false);});}
 const toggleLike=async()=>{
  if(!likesEnabled||likes.some(button=>button.disabled))return;
  busy(true);likeStatus.textContent='Saving…';
  try{
   const s=await connect(),user=await identity(s),voter=s.store.doc(s.db,'poemLikes',poemId,'voters',user.uid),stats=s.store.doc(s.db,'poemStats',poemId);
   const result=await s.store.runTransaction(s.db,async(tx:any)=>{
    const [vote,total]=await Promise.all([tx.get(voter),tx.get(stats)]);
    const next=!(vote.exists()&&vote.data().liked===true),count=(total.exists()?total.data().likes:0)+(next?1:-1);
    tx.set(voter,{liked:next,updatedAt:s.store.serverTimestamp()});
    tx.set(stats,{likes:count,updatedAt:s.store.serverTimestamp()});return {liked:next,count};
   });
   liked=result.liked;showLike(result.count);likeStatus.textContent=liked?'Thank you. Your like is saved.':'Your like was removed.';
  }catch{likeStatus.textContent='Your like could not be saved. Please try again.';}finally{busy(false);}
 };
 likes.forEach(button=>button.addEventListener('click',toggleLike));
 let cursor:any,loaded=false,loading=false;
 async function loadComments(){
  if(loading)return;loading=true;more.disabled=true;
  if(!loaded)list.textContent='Loading comments…';
  try{
   const s=await connect(),clauses=[s.store.where('poemId','==',poemId),s.store.orderBy('publishedAt','desc'),s.store.limit(20)];
   if(cursor)clauses.push(s.store.startAfter(cursor));
   const result=await s.store.getDocs(s.store.query(s.store.collection(s.db,'publicComments'),...clauses));
   if(!loaded)list.replaceChildren();
   for(const item of result.docs){
    const comment=item.data(),article=document.createElement('article'),name=document.createElement('strong'),text=document.createElement('p');
    // Comments are text, never HTML or executable links.
    name.textContent=String(comment.name);text.textContent=String(comment.message);article.append(name,text);list.append(article);
   }
   cursor=result.docs.at(-1)||cursor;more.hidden=result.size<20;loaded=true;

  }catch{if(!loaded)list.textContent='Comments could not be loaded. Please try again.';more.hidden=false;more.textContent='Try loading comments again';}
  finally{loading=false;more.disabled=false;}
 }
 details.addEventListener('toggle',()=>{if(commentsEnabled&&details.open&&!loaded)void loadComments();});
 // The reader may open the disclosure while runtime configuration is loading.
 if(commentsEnabled&&details.open)void loadComments();
 more.addEventListener('click',()=>void loadComments());
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const button=form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  if(button.disabled)return;
  const message=String(new FormData(form).get('message')||'').trim();
  if(!message||message.length>2000){status.textContent='Please write a comment of up to 2,000 characters.';return;}
  button.disabled=true;status.textContent='Sending…';
  try{
   const s=await connect(),user=await identity(s),ref=s.store.doc(s.store.collection(s.db,'commentSubmissions')),batch=s.store.writeBatch(s.db);
   batch.set(ref,{uid:user.uid,poemId,name:'Reader',message,status:'pending',consentVersion:'public-comments-v1',createdAt:s.store.serverTimestamp()});
   batch.set(s.store.doc(s.db,'commentThrottle',user.uid),{lastSubmittedAt:s.store.serverTimestamp(),lastCommentId:ref.id});
   await batch.commit();form.reset();status.textContent='Thank you. Your comment is awaiting review.';
  }catch{status.textContent='Your comment could not be saved. Your words are still here. If you just submitted a comment, wait a minute before trying again.';}
  finally{button.disabled=false;}
 });
}
