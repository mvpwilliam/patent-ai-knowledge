import * as T from './vendor/three.module.js';

export function radialPosition(x,y,width,height){
 const margin=104;
 return {x:Math.max(Math.min(margin,width/2),Math.min(width-margin,x)),y:Math.max(Math.min(margin,height/2),Math.min(height-margin,y))};
}

export function installPoseRadial({getCharacter,getOthers,getPose,setPose}){
 const world=document.querySelector('#world'),canvas=document.querySelector('#scene'),menu=document.querySelector('#pose-radial');
 const ray=new T.Raycaster(),pointer=new T.Vector2(),bounds=new T.Box3(),center=new T.Vector3();
 const buttons=[...menu.querySelectorAll('[data-pose]')];let down=null;
 const blocked=()=>world.classList.contains('td-active')||!!document.querySelector('dialog[open]');
 function close(focus=false){menu.hidden=true;canvas.setAttribute('aria-expanded','false');if(focus)canvas.focus({preventScroll:true})}
 function update(){
  if(menu.hidden)return;
  const actor=getCharacter(),camera=window.homeScene?.camera;
  if(!actor||!actor.visible||!camera||blocked()){close();return}
  bounds.setFromObject(actor);bounds.getCenter(center);center.project(camera);
  if(center.z<=-1||center.z>=1||Math.abs(center.x)>1||Math.abs(center.y)>1){close();return}
  const p=radialPosition((center.x+1)*world.clientWidth/2,(1-center.y)*world.clientHeight/2,world.clientWidth,world.clientHeight);
  menu.style.left=p.x+'px';menu.style.top=p.y+'px';
  for(const b of buttons){const active=b.dataset.pose===getPose();b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))}
 }
 function toggle(keyboard=false){
  if(blocked()||!getCharacter())return false;
  if(!menu.hidden){close(keyboard);return true}
  menu.hidden=false;canvas.setAttribute('aria-expanded','true');update();
  if(keyboard&&!menu.hidden)(buttons.find(b=>b.dataset.pose===getPose())||buttons[0]).focus();
  return true;
 }
 // Called only after the camera controller has rejected drags and pinch gestures.
 window.homeGameCharacterAt=e=>{
  if(blocked())return false;
  const actor=getCharacter(),camera=window.homeScene?.camera;if(!actor||!camera)return false;
  const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
  actor.updateWorldMatrix(true,true);camera.updateMatrixWorld();ray.setFromCamera(pointer,camera);
  const targets=[actor,...getOthers().filter(Boolean)];for(const t of targets)t.updateWorldMatrix(true,true);
  const hit=ray.intersectObjects(targets,true).find(h=>h.object.visible&&h.object.material?.visible!==false);
  let owner=hit?.object;while(owner&&owner!==actor)owner=owner.parent;
  if(owner===actor)return toggle();
  close();return false;
 };
 for(const button of buttons)button.onclick=()=>{close();setPose(button.dataset.pose)};
 menu.querySelector('.radial-close').onclick=()=>close(true);
 menu.addEventListener('keydown',e=>{
  const options=[...buttons,menu.querySelector('.radial-close')],i=options.indexOf(document.activeElement);
  if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();options[(i+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)+options.length)%options.length].focus()}
 });
 canvas.tabIndex=0;canvas.setAttribute('aria-label','小屋場景；點自己的角色或按 Enter 開啟動作選單');canvas.setAttribute('aria-controls',menu.id);canvas.setAttribute('aria-expanded','false');
 canvas.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle(true)}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){e.preventDefault();close(true)}});
 document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target)&&e.target!==canvas)close()});
 canvas.addEventListener('pointerdown',e=>{if(down)close();down={id:e.pointerId,x:e.clientX,y:e.clientY}});
 canvas.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>8)close()});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{down=null});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)close()});
 new MutationObserver(()=>{if(blocked())close()}).observe(world,{attributes:true,attributeFilter:['class']});
 return {update,close};
}
