'use strict';
for(const button of document.querySelectorAll('[data-size]'))button.addEventListener('click',()=>{document.body.style.setProperty('--reading-size',['default','24'].includes(button.dataset.size)?'':button.dataset.size+'px');for(const other of document.querySelectorAll('[data-size]'))other.setAttribute('aria-pressed',String(other===button))});
document.querySelector('.skip').addEventListener('click',event=>{event.preventDefault();document.getElementById('reading').focus();document.getElementById('reading').scrollIntoView()});
const jump=document.querySelector('.edition-jump');if(jump)jump.addEventListener('click',()=>document.getElementById('edition-poems').focus({preventScroll:true}));
const legacy=location.hash.match(/^#(preface|poem-([1-9]|[1-5][0-9]|6[0-8]))$/);
if(legacy&&!document.body.classList.contains('listening-page'))location.replace(legacy[1]==='preface'?'intro.html':legacy[1]+'.html');
