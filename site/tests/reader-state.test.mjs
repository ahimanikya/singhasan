import test from 'node:test';
import assert from 'node:assert/strict';
import {bookURL,legacyAnchor} from '../dist/assets/reader-state.mjs';
test('old quiet bookmarks preserve line and character offsets, including section headings',()=>{
 assert.deepEqual(legacyAnchor(17000042),{line:17,offset:42});
 assert.deepEqual(legacyAnchor(-1),{line:0,offset:0});
});
test('both modes link to the same poem and passage with an explicit mode',()=>{
 for(const quiet of [false,true]){
 const u=new URL(bookURL('poem-19.html',{quiet,language:'or',line:17,offset:4}),'https://example.org');
 assert.equal(u.pathname,'/poem-19.html');assert.equal(u.searchParams.get('quiet'),quiet?'1':'0');
 assert.equal(u.searchParams.get('line'),'17');assert.equal(u.searchParams.get('offset'),'4');
 }
});
test('chapter boundaries and back cover retain quiet mode and previous-page direction',()=>{
 const u=new URL(bookURL('poem-68.html',{quiet:true,last:true}),'https://example.org');
 assert.equal(u.searchParams.get('leaf'),'last');assert.equal(u.searchParams.get('quiet'),'1');
 assert.match(bookURL('back-cover.html',{quiet:true}),/^back-cover.html\?/);
});
test('saved routes cannot redirect outside the book',()=>{
 assert.match(bookURL('https://example.com'),/^book.html\?/);
 assert.match(bookURL('poem-69.html'),/^book.html\?/);
});

test('folios count individual leaves and omit the blank last page',async()=>{
 const {leafNumbers}=await import('../dist/assets/reader-state.mjs');
 assert.deepEqual(leafNumbers({quiet:false,mobile:false,index:0,textColumns:3}),{first:1,second:2,total:4});
 assert.deepEqual(leafNumbers({quiet:false,mobile:false,index:1,textColumns:3}),{first:3,second:4,total:4});
 assert.deepEqual(leafNumbers({quiet:false,mobile:false,index:2,textColumns:4}),{first:5,second:null,total:5});
 assert.deepEqual(leafNumbers({quiet:true,mobile:false,index:1,textColumns:3}),{first:3,second:null,total:3});
 assert.deepEqual(leafNumbers({quiet:false,mobile:true,index:2,textColumns:3}),{first:3,second:null,total:4});
});
