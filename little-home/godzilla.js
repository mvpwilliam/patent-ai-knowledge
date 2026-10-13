import * as T from './vendor/three.module.js';

// An angular, original kaiju model; its complete silhouette is normalized to height.
export function createGodzilla(height){
 const g=new T.Group();g.name='hourly-godzilla';
 const materials={
  hide:new T.MeshStandardMaterial({color:'#293a33',roughness:.88,flatShading:true}),
  armor:new T.MeshStandardMaterial({color:'#415348',roughness:.8,flatShading:true}),
  chest:new T.MeshStandardMaterial({color:'#6a7763',roughness:.92,flatShading:true}),
  claw:new T.MeshStandardMaterial({color:'#ddd8ba',roughness:.7,flatShading:true}),
  spine:new T.MeshStandardMaterial({color:'#538b89',emissive:'#164b50',emissiveIntensity:.35,roughness:.6,flatShading:true}),
  eye:new T.MeshStandardMaterial({color:'#ffb331',emissive:'#ff7900',emissiveIntensity:.9,roughness:.45}),
  mouth:new T.MeshStandardMaterial({color:'#18221e',roughness:1})
 };
 function part(name,geometry,material,x,y,z){const m=new T.Mesh(geometry,materials[material]);m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m}
 function block(name,w,h,d,mat,x,y,z){return part(name,new T.BoxGeometry(w,h,d),mat,x,y,z)}
 function bone(name,a,b,r0,r1,mat='hide'){
  const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from);
  const m=part(name,new T.CylinderGeometry(r1,r0,delta.length(),6),mat,...from.clone().add(to).multiplyScalar(.5).toArray());
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;
 }
 const torso=part('tapered-armored-torso',new T.CylinderGeometry(.23,.32,.65,7),'hide',0,.88,0);torso.scale.z=.78;torso.rotation.x=-.09;
 const hips=part('angular-hips',new T.CylinderGeometry(.29,.23,.35,6),'hide',0,.52,-.04);hips.scale.z=.8;
 block('broad-shoulders',.57,.19,.29,'armor',0,1.18,.05);
 block('neck',.25,.22,.25,'hide',0,1.29,.11);
 block('square-skull',.37,.22,.35,'hide',0,1.45,.17);
 block('long-snout',.32,.12,.29,'armor',0,1.42,.40);
 block('lower-jaw',.31,.075,.29,'hide',0,1.32,.41);
 block('mouth-line',.325,.018,.255,'mouth',0,1.365,.43);
 for(let i=0;i<5;i++)block('belly-armor-'+i,.25+i*.009,.045,.025,'chest',0,.57+i*.105,.254);
 for(const sign of [-1,1]){
  const brow=block('heavy-brow-'+sign,.045,.05,.19,'armor',sign*.19,1.495,.285);brow.rotation.z=sign*-.18;
  block('amber-eye-'+sign,.017,.032,.06,'eye',sign*.191,1.451,.326);
  block('nostril-'+sign,.018,.02,.016,'mouth',sign*.102,1.45,.551);
  bone('powerful-thigh-'+sign,[sign*.20,.57,-.03],[sign*.23,.25,.10],.135,.10);
  block('shin-'+sign,.18,.19,.19,'armor',sign*.23,.20,.13);
  block('wide-foot-'+sign,.23,.13,.30,'hide',sign*.23,.065,.19);
  bone('upper-arm-'+sign,[sign*.26,1.14,.07],[sign*.36,.94,.13],.10,.075,'armor');
  bone('forearm-'+sign,[sign*.36,.94,.13],[sign*.34,.83,.26],.075,.055);
  block('clawed-hand-'+sign,.115,.085,.14,'hide',sign*.34,.81,.30);
  for(let i=0;i<3;i++){
   const foot=part('foot-claw-'+sign+'-'+i,new T.ConeGeometry(.024,.12,3),'claw',sign*.23+(i-1)*.07,.056,.382);foot.rotation.x=Math.PI/2;
   const hand=part('hand-claw-'+sign+'-'+i,new T.ConeGeometry(.014,.10,3),'claw',sign*.34+(i-1)*.034,.795,.408);hand.rotation.x=Math.PI/2;
  }
  for(let i=0;i<3;i++)block('snout-tooth-'+sign+'-'+i,.016,.028,.014,'claw',sign*.163,1.351,.36+i*.065);
 }
 bone('heavy-tail-base',[0,.49,-.15],[0,.24,-.49],.14,.105);
 bone('tapered-tail',[0,.24,-.49],[.07,.12,-.80],.105,.055);
 bone('pointed-tail-tip',[.07,.12,-.80],[.18,.14,-1.04],.055,.008);
 function plate(name,x,y,z,h,w){
  const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(-w*.24,h*.48);shape.lineTo(0,h);shape.lineTo(w*.22,h*.52);shape.lineTo(w/2,0);shape.closePath();
  const m=part(name,new T.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:false}),'spine',x-.0175,y,z);m.rotation.y=Math.PI/2;return m;
 }
 for(const [i,[y,z,h,w]]of [[.45,-.29,.19,.20],[.68,-.25,.27,.24],[.94,-.21,.32,.25],[1.17,-.14,.28,.22],[1.36,-.02,.19,.17]].entries()){
  plate('central-jagged-dorsal-'+i,0,y,z,h,w);
  if(i<4)for(const sign of [-1,1]){const m=plate('side-dorsal-'+sign+'-'+i,sign*.16,y-.045,z+.035,h*.63,w*.78);m.rotation.z=sign*-.2}
 }
 for(let i=0;i<3;i++)plate('tail-spike-'+i,.02*i,.25-i*.045,-.48-i*.17,.12-i*.025,.14);
 g.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(g),rawHeight=bounds.max.y-bounds.min.y;
 const scale=height/rawHeight;g.scale.setScalar(scale);g.position.y=-bounds.min.y*scale;g.updateMatrixWorld(true);
 // Separate the narrow tail from the wider torso so collision does not seal the corridor.
 const groups=[g.children.filter(m=>!m.name.includes('tail')),
  [g.getObjectByName('heavy-tail-base'),g.getObjectByName('tail-spike-0')],
  [g.getObjectByName('tapered-tail'),g.getObjectByName('tail-spike-1')],
  [g.getObjectByName('pointed-tail-tip'),g.getObjectByName('tail-spike-2')]];
 g.userData.collisionBoxes=groups.map(parts=>{const b=new T.Box3();for(const m of parts)b.expandByObject(m);return [b.min.x,b.max.x,b.min.z,b.max.z]});
 g.userData.standingHeight=height;return g;
}
