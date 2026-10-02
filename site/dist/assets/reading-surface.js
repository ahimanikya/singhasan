/* A device-local reading surface, shared by the page and its quiet reader. */
(()=>{
 const key='singhasan-reading-surface-v1',choices=['cloth','earth','monsoon'];
 let surface='cloth';
 try{const saved=localStorage.getItem(key);if(choices.includes(saved))surface=saved}catch{}
 function apply(){document.body.dataset.readingSurface=surface;document.querySelectorAll('select[data-reading-surface]').forEach(select=>select.value=surface)}
 apply();
 document.addEventListener('DOMContentLoaded',()=>{apply();document.querySelectorAll('select[data-reading-surface]').forEach(select=>select.addEventListener('change',()=>{if(!choices.includes(select.value))return;surface=select.value;apply();try{localStorage.setItem(key,surface)}catch{}}))});
 window.addEventListener('storage',event=>{if(event.key===key){surface=choices.includes(event.newValue)?event.newValue:'cloth';apply()}});
})();
