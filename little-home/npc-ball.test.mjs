import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from './vendor/three.module.js';
import {createHouseNPC} from './house-npc.js';
import {pointXZ} from './layout.js';

test('resident plays for two minutes then hides ball',()=>{
 const scene=new T.Scene();
 const npc=createHouseNPC({scene},()=>{
  const c=new T.Group();
  c.userData.body=new T.Group();c.add(c.userData.body);
  c.userData.arms=[new T.Group(),new T.Group()];c.userData.legs=[new T.Group(),new T.Group()];
  return c;
 },()=>[],()=>0);
 const [x,z]=pointXZ([1.2,3.7]);npc.character.position.set(x,.07,z);
 assert.equal(npc.startAction('ball',0),true);
 let now=0;while(npc.state==='walk'&&now<5000){now+=16;npc.update(.016,now)}
 assert.equal(npc.state,'act');assert.equal(npc.action.duration,120000);
 const ball=scene.getObjectByName('npc-play-ball');assert.equal(ball.visible,true);
 npc.update(.016,now+450);assert.ok(ball.position.y>.6);
 npc.update(.016,now+119999);assert.equal(npc.state,'act');
 npc.update(.016,now+120000);assert.equal(ball.visible,false);assert.notEqual(npc.state,'act');
});
test('remove only headboards and mouth control',()=>{
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 assert.ok(!app.includes('box(6.34,.54,1.64,.16,.94,2.05'));
 assert.ok(!app.includes('box(5.12,.46,8.08,1.13,.55,.11'));
 assert.ok(app.includes('pillow=box(6.04,.70,z'));
 assert.ok(app.includes('box(x,.70,7.76,.42,.18,.37'));
 const editor=readFileSync(new URL('./avatar-editor.js',import.meta.url),'utf8');
 assert.ok(!editor.includes('data-design="mouth"'));
 assert.ok(editor.includes('normalizeAvatarDesign(design)'));
});
