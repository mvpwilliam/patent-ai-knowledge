import * as T from './vendor/three.module.js';
import {createFarmPet} from './farm-pets.js?v=roam-12';
import {CROPS,slots,plotState,stage} from './farm-core.js?v=evo-10';
export function createFarmScene(){
 const scene=new T.Scene();scene.background=new T.Color('#dfe7d6');const camera=new T.OrthographicCamera(-6,6,7,-7,.1,60);camera.position.set(0,11,13);camera.lookAt(0,0,0);
 scene.add(new T.HemisphereLight(0xfff8e9,0x7c9378,2.5));const sun=new T.DirectionalLight(0xffefd5,2.3);sun.position.set(-5,10,4);scene.add(sun);
 const companions=new Map();let walkTime=0,lastWalkTime=null;
 function nameTag(name){
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font='600 40px sans-serif';canvas.width=Math.ceil(ctx.measureText(name).width)+32;canvas.height=64;
  ctx.font='600 40px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=7;ctx.strokeStyle='#fafbf2';ctx.strokeText(name,canvas.width/2,32);ctx.fillStyle='#365342';ctx.fillText(name,canvas.width/2,32);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const material=new T.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}),label=new T.Sprite(material);
  label.scale.set(canvas.width/64*.48,.48,1);label.renderOrder=10;label.userData.dispose=()=>{texture.dispose();material.dispose()};return label;
 }
 function syncCompanions(f,time){
  const dt=time>0&&lastWalkTime>0?Math.min(.05,Math.max(0,time-lastWalkTime)):0;lastWalkTime=time;walkTime+=dt;
  const wanted=new Set();
  Object.entries(f.members).sort(([a],[b])=>a.localeCompare(b)).forEach(([owner,m],index)=>{
   const pet=m.pets.find(p=>p.id===m.activeId)||m.pets.at(-1);if(!pet)return;wanted.add(owner);
   const key=JSON.stringify([pet.id,pet.line,pet.feeds.length,pet.history,pet.name,stage(pet)]);
   let item=companions.get(owner);
   if(item?.key!==key){if(item){scene.remove(item.group);item.model.userData.dispose();item.label.userData.dispose()}
    const group=new T.Group(),model=createFarmPet(pet);group.add(model);model.updateMatrixWorld(true);
    // Normalize the model first so every evolution increases its overall footprint.
    const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),factor=(.52+.104*stage(pet))/Math.max(.01,size.x,size.y,size.z);
    model.scale.multiplyScalar(factor);model.position.y-=bounds.min.y*factor;group.userData.owner=owner;const label=nameTag(pet.name||'小雞');label.position.y=size.y*factor+.32;group.add(label);scene.add(group);item={group,model,label,key};companions.set(owner,item);
   }
   // Walk around the front lawn, keeping the planting grid and tools clear.
   const points=[[-1.65,2.85],[1.65,2.85],[1.65,4.35],[-1.65,4.35]],phase=(walkTime*.16+index*.93)%4,segment=Math.floor(phase),fraction=phase-segment,a=points[segment],b=points[(segment+1)%4];
   item.group.position.set(a[0]+(b[0]-a[0])*fraction,0,a[1]+(b[1]-a[1])*fraction);
   item.group.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);item.model.userData.update?.(walkTime+index,{walk:dt>0});
  });
  for(const [owner,item] of companions)if(!wanted.has(owner)){scene.remove(item.group);item.model.userData.dispose();item.label.userData.dispose();companions.delete(owner)}
 }
 const geo=new T.BoxGeometry(1,1,1),mats=new Map(),extra=[],hits=[],plants=[];
 const mat=c=>{if(!mats.has(c))mats.set(c,new T.MeshLambertMaterial({color:c}));return mats.get(c)};
 function box(parent,w,h,d,c,x=0,y=h/2,z=0){const mesh=new T.Mesh(geo,mat(c));mesh.scale.set(w,h,d);mesh.position.set(x,y,z);parent.add(mesh);return mesh}
 box(scene,8,.35,11,'#abc28d',0,-.23);box(scene,6.2,.05,7.2,'#c9c5a0',0,-.03,-.6);box(scene,5.9,.05,2.2,'#b6cd98',0,-.01,4);
 for(const x of [-3.6,3.6])for(let z=-4.8;z<=5;z+=.65)box(scene,.10,.65,.10,'#dfcea8',x,.32,z);
 for(const x of [-3.6,3.6])for(const y of [.23,.49])box(scene,.08,.08,10,'#e7d9b7',x,y,0);
 for(let x=-3.4;x<=3.5;x+=.65)box(scene,.10,.65,.10,'#dfcea8',x,.32,-5);for(const y of [.23,.49])box(scene,7.3,.08,.08,'#e7d9b7',0,y,-5);
 const positions=Array.from({length:12},(_,i)=>({x:(i%3-1)*1.8,z:Math.floor(i/3)*1.65-3.3}));
 const plots=positions.map((p,i)=>{const g=new T.Group();g.position.set(p.x,0,p.z);scene.add(g);box(g,1.55,.15,1.3,'#9c815f',0,.08);const soil=box(g,1.4,.06,1.15,'#82634b',0,.18);soil.userData.plot=i;hits.push(soil);for(let n=-1;n<=1;n++)box(g,1.2,.025,.035,'#a38863',0,.22,n*.3);const crop=new T.Group();g.add(crop);plants.push(crop);return {g,soil,crop,key:''}});
 // Little tool shed, seed drawers and watering can.
 box(scene,1.2,.7,.65,'#7d977b',-2.7,.35,4.6);box(scene,1.4,.1,.8,'#d6bc87',-2.7,.78,4.6);for(let i=0;i<3;i++){box(scene,.3,.22,.04,'#e7d6ac',-3+i*.3,.5,4.96);box(scene,.06,.04,.05,'#7e795b',-3+i*.3,.5,4.99)}box(scene,.30,.34,.27,'#8caeb1',2.8,.22,4.6);box(scene,.1,.12,.35,'#8caeb1',2.8,.28,4.85,-.5);
 function rebuildCrop(plot,id,status,phase){plot.crop.clear();if(!id)return;const height=.13+phase*.45;for(const [x,z] of [[-.32,-.23],[.3,-.17],[0,.28]]){box(plot.crop,.045,height,.045,'#698a55',x,.22+height/2,z);for(const sign of [-1,1]){const leaf=box(plot.crop,.20,.035,.10,'#8ca866',x+sign*.10,.24+height*.65,z);leaf.rotation.z=sign*.45}if(phase>.45){const c=id==='radish'?'#eee6cf':id==='tomato'?'#d36e52':'#e3a64d';const w=id==='pumpkin'?.32:.21;box(plot.crop,w,id==='radish'?.25:w,w,c,x,.23+(id==='tomato'?height*.7:.05),z);if(id==='pumpkin'){for(const dx of [-.1,.1])box(plot.crop,.025,.28,.31,'#cc8e38',x+dx,.28,z);box(plot.crop,.045,.10,.045,'#697e4c',x,.47,z)}}}plot.crop.scale.setScalar(status==='READY'?1.08:1)}
 return {scene,camera,hits,sync(f,profiles,now,aspect,time){syncCompanions(f,time);const half=Math.max(6.2,4.4/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();plots.forEach((p,i)=>{const data=f.plots[i],status=plotState(data,now),unlocked=i<slots(f),progress=data.wateredAt?Math.min(1,(now-data.wateredAt)/(data.readyAt-data.wateredAt)):0,phase=status==='PLANTED'?.1:progress<.4?.25:progress<.8?.6:1,key=[data.plantId,status,phase].join('/');p.soil.material=mat(!unlocked?'#a2a58b':status==='READY'?'#9d9c55':status==='GROWING'?'#695742':'#82634b');if(key!==p.key){p.key=key;rebuildCrop(p,data.plantId,status,phase)}p.crop.rotation.z=status==='READY'?Math.sin(time*2+i)*.025:0});

 },pick(ray){const hit=ray.intersectObjects([...hits,...Array.from(companions.values(),v=>v.group)],true)[0];if(!hit)return null;let object=hit.object;while(object){if(object.userData.owner)return {owner:object.userData.owner};object=object.parent}return {plot:hit.object.userData.plot}},dispose(){for(const item of companions.values()){item.model.userData.dispose();item.label.userData.dispose()}companions.clear();geo.dispose();mats.forEach(m=>m.dispose());extra.forEach(o=>o.userData.dispose())}};
}




