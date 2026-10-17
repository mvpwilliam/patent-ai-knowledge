import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
test('object detail actions never request camera movement; reset still works',()=>{
 const messages=[],frame={style:{},contentWindow:{postMessage:m=>messages.push(m)}};
 const ctx={document:{createElement:()=>frame},location:{origin:'https://test'},window:{addEventListener(){}}};
 vm.createContext(ctx);
 vm.runInContext(read('./escape-real-room.js').replace('export function','function'),ctx);
 const room=ctx.createRoom({replaceWith(){}},()=>{});
 room.focus('sofa');room.lookAtPainting();assert.equal(messages.length,0);
 room.reset();assert.equal(messages[0].type,'escape-reset');
 const game=read('./escape.js');
 assert.ok(!game.includes('room?.focus'));assert.ok(!game.includes('room?.lookAtPainting'));
});
test('game and dialog locks overlap and restore prior body style and scroll',()=>{
 const handlers={},classes=new Set();
 const style={getPropertyValue(n){return this[n]||''},getPropertyPriority(){return ''},setProperty(n,v){this[n]=v},removeProperty(n){delete this[n]}};
 style.position='relative';
 let game=false,dialog=false,restore=null,observer;
 const ctx={
  Element:class {},URLSearchParams,location:{search:''},
  document:{body:{style,hasAttribute:()=>false},head:{append(){}},createElement:()=>({}),documentElement:{classList:{toggle(n,on){on?classes.add(n):classes.delete(n)}}},querySelector:()=>game||dialog,addEventListener(n,fn){handlers[n]=fn}},
  window:{scrollX:0,scrollY:150,scrollTo(x,y){restore=[x,y]}},
  MutationObserver:class{constructor(fn){observer=fn}observe(){}}
 };
 vm.runInNewContext(read('./mobile-touch.js'),ctx);
 assert.equal(style.position,'relative');
 game=true;observer();assert.equal(style.position,'fixed');assert.equal(style.top,'-150px');
 dialog=true;game=false;observer();assert.equal(style.position,'fixed');
 dialog=false;observer();assert.equal(style.position,'relative');assert.deepEqual(restore,[0,150]);
 assert.equal(classes.size,0);
});
