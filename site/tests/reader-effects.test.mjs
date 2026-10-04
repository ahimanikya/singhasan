import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readerEffects} from '../dist/assets/reader-state.mjs';
test('Illustrated animates by default; Quiet defaults to no animation',()=>{
 assert.deepEqual(readerEffects(),{motion:true,sound:false});
 assert.deepEqual(readerEffects({},false,true),{motion:false,sound:false});
});
test('each mode keeps its own animation preference and reduced motion wins',()=>{
 const p={motionIllustrated:false,motionQuiet:true,sound:true};
 assert.deepEqual(readerEffects(p),{motion:false,sound:true});
 assert.deepEqual(readerEffects(p,false,true),{motion:true,sound:true});
 assert.deepEqual(readerEffects(p,true,true),{motion:false,sound:true});
 assert.equal(readerEffects({},true).motion,false);
});
test('legacy preferences apply to Illustrated without enabling Quiet animation',()=>{
 assert.equal(readerEffects({motion:false}).motion,false);
 assert.equal(readerEffects({motion:true},false,true).motion,false);
 assert.equal(readerEffects({motionQuiet:'true'},false,true).motion,false);
});
