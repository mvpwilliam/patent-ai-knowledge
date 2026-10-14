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
 const mats=new Map(),accents=[];
 const material=(color,glow=false)=>{const key=color+glow;if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color,roughness:.65,metalness:glow?.35:.15,emissive:glow?color:'#000000',emissiveIntensity:glow?.55:0}));return mats.get(key)};
 function cube(parent,name,size,pos,color=o.trim,glow=false,rot=0){const m=new T.Mesh(new T.BoxGeometry(...size),material(color,glow));m.name='Legendary '+name;m.position.set(...pos);m.rotation.z=rot;m.castShadow=true;parent.add(m);accents.push(m);return m}
 model.traverse(n=>{if(!n.isMesh)return;const name=n.parent?.name+' '+n.name;if(/White T shirt|white short sleeve|trouser/i.test(name)){n.material=n.material.clone();n.material.color.set(o.base)}if(/shoe/i.test(name)){n.material=n.material.clone();n.material.color.set(o.base)}});
 const head=named.Head;
 // Chest print remains the existing tiger decal; gold trims frame it.
 cube(model,'collar',[.27,.035,.22],[0,1.105,0]);
 cube(model,'belt',[.265,.035,.205],[0,.745,0]);
 for(const s of [-1,1]){
  cube(model,'jacket edge',[.018,.31,.025],[s*.112,.918,.105]);
  const side=s<0?'Left':'Right',shoulder=named[side+' shoulder'],elbow=named[side+' elbow'],hip=named[side+' hip'],knee=named[side+' knee'];
  cube(shoulder,'shoulder plate',[.14,.09,.23],[s*.014,-.035,0],o.trim,id==='neon',s*.12);
  cube(elbow,'wrist guard',[.115,.12,.16],[0,-.10,.006],o.base);
  cube(elbow,'wrist accent',[.125,.035,.17],[0,-.135,.006],o.trim,id==='neon');
  cube(hip,'knee armor',[.11,.07,.035],[0,-.30,.09]);
  cube(knee,'boot trim',[.115,.055,.175],[0,-.235,.02],o.trim,id==='neon');
  if(['goldTiger','angel','mage'].includes(id)){
   cube(hip,'split coat skirt',[.135,.27,.025],[s*.035,-.11,-.102],o.base);
   cube(hip,'coat hem',[.145,.025,.028],[s*.035,-.235,-.103]);
  }
 }
 let star=null;
 if(id==='goldTiger'){
  cube(head,'crown band',[.305,.05,.255],[0,.655,0]);
  for(const x of [-.12,0,.12])cube(head,'crown point',[.038,.085,.038],[x,.718,.11]);
  cube(model,'short royal cape',[.34,.31,.026],[0,.94,-.145],o.base);
  cube(model,'cape gold hem',[.35,.025,.03],[0,.795,-.146]);
 }else if(id==='neon'){
  cube(head,'square visor',[.295,.075,.022],[0,.447,.143],o.trim,true);
  cube(head,'visor lenses',[.245,.035,.024],[0,.447,.156],'#322158',true);
  for(const s of [-1,1]){cube(model,'neon chest strip',[.022,.19,.025],[s*.08,.94,.119],s<0?'#52daea':'#be69e5',true);cube(named[(s<0?'Left':'Right')+' hip'],'neon leg strip',[.023,.22,.025],[s*.041,-.15,.094],s<0?'#52daea':'#be69e5',true)}
 }else if(id==='space'){
  cube(model,'life support pack',[.24,.28,.12],[0,.96,-.17],o.base);
  cube(model,'backpack reactor',[.10,.14,.025],[0,.96,-.24],o.trim,true);
  for(const s of [-1,1])cube(head,'helmet side',[.04,.40,.32],[s*.178,.46,0],o.base);
  cube(head,'helmet top',[.395,.04,.32],[0,.68,0],o.base);
  cube(head,'helmet chin',[.395,.035,.32],[0,.26,0],o.base);
  cube(head,'visor upper frame',[.37,.023,.035],[0,.65,.17],o.trim,true);
 }else if(id==='ninja'){
  cube(model,'scarf wrap',[.30,.075,.24],[0,1.10,0]);
  cube(model,'scarf tail',[.065,.29,.03],[-.10,.94,-.14],o.trim,false,-.20);
  cube(model,'second scarf tail',[.065,.23,.03],[.03,.94,-.155],o.trim,false,.14);
  cube(head,'head band',[.285,.025,.025],[0,.54,.132]);
 }else if(id==='angel'){
  for(const s of [-1,1])for(let i=0;i<3;i++){cube(model,'geometric feather',[.07,.27-i*.04,.035],[s*(.19+i*.06),1.03+i*.015,-.16],i===2?o.trim:o.base,false,-s*(.35+i*.12))}
  for(const s of [-1,1]){cube(head,'halo side',[.022,.022,.25],[s*.15,.76,0],o.trim,true);cube(head,'halo edge',[.30,.022,.022],[0,.76,s*.125],o.trim,true)}
 }else if(id==='mage'){
  cube(head,'wizard hat brim',[.40,.035,.34],[0,.653,0],o.base);
  cube(head,'wizard hat base',[.25,.10,.23],[0,.72,0],o.base);
  cube(head,'wizard hat middle',[.16,.095,.15],[.025,.81,0],o.base,false,-.20);
  cube(head,'wizard hat tip',[.075,.09,.075],[.055,.89,0],o.trim,false,-.35);
  for(const s of [-1,1])cube(model,'star pin',[.037,.037,.025],[s*.105,1.045,.122],o.trim,true,Math.PI/4);
  star=new T.Group();star.name='Legendary floating star';star.position.set(.28,1.04,.04);model.add(star);cube(star,'star vertical',[.025,.13,.025],[0,0,0],o.trim,true);cube(star,'star horizontal',[.10,.025,.025],[0,0,0],o.trim,true);
 }
 return {id,update(time){if(star){star.position.y=1.04+Math.sin(time*.0018)*.025;star.rotation.y=time*.0005}}};
}
