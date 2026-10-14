import * as T from './vendor/three.module.js';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
const blendAngle=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;

// Reparent complete limbs at their real joints, rather than sliding individual meshes.
export function rigMonster(g){
 g.updateMatrixWorld(true);g.userData.restFootY=(new T.Box3().setFromObject(g).min.y-g.position.y)/g.scale.y;
 const parts=[...g.children],legs=[],arms=[];
 function joint(name,pivot,items,parent=g){
  const node=new T.Group();node.name=name;node.position.set(...pivot);parent.add(node);
  for(const mesh of items){g.remove(mesh);mesh.position.sub(node.position);node.add(mesh)}
  return node;
 }
 for(const side of [-1,1]){
  const items=parts.filter(p=>p.name===`powerful-thigh-${side}`||p.name===`shin-${side}`||p.name===`wide-foot-${side}`||p.name.startsWith(`foot-claw-${side}-`));
  const leg=joint(`hip-pivot-${side}`,[side*.20,.57,-.03],items);g.updateMatrixWorld(true);
  legs.push({node:leg,side,baseY:leg.position.y,ground:new T.Box3().setFromObject(leg).min.y});
  arms.push(joint(`shoulder-pivot-${side}`,[side*.26,1.14,.07],parts.filter(p=>p.name===`upper-arm-${side}`||p.name===`forearm-${side}`||p.name===`clawed-hand-${side}`||p.name.startsWith(`hand-claw-${side}-`))));
 }
 const tail=joint('tail-pivot',[0,.49,-.15],parts.filter(p=>p.name.includes('tail')));
 const chest=joint('chest-pivot',[0,.70,0],parts.filter(p=>p.parent===g));
 // Shoulder pivots follow the torso; preserve their local rest positions.
 for(const arm of arms){g.remove(arm);arm.position.sub(chest.position);chest.add(arm)}
 g.userData.gait={legs,arms,tail,chest,phase:0,weight:0};
}
export function animateMonsterStride(g,distance,dt,turn=0){
 const rig=g.userData.gait;if(!rig)return;
 const effort=distance+Math.abs(turn)*.16;
 rig.weight+=(Number(effort>0)-rig.weight)*Math.min(1,dt*5);
 // Two planted steps per small stride; phase advances only with actual displacement.
 rig.phase+=effort/.16*Math.PI*2;
 const {phase,weight}=rig;
 for(const {node,side,baseY} of rig.legs){
  const s=Math.sin(phase+(side<0?0:Math.PI));node.position.y=baseY;node.rotation.x=s*.16*weight;
  g.updateMatrixWorld(true);
  const box=new T.Box3().setFromObject(node);
  // Keep the supporting foot on the floor, lifting only the swinging foot.
  const baseline=g.position.y+g.userData.restFootY*g.scale.y;
  node.position.y+=(baseline-box.min.y)/g.scale.y+Math.max(0,s)*.045*weight;
 }
 rig.arms.forEach((arm,i)=>{arm.rotation.x=-.10+Math.sin(phase+(i?0:Math.PI))*.11*weight});
 rig.chest.rotation.z=Math.sin(phase)*.012*weight;
 rig.chest.rotation.y=Math.sin(phase)*.025*weight;
 rig.tail.rotation.y=Math.sin(phase-.6)*.07*weight;
}
export function monsterBoxesAt(g,x,z,yaw=g.rotation.y){
 const c=Math.cos(yaw),s=Math.sin(yaw);
 return g.userData.collisionBoxes.map(([a,b,d,e])=>{
  const points=[[a,d],[a,e],[b,d],[b,e]].map(([px,pz])=>[px*c+pz*s+x,-px*s+pz*c+z]);
  return [Math.min(...points.map(p=>p[0])),Math.max(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[1]))];
 });
}
export const BED_SETTLE_SECONDS=2.8;
export const SEAT_SETTLE_SECONDS=1.9;
export function furnitureSupportSurfaces(scene,kind){
 const section=scene.getObjectByName(kind==='mainBed'?'main-bed':kind==='childBed'?'child-bed':kind==='sofa'?'sofa':'dining-and-island');
 if(!section)return [];
 section.updateWorldMatrix(true,true);const surfaces=[];
 section.traverse(mesh=>{
  if(!mesh.isMesh)return;const box=new T.Box3().setFromObject(mesh),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
  const bed=kind==='mainBed'||kind==='childBed';
  const accepted=bed?box.max.y>=.4&&box.max.y<=.85:kind==='sofa'?box.max.y>=.35&&box.max.y<=.65:Math.abs(center.x-(1.41+section.position.x))<.03&&Math.abs(center.z-(kind==='diningChair0'?5.94:6.63))<.03&&Math.abs(center.y-.49)<.03&&size.y<.12;
  if(accepted)surfaces.push(box);
 });return surfaces;
}
const supportVertex=new T.Vector3();
export function keepAboveFurniture(character,surfaces){
 if(!surfaces?.length)return 0;
 character.updateWorldMatrix(true,true);let lift=0;
 // Check the actual posed mesh vertices over each cushion/mattress, not the
 // character's overall AABB: dangling feet outside the seat may stay below it.
 character.traverse(mesh=>{
  const positions=mesh.isMesh&&mesh.geometry.attributes.position;if(!positions)return;
  for(let i=0;i<positions.count;i++){
   supportVertex.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);
   for(const box of surfaces)if(supportVertex.x>box.min.x+.008&&supportVertex.x<box.max.x-.008&&supportVertex.z>box.min.z+.008&&supportVertex.z<box.max.z-.008){lift=Math.max(lift,box.max.y+.012-supportVertex.y)}
  }
 });
 if(lift>0){character.position.y+=lift;character.updateWorldMatrix(true,true)}return lift;
}
export function animateSeatEntry(character,from,target,angle,progress,fromAngle,sofa=false){
 const align=smooth(progress/.28),lower=smooth((progress-.28)/.57),relax=smooth((progress-.80)/.20);
 const body=character.userData.body,end=new T.Vector3(...target);
 character.rotation.y=blendAngle(fromAngle,angle,align);
 character.position.x=from.x+(end.x-from.x)*lower;character.position.z=from.z+(end.z-from.z)*lower;
 // Root rises by the seated pelvis compensation while knees bend; the visible hips lower.
 character.position.y=from.y+(end.y-from.y)*lower;
 body.position.y=0;body.rotation.set(-.23*lower+(sofa?0:.12*Math.sin(lower*Math.PI)),0,0);
 character.userData.updatePose?.('stand');
 const model=body.children.find(n=>n.getObjectByName('Left hip'));
 if(model)model.position.y=-.72*model.scale.y*lower;
 for(const side of ['Left','Right']){
  const hip=character.getObjectByName(side+' hip'),knee=character.getObjectByName(side+' knee');
  const shoulder=character.getObjectByName(side+' shoulder'),elbow=character.getObjectByName(side+' elbow');
  if(hip)hip.rotation.x=-Math.PI/2*lower;if(knee)knee.rotation.x=Math.PI/2*lower;
  if(shoulder){shoulder.rotation.x=-.45*lower;shoulder.rotation.z=(side==='Left'?1:-1)*Math.sin(lower*Math.PI)*.10*(1-relax)}
  if(elbow)elbow.rotation.x=-1.08*lower;
 }
}
export function bedPoseAt(progress){
 const mount=smooth(progress/.30),extend=smooth((progress-.42)/.40),recline=smooth((progress-.48)/.52);
 return {mount,extend,recline,knee:Math.PI/2*mount*(1-extend),hip:-Math.PI/2*mount*(1-extend),support:smooth((progress-.18)/.15)*(1-smooth((progress-.83)/.17))};
}
export function animateBedEntry(character,from,target,angle,progress,fromAngle){
 const s=bedPoseAt(progress),body=character.userData.body;
 const end=new T.Vector3(...target),sit=end.clone();
 // Sit toward the pillow first, then slide the legs onto the mattress.
 sit.x-=Math.sin(angle)*.32;sit.z-=Math.cos(angle)*.32;
 character.position.lerpVectors(from,sit,s.mount);character.position.lerp(end,s.extend);
 character.rotation.y=blendAngle(fromAngle,angle,smooth(progress/.22));
 body.rotation.set(-Math.PI/2*s.recline,0,0);body.position.y=0;
 character.userData.updatePose?.('stand');
 const model=body.children.find(n=>n.getObjectByName('Left hip'));
 if(model){
  model.position.y=-.72*model.scale.y*s.mount*(1-s.recline);
  // Recline around the seated hips instead of briefly standing on the mattress.
  body.position.y=-.72*model.scale.y*s.mount*s.recline*Math.cos(body.rotation.x);
 }
 for(const side of ['Left','Right']){
  const hip=character.getObjectByName(side+' hip'),knee=character.getObjectByName(side+' knee');
  const shoulder=character.getObjectByName(side+' shoulder'),elbow=character.getObjectByName(side+' elbow');
  if(hip)hip.rotation.x=s.hip;if(knee)knee.rotation.x=s.knee;
  if(shoulder){shoulder.rotation.x=.32*s.support;shoulder.rotation.z=(side==='Left'?1:-1)*.12*s.support}
  if(elbow)elbow.rotation.x=-.45*s.support;
 }
 return s;
}
