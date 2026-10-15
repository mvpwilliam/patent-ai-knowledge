import test from 'node:test';
import assert from 'node:assert/strict';
import {findPath,walkable,canTraverse} from './navigation.js';
import {scaleX,X_SCALE} from './layout.js';
import {createBattle,stepBattle,chooseUpgrade,DURATION} from './toy-defense-core.js';
test('shower route crosses doorway and reaches shower head in both directions',()=>{
 const outside=[scaleX(5.3),5.15],inside=[scaleX((5.895+.28/X_SCALE+.13+7.18+.54/X_SCALE-.065)/2),5.865];
 assert.equal(walkable(...inside),true);
 for(const [a,b]of [[outside,inside],[inside,outside]]){const p=findPath(a,b);assert.ok(p.length);assert.ok(Math.hypot(p.at(-1)[0]-b[0],p.at(-1)[1]-b[1])<.12);for(let i=1;i<p.length;i++)assert.ok(canTraverse(p[i-1],p[i]));}
 assert.equal(walkable(scaleX(6.1),5.8),false);
 const edge=scaleX(5.895+.28/X_SCALE+.13);assert.equal(canTraverse([edge-.3,4.75],[edge+.3,4.75]),false);
});
test('two minute schedule retains two upgrades and boss time',()=>{
 const s=createBattle(()=>.5),choices=[];let bossAt;
 for(let i=0;i<1300&&s.status!=='won'&&s.status!=='lost';i++){
  s.hero.hp=100;s.castle.hp=180;
  if(s.status==='choice'){choices.push(Math.round(s.time));chooseUpgrade(s,s.choices[0].id)}
  stepBattle(s,{attack:false},.1);if(s.bossSpawned&&!bossAt)bossAt=s.time;
  s.enemies=[];if(s.bossSpawned)s.bossDefeated=true;
 }
 assert.equal(DURATION,120);assert.deepEqual(choices,[40,80]);assert.ok(bossAt>=85&&bossAt<85.2);assert.equal(s.time,120);assert.equal(s.status,'won');
});
