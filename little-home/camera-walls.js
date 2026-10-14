import * as T from './vendor/three.module.js';
export function createWallFader(groups){
 const states=new Map(),ray=new T.Raycaster(),direction=new T.Vector3();
 for(const group of new Set(groups.filter(Boolean)))group.traverse(mesh=>{
  if(!mesh.isMesh||states.has(mesh))return;
  const original=Array.isArray(mesh.material)?mesh.material:[mesh.material],materials=original.map(m=>m.clone());
  mesh.material=Array.isArray(mesh.material)?materials:materials[0];
  states.set(mesh,{materials,base:original.map(m=>({opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite})),castShadow:mesh.castShadow,alpha:1,until:0});
 });
 const meshes=[...states.keys()];
 return {update(camera,focus,enabled,now){
  const hits=new Set();
  if(enabled&&focus){
   camera.updateMatrixWorld();
   for(const height of [.15,.55,.95]){
    const target=new T.Vector3(focus.x,focus.y+height,focus.z);direction.subVectors(target,camera.position);const distance=direction.length();
    ray.set(camera.position,direction.normalize());ray.far=Math.max(0,distance-.08);
    for(const hit of ray.intersectObjects(meshes,false)){let visible=true;for(let n=hit.object;n;n=n.parent)if(!n.visible){visible=false;break}if(visible)hits.add(hit.object)}
   }
  }
  // Fade an entire architectural group together so trim is not left floating.
  const fadedGroups=new Set();for(const mesh of hits)for(let n=mesh;n;n=n.parent)if(groups.includes(n))fadedGroups.add(n);
  for(const group of fadedGroups)group.traverse(mesh=>{const s=states.get(mesh);if(s)s.until=now+250});
  for(const [mesh,s] of states){
   const target=enabled&&s.until>now?.2:1;s.alpha+=(target-s.alpha)*.16;if(Math.abs(target-s.alpha)<.003)s.alpha=target;
   mesh.userData.cameraFaded=s.alpha<.5;mesh.castShadow=s.alpha<.995?false:s.castShadow;
   s.materials.forEach((m,i)=>{const b=s.base[i],transparent=b.transparent||s.alpha<.995;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true}m.opacity=b.opacity*s.alpha;m.depthWrite=s.alpha<.995?false:b.depthWrite});
  }
 },meshes};
}
