type Runtime = {contactEmail:string,engagement:{privateFeedback?:boolean},firebase:{enabled:boolean,projectId:string,apiKey:string,authDomain:string,appId:string,allowedHosts:string[]}};
const form = document.querySelector<HTMLFormElement>('form[data-feedback="private"]');
if (form) {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"],button')!;
  const status = form.querySelector<HTMLElement>('[role="status"]')!;
  form.querySelector<HTMLFieldSetElement>('[data-contact-fields]')!.disabled=false;
  let runtime: Runtime | undefined;
  let configured = false;
  const recipient='ahimanikya@gmail.com';
  const poemField=form.querySelector<HTMLInputElement>('[name=poem]')!;
  const poem=new URLSearchParams(location.search).get('poem');
  if(poem&&/^(intro|poem-([1-9]|[1-5][0-9]|6[0-8]))\.html$/.test(poem))poemField.value=new URL(poem,location.origin).href;
  fetch('runtime-config.json').then(r => r.ok ? r.json() : Promise.reject()).then((r:Runtime) => {
    runtime=r;
    const f=r.firebase;
    configured=!!(r.engagement?.privateFeedback===true && f?.enabled && f.projectId && f.apiKey && f.authDomain && f.appId &&
      location.protocol==='https:' && f.allowedHosts.includes(location.hostname));
    if (configured) {
      button.textContent='Send message';
      form.querySelector('.small.muted')!.textContent='Your message is private and will be stored for the poet’s family. Sending it does not publish it.';
    }
  }).catch(() => {});
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data=new FormData(form);
    const name=String(data.get('name')||'').trim();
    const email=String(data.get('email')||'').trim();
    const message=String(data.get('message')||'').trim();
    const reason=String(data.get('reason')||'note');
    let poemPath='';
    try { const url=new URL(String(data.get('poem')||'')); if(url.origin===location.origin) poemPath=url.pathname; } catch {}
    if(!name||name.length>120||!message||message.length>5000||email.length>254) {
      status.textContent='Please use a name up to 120 characters and a message up to 5,000 characters.';return;
    }
    if(!configured||!runtime) {
      location.href='mailto:'+encodeURIComponent(recipient)+'?subject='+encodeURIComponent('Singhasan — '+reason)+
        '&body='+encodeURIComponent(message+'\n\n'+name+'\n'+email+(poemPath?'\n'+new URL(poemPath,location.origin).href:''));
      status.textContent='Your email app should open a draft. Review it there and choose Send.';return;
    }
    button.disabled=true;status.textContent='Sending your private note…';
    try {
      const [{initializeApp,getApps},{getAuth,signInAnonymously},{getFirestore,doc,collection,writeBatch,serverTimestamp}]=
        await Promise.all([import('firebase/app'),import('firebase/auth'),import('firebase/firestore')]);
      const app=getApps().find(a=>a.name==='singhasan-contact')||initializeApp(runtime.firebase,'singhasan-contact');
      const auth=getAuth(app);const user=auth.currentUser||(await signInAnonymously(auth)).user;
      const db=getFirestore(app);const feedback=doc(collection(db,'feedback'));const batch=writeBatch(db);
      batch.set(feedback,{uid:user.uid,name,email,message,reason,poemPath,status:'received',
        consentVersion:'private-feedback-v1',createdAt:serverTimestamp()});
      batch.set(doc(db,'feedbackThrottle',user.uid),{lastSubmittedAt:serverTimestamp(),lastFeedbackId:feedback.id});
      await batch.commit();
      form.reset();status.textContent='Your private note has been saved for the poet’s family. Thank you.';
    } catch {
      status.textContent='Your note could not be saved. Your text is still here. Please try later or use the email link.';
    } finally {button.disabled=false;}
  });
}
