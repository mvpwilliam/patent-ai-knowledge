import {newFarm,farmAction} from './farm-core.js?v=farm-1';
import {decorateFarmShirt} from './farm-home.js?v=farm-shape-5';
import {applyChoreContact,resetChoreContact,contactStops} from './chore-contact.js?v=chore-route-fix-1';
import * as T from './vendor/three.module.js';
import {installPoseRadial} from './pose-radial.js?v=home-detail-2';
import {loadHomeCache,saveHomeCache} from './home-cache.js?v=side-fast-1';
import {MAX_XP,levelInfo,hitHomeMonster} from './home-progression.js?v=home-fixes-1';
import {installToyDefense} from './toy-defense.js?v=farm-shape-5';
import {monsterApproachPoints,blocksMonsterHit} from './monster-interaction.js?v=monster-hit-1';
import {firebaseConfig} from './firebase-config.js?v=64';
import {findPath,canTraverse,walkable,crossesWall,setDynamicObstacles,crossesDynamicObstacle} from './navigation.js?v=games2-1';
import {scaleX,sinkX,stoveX,kitchenStart,furnitureShift,pointXZ,furnitureXZ,furnitureXYZ,washerPosition,entryZero} from './layout.js?v=entry-expand-1';
import {createPixelDad,createPixelChild,normalizeAvatarDesign,dadWhitePreset} from './pixel-dad.js?v=window-night-1';
import {legendaryOutfits,outfitById,unlockLegendary} from './legendary-outfits.js?v=editor-visor-1';
import {openAvatarEditor} from './avatar-editor.js?v=npc-ball-1';
import {createHouseNPC} from './house-npc.js?v=games2-1';
import {createGodzilla} from './godzilla.js?v=103';
import {bedSlots,sameBed,alignBedSlot} from './bed-slots.js?v=home-detail-2';
import {rigMonster,animateMonsterStride,monsterBoxesAt,animateBedEntry,BED_SETTLE_SECONDS,animateSeatEntry,SEAT_SETTLE_SECONDS,furnitureSupportSurfaces,keepAboveFurniture} from './character-motion.js?v=walkways-20-1';
const PLAYER_SCALE=1;

let avatarDesign=normalizeAvatarDesign({}),designPending=false;
const designLocalKey=()=>`little-home-design-${user?.uid||localActorId}`;
function setAvatarDesign(d,pending=false){avatarDesign=normalizeAvatarDesign(d);designPending=pending;localStorage.setItem(designLocalKey(),JSON.stringify(avatarDesign));}
const scene=window.homeScene?.scene;
const $=s=>document.querySelector(s);
const GAME_META_ID='__home_game_v1';
const defaults=[
 {id:'floor',label:'吸地與拖地',room:'living'}, {id:'dishes',label:'洗碗與收碗',room:'kitchen'},
 {id:'trash',label:'倒垃圾與回收',room:'entry'}, {id:'laundry',label:'洗衣',room:'balcony'},
 {id:'collect',label:'收衣',room:'balcony'}, {id:'fold',label:'摺衣',room:'main'},
 {id:'sofa',label:'整理沙發',room:'living'}, {id:'tvclean',label:'擦電視櫃',room:'living'},
 {id:'table',label:'擦餐桌',room:'dining'}, {id:'tidytable',label:'整理餐桌',room:'dining'},
 {id:'counter',label:'擦流理台',room:'kitchen'}, {id:'stove',label:'清潔爐台',room:'kitchen'},
 {id:'mainbed',label:'整理主臥床鋪',room:'main'}, {id:'childbed',label:'整理次臥床鋪',room:'child'},
 {id:'toys',label:'收玩具與書本',room:'child'}, {id:'toilet',label:'刷馬桶',room:'bath'},
 {id:'basin',label:'清洗洗手台',room:'bath'}, {id:'bath',label:'刷浴室地板',room:'bath'},
 {id:'glass',label:'擦淋浴玻璃',room:'bath'}, {id:'shoes',label:'整理鞋子',room:'entry'}
];
const chores={
  main:{room:'main',marker:[4.05,.8,2.85],stop:[3.80,3.20],icon:'🛏️'},
  child:{room:'child',marker:[3.45,.6,6.45],stop:[3.25,6.65],icon:'🧸'},
  scenery:{room:'living',marker:[1.65,1.15,.18],stop:[1.65,.48],icon:'🌄'},
  floor:{room:'living',marker:[1.00,.45,4.25],stop:[1.05,4.35],icon:'🧹'},
  dishes:{room:'kitchen',marker:[3.95,1.18,9.50],stop:[4.00,8.78],icon:'🧽'},
  laundry:{room:'balcony',marker:[6.50,1.10,6.85],stop:[6.45,7.60],icon:'🧺'},
  collect:{room:'balcony',marker:[6.78,1.15,7.55],stop:[6.45,7.75],icon:'👕'},
  bath:{room:'bath',marker:[5.20,.68,5.05],stop:[5.20,5.00],icon:'🫧'},
  trash:{room:'entry',marker:[.55,.65,8.70],stop:[.70,8.55],icon:'🗑️'},
  living:{room:'living',marker:[1.00,.45,4.25],stop:[1.05,4.35],icon:'🧹'},
  dining:{room:'dining',marker:[2.00,1.00,6.40],stop:[.75,6.40],icon:'🧽'},
  kitchen:{room:'kitchen',marker:[4.45,1.18,9.50],stop:[4.40,8.78],icon:'🧽'},
  balcony:{room:'balcony',marker:[6.50,1.10,6.85],stop:[6.45,7.60],icon:'🧺'},
  entry:{room:'entry',marker:[.55,.65,8.70],stop:[.70,8.55],icon:'🗑️'}
};
// Marker and stopping coordinates use the same physical layout as the model.
Object.values(chores).forEach(c=>{c.marker[0]=scaleX(c.marker[0]);c.stop=pointXZ(c.stop)});
chores.dishes.marker[0]=sinkX;chores.dishes.stop[0]=sinkX;
for(const id of ['laundry','balcony']){chores[id].marker=[washerPosition.x,1.10,washerPosition.z];chores[id].stop=[washerPosition.x,7.30]}
// Each built-in task uses its furniture's translated world coordinates.
Object.assign(chores,{
 sofa:{room:'living',marker:furnitureXYZ('sofa',[2.54,.78,2.03]),stop:furnitureXZ('sofa',[1.88,2.04])},
 tvclean:{room:'living',marker:furnitureXYZ('tv',[.25,.85,2.10]),stop:furnitureXZ('tv',[.78,2.10])},
 table:{room:'dining',marker:furnitureXYZ('dining',[2.22,.91,5.96]),stop:furnitureXZ('dining',[.85,5.94])},
 tidytable:{room:'dining',marker:furnitureXYZ('dining',[2.22,.91,6.64]),stop:furnitureXZ('dining',[.85,6.63])},
 counter:{room:'kitchen',marker:[kitchenStart+.24,1.05,9.61],stop:[kitchenStart+.24,8.85]},
 stove:{room:'kitchen',marker:[stoveX,1.12,9.60],stop:[stoveX,8.85]},
 mainbed:{room:'main',marker:furnitureXYZ('mainBed',[5.64,.78,1.64]),stop:furnitureXZ('mainBed',[4.25,1.68])},
 childbed:{room:'child',marker:furnitureXYZ('childBed',[5.12,.76,7.16]),stop:furnitureXZ('childBed',[4.27,6.90])},
 toys:{room:'child',marker:[scaleX(3.35),.25,7.65],stop:pointXZ([3.35,7.65])},
 toilet:{room:'bath',marker:furnitureXYZ('toilet',[5.76,.83,4.33]),stop:furnitureXZ('toilet',[5.35,4.96])},
 basin:{room:'bath',marker:furnitureXYZ('basin',[4.73,.96,4.10]),stop:furnitureXZ('basin',[4.73,4.85])},
 glass:{room:'bath',marker:[window.homeScene.layout.showerPoints.H.x,1.15,window.homeScene.layout.showerPoints.H.z],stop:[scaleX(5.5),5.15]},
 shoes:{room:'entry',marker:[entryZero+.63,1.12,8.10],stop:[entryZero+.63,8.63]},
 // No drying rack or laundry basket is modelled: use the balcony work area.
 collect:{room:'balcony',marker:[washerPosition.x,.55,7.58],stop:[washerPosition.x,7.55]},
 fold:{room:'main',marker:furnitureXYZ('mainBed',[4.80,.78,2.60]),stop:furnitureXZ('mainBed',[4.15,2.60])}
});
chores.dishes.marker=[sinkX,1.10,9.61];
const placement=t=>chores[t.id]||chores[t.room]||chores.living;
const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
let avatar=safeRead('little-home-avatar',{name:'玩家',skin:'#e9b990',hair:'korean',hairColor:'#4d3834',shirt:'#7899a0'});
const normalizeTasks=items=>{
 const incoming=Array.isArray(items)?items.filter(t=>t.id!==GAME_META_ID&&t.id!=='scenery'):[];
 const merged=[...defaults.map(t=>({...incoming.find(old=>old.id===t.id),...t})),...incoming.filter(t=>!defaults.some(d=>d.id===t.id))];
 return merged.slice(0,29);
};
if(avatar.hair==='bob')avatar.hair='korean';
let tasks=normalizeTasks(safeRead('little-home-tasks',defaults));
const GAME_DAY_MS=30*60*1000;
const today=()=>Math.floor(Date.now()/GAME_DAY_MS);
let gameDay=today(),claims={};
// Each player completes the daily rotation once; awards and completion commit together.
const isClaimed=t=>taskDone(t);
let mode='preview',auth=null,db=null,api=null,user=null,homeId='',homeReady=false,joining=false,unsubscribeTasks=null,unsubscribeClaims=null,unsubscribeProfiles=null;
let character=null,characters=new Map(),pose='stand',step=0,lastFrame=0,route=1,poseStarted=0,activity=null,travel=null,restExit=null;
let houseNPC=null,authBusy=false,connectedUid=null,poseRadial=null;
const stops=[[1.35,4.25],[1.2,3.7],[1.15,1.25],[.7,2.6],[.72,4.8],[.68,6.1],[.70,7.8],[.65,8.65]].map(pointXZ);
const tour=stops.flatMap((point,i)=>findPath(point,stops[(i+1)%stops.length]).slice(i?1:0));
const tourLengths=tour.map((point,i)=>Math.hypot(point[0]-tour[(i+1)%tour.length][0],point[1]-tour[(i+1)%tour.length][1]));
const tourDistance=tourLengths.reduce((a,b)=>a+b,0);
function pointOnTour(distance){
  let remaining=distance%tourDistance;
  for(let i=0;i<tour.length;i++){
    if(remaining<=tourLengths[i]){
      const p=tour[i],q=tour[(i+1)%tour.length],t=tourLengths[i]?remaining/tourLengths[i]:0;
      return [p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,Math.atan2(q[0]-p[0],q[1]-p[1])];
    }
    remaining-=tourLengths[i];
  }
  return [tour[0][0],tour[0][1],0];
}
const outfit=v=>({name:String(v.name||'小屋主').slice(0,12),skin:v.skin||'#e9b990',hair:v.hair==='bob'?'korean':v.hair||'korean',hairColor:v.hairColor||'#4d3834',shirt:v.shirt||'#7899a0'});
const toast=s=>{if(character&&!document.querySelector('dialog[open]')&&!/儲存|同步|Google|登入|名字|造型|家庭/.test(s))return showCharacterFeedback(s);const e=$('#toast');e.textContent=s;e.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.classList.remove('show'),2600)};
const boundedCode=s=>s.trim().toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,24);
const claimKey=()=>`little-home-claims-${gameDay}`;

function bodyPart(parent,geometry,color,x,y,z){
  const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.75}));
  mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
}
function makeCharacter(v,design={}){
 const mesh=design.bodyType==='child'?createPixelChild(v):createPixelDad(v,normalizeAvatarDesign({...design,hairStyle:design.hairStyle||v.hair}));
 // Furniture coordinates are metres; normalize the asset's arbitrary units.
 mesh.updateMatrixWorld(true);
 const sourceHeight=design.bodyType==='child'?new T.Box3().setFromObject(mesh).getSize(new T.Vector3()).y:mesh.userData.baseStandingHeight||new T.Box3().setFromObject(mesh).getSize(new T.Vector3()).y;
 mesh.scale.multiplyScalar((design.bodyType==='child'?1.20:1.80)*PLAYER_SCALE/sourceHeight);mesh.updateMatrixWorld(true);
 if(design.farmShirt)decorateFarmShirt(mesh,design.farmShirt);
 const bounds=new T.Box3().setFromObject(mesh);mesh.userData.standingHeight=bounds.max.y-bounds.min.y;return mesh;
}
function setCharacter(v){
 if(new URLSearchParams(location.search).get('avatar')==='dad-white'){v=outfit({...v,...dadWhitePreset});avatarDesign=normalizeAvatarDesign({...avatarDesign,glasses:true,eyewear:'round',hairStyle:'korean'});avatar=v;localStorage.setItem('little-home-avatar',JSON.stringify(v));fillAvatar();}
 if(!scene)return;const previous=character?.position.clone(),angle=character?.rotation.y;
 if(character){character.userData.disposeCostume?.();scene.remove(character)}character=makeCharacter(v,{...avatarDesign,legendaryOutfit:equippedLegendary(player),farmShirt:player.farmShirt});scene.add(character);
 if(previous){character.position.copy(previous);character.rotation.y=angle;resolveMonsterOverlap(character);return}
 const start=[...(user?.uid||localActorId)].reduce((sum,c)=>sum+c.charCodeAt(0),0)%tour.length;
 character.position.set(tour[start][0],.07,tour[start][1]);route=(start+1)%tour.length;
 resolveMonsterOverlap(character);
}
function leaveRest(){
 if(restExit){character.position.set(restExit[0],.07,restExit[1]);restExit=null}
 character.position.y=.07;furnitureSupport=null;
}
let currentBed=null,movementRequest=0,floorPose=false,poseLift=0,furnitureSupport=null;
function releaseBed(){currentBed=null;if(character)character.userData.bedReservation=null}
function setPose(next){
 if(activity)return toast('先完成目前的家事');if(!character)return;
 movementRequest++;cancelHandAction();travel=null;
 if(pose==='sit')window.homeScene?.showNews(false);
 // Keep the root at the clicked location, including when already on furniture.
 pose=next;floorPose=true;poseLift=0;poseStarted=performance.now();
 const body=character.userData.body;body.position.y=0;body.rotation.set(next==='lie'?-Math.PI/2:0,0,0);
 for(const limb of [...character.userData.arms,...character.userData.legs])limb.rotation.set(0,0,0);
 character.userData.updatePose?.(next);character.updateMatrixWorld(true);
 if(next!=='stand'){const bounds=new T.Box3().setFromObject(character);poseLift=Math.max(0,(character.position.y-bounds.min.y)/character.scale.y);body.position.y=poseLift}
 if(next==='stand'||currentBed&&(character.position.y<.5||Math.hypot(character.position.x-currentBed.target[0],character.position.z-currentBed.target[2])>.2))releaseBed();
 document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',b.dataset.pose===pose));publishPresence(true);
}
function bedOccupied(slot,meta=gameMeta){
 const now=Date.now();
 for(const [id,p] of Object.entries(meta.players||{})){
  if(id===playerId())continue;
  if(p.bedReservation&&now-p.bedReservation.at<45000&&sameBed(slot,p.bedReservation))return true;
  const v=p.presence;if(v?.online&&now-v.at<45000&&['lie','sit','stand'].includes(v.pose)&&Math.hypot(v.x-slot.target[0],v.z-slot.target[2])<.36&&v.y>.5)return true;
 }
 const npc=houseNPC;
 return !!(npc&&((npc.state!=='wait'&&npc.state!=='return'&&sameBed(slot,npc.action?.bed))||Math.hypot(npc.character.position.x-slot.target[0],npc.character.position.z-slot.target[2])<.36&&npc.character.position.y>.5));
}
async function moveToBed(point,kind){
 if(activity||!character)return toast('先完成目前的家事');
 const request=++movementRequest,slots=bedSlots(kind),from=restExit||[character.position.x,character.position.z];
 const path=findPath(from,slots[0].exit);if(!path.length||Math.hypot(path.at(-1)[0]-slots[0].exit[0],path.at(-1)[1]-slots[0].exit[1])>.45)return toast('這裡目前走不到');
 const destination=point||from;slots.sort((a,b)=>Math.hypot(a.target[0]-destination[0],a.target[2]-destination[1])-Math.hypot(b.target[0]-destination[0],b.target[2]-destination[1]));
 let chosen;
 try{await mutateGame((p,meta)=>{chosen=slots.find(slot=>!bedOccupied(slot,meta));if(!chosen)throw new Error('這張床已經躺滿了');p.bedReservation={kind,index:chosen.index,at:Date.now()}})}catch(e){toast(e.message||'躺位暫時無法預約');return}
 if(request!==movementRequest){publishPresence(true);return}
 moveTo(point,kind,chosen);
}

function walkStep(mesh,x,z){
 const from=[mesh.position.x,mesh.position.z];if(!canTraverse(from,[x,z]))return false;mesh.position.x=x;mesh.position.z=z;return true;
}
function resolveMonsterOverlap(mesh){
 if(!mesh||!monsterMesh)return false;
 const from=[mesh.position.x,mesh.position.z];if(!crossesDynamicObstacle(from,from))return false;
 const others=[character,houseNPC?.character,...[...characters.values()].map(p=>p.mesh)].filter(p=>p&&p!==mesh);
 let best=null,distance=Infinity;
 for(let i=-18;i<=18;i++)for(let j=-18;j<=18;j++){
  const x=from[0]+i*.08,z=from[1]+j*.08,d=i*i+j*j;
  if(!d||d>=distance||!walkable(x,z)||crossesWall(from,[x,z])||others.some(p=>Math.hypot(p.position.x-x,p.position.z-z)<.34))continue;
  best=[x,z];distance=d;
 }
 if(!best)return false;mesh.position.x=best[0];mesh.position.z=best[1];return true;
}
function refreshMonsterRoutes(){
 if(resolveMonsterOverlap(character)){travel=null;activity=null;restExit=null;pose='stand';renderTasks();toast('哥吉拉出現，先讓開一步')}
 resolveMonsterOverlap(houseNPC?.character);for(const p of characters.values())resolveMonsterOverlap(p.mesh);
 if(travel?.phase==='run'){
  const path=findPath([character.position.x,character.position.z],travel.path.at(-1));
  if(path.length){travel.path=path;travel.index=0}else{travel=null;pose='stand';toast('哥吉拉擋住了去路，請選其他位置')}
 }
 if(activity?.phase==='run'){
  const path=planChorePath([character.position.x,character.position.z],placement(activity.task).stop,activity.surface,activity.task);
  if(path.length){activity.path=path;activity.index=0}else{activity=null;pose='stand';renderTasks();toast('哥吉拉擋住了家事位置，請先擊退牠')}
 }
}
window.homeGameFocus=()=>character?{position:character.position.clone(),angle:character.rotation.y}:null;
// An explicit interaction raises the right arm, acts at full reach, then lowers it.
let handAction=null;
function cancelHandAction(){if(handAction){handAction.resolve(false);handAction=null}}
function interactWithHand(action){
 if(!character||travel||activity)return Promise.resolve(false);
 cancelHandAction();
 return new Promise(resolve=>{handAction={started:performance.now(),action,resolve,acted:false}});
}
window.homeGameInteract=interactWithHand;
function updateHandAction(now,rightArm){
 if(!handAction)return;
 const h=handAction,t=Math.max(0,(now-h.started)/1000);
 const lift=t<.25?t/.25:t<.45?1:Math.max(0,1-(t-.45)/.3);
 rightArm.rotation.x=-Math.PI/2*(lift*lift*(3-2*lift));
 if(t>=.25&&!h.acted){h.acted=true;Promise.resolve().then(h.action).then(()=>h.resolve(true)).catch(()=>{h.resolve(false);toast('互動暫時失敗，請再試一次')})}
 if(t>=.75){rightArm.rotation.x=0;handAction=null}
}
function approachTarget(point,onArrival=null,label='走到旁邊',maxRadius=.9,customPoints=null){
 if(activity){toast('先完成目前的家事');return false}if(!character)return false;
 const from=restExit||[character.position.x,character.position.z],candidates=[];
 if(customPoints){for(const p of customPoints)if(walkable(...p))candidates.push({point:p,score:Math.hypot(p[0]-from[0],p[1]-from[1])})}
 else for(const r of [0,.3,.5,.7,.9])for(let i=0;i<(r?12:1);i++){
  if(r>maxRadius)continue;const angle=i*Math.PI/6,p=[point[0]+Math.sin(angle)*r,point[1]+Math.cos(angle)*r];
  if(walkable(...p))candidates.push({point:p,score:Math.hypot(p[0]-from[0],p[1]-from[1])+r*.25});
 }
 candidates.sort((a,b)=>a.score-b.score);let path=null;
 for(const c of candidates){const p=findPath(from,c.point);if(p.length&&Math.hypot(p.at(-1)[0]-c.point[0],p.at(-1)[1]-c.point[1])<.16){path=p;break}}
 if(!path){toast('目前走不到目標旁邊');return false}
 movementRequest++;releaseBed();floorPose=false;poseLift=0;cancelHandAction();if(pose==='sit')window.homeScene?.showNews(false);leaveRest();restExit=null;pose='walk';
 travel={kind:'interact',phase:'run',path,index:0,exit:path.at(-1),target:point,onArrival};
 document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',false));return true;
}
window.homeGameApproach=approachTarget;
function moveTo(point,kind='walk',bedSlot=null){
 if(bedSlot&&character)bedSlot=alignBedSlot(character,bedSlot);
  if(activity)return toast('先完成目前的家事');
  if(!character)return;if((kind==='mainBed'||kind==='childBed')&&!bedSlot)return moveToBed(point,kind);
  movementRequest++;furnitureSupport=null;releaseBed();currentBed=bedSlot;if(character)character.userData.bedReservation=bedSlot;floorPose=false;poseLift=0;cancelHandAction();
  if(kind.startsWith('diningChair')){const z=kind==='diningChair0'?5.94:6.63;if(onlinePlayers().some(([,p])=>p.presence.pose==='sit'&&Math.hypot(p.presence.x-(1.41+furnitureShift.dining),p.presence.z-z)<.25))return toast('這張椅子有人坐，請選另一張')}
  if(pose==='sit')window.homeScene?.showNews(false);
  if(restExit&&pose!=='walk')character.position.set(restExit[0],.07,restExit[1]);
  restExit=null;travel=null;pose='stand';
  const stops={diningChair0:furnitureXZ('dining',[.88,5.94]),diningChair1:furnitureXZ('dining',[.88,6.63]),entryMirror:[entryZero+.45,9.58],bathMirror:[4.73+furnitureShift.basin,4.80],sofa:furnitureXZ('sofa',[2.00,2.04]),mainBed:furnitureXZ('mainBed',[4.25,1.68]),childBed:furnitureXZ('childBed',[4.27,6.90])};
  const destination=stops[kind]||point;
  // Open the glass door when routing into or out of the shower enclosure.
  const shower=window.homeScene?.layout.showerPoints;
  if(shower&&destination&&[destination,[character.position.x,character.position.z]].some(([x,z])=>x>shower.H.x&&z>shower.H.z&&z<6.10))window.homeScene.setShowerOpen(true);
  const path=findPath([character.position.x,character.position.z],destination);
  if(!path.length||Math.hypot(path.at(-1)[0]-destination[0],path.at(-1)[1]-destination[1])>.45)return toast('這裡目前走不到');
  pose='walk';document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',false));
  travel={kind,phase:'run',path,index:0,exit:destination,bedSlot};publishPresence(true);


}
window.homeGameMoveTo=moveTo;
let mirrorRenderer=null,mirrorPortrait=null;
function makeMirrorAvatar(){const portrait=makeCharacter(outfit(avatar),{...avatarDesign,farmShirt:player.farmShirt});portrait.name='my-mirror-reflection';return portrait}
function openMirror(){
 const dialog=$('#mirror-dialog');if(!dialog)return;
 $('#mirror-caption').textContent=`鏡中的${avatar.name}`;
 try{
  if(!mirrorRenderer){mirrorRenderer=new T.WebGLRenderer({canvas:$('#mirror-canvas'),antialias:true,alpha:false});mirrorRenderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));mirrorRenderer.setSize(260,350,false)}
  const mirrorScene=new T.Scene();mirrorScene.background=new T.Color('#dce4df');
  mirrorScene.add(new T.HemisphereLight('#ffffff','#708b78',2.5));const light=new T.DirectionalLight('#fff5e7',2);light.position.set(2,3,4);mirrorScene.add(light);
  if(mirrorPortrait)mirrorPortrait.traverse(n=>{n.geometry?.dispose();n.material?.dispose()});mirrorPortrait=makeMirrorAvatar();mirrorScene.add(mirrorPortrait);
  const camera=new T.PerspectiveCamera(37,260/350,.1,10);camera.position.set(0,.75,2.7);camera.lookAt(0,.55,0);mirrorRenderer.render(mirrorScene,camera);
  dialog.showModal();
 }catch(error){toast('鏡子畫面暫時無法顯示');console.warn(error)}
}


const jokeBubble=$('#joke-bubble');
const jokePoint=new T.Vector3();
let jokes=[],jokeStartedAt=0,jokeStep=-1,jokeSavedSecond=-1,jokePausedAt=0;
function saveJokeProgress(){
  if(!jokes.length)return;
  const now=jokePausedAt||Date.now();
  const offsetMs=((now-jokeStartedAt)%(jokes.length*20000)+jokes.length*20000)%(jokes.length*20000);
  try{localStorage.setItem('little-home-joke-progress',JSON.stringify({offsetMs}))}catch{}
}
window.addEventListener('pagehide',saveJokeProgress);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){jokePausedAt=Date.now();saveJokeProgress()}
  else if(jokePausedAt){jokeStartedAt+=Date.now()-jokePausedAt;jokePausedAt=0}
});
fetch('./assets/jokes.json?v=1').then(response=>{
  if(!response.ok)throw new Error('Joke list unavailable');
  return response.json();
}).then(data=>{
  if(!Array.isArray(data.jokes)||data.jokes.length!==244)throw new Error('Incomplete joke list');
  jokes=data.jokes;
  const saved=safeRead('little-home-joke-progress',{offsetMs:0});
  const offset=Number.isFinite(saved.offsetMs)&&saved.offsetMs>=0?saved.offsetMs%(jokes.length*20000):0;
  jokeStartedAt=Date.now()-offset;
  if(document.hidden)jokePausedAt=Date.now();
}).catch(error=>console.warn('冷笑話題庫載入失敗',error));
function updateJoke(){
  const speaker=houseNPC?.character||character;
  if(!jokes.length||!speaker)return;
  const now=jokePausedAt||Date.now();
  const second=Math.floor((now-jokeStartedAt)/1000);
  if(second!==jokeSavedSecond){jokeSavedSecond=second;saveJokeProgress()}
  const step=Math.floor((now-jokeStartedAt)/10000);
  if(step!==jokeStep){
    jokeStep=step;
    const index=Math.floor(step/2)%jokes.length,answer=step%2===1;
    $('#joke-line').textContent=answer?jokes[index].a:jokes[index].q;
  }
  jokePoint.set(speaker.position.x,speaker.position.y+1.27,speaker.position.z).project(window.homeScene.camera);
  const world=$('#world'),w=world.clientWidth,h=world.clientHeight;
  if(jokePoint.z<=-1||jokePoint.z>=1||Math.abs(jokePoint.x)>1.12||Math.abs(jokePoint.y)>1.12){
    jokeBubble.hidden=true;return;
  }
  jokeBubble.hidden=false;
  const x=(jokePoint.x+1)*w/2,y=(1-jokePoint.y)*h/2;
  const half=Math.min(120,w/2);
  jokeBubble.style.left=Math.max(half,Math.min(w-half,x))+'px';
  jokeBubble.style.top=Math.max(82,Math.min(h-48,y-8))+'px';
}
const sceneryOverlay=document.createElement('div');sceneryOverlay.hidden=true;
Object.assign(sceneryOverlay.style,{position:'fixed',inset:'0',zIndex:'200',background:'rgba(13,23,28,.88)'});
const sceneryImage=document.createElement('img');sceneryImage.src='./assets/window-view.webp';sceneryImage.alt='客廳窗外的美景';
Object.assign(sceneryImage.style,{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',maxWidth:'94vw',maxHeight:'90vh',borderRadius:'14px',boxShadow:'0 20px 70px rgba(0,0,0,.4)'});
sceneryOverlay.append(sceneryImage);document.body.append(sceneryOverlay);
let sceneryTimer;
function hideScenery(){clearTimeout(sceneryTimer);sceneryOverlay.hidden=true}
function showScenery(){clearTimeout(sceneryTimer);sceneryOverlay.hidden=false;sceneryTimer=setTimeout(hideScenery,7000)}
sceneryOverlay.onclick=hideScenery;
const characterNameLabels=new Map(),characterTitleLabels=new Map(),characterNamePoint=new T.Vector3(),characterTitleBounds=new T.Box3();
function updateCharacterNames(){
 const layer=$('#character-names'),camera=window.homeScene?.camera,world=$('#world');if(!layer||!camera)return;
 const people=[];if(character)people.push(['self',character,avatar.name,levelInfo(player.xp).title]);
 for(const [id,item] of characters){const name=profileCache[id]?.name;if(name)people.push(['player-'+id,item.mesh,name,levelInfo(gameMeta.players[id]?.xp).title])}
 if(houseNPC?.character)people.push(['npc',houseNPC.character,'小屋主','']);
 const active=new Set(people.map(([id])=>id));for(const [id,label] of characterNameLabels)if(!active.has(id)){label.remove();characterNameLabels.delete(id)}
 for(const [id,label] of characterTitleLabels)if(!active.has(id)){label.remove();characterTitleLabels.delete(id)}
 for(const [id,mesh,name,title] of people){
  let label=characterNameLabels.get(id);if(!label){label=document.createElement('span');label.className='character-name';layer.append(label);characterNameLabels.set(id,label)}
  if(label.textContent!==name)label.textContent=name;
  characterNamePoint.set(mesh.position.x,mesh.position.y-.03,mesh.position.z).project(camera);
  label.hidden=!mesh.visible||characterNamePoint.z<=-1||characterNamePoint.z>=1||Math.abs(characterNamePoint.x)>.98||Math.abs(characterNamePoint.y)>.96;
  if(!label.hidden){label.style.left=(characterNamePoint.x+1)*world.clientWidth/2+'px';label.style.top=(1-characterNamePoint.y)*world.clientHeight/2+'px'}
  if(!title){characterTitleLabels.get(id)?.remove();characterTitleLabels.delete(id);continue}
  let titleLabel=characterTitleLabels.get(id);if(!titleLabel){titleLabel=document.createElement('span');titleLabel.className='character-name character-title';layer.append(titleLabel);characterTitleLabels.set(id,titleLabel)}
  if(titleLabel.textContent!==title)titleLabel.textContent=title;
  // Refresh bounds only four times a second; project each frame without scanning meshes.
  const now=performance.now();let anchor=mesh.userData.titleAnchor;
  if(!anchor||now-anchor.at>250){
   characterTitleBounds.setFromObject(mesh);const center=characterTitleBounds.getCenter(new T.Vector3());
   anchor=mesh.userData.titleAnchor={at:now,x:center.x-mesh.position.x,y:characterTitleBounds.max.y-mesh.position.y+.10,z:center.z-mesh.position.z};
  }
  characterNamePoint.set(mesh.position.x+anchor.x,mesh.position.y+anchor.y,mesh.position.z+anchor.z).project(camera);
  titleLabel.hidden=!mesh.visible||(id==='self'&&now<feedbackUntil)||characterNamePoint.z<=-1||characterNamePoint.z>=1||Math.abs(characterNamePoint.x)>.98||Math.abs(characterNamePoint.y)>.96;
  if(!titleLabel.hidden){titleLabel.style.left=(characterNamePoint.x+1)*world.clientWidth/2+'px';titleLabel.style.top=(1-characterNamePoint.y)*world.clientHeight/2+'px'}
 }
}

let feedbackUntil=0;
const feedbackPoint=new T.Vector3(),feedbackBounds=new T.Box3();
function showCharacterFeedback(text){
 if(!character)return;
 const box=$('#character-feedback');box.textContent=text;feedbackUntil=performance.now()+2400;$('#toast').classList.remove('show');updateCharacterFeedback();
}
window.homeGameFeedback=showCharacterFeedback;
function updateCharacterFeedback(){
 const box=$('#character-feedback'),camera=window.homeScene?.camera,world=$('#world');
 if(!character||!camera||performance.now()>feedbackUntil){box.hidden=true;return}
 feedbackBounds.setFromObject(character);feedbackBounds.getCenter(feedbackPoint);feedbackPoint.y=feedbackBounds.max.y+.16;feedbackPoint.project(camera);
 if(feedbackPoint.z<=-1||feedbackPoint.z>=1||Math.abs(feedbackPoint.x)>.96||Math.abs(feedbackPoint.y)>.96){box.hidden=true;return}
 box.hidden=false;box.style.left=(feedbackPoint.x+1)*world.clientWidth/2+'px';box.style.top=(1-feedbackPoint.y)*world.clientHeight/2+'px';
}

function animate(now){
  updateMarkers();updateMonsterLabel();updateCharacterFeedback();
  if(!character)return;
  const dt=Math.min(.06,(now-lastFrame)/1000||0);lastFrame=now;updateMonsterRoam(dt,now);
  resetChoreContact(character);
  const b=character.userData.body;
  const [leftArm,rightArm]=character.userData.arms,[leftLeg,rightLeg]=character.userData.legs;
  leftArm.position.set(-.20,.42,.015);rightArm.position.set(.20,.42,.015);
  leftArm.rotation.set(0,0,0);rightArm.rotation.set(0,0,0);
  leftLeg.rotation.x=rightLeg.rotation.x=0;
  if(travel){
    if(travel.phase==='run'){
      const [x,z]=travel.path[travel.index],dx=x-character.position.x,dz=z-character.position.z,d=Math.hypot(dx,dz);
      if(d<.04){walkStep(character,x,z);travel.index++;if(travel.index>=travel.path.length){
        if(travel.kind==='walk'||travel.kind==='interact'){
         const done=travel;travel=null;pose='stand';
         if(done.target)character.rotation.y=Math.atan2(done.target[0]-character.position.x,done.target[1]-character.position.z);
         document.querySelectorAll('[data-pose]').forEach(btn=>btn.classList.toggle('active',btn.dataset.pose==='stand'));
         if(done.onArrival)Promise.resolve(done.onArrival()).catch(()=>toast('互動暫時失敗，請再試一次'));
        }
        else if(travel.kind.includes('Mirror')){const kind=travel.kind;travel=null;pose='stand';character.rotation.y=kind==='entryMirror'?-Math.PI/2:Math.PI;openMirror()}else{travel.phase='settle';travel.from=character.position.clone();travel.fromAngle=character.rotation.y;travel.progress=0}
      }}else{const move=Math.min(d,dt*1.6);walkStep(character,character.position.x+dx/d*move,character.position.z+dz/d*move);character.rotation.y=Math.atan2(dx,dz)}
      step+=dt*17;b.position.y=Math.abs(Math.sin(step))*.035;b.rotation.set(0,0,Math.sin(step)*.035);
      leftArm.rotation.x=Math.sin(step)*.5;rightArm.rotation.x=-Math.sin(step)*.5;
      leftLeg.rotation.x=-Math.sin(step)*.4;rightLeg.rotation.x=Math.sin(step)*.4;
    }else{
      if(travel.bedSlot&&bedOccupied(travel.bedSlot)){releaseBed();travel=null;pose='stand';publishPresence(true);toast('躺位有人了，請再點一次床');return}
      if(!furnitureSupport)furnitureSupport=furnitureSupportSurfaces(scene,travel.kind);
      const isBed=!!travel.bedSlot,isSeat=travel.kind==='sofa'||travel.kind.startsWith('diningChair');travel.progress=Math.min(1,travel.progress+dt/(isBed?BED_SETTLE_SECONDS:isSeat?SEAT_SETTLE_SECONDS:.65));
      const target=travel.bedSlot?.target|| (travel.kind.startsWith('diningChair')?furnitureXYZ('dining',[1.41,.37,travel.kind==='diningChair0'?5.94:6.63]):travel.kind==='sofa'?furnitureXYZ('sofa',[2.54,.51,2.03]):travel.kind==='mainBed'?furnitureXYZ('mainBed',[5.16,.78,1.64]):furnitureXYZ('childBed',[5.12,.78,7.00]));
      if(crossesWall([travel.from.x,travel.from.z],[target[0],target[2]])||crossesDynamicObstacle([travel.from.x,travel.from.z],[target[0],target[2]])){releaseBed();travel=null;pose='stand';publishPresence(true);toast('前方被擋住，請重新選擇');return}if(isBed)animateBedEntry(character,travel.from,target,travel.bedSlot.angle,travel.progress,travel.fromAngle);else if(isSeat)animateSeatEntry(character,travel.from,target,travel.kind.startsWith('diningChair')?Math.PI/2:-Math.PI/2,travel.progress,travel.fromAngle,travel.kind==='sofa');else character.position.lerpVectors(travel.from,new T.Vector3(...target),travel.progress);
      if(travel.progress>=1){
        const kind=travel.kind;restExit=travel.exit;travel=null;
        pose=kind==='sofa'||kind.startsWith('diningChair')?'sit':'lie';
        character.rotation.y=kind.startsWith('diningChair')?Math.PI/2:kind==='mainBed'?-Math.PI/2:kind==='childBed'?Math.PI:-Math.PI/2;
        document.querySelectorAll('[data-pose]').forEach(btn=>btn.classList.toggle('active',btn.dataset.pose===pose));
        if(kind==='sofa')window.homeScene?.showNews(true);
      }
    }
  }else if(activity?.phase==='run'||activity?.phase==='return'){
    const [x,z]=activity.path[activity.index],dx=x-character.position.x,dz=z-character.position.z,d=Math.hypot(dx,dz);
    if(d<.035){if(!walkStep(character,x,z)){rerouteChore(activity);return}activity.index++;if(activity.index>=activity.path.length){
      if(activity.phase==='return'){activity=null;pose='stand';renderTasks()}
      else{activity.phase='work';activity.started=now;faceTaskTarget(activity.task);character.userData.body.position.y=0;if(activity.task.id==='scenery'){character.rotation.y=Math.PI;showScenery()}toast(`開始${activity.task.label}`)}
    }}
    else{const move=Math.min(d,dt*2.05);if(!walkStep(character,character.position.x+dx/d*move,character.position.z+dz/d*move)){rerouteChore(activity);return}character.rotation.y=Math.atan2(dx,dz)}
    step+=dt*19;b.position.y=Math.abs(Math.sin(step))*.050;b.rotation.set(0,0,Math.sin(step)*.055);
    leftArm.rotation.x=Math.sin(step)*.8;rightArm.rotation.x=-Math.sin(step)*.8;
    leftLeg.rotation.x=-Math.sin(step)*.6;rightLeg.rotation.x=Math.sin(step)*.6;
  }else if(activity?.phase==='work'){
    faceTaskTarget(activity.task);
    const t=(now-activity.started)/1000;
    b.position.y=0;b.rotation.set(0,0,0);
    leftArm.position.z=.18;rightArm.position.z=.18;
    leftArm.position.y=.49+Math.sin(t*3)*.06;rightArm.position.y=.49+Math.sin(t*3+Math.PI)*.06;
    leftArm.rotation.x=rightArm.rotation.x=-.75;
    if(activity.task.id==='scenery'){b.position.y=.008*Math.sin(t*3);b.rotation.set(0,0,0);leftArm.position.set(-.20,.42,.015);rightArm.position.set(.20,.42,.015);leftArm.rotation.x=rightArm.rotation.x=0}
    if(t>=(activity.task.id==='scenery'?7:2)){if(activity.task.id==='scenery')hideScenery();const finished=activity;activity=null;b.rotation.x=0;finishTask(finished)}
  }else if(pose==='sit'){
    b.position.y=floorPose?poseLift:0;b.rotation.x=floorPose||restExit?.[0]===.88?0:-.23;b.rotation.z=0;for(const leg of [leftLeg,rightLeg])leg.rotation.x=-.85;
  }else if(pose==='lie'){
    b.position.y=floorPose?poseLift:0;b.rotation.x=-Math.PI/2;b.rotation.z=0;
  }else{b.position.y=Math.sin(now*.0015)*.008;b.rotation.x=0;b.rotation.z=0}
  updateHandAction(now,rightArm);
  if(!(travel?.phase==='settle'&&(travel.bedSlot||travel.kind==='sofa'||travel.kind.startsWith('diningChair')))){character.userData.updatePose?.(activity?.phase==='work'?'work':travel?'walk':pose);for(const side of ['Left','Right']){const shoulder=character.getObjectByName(side+' shoulder');if(shoulder)shoulder.rotation.z=0}}
  if(activity?.phase==='work'&&activity.surface)applyChoreContact(character,activity.surface,(now-activity.started)/1000);
  if(furnitureSupport&&(travel?.phase==='settle'||restExit)&&!activity)keepAboveFurniture(character,furnitureSupport);
  const nearBalconyDoor=[character,houseNPC?.character].filter(Boolean).some(p=>Math.abs(p.position.x-scaleX(5.83))<1.12&&Math.abs(p.position.z-8.68)<.82);
  window.homeScene?.setBalconyDoor(nearBalconyDoor);
  window.homeScene?.updateDoorsAt(character.position.x,character.position.z,houseNPC?[[houseNPC.character.position.x,houseNPC.character.position.z]]:[]);
  animateOthers(dt,now);
  houseNPC?.update(dt,now);
  if(houseNPC){houseNPC.character.userData.updatePose?.(houseNPC.state==='act'?houseNPC.action?.pose:houseNPC.state==='walk'?'walk':'stand');houseNPC.character.userData.updateNPCDetail?.(now);}
  if(houseNPC&&$('#npc-status'))$('#npc-status').textContent=`小屋日常 · ${houseNPC.action?.label||'在家休息'}`;
  updateJoke();updateCharacterNames();poseRadial?.update();
}
window.homeGameUpdate=animate;

function readLocalClaims(){claims=safeRead(claimKey(),{})}
function clock(){
  const current=today();
  if(current!==gameDay){gameDay=current;claims={};if(mode==='preview')readLocalClaims();else subscribeClaims();renderTasks()}
  if(!document.hidden)publishPresence();syncCharacters();renderMonster();
  const left=GAME_DAY_MS-Date.now()%GAME_DAY_MS;
  $('#game-clock').textContent=`家事重置 ${String(Math.floor(left/60000)).padStart(2,'0')}:${String(Math.floor(left%60000/1000)).padStart(2,'0')}`;
}
function renderTasks(){
  $('#home-create').hidden=homeReady;
  const list=$('#task-list');list.replaceChildren();
  for(const t of dayTasks()){
    if(isClaimed(t))continue;
    const row=document.createElement('div');row.className='task-row';
    const label=document.createElement('span');label.textContent=`${t.label} · ${taskReward(t).coins} 幣 / 20 EXP`;
    const button=document.createElement('button');button.textContent='前往';
    button.disabled=!!activity||(mode==='online'&&(!user||!homeReady));
    button.onclick=()=>startTask(t);
    row.append(label,button);list.append(row);
  }
  if(!list.children.length){const message=document.createElement('p');message.className='task-intro';message.textContent='這個遊戲日的家事都完成了，下個 30 分鐘週期會重置。';list.append(message)}
  renderMarkers();renderEconomy();
}
let selectedTask=null;
function closeTaskPopup(){selectedTask=null;$('#chore-popup').hidden=true;for(const marker of $('#chore-markers').children)marker.setAttribute('aria-expanded','false')}
function chooseTask(t){
  if(selectedTask===t.id){closeTaskPopup();return}
  selectedTask=t.id;$('#chore-name').textContent=t.label;
  for(const marker of $('#chore-markers').children)marker.setAttribute('aria-expanded',String(marker.dataset.task===t.id));
  $('#chore-start').disabled=!!activity||(mode==='online'&&(!user||!homeReady));
  $('#chore-popup').hidden=false;
}
$('#chore-start').onclick=()=>{const task=tasks.find(t=>t.id===selectedTask);closeTaskPopup();if(task)startTask(task)};
$('#chore-close').onclick=closeTaskPopup;
$('#scene').addEventListener('pointerdown',closeTaskPopup);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeTaskPopup()});
function renderMarkers(){
 closeTaskPopup();const layer=$('#chore-markers');layer.replaceChildren();
 const t=activity&&activity.phase!=='return'?activity.task:null;
 $('#active-task').hidden=!t;$('#task-cancel').hidden=!t;
 for(const task of dayTasks()){
  if(isClaimed(task))continue;
  const marker=document.createElement('button');marker.type='button';marker.className='chore-marker';marker.textContent='!';marker.dataset.task=task.id;
  marker.setAttribute('aria-label',`查看家事：${task.label}`);marker.setAttribute('aria-controls','chore-popup');marker.setAttribute('aria-expanded','false');
  marker.disabled=!!activity;marker.classList.toggle('busy',t?.id===task.id);
  marker.onclick=()=>chooseTask(task);layer.append(marker);
 }
 updateMarkers();
}
function updateMarkers(){
 if(!scene)return;const t=activity&&activity.phase!=='return'?activity.task:null;
 $('#active-task').hidden=!t;$('#task-cancel').hidden=!t;
 if(t)$('#active-task').textContent=`${t.label} · ${activity.phase==='work'?'正在完成':'前往中'}…`;
 const width=$('#world').clientWidth,height=$('#world').clientHeight;
 for(const marker of $('#chore-markers').children){
  const task=tasks.find(item=>item.id===marker.dataset.task);if(!task){marker.hidden=true;continue}
  const pos=placement(task).marker,p=new T.Vector3(...pos).project(window.homeScene.camera);
  let x=(p.x+1)*width/2,y=(1-p.y)*height/2;
  marker.hidden=p.z<=-1||p.z>=1||x<24||x>width-24||y<24||y>height-24;
  if(marker.hidden)continue;
  // Keep the prompt on its world anchor, even when nearby chores overlap.
  marker.style.left=x+'px';marker.style.top=y+'px';
 }
}

// Contact planes match the physical furniture, not the floating ! markers.
function choreSurface(task){
 const rect=(kind,x,z,w,d,y)=>{const c=kind?furnitureXYZ(kind,[x,y,z]):[x,y,z];return {x0:c[0]-w/2,x1:c[0]+w/2,z0:c[2]-d/2,z1:c[2]+d/2,y}};
 switch(task.id){
 case 'table':case 'tidytable':return rect('dining',2.22,6.30,.75,1.35,.82);
 case 'sofa':return rect('sofa',2.54,2.03,.68,2.06,.575);
 case 'mainbed':case 'fold':return rect('mainBed',5.64,1.64,1.90,1.95,.63);
 case 'childbed':return rect('childBed',5.12,7.16,1.1,1.94,.61);
 case 'counter':return rect(null,kitchenStart+.30,9.645,.55,.70,.925);
 case 'stove':return rect(null,stoveX,9.60,.65,.44,.968);
 case 'dishes':return rect(null,sinkX,9.61,.55,.55,.925);
 case 'basin':return {...rect('basin',4.73,4.10,.62,.64,.82),approachSide:'front'};
 default:return null;
 }
}

function inChoreWorkArea(task,p){
 if(!task)return true;
 const room=placement(task).room;
 const inside=(x0,x1,z0,z1)=>p[0]>=x0&&p[0]<=x1&&p[1]>=z0&&p[1]<=z1;
 switch(room){
 case 'living':return inside(scaleX(.075),scaleX(3.1940625),.20,4.50);
 // The dining area's north edge is open; table-front work is part of that area.
 case 'dining':return inside(scaleX(.075),scaleX(2.585),5.25,8.20);
 case 'kitchen':return inside(kitchenStart,scaleX(5.765),8.26,9.295);
 case 'main':return inside(scaleX(3.3340625),scaleX(6.67),.20,3.58);
 case 'child':return inside(scaleX(2.715),scaleX(5.765),5.615,8.135);
 case 'bath':return inside(scaleX(4.515),scaleX(6.67),3.72,5.485);
 case 'balcony':return inside(scaleX(5.895),scaleX(7.75),6.15,9.12);
 case 'entry':return inside(entryZero,entryZero+2.55,7.925,9.995);
 default:return true;
 }
}
function planChorePath(from,preferred,surface,task=null){
 const gap=p=>surface?Math.hypot(Math.max(surface.x0-p[0],0,p[0]-surface.x1),Math.max(surface.z0-p[1],0,p[1]-surface.z1)):Math.hypot(p[0]-preferred[0],p[1]-preferred[1]);
 const workPoint=p=>{
  if(!walkable(...p)||!inChoreWorkArea(task,p))return false;
  if(!surface)return true;
  if(gap(p)<.19||gap(p)>.56)return false;
  if(surface.approachSide==='front'){
   if(p[1]<surface.z1+.19||p[0]<surface.x0||p[0]>surface.x1)return false;
   const contact=[Math.max(surface.x0,Math.min(surface.x1,p[0])),surface.z1];
   if(crossesWall(p,contact))return false;
  }
  return true;
 };
 if(workPoint(from)&&(surface||gap(from)<=.10))return [[...from]];
 const candidates=surface?[from,...contactStops(surface),preferred]:[preferred];
 candidates.sort((a,b)=>Math.hypot(a[0]-from[0],a[1]-from[1])-Math.hypot(b[0]-from[0],b[1]-from[1]));
 for(const point of candidates){
  if(!workPoint(point))continue;
  const path=findPath(from,point);if(!path.length)continue;
  const end=path.at(-1);
  if(Math.hypot(end[0]-point[0],end[1]-point[1])>.12||!canTraverse(from,path[0])||!workPoint(end))continue;
  return path;
 }
 return [];
}
function rerouteChore(job){
 const path=planChorePath([character.position.x,character.position.z],placement(job.task).stop,job.surface,job.task);
 if(!path.length){activity=null;pose='stand';renderTasks();toast('家事位置暫時被擋住，請稍後再試');return false}
 job.path=path;job.index=0;return true;
}
function faceTaskTarget(task){
 if(!character)return;const s=activity?.surface,target=s?[(s.x0+s.x1)/2,s.y,(s.z0+s.z1)/2]:placement(task).marker,dx=target[0]-character.position.x,dz=target[2]-character.position.z;
 if(Math.hypot(dx,dz)>.01)character.rotation.y=Math.atan2(dx,dz);
}
function startTask(t){
  if(activity||isClaimed(t))return;
  if(!dayTasks().some(item=>item.id===t.id))return toast('請從今日家事清單選擇任務');
  if(t.id==='collect'&&!taskDone({id:'laundry'}))return toast('先完成洗衣，再收衣');
  if(t.id==='fold'&&!taskDone({id:'collect'}))return toast('先收衣，再摺衣');
  if(mode==='online'&&(!user||!homeReady))return toast('請先建立家庭或加入家人的家庭');
  if(!character)return toast('請在支援 3D 的瀏覽器啟動場景');
  movementRequest++;releaseBed();floorPose=false;poseLift=0;cancelHandAction();if(travel)travel=null;
  if(pose==='sit')window.homeScene?.showNews(false);
  leaveRest();
  restExit=null;character.position.y=.07;
  pose='stand';
  const surface=choreSurface(t),path=planChorePath([character.position.x,character.position.z],placement(t).stop,surface,t);
  if(!path.length)return toast('目前找不到通往家事位置的路');
  pose='walk';document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',false));
  activity={task:t,phase:'run',path,index:0,day:today(),surface};
  if($('#game-dialog').open)$('#game-dialog').close();
  renderTasks();
}
async function finishTask(job){
  activity=null;pose='stand';
  document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',b.dataset.pose===pose));
  renderTasks();
  if(job.day!==today()){toast('新的一天開始了，請重新選家事');return}
  await claimTask(job.task,job.day);
}
async function claimTask(t,day=today()){
 if(day!==today())return toast('新的一天開始了，請重新選家事');
 const previousLevel=levelInfo(player.xp).level,previousXP=player.xp;
 try{await mutateGame(p=>{if(day!==today())throw new Error('新的一天開始了，請重新選家事');rewardPlayer(p,t,day)});renderTasks();const info=levelInfo(player.xp),r=taskReward(t);toast(`完成！＋${r.coins} 幣${previousXP<MAX_XP?'、＋20 EXP':''}${info.level>previousLevel?' · 升到 Lv.'+info.level:''}`)}catch(e){toast(e.code==='permission-denied'?'任務未記錄，請確認家庭寫入權限':e.message||'儲存失敗，請再試一次')}
}
let avatarPreviewRenderer=null,avatarPreviewActor=null;
function disposeAvatarPreview(){
 if(!avatarPreviewActor)return;
 avatarPreviewActor.userData.disposeCostume?.();
 const materials=new Set();avatarPreviewActor.traverse(n=>{n.geometry?.dispose();if(n.material)for(const m of Array.isArray(n.material)?n.material:[n.material])materials.add(m)});for(const m of materials)m.dispose();avatarPreviewActor=null;
}
function renderAvatarPreview(previewOutfit=equippedLegendary(player)){
 const canvas=$('#avatar-current-preview');if(!canvas)return;if(previewOutfit===equippedLegendary(player))$('#legendary-preview-label').textContent='';
 try{
  if(!avatarPreviewRenderer){avatarPreviewRenderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});avatarPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));avatarPreviewRenderer.setSize(240,260,false);avatarPreviewRenderer.setClearColor(0x000000,0)}
  disposeAvatarPreview();
  const portraitScene=new T.Scene();portraitScene.add(new T.HemisphereLight('#ffffff','#72816f',2.5));
  const light=new T.DirectionalLight('#fff7e9',2);light.position.set(-2,4,4);portraitScene.add(light);
  avatarPreviewActor=createPixelDad(outfit(avatar),normalizeAvatarDesign({...avatarDesign,legendaryOutfit:previewOutfit}));if(player.farmShirt)decorateFarmShirt(avatarPreviewActor,player.farmShirt);avatarPreviewActor.userData.updatePose?.('stand');avatarPreviewActor.rotation.y=.2;portraitScene.add(avatarPreviewActor);
  const bounds=new T.Box3().setFromObject(avatarPreviewActor),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
  const camera=new T.PerspectiveCamera(32,240/260,.01,20),distance=Math.max(size.y,size.x/camera.aspect)/(2*Math.tan(camera.fov*Math.PI/360))*1.2;
  camera.position.set(center.x,center.y,center.z+distance);camera.lookAt(center);avatarPreviewRenderer.render(portraitScene,camera);canvas.hidden=false;
 }catch(error){console.warn('角色預覽暫時無法顯示',error);canvas.hidden=true}
}
function fillAvatar(){renderAvatarPreview()}
const appearanceKey=()=>`little-home-appearance-${user?.uid||localActorId}`;
const nameKey=()=>`little-home-name-confirmed-${user?.uid||localActorId}`;
function hasChosenName(v=avatar){
 const name=String(v?.name||'').trim();
 return name.length>0&&name.length<=12&&(!['玩家','小屋主'].includes(name)||localStorage.getItem(nameKey())==='1');
}
function askPlayerName(){return new Promise(resolve=>{
 const dialog=document.createElement('dialog');dialog.id='name-dialog';dialog.className='game-dialog compact-dialog name-dialog';
 dialog.innerHTML='<form><div class="dialog-head"><div><span class="mini-label">WELCOME HOME · 01</span><h2>先幫自己取個名字</h2></div></div><p>這是你在小屋裡的名字，之後也能修改。</p><label for="first-player-name">你的名字</label><input id="first-player-name" name="nickname" autocomplete="nickname" maxlength="12" required autofocus placeholder="輸入 1～12 個字"><p class="name-error" role="status"></p><button class="game-primary" type="submit">'+(localStorage.getItem(appearanceKey())?'儲存名字':'下一步：選擇造型')+'</button></form>';
 const field=dialog.querySelector('input'),error=dialog.querySelector('.name-error');
 dialog.addEventListener('cancel',e=>e.preventDefault());
 dialog.querySelector('form').onsubmit=e=>{
  e.preventDefault();const name=field.value.trim();
  if(!name||name.length>12){error.textContent='請輸入 1～12 個字的名字。';field.focus();return}
  dialog.close();dialog.remove();resolve(name);
 };
 document.body.append(dialog);dialog.showModal();field.focus();
})}
let appearancePending=null;
async function ensureAppearance(){
 if(appearancePending)return appearancePending;
 appearancePending=(async()=>{
  avatarDesign=normalizeAvatarDesign(safeRead(designLocalKey(),avatarDesign));
  if(!hasChosenName()){
   avatar=outfit({...avatar,name:await askPlayerName()});localStorage.setItem(nameKey(),'1');
   localStorage.setItem('little-home-avatar',JSON.stringify(avatar));fillAvatar();setCharacter(avatar);
  }
  if(!localStorage.getItem(appearanceKey())){
   const result=await openAvatarEditor(avatar,avatarDesign,true);
   avatar=outfit(result.profile);setAvatarDesign(result.design,true);localStorage.setItem('little-home-avatar',JSON.stringify(avatar));localStorage.setItem(appearanceKey(),'1');localStorage.setItem(nameKey(),'1');fillAvatar();setCharacter(avatar);
  }
  $('#game-status').textContent=`${avatar.name} 正在家裡過日子`;return avatar;
 })();
 try{return await appearancePending}finally{appearancePending=null}
}
async function editAvatar(){
 const parent=$('#character-dialog'),returnToCharacter=parent.open;if(returnToCharacter)parent.close();
 try{
  const result=await openAvatarEditor(avatar,{...avatarDesign,legendaryOutfit:equippedLegendary(player)},false);if(!result)return;
  avatar=outfit(result.profile);setAvatarDesign(result.design,true);fillAvatar();await saveAvatar();
 }finally{if(returnToCharacter){renderAvatarPreview();parent.showModal();$('#avatar-edit').focus()}}
}
async function saveAvatar(){
  const name=String(avatar.name||'').trim();if(!name||name.length>12){toast('請輸入 1～12 個字的名字');return}
  const appearanceURL=new URL(location.href);appearanceURL.searchParams.delete('avatar');history.replaceState(null,'',appearanceURL);
  avatar=outfit({...avatar,name});
  localStorage.setItem('little-home-avatar',JSON.stringify(avatar));setCharacter(avatar);
  localStorage.setItem(appearanceKey(),'1');
  localStorage.setItem(nameKey(),'1');
  if(user&&homeReady)try{await api.setDoc(api.doc(db,'homes',homeId,'profiles',user.uid),avatar)}catch{toast('造型已存本機，雲端同步失敗');return}
  if(homeReady){try{await mutateGame(p=>{p.avatarDesign=normalizeAvatarDesign(avatarDesign)});designPending=false}catch{toast('造型已存本機，捏臉同步稍後重試');return}}
  $('#game-status').textContent=`${avatar.name} 正在家裡過日子`;toast('角色造型已儲存');
}
function clearSubscriptions(){
  for(const fn of [unsubscribeTasks,unsubscribeClaims,unsubscribeProfiles])fn?.();
  unsubscribeTasks=unsubscribeClaims=unsubscribeProfiles=null;
  for(const item of characters.values())scene?.remove(item.mesh);characters.clear();profileCache={};
}
function subscribeClaims(){claims={};}
function familyError(error){
  const message=error?.code==='permission-denied'
    ?'匿名登入成功；請先發佈資料庫規則，再按「建立家庭」或「加入家庭」重試。'
    :error?.message||'家庭連線失敗，請稍後再試。';
  $('#account-state').textContent=message;toast(message);
}
function newFamilyCode(){
  return Array.from(crypto.getRandomValues(new Uint8Array(12)),n=>n.toString(16).padStart(2,'0')).join('');
}
async function subscribeHome(create=false){
  if(!user)return toast('匿名登入尚未完成');
  if(joining)return;
  if(activity||syncBusy)return toast('目前操作完成後再切換家庭');
  await publishPresence(true,false);
  const code=create?newFamilyCode():boundedCode($('#home-code').value);
  if(!/^[a-f0-9]{24}$/.test(code))return toast('請貼上家人的 24 字家庭代碼，或使用邀請連結');
  joining=true;homeReady=false;clearSubscriptions();claims={};renderTasks();
  $('#home-share').disabled=true;
  $('#home-code').value=code;$('#account-state').textContent='正在連接家庭…';
  homeId=code;
  const joiningUid=user.uid,isCurrentHome=()=>user?.uid===joiningUid&&homeId===code;
  const cached=!create&&loadHomeCache(localStorage,user.uid,code);
  gameMeta={id:GAME_META_ID,players:{}};player=newPlayer();profileCache={};
  if(cached){
    avatar=outfit(cached.avatar);player=normalizePlayer(cached.player);
    if(player.avatarDesign&&!designPending)setAvatarDesign(player.avatarDesign);
    gameMeta.players[user.uid]=player;gameMeta.monster=cached.monster;
    fillAvatar();setCharacter(avatar);
    $('#account-state').textContent='已顯示上次資料，正在確認雲端進度…';
  }
  renderEconomy();renderPlacements();syncCharacters();renderMonster();
  try{
    const homeRef=api.doc(db,'homes',code);
    const profileRef=api.doc(db,'homes',code,'profiles',user.uid);
    let profile;
    if(create){
      await api.runTransaction(db,async tx=>{
        const existing=await tx.get(homeRef);
        if(existing.exists())throw new Error('請再按一次建立家庭');
        tx.set(homeRef,{ownerUid:user.uid,createdAt:api.serverTimestamp()});
      });
      profile=await api.getDocFromServer(profileRef);
    }else{
      // These reads do not depend on each other; start both together.
      const pair=await Promise.all([api.getDocFromServer(homeRef),api.getDocFromServer(profileRef)]);
      const home=pair[0];profile=pair[1];
      if(!home.exists())throw new Error('找不到這個家庭，請檢查邀請連結或家庭代碼');
    }
    if(!isCurrentHome())return;
    if(profile.exists()){
      const previousAvatar=JSON.stringify(outfit(avatar));
      avatar=outfit(profile.data());localStorage.setItem('little-home-avatar',JSON.stringify(avatar));
      fillAvatar();if(!character||previousAvatar!==JSON.stringify(avatar))setCharacter(avatar);
      if(!hasChosenName()){await ensureAppearance();await api.setDoc(profileRef,outfit(avatar))}
      localStorage.setItem(appearanceKey(),'1');
    }else{await ensureAppearance();await api.setDoc(profileRef,outfit(avatar))}
    const tasksRef=api.doc(db,'homes',homeId,'settings','tasks');
    const savedTasks=await api.getDocFromServer(tasksRef);
    if(!isCurrentHome())return;
    if(!savedTasks.exists())await api.setDoc(tasksRef,{items:create?tasks:defaults});
    const initialItems=savedTasks.exists()?savedTasks.data().items:(create?tasks:defaults);
    tasks=normalizeTasks(initialItems);
    // Apply the first server result immediately; do not wait for the subscription.
    applyMeta(initialItems.find(t=>t.id===GAME_META_ID));
    localStorage.setItem('little-home-code',homeId);
    gameDay=today();homeReady=true;
    $('#account-state').textContent=user.isAnonymous?'訪客已加入家庭。綁定 Google 可在新裝置取回進度。':'Google 帳號已加入家庭，人物進度會同步。';
    $('#game-status').textContent=`${avatar.name} 正在家裡過日子`;
    $('#home-share').disabled=false;
    unsubscribeTasks=api.onSnapshot(tasksRef,{includeMetadataChanges:true},snap=>{
      if(!isCurrentHome()||snap.metadata.fromCache)return; // Never roll back to an older SDK cache.
      const items=snap.exists()?snap.data().items:defaults;tasks=normalizeTasks(items);applyMeta(items.find(t=>t.id===GAME_META_ID));renderTasks();
    },error=>{homeReady=false;renderTasks();familyError(error)});
    subscribeClaims();
    unsubscribeProfiles=api.onSnapshot(api.collection(db,'homes',homeId,'profiles'),snap=>{
      if(!isCurrentHome())return;
      profileCache={};snap.forEach(d=>profileCache[d.id]=outfit(d.data()));syncCharacters();
    },familyError);
    if(designPending||!gameMeta.monster||!gameMeta.players[playerId()]){
      await mutateGame((p,meta)=>{if(designPending)p.avatarDesign=normalizeAvatarDesign(avatarDesign);if(!meta.monster)meta.monster={bornAt:Date.now()+3600000,hits:0}});designPending=false;
    }
    publishPresence(true);
    const url=new URL(location.href);url.searchParams.delete('home');history.replaceState(null,'',url);
    renderTasks();
  }catch(error){
    homeReady=false;$('#home-share').disabled=true;renderTasks();familyError(error);
    if(!hasChosenName())await ensureAppearance();
  }finally{joining=false}
}
async function shareHome(){
  if(!homeReady)return toast('請先連接家庭');
  const url=new URL(location.href);url.searchParams.set('home',homeId);
  try{
    if(navigator.share)await navigator.share({title:'我們的小日子',text:'一起回家做家事！',url:url.href});
    else{await navigator.clipboard.writeText(url.href);toast('家庭邀請連結已複製')}
  }catch(error){if(error.name!=='AbortError')toast('請複製下方的家庭代碼分享給家人')}
}
function accountStatus(){
 const anonymous=!!user?.isAnonymous;
 $('#login-google').textContent=anonymous?'綁定 Google，保留目前進度':'Google 登入';
 $('#login-existing').hidden=!anonymous;
 $('#login-guest').textContent=user?'繼續遊戲':'訪客體驗';
 $('#login-message').textContent=user&&!anonymous?'已登入 Google。新裝置使用相同帳號，再輸入原家庭代碼或開啟邀請連結。':anonymous?'目前是訪客；綁定 Google 可保留人物、金幣、等級與道具。':'Google 登入可跨裝置保存；訪客體驗只保留這台裝置的登入身分。';
 $('#login-google').disabled=authBusy||!auth;
 $('#login-existing').disabled=authBusy||!auth;
 $('#login-guest').disabled=authBusy;
}
function accountError(error){
 const messages={'auth/operation-not-allowed':'請在 Firebase Authentication 啟用 Google 登入。','auth/unauthorized-domain':'請在 Firebase 的授權網域加入 mvpwilliam.github.io。','auth/popup-blocked':'登入視窗被阻擋，請允許彈出視窗，或改用 Safari 開啟網站。','auth/popup-closed-by-user':'登入視窗已關閉，可以再試一次。','auth/credential-already-in-use':'這個 Google 已有遊戲帳號，未更動目前訪客資料。可選「登入已有 Google 帳號」；兩份進度不會自動合併。'};
 $('#login-message').textContent=messages[error?.code]||'登入暫時失敗，請檢查網路後重試。';
}
async function resumeAccount(){
 const u=auth?.currentUser;user=u||null;accountStatus();
 if(!u){connectedUid=null;homeReady=false;clearSubscriptions();claims={};homeId='';gameMeta={id:GAME_META_ID,players:{}};player=newPlayer();profileCache={};renderEconomy();renderPlacements();syncCharacters();renderMonster();renderTasks();return}
 if(authBusy||connectedUid===u.uid||(u.isAnonymous&&!localStorage.getItem('little-home-login-choice')))return;
 connectedUid=u.uid;
 $('#account-state').textContent=u.isAnonymous?'訪客登入成功。':'Google 登入成功。';
 const code=boundedCode($('#home-code').value);
 if(/^[a-f0-9]{24}$/.test(code))await subscribeHome(false);
 else{
  await ensureAppearance();
  if(u.isAnonymous)await subscribeHome(true);
  else{homeReady=false;clearSubscriptions();$('#account-state').textContent='請輸入原家庭代碼或開啟邀請連結，以讀取原人物；新玩家可建立家庭。';openHomePanel('family')}
 }
}
function setupAccountUI(){
 const dialog=document.createElement('dialog');dialog.id='login-dialog';dialog.className='game-dialog compact-dialog';
 const title=document.createElement('h2');title.textContent='歡迎回到我們的小日子';
 const message=document.createElement('p');message.id='login-message';
 dialog.append(title,message);
 for(const [id,label] of [['login-google','Google 登入'],['login-guest','訪客體驗'],['login-existing','登入已有 Google 帳號']]){const b=document.createElement('button');b.id=id;b.textContent=label;b.style.margin='8px 0';b.style.width='100%';dialog.append(b)}
 document.body.append(dialog);
 const open=document.createElement('button');open.id='account-open';open.className='account-manage-button';open.textContent='帳號設定';$('#account-state').parentElement?.querySelector('.account-buttons')?.append(open);
 open.onclick=()=>{accountStatus();dialog.showModal()};
 $('#login-guest').onclick=async()=>{
  if(authBusy)return;authBusy=true;accountStatus();let error=null;
  try{if(auth&&!auth.currentUser)await api.signInAnonymously(auth);localStorage.setItem('little-home-login-choice','guest');dialog.close()}
   catch(e){error=e}finally{authBusy=false;accountStatus();if(error)accountError(error)}
  if(!error){if(auth)await resumeAccount();else await ensureAppearance()}
 };
 const google=async existing=>{
  if(authBusy||!auth)return;
  if(activity||syncBusy||joining){$('#login-message').textContent='請先完成目前操作再登入或綁定。';return}
  if(existing&&user?.isAnonymous&&!window.confirm('切換到已有 Google 帳號？目前訪客进度不會合併，請先保留原家庭代碼。'))return;
  authBusy=true;accountStatus();let error=null;
  try{
   const provider=new api.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
   if(auth.currentUser?.isAnonymous&&!existing){await api.linkWithPopup(auth.currentUser,provider);user=auth.currentUser;accountStatus();toast('Google 綁定完成，原人物與進度已保留')}
   else{await api.signInWithPopup(auth,provider)}
   localStorage.setItem('little-home-login-choice','google');dialog.close();
  }catch(e){error=e}finally{authBusy=false;accountStatus();if(error)accountError(error)}
  if(!error)await resumeAccount();
 };
 $('#login-google').onclick=()=>google(false);$('#login-existing').onclick=()=>google(true);
 dialog.addEventListener('cancel',e=>{if(!user&&mode==='online')e.preventDefault()});accountStatus();
 return dialog;
}
async function connect(){
  const login=setupAccountUI();
  if(!firebaseConfig?.apiKey||!firebaseConfig?.projectId){
    $('#game-mode').textContent='目前是單機體驗，角色與任務儲存在這台裝置。';
    $('#account-state').textContent='家庭連線尚未設定。';login.showModal();return;
  }
  mode='online';renderTasks();$('#account-state').textContent='正在自動登入…';
  try{
    const base='https://www.gstatic.com/firebasejs/12.19.0/';
    const [app,authLib,store]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
    api={...authLib,...store};const instance=app.initializeApp(firebaseConfig);
    auth=authLib.getAuth(instance);db=store.getFirestore(instance);
    await authLib.setPersistence(auth,authLib.browserLocalPersistence);
    await auth.authStateReady();
    $('#game-mode').textContent='每人有自己的每日家事、遊戲幣與道具。30 分鐘為一個遊戲日。';
    authLib.onAuthStateChanged(auth,u=>{user=u;accountStatus();if(!authBusy)resumeAccount().catch(error=>{connectedUid=null;familyError(error)})});
    accountStatus();if(!auth.currentUser||(!localStorage.getItem('little-home-login-choice')&&auth.currentUser.isAnonymous))login.showModal();
  }catch(error){
    const message=error.code==='auth/operation-not-allowed'
      ?'請在 Firebase 啟用匿名登入，再重新整理。'
      :'自動登入失敗，請重新整理頁面再試。';
    $('#game-mode').textContent=message;$('#account-state').textContent=message;
    mode='preview';auth=null;db=null;api=null;accountStatus();renderTasks();login.showModal();
  }
}

// Per-character progression, inventory and household presence share the existing
// member-writable settings document; transactions keep purchases and awards atomic.
const roomNames={living:'客廳',dining:'餐廳',kitchen:'廚房',main:'主臥',child:'次臥',bath:'浴室',balcony:'陽台',entry:'玄關'};
const catalog=[
 {id:'toy-trophy',name:'積木恐龍獎盃',icon:'🦖',price:0,type:'裝飾',rewardOnly:true},
 {id:'plant',name:'小盆栽',icon:'🪴',price:60,type:'裝飾'},
 {id:'flowers',name:'花瓶與花',icon:'🌷',price:90,type:'裝飾'},
 {id:'cat',name:'招財貓',icon:'🐱',price:150,type:'裝飾'},
 {id:'frame',name:'桌上相框',icon:'🖼️',price:80,type:'裝飾'},
 {id:'clock',name:'小時鐘',icon:'⏰',price:100,type:'裝飾'},
 {id:'lamp',name:'小桌燈',icon:'💡',price:120,type:'裝飾'},
 {id:'coffee',name:'咖啡機',icon:'☕',price:280,type:'電器',rooms:['kitchen','dining']},
 {id:'speaker',name:'小音響',icon:'🔊',price:200,type:'電器'},
 {id:'fan',name:'桌上風扇',icon:'🌬️',price:180,type:'電器'},
 {id:'toaster',name:'小烤麵包機',icon:'🍞',price:250,type:'電器',rooms:['kitchen','dining']}
];
const newPlayer=()=>({coins:0,xp:0,inventory:[],completed:{},bonuses:{},ledger:[],legendaryOwned:[],legendaryFreeClaimed:false,legendaryEquipped:''});
const localActorId=localStorage.getItem('little-home-player-id')||crypto.randomUUID();localStorage.setItem('little-home-player-id',localActorId);
let gameMeta={id:GAME_META_ID,players:{}},player=newPlayer(),profileCache={},presenceBusy=false,lastPresence=0,lastPresenceSignature='',lastHumanInput=Date.now(),syncBusy=false;
let inventoryTab='全部',pendingPlacement=null,placementObjects=new Map(),monsterMesh=null;
const playerId=()=>user?.uid||localActorId;
const playerKey=()=>`little-home-player-${homeId||'preview'}-${playerId()}`;
const farmStorageKey=()=>`little-home-farm-${homeId||'preview'}-${mode==='online'?'shared':playerId()}`;
let localFarmKey='',localFarmData=null;
function getFarmState(){
 if(gameMeta.farm)return gameMeta.farm;
 if(mode==='online')return null;
 const key=farmStorageKey();if(localFarmKey!==key){localFarmKey=key;localFarmData=safeRead(key,null)}return localFarmData;
}

const normalizePlayer=p=>({...newPlayer(),...p,inventory:Array.isArray(p?.inventory)?p.inventory:[],legendaryOwned:Array.isArray(p?.legendaryOwned)?[...new Set(p.legendaryOwned.filter(id=>outfitById(id)))]:[],completed:p?.completed||{},bonuses:p?.bonuses||{},ledger:p?.ledger||[]});
function readPlayer(){player=normalizePlayer(safeRead(playerKey(),newPlayer()))}
function dayTasks(){
 const pool=tasks.filter(t=>t.id!=='scenery');
 if(gameDay%3===0&&['laundry','collect','fold'].every(id=>pool.some(t=>t.id===id)))return ['floor','dishes','trash','laundry','collect','fold'].map(id=>pool.find(t=>t.id===id)).filter(Boolean);
 const options=pool.filter(t=>!['laundry','collect','fold'].includes(t.id));const start=((gameDay%options.length)+options.length)%options.length;
 return Array.from({length:Math.min(6,options.length)},(_,i)=>options[(start+i)%options.length]);
}
function taskDone(t,day=gameDay,p=player){return p.completed[t.id]===day}
function taskReward(t){return {coins:['bath','toilet','glass'].includes(t.id)?40:30,xp:20}}
function record(p,text,amount){p.ledger.unshift({text,amount,at:Date.now()});p.ledger=p.ledger.slice(0,40)}
function rewardPlayer(p,t,day){
 if(taskDone(t,day,p))throw new Error('這個遊戲日已完成這項家事');
 const r=taskReward(t);p.completed[t.id]=day;p.coins+=r.coins;p.xp=Math.min(MAX_XP,p.xp+r.xp);record(p,t.label,r.coins);
 if(dayTasks().every(item=>taskDone(item,day,p))&&!p.bonuses[day]){p.bonuses={[day]:true};p.coins+=30;record(p,'全部家事完成加成',30)}
 return r;
}
async function mutateGame(change){
 if(syncBusy)throw new Error('上一筆正在儲存，請稍候');syncBusy=true;
 const mutationScope=`${homeId||'preview'}:${playerId()}`;
 try{
  if(mode==='online'){
   if(!homeReady||!user)throw new Error('家庭尚未連線');
   const ref=api.doc(db,'homes',homeId,'settings','tasks');
   let updated;
   await api.runTransaction(db,async tx=>{
    const snap=await tx.get(ref),items=snap.exists()?snap.data().items:defaults;
    const meta=structuredClone(items.find(t=>t.id===GAME_META_ID)||{id:GAME_META_ID,players:{}});
    if(mutationScope!==`${homeId||'preview'}:${playerId()}`)throw new Error('家庭或帳號已切換，請重新操作');
    const p=normalizePlayer(meta.players[playerId()]);change(p,meta);meta.players[playerId()]=p;
    tx.set(ref,{items:[...items.filter(t=>t.id!==GAME_META_ID),meta]});updated=meta;
   });
   if(mutationScope!==`${homeId||'preview'}:${playerId()}`)throw new Error('家庭已切換，原家庭的操作已保存，請重新進入');
   applyMeta(updated);
  }else{
   const p=normalizePlayer(structuredClone(player));change(p,gameMeta);gameMeta.players[playerId()]=p;applyMeta(gameMeta);
  }
 }finally{syncBusy=false;renderEconomy()}
}
function applyMeta(meta){
 const oldCostume=equippedLegendary(player),oldFarmShirt=player.farmShirt;
 const oldItems=JSON.stringify(Object.values(gameMeta.players||{}).map(p=>p.inventory));
 gameMeta=meta||{id:GAME_META_ID,players:{}};gameMeta.players||={};player=normalizePlayer(gameMeta.players[playerId()]);
 localStorage.setItem(playerKey(),JSON.stringify(player));if(player.avatarDesign&&!designPending&&JSON.stringify(normalizeAvatarDesign(player.avatarDesign))!==JSON.stringify(avatarDesign)){setAvatarDesign(player.avatarDesign);if(character)setCharacter(avatar)}if(character&&(oldCostume!==equippedLegendary(player)||oldFarmShirt!==player.farmShirt))setCharacter(avatar);renderEconomy();if(oldItems!==JSON.stringify(Object.values(gameMeta.players).map(p=>p.inventory)))renderPlacements();syncCharacters();renderMonster();
 if(gameMeta.farm)localStorage.setItem(farmStorageKey(),JSON.stringify(gameMeta.farm));
 if(user&&homeId)saveHomeCache(localStorage,{uid:user.uid,home:homeId,avatar:outfit(avatar),player,monster:gameMeta.monster});
}
function renderEconomy(){
 const info=levelInfo(player.xp);$('#coin-count').textContent=player.coins.toLocaleString();
 const xpPercent=Math.round(Math.max(0,Math.min(1,info.progress))*100);
 $('#scene-xp-level').textContent='Lv.'+info.level;
 $('#scene-xp-fill').style.height=xpPercent+'%';
 $('#scene-xp-percent').textContent=info.level===20?'MAX':xpPercent+'%';
 $('#scene-xp-meter').setAttribute('aria-valuenow',String(xpPercent));
 $('#scene-xp-meter').setAttribute('aria-valuetext',info.level===20?'20 級，已滿級':`目前 ${info.level} 級，升級進度 ${xpPercent}%`);
 $('#player-level').textContent=`Lv.${info.level} · ${info.title}`;$('#xp-meter').value=info.progress;
 $('#xp-label').textContent=info.level===20?(player.legendaryFreeClaimed?'已滿級 · 家事繼續賺幣':'已滿級 · 下方可免費領取一套傳說套裝'):`${Number(player.xp.toFixed(1))} / ${MAX_XP} EXP`;
 $('#daily-progress').textContent=`今日家事 ${dayTasks().filter(t=>taskDone(t)).length}／${dayTasks().length}`;
 renderInventory();renderShop();renderLegendaryWardrobe();
}
function equippedLegendary(p){return p?.xp>=MAX_XP&&Array.isArray(p.legendaryOwned)&&p.legendaryOwned.includes(p.legendaryEquipped)&&outfitById(p.legendaryEquipped)?p.legendaryEquipped:''}
function renderLegendaryWardrobe(){
 const list=$('#legendary-list');if(!list)return;list.replaceChildren();const unlocked=player.xp>=MAX_XP,current=equippedLegendary(player);
 $('#legendary-note').textContent=unlocked?(player.legendaryFreeClaimed?'首套已領取 · 其餘每套 1,200 遊戲幣':'恭喜滿級！任選一套免費領取，之後每套 1,200 遊戲幣'):'20 級解鎖 · 首套免費，現在可先預覽';
 for(const item of legendaryOutfits){
  const owned=player.legendaryOwned.includes(item.id),card=document.createElement('article');card.className='legendary-card';card.style.setProperty('--costume-color',item.color);
  const icon=document.createElement('span');icon.className='legendary-icon';icon.textContent=item.icon;icon.setAttribute('aria-hidden','true');
  const name=document.createElement('strong');name.textContent=item.name;const note=document.createElement('small');note.textContent=item.note;
  const preview=document.createElement('button');preview.textContent='預覽';preview.onclick=()=>{renderAvatarPreview(item.id);$('#legendary-preview-label').textContent=`預覽：${item.name}（尚未換裝）`;$('#avatar-current-preview').scrollIntoView({block:'nearest',behavior:'smooth'})};
  const button=document.createElement('button');button.className='legendary-action';button.textContent=current===item.id?'已穿上':owned?'穿上':!unlocked?'20 級解鎖':!player.legendaryFreeClaimed?'免費領取':'1,200 幣解鎖';
  button.disabled=syncBusy||current===item.id||!unlocked||(!owned&&player.legendaryFreeClaimed&&player.coins<item.price);button.onclick=()=>wearLegendary(item.id);
  card.append(icon,name,note,preview,button);list.append(card);
 }
 $('#legendary-remove').disabled=syncBusy||!current;
}
async function wearLegendary(id){
 if(activity||travel)return toast('請先完成目前的動作，再換裝');
 try{await mutateGame(p=>{
  if(p.xp<MAX_XP)throw new Error('升到 20 級後即可解鎖');
  if(id===''){p.legendaryEquipped='';return}
  if(p.legendaryOwned.includes(id)){p.legendaryEquipped=id;return}
  const result=unlockLegendary(p,id,MAX_XP);record(p,`${result.free?'滿級免費領取':'套裝解鎖'}：${result.item.name}`,-result.cost);
 });renderAvatarPreview();$('#legendary-preview-label').textContent='';toast(id?`已換上${outfitById(id).name}`:'已換回日常服裝')}catch(e){toast(e.message||'套裝未儲存，請再試一次')}
}
$('#legendary-remove').onclick=()=>wearLegendary('');
function showPanel(id){$(id).showModal()}
function itemCard(item,owned=null){
 const card=document.createElement('article');card.className='item-card';
 const icon=document.createElement('span');icon.className='item-icon';icon.textContent=item.icon;
 const name=document.createElement('strong');name.textContent=item.name;
 const note=document.createElement('small');note.textContent=owned?(owned.room?`已擺放 · ${roomNames[owned.room]}`:'在道具欄'): `${item.price} 幣`;
 const button=document.createElement('button');button.textContent=owned?(owned.room?'移動／收回':'擺放'):'購買';
 button.disabled=!owned&&(syncBusy||player.coins<item.price);
 button.onclick=()=>owned?choosePlacement(owned,item):buyItem(item);
 card.append(icon,name,note,button);return card;
}
function renderShop(){const list=$('#shop-list');list.replaceChildren();for(const item of catalog.filter(item=>!item.rewardOnly))list.append(itemCard(item))}
function renderInventory(){
 const list=$('#inventory-list');list.replaceChildren();
 for(const owned of player.inventory){const item=catalog.find(c=>c.id===owned.item);if(!item)continue;
 if(inventoryTab!=='全部'&&(inventoryTab==='已擺放'?!owned.room:item.type!==inventoryTab))continue;list.append(itemCard(item,owned))}
 if(!list.children.length)list.textContent=inventoryTab==='全部'?'背包還沒有道具。':inventoryTab==='已擺放'?'目前沒有已擺放的道具。':`目前沒有${inventoryTab}類道具。`;
 document.querySelectorAll('[data-inventory-tab]').forEach(b=>{const active=b.dataset.inventoryTab===inventoryTab;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
}
async function buyItem(item){
 if(item.rewardOnly)return;
 try{const id=crypto.randomUUID();await mutateGame(p=>{if(p.coins<item.price)throw new Error('遊戲幣不足');if(p.inventory.length>=40)throw new Error('道具欄已滿（40 件）');p.coins-=item.price;p.inventory.push({id,item:item.id,room:null,slot:null});record(p,`購買${item.name}`,-item.price)});toast(`${item.name}已放入道具欄`)}catch(e){toast(e.message||'購買未成功，沒有扣幣')}
}
// Small tabletop items use reserved surface slots and never occupy walkways.
const slots={living:[[scaleX(.24),.68,1.25],[scaleX(.24),.68,2.65]],dining:[furnitureXYZ('dining',[2.22,.83,5.95]),furnitureXYZ('dining',[2.22,.83,6.55])],kitchen:[[scaleX(2.64),.98,9.48],[scaleX(2.91),.98,9.48]],main:[[scaleX(4.25),.10,.30],[scaleX(4.55),.10,.30]],child:[[scaleX(3.05),.10,7.94],[scaleX(3.40),.10,7.94]],entry:[[entryZero+.18,1.05,8.10],[entryZero+.90,1.05,8.10]],bath:[[scaleX(4.55),.84,4.02]],balcony:[[washerPosition.x-.22,1.02,washerPosition.z],[washerPosition.x+.22,1.02,washerPosition.z]]};
// Rooms without a free shelf get a small wall shelf above the reserved item.
const shelfRooms=new Set(['main','child']);
// Decoration models face local +Z; turn their fronts toward each display's open side.
const displayFacing={living:Math.PI/2,dining:-Math.PI/2,kitchen:Math.PI,main:0,child:Math.PI,entry:0,bath:0,balcony:0};
function occupied(meta,room,slot,exclude){return Object.values(meta.players||{}).some(p=>(p.inventory||[]).some(o=>o.id!==exclude&&o.room===room&&o.slot===slot))}
function choosePlacement(owned,item){
 pendingPlacement={id:owned.id,item:item.id,room:null,slot:null};const select=$('#placement-room');select.replaceChildren();
 for(const [room,label] of Object.entries(roomNames)){if(item.rooms&&!item.rooms.includes(room))continue;const option=document.createElement('option');option.value=room;option.textContent=label;select.append(option)}
 $('#placement-name').textContent=item.name;$('#placement-return').hidden=!owned.room;$('#inventory-dialog').close();showPanel('#placement-dialog');previewPlacement();
}
function previewPlacement(){
 if(!pendingPlacement)return;const room=$('#placement-room').value;const slot=(slots[room]||[]).findIndex((_,i)=>!occupied(gameMeta,room,i,pendingPlacement.id));
 pendingPlacement.room=room;pendingPlacement.slot=slot;$('#placement-confirm').disabled=slot<0;
 $('#placement-note').textContent=slot<0?'這個房間目前放不下，請選另一個房間。':`預計放在${roomNames[room]}的${shelfRooms.has(room)?'小展示層板':'展示位置'}，確認後擺放。`;
 renderPlacements();if(slot>=0)window.homeScene?.selectRoom(room);
}
async function confirmPlacement(remove=false){
 const placement=pendingPlacement;if(!placement)return;
 try{await mutateGame((p,meta)=>{const owned=p.inventory.find(o=>o.id===placement.id);if(!owned)throw new Error('找不到這件道具');if(!remove&&occupied(meta,placement.room,placement.slot,owned.id))throw new Error('位置剛被家人使用，請重新選擇');owned.room=remove?null:placement.room;owned.slot=remove?null:placement.slot});pendingPlacement=null;$('#placement-dialog').close();renderPlacements();toast(remove?'已收回道具欄':'擺放完成')}catch(e){toast(e.message||'擺放失敗')}
}
function makeDecoration(item){
 const g=new T.Group();g.name='owned-'+item;const part=(geometry,color,x,y,z)=>bodyPart(g,geometry,color,x,y,z);
 const box=(w,h,d,color,x=0,y=h/2,z=0)=>part(new T.BoxGeometry(w,h,d),color,x,y,z);
 const ball=(r,color,x,y,z)=>part(new T.SphereGeometry(r,12,10),color,x,y,z);
 if(item==='toy-trophy'){box(.21,.035,.18,'#a78342');box(.13,.035,.11,'#e6c778',0,.05);box(.10,.08,.12,'#779875',0,.11);box(.07,.07,.07,'#779875',0,.17,.055);box(.04,.035,.10,'#779875',0,.10,-.09);for(const x of [-.034,.034])box(.025,.045,.035,'#597b58',x,.07);box(.045,.018,.045,'#ebdbad',0,.145,.085)}
 else if(item==='plant'||item==='flowers'){part(new T.CylinderGeometry(.045,.032,.07,12),'#c49b75',0,.035,0);for(let i=0;i<5;i++){const a=i*1.25;ball(.036,item==='flowers'?'#e6a3b1':'#719077',Math.cos(a)*.025,.10+i*.007,Math.sin(a)*.025)}}
 else if(item==='cat'){ball(.055,'#f4f1e6',0,.065,0);ball(.044,'#f4f1e6',0,.14,0);for(const x of [-.025,.025])part(new T.ConeGeometry(.018,.035,8),'#f4f1e6',x,.18,0);ball(.022,'#f4f1e6',-.065,.14,0);box(.07,.012,.07,'#bb4b48',0,.115,0);for(const x of [-.018,.018])ball(.006,'#293532',x,.145,.04)}
 else if(item==='lamp'){box(.10,.012,.10,'#8b9694');box(.015,.16,.015,'#8b9694',0,.09);part(new T.ConeGeometry(.07,.07,12),'#e6d9b6',0,.19,0)}
 else if(item==='frame'){box(.13,.16,.025,'#be9a72');box(.105,.13,.008,'#8cab99',0,.085,.018)}
 else if(item==='clock'){part(new T.CylinderGeometry(.065,.065,.025,16),'#e4e3db',0,.075,0).rotation.x=Math.PI/2;box(.006,.045,.01,'#40574e',0,.085,.02)}
 else if(item==='fan'){box(.10,.015,.08,'#c3cdcb');box(.018,.12,.018,'#c3cdcb',0,.075);part(new T.CylinderGeometry(.065,.065,.025,16),'#8faaa6',0,.16,0).rotation.x=Math.PI/2}
 else{box(.15,.16,.12,item==='speaker'?'#3f494b':'#7a8887');if(item==='coffee'){box(.08,.035,.06,'#293431',0,.12,.075);part(new T.CylinderGeometry(.025,.025,.04,12),'#e8e6db',0,.035,.085)}else if(item==='toaster')box(.11,.008,.025,'#313b3a',0,.164);else{ball(.035,'#222c2b',0,.05,.065);ball(.035,'#222c2b',0,.12,.065)}}return g;
}
function renderPlacements(){
 if(!scene)return;for(const object of placementObjects.values()){scene.remove(object);object.traverse(n=>{n.geometry?.dispose();if(n.material)n.material.dispose()})}placementObjects.clear();
 const owned=Object.values(gameMeta.players||{}).flatMap(p=>p.inventory||[]).filter(o=>o.room&&slots[o.room]?.[o.slot]);
 if(pendingPlacement?.slot>=0)owned.push({...pendingPlacement,id:'preview',item:pendingPlacement.item});
 for(const o of owned){const g=makeDecoration(o.item),p=slots[o.room][o.slot];g.position.set(...p);g.rotation.y=displayFacing[o.room]??0;if(shelfRooms.has(o.room)){g.position.y=1.25;bodyPart(g,new T.BoxGeometry(.23,.025,.19),'#c2ad8b',0,-.012,0)}if(o.id==='preview')g.traverse(n=>{if(n.material){n.material.transparent=true;n.material.opacity=.45}});scene.add(g);placementObjects.set(o.id,g)}
}
function onlinePlayers(){return Object.entries(gameMeta.players||{}).filter(([id,p])=>id!==playerId()&&p.presence?.online&&Date.now()-p.presence.at<45000).sort((a,b)=>(b[1].presence.pose==='work')-(a[1].presence.pose==='work')||b[1].presence.at-a[1].presence.at)}
function syncCharacters(){
 if(!scene)return;const online=onlinePlayers(),visible=online.slice(0,5),ids=new Set(visible.map(([id])=>id));
 for(const [id,item] of characters)if(!ids.has(id)){item.mesh.userData.disposeCostume?.();scene.remove(item.mesh);characters.delete(id)}
 for(const [id,p] of visible){const profile=profileCache[id];if(!profile)continue;let item=characters.get(id);const remoteDesign=normalizeAvatarDesign({...p.avatarDesign,hairStyle:p.avatarDesign?.hairStyle||profile.hair,legendaryOutfit:equippedLegendary(p)});remoteDesign.farmShirt=p.farmShirt;const signature=JSON.stringify([profile,remoteDesign]);
 if(!item||item.signature!==signature){if(item){item.mesh.userData.disposeCostume?.();scene.remove(item.mesh)}const mesh=makeCharacter(outfit(profile),remoteDesign);scene.add(mesh);item={mesh,signature,target:p.presence};mesh.position.set(p.presence.x,p.presence.y||.07,p.presence.z);characters.set(id,item)}if(item.target?.x!==p.presence.x||item.target?.z!==p.presence.z){if(item.target?.approach&&['sit','lie'].includes(item.target.pose)&&!['sit','lie'].includes(p.presence.pose)&&!crossesWall([item.mesh.position.x,item.mesh.position.z],item.target.approach)&&!crossesDynamicObstacle([item.mesh.position.x,item.mesh.position.z],item.target.approach))item.mesh.position.set(item.target.approach[0],.07,item.target.approach[1]);const destination=p.presence.approach||[p.presence.x,p.presence.z];item.remotePath=findPath([item.mesh.position.x,item.mesh.position.z],destination);item.remoteIndex=0}item.target=p.presence;item.mesh.userData.bedReservation=p.bedReservation;resolveMonsterOverlap(item.mesh);
 }
 const list=$('#member-list');list.replaceChildren();for(const [id,v] of Object.entries(profileCache)){const row=document.createElement('p');const active=id===playerId()||online.some(([uid])=>uid===id);row.textContent=`${v.name} · ${active?'上線':'離線'}${active&&id!==playerId()&&!ids.has(id)?'（成員列）':''}`;list.append(row)}
 $('#member-count').textContent=`上線 ${online.length+1} · 屋內 ${characters.size+1}／6`;
}
async function publishPresence(force=false,online=true){
 if(mode!=='online'||!homeReady||!user||!character||presenceBusy||syncBusy)return;
 const moving=!!activity||!!travel||pose==='walk',interval=moving?4000:18000;
 if(!force&&Date.now()-lastPresence<interval)return;
 presenceBusy=true;lastPresence=Date.now();
 const data={online,at:Date.now(),x:character.position.x,y:character.position.y,z:character.position.z,angle:character.rotation.y,approach:restExit||null,pose:activity?'work':travel?'walk':pose,floorPose,poseLift};
 try{const ref=api.doc(db,'homes',homeId,'settings','tasks');await api.runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())return;const items=snap.data().items,meta=structuredClone(items.find(t=>t.id===GAME_META_ID)||{id:GAME_META_ID,players:{}});meta.players[playerId()]=normalizePlayer(meta.players[playerId()]);meta.players[playerId()].presence=data;meta.players[playerId()].bedReservation=online&&currentBed?{kind:currentBed.kind,index:currentBed.index,at:Date.now()}:null;tx.set(ref,{items:[...items.filter(t=>t.id!==GAME_META_ID),meta]})})}catch(e){console.warn('人物狀態同步暫時中斷',e)}finally{presenceBusy=false}
}
function animateOthers(dt,now){
 for(const item of characters.values()){const p=item.target;if(!p)continue;const body=item.mesh.userData.body;
 if(item.remotePath?.length&&item.remoteIndex<item.remotePath.length){const q=item.remotePath[item.remoteIndex],dx=q[0]-item.mesh.position.x,dz=q[1]-item.mesh.position.z,d=Math.hypot(dx,dz);if(d<.035){walkStep(item.mesh,q[0],q[1]);item.remoteIndex++;}else{const move=Math.min(d,dt*2);walkStep(item.mesh,item.mesh.position.x+dx/d*move,item.mesh.position.z+dz/d*move)}item.mesh.position.y=p.y||.07}else if(!crossesWall([item.mesh.position.x,item.mesh.position.z],[p.x,p.z])&&!crossesDynamicObstacle([item.mesh.position.x,item.mesh.position.z],[p.x,p.z]))item.mesh.position.lerp(new T.Vector3(p.x,p.y||.07,p.z),Math.min(1,dt*3));item.mesh.rotation.y=p.angle||0;
 body.rotation.x=p.pose==='lie'?-Math.PI/2:p.pose==='sit'?(p.floorPose||p.approach?.[0]===.88?0:-.23):0;body.rotation.z=0;body.position.y=p.pose==='walk'?Math.abs(Math.sin(now*.008))*.02:p.floorPose?p.poseLift||0:0;
 for(const [i,limb] of [...item.mesh.userData.arms,...item.mesh.userData.legs].entries())limb.rotation.x=p.pose==='walk'?Math.sin(now*.009+i%2*Math.PI)*.3:p.pose==='work'&&i<2?-.75:p.pose==='sit'&&i>=2?-.85:0;
 item.mesh.userData.updatePose?.(p.pose);
 }
}
function updateMonsterRoam(dt,now){
 if(!monsterMesh||!gameMeta.monster||Date.now()<gameMeta.monster.bornAt)return;
 const g=monsterMesh,rig=g.userData.gait;if(!rig)return;
 // Feet and root stay planted; only the upper body performs a TV swipe.
 animateMonsterStride(g,0,dt);
 rig.arms.forEach(a=>{a.rotation.x=-.10;a.rotation.z=0});
 rig.chest.rotation.set(0,0,0);rig.tail.rotation.y=0;
 if(travel?.kind==='interact'||handAction)return;
 const phase=(Date.now()-gameMeta.monster.bornAt)/1000%14;
 if(phase<10||phase>=13)return;
 const t=(phase-10)/3,wind=Math.min(1,t/.30),strike=Math.max(0,Math.min(1,(t-.30)/.20)),recover=Math.max(0,Math.min(1,(t-.50)/.50));
 const ease=x=>x*x*(3-2*x),arm=rig.arms[1];
 arm.rotation.x=(-.10+.65*ease(wind)-2.15*ease(strike))*(1-ease(recover))-.10*ease(recover);
 arm.rotation.z=-.40*Math.sin(Math.PI*t);
 rig.chest.rotation.x=.18*Math.sin(Math.PI*t);
 rig.chest.rotation.y=.12*Math.sin(2*Math.PI*t);
}

function renderMonster(){
 $('#monster-status').hidden=true;if(!scene)return;const m=gameMeta.monster;
 const height=(character?.userData.standingHeight||.95*PLAYER_SCALE)*1.2;
 if(!m||m.hits>=100||Date.now()<m.bornAt){
  if(monsterMesh){scene.remove(monsterMesh);disposeMonster(monsterMesh);monsterMesh=null}setDynamicObstacles();return;
 }
 if(!monsterMesh||Math.abs(monsterMesh.userData.standingHeight-height)>.001){
  if(monsterMesh){scene.remove(monsterMesh);disposeMonster(monsterMesh)}
  const g=createGodzilla(height);g.position.x=scaleX(.90);g.position.z=.90;g.position.y+=.07;g.rotation.y=Math.atan2(.22+furnitureShift.tv-g.position.x,2.1-g.position.z);
  g.userData.roamOrigin=[g.position.x,g.position.z];rigMonster(g);scene.add(g);g.updateMatrixWorld(true);monsterMesh=g;
  setDynamicObstacles(monsterBoxesAt(g,g.position.x,g.position.z));refreshMonsterRoutes();
 }
 $('#monster-status').textContent=`${mode==='online'&&!homeReady?'同步中 · ':''}生命 ${100-m.hits}/100`;updateMonsterLabel();
}
const monsterLabelPoint=new T.Vector3();
function updateMonsterLabel(){
 const label=$('#monster-status'),camera=window.homeScene?.camera,world=$('#world');
 if(!monsterMesh||!camera||!gameMeta.monster||Date.now()<gameMeta.monster.bornAt){label.hidden=true;return}
 monsterLabelPoint.set(monsterMesh.position.x,monsterMesh.position.y+monsterMesh.userData.standingHeight+.16,monsterMesh.position.z).project(camera);
 if(monsterLabelPoint.z<=-1||monsterLabelPoint.z>=1||Math.abs(monsterLabelPoint.x)>1||Math.abs(monsterLabelPoint.y)>1){label.hidden=true;return}
 label.hidden=false;label.style.left=(monsterLabelPoint.x+1)*world.clientWidth/2+'px';label.style.top=(1-monsterLabelPoint.y)*world.clientHeight/2+'px';
}
function disposeMonster(mesh){const materials=new Set();mesh.traverse(n=>{n.geometry?.dispose();if(n.material)for(const m of Array.isArray(n.material)?n.material:[n.material])materials.add(m)});for(const m of materials)m.dispose()}
async function attackMonster(){
 let defeated=false;
 if(mode==='online'&&!homeReady)return toast('雲端資料確認中，請稍候再攻擊');
 try{
  await mutateGame((p,meta)=>{defeated=hitHomeMonster(meta,playerId(),p,{memberIds:Object.keys(profileCache),normalize:normalizePlayer,record})});
  toast(defeated?'哥吉拉擊退！全小屋玩家（含離線）升 5 級，最高 20 級。下次一小時後出現':'命中！');
 }catch(e){toast(e.message||'攻擊未儲存')}
}
const monsterRay=new T.Raycaster(),monsterPointer=new T.Vector2();
function attackMonsterAt(e){
 if(!monsterMesh||!gameMeta.monster||Date.now()<gameMeta.monster.bornAt||gameMeta.monster.hits>=100)return false;
 const rect=$('#scene').getBoundingClientRect();
 if(rect.width<=0||rect.height<=0||e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)return false;
 monsterPointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
 scene.updateMatrixWorld(true);window.homeScene.camera.updateMatrixWorld(true);monsterRay.setFromCamera(monsterPointer,window.homeScene.camera);
 const hit=monsterRay.intersectObject(monsterMesh,true)[0];if(!hit)return false;
 // Ignore invisible interaction areas, but do not attack through opaque walls or furniture.
 const blocker=monsterRay.intersectObject(window.homeScene.root,true).find(h=>blocksMonsterHit(h,hit.distance));
 if(blocker)return false;
 if(!syncBusy){
  const bornAt=gameMeta.monster.bornAt;
  const torso=monsterBoxesAt(monsterMesh,monsterMesh.position.x,monsterMesh.position.z)[0];
  const approached=approachTarget([monsterMesh.position.x,monsterMesh.position.z],()=>{
   if(!monsterMesh||gameMeta.monster?.bornAt!==bornAt||Date.now()<bornAt)return toast('哥吉拉已經離開了');
   const r=monsterBoxesAt(monsterMesh,monsterMesh.position.x,monsterMesh.position.z)[0];
   const bounds=r?{min:{x:r[0],z:r[2]},max:{x:r[1],z:r[3]}}:new T.Box3().setFromObject(monsterMesh);
   const gap=Math.hypot(Math.max(bounds.min.x-character.position.x,0,character.position.x-bounds.max.x),Math.max(bounds.min.z-character.position.z,0,character.position.z-bounds.max.z));
   if(gap>.55)return toast('再靠近哥吉拉一點才能攻擊');
   return interactWithHand(()=>{if(monsterMesh&&gameMeta.monster?.bornAt===bornAt&&Date.now()>=bornAt)return attackMonster()});
  },'走去攻擊哥吉拉',.7,torso?monsterApproachPoints(torso):null);
  if(approached)toast('走去攻擊哥吉拉');
 }else toast('上一筆正在儲存，請稍候再攻擊');
 return true;
}
window.homeGameAttackAt=attackMonsterAt;



function setSceneMenu(open){
 const panel=$('#scene-game-panel'),toggle=$('#scene-menu-toggle');panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));
}
function setupSceneMenu(){
 const panel=$('#scene-game-panel'),toggle=$('#scene-menu-toggle');
 toggle.onclick=()=>setSceneMenu(panel.hidden);
 document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!toggle.contains(e.target))setSceneMenu(false)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){setSceneMenu(false);toggle.focus()}});
}

function openHomePanel(page){
 const id={tasks:'#game-dialog',character:'#character-dialog',family:'#family-dialog'}[page];if(!id)return;
 setSceneMenu(false);if(page==='family')$('#character-dialog').close();if(page==='character')renderAvatarPreview();showPanel(id);
}

{
  $('#home-code').value=new URL(location.href).searchParams.get('home')||localStorage.getItem('little-home-code')||'';
  readPlayer();gameMeta.players[playerId()]=player;fillAvatar();setCharacter(avatar);readLocalClaims();renderTasks();clock();setInterval(clock,1000);
  if(scene)houseNPC=createHouseNPC(window.homeScene,makeCharacter,()=>[character,...[...characters.values()].map(p=>p.mesh)]);
  resolveMonsterOverlap(houseNPC?.character);

  setupSceneMenu();
  let battleOwner='';
  installToyDefense({
   farmOptions:{
    getFarm:getFarmState,getKey:()=>`${homeId||'preview'}:${playerId()}`,
    getUser:()=>({id:playerId(),name:avatar.name}),getProfiles:()=>({...profileCache,[playerId()]:{name:avatar.name}}),toast,
    async action(action,owner){
     if(owner!==`${homeId||'preview'}:${playerId()}`)throw new Error('家庭或帳號已切換，請重新進入農場');
     let result;const at=Date.now();
     await mutateGame((p,meta)=>{
      if(owner!==`${homeId||'preview'}:${playerId()}`)throw new Error('家庭或帳號已切換');
      const farm=structuredClone(meta.farm||(mode==='online'?newFarm():getFarmState()||newFarm()));
      result=farmAction(farm,playerId(),avatar.name,action,at);meta.farm=farm;
      if(action.type==='shirt')p.farmShirt=action.award||'';
     });return result;
    }
   },
   canStart(){
    if(activity){toast('先完成或取消目前的家事，再進入小遊戲');return false}
    if(!character||!scene||syncBusy||(mode==='online'&&(!homeReady||!user))){toast('角色資料尚未就緒，請稍候再試');return false}
    battleOwner=`${homeId||'preview'}:${playerId()}`;return true;
   },
   makeHero(){const copy=makeCharacter(avatar,{...avatarDesign,farmShirt:player.farmShirt});copy.userData.updatePose?.('stand');return copy},
   async onWin(runId, result={}){
    const shooting=result.kind==='shooter';const coins=shooting?Math.max(30,Math.min(50,Math.floor(Number(result.coins)||30))):30;
    if(battleOwner!==`${homeId||'preview'}:${playerId()}`)throw new Error('帳號或家庭已切換，無法把這局獎勵存入不同角色');
    await mutateGame(p=>{
     if((p.toyDefenseRuns||[]).includes(runId))return;
     p.toyDefenseRuns=[runId,...(p.toyDefenseRuns||[])].slice(0,30);
     p.coins+=coins;p.xp=Math.min(MAX_XP,p.xp+20);
     // One earned trophy may use an extra inventory slot; purchases retain their 40-item limit.
     if(!p.inventory.some(o=>o.item==='toy-trophy'))p.inventory.push({id:'toy-trophy-'+playerId(),item:'toy-trophy',room:null,slot:null});
     record(p,shooting?'客廳防衛戰 · 勝利':'玩具保衛戰 · 兩分鐘勝利',coins);
    });
    return `已保存：${coins} 幣、20 EXP。積木恐龍獎盃已在「我的道具」，可以選擇房間擺放。`;
   }
  });
  for(const [id,page] of [['character-open','character'],['family-open','family']])$('#'+id).onclick=()=>openHomePanel(page);
  $('#game-close').onclick=()=>$('#game-dialog').close();
  $('#game-dialog').onclick=e=>{if(e.target!==$('#game-dialog'))return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()};
  $('#shop-dialog').addEventListener('click',e=>{if(e.target!==e.currentTarget)return;const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close()});
  $('#avatar-edit').onclick=editAvatar;
  poseRadial=installPoseRadial({getCharacter:()=>character,getOthers:()=>[houseNPC?.character,monsterMesh,...[...characters.values()].map(p=>p.mesh)],getPose:()=>pose,setPose});
  $('#home-create').onclick=()=>subscribeHome(true);
  $('#home-join').onclick=()=>subscribeHome(false);
  $('#home-share').onclick=shareHome;
  $('#game-status').textContent=`${avatar.name} 正在家裡過日子`;
  $('#inventory-open').onclick=()=>{setSceneMenu(false);renderInventory();showPanel('#inventory-dialog')};
  $('#shop-open').onclick=()=>{setSceneMenu(false);showPanel('#shop-dialog')};

  document.querySelectorAll('[data-close-dialog]').forEach(b=>b.onclick=()=>$(b.dataset.closeDialog).close());
  $('#inventory-dialog').addEventListener('click',e=>{const button=e.target.closest('[data-inventory-tab]');if(!button||!e.currentTarget.contains(button))return;e.preventDefault();inventoryTab=button.dataset.inventoryTab;renderInventory()});
  $('#placement-room').onchange=previewPlacement;$('#placement-confirm').onclick=()=>confirmPlacement();$('#placement-return').onclick=()=>confirmPlacement(true);
  $('#placement-dialog').addEventListener('close',()=>{pendingPlacement=null;renderPlacements()});
  $('#mirror-close').onclick=()=>$('#mirror-dialog').close();
  $('#task-cancel').onclick=()=>{if(activity?.phase==='return')return;activity=null;pose='stand';renderTasks();toast('已取消，未領取獎勵')};
  for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>lastHumanInput=Date.now());
  document.addEventListener('visibilitychange',()=>publishPresence(true,!document.hidden));
  window.addEventListener('pagehide',()=>publishPresence(true,false));
  connect();
}


































