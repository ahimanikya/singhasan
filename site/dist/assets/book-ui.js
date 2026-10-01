'use strict';
(()=>{
 document.body.classList.add('book-js');
 const menu=document.querySelector('#menu-toggle'),nav=document.querySelector('#book-navigation'),drawer=document.querySelector('#book-menu-drawer'),slot=document.querySelector('#book-menu-slot'),close=document.querySelector('#book-menu-close');
 const compact=matchMedia('(max-width:1100px)'),desktopParent=nav.parentElement;
 let savedOverflow='';
 function closed(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');document.body.style.overflow=savedOverflow;menu.focus()}
 function closeMenu(){if(drawer.open)drawer.close()}
 function placeNav(){closeMenu();if(compact.matches)slot.append(nav);else desktopParent.insertBefore(nav,drawer)}
 menu.addEventListener('click',()=>{if(drawer.open){closeMenu();return}savedOverflow=document.body.style.overflow;drawer.showModal();document.body.style.overflow='hidden';menu.setAttribute('aria-expanded','true');menu.setAttribute('aria-label','Close navigation');close.focus()});
 close.addEventListener('click',closeMenu);drawer.addEventListener('close',closed);
 drawer.addEventListener('click',event=>{if(event.target===drawer){const r=drawer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeMenu()}});
 nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu()});
 const route=location.pathname.split('/').pop()||'index.html';for(const a of nav.querySelectorAll('a'))if(a.getAttribute('href')===route)a.setAttribute('aria-current','page');
 compact.addEventListener('change',placeNav);placeNav();
})();
