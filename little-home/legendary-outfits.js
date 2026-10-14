import * as T from './vendor/three.module.js';
export const legendaryOutfits=[
 {id:'goldTiger',name:'金虎王者',icon:'♛',color:'#d4aa51',base:'#191b22',trim:'#d4aa51',glow:'#49330d',note:'金色王冠・短披風・虎紋肩甲',price:1200},
 {id:'neon',name:'霓虹未來',icon:'◇',color:'#58cfe5',base:'#182332',trim:'#55d9ea',glow:'#229cb6',note:'青紫光條・科技眼罩・戰靴',price:1200},
 {id:'space',name:'星際探險',icon:'✦',color:'#6d99e6',base:'#e3e8ed',trim:'#5b8de5',glow:'#143974',note:'太空頭盔・生命背包・裝甲',price:1200},
 {id:'ninja',name:'赤焰忍者',icon:'≋',color:'#d65357',base:'#20212b',trim:'#d84448',glow:'#64191b',note:'紅色圍巾・忍者護腕・綁腿',price:1200},
 {id:'angel',name:'雲端天使',icon:'☼',color:'#c7a667',base:'#f2eee2',trim:'#d4b66f',glow:'#756128',note:'方形光環・幾何羽翼・金飾',price:1200},
 {id:'mage',name:'銀河魔法師',icon:'✧',color:'#9b7bdb',base:'#272342',trim:'#aa80df',glow:'#583196',note:'巫師帽・星紋長衣・浮空星',price:1200}
];
export const outfitById=id=>legendaryOutfits.find(o=>o.id===id);
function wovenTexture(o){
 const size=32,pixels=new Uint8Array(size*size*4),base=new T.Color(o.base),trim=new T.Color(o.trim),out=new T.Color();
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const seam=x===1||x===30,stitch=seam&&y%4<2;
  out.copy(base).multiplyScalar(1+((x+y)%2?-.055:.055));
  if(stitch)out.lerp(trim,.52);
  if(o.id==='mage'&&((x===10&&y>=8&&y<=12)||(y===10&&x>=8&&x<=12)))out.copy(trim);
  if(o.id==='goldTiger'&&x>22&&(x+2*y)%17<2)out.lerp(trim,.28);
  if(o.id==='neon'&&x===4&&y>5&&y<27)out.lerp(trim,.72);
  if(o.id==='space'&&y%16===0)out.multiplyScalar(.80);
  out.convertLinearToSRGB();const i=(y*size+x)*4;
  pixels[i]=Math.round(Math.min(1,out.r)*255);pixels[i+1]=Math.round(Math.min(1,out.g)*255);pixels[i+2]=Math.round(Math.min(1,out.b)*255);pixels[i+3]=255;
 }
 const texture=new T.DataTexture(pixels,size,size);texture.colorSpace=T.SRGBColorSpace;texture.magFilter=texture.minFilter=T.NearestFilter;texture.generateMipmaps=false;texture.needsUpdate=true;return texture;
}
function batchDetails(parts){
 const buckets=new Map();
 for(const mesh of parts){
  if(mesh.children.length)continue;
  let byMaterial=buckets.get(mesh.parent);if(!byMaterial)buckets.set(mesh.parent,byMaterial=new Map());
  const group=byMaterial.get(mesh.material)||[];group.push(mesh);byMaterial.set(mesh.material,group);
 }
 for(const [parent,byMaterial]of buckets)for(const [material,meshes]of byMaterial){
  if(meshes.length<2)continue;
  const pos=[],norm=[],uv=[],index=[];let offset=0;
  for(const mesh of meshes){
   mesh.updateMatrix();const normalMatrix=new T.Matrix3().getNormalMatrix(mesh.matrix),a=mesh.geometry.attributes;
   for(let i=0;i<a.position.count;i++){pos.push(...new T.Vector3().fromBufferAttribute(a.position,i).applyMatrix4(mesh.matrix));norm.push(...new T.Vector3().fromBufferAttribute(a.normal,i).applyMatrix3(normalMatrix).normalize());uv.push(a.uv.getX(i),a.uv.getY(i))}
   for(const i of mesh.geometry.index.array)index.push(offset+i);offset+=a.position.count;
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(norm,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(index);geometry.computeBoundingSphere();
  const mesh=new T.Mesh(geometry,material);mesh.name='Legendary layered details';mesh.userData.detailNames=meshes.map(m=>m.name);mesh.castShadow=true;parent.add(mesh);
  for(const old of meshes){parent.remove(old);old.geometry.dispose()}
 }
}
export function unlockLegendary(p,id,maxXP){
 const item=outfitById(id);if(!item)throw new Error('找不到這套造型');
 if(p.xp<maxXP)throw new Error('升到 20 級後即可解鎖');
 p.legendaryOwned=Array.isArray(p.legendaryOwned)?p.legendaryOwned:[];
 if(p.legendaryOwned.includes(id))throw new Error('已經擁有這套造型');
 const free=!p.legendaryFreeClaimed;
 if(!free&&p.coins<item.price)throw new Error('遊戲幣不足');
 if(free)p.legendaryFreeClaimed=true;else p.coins-=item.price;
 p.legendaryOwned.push(id);p.legendaryEquipped=id;
 return {item,free,cost:free?0:item.price};
}

// Modular cuboids are parented to the existing joints, so the costume shares
// walking, seating and bed poses without a second skeleton.
export function attachLegendaryOutfit(model,named,id){
 const o=outfitById(id);if(!o)return;
 const mats=new Map(),accents=[],cloth=wovenTexture(o),animated=[];
 const material=(color,glow=false)=>{const key=color+glow;if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color,roughness:.65,metalness:glow?.35:.15,emissive:glow?color:'#000000',emissiveIntensity:glow?.55:0}));return mats.get(key)};
 function cube(parent,name,size,pos,color=o.trim,glow=false,rot=0){const m=new T.Mesh(new T.BoxGeometry(...size),material(color,glow));m.name='Legendary '+name;m.position.set(...pos);m.rotation.z=rot;m.castShadow=true;parent.add(m);accents.push(m);return m}
 model.traverse(n=>{if(!n.isMesh)return;const name=n.parent?.name+' '+n.name;if(/White T shirt|white short sleeve|trouser/i.test(name)){n.material=n.material.clone();n.material.color.set('#ffffff');n.material.map=cloth;n.material.needsUpdate=true}if(/shoe/i.test(name)){n.material=n.material.clone();n.material.color.set(o.base)}if(n.name==='Tiger shirt print'){n.material=n.material.clone();n.material.color.set(o.trim);if(n.material.emissive){n.material.emissive.set(o.glow);n.material.emissiveIntensity=.14}}});
 const fabric=new T.MeshStandardMaterial({color:'#ffffff',map:cloth,roughness:.95});
 function textile(parent,name,size,pos,rot=0){const mesh=cube(parent,name,size,pos,o.base,false,rot);mesh.material=fabric;return mesh}
 function gem(parent,name,pos,color=o.trim,size=.032){return cube(parent,name,[size,size,.021],pos,color,true,Math.PI/4)}
 function embroidery(parent,name,x,y,z,color=o.trim){cube(parent,name+' vertical',[.010,.036,.008],[x,y,z],color);cube(parent,name+' cross',[.036,.010,.008],[x,y,z],color)}
 function chain(parent,name,points,color=o.trim){for(let i=0;i<points.length;i++){const [x,y,z]=points[i];cube(parent,name+' link '+i,[.022,.022,.012],[x,y,z],i%2?color:o.base,false,Math.PI/4)}}
 const head=named.Head;
 // Chest print remains the existing tiger decal; gold trims frame it.
 cube(model,'collar',[.27,.035,.22],[0,1.105,0]);
 cube(model,'belt',[.265,.035,.205],[0,.745,0]);
 for(const s of [-1,1]){
  cube(model,'jacket edge',[.018,.31,.025],[s*.112,.918,.105]);
  const side=s<0?'Left':'Right',shoulder=named[side+' shoulder'],elbow=named[side+' elbow'],hip=named[side+' hip'],knee=named[side+' knee'];
  textile(shoulder,'fitted sleeve',[.115,.18,.18],[s*.009,-.12,0]);
  cube(shoulder,'shoulder plate',[.14,.09,.23],[s*.014,-.035,0],o.trim,id==='neon',s*.12);
  cube(elbow,'wrist guard',[.115,.12,.16],[0,-.10,.006],o.base);
  cube(elbow,'wrist accent',[.125,.035,.17],[0,-.135,.006],o.trim,id==='neon');
  cube(hip,'knee armor',[.11,.07,.035],[0,-.30,.09]);
  cube(knee,'boot trim',[.115,.055,.175],[0,-.235,.02],o.trim,id==='neon');
  cube(shoulder,'layered pauldron',[.13,.035,.24],[s*.018,-.085,0],o.base,false,s*.14);
  for(const z of [-.085,.085])gem(shoulder,'armor rivet',[s*.042,-.032,z],o.trim,.014);
  cube(elbow,'bracer face',[.075,.085,.018],[0,-.09,.095],o.base);
  for(const y of [-.060,-.095])cube(elbow,'bracer engraving',[.064,.009,.021],[0,y,.108]);
  cube(hip,'layered knee plate',[.085,.046,.035],[0,-.30,.114],o.base);
  cube(knee,'boot armor',[.105,.17,.17],[0,-.22,.005],o.base);
  cube(knee,'toe cap',[.115,.06,.075],[0,-.335,.085],o.trim);
  cube(knee,'sole',[.12,.025,.23],[0,-.38,.035],'#161b25');
  for(const y of [-.205,-.235,-.265])cube(knee,'boot fastener',[.075,.008,.016],[0,y,.099],o.trim);
  if(['goldTiger','angel','mage'].includes(id)){
   cube(hip,'split coat skirt',[.135,.27,.025],[s*.035,-.11,-.102],o.base);
   cube(hip,'coat hem',[.145,.025,.028],[s*.035,-.235,-.103]);
   textile(hip,'front split coat',[.083,.255,.020],[s*.043,-.105,.108]);
   cube(hip,'front coat piping',[.012,.255,.024],[s*.085,-.105,.120]);
   embroidery(hip,'coat embroidered cross',s*.045,-.155,.127);
  }
 }
 cube(model,'belt buckle',[.065,.047,.025],[0,.748,.118]);gem(model,'buckle jewel',[0,.748,.138],o.trim,.022);
 for(const s of [-1,1]){cube(model,'waist strap',[.040,.063,.025],[s*.097,.743,.113],o.base);gem(model,'lapel brooch',[s*.102,1.055,.131],o.trim,.022)}
 let star=null;
 if(id==='goldTiger'){
  cube(head,'crown band',[.305,.05,.255],[0,.655,0]);
  for(const x of [-.12,0,.12])cube(head,'crown point',[.038,.085,.038],[x,.718,.11]);
  cube(model,'short royal cape',[.34,.31,.026],[0,.94,-.145],o.base);
  cube(model,'cape gold hem',[.35,.025,.03],[0,.795,-.146]);
  for(const s of [-1,1]){
   textile(model,'royal cape fold',[.085,.29,.037],[s*.125,.948,-.17],-s*.14);
   cube(model,'cape outer piping',[.018,.29,.025],[s*.163,.941,-.195],o.trim,false,-s*.14);
   cube(named[(s<0?'Left':'Right')+' shoulder'],'gold shoulder tier',[.16,.032,.23],[s*.03,.013,0]);
   gem(head,'crown side ruby',[s*.103,.663,.134],'#b53e4a',.024);
  }
  gem(head,'crown centre jewel',[0,.680,.135],'#54bfb6',.040);
  chain(model,'royal chain',Array.from({length:7},(_,i)=>[-.095+i*.031,1.048-Math.sin(i*Math.PI/6)*.045,.139]));
  chain(named['Right hip'],'waist chain',Array.from({length:6},(_,i)=>[.018+i*.013,-.02-Math.sin(i*Math.PI/5)*.075,.132]));
  for(const s of [-1,1])for(let i=0;i<3;i++)cube(model,'cape tiger stripe',[.035,.013,.008],[s*(.055+i*.02),.97-i*.045,-.19]);
 }else if(id==='neon'){
  cube(head,'square visor',[.295,.075,.022],[0,.447,.143],o.trim,true);
  cube(head,'visor lenses',[.245,.035,.024],[0,.447,.156],'#322158',true);
  for(const s of [-1,1]){cube(model,'neon chest strip',[.022,.19,.025],[s*.08,.94,.119],s<0?'#52daea':'#be69e5',true);cube(named[(s<0?'Left':'Right')+' hip'],'neon leg strip',[.023,.22,.025],[s*.041,-.15,.094],s<0?'#52daea':'#be69e5',true)}
  for(const s of [-1,1]){
   const side=s<0?'Left':'Right',color=s<0?'#52daea':'#bd69ec';
   cube(head,'visor temple',[.028,.042,.16],[s*.145,.447,.055],color,true);
   for(let i=0;i<3;i++)cube(named[side+' shoulder'],'circuit shoulder node',[.023,.016,.024],[s*.036,-.023-i*.026,.13],color,true);
   cube(named[side+' knee'],'boot power cell',[.035,.070,.021],[s*.04,-.23,.117],color,true);
   cube(model,'tech hip pouch',[.064,.09,.07],[s*.16,.76,0],o.base);
   gem(model,'pouch diode',[s*.16,.78,.04],color,.015);
  }
  cube(model,'rear battery',[.16,.22,.06],[0,.96,-.14],o.base);for(const x of [-.05,0,.05])cube(model,'rear power strip',[.013,.17,.015],[x,.96,-.177],o.trim,true);
 }else if(id==='space'){
  cube(model,'life support pack',[.24,.28,.12],[0,.96,-.17],o.base);
  cube(model,'backpack reactor',[.10,.14,.025],[0,.96,-.24],o.trim,true);
  for(const s of [-1,1])cube(head,'helmet side',[.04,.40,.32],[s*.178,.46,0],o.base);
  cube(head,'helmet top',[.395,.04,.32],[0,.68,0],o.base);
  cube(head,'helmet chin',[.395,.035,.32],[0,.26,0],o.base);
  cube(head,'visor upper frame',[.37,.023,.035],[0,.65,.17],o.trim,true);
  const visor=new T.Mesh(new T.PlaneGeometry(.32,.335),new T.MeshPhysicalMaterial({color:'#aed9f0',transparent:true,opacity:.10,roughness:.12,metalness:.15,depthWrite:false,side:T.DoubleSide}));visor.name='Legendary clear helmet visor';visor.position.set(0,.46,.183);head.add(visor);
  cube(model,'suit control panel',[.080,.12,.030],[-.078,.976,.132],'#243a54');
  for(const [i,color]of ['#72dfc4','#e9ad57','#70a5ef'].entries())cube(model,'control indicator',[.042,.013,.013],[-.078,1.01-i*.028,.156],color,true);
  cube(model,'oxygen tank',[.075,.245,.070],[.085,.974,-.225],'#b9c5d2');
  cube(model,'oxygen valve',[.042,.035,.042],[.085,1.112,-.225],o.trim);
  for(let i=0;i<5;i++)cube(model,'oxygen hose segment',[.025,.030,.038],[.125,1.06-i*.027,-.12+i*.035],'#657486');
  for(const s of [-1,1]){gem(head,'helmet lamp',[s*.178,.60,.185],'#b7e5ff',.03);cube(head,'helmet ear panel',[.021,.105,.14],[s*.203,.48,0],o.trim);for(let i=0;i<3;i++)cube(model,'pack vent',[.115,.012,.020],[-.028,.98-i*.032,-.24],'#677c99')}
 }else if(id==='ninja'){
  cube(model,'scarf wrap',[.30,.075,.24],[0,1.10,0]);
  cube(model,'scarf tail',[.065,.29,.03],[-.10,.94,-.14],o.trim,false,-.20);
  cube(model,'second scarf tail',[.065,.23,.03],[.03,.94,-.155],o.trim,false,.14);
  cube(head,'head band',[.285,.025,.025],[0,.54,.132]);
  for(const s of [-1,1]){
   const side=s<0?'Left':'Right';cube(named[side+' hip'],'ninja waist pouch',[.070,.095,.090],[s*.08,-.025,0],o.base);
   for(let i=0;i<4;i++){cube(named[side+' knee'],'shin wrap',[.118,.018,.18],[0,-.16-i*.04,.008],i%2?o.trim:'#626071');cube(named[side+' elbow'],'wrist wrap',[.12,.014,.175],[0,-.07-i*.022,.01],i%2?o.trim:'#555160')}
   cube(model,'diagonal sash',[.022,.255,.026],[s*.055,.927,.133],o.trim,false,s*.38);
   for(let i=0;i<3;i++)cube(model,'scarf tassel',[.016,.07,.025],[s*.04+i*.021,.787,-.16],o.trim);
  }
  gem(head,'headband plate',[0,.541,.150],'#c2c8cf',.030);
 }else if(id==='angel'){
  for(const s of [-1,1])for(let i=0;i<3;i++){cube(model,'geometric feather',[.07,.27-i*.04,.035],[s*(.19+i*.06),1.03+i*.015,-.16],i===2?o.trim:o.base,false,-s*(.35+i*.12))}
  for(const s of [-1,1]){cube(head,'halo side',[.022,.022,.25],[s*.15,.76,0],o.trim,true);cube(head,'halo edge',[.30,.022,.022],[0,.76,s*.125],o.trim,true)}
  for(const s of [-1,1]){
   for(let i=0;i<5;i++){
    const feather=cube(model,'outer layered feather',[.055,.26-i*.026,.025],[s*(.22+i*.049),1.06-i*.008,-.20],i%2?'#e7e1cf':'#fff7e6',false,-s*(.35+i*.13));
    cube(feather,'feather gold tip',[.057,.018,.026],[0,-(.26-i*.026)/2+.01,0]);
   }
   chain(model,'angel chain',Array.from({length:5},(_,i)=>[s*(.06+i*.015),1.035-i*.025,.143]));
   for(const y of [.86,.93,1.0])embroidery(model,'gold embroidery',s*.102,y,.137);
  }
  gem(model,'angel chest crystal',[0,1.054,.151],'#77cfc5',.042);
  animated.push(material(o.trim,true));
 }else if(id==='mage'){
  cube(head,'wizard hat brim',[.40,.035,.34],[0,.653,0],o.base);
  cube(head,'wizard hat base',[.25,.10,.23],[0,.72,0],o.base);
  cube(head,'wizard hat middle',[.16,.095,.15],[.025,.81,0],o.base,false,-.20);
  cube(head,'wizard hat tip',[.075,.09,.075],[.055,.89,0],o.trim,false,-.35);
  for(const s of [-1,1])cube(model,'star pin',[.037,.037,.025],[s*.105,1.045,.122],o.trim,true,Math.PI/4);
  star=new T.Group();star.name='Legendary floating star';star.position.set(.28,1.04,.04);model.add(star);cube(star,'star vertical',[.025,.13,.025],[0,0,0],o.trim,true);cube(star,'star horizontal',[.10,.025,.025],[0,0,0],o.trim,true);
  cube(head,'hat ribbon',[.258,.025,.242],[0,.697,0],o.trim);gem(head,'hat ruby',[.09,.719,.126],'#e7b462',.033);
  for(const s of [-1,1]){
   const side=s<0?'Left':'Right';
   for(let i=0;i<3;i++)embroidery(named[side+' hip'],'star hem',s*.055,-.05-i*.07,.137,i%2?'#d8bd78':o.trim);
   textile(model,'rear coat pleat',[.09,.27,.035],[s*.065,.90,-.149],-s*.08);
   cube(named[side+' hip'],'belt hanging charm',[.024,.09,.018],[s*.07,-.085,.143],'#d8bd78');gem(named[side+' hip'],'charm crystal',[s*.07,-.14,.143],o.trim,.025);
  }
  const crystal=cube(star,'floating crystal',[.075,.075,.075],[0,0,0],'#d2a0f3',true,Math.PI/4);crystal.rotation.x=Math.PI/4;
  for(const s of [-1,1])cube(star,'satellite star',[.021,.021,.021],[s*.10,s*.07,0],'#e8c16d',true,Math.PI/4);
 }
 batchDetails(accents);
 return {id,texture:cloth,detailCount:accents.length,update(time){if(star){star.position.y=1.04+Math.sin(time*.0018)*.025;star.rotation.y=time*.0005}for(const m of animated)m.emissiveIntensity=.42+Math.sin(time*.0015)*.10}};
}

