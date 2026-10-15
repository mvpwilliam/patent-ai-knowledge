import * as T from './vendor/three.module.js';
const rigs=new WeakMap();
const v=new T.Vector3(),p=new T.Vector3(),q=new T.Quaternion();
function rig(actor){
 if(rigs.has(actor))return rigs.get(actor);
 const left=actor.getObjectByName('Left shoulder'),right=actor.getObjectByName('Right shoulder');
 if(!left||!right)return null;
 const model=left.parent,hip=actor.getObjectByName('Left hip'),waist=new T.Group();
 waist.name='Chore waist pivot';waist.position.y=hip.position.y;model.add(waist);
 for(const node of [...model.children])if(node!==waist&&!/ hip$/.test(node.name)){
  node.position.y-=waist.position.y;waist.add(node);
 }
 const arms=['Left','Right'].map(side=>{
  const shoulder=actor.getObjectByName(side+' shoulder'),elbow=actor.getObjectByName(side+' elbow'),hand=actor.getObjectByName(side+' hand');
  const box=new T.Box3();hand.traverse(n=>{if(n.isMesh){n.geometry.computeBoundingBox();box.union(n.geometry.boundingBox)}});
  const tip=box.getCenter(new T.Vector3());tip.y=box.min.y;
  return {shoulder,elbow,hand,tip};
 });
 const result={waist,arms};rigs.set(actor,result);return result;
}
export function resetChoreContact(actor){
 const r=rigs.get(actor);if(!r)return;
 r.waist.rotation.set(0,0,0);
 for(const a of r.arms){a.shoulder.quaternion.identity();a.elbow.quaternion.identity()}
}
// Joint rotations only: no scaling, root displacement, or foot animation.
export function applyChoreContact(actor,surface,t){
 const r=rig(actor);if(!r)return;
 const b=actor.userData.body;b.position.y=0;b.rotation.set(0,0,0);
 actor.updateMatrixWorld(true);
 const shoulderY=r.arms[0].shoulder.getWorldPosition(v).y;
 const clearance=shoulderY-actor.position.y<1.1?.10:.25;
 const distance=Math.hypot(actor.position.x-T.MathUtils.clamp(actor.position.x,surface.x0,surface.x1),actor.position.z-T.MathUtils.clamp(actor.position.z,surface.z0,surface.z1));
 r.waist.rotation.x=Math.min(1.3,Math.max(clearance===.10?.25:0,(shoulderY-surface.y-clearance)*2.5)+Math.max(0,distance-.26)*3);
 actor.updateMatrixWorld(true);
 const cx=T.MathUtils.clamp(actor.position.x,surface.x0+.04,surface.x1-.04);
 const cz=T.MathUtils.clamp(actor.position.z,surface.z0+.04,surface.z1-.04);
 const alongX=Math.abs(actor.position.z-cz)>Math.abs(actor.position.x-cx);
 for(let i=0;i<2;i++){
  const a=r.arms[i],offset=(i===0?-.09:.09)+(i===1?.045*Math.sin(t*3):0);
  const target=new T.Vector3(
   T.MathUtils.clamp(cx+(alongX?offset:0),surface.x0+.02,surface.x1-.02),
   surface.y+.012,
   T.MathUtils.clamp(cz+(alongX?0:offset),surface.z0+.02,surface.z1-.02));
  for(let pass=0;pass<32;pass++)for(const joint of [a.elbow,a.shoulder]){
   a.shoulder.updateWorldMatrix(true,true);
   const end=a.hand.localToWorld(a.tip.clone()),origin=joint.getWorldPosition(new T.Vector3());
   const inv=joint.parent.getWorldQuaternion(new T.Quaternion()).invert();
   const from=end.sub(origin).applyQuaternion(inv).normalize();
   const to=p.copy(target).sub(origin).applyQuaternion(inv).normalize();
   if(from.lengthSq()&&to.lengthSq()){q.setFromUnitVectors(from,to);joint.quaternion.premultiply(q)}
  }
 }
 actor.updateMatrixWorld(true);
}
export function contactStops(s){
 const result=[];
 for(const gap of [.26,.34])for(const f of [.2,.5,.8]){
  const x=s.x0+(s.x1-s.x0)*f,z=s.z0+(s.z1-s.z0)*f;
  result.push([s.x0-gap,z],[s.x1+gap,z],[x,s.z0-gap],[x,s.z1+gap]);
 }
 return result;
}
