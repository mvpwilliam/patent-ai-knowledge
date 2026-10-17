// Reuse the real home geometry and furniture, without login or economy writes.
import './app.js?v=escape-window-2';
import * as T from './vendor/three.module.js';
import {createGodzilla} from './godzilla.js?v=103';
const style=document.createElement('style');
style.textContent='html,body{margin:0!important;width:100%;height:100%;overflow:hidden}body>header,aside,dialog,#toast{display:none!important}main{display:block!important;margin:0!important;padding:0!important;width:100%!important;height:100%!important;max-width:none!important}#world{width:100%!important;height:100%!important;min-height:0!important;border-radius:0!important;margin:0!important}#world>*:not(canvas):not(#loading):not(#error){display:none!important}';
document.head.append(style);
const home=window.homeScene,canvas=document.querySelector('#scene');
let focus=new T.Vector3(1.65,0,1.85);
window.homeGameFocus=()=>({position:focus});
function focusRoom(room='living'){
 home.selectRoom(room);
 const position=home.rooms[room].pos;
 focus.set(position[0],0,position[2]);
 if(room==='living'){
  focus.set(1.65,0,1.85);
  home.setInspectionOrbit(-.95,.86,10.2);
 }else home.setInspectionOrbit(-.7,.76,home.rooms[room].dist);
}
focusRoom();
const targets=[];
for(const [name,id] of [['sofa','sofa'],['television-and-console','tv'],['black-white-art','painting'],['entry-cabinet','cabinet'],['front-door-leaf','door']]){
 const object=home.root.getObjectByName(name);
 if(object){object.userData.escapeId=id;targets.push(object)}
}
const monster=createGodzilla(.84);
// Window is on Z=0; face +Z into the living room, with the tail clear of glass.
monster.position.set(home.layout.scaleX(1.70),monster.position.y+.05,.65);
monster.rotation.y=0;monster.userData.escapeId='monster';home.root.add(monster);targets.push(monster);
// Invisible generous hit target, independent of the narrow limbs and tail.
monster.updateMatrixWorld(true);
const monsterBounds=new T.Box3().setFromObject(monster),hitSize=monsterBounds.getSize(new T.Vector3()).addScalar(.20);
const monsterHit=new T.Mesh(new T.BoxGeometry(hitSize.x,hitSize.y,hitSize.z),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
monsterHit.position.copy(monsterBounds.getCenter(new T.Vector3()));
monsterHit.userData.escapeId='monster';home.root.add(monsterHit);targets.push(monsterHit);
const ray=new T.Raycaster(),pointer=new T.Vector2();
let paused=false;
window.homeGameCharacterAt=e=>{
 if(paused)return true;
 const rect=canvas.getBoundingClientRect();
 pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
 ray.setFromCamera(pointer,home.camera);
 const hit=ray.intersectObjects(targets,true)[0];
 if(hit){let object=hit.object;while(object&&!object.userData.escapeId)object=object.parent;if(object)parent.postMessage({type:'escape-pick',id:object.userData.escapeId},location.origin)}
 return true;
};
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==parent)return;
 if(e.data?.type==='escape-reset')focusRoom();
 if(e.data?.type==='escape-pause')paused=!!e.data.paused;
 // Object dialogs do not change the player's orbit; only reset does.
});
parent.postMessage({type:'escape-ready'},location.origin);
