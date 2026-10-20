import * as T from './vendor/three.module.js';
import {PLATFORMS,TABLES,LENGTH,BOSS_X,createSideGame} from './side-core.js?v=floor34';
export function createSideScene(makeHero){
 const scene=new T.Scene();scene.background=new T.Color('#e6e4d9');
 const camera=new T.OrthographicCamera(-10,10,6,-6,.1,90),geo=new T.BoxGeometry(1,1,1),cyl=new T.CylinderGeometry(.5,.5,1,8),mats=new Map(),extra=[];
 const mat=c=>{if(!mats.has(c))mats.set(c,new T.MeshLambertMaterial({color:c}));return mats.get(c)};
 function box(g,w,h,d,c,x=0,y=h/2,z=0){const m=new T.Mesh(geo,mat(c));m.scale.set(w,h,d);m.position.set(x,y,z);g.add(m);return m}
 function round(g,w,h,d,c,x=0,y=h/2,z=0){const m=new T.Mesh(cyl,mat(c));m.scale.set(w,h,d);m.position.set(x,y,z);g.add(m);return m}
 function group(){const g=new T.Group();scene.add(g);return g}
 scene.add(new T.HemisphereLight(0xfff9e9,0x718275,2));const light=new T.DirectionalLight(0xfff0cc,2);light.position.set(-8,14,10);scene.add(light);
 // Lower the gameplay plane while keeping the photographic backdrop framing stable.
 const groundViewOffset=1.2;
 const legacyFloor=group();
 box(legacyFloor,LENGTH+4,.5,5,'#bda98c',LENGTH/2,-.3);const plainWall=box(scene,LENGTH+4,10,.2,'#e7e4d9',LENGTH/2,4,-2.5);box(legacyFloor,LENGTH+4,.17,.26,'#f8f2e4',LENGTH/2,.18,-2.3);
 for(let x=0;x<LENGTH+2;x+=3){box(legacyFloor,.025,.025,5,'#9b896d',x,-.04);if(x%15===0)box(legacyFloor,.035,4,.08,'#d5d6c7',x,3.5,-2.34)}
 // Furniture remains behind the play plane. Table surfaces share side-core's collision coordinates.
 const furniture=[];
 function register(g,name,w,h){furniture.push({g,name,w,h});}
 function sofa(x){const g=group();g.position.set(x,0,-1.75);box(g,6,1.2,1.45,'#607e71',0,1.05);box(g,5.7,1.25,.45,'#758f7c',0,1.91,-.4);for(const sx of [-2.65,2.65])box(g,.62,1.6,1.7,'#668678',sx,.95);for(const sx of [-1.75,0,1.75]){box(g,1.65,.38,1.48,'#a0b095',sx,1.66,.14);box(g,1.34,.72,.24,'#8ea389',sx,2.18,-.03)}box(g,1,.58,.2,'#d6bca4',-1.45,2.3,.18);register(g,'sofa',6.5,3.15);}
 function table(t){const g=group();g.position.set(t.x,0,-1.8);box(g,t.w,.28,1.85,'#9d7755',0,t.y-.2);box(g,t.w-.1,.08,1.9,'#c7a17a',0,t.y-.04);for(const sx of [-t.w/2+.55,t.w/2-.55])box(g,.28,t.y-.22,.42,'#836348',sx,(t.y-.22)/2);box(g,.7,.45,.62,'#d9d3be',-1.6,t.y+.26);for(let i=0;i<3;i++)box(g,.72,.07,.5,['#b5755c','#e2cd9d','#798b74'][i],.2+i*.15,t.y+.16+i*.09);box(g,.58,.62,.55,'#d1c0a4',2,t.y+.31);box(g,.06,.48,.06,'#557758',2,t.y+.83);for(const sx of [-.28,.15,.4])box(g,.38,.08,.16,'#6d8a62',2+sx,t.y+.96+sx*.4);register(g,'table',t.w,t.y);}
 function chair(x){const g=group();g.position.set(x,0,-1.8);box(g,2.4,.3,1.4,'#a77d5b',0,1.75);box(g,2.03,.16,1.15,'#a4ae90',0,1.97);for(const sx of [-.85,.85]){box(g,.17,1.72,.2,'#8a674c',sx,.86);box(g,.18,3.55,.22,'#8a674c',sx,1.8,-.4)}box(g,2.23,.28,.2,'#b58d65',0,3.5,-.4);box(g,2.1,.2,.18,'#b58d65',0,2.85,-.4);register(g,'chair',2.4,3.6);}
 function shelf(x){const g=group();g.position.set(x,0,-2.13);box(g,3.2,4.4,.55,'#a48766',0,2.35);box(g,2.94,4.05,.06,'#d6b991',0,2.35,.3);for(const yy of [1.3,2.6,3.8])box(g,3.05,.16,.72,'#8f7357',0,yy,.48);for(const xx of [-.85,-.35,.2,.75])for(const yy of [1.65,2.94])box(g,.23,.64,.21,'#73886e',xx,yy,.53);register(g,'shelf',3.2,5.1);}
 for(const x of [5,44,94])sofa(x);for(const t of TABLES)table(t);for(const x of [33,79,122])chair(x);for(const x of [54,102])shelf(x);
 const tv=group();tv.position.set(BOSS_X,0,-2.12);box(tv,10.9,4.9,.15,'#d6d5c8',0,3.15);box(tv,9.5,4.7,.2,'#4b5d56',0,3.55,.21);box(tv,9.1,4.3,.08,'#829b8e',0,3.55,.33);box(tv,11.5,.34,1.1,'#a17e5e',0,1.15,.55);for(const sx of [-4.45,0,4.45])box(tv,3.2,.78,.9,'#b69978',sx,.6,.56);
 register(tv,'tv',11.5,7.8);
 for(const p of PLATFORMS){if(p.kind==='table')continue;const g=group();g.position.set(p.x+p.w/2,0,-.65);box(g,p.w,.22,1.3,'#9a7354',0,p.y-.11);for(const x of [-p.w/2+.25,p.w/2-.25])box(g,.18,p.y,.65,'#8e7556',x,p.y/2);register(g,'table',p.w,p.y)}
 function soldier(color='#697968'){const g=new T.Group();box(g,.52,.62,.42,color,0,.72);box(g,.43,.35,.38,'#e6c7a2',0,1.27);box(g,.62,.16,.52,'#556d58',0,1.46);box(g,.5,.22,.44,'#748973',0,1.57);box(g,.24,.3,.14,'#617666',-.37,.72,.07);for(const x of [-.17,.17])box(g,.18,.4,.26,'#4b6256',x,.24);box(g,.07,.07,.035,'#293e39',-.12,1.3,.21);box(g,.58,.12,.13,'#3c4d43',.39,.91,.26);return g}
 function jumper(){const g=new T.Group();box(g,.7,.62,.54,'#bb765c',0,1.07);box(g,.53,.4,.1,'#e8d8b8',0,1.06,.33);for(const x of [-.17,.17]){box(g,.09,.11,.04,'#344d45',x,1.1,.39);box(g,.12,.38,.13,'#7b6048',x,.48);box(g,.3,.15,.28,'#ad7355',x,.22)}box(g,.18,.14,.1,'#947651',0,.92,.4);round(g,.2,.08,.2,'#b2976c',.24,1.6);box(g,.12,.23,.12,'#b2976c',.24,1.73);return g}
 function cannon(){const g=new T.Group();box(g,1.1,.62,.65,'#a56d52',0,.72);for(const x of [-.4,.4])round(g,.34,.2,.34,'#453f39',x,.24,.38);const barrel=round(g,.38,.86,.38,'#41443d',-.45,1,.22);barrel.rotation.z=Math.PI/2;round(g,.48,.07,.48,'#d0ac70',-.88,1,.22).rotation.z=Math.PI/2;box(g,.33,.37,.28,'#e8c5a0',.5,1.13,.12);box(g,.12,.08,.04,'#293d36',.42,1.18,.28);return g}
 function hostage(){const g=new T.Group();
 // Seated fallback, replaced as one unit by the soldier-and-chair artwork.
 for(const x of [-.25,.25]){box(g,.1,.75,.1,'#836348',x,.375,-.1);box(g,.14,.35,.18,'#53654c',x,.32,.2);box(g,.2,.13,.3,'#493e32',x,.065,.29)}
 box(g,.7,.12,.65,'#a1815b',0,.75);box(g,.7,.65,.1,'#947251',0,1.1,-.3);
 box(g,.56,.57,.38,'#637352',0,1.05);box(g,.4,.33,.32,'#cfaa84',0,1.5);
 box(g,.52,.22,.43,'#526248',0,1.73);box(g,.58,.06,.48,'#3d4d39',0,1.62);
 for(const x of [-.17,.17])box(g,.22,.16,.48,'#637352',x,.84,.24);
 return g;}
 const hero=group(),actor=makeHero?.()||soldier('#527d65');actor.userData.updatePose?.('stand');actor.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(actor),size=bounds.getSize(new T.Vector3());const k=1.65/(size.y||1);actor.scale.multiplyScalar(k);actor.position.y-=bounds.min.y*k;hero.add(actor);const gun=new T.Group();gun.position.set(.16,1.08,.18);hero.add(gun);
 box(gun,.15,.18,.38,'#52665c',0,0,.18);box(gun,.17,.13,.23,'#b69a6a',0,-.01,-.12);box(gun,.1,.11,.34,'#34483f',0,.02,.49);box(gun,.14,.14,.09,'#d1b77b',0,.02,.69);box(gun,.1,.2,.1,'#34483f',0,-.15,.14);box(gun,.12,.07,.19,'#bda574',0,.12,.2);
 const defaultGunParts=[...gun.children],heldWeapons=new Map();
 const shoulders=['Left shoulder','Right shoulder'].map(n=>actor.getObjectByName(n)),elbows=['Left elbow','Right elbow'].map(n=>actor.getObjectByName(n));
 const boss=group();box(boss,1.8,1.45,1.1,'#647e60',.25,1.2);box(boss,1.3,.95,1.1,'#789066',-.48,2.66);box(boss,1.15,.4,1.05,'#b5bc92',-.9,2.44);box(boss,.75,.62,.96,'#e3d6a9',-.4,1.47,.1);for(const z of [-.44,.44]){box(boss,.7,.55,.4,'#536b53',.43,.28,z);box(boss,.31,.28,.28,'#718b60',-.58,1.41,z);round(boss,.18,.12,.18,'#ddba72',-.8,2.86,z);box(boss,.055,.1,.055,'#253b35',-.87,2.87,z+.11)}for(let i=0;i<5;i++){const spine=box(boss,.36,.55-i*.05,.46,'#b77d62',.1+i*.37,2.12-i*.31);spine.rotation.z=-.34}for(let i=0;i<4;i++)box(boss,.5-i*.08,.35-i*.05,.55-i*.08,'#617d61',1.26+i*.36,.86-i*.2);
 const tank=group();box(tank,2.15,.45,1.05,'#53604b',0,.35);box(tank,1.82,.43,1.1,'#7d8967',0,.65);box(tank,.87,.43,.78,'#9aa37c',-.1,1.02);box(tank,1.27,.15,.16,'#606e53',.73,1.01,.16);for(const x of [-.7,-.35,0,.35,.7])round(tank,.31,.13,.31,'#b3a17d',x,.3,.58).rotation.x=Math.PI/2;box(tank,1.94,.12,.08,'#3c4c41',0,.3,.69);round(tank,.17,.07,.17,'#bb9d67',-.65,1.1,-.35);
 const enemies=Array.from({length:30},(_,i)=>{const g=[soldier,jumper,cannon][i%3]();scene.add(g);return g}),shots=Array.from({length:160},()=>box(scene,.2,.14,.14,'#f5d17b')),effects=Array.from({length:32},()=>box(scene,1,1,1,'#f3ae58'));
 function label(word,kind='pickup'){
  const c=document.createElement('canvas');c.width=256;c.height=96;const ctx=c.getContext('2d');
  ctx.fillStyle=kind==='rescue'?'#dfb75e':'#f8f0d9';ctx.fillRect(8,12,240,72);
  ctx.fillStyle=kind==='rescue'?'#263e34':'#315344';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.fillText(word,128,63);
  const tex=new T.CanvasTexture(c),m=new T.SpriteMaterial({map:tex,transparent:true}),sp=new T.Sprite(m);
  sp.scale.set(kind==='rescue'?1.55:1.8,.68,1);extra.push(tex,m);return sp
 }

 // Toy-like weapon silhouettes share the hero's sage, charcoal and brass palette.
 function weaponPickup(id){
  const g=new T.Group(),mount=new T.Group();g.add(mount);
  round(mount,1.9,.08,1.9,'#d6c39d',0,-.35,-.08).rotation.x=Math.PI/2;
  box(mount,.68,.28,.18,'#52665c',-.1,.04,.12);
  box(mount,.36,.2,.17,'#b69a6a',-.59,.01,.12);
  box(mount,.13,.3,.15,'#34483f',-.2,-.19,.12);
  if(id==='H'){
   box(mount,.7,.13,.15,'#34483f',.56,.09,.12);
   box(mount,.18,.22,.19,'#d1b77b',.91,.09,.12);
   box(mount,.26,.35,.17,'#6c7c64',.12,-.21,.12);
   for(let i=0;i<4;i++)box(mount,.055,.15,.035,'#cfb379',-.05+i*.08,-.08,.23);
  }else if(id==='F'){
   round(mount,.3,.57,.3,'#b87851',-.45,-.04,.15);
   box(mount,.58,.2,.2,'#46594d',.49,.09,.13);
   box(mount,.2,.28,.24,'#d5b574',.83,.09,.13);
   const flame=box(mount,.19,.19,.09,'#e5aa57',1.04,.1,.13);flame.rotation.z=Math.PI/4;
  }else{
   box(mount,1.65,.3,.24,'#637755',.06,.13,.13);
   box(mount,.22,.4,.3,'#c2a66c',-.78,.13,.13);
   box(mount,.3,.38,.27,'#b87e58',.8,.13,.13);
   box(mount,.22,.08,.15,'#d5c29b',.14,.33,.13);
  }
  return g;
 }

 const layout=createSideGame();
 const crates=layout.crates.map((_,i)=>{const g=group();box(g,.88,1.15,.78,['#718b70','#ba815c','#c7a47c'][i%3]);box(g,.94,.13,.83,'#e1ca9e',0,1.17);box(g,.1,1.1,.09,'#e7cfa4',0,.57,.41);box(g,.8,.08,.1,'#e7cfa4',0,.68,.42);return g});
 const pickups=Array.from({length:layout.crates.length+layout.hostages.length},()=>{const g=group();for(const [id,name] of [['H','重機槍'],['F','火焰槍'],['R','火箭筒']]){const icon=weaponPickup(id);icon.name=id;g.add(icon)}return g});
 const hostages=Array.from({length:layout.hostages.length},()=>{const g=hostage(),sign=label('救援','rescue');sign.position.set(0,2.03,.45);g.add(sign);scene.add(g);return g}),warning=box(scene,20,.08,.2,'#e66d57');
 // Illustrated assets load after the scene is ready. Geometry remains a fallback while loading.
 let disposed=false;
 if(typeof window!=='undefined'){
  const loader=new T.TextureLoader();
  loader.load(new URL('./weapon-gear.webp?v=gear33',import.meta.url).href,tex=>{
   if(disposed){tex.dispose();return}extra.push(tex);tex.colorSpace=T.SRGBColorSpace;
   const material=new T.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.12,side:T.DoubleSide});
   const regions={H:[8,194,619,292],F:[640,178,605,290],R:[8,798,619,270],crate:[655,728,591,439]};
   function artwork(id,width){
    const [x,y,w,h]=regions[id],geometry=new T.PlaneGeometry(width,width*h/w),uv=geometry.attributes.uv;
    const u0=x/1254,u1=(x+w)/1254,v0=1-(y+h)/1254,v1=1-y/1254;
    uv.setXY(0,u0,v1);uv.setXY(1,u1,v1);uv.setXY(2,u0,v0);uv.setXY(3,u1,v0);
    return new T.Mesh(geometry,material);
   }
   crates.forEach(g=>{g.children.forEach(c=>c.visible=false);const plane=artwork('crate',1.35);plane.position.set(0,1.35*439/591/2,.46);g.add(plane)});
   pickups.forEach(g=>g.children.forEach(icon=>{icon.children.forEach(c=>c.visible=false);const plane=artwork(icon.name,1.8);plane.position.z=.25;icon.add(plane)}));
   for(const id of ['H','F','R']){
    const plane=artwork(id,id==='R'?1.15:1);plane.rotation.y=-Math.PI/2;plane.position.set(.02,0,.27);plane.visible=false;gun.add(plane);heldWeapons.set(id,plane);
   }
  });
  loader.load(new URL('./rescue-soldier.webp?v=soft32',import.meta.url).href,tex=>{
   if(disposed){tex.dispose();return}extra.push(tex);tex.colorSpace=T.SRGBColorSpace;
   const material=new T.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.15,side:T.DoubleSide});
   const height=1.8,geometry=new T.PlaneGeometry(height*658/1175,height),uv=geometry.attributes.uv;
   const u0=323/1312,u1=981/1312,v0=1-1177/1199,v1=1-2/1199;
   uv.setXY(0,u0,v1);uv.setXY(1,u1,v1);uv.setXY(2,u0,v0);uv.setXY(3,u1,v0);uv.needsUpdate=true;
   hostages.forEach(g=>{g.children.forEach(c=>{if(!c.isSprite)c.visible=false});const sprite=new T.Mesh(geometry,material);sprite.position.set(0,height/2,.46);g.add(sprite)});
  });
  loader.load(new URL('./furniture.webp?v=soft32',import.meta.url).href,tex=>{
   if(disposed){tex.dispose();return}extra.push(tex);tex.colorSpace=T.SRGBColorSpace;
   const regions={sofa:[25,132,645,311],table:[707,235,505,208],chair:[1248,50,262,395],tv:[45,537,595,420],shelf:[694,484,307,484]};
   const material=new T.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.12,side:T.DoubleSide});
   furniture.forEach(({g,name,w,h})=>{const [x,y,rw,rh]=regions[name],geometry=new T.PlaneGeometry(w,h),uv=geometry.attributes.uv;
    const u=x/1536,v=1-y/1024,du=rw/1536,dv=rh/1024;uv.setXY(0,u,v);uv.setXY(1,u+du,v);uv.setXY(2,u,v-dv);uv.setXY(3,u+du,v-dv);uv.needsUpdate=true;
    g.children.forEach(c=>c.visible=false);const plane=new T.Mesh(geometry,material);plane.position.set(0,h/2,.25);g.add(plane);
   });
  });
  loader.load(new URL('./home-living-backdrop.webp?v=soft32',import.meta.url).href,tex=>{
   if(disposed){tex.dispose();return}extra.push(tex);tex.colorSpace=T.SRGBColorSpace;
   const m=new T.MeshBasicMaterial({map:tex,depthWrite:false});extra.push(m);
   // Soften only the scenery material; gameplay sprites and platforms stay sharp.
   m.onBeforeCompile=shader=>{
    shader.uniforms.backdropStep={value:new T.Vector2(3/tex.image.width,3/tex.image.height)};
    shader.fragmentShader='uniform vec2 backdropStep;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
     #ifdef USE_MAP
      vec4 softColor=texture2D(map,vMapUv)*4.0;
      softColor+=2.0*texture2D(map,vMapUv+vec2(backdropStep.x,0.0));
      softColor+=2.0*texture2D(map,vMapUv-vec2(backdropStep.x,0.0));
      softColor+=2.0*texture2D(map,vMapUv+vec2(0.0,backdropStep.y));
      softColor+=2.0*texture2D(map,vMapUv-vec2(0.0,backdropStep.y));
      softColor+=texture2D(map,vMapUv+backdropStep);
      softColor+=texture2D(map,vMapUv-backdropStep);
      softColor+=texture2D(map,vMapUv+vec2(backdropStep.x,-backdropStep.y));
      softColor+=texture2D(map,vMapUv+vec2(-backdropStep.x,backdropStep.y));
      softColor/=16.0;
      float gray=dot(softColor.rgb,vec3(0.2126,0.7152,0.0722));
      softColor.rgb=mix(vec3(gray),softColor.rgb,0.72);
      softColor.rgb=mix(vec3(0.48,0.49,0.45),softColor.rgb,0.72);
      diffuseColor*=softColor;
     #endif
    `);
   };
   m.customProgramCacheKey=()=> 'soft-home-background-32';
   for(let x=15;x<LENGTH;x+=30){const plane=new T.Mesh(new T.PlaneGeometry(30,30*tex.image.height/tex.image.width),m);plane.position.set(x,6*tex.image.height/tex.image.width+groundViewOffset,-2.35);scene.add(plane)}
   plainWall.visible=false;legacyFloor.visible=false;furniture.forEach(({g,name})=>{if(name!=='table')g.visible=false});
  });
  loader.load(new URL('./battle-toys.webp?v=art-1',import.meta.url).href,tex=>{
   if(disposed){tex.dispose();return}extra.push(tex);tex.colorSpace=T.SRGBColorSpace;
   const regions={soldier:[0,0,440,530],jumper:[460,0,465,530],cannon:[945,0,591,530],hostage:[0,530,395,494],tank:[395,530,540,494],boss:[935,530,601,494]};
   const material=new T.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.09,depthWrite:false,side:T.DoubleSide});extra.push(material);
   const art=(g,name,height,y=0,z=.46)=>{
    const [x,top,w,h]=regions[name],geometry=new T.PlaneGeometry(height*w/h,height),uv=geometry.attributes.uv;
    const u0=x/1536,u1=(x+w)/1536,v0=1-(top+h)/1024,v1=1-top/1024;
    uv.setXY(0,u0,v1);uv.setXY(1,u1,v1);uv.setXY(2,u0,v0);uv.setXY(3,u1,v0);uv.needsUpdate=true;
    const plane=new T.Mesh(geometry,material);plane.position.set(0,y+height/2,z);g.add(plane);
   };
   enemies.forEach((g,i)=>{g.children.forEach(c=>c.visible=false);g.userData.illustrated=true;art(g,['soldier','jumper','cannon'][i%3],i%3===2?1.8:1.75)});

   tank.children.forEach(c=>c.visible=false);art(tank,'tank',2.2);tank.children.at(-1).rotation.y=Math.PI;
   boss.children.forEach(c=>c.visible=false);art(boss,'boss',3.35);
  });
 }
 return {scene,camera,sync(s,aspect){const half=Math.max(4.7,6/aspect),center=Math.max(half*aspect,Math.min(LENGTH-half*aspect,s.hero.x+half*aspect*.35));camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.position.set(center,1.4+groundViewOffset,24);camera.lookAt(center,1.4+groundViewOffset,0);camera.updateProjectionMatrix();const h=s.hero;hero.position.set(h.x,h.y,0);hero.rotation.y=h.face*Math.PI/2;hero.scale.y=h.crouch?.6:1;hero.visible=!s.tank.riding&&(h.inv<=s.time||Math.floor(s.time*14)%2===0);if(actor.userData.legs)actor.userData.legs.forEach((leg,i)=>leg.rotation.x=h.walking&&h.ground?Math.sin(s.time*12+i*Math.PI)*.34:0);actor.userData.updatePose?.('stand');gun.rotation.x=-(h.aimAngle||0);defaultGunParts.forEach(p=>p.visible=!heldWeapons.has(h.weapon));heldWeapons.forEach((p,id)=>p.visible=id===h.weapon);shoulders.forEach(j=>{if(j)j.rotation.x=-1.15-(h.aimAngle||0)});elbows.forEach(j=>{if(j)j.rotation.x=-.35});tank.position.x=s.tank.x;tank.rotation.y=h.face<0&&s.tank.riding?Math.PI:0;tank.visible=s.tank.hp>0;boss.position.x=s.boss.x;boss.visible=s.boss.active&&s.boss.hp>0;
 enemies.forEach((g,i)=>{const e=s.enemies[i];g.visible=e.active;g.position.set(e.x||0,e.y||0,0);g.rotation.y=(e.x>h.x)!==!!g.userData.illustrated?Math.PI:0});shots.forEach((g,i)=>{const q=s.shots[i];g.visible=q.active;if(q.active){g.position.set(q.x,q.y,.5);g.material=mat(q.enemy?'#e06a4b':q.kind==='F'?'#f7a146':'#f5d17b');g.scale.set(q.kind==='R'?.5:.22,q.kind==='W'?.35:.16,.16)}});effects.forEach((g,i)=>{const e=s.effects[i];g.visible=e.active;if(e.active){g.position.set(e.x,e.y,.7);g.scale.setScalar(e.r*(1-e.life/.4));g.rotation.z=s.time*6}});
 crates.forEach((g,i)=>{const c=s.crates[i];g.visible=c.hp>0;g.position.set(c.x,c.y,0)});hostages.forEach((g,i)=>{const p=s.hostages[i];g.visible=!p.saved;g.position.set(p.x,p.y,0)});pickups.forEach((g,i)=>{const d=s.drops[i];g.visible=!!d;if(d){g.position.set(d.x,d.y+.6+Math.sin(s.time*4)*.1,.5);g.children.forEach(c=>c.visible=c.name===d.weapon)}});warning.visible=!!s.boss.warning;warning.position.set(s.boss.x-10,s.boss.pattern===0?1.3:.2,.7);},dispose(){disposed=true;actor.userData.disposeCostume?.();const gs=new Set(),ms=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)for(const m of [].concat(o.material))ms.add(m)});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());extra.forEach(x=>x.dispose());}};
}



