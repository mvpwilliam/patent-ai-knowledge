import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {MAX_XP,levelInfo,hitHomeMonster} from './home-progression.js';
import {scaleX,X_SCALE,furnitureXZ} from './layout.js';
import {walkable,findPath} from './navigation.js';
const normalize=p=>({xp:0,coins:0,inventory:[],...p});
const fresh=()=>({monster:{bornAt:100,hits:99},players:{a:{xp:0},offline:{xp:600,presence:{online:false}},max:{xp:1200}}});
test('all members including offline and profile-only members receive five levels',()=>{
 const m=fresh(),p=structuredClone(m.players.a);
 assert.equal(hitHomeMonster(m,'a',p,{now:200,memberIds:['profile-only'],normalize}),true);
 m.players.a=p; // mutateGame writes the caller object back after the callback.
 assert.equal(levelInfo(m.players.a.xp).level,6);
 assert.equal(levelInfo(m.players.offline.xp).level,15);
 assert.equal(levelInfo(m.players['profile-only'].xp).level,6);
 assert.equal(m.players.max.xp,1200);assert.equal(m.monster.defeats,1);
 assert.equal(m.players.offline.presence.online,false);
});
test('each integer XP value receives exactly five levels, capped at 20',()=>{
 for(let xp=0;xp<=MAX_XP;xp++){
  const m=fresh(),p={xp};hitHomeMonster(m,'a',p,{now:200,normalize});
  assert.equal(levelInfo(p.xp).level,Math.min(20,levelInfo(xp).level+5),'XP '+xp);
 }
});
test('non-final hit does not reward; a second final hit cannot reward during cooldown',()=>{
 const m=fresh(),p=m.players.a;m.monster.hits=98;
 assert.equal(hitHomeMonster(m,'a',p,{now:200,normalize}),false);assert.equal(p.xp,0);
 hitHomeMonster(m,'a',p,{now:200,normalize});const saved=JSON.stringify(m);
 assert.throws(()=>hitHomeMonster(m,'a',p,{now:201,normalize}));assert.equal(JSON.stringify(m),saved);
});
test('transaction retries reward only the winning persisted snapshot',()=>{
 const initial=fresh();let committed;
 for(let attempt=0;attempt<3;attempt++){
  const draft=structuredClone(initial),p=normalize(draft.players.a);
  hitHomeMonster(draft,'a',p,{now:200,normalize});draft.players.a=p;committed=draft;
 }
 assert.equal(levelInfo(committed.players.a.xp).level,6);assert.equal(committed.monster.defeats,1);
});
test('subsequent monster victory rewards another five levels',()=>{
 const m=fresh(),p=m.players.a;
 for(let i=0;i<4;i++){m.monster.hits=99;hitHomeMonster(m,'a',p,{now:m.monster.bornAt,normalize})}
 assert.equal(levelInfo(p.xp).level,20);assert.equal(m.monster.defeats,4);
});
test('fold laundry marker is in master bedroom with reachable stopping position',()=>{
 const source=readFileSync(new URL('./game.js',import.meta.url),'utf8');
 assert.match(source,/id:'fold',label:'摺衣',room:'main'/);
 assert.match(source,/fold:\{room:'main',marker:furnitureXYZ\('mainBed'/);
 const stop=furnitureXZ('mainBed',[4.15,2.60]);assert.equal(walkable(...stop),true);
 assert.ok(findPath([scaleX(1.05),4.35],stop).length>1);
});
test('glass anchors meet current shaft and wall, with 64.5 cm door clearance',()=>{
 const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 const constants=source.slice(source.indexOf('const OUTER_X='),source.indexOf('function box('));
 const glass=source.slice(source.indexOf('const showerGlassX='),source.indexOf('const {P1:showerP1'));
 const context={scaleX,X_SCALE};vm.createContext(context);
 vm.runInContext(constants+'\nconst SHAFT_BATH_FACE_Z=5.55-.065;\n'+glass+'\nresult={showerPoints,shaft:scaleX(SHAFT_OUTER_X),wall:scaleX(BATH_EXTERIOR_X-.075)}',context);
 const {showerPoints:s,shaft,wall}=context.result;
 assert.equal(s.P1.x,shaft);assert.equal(s.P3.x,wall);assert.ok(s.P3.x>s.C.x);
 assert.ok(Math.abs(s.P1.z-s.H.z-.645)<1e-9);assert.equal(s.C.x,s.H.x);
});
test('titles reuse the foot label font and have a separate head anchor',()=>{
 const css=readFileSync(new URL('./style.css',import.meta.url),'utf8'),js=readFileSync(new URL('./game.js',import.meta.url),'utf8');
 assert.match(js,/className='character-name character-title'/);
 assert.match(css,/#character-names \.character-name\{[^}]*font-family:"HomeRoundedLabel"/);
 assert.match(js,/characterTitleBounds.max.y-mesh.position.y\+\.10/);
 assert.equal(levelInfo(600).title,'家事達人');
});
