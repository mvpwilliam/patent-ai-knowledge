import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBattle,stepBattle,chooseUpgrade,spawnEnemy,DURATION} from './toy-defense-core.js';
const rng=()=>{let n=123;return()=>((n=(n*1664525+1013904223)>>>0)/4294967296)};
test('actual reward callback is idempotent, caps XP and grants one trophy',()=>{
 const source=readFileSync(new URL('./game.js',import.meta.url),'utf8');
 const body=source.split('async onWin(runId){')[1].split('await mutateGame(p=>{')[1].split('\n    });')[0];
 const reward=new Function('p','runId','MAX_XP','playerId','record',body);
 const p={coins:0,xp:1190,inventory:[]};let records=0;
 const claim=id=>reward(p,id,1200,()=> 'test-player',()=>records++);
 claim('first');claim('first');assert.equal(p.coins,30);assert.equal(p.xp,1200);assert.equal(records,1);
 claim('second');assert.equal(p.coins,60);assert.equal(p.inventory.length,1);assert.equal(p.inventory[0].item,'toy-trophy');
});
test('180 active seconds, unique choices at 60 and 120, boss at 145',()=>{
 const s=createBattle(rng());let choices=0;
 for(let i=0;i<6000&&s.status!=='won';i++){
  s.hero.hp=100;s.castle.hp=180;
  stepBattle(s,{attack:false},1/30);
  if(s.status==='choice'){choices++;assert.equal(new Set(s.choices.map(x=>x.id)).size,3);const t=s.time;stepBattle(s,{},1);assert.equal(s.time,t);assert.equal(chooseUpgrade(s,'invalid'),false);chooseUpgrade(s,s.choices[0].id)}
  if(s.bossSpawned){s.bossDefeated=true;s.enemies=[]}
 }
 assert.equal(choices,2);assert.equal(s.time,DURATION);assert.equal(s.status,'won');assert.equal(s.bossSpawned,true);
});
test('unbeaten boss loses at time limit',()=>{const s=createBattle();s.time=179.98;s.choiceAt=180;s.bossSpawned=true;stepBattle(s,{},.04);assert.equal(s.status,'lost');assert.match(s.reason,/恐龍/)});
test('castle destroyed and player defeated both lose',()=>{for(const target of ['castle','hero']){const s=createBattle();s[target].hp=0;stepBattle(s,{},.03);assert.equal(s.status,'lost')}});
test('paused, choice and finished states do not simulate',()=>{for(const status of ['paused','intro','choice','won','lost']){const s=createBattle();s.status=status;stepBattle(s,{x:1,dash:true},1);assert.equal(s.time,0);assert.equal(s.hero.x,0)}});
test('bounded movement, diagonal speed and dash cooldown',()=>{const s=createBattle();s.spawn=999;for(let i=0;i<600;i++){s.hero.hp=100;s.castle.hp=180;stepBattle(s,{x:1,z:1},.03)}assert.ok(s.hero.x<=5.1&&s.hero.z<=5.1);stepBattle(s,{dash:true},.03);const cd=s.hero.dashCD;stepBattle(s,{dash:true},.03);assert.ok(s.hero.dashCD<cd)});
test('bubble and sword can defeat enemies, including boss',()=>{for(const weapon of ['bubble','sword']){const s=createBattle();s.weapon=weapon;s.spawn=999;const e=spawnEnemy(s,'soldier');e.x=s.hero.x;e.z=s.hero.z-1;for(let i=0;i<90;i++)stepBattle(s,{},1/30);assert.ok(s.kills>=1)}const s=createBattle();s.spawn=999;const boss=spawnEnemy(s,'boss');boss.hp=1;boss.x=0;boss.z=2;for(let i=0;i<30;i++)stepBattle(s,{},1/30);assert.equal(s.bossDefeated,true)});
test('all upgrades apply; choice cannot be claimed twice',()=>{for(const id of ['power','rapid','repair','range','guard','speed']){const s=createBattle();s.status='choice';s.choices=[{id}];s.hero.hp=50;s.castle.hp=90;assert.equal(chooseUpgrade(s,id),true);assert.equal(chooseUpgrade(s,id),false);assert.deepEqual(s.upgrades,[id])}});
test('spawn, projectile and effect caps hold over full simulation',()=>{const s=createBattle(rng());let max=0;for(let i=0;i<5500;i++){s.hero.hp=100;s.castle.hp=180;if(s.status==='choice')chooseUpgrade(s,s.choices[0].id);stepBattle(s,{x:Math.sin(i/60),z:Math.cos(i/60)},1/30);max=Math.max(max,s.enemies.length);assert.ok(s.shots.length<=44);assert.ok(s.effects.length<=24)}assert.ok(max<=9)});
