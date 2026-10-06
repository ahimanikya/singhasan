'use strict';
(()=>{
 const button=document.querySelector('#open-share'),dialog=document.querySelector('#book-share');
 if(!button||!dialog)return;
 const url=document.querySelector('#share-url'),status=document.querySelector('#share-status'),native=document.querySelector('#native-book-share');
 let caption='',heading='';
 button.addEventListener('click',()=>{
  const link=new URL(location.href);for(const key of ['focus','start','view','page','leaf','quiet','line','offset'])link.searchParams.delete(key);link.hash='';
  const selected=document.querySelector('#book-language')?.value||document.querySelector('[data-reading-language][aria-selected=true]')?.dataset.readingLanguage;
  if(selected&&selected!=='original'&&selected!=='or')link.searchParams.set('lang',selected);else link.searchParams.delete('lang');
  url.value=link.href;status.textContent='';
  const title=document.querySelector('#chapter-title'),verse=document.querySelector('#experience-verse');
  const excerpt=(verse?.innerText||'').split('\n').filter(line=>line.trim()).slice(0,4).join('\n');
  const excerptText=excerpt.length>320?excerpt.slice(0,320).replace(/\s+\S*$/,'')+'…':excerpt;
  const cardTitle=dialog.querySelector('.share-title'),cardVerse=dialog.querySelector('.share-verse');
  dialog.querySelector('.share-book').hidden=!verse;cardVerse.hidden=!verse;heading=title?.textContent||'ସିଂହାସନ';cardTitle.textContent=heading;cardTitle.lang=title?.lang||'or';cardVerse.textContent=excerptText;cardVerse.lang=verse?.lang||'or';
  caption=heading+'\nପ୍ରଭାକର ଶତପଥୀ\n\n'+excerptText;
  dialog.querySelector('h2').textContent=location.pathname.endsWith('intro.html')?'Share the introduction':verse?'Share this poem':'Share the book';
  document.querySelector('#share-whatsapp').href='https://wa.me/?text='+encodeURIComponent(caption+'\n\n'+url.value);
  document.querySelector('#share-facebook').href='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url.value);
  native.hidden=typeof navigator.share!=='function';
  dialog.showModal();
 });
 async function copy(text,success){
  try{await navigator.clipboard.writeText(text);status.textContent=success}
  catch{url.focus();url.select();status.textContent='Select and copy the page link above.'}
 }
 document.querySelector('#copy-book-link').addEventListener('click',()=>copy(url.value,'Link copied.'));
 document.querySelector('#copy-book-caption').addEventListener('click',()=>copy(caption+'\n\n'+url.value,'Text and link copied.'));
 native.addEventListener('click',async()=>{try{await navigator.share({title:heading,text:caption,url:url.value})}catch(error){if(error.name!=='AbortError')status.textContent='Sharing is unavailable here. You can copy the link instead.'}});
 dialog.addEventListener('close',()=>button.focus({preventScroll:true}));
})();
