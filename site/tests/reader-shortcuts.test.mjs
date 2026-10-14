import test from 'node:test';
import assert from 'node:assert/strict';
import {readerShortcut} from '../dist/assets/reader-shortcuts.mjs';
const event=(key,extra={})=>({key,...extra});
test('arrow and page keys turn one leaf; F toggles full screen',()=>{
 for(const key of ['ArrowRight','PageDown'])assert.equal(readerShortcut(event(key)),'next');
 for(const key of ['ArrowLeft','PageUp'])assert.equal(readerShortcut(event(key)),'previous');
 assert.equal(readerShortcut(event('f')),'fullscreen');
 assert.equal(readerShortcut(event('Escape')),null);
});
test('never steal keys from typing, widgets, IME, selection, panels or browser shortcuts',()=>{
 for(const key of ['ArrowRight','ArrowLeft','f']){
  for(const flag of ['ctrlKey','metaKey','altKey','shiftKey','repeat','isComposing','defaultPrevented'])assert.equal(readerShortcut(event(key,{[flag]:true})),null);
  assert.equal(readerShortcut(event(key),{blocked:true}),null);
  assert.equal(readerShortcut(event(key),{selected:true}),null);
  assert.equal(readerShortcut(event(key,{target:{isContentEditable:true}})),null);
  assert.equal(readerShortcut(event(key,{target:{closest:()=>({})}})),null);
 }
});
