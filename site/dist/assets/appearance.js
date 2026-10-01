// Shared appearance. Retain the original key to preserve the reader's selection.
(()=>{
 const key='singhasan-theme-v1',modes=['system','light','dark'],media=matchMedia('(prefers-color-scheme: dark)');
 let preference='system',buttons=[];
 try{const saved=localStorage.getItem(key);if(modes.includes(saved))preference=saved;}catch{}
 const name=value=>value[0].toUpperCase()+value.slice(1);
 function apply(){
  const dark=preference==='system'?media.matches:preference==='dark';
  document.body.classList.toggle('night',dark);
  document.body.dataset.theme=preference;
  for(const button of buttons){
   const next=modes[(modes.indexOf(preference)+1)%modes.length];
   const label='Theme: '+name(preference)+'. Switch to '+name(next)+'.';
   button.dataset.theme=preference;button.setAttribute('aria-label',label);button.title=label;
   const text=button.querySelector('.appearance-label');
   if(text)text.textContent='Theme: '+name(preference);else button.textContent='Theme: '+name(preference);
  }
 }
 function cycle(){
  preference=modes[(modes.indexOf(preference)+1)%modes.length];
  apply();try{localStorage.setItem(key,preference);}catch{}
 }
 // Runs before page content, so navigation restores the saved theme before paint.
 apply();
 media.addEventListener('change',()=>{if(preference==='system')apply();});
 document.addEventListener('DOMContentLoaded',()=>{
  buttons=[...document.querySelectorAll('[data-theme-toggle]')];
  apply();for(const button of buttons){button.hidden=false;button.addEventListener('click',cycle);}
 });
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null){preference=modes.includes(event.newValue)?event.newValue:'system';apply();}});
})();
