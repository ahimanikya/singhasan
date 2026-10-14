// Keep reading shortcuts out of text fields, widgets and open reader panels.
export function readerShortcut(event,{blocked=false,selected=false}={}){
 if(blocked||selected||event.defaultPrevented||event.repeat||event.isComposing||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return null;
 const target=event.target;
 if(target?.isContentEditable||target?.closest?.('input,textarea,select,[role="textbox"],[role="slider"],[role="tab"],[role="menuitem"],audio,video'))return null;
 if(event.key==='ArrowRight'||event.key==='PageDown')return 'next';
 if(event.key==='ArrowLeft'||event.key==='PageUp')return 'previous';
 if(event.key?.toLowerCase()==='f')return 'fullscreen';
 return null;
}
