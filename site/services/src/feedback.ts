type Runtime = {engagement:{privateFeedback?:boolean},firebase:{enabled:boolean,projectId:string,apiKey:string,authDomain:string,appId:string,allowedHosts:string[]}};
const form = document.querySelector<HTMLFormElement>('form[data-feedback="private"]');
if (form) {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const status = form.querySelector<HTMLElement>('[role="status"]')!;
  form.querySelector<HTMLFieldSetElement>('[data-contact-fields]')!.disabled=false;
  button.disabled=true;
  let runtime: Runtime | undefined, configured=false, sending=false;
  const poemField=form.querySelector<HTMLInputElement>('[name=poem]')!;
  const poem=new URLSearchParams(location.search).get('poem');
  const poemPath=poem&&/^(intro|poem-([1-9]|[1-5][0-9]|6[0-8]))\.html$/.test(poem)?'/'+poem:'';
  poemField.value=poemPath;
  const ready=fetch('runtime-config.json').then(r => r.ok ? r.json() : Promise.reject()).then((r:Runtime) => {
    runtime=r;
    const f=r.firebase;
    configured=!!(r.engagement?.privateFeedback===true && f?.enabled && f.projectId && f.apiKey && f.authDomain && f.appId &&
      location.protocol==='https:' && f.allowedHosts?.includes(location.hostname));
    button.disabled=!configured;
    if(!configured)status.textContent='This form is unavailable in the preview. Please use the contact form on the live site.';
  }).catch(() => {status.textContent='The form could not connect. Please reload the page or try again later.';});
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if(sending)return;
    sending=true;
    try {
      await ready;
      if(!configured||!runtime)return;
      if(!form.reportValidity())return;
      const data=new FormData(form);
      const name=String(data.get('name')||'').trim(),email=String(data.get('email')||'').trim();
      const message=String(data.get('message')||'').trim(),reason=String(data.get('reason')||'note');
      if(!name||name.length>120||!message||message.length>5000||email.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||!['note','correction'].includes(reason)) {
        status.textContent='Please enter your name, a valid email address and a message of up to 5,000 characters.';return;
      }
      button.disabled=true;status.textContent='Sending your private message…';
      const [{initializeApp,getApps},{getAuth,signInAnonymously},{getFirestore,doc,collection,writeBatch,serverTimestamp}]=
        await Promise.all([import('firebase/app'),import('firebase/auth'),import('firebase/firestore')]);
      const app=getApps().find(a=>a.name==='singhasan-contact')||initializeApp(runtime.firebase,'singhasan-contact');
      const auth=getAuth(app);await auth.authStateReady();
      const user=auth.currentUser||(await signInAnonymously(auth)).user;
      const db=getFirestore(app),feedback=doc(collection(db,'feedback')),batch=writeBatch(db);
      batch.set(feedback,{uid:user.uid,name,email,message,reason,poemPath,status:'received',
        consentVersion:'private-feedback-v1',createdAt:serverTimestamp()});
      batch.set(doc(db,'feedbackThrottle',user.uid),{lastSubmittedAt:serverTimestamp(),lastFeedbackId:feedback.id});
      await batch.commit();
      form.reset();poemField.value=poemPath;
      status.textContent='Your private message has been received for the poet’s family. Thank you.';
    } catch {
      status.textContent='Your message could not be saved. Your words are still here. If you just sent a message, wait a minute before trying again.';
    } finally {sending=false;button.disabled=!configured;}
  });
}
