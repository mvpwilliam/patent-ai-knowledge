import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./pose-radial.js',import.meta.url),'utf8');
function setup(){
 const handlers=new Map();
 const element=()=>({hidden:false,style:{},dataset:{},classList:{contains:()=>false,toggle(){}},setAttribute(k,v){this[k]=v},addEventListener(k,f){handlers.set(this.id+':'+k,f)},focus(){},contains(t){return t===this}});
 const world={...element(),id:'world',clientWidth:390,clientHeight:700},canvas={...element(),id:'canvas',getBoundingClientRect:()=>({left:0,top:0,width:390,height:700})};
 const buttons=['stand','sit','lie'].map(p=>({...element(),dataset:{pose:p}})),close=element();
 const menu={...element(),id:'pose-radial',hidden:true,querySelectorAll:()=>buttons,querySelector:()=>close};
 const document={...element(),id:'doc',querySelector:s=>({'#world':world,'#scene':canvas,'#pose-radial':menu}[s]||null)};
 const actor={visible:true,updateWorldMatrix(){}},other={visible:true,updateWorldMatrix(){}};
 let hits=[],pose='stand';
 class Vector{set(){return this}project(){this.x=0;this.y=0;this.z=0;return this}}
 const T={Vector2:Vector,Vector3:Vector,Raycaster:class{setFromCamera(){}intersectObjects(){return hits}},Box3:class{constructor(){this.min={x:0,y:0,z:0};this.max={x:1,y:1,z:1}}setFromObject(){}getCenter(){}}};
 const window={homeScene:{camera:{updateMatrixWorld(){}}}};
 const context={T,document,window,MutationObserver:class{observe(){}}};vm.createContext(context);
 vm.runInContext(source.replace(/^import .*;\n/,'').replaceAll('export function','function')+'\nthis.install=installPoseRadial;this.position=radialPosition;',context);
 const controller=context.install({getCharacter:()=>actor,getOthers:()=>[other],getPose:()=>pose,setPose:p=>pose=p});
 return {context,controller,window,menu,buttons,world,actor,other,handlers,hit:o=>hits=o?[{object:o}]:[],getPose:()=>pose};
}
test('single tap own actor opens; second tap closes; other actors do not open',()=>{
 const s=setup();s.hit(s.actor);assert.equal(s.window.homeGameCharacterAt({clientX:100,clientY:100}),true);assert.equal(s.menu.hidden,false);
 s.window.homeGameCharacterAt({clientX:100,clientY:100});assert.equal(s.menu.hidden,true);
 s.hit(s.other);assert.equal(s.window.homeGameCharacterAt({clientX:100,clientY:100}),false);assert.equal(s.menu.hidden,true);
});
test('selection applies pose and closes; blank tap dismisses without consuming movement',()=>{
 const s=setup();s.hit(s.actor);s.window.homeGameCharacterAt({clientX:100,clientY:100});s.buttons[1].onclick();assert.equal(s.getPose(),'sit');assert.equal(s.menu.hidden,true);
 s.window.homeGameCharacterAt({clientX:100,clientY:100});s.hit(null);assert.equal(s.window.homeGameCharacterAt({clientX:200,clientY:200}),false);assert.equal(s.menu.hidden,true);
});
test('menu stays within portrait, landscape and narrow viewport',()=>{
 const {context}=setup();for(const [w,h]of [[390,700],[700,300],[250,250]])for(const [x,y]of [[0,0],[w,h],[w/2,h/2]]){
  const p=context.position(x,y,w,h);assert.ok(p.x>=78&&p.x<=w-78);assert.ok(p.y>=108&&p.y<=h-108);
 }
});
test('drag dismisses; battle blocks opening',()=>{
 const s=setup();s.hit(s.actor);s.window.homeGameCharacterAt({clientX:100,clientY:100});
 s.handlers.get('canvas:pointerdown')({pointerId:1,clientX:100,clientY:100});s.handlers.get('canvas:pointermove')({clientX:125,clientY:100});assert.equal(s.menu.hidden,true);
 s.world.classList.contains=()=>true;assert.equal(s.window.homeGameCharacterAt({clientX:100,clientY:100}),false);
});
test('camera tap gate remains in front of radial and monster actions; old toolbar removed',()=>{
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8'),html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 assert.match(app,/!p\.moved[\s\S]*homeGameCharacterAt\?\.\(e\)\|\|window.homeGameAttackAt/);
 assert.doesNotMatch(html,/class="pose-buttons scene-poses"/);assert.match(html,/id="pose-radial"[^>]*hidden/);
 assert.equal((html.match(/data-pose=/g)||[]).length,3);
});

