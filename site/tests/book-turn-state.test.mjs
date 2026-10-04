import test from 'node:test';
import assert from 'node:assert/strict';
import {clampTurn,turnAngle,completesTurn,settleDuration} from '../dist/assets/book-turn-state.mjs';
test('opposite turns have opposite hinges and never rotate beyond one sheet',()=>{
 assert.equal(turnAngle(1,.5),-90);assert.equal(turnAngle(-1,.5),90);
 assert.equal(turnAngle(1,2),-180);assert.equal(clampTurn(-1),0);
});
test('short slow drags return; a deliberate drag or quick flick completes',()=>{
 assert.equal(completesTurn(.12,.1),false);assert.equal(completesTurn(.4,0),true);
 assert.equal(completesTurn(.08,.8),true);assert.equal(completesTurn(.01,2),false);
 assert.equal(completesTurn(.12,-.8),false);
});
test('a nearly completed drag settles faster than a fresh tap',()=>{
 assert.equal(settleDuration(0,true),340);assert.equal(settleDuration(.9,true),110);
 assert.equal(settleDuration(.1,false),110);
});
