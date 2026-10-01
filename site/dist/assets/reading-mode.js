/* Permanent poem addresses remain ordinary pages; reading views share their content. */
(()=>{
 const query=new URLSearchParams(location.search);
 const bookMode=query.get('view')==='book'||query.has('page')||query.get('leaf')==='last';
 if(bookMode){document.body.classList.remove('standalone-page');document.body.classList.add('illustrated-mode')}
 document.addEventListener('DOMContentLoaded',()=>{
  if(bookMode)for(const link of document.querySelectorAll('.page-nav a,.book-index a,a[href="contents.html"]')){
   const url=new URL(link.href);if(/\/(intro|poem-\d+|contents)\.html$/.test(url.pathname)){url.searchParams.set('view','book');link.href=url.href}
  }
  if(document.body.classList.contains('standalone-page')){
   const panel=document.querySelector('.book-glance'),companion=document.querySelector('.book-companion'),toolkit=document.querySelector('#page-bookmarks'),wide=matchMedia('(min-width:761px)');
   if(panel&&companion&&toolkit){
    const placePanel=()=>{const focused=document.activeElement,keepFocus=panel.contains(focused);(wide.matches?companion:toolkit).append(panel);if(keepFocus)focused.focus({preventScroll:true})};
    placePanel();wide.addEventListener('change',placePanel);
   }
  }
  for(const link of document.querySelectorAll('.read-in-book'))link.addEventListener('click',()=>{
   const url=new URL(link.href),code=document.querySelector('#experience-verse')?.lang;
   if(code&&code!=='or')url.searchParams.set('lang',code);else url.searchParams.delete('lang');link.href=url.href;
  });
 });
})();
