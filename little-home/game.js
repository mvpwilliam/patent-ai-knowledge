import * as T from './vendor/three.module.js';
import {firebaseConfig} from './firebase-config.js?v=64';
import {findPath,canTraverse,walkable,crossesWall} from './navigation.js?v=95';
import {scaleX,sinkX,furnitureShift,pointXZ,furnitureXZ,furnitureXYZ,washerPosition,entryZero} from './layout.js?v=85';
import {createPixelDad,normalizeAvatarDesign,dadWhitePreset} from './pixel-dad.js?v=dad-white-1';
import {openAvatarEditor} from './avatar-editor.js?v=avatar-studio-1';
import {createHouseNPC} from './house-npc.js?v=97';

let avatarDesign=normalizeAvatarDesign({}),designPending=false;
const designLocalKey=()=>`little-home-design-${user?.uid||localActorId}`;
function setAvatarDesign(d,pending=false){avatarDesign=normalizeAvatarDesign(d);designPending=pending;localStorage.setItem(designLocalKey(),JSON.stringify(avatarDesign));}
const scene=window.homeScene?.scene;
const $=s=>document.querySelector(s);
const GAME_META_ID='__home_game_v1';
const defaults=[
 {id:'floor',label:'吸地與拖地',room:'living'}, {id:'dishes',label:'洗碗與收碗',room:'kitchen'},
 {id:'trash',label:'倒垃圾與回收',room:'entry'}, {id:'laundry',label:'洗衣',room:'balcony'},
 {id:'collect',label:'收衣',room:'balcony'}, {id:'fold',label:'摺衣',room:'balcony'},
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
let houseNPC=null,authBusy=false,connectedUid=null;
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
const toast=s=>{const e=$('#toast');e.textContent=s;e.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.classList.remove('show'),2600)};
const boundedCode=s=>s.trim().toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,24);
const claimKey=()=>`little-home-claims-${gameDay}`;

function bodyPart(parent,geometry,color,x,y,z){
  const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.75}));
  mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
}
function makeCharacter(v,design={}){return createPixelDad(v,normalizeAvatarDesign({...design,hairStyle:design.hairStyle||v.hair}));}
function setCharacter(v){
 if(new URLSearchParams(location.search).get('avatar')==='dad-white'){v=outfit({...v,...dadWhitePreset});avatarDesign=normalizeAvatarDesign({...avatarDesign,glasses:true,hairStyle:'korean'});avatar=v;localStorage.setItem('little-home-avatar',JSON.stringify(v));fillAvatar();}
 if(!scene)return;const previous=character?.position.clone(),angle=character?.rotation.y;
 if(character)scene.remove(character);character=makeCharacter(v,avatarDesign);scene.add(character);
 if(previous){character.position.copy(previous);character.rotation.y=angle;return}
 const start=[...(user?.uid||localActorId)].reduce((sum,c)=>sum+c.charCodeAt(0),0)%tour.length;
 character.position.set(tour[start][0],.07,tour[start][1]);route=(start+1)%tour.length;
}
function leaveRest(){
 if(restExit){character.position.set(restExit[0],.07,restExit[1]);restExit=null}
 character.position.y=.07;
}
function setPose(next){
 if(activity)return toast('先完成目前的家事');if(!character)return;
 if(next==='sit')return moveTo(null,'sofa');if(next==='lie')return moveTo(null,'mainBed');
 if(pose==='sit')window.homeScene?.showNews(false);leaveRest();travel=null;
 pose='stand';poseStarted=performance.now();document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',b.dataset.pose===pose));toast('在原地站著');
}
function walkStep(mesh,x,z){
 const from=[mesh.position.x,mesh.position.z];if(!canTraverse(from,[x,z]))return false;mesh.position.x=x;mesh.position.z=z;return true;
}
window.homeGameFocus=()=>character?{position:character.position.clone(),angle:character.rotation.y}:null;
function moveTo(point,kind='walk'){
  if(activity)return toast('先完成目前的家事');
  if(!character)return;
  if(kind.startsWith('diningChair')){const z=kind==='diningChair0'?5.94:6.63;if(onlinePlayers().some(([,p])=>p.presence.pose==='sit'&&Math.hypot(p.presence.x-1.41,p.presence.z-z)<.25))return toast('這張椅子有人坐，請選另一張')}
  if(pose==='sit')window.homeScene?.showNews(false);
  if(restExit&&pose!=='walk')character.position.set(restExit[0],.07,restExit[1]);
  restExit=null;travel=null;pose='stand';
  const stops={diningChair0:[.88,5.94],diningChair1:[.88,6.63],entryMirror:[entryZero+.45,9.58],bathMirror:[4.73+furnitureShift.basin,4.80],sofa:furnitureXZ('sofa',[1.72,2.04]),mainBed:furnitureXZ('mainBed',[4.05,1.68]),childBed:furnitureXZ('childBed',[3.98,6.90])};
  const destination=stops[kind]||point;
  const path=findPath([character.position.x,character.position.z],destination);
  if(!path.length||Math.hypot(path.at(-1)[0]-destination[0],path.at(-1)[1]-destination[1])>.45)return toast('這裡目前走不到');
  pose='walk';document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',false));
  travel={kind,phase:'run',path,index:0,exit:destination};
  toast(kind.includes('Mirror')?'屋主走去照鏡子':kind.startsWith('diningChair')?'屋主走去餐椅':kind==='walk'?'屋主走過去了':kind==='sofa'?'屋主走去沙發':'屋主走去睡覺');
}
window.homeGameMoveTo=moveTo;
let mirrorRenderer=null,mirrorPortrait=null;
function makeMirrorAvatar(){const portrait=makeCharacter(outfit(avatar),avatarDesign);portrait.name='my-mirror-reflection';return portrait}
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
function animate(now){
  updateMarkers();
  if(!character)return;
  const dt=Math.min(.06,(now-lastFrame)/1000||0);lastFrame=now;
  const b=character.userData.body;
  const [leftArm,rightArm]=character.userData.arms,[leftLeg,rightLeg]=character.userData.legs;
  leftArm.position.set(-.20,.42,.015);rightArm.position.set(.20,.42,.015);
  leftArm.rotation.set(0,0,0);rightArm.rotation.set(0,0,0);
  leftLeg.rotation.x=rightLeg.rotation.x=0;
  if(travel){
    if(travel.phase==='run'){
      const [x,z]=travel.path[travel.index],dx=x-character.position.x,dz=z-character.position.z,d=Math.hypot(dx,dz);
      if(d<.04){walkStep(character,x,z);travel.index++;if(travel.index>=travel.path.length){
        if(travel.kind==='walk'){travel=null;pose='stand'}
        else if(travel.kind.includes('Mirror')){const kind=travel.kind;travel=null;pose='stand';character.rotation.y=kind==='entryMirror'?-Math.PI/2:Math.PI;openMirror()}else{travel.phase='settle';travel.from=character.position.clone();travel.progress=0}
      }}else{const move=Math.min(d,dt*1.6);walkStep(character,character.position.x+dx/d*move,character.position.z+dz/d*move);character.rotation.y=Math.atan2(dx,dz)}
      step+=dt*17;b.position.y=Math.abs(Math.sin(step))*.035;b.rotation.set(0,0,Math.sin(step)*.035);
      leftArm.rotation.x=Math.sin(step)*.5;rightArm.rotation.x=-Math.sin(step)*.5;
      leftLeg.rotation.x=-Math.sin(step)*.4;rightLeg.rotation.x=Math.sin(step)*.4;
    }else{
      travel.progress=Math.min(1,travel.progress+dt/.65);
      const target=travel.kind.startsWith('diningChair')?[1.41,.37,travel.kind==='diningChair0'?5.94:6.63]:travel.kind==='sofa'?furnitureXYZ('sofa',[2.54,.51,2.03]):travel.kind==='mainBed'?furnitureXYZ('mainBed',[5.16,.78,1.64]):furnitureXYZ('childBed',[5.12,.78,7.00]);
      if(crossesWall([travel.from.x,travel.from.z],[target[0],target[2]])){travel=null;pose='stand';toast('家具位置跨越牆面，請重新選擇');return}character.position.lerpVectors(travel.from,new T.Vector3(...target),travel.progress);
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
    if(d<.035){walkStep(character,x,z);activity.index++;if(activity.index>=activity.path.length){
      if(activity.phase==='return'){activity=null;pose='stand';renderTasks()}
      else{activity.phase='work';activity.started=now;character.userData.body.position.y=0;if(activity.task.id==='scenery'){character.rotation.y=Math.PI;showScenery()}toast(`開始${activity.task.label}`)}
    }}
    else{const move=Math.min(d,dt*2.05);walkStep(character,character.position.x+dx/d*move,character.position.z+dz/d*move);character.rotation.y=Math.atan2(dx,dz)}
    step+=dt*19;b.position.y=Math.abs(Math.sin(step))*.050;b.rotation.set(0,0,Math.sin(step)*.055);
    leftArm.rotation.x=Math.sin(step)*.8;rightArm.rotation.x=-Math.sin(step)*.8;
    leftLeg.rotation.x=-Math.sin(step)*.6;rightLeg.rotation.x=Math.sin(step)*.6;
  }else if(activity?.phase==='work'){
    const t=(now-activity.started)/1000;
    b.position.y=.012*Math.sin(t*14);b.rotation.x=.12+Math.sin(t*10)*.12;b.rotation.z=0;
    leftArm.position.z=.18;rightArm.position.z=.18;
    leftArm.position.y=.49+Math.sin(t*16)*.06;rightArm.position.y=.49+Math.sin(t*16+Math.PI)*.06;
    leftArm.rotation.x=rightArm.rotation.x=-.75;
    if(activity.task.id==='scenery'){b.position.y=.008*Math.sin(t*3);b.rotation.set(0,0,0);leftArm.position.set(-.20,.42,.015);rightArm.position.set(.20,.42,.015);leftArm.rotation.x=rightArm.rotation.x=0}
    if(t>=(activity.task.id==='scenery'?7:2)){if(activity.task.id==='scenery')hideScenery();const finished=activity;activity=null;b.rotation.x=0;finishTask(finished)}
  }else if(pose==='sit'){
    b.position.y=0;b.rotation.x=restExit?.[0]===.88?0:-.23;b.rotation.z=0;for(const leg of [leftLeg,rightLeg])leg.rotation.x=-.85;
  }else if(pose==='lie'){
    b.position.y=0;b.rotation.x=-Math.PI/2;b.rotation.z=0;
  }else{b.position.y=Math.sin(now*.0015)*.008;b.rotation.x=0;b.rotation.z=0}
  character.userData.updatePose?.(activity?.phase==='work'?'work':travel?'walk':pose);
  const nearBalconyDoor=[character,houseNPC?.character].filter(Boolean).some(p=>Math.abs(p.position.x-scaleX(5.83))<1.12&&Math.abs(p.position.z-8.68)<.82);
  window.homeScene?.setBalconyDoor(nearBalconyDoor);
  window.homeScene?.updateDoorsAt(character.position.x,character.position.z,houseNPC?[[houseNPC.character.position.x,houseNPC.character.position.z]]:[]);
  animateOthers(dt,now);
  houseNPC?.update(dt,now);
  if(houseNPC)houseNPC.character.userData.updatePose?.(houseNPC.state==='act'?houseNPC.action?.pose:houseNPC.state==='walk'?'walk':'stand');
  if(houseNPC)$('#npc-status').textContent=`小屋日常 · ${houseNPC.action?.label||'在家休息'}`;
  updateJoke();
}
window.homeGameUpdate=animate;

function readLocalClaims(){claims=safeRead(claimKey(),{})}
function clock(){
  const current=today();
  if(current!==gameDay){gameDay=current;claims={};if(mode==='preview')readLocalClaims();else subscribeClaims();renderTasks()}
  if(!document.hidden)publishPresence();syncCharacters();renderMonster();
  const left=GAME_DAY_MS-Date.now()%GAME_DAY_MS;
  $('#game-clock').textContent=`下個遊戲日 ${String(Math.floor(left/60000)).padStart(2,'0')}:${String(Math.floor(left%60000/1000)).padStart(2,'0')}`;
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
function closeTaskPopup(){selectedTask=null;$('#chore-popup').hidden=true}
function chooseTask(t){
  if(selectedTask===t.id){closeTaskPopup();return}
  selectedTask=t.id;$('#chore-name').textContent=t.label;
  $('#chore-start').disabled=!!activity||(mode==='online'&&(!user||!homeReady));
  $('#chore-popup').hidden=false;
}
$('#chore-start').onclick=()=>{const task=tasks.find(t=>t.id===selectedTask);closeTaskPopup();if(task)startTask(task)};
$('#chore-close').onclick=closeTaskPopup;
$('#scene').addEventListener('pointerdown',closeTaskPopup);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeTaskPopup()});
function renderMarkers(){
 const layer=$('#chore-markers');layer.replaceChildren();$('#chore-popup').hidden=true;
 const t=activity&&activity.phase!=='return'?activity.task:null;
 $('#active-task').hidden=!t;$('#task-cancel').hidden=!t;
 if(t){$('#active-task').textContent=`${t.label} · ${activity.phase==='work'?'正在完成':'前往中'}…`;const ring=document.createElement('span');ring.className='task-target-ring';ring.dataset.task=t.id;ring.setAttribute('aria-label',t.label+'的位置');layer.append(ring)}
 updateMarkers();
}
function updateMarkers(){
 if(!scene)return;const t=activity&&activity.phase!=='return'?activity.task:null;
 if(!t){$('#chore-markers').replaceChildren();$('#active-task').hidden=true;$('#task-cancel').hidden=true;return}
 $('#active-task').textContent=`${t.label} · ${activity.phase==='work'?'正在完成':'前往中'}…`;
 for(const ring of $('#chore-markers').children){const pos=placement(t).marker;const p=new T.Vector3(pos[0],.12,pos[2]).project(window.homeScene.camera);ring.hidden=p.z<=-1||p.z>=1||Math.abs(p.x)>.95||Math.abs(p.y)>.95;ring.style.left=(p.x+1)*$('#world').clientWidth/2+'px';ring.style.top=(1-p.y)*$('#world').clientHeight/2+'px'}
}
function startTask(t){
  if(activity||isClaimed(t))return;
  if(!dayTasks().some(item=>item.id===t.id))return toast('請從今日家事清單選擇任務');
  if(t.id==='collect'&&!taskDone({id:'laundry'}))return toast('先完成洗衣，再收衣');
  if(t.id==='fold'&&!taskDone({id:'collect'}))return toast('先收衣，再摺衣');
  if(mode==='online'&&(!user||!homeReady))return toast('請先建立家庭或加入家人的家庭');
  if(!character)return toast('請在支援 3D 的瀏覽器啟動場景');
  if(travel)travel=null;
  if(pose==='sit')window.homeScene?.showNews(false);
  leaveRest();
  restExit=null;character.position.y=.07;
  pose='stand';
  const path=findPath([character.position.x,character.position.z],placement(t).stop);
  if(path.length<2)return toast('目前找不到通往家事位置的路');
  pose='walk';document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',false));
  activity={task:t,phase:'run',path,index:0,day:today()};
  if($('#game-dialog').open)$('#game-dialog').close();
  toast(`${avatar.name} 跑去${t.label}`);renderTasks();
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
function fillAvatar(){
  $('#avatar-name').value=avatar.name;$('#avatar-skin').value=avatar.skin;
  $('#avatar-hair').value=avatar.hair;$('#avatar-hair-color').value=avatar.hairColor;$('#avatar-shirt').value=avatar.shirt;
}
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
 const result=await openAvatarEditor(avatar,avatarDesign,false);if(!result)return;
 avatar=outfit(result.profile);setAvatarDesign(result.design,true);fillAvatar();await saveAvatar();
}
async function saveAvatar(){
  const name=$('#avatar-name').value.trim();if(!name||name.length>12){toast('請輸入 1～12 個字的名字');$('#avatar-name').focus();return}
  const appearanceURL=new URL(location.href);appearanceURL.searchParams.delete('avatar');history.replaceState(null,'',appearanceURL);
  avatar=outfit({name,skin:$('#avatar-skin').value,hair:$('#avatar-hair').value,hairColor:$('#avatar-hair-color').value,shirt:$('#avatar-shirt').value});
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
  try{
    const homeRef=api.doc(db,'homes',code);
    if(create){
      await api.runTransaction(db,async tx=>{
        const existing=await tx.get(homeRef);
        if(existing.exists())throw new Error('請再按一次建立家庭');
        tx.set(homeRef,{ownerUid:user.uid,createdAt:api.serverTimestamp()});
      });
    }else{
      const home=await api.getDoc(homeRef);
      if(!home.exists())throw new Error('找不到這個家庭，請檢查邀請連結或家庭代碼');
    }
    homeId=code;
    const profileRef=api.doc(db,'homes',homeId,'profiles',user.uid);
    const profile=await api.getDoc(profileRef);
    if(profile.exists()){
      avatar=outfit(profile.data());localStorage.setItem('little-home-avatar',JSON.stringify(avatar));
      fillAvatar();setCharacter(avatar);
      if(!hasChosenName()){await ensureAppearance();await api.setDoc(profileRef,outfit(avatar))}
      localStorage.setItem(appearanceKey(),'1');
    }else{await ensureAppearance();await api.setDoc(profileRef,outfit(avatar))}
    const tasksRef=api.doc(db,'homes',homeId,'settings','tasks');
    const savedTasks=await api.getDoc(tasksRef);
    if(!savedTasks.exists())await api.setDoc(tasksRef,{items:create?tasks:defaults});
    localStorage.setItem('little-home-code',homeId);
    gameDay=today();homeReady=true;
    $('#account-state').textContent=user.isAnonymous?'訪客已加入家庭。綁定 Google 可在新裝置取回進度。':'Google 帳號已加入家庭，人物進度會同步。';
    $('#game-status').textContent=`${avatar.name} 正在家裡過日子`;
    $('#home-share').disabled=false;
    unsubscribeTasks=api.onSnapshot(tasksRef,snap=>{
      const items=snap.exists()?snap.data().items:defaults;tasks=normalizeTasks(items);applyMeta(items.find(t=>t.id===GAME_META_ID));renderTasks();
    },error=>{homeReady=false;renderTasks();familyError(error)});
    subscribeClaims();
    unsubscribeProfiles=api.onSnapshot(api.collection(db,'homes',homeId,'profiles'),snap=>{
      profileCache={};snap.forEach(d=>profileCache[d.id]=outfit(d.data()));syncCharacters();
    },familyError);
    readPlayer();await mutateGame((p,meta)=>{if(designPending)p.avatarDesign=normalizeAvatarDesign(avatarDesign);if(!meta.monster)meta.monster={bornAt:Date.now()+3600000,hits:0}});designPending=false;publishPresence(true);
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
 if(!u){connectedUid=null;homeReady=false;clearSubscriptions();claims={};renderTasks();return}
 if(authBusy||connectedUid===u.uid||(u.isAnonymous&&!localStorage.getItem('little-home-login-choice')))return;
 connectedUid=u.uid;
 $('#account-state').textContent=u.isAnonymous?'訪客登入成功。':'Google 登入成功。';
 const code=boundedCode($('#home-code').value);
 if(/^[a-f0-9]{24}$/.test(code))await subscribeHome(false);
 else{
  await ensureAppearance();
  if(u.isAnonymous)await subscribeHome(true);
  else{homeReady=false;clearSubscriptions();$('#account-state').textContent='請輸入原家庭代碼或開啟邀請連結，以讀取原人物；新玩家可建立家庭。';$('#game-dialog').selectPage?.('family');$('#game-dialog').showModal()}
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
const MAX_XP=1200;
const roomNames={living:'客廳',dining:'餐廳',kitchen:'廚房',main:'主臥',child:'次臥',bath:'浴室',balcony:'陽台',entry:'玄關'};
const catalog=[
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
const newPlayer=()=>({coins:0,xp:0,inventory:[],completed:{},bonuses:{},ledger:[]});
const localActorId=localStorage.getItem('little-home-player-id')||crypto.randomUUID();localStorage.setItem('little-home-player-id',localActorId);
let gameMeta={id:GAME_META_ID,players:{}},player=newPlayer(),profileCache={},presenceBusy=false,lastPresence=0,lastPresenceSignature='',lastHumanInput=Date.now(),syncBusy=false;
let inventoryTab='全部',pendingPlacement=null,placementObjects=new Map(),monsterMesh=null;
const playerId=()=>user?.uid||localActorId;
const playerKey=()=>`little-home-player-${homeId||'preview'}-${playerId()}`;
const normalizePlayer=p=>({...newPlayer(),...p,inventory:Array.isArray(p?.inventory)?p.inventory:[],completed:p?.completed||{},bonuses:p?.bonuses||{},ledger:p?.ledger||[]});
function readPlayer(){player=normalizePlayer(safeRead(playerKey(),newPlayer()))}
function levelInfo(xp){const level=Math.min(20,1+Math.floor(Math.min(MAX_XP,xp)*19/MAX_XP));const titles=['新手屋主','家事小幫手','居家達人','小屋管家','家的守護者'];return {level,title:titles[Math.floor(level/5)],progress:level===20?1:(xp-(level-1)*MAX_XP/19)/(MAX_XP/19)}}
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
 try{
  if(mode==='online'){
   if(!homeReady||!user)throw new Error('家庭尚未連線');
   const ref=api.doc(db,'homes',homeId,'settings','tasks');
   let updated;
   await api.runTransaction(db,async tx=>{
    const snap=await tx.get(ref),items=snap.exists()?snap.data().items:defaults;
    const meta=structuredClone(items.find(t=>t.id===GAME_META_ID)||{id:GAME_META_ID,players:{}});
    const p=normalizePlayer(meta.players[playerId()]);change(p,meta);meta.players[playerId()]=p;
    tx.set(ref,{items:[...items.filter(t=>t.id!==GAME_META_ID),meta]});updated=meta;
   });
   applyMeta(updated);
  }else{
   const p=normalizePlayer(structuredClone(player));change(p,gameMeta);gameMeta.players[playerId()]=p;applyMeta(gameMeta);
  }
 }finally{syncBusy=false;renderEconomy()}
}
function applyMeta(meta){
 const oldItems=JSON.stringify(Object.values(gameMeta.players||{}).map(p=>p.inventory));
 gameMeta=meta||{id:GAME_META_ID,players:{}};gameMeta.players||={};player=normalizePlayer(gameMeta.players[playerId()]);
 localStorage.setItem(playerKey(),JSON.stringify(player));if(player.avatarDesign&&!designPending&&JSON.stringify(normalizeAvatarDesign(player.avatarDesign))!==JSON.stringify(avatarDesign)){setAvatarDesign(player.avatarDesign);if(character)setCharacter(avatar)}renderEconomy();if(oldItems!==JSON.stringify(Object.values(gameMeta.players).map(p=>p.inventory)))renderPlacements();syncCharacters();renderMonster();
}
function renderEconomy(){
 const info=levelInfo(player.xp);$('#coin-count').textContent=player.coins.toLocaleString();
 $('#player-level').textContent=`Lv.${info.level} · ${info.title}`;$('#xp-meter').value=info.progress;
 $('#xp-label').textContent=info.level===20?'已滿級 · 家事繼續賺幣':`${player.xp} / ${MAX_XP} EXP`;
 $('#daily-progress').textContent=`今日家事 ${dayTasks().filter(t=>taskDone(t)).length}／${dayTasks().length}`;
 $('#wallet-list').replaceChildren();for(const row of player.ledger){const li=document.createElement('p');li.textContent=`${row.text}　${row.amount>=0?'+':''}${row.amount} 幣`;$('#wallet-list').append(li)}
 if(!player.ledger.length)$('#wallet-list').textContent='完成家事後，收入會記在這裡。';
 renderInventory();renderShop();
}
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
function renderShop(){const list=$('#shop-list');list.replaceChildren();for(const item of catalog)list.append(itemCard(item))}
function renderInventory(){
 const list=$('#inventory-list');list.replaceChildren();
 for(const owned of player.inventory){const item=catalog.find(c=>c.id===owned.item);if(!item)continue;
 if(inventoryTab!=='全部'&&(inventoryTab==='已擺放'?!owned.room:item.type!==inventoryTab))continue;list.append(itemCard(item,owned))}
 if(!list.children.length)list.textContent='這裡還沒有道具，先做家事賺幣，再到商店看看。';
 document.querySelectorAll('[data-inventory-tab]').forEach(b=>b.classList.toggle('active',b.dataset.inventoryTab===inventoryTab));
}
async function buyItem(item){
 try{const id=crypto.randomUUID();await mutateGame(p=>{if(p.coins<item.price)throw new Error('遊戲幣不足');if(p.inventory.length>=40)throw new Error('道具欄已滿（40 件）');p.coins-=item.price;p.inventory.push({id,item:item.id,room:null,slot:null});record(p,`購買${item.name}`,-item.price)});toast(`${item.name}已放入道具欄`)}catch(e){toast(e.message||'購買未成功，沒有扣幣')}
}
// Small tabletop items use reserved surface slots and never occupy walkways.
const slots={living:[[scaleX(.24),.68,1.25],[scaleX(.24),.68,2.65]],dining:[[2.22,.83,5.95],[2.22,.83,6.55]],kitchen:[[scaleX(2.64),.98,9.48],[scaleX(2.91),.98,9.48]],main:[[scaleX(4.25),.10,.30],[scaleX(4.55),.10,.30]],child:[[scaleX(3.05),.10,7.94],[scaleX(3.40),.10,7.94]],entry:[[entryZero+.18,1.05,8.10],[entryZero+.90,1.05,8.10]],bath:[[scaleX(4.55),.84,4.02]],balcony:[[washerPosition.x-.22,1.02,washerPosition.z],[washerPosition.x+.22,1.02,washerPosition.z]]};
// Rooms without a free shelf get a small wall shelf above the reserved item.
const shelfRooms=new Set(['main','child']);
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
 if(item==='plant'||item==='flowers'){part(new T.CylinderGeometry(.045,.032,.07,12),'#c49b75',0,.035,0);for(let i=0;i<5;i++){const a=i*1.25;ball(.036,item==='flowers'?'#e6a3b1':'#719077',Math.cos(a)*.025,.10+i*.007,Math.sin(a)*.025)}}
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
 for(const o of owned){const g=makeDecoration(o.item),p=slots[o.room][o.slot];g.position.set(...p);if(shelfRooms.has(o.room)){g.position.y=1.25;bodyPart(g,new T.BoxGeometry(.23,.025,.19),'#c2ad8b',0,-.012,0)}if(o.id==='preview')g.traverse(n=>{if(n.material){n.material.transparent=true;n.material.opacity=.45}});scene.add(g);placementObjects.set(o.id,g)}
}
function onlinePlayers(){return Object.entries(gameMeta.players||{}).filter(([id,p])=>id!==playerId()&&p.presence?.online&&Date.now()-p.presence.at<45000).sort((a,b)=>(b[1].presence.pose==='work')-(a[1].presence.pose==='work')||b[1].presence.at-a[1].presence.at)}
function syncCharacters(){
 if(!scene)return;const online=onlinePlayers(),visible=online.slice(0,5),ids=new Set(visible.map(([id])=>id));
 for(const [id,item] of characters)if(!ids.has(id)){scene.remove(item.mesh);characters.delete(id)}
 for(const [id,p] of visible){const profile=profileCache[id];if(!profile)continue;let item=characters.get(id);const remoteDesign=normalizeAvatarDesign(gameMeta.players[id]?.avatarDesign||{hairStyle:profile.hair});const signature=JSON.stringify([profile,remoteDesign]);
 if(!item||item.signature!==signature){if(item)scene.remove(item.mesh);const mesh=makeCharacter(outfit(profile),remoteDesign);scene.add(mesh);item={mesh,signature,target:p.presence};mesh.position.set(p.presence.x,p.presence.y||.07,p.presence.z);characters.set(id,item)}if(item.target?.x!==p.presence.x||item.target?.z!==p.presence.z){if(item.target?.approach&&['sit','lie'].includes(item.target.pose)&&!['sit','lie'].includes(p.presence.pose)&&!crossesWall([item.mesh.position.x,item.mesh.position.z],item.target.approach))item.mesh.position.set(item.target.approach[0],.07,item.target.approach[1]);const destination=p.presence.approach||[p.presence.x,p.presence.z];item.remotePath=findPath([item.mesh.position.x,item.mesh.position.z],destination);item.remoteIndex=0}item.target=p.presence;
 }
 const list=$('#member-list');list.replaceChildren();for(const [id,v] of Object.entries(profileCache)){const row=document.createElement('p');const active=id===playerId()||online.some(([uid])=>uid===id);row.textContent=`${v.name} · ${active?'上線':'離線'}${active&&id!==playerId()&&!ids.has(id)?'（成員列）':''}`;list.append(row)}
 $('#member-count').textContent=`上線 ${online.length+1} · 屋內 ${characters.size+1}／6`;
}
async function publishPresence(force=false,online=true){
 if(mode!=='online'||!homeReady||!user||!character||presenceBusy||syncBusy)return;
 const moving=!!activity||!!travel||pose==='walk',interval=moving?4000:18000;
 if(!force&&Date.now()-lastPresence<interval)return;
 presenceBusy=true;lastPresence=Date.now();
 const data={online,at:Date.now(),x:character.position.x,y:character.position.y,z:character.position.z,angle:character.rotation.y,approach:restExit||null,pose:activity?'work':travel?'walk':pose};
 try{const ref=api.doc(db,'homes',homeId,'settings','tasks');await api.runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())return;const items=snap.data().items,meta=structuredClone(items.find(t=>t.id===GAME_META_ID)||{id:GAME_META_ID,players:{}});meta.players[playerId()]=normalizePlayer(meta.players[playerId()]);meta.players[playerId()].presence=data;tx.set(ref,{items:[...items.filter(t=>t.id!==GAME_META_ID),meta]})})}catch(e){console.warn('人物狀態同步暫時中斷',e)}finally{presenceBusy=false}
}
function animateOthers(dt,now){
 for(const item of characters.values()){const p=item.target;if(!p)continue;const body=item.mesh.userData.body;
 if(item.remotePath?.length&&item.remoteIndex<item.remotePath.length){const q=item.remotePath[item.remoteIndex],dx=q[0]-item.mesh.position.x,dz=q[1]-item.mesh.position.z,d=Math.hypot(dx,dz);if(d<.035){walkStep(item.mesh,q[0],q[1]);item.remoteIndex++;}else{const move=Math.min(d,dt*2);walkStep(item.mesh,item.mesh.position.x+dx/d*move,item.mesh.position.z+dz/d*move)}item.mesh.position.y=p.y||.07}else if(!crossesWall([item.mesh.position.x,item.mesh.position.z],[p.x,p.z]))item.mesh.position.lerp(new T.Vector3(p.x,p.y||.07,p.z),Math.min(1,dt*3));item.mesh.rotation.y=p.angle||0;
 body.rotation.x=p.pose==='lie'?-Math.PI/2:p.pose==='sit'?(p.approach?.[0]===.88?0:-.23):0;body.rotation.z=0;body.position.y=p.pose==='walk'?Math.abs(Math.sin(now*.008))*.02:0;
 for(const [i,limb] of [...item.mesh.userData.arms,...item.mesh.userData.legs].entries())limb.rotation.x=p.pose==='walk'?Math.sin(now*.009+i%2*Math.PI)*.3:p.pose==='work'&&i<2?-.75:p.pose==='sit'&&i>=2?-.85:0;
 item.mesh.userData.updatePose?.(p.pose);
 }
}
function renderMonster(){
 $('#monster-button').hidden=true;if(!scene)return;const m=gameMeta.monster;if(monsterMesh){scene.remove(monsterMesh);monsterMesh.traverse(n=>{n.geometry?.dispose();n.material?.dispose()});monsterMesh=null}
 if(!m||m.hits>=100||Date.now()<m.bornAt)return;
 const g=new T.Group();g.name='hourly-godzilla';g.position.set(scaleX(.8),.08,7.75);
 bodyPart(g,new T.ConeGeometry(.18,.45,10),'#647b65',0,.22,0);bodyPart(g,new T.SphereGeometry(.13,12,10),'#647b65',0,.48,.06);
 for(const x of [-.09,.09]){bodyPart(g,new T.SphereGeometry(.065,10,8),'#647b65',x,.07,.04);bodyPart(g,new T.SphereGeometry(.018,8,6),'#e9e2bb',x*.8,.51,.15)}
 const tail=bodyPart(g,new T.ConeGeometry(.07,.30,10),'#647b65',0,.08,-.22);tail.rotation.x=-1.15;
 for(let i=0;i<4;i++)bodyPart(g,new T.ConeGeometry(.05,.12,4),'#829b81',0,.18+i*.08,-.16);
 // 2.45 metres from foot to crown, just under the 2.6 metre walls.
 g.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(g),height=bounds.max.y-bounds.min.y;
 const scale=2.45/height;g.scale.setScalar(scale);g.position.y=.08-bounds.min.y*scale+g.position.y*scale;
 g.position.x=scaleX(1.25);g.position.z=4.25;
 scene.add(g);monsterMesh=g;$('#monster-button').hidden=false;$('#monster-button').textContent=`攻擊哥吉拉　·　已命中 ${m.hits} / 100`;
}
async function attackMonster(){try{await mutateGame((p,meta)=>{const m=meta.monster;if(!m||Date.now()<m.bornAt||m.hits>=100)throw new Error('哥吉拉還沒出現');m.hits++;if(m.hits>=100){m.bornAt=Date.now()+3600000;m.hits=0}});toast(gameMeta.monster.bornAt>Date.now()?'哥吉拉消失了，下次一小時後出現':'命中！')}catch(e){toast(e.message||'攻擊未儲存')}}



function setupGamePages(){
 const dialog=$('#game-dialog'),grid=dialog.querySelector?.('.game-grid'),head=dialog.querySelector?.('.dialog-head'),account=dialog.querySelector?.('.account');
 if(!grid||!head||!account)return;
 const sections=[...grid.children];const pages={tasks:sections[1],character:sections[0],family:account};
 const tabs=document.createElement('div');tabs.className='game-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','家事、角色與家庭');
 const body=document.createElement('div');body.className='game-dialog-body';
 const note=$('#game-mode');body.append(note,grid,account);
 const select=key=>{for(const [id,page] of Object.entries(pages))page.hidden=id!==key;note.hidden=key!=='tasks';body.scrollTop=0;head.querySelector('h2').textContent={tasks:'今日家事',character:'我的角色',family:'我的家庭'}[key];for(const button of tabs.children){const active=button.dataset.page===key;button.setAttribute('aria-selected',active);button.tabIndex=active?0:-1}};
 for(const [key,label] of [['tasks','今日家事'],['character','我的角色'],['family','我的家庭']]){
  pages[key].id='game-page-'+key;pages[key].setAttribute('role','tabpanel');
  const b=document.createElement('button');b.id='game-tab-'+key;b.dataset.page=key;b.textContent=label;b.setAttribute('role','tab');b.setAttribute('aria-controls',pages[key].id);pages[key].setAttribute('aria-labelledby',b.id);b.onclick=()=>select(key);
  b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const order=['tasks','character','family'],next=order[(order.indexOf(key)+(e.key==='ArrowRight'?1:2))%3];select(next);$('#game-tab-'+next).focus()};tabs.append(b);
 }
 const foot=document.createElement('div');foot.className='game-dialog-foot';const close=document.createElement('button');close.textContent='回到小屋';close.onclick=()=>dialog.close();foot.append(close);
 dialog.append(tabs,body,foot);dialog.selectPage=select;select('tasks');
}
{
  $('#home-code').value=new URL(location.href).searchParams.get('home')||localStorage.getItem('little-home-code')||'';
  readPlayer();gameMeta.players[playerId()]=player;fillAvatar();setCharacter(avatar);readLocalClaims();renderTasks();clock();setInterval(clock,1000);
  if(scene)houseNPC=createHouseNPC(window.homeScene,makeCharacter,()=>[character,...characters.values()]);
  const npcStatus=document.createElement('small');npcStatus.id='npc-status';npcStatus.textContent='小屋日常 · 在家休息';$('#game-status').after?.(npcStatus);
  setupGamePages();
  $('#game-open').onclick=()=>{$('#game-dialog').selectPage?.('tasks');$('#game-dialog').showModal()};
  $('#game-close').onclick=()=>$('#game-dialog').close();
  $('#game-dialog').onclick=e=>{if(e.target!==$('#game-dialog'))return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()};
  $('#shop-dialog').addEventListener('click',e=>{if(e.target!==e.currentTarget)return;const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close()});
  $('#avatar-save').onclick=saveAvatar;
  const editButton=document.createElement('button');editButton.textContent='選範本與捏造型';editButton.className='game-primary';editButton.onclick=editAvatar;$('#avatar-save').before(editButton);
  const dadPresetButton=document.createElement('button');dadPresetButton.id='avatar-pixel-dad';dadPresetButton.textContent='爸爸像素造型 · 白T牛仔褲';dadPresetButton.onclick=()=>{setAvatarDesign({...avatarDesign,glasses:true,hairStyle:'korean'},true);for(const [field,value]of Object.entries(dadWhitePreset))$('#avatar-'+(field==='hairColor'?'hair-color':field)).value=value;saveAvatar()};$('#avatar-save').after(dadPresetButton);
  document.querySelectorAll('[data-pose]').forEach(b=>b.onclick=()=>setPose(b.dataset.pose));
  $('#home-create').onclick=()=>subscribeHome(true);
  $('#home-join').onclick=()=>subscribeHome(false);
  $('#home-share').onclick=shareHome;
  $('#game-status').textContent=`${avatar.name} 正在家裡過日子`;
  $('#wallet-open').onclick=()=>showPanel('#wallet-dialog');
  $('#inventory-open').onclick=()=>showPanel('#inventory-dialog');
  $('#shop-open').onclick=()=>showPanel('#shop-dialog');
  $('#members-open').onclick=()=>showPanel('#members-dialog');
  document.querySelectorAll('[data-close-dialog]').forEach(b=>b.onclick=()=>$(b.dataset.closeDialog).close());
  document.querySelectorAll('[data-inventory-tab]').forEach(b=>b.onclick=()=>{inventoryTab=b.dataset.inventoryTab;renderInventory()});
  $('#placement-room').onchange=previewPlacement;$('#placement-confirm').onclick=()=>confirmPlacement();$('#placement-return').onclick=()=>confirmPlacement(true);
  $('#placement-dialog').addEventListener('close',()=>{pendingPlacement=null;renderPlacements()});
  $('#monster-button').onclick=attackMonster;$('#mirror-close').onclick=()=>$('#mirror-dialog').close();
  $('#task-cancel').onclick=()=>{if(activity?.phase==='return')return;activity=null;pose='stand';renderTasks();toast('已取消，未領取獎勵')};
  for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>lastHumanInput=Date.now());
  document.addEventListener('visibilitychange',()=>publishPresence(true,!document.hidden));
  window.addEventListener('pagehide',()=>publishPresence(true,false));
  connect();
}






