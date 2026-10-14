import * as T from './vendor/three.module.js';
import {findPath,canTraverse,crossesWall,crossesDynamicObstacle} from './navigation.js?v=103';
import {pointXZ,furnitureXZ,furnitureXYZ,furnitureShift,entryZero} from './layout.js?v=85';

import {bedSlots,sameBed} from './bed-slots.js?v=107';

// A local ambient resident, never a Firebase player or an award recipient.
export function createHouseNPC(home,makeCharacter,getPeople,random=Math.random){
 const character=makeCharacter({name:'小屋主',skin:'#e9b990',hair:'korean',hairColor:'#202020',shirt:'#1b1b1b'},{bodyType:'child'});
 character.name='house-owner-npc';character.userData.isNPC=true;
 character.position.set(...[pointXZ([1.2,4.2])[0],.07,4.2]);home.scene.add(character);
 const water=new T.Group();water.name='npc-shower-water';water.visible=false;home.scene.add(water);
 for(let i=0;i<10;i++){const drop=new T.Mesh(new T.SphereGeometry(.013,6,4),new T.MeshBasicMaterial({color:'#a7dbea',transparent:true,opacity:.7}));drop.scale.y=2;water.add(drop)}
 const lego=new T.Group();lego.name='npc-table-lego';lego.visible=false;lego.position.set(1.97,.825,5.94);home.scene.add(lego);
 const brickColors=['#cd443b','#e9be42','#4b78b3','#548653','#d17e40','#79afb5'];
 for(let i=0;i<6;i++){
  const brick=new T.Group();brick.position.set((i%2-.5)*.10,0,(Math.floor(i/2)-1)*.09);
  const material=new T.MeshStandardMaterial({color:brickColors[i],roughness:.6});
  const base=new T.Mesh(new T.BoxGeometry(.075,.028,.055),material);base.position.y=.014;base.castShadow=true;brick.add(base);
  for(const x of [-.019,.019])for(const z of [-.014,.014]){const stud=new T.Mesh(new T.CylinderGeometry(.008,.008,.008,8),material);stud.position.set(x,.032,z);brick.add(stud)}
  lego.add(brick);
 }
 const booster=new T.Mesh(new T.BoxGeometry(.36,.09,.34),new T.MeshStandardMaterial({color:'#d4cfad',roughness:1}));booster.name='npc-lego-seat-cushion';booster.position.set(1.50,.575,5.94);booster.visible=false;home.scene.add(booster);
 const bathX=5.35+furnitureShift.toilet;
 const actions=[
  {id:'tv',label:'坐沙發看電視',approach:furnitureXZ('sofa',[1.72,2.04]),target:furnitureXYZ('sofa',[2.54,.51,2.03]),pose:'sit',angle:-Math.PI/2},
  {id:'lego',label:'在餐桌玩樂高',approach:[.88,5.94],target:[1.56,.62,5.94],pose:'sit',angle:Math.PI/2,duration:60000},
  ...bedSlots('mainBed').map(bed=>({id:'sleep',label:'在主臥睡覺',approach:bed.exit,target:bed.target,pose:'lie',angle:bed.angle,bed})),
  {id:'curtain',label:'拉客廳窗簾',approach:pointXZ([1.55,.50]),angle:Math.PI,pose:'work'},
  {id:'toilet',label:'坐馬桶',approach:[bathX,4.96],target:[5.72+furnitureShift.toilet,.49,4.28],angle:Math.PI,pose:'sit'},
  {id:'hands',label:'洗手',approach:[4.73+furnitureShift.basin,4.78],angle:Math.PI,pose:'work'},
  {id:'fridge',label:'開冰箱',approach:[entryZero+2.39,8.98],angle:0,pose:'work'},
  {id:'shower',label:'在淋浴間洗澡',approach:[5.68,5.18],target:[6.24,.10,5.17],angle:Math.PI/2,pose:'work'},
  ...[['客廳',1.2,3.7],['餐廳',.7,6.2],['廚房',4.0,8.7],['主臥',3.80,3.2],['次臥',3.25,6.65],['浴室',5.1,5.0],['玄關',.7,8.55],['陽台',6.5,7.6]].map(([label,x,z],i)=>({id:'room'+i,label:'在'+label+'待一下',approach:pointXZ([x,z]),pose:'stand',angle:0}))
 ];
 let state='wait',action=null,path=[],index=0,until=0,settle=0,from=null,exit=null,lastId='',step=0,previousShowerOpen=false,ownsFridge=false,ownsTV=false;
 const people=()=>getPeople().filter(Boolean);
 const occupied=a=>people().some(p=>{
  const v=p.position;
  if(a.bed){if(sameBed(a.bed,p.userData.bedReservation))return true;return v.y>.5&&Math.hypot(v.x-a.target[0],v.z-a.target[2])<.36}
  if(['toilet','hands','shower'].includes(a.id))return v.x>4.05&&v.x<6.8&&v.z>3.6&&v.z<5.49;
  const t=a.target||[a.approach[0],.07,a.approach[1]];return Math.hypot(v.x-t[0],v.z-t[2])<.62;
 });
 function finish(){
  character.userData.setBathOutfit?.(false);
  if(ownsTV){home.showNews?.(false);ownsTV=false}
  lego.visible=false;booster.visible=false;
  if(ownsFridge){home.setFridgeOpen?.(false);ownsFridge=false}
  water.visible=false;
  state=exit?'return':'wait';settle=0;from=character.position.clone();until=0;
 }
 function choose(now,forced){
  const choices=forced?actions.filter(a=>a.id===forced):actions.filter(a=>a.id!==lastId);
  for(let tries=0;tries<choices.length;tries++){
   const a=choices[(Math.floor(random()*choices.length)+tries)%choices.length];if(occupied(a))continue;
   const p=findPath([character.position.x,character.position.z],a.approach);
   if(!p.length||Math.hypot(p.at(-1)[0]-a.approach[0],p.at(-1)[1]-a.approach[1])>.45)continue;
   action=a;lastId=a.id;path=p;index=0;state='walk';until=now+60000;return true;
  }until=now+3000;return false;
 }
 function start(now){
  if(occupied(action)){finish();return}
  exit=character.position.clone();from=exit.clone();settle=0;
  if(action.id==='shower'){previousShowerOpen=!!home.showerDoor?.userData.door.open;home.setShowerOpen?.(true);character.userData.setBathOutfit?.(true)}
  if(action.id==='fridge'){home.setFridgeOpen?.(true);ownsFridge=true}
  if(action.id==='tv'){home.showNews?.(true);ownsTV=true}
  if(action.id==='lego'){lego.visible=true;booster.visible=true}
  if(action.id==='curtain')home.toggleSheer?.();
  state=action.target?'settle':'act';until=now+(action.duration||10000+random()*18000);
 }
 function update(dt,now){
  const b=character.userData.body,[left,right]=character.userData.arms,legs=character.userData.legs;
  b.position.y=0;b.rotation.set(0,0,0);for(const arm of [left,right])arm.rotation.set(0,0,0);for(const leg of legs)leg.rotation.x=0;
  if(state==='wait'){if(now>=until)choose(now);return}
  if(state==='walk'){
   if(now>until){state='wait';until=now+3000;return}
   const p=path[index],dx=p[0]-character.position.x,dz=p[1]-character.position.z,d=Math.hypot(dx,dz);
   const move=Math.min(d,dt*.9),to=d?[character.position.x+dx/d*move,character.position.z+dz/d*move]:p;
   if(!canTraverse([character.position.x,character.position.z],to)){state='wait';until=now+2000;return}
   if(people().some(p=>Math.hypot(p.position.x-to[0],p.position.z-to[1])<.30))return;
   character.position.x=to[0];character.position.z=to[1];if(d>.01)character.rotation.y=Math.atan2(dx,dz);
   step+=dt*10;b.position.y=Math.abs(Math.sin(step))*.03;left.rotation.x=Math.sin(step)*.35;right.rotation.x=-left.rotation.x;legs[0].rotation.x=-left.rotation.x;legs[1].rotation.x=left.rotation.x;
   if(d<.04){if(!canTraverse([character.position.x,character.position.z],p)){state='wait';until=now+2000;return}character.position.x=p[0];character.position.z=p[1];if(++index>=path.length)start(now)}return;
  }
  if(state==='settle'||state==='return'){
   const target=state==='return'?exit:new T.Vector3(...action.target);
   if(crossesWall([from.x,from.z],[target.x,target.z])||crossesDynamicObstacle([from.x,from.z],[target.x,target.z])){if(ownsTV){home.showNews?.(false);ownsTV=false}character.userData.setBathOutfit?.(false);lego.visible=false;booster.visible=false;state='wait';until=now+3000;exit=null;return}
   settle=Math.min(1,settle+dt/.9);character.position.lerpVectors(from,target,settle);character.rotation.y=action.angle;
   if(settle===1){if(state==='return'){if(action.id==='shower'&&!previousShowerOpen)home.setShowerOpen?.(false);exit=null;state='wait';until=now+2000;action=null}else{state='act';if(action.duration)until=now+action.duration}}return;
  }
  character.rotation.y=action.angle;
  if(action.id==='shower'&&home.camera)character.rotation.y=Math.atan2(character.position.x-home.camera.position.x,character.position.z-home.camera.position.z);
  if(action.pose==='sit'){for(const leg of legs)leg.rotation.x=-.85;b.rotation.x=action.id==='tv'?-.23:0}
  if(action.pose==='lie')b.rotation.x=-Math.PI/2;
  if(action.pose==='work'){left.rotation.x=right.rotation.x=-.75+Math.sin(now*.006)*.15}
  if(action.id==='shower'){water.visible=true;water.position.copy(character.position);water.children.forEach((drop,i)=>drop.position.set(Math.sin(i*2.4)*.17,1.3-((now*.001+i*.13)%1.2),Math.cos(i*2.4)*.17))}
  if(now>=until||occupied(action))finish();
 }
 character.userData.updateNPCDetail=now=>{
  if(state!=='act'||action?.id!=='lego')return;
  for(const [i,side]of ['Left','Right'].entries()){
   const shoulder=character.getObjectByName(side+' shoulder'),elbow=character.getObjectByName(side+' elbow');
   if(shoulder)shoulder.rotation.x=-1.05+Math.sin(now*.003+i*Math.PI)*.12;
   if(elbow)elbow.rotation.x=-.85+Math.sin(now*.003+i*Math.PI)*.14;
  }
  lego.children[0].position.y=Math.max(0,Math.sin(now*.003))*.014;
 };
 return {character,update,actions,get state(){return state},get action(){return action},startAction(id,now=performance.now()){if(state!=='wait')return false;return choose(now,id)}};
}



