import test from 'node:test';
import assert from 'node:assert/strict';
import {MEDALS,awardMedal,beginEscapeMedal,escapeMedalContext,queueEscapeMedal,pendingMedalKey} from './medals.js';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};
test('three distinct medals, never a farm award; repeat wins retain first earned date',()=>{
 const p={coins:90,inventory:[]};assert.deepEqual(Object.keys(MEDALS),['escape','castle','shooter']);
 for(const id of Object.keys(MEDALS)){assert.equal(awardMedal(p,id,100),true);assert.equal(awardMedal(p,id,200),false);assert.equal(p.medals[id].earnedAt,100)}
 assert.throws(()=>awardMedal(p,'farm'));assert.equal(p.coins,90);assert.deepEqual(p.inventory,[]);
});
test('escape receipts survive repeated victory views and stay with original account/home',()=>{
 globalThis.localStorage=memory();globalThis.sessionStorage=memory();
 beginEscapeMedal('home-a:alice','小明');const first=escapeMedalContext();queueEscapeMedal(first,100);
 beginEscapeMedal('home-b:bob','小華');queueEscapeMedal(first,200);
 assert.equal(escapeMedalContext().owner,'home-b:bob');
 assert.equal(localStorage.getItem(pendingMedalKey('home-b:bob')),null);
 assert.deepEqual(JSON.parse(localStorage.getItem(pendingMedalKey(first.owner))),{earnedAt:100});
 const player={};awardMedal(player,'escape',100);assert.equal(awardMedal(player,'escape',100),false);
 assert.equal(queueEscapeMedal(null),false);
});
