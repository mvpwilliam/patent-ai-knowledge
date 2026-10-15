import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,act,grid,cabinetCode,doorCode} from './escape-core.js';
test('complete three-stage solution with frozen UI values',()=>{
 const s=initial();s.elapsed=899;act(s,'trial');act(s,'snapshot');assert.equal(cabinetCode(s),'0913');
 act(s,'cabinet','0913');assert.equal(s.cabinet,true);s.elapsed=950;act(s,'snapshot');assert.equal(s.snapshot.time,899);
 act(s,'overlay');for(let i=0;i<3;i++)act(s,'rotate');assert.deepEqual(grid(s.turns),[[4,1,8],[7,5,3],[2,9,6]]);
 for(const n of [0,2,8,6])act(s,'corner',n);assert.equal(s.painting,true);assert.equal(doorCode(s),'3949');act(s,'door','3949');assert.equal(s.escaped,true);
});
test('premature snapshot can be replaced and invalid operations do not unlock',()=>{
 const s=initial();act(s,'snapshot');act(s,'cabinet',cabinetCode(s));assert.equal(s.cabinet,false);
 act(s,'trial');act(s,'trial');assert.equal(s.hp,73);act(s,'snapshot');act(s,'cabinet','abcd');assert.equal(s.cabinet,false);
 act(s,'door','4862');assert.equal(s.escaped,false);act(s,'cabinet',cabinetCode(s));act(s,'overlay');
 for(const n of [0,2,8,6])act(s,'corner',n);assert.equal(s.painting,false);assert.deepEqual(s.corners,[]);
 act(s,'corner',0);act(s,'rotate');assert.deepEqual(s.corners,[]);
});
test('code stays four digits across clock range and handles subtraction wrap',()=>{
 const s=initial();act(s,'trial');s.elapsed=5999;act(s,'snapshot');assert.equal(cabinetCode(s),'5928');assert.equal(doorCode(s),'8934');
 s.elapsed=6000;act(s,'snapshot');assert.equal(cabinetCode(s),'0087');
});
