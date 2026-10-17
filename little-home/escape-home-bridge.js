// Reuse the real home geometry and furniture, without login or economy writes.
import './app.js?v=games2-1';
import * as T from './vendor/three.module.js';
import {createGodzilla} from './godzilla.js?v=103';
const style=document.createElement('style');
style.textContent='html,body{margin:0!important;width:100%;height:100%;overflow:hidden}body>header,aside,dialog,#toast{display:none!important}main{display:block!important;margin:0!important;padding:0!important;width:100%!important;height:100%!important;max-width:none!important}#world{width:100%!important;height:100%!important;min-height:0!important;border-radius:0!important;margin:0!important}#world>*:not(canvas):not(#loading):not(#error){display:none!important}';
document.head.append(style);
const home=window.homeScene,canvas=document.querySelector('#scene');
home.selectRoom('living');
const targets=[];
for(const [name,id] of [['sofa','sofa'],['television-and-console','tv'],['black-white-art','painting'],['entry-cabinet','cabinet'],['front-door-leaf','door']]){
 const object=home.root.getObjectByName(name);
 if(object){object.userData.escapeId=id;targets.push(object)}
}
const monster=createGodzilla(.42);
monster.position.set(.24+home.layout.furnitureShift.tv,.67,3.15);
monster.rotation.y=Math.PI/2;monster.userData.escapeId='monster';home.root.add(monster);targets.push(monster);
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
 if(e.data?.type==='escape-reset')home.selectRoom('living');
 if(e.data?.type==='escape-pause')paused=!!e.data.paused;
 if(e.data?.type==='escape-focus')home.selectRoom(({painting:'dining',cabinet:'entry',door:'entry',tv:'living',sofa:'living',monster:'living'})[e.data.id]||'living');
});
parent.postMessage({type:'escape-ready'},location.origin);
