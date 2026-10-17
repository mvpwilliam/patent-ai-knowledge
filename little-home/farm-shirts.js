import * as T from './vendor/three.module.js';
const LABELS={sow:['都是我','在種'],water:['都是我','在澆'],harvest:['都是我','在收'],feed:['都是我','在餵'],grown:['我養','大的']};
const GREEN='#365544',CREAM='#f7f0dc';
// Transparent, crisp artwork: the shirt itself supplies the cream background.
export function shirtArtwork(id,back=false){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=640;
 const c=canvas.getContext('2d'),chick=id==='feed'||id==='grown';
 const poly=(color,points)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()};
 if(!back){c.fillStyle=GREEN;c.textAlign='center';c.font='900 94px "Noto Sans TC", "PingFang TC", sans-serif';LABELS[id].forEach((line,i)=>c.fillText(line,256,108+i*108));}
 c.save();if(back){c.translate(0,-160);}else c.translate(0,40);
 if(chick){
  // Deliberately square pixel silhouette; no antialiasing-dependent fine detail.
  const pixels=['....YYYYYY....','...YYYYYYYY...','...YYYYYYYY...','...YYKYYYYY...','..OOOYYYYYY...','...YYYYYYYYYY.','...YYYYYGGGYY.','...YYYYYGGGYY.','....YYYYYYYY..','.....OOOO.....','.....O..O.....'];
  const colors={Y:'#f6cd48',G:'#dfac2e',O:'#df8a35',K:'#293e31'};
  pixels.forEach((row,y)=>[...row].forEach((p,x)=>{if(colors[p]){c.fillStyle=colors[p];c.fillRect(60+x*28,275+y*28,28,28)}}));
 }else{
  poly('#9b7650',[[110,455],[268,415],[395,473],[235,525]]);poly('#74533a',[[110,455],[235,505],[235,565],[110,515]]);poly('#886343',[[235,505],[395,473],[395,532],[235,565]]);
  c.fillStyle=GREEN;c.fillRect(237,354,16,125);
  poly('#6d8b4f',[[245,395],[166,367],[133,306],[212,320],[253,360]]);poly('#839e62',[[250,367],[281,306],[357,285],[326,352]]);
  poly('#ae8c5b',[[327,435],[345,445],[407,348],[389,338]]);poly('#687a6c',[[321,431],[350,448],[330,488],[297,503],[302,463]]);
 }
 c.restore();return canvas;
}
export function decorateFarmShirt(actor,id){
 if(!LABELS[id]||actor.userData.farmShirt===id)return;
 actor.userData.removeFarmShirt?.();
 const torso=actor.getObjectByName('White T shirt'),decal=actor.getObjectByName('Tiger shirt print');if(!torso||!decal)return;
 const model=decal.parent,owned=[],changed=[],hidden=[];
 const cream=new T.MeshStandardMaterial({color:CREAM,roughness:1}),green=new T.MeshStandardMaterial({color:GREEN,roughness:1});
 owned.push(cream,green);actor.updateMatrixWorld(true);
 const bounds=(node,parent)=>new T.Box3().setFromObject(node).applyMatrix4(parent.matrixWorld.clone().invert());
 const b=bounds(torso,model),size=b.getSize(new T.Vector3()),cx=(b.min.x+b.max.x)/2,cz=(b.min.z+b.max.z)/2;
 actor.traverse(n=>{if(n.name.startsWith('Legendary ')||n===decal){hidden.push([n,n.visible]);n.visible=false;}if(n.isMesh&&/White T shirt|white short sleeve/i.test(n.parent?.name+' '+n.name)){changed.push([n,n.material]);n.material=cream;}});
 const group=new T.Group();group.name='Farm longline shirt';model.add(group);
 function box(parent,w,h,d,x,y,z,mat=cream){const geo=new T.BoxGeometry(w,h,d),m=new T.Mesh(geo,mat);owned.push(geo);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
 const width=size.x*1.04,depth=size.z*1.06,hip=b.min.y;
 box(group,width,size.y,depth,cx,(b.min.y+b.max.y)/2,cz);
 const hem=new T.Group();hem.position.set(cx,hip,cz);group.add(hem);
 const hemHeight=size.y*.28; // Mid-length: cover the hips without reaching mid-thigh.
 box(hem,width*1.03,hemHeight,depth,0,-hemHeight/2,0);
 // Neck ring, not a solid block over the neck.
 const neckW=width*.58,neckD=depth*.88,t=.018;
 box(group,neckW,t,t,cx,b.max.y,cz+neckD/2,green);box(group,neckW,t,t,cx,b.max.y,cz-neckD/2,green);
 for(const side of [-1,1])box(group,t,t,neckD,cx+side*neckW/2,b.max.y,cz,green);
 const cuffs=[];
 for(const side of ['Left','Right']){const sleeve=actor.getObjectByName(side+' white short sleeve');if(!sleeve)continue;const sb=bounds(sleeve,sleeve),s=sb.getSize(new T.Vector3()),center=sb.getCenter(new T.Vector3());const cuff=box(sleeve,s.x*1.03,.025,s.z*1.03,center.x,sb.min.y+.012,center.z,green);cuffs.push(cuff);}
 function print(back){const texture=new T.CanvasTexture(shirtArtwork(id,back));texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;owned.push(texture);const mat=new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.04,depthWrite:false});owned.push(mat);const w=width*(back?.25:.88),h=w*1.25,geo=new T.PlaneGeometry(w,h);owned.push(geo);const mesh=new T.Mesh(geo,mat);mesh.name=back?'Farm back emblem':'Farm chest artwork';mesh.position.set(cx,back?b.max.y-h*.72:b.max.y-h*.54,cz+(back?-1:1)*(depth/2+.002));if(back)mesh.rotation.y=Math.PI;group.add(mesh);}
 print(false);print(true);
 const oldPose=actor.userData.updatePose,oldDispose=actor.userData.disposeCostume;
 const pose=p=>{oldPose?.(p);hem.rotation.x=p==='sit'?-Math.PI/2:0;};actor.userData.updatePose=pose;
 let removed=false;const remove=()=>{if(removed)return;removed=true;group.removeFromParent();cuffs.forEach(c=>c.removeFromParent());changed.forEach(([n,m])=>n.material=m);hidden.forEach(([n,v])=>n.visible=v);owned.forEach(r=>r.dispose());actor.userData.updatePose=oldPose;actor.userData.disposeCostume=oldDispose;delete actor.userData.farmShirt;delete actor.userData.removeFarmShirt;};
 actor.userData.farmShirt=id;actor.userData.removeFarmShirt=remove;actor.userData.disposeCostume=()=>{remove();oldDispose?.();};
}
