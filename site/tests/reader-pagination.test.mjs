import test from 'node:test';
import assert from 'node:assert/strict';
import {packReadingPages} from '../dist/assets/reader-pagination.mjs';
const poem=(poemIndex,lines,titleHeight=2)=>[{type:'title',poemIndex,height:titleHeight},...Array.from({length:lines},(_,index)=>({type:'line',poemIndex,index,height:1}))];
const pack=(units,height)=>packReadingPages(units,page=>page.reduce((n,u)=>n+u.height,0)<=height);
test('next poem fills spare space when its title and three lines fit',()=>{
 const units=[...poem(0,2),...poem(1,8)];const pages=pack(units,10);
 assert.deepEqual(pages.map(p=>p.length),[8,4]);assert.equal(pages[0].filter(u=>u.poemIndex===1&&u.type==='line').length,4);
 assert.deepEqual(pages.flat(),units);
});
test('only two opening lines would fit: move the next poem to a new page',()=>{
 const pages=pack([...poem(0,4),...poem(1,5)],10);
 assert.equal(pages[0].at(-1).poemIndex,0);assert.equal(pages[1][0].type,'title');assert.equal(pages[1][0].poemIndex,1);
});
test('one- and two-line poems may fit in full',()=>{
 const units=[...poem(0,3),...poem(1,2)];assert.equal(pack(units,9).length,1);
});
test('ordering, identity and every source unit survive across many pages',()=>{
 const units=[...poem(0,30),...poem(1,13),...poem(2,2)];const pages=pack(units,9);
 assert.deepEqual(pages.flat(),units);assert.ok(pages.every(p=>p.length));
});
test('oversized heading keeps first line, never inserts an empty page',()=>{
 const units=poem(0,4,12),pages=pack(units,10);
 assert.equal(pages[0].length,2);assert.deepEqual(pages.flat(),units);
});
test('changed viewport recalculates the opening guard',()=>{
 const units=[...poem(0,4),...poem(1,5)];assert.equal(pack(units,10)[0].at(-1).poemIndex,0);assert.equal(pack(units,14)[0].at(-1).poemIndex,1);
});
