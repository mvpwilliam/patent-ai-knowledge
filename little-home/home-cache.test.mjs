import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {loadHomeCache,saveHomeCache,homeCacheKey} from './home-cache.js';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)}};
const sample={uid:'a',home:'one',avatar:{name:'A'},player:{xp:100,coins:20},monster:{bornAt:1,hits:18}};
test('cache is isolated by account and home; no authentication means no restore',()=>{
 const s=memory();saveHomeCache(s,sample,1000);
 assert.equal(loadHomeCache(s,'a','one',1001).player.xp,100);
 for(const [uid,home] of [['b','one'],['a','two'],['','one']])assert.equal(loadHomeCache(s,uid,home,1001),null);
});
test('bad, expired, future and mismatched cache is ignored',()=>{
 const s=memory();saveHomeCache(s,sample,1000);assert.equal(loadHomeCache(s,'a','one',1000+8*86400000),null);
 assert.equal(loadHomeCache(s,'a','one',-100000),null);
 s.setItem(homeCacheKey('a','one'),'{broken');assert.equal(loadHomeCache(s,'a','one',1001),null);
 s.setItem(homeCacheKey('a','one'),JSON.stringify({...sample,version:1,at:1000,uid:'b'}));assert.equal(loadHomeCache(s,'a','one',1001),null);
 assert.equal(saveHomeCache({setItem(){throw Error('quota')}},sample),false);
});
test('server refresh replaces stale local monster and progression',()=>{
 const s=memory();saveHomeCache(s,sample,1000);saveHomeCache(s,{...sample,player:{xp:700},monster:{bornAt:999999,hits:0}},2000);
 const c=loadHomeCache(s,'a','one',2001);assert.equal(c.player.xp,700);assert.equal(c.monster.hits,0);
});
const game=readFileSync(new URL('./game.js',import.meta.url),'utf8');
test('first server payload applied before readiness and subscription; initialization conditional',()=>{
 const f=game.slice(game.indexOf('async function subscribeHome('),game.indexOf('async function shareHome('));
 assert.ok(f.indexOf('loadHomeCache(')<f.indexOf('api.getDocFromServer'));
 assert.match(f,/Promise.all\(\[api.getDocFromServer\(homeRef\),api.getDocFromServer\(profileRef\)\]\)/);
 assert.ok(f.indexOf('applyMeta(initialItems')<f.indexOf('homeReady=true'));
 assert.ok(f.indexOf('applyMeta(initialItems')<f.indexOf('unsubscribeTasks=api.onSnapshot'));
 assert.match(f,/if\(designPending\|\|!gameMeta.monster\|\|!gameMeta.players\[playerId\(\)\]\)/);
 assert.doesNotMatch(f,/readPlayer\(\)/);
});
test('cached display cannot authorize an attack or transaction',()=>{
 assert.match(game,/async function attackMonster\(\)\{[\s\S]*?if\(mode==='online'&&!homeReady\)return toast/);
 assert.match(game,/async function mutateGame\(change\)[\s\S]*?if\(!homeReady\|\|!user\)throw/);
 assert.match(game,/if\(!isCurrentHome\(\)\|\|snap.metadata.fromCache\)return/);
});
test('family entry exists only inside character dialog and SDK preload is present',()=>{
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 assert.equal((html.match(/id="family-open"/g)||[]).length,1);
 assert.match(html,/<dialog id="character-dialog"[\s\S]*?id="family-open"[\s\S]*?<\/dialog>/);
 assert.doesNotMatch(html.slice(html.indexOf('id="scene-game-panel"'),html.indexOf('<canvas id="scene"')),/id="family-open"/);
 assert.equal((html.match(/rel="modulepreload"/g)||[]).length,3);
});
test('side arc flips left near right edge and clamps vertically',()=>{
 const js=readFileSync(new URL('./pose-radial.js',import.meta.url),'utf8');
 const code=js.slice(js.indexOf('export function radialPosition'),js.indexOf('export function installPoseRadial')).replace('export ','');
 const c={};vm.createContext(c);vm.runInContext(code,c);
 const right=c.radialPosition(100,300,390,700,20);assert.equal(right.side,'right');assert.ok(right.x-70>120);
 const left=c.radialPosition(340,300,390,700,20);assert.equal(left.side,'left');assert.ok(left.x+70<320);
 for(const y of [0,700]){const p=c.radialPosition(100,y,390,700,20);assert.ok(p.y>=108&&p.y<=592)}
});
