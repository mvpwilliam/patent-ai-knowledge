import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as T from './vendor/three.module.js';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
test('escape reuses the actual home and maps existing furniture',()=>{
 const source=read('./escape-home-bridge.js'),home=read('./app.js');
 assert.match(source,/import '.\/app.js/);
 for(const name of ['sofa','television-and-console','black-white-art','entry-cabinet','front-door-leaf'])assert.ok(home.includes("finishSection('"+name+"'"));
 assert.match(read('./index.html'),/has\("escapeScene"\)/);
 assert.match(read('./escape.js'),/escape-real-room.js/);
});
test('adult and child mirrors center real bounds; bath crops to face',()=>{
 const source=read('./game.js');
 const code=source.slice(source.indexOf("  mirrorPortrait.userData.updatePose"),source.indexOf("  dialog.showModal();",source.indexOf('function openMirror')));
 for(const height of [1.2,1.8])for(const kind of ['entryMirror','bathMirror']){
  const actor=new T.Group(),body=new T.Mesh(new T.BoxGeometry(.4,height*.7,.2));
  body.position.y=height*.35;actor.add(body);
  const head=new T.Group();head.name='Head';head.position.y=height*.85;
  head.add(new T.Mesh(new T.BoxGeometry(.3,height*.3,.25)));actor.add(head);
  let camera;
  vm.runInNewContext(code,{T,kind,mirrorPortrait:actor,mirrorScene:new T.Scene(),mirrorRenderer:{render(s,c){camera=c}}});
  assert.equal(camera.position.x,0);
  assert.ok(Math.abs(camera.position.y-(kind==='bathMirror'?height*.85:height*.5))<1e-6);
  if(kind==='bathMirror')assert.ok(camera.position.y+camera.bottom>height*.65);
  else assert.ok(camera.top-camera.bottom>height);
 }
});
test('pause halts elapsed time and requires confirmation before clearing progress',()=>{
 const source=read('./escape.js');
 assert.match(source,/!document.hidden&&!state.escaped&&!paused/);
 const start=source.indexOf('function resumeGame()'),end=source.indexOf("pauseDialog.querySelector",start);
 let cleared=0,closed=0;
 const ctx={paused:false,previous:0,performance:{now:()=>42},room:{pause(){}},pauseDialog:{showModal(){},close(){closed++}},state:{escaped:false},save(){},initial(){cleared++;return {}},location:{href:''},window:{confirm:()=>false}};
 vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
 ctx.pauseGame();assert.equal(ctx.paused,true);
 ctx.quitGame();assert.equal(cleared,0);assert.equal(ctx.location.href,'');
 ctx.resumeGame();assert.equal(ctx.paused,false);assert.equal(ctx.previous,42);assert.equal(closed,1);
 ctx.window.confirm=()=>true;ctx.quitGame();assert.equal(cleared,1);assert.equal(ctx.location.href,'./');
});
