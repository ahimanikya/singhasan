import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spokenPosition} from '../dist/assets/spoken-progress.mjs';
const cues=[{start:2,end:3},{start:4,end:5},{start:8,end:10}];
test('spoken words remain complete through pauses, rather than flashing off',()=>{
 assert.deepEqual(spokenPosition(cues,0),{completed:-1,active:-1,progress:1});
 assert.deepEqual(spokenPosition(cues,2.5),{completed:-1,active:0,progress:.5});
 assert.deepEqual(spokenPosition(cues,3.7),{completed:0,active:-1,progress:1});
 assert.deepEqual(spokenPosition(cues,6),{completed:1,active:-1,progress:1});
});
test('backward seeking restores the exact spoken progress, and the end keeps completed text',()=>{
 assert.deepEqual(spokenPosition(cues,9),{completed:1,active:2,progress:.5});
 assert.deepEqual(spokenPosition(cues,2.25),{completed:-1,active:0,progress:.25});
 assert.deepEqual(spokenPosition(cues,11),{completed:2,active:-1,progress:1});
 assert.deepEqual(spokenPosition([],10),{completed:-1,active:-1,progress:1});
});
