/* Native srcset/lazy loading still works if this small enhancement is unavailable. */
(()=>{
 const ready=(img,animate=false)=>{
  if(!(img instanceof HTMLImageElement)||!img.classList.contains('progressive-art')||!img.naturalWidth)return;
  img.classList.add('image-ready');
  if(animate)img.classList.add('image-reveal');
 };
 document.addEventListener('load',event=>ready(event.target,true),true);
 document.querySelectorAll('img.progressive-art').forEach(img=>{if(img.complete)ready(img)});
})();
