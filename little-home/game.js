import * as T from './vendor/three.module.js';
import {firebaseConfig} from './firebase-config.js';
import {findPath} from './navigation.js?v=55';

const scene=window.homeScene?.scene;
const $=s=>document.querySelector(s);
const defaults=[
  {id:'floor',label:'掃地、拖地',room:'living'},
  {id:'dishes',label:'洗碗與整理流理台',room:'kitchen'},
  {id:'laundry',label:'洗衣',room:'balcony'},
  {id:'collect',label:'收衣',room:'balcony'},
  {id:'bath',label:'清潔浴室',room:'bath'},
  {id:'trash',label:'倒垃圾',room:'entry'}
];
const chores={
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
const placement=t=>chores[t.id]||chores[t.room]||chores.living;
const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
let avatar=safeRead('little-home-avatar',{name:'小屋主',skin:'#e9b990',hair:'bob',hairColor:'#4d3834',shirt:'#7899a0'});
const normalizeTasks=items=>{
  if(!Array.isArray(items))return defaults;
  const result=items.map(t=>t.id==='laundry'?{...t,label:'洗衣',room:'balcony'}:t);
  const laundryIndex=result.findIndex(t=>t.id==='laundry');
  if(laundryIndex>=0&&!result.some(t=>t.id==='collect'))result.splice(laundryIndex+1,0,{id:'collect',label:'收衣',room:'balcony'});
  return result;
};
let tasks=normalizeTasks(safeRead('little-home-tasks',defaults));
let hour=Math.floor(Date.now()/3600000),claims={};
let mode='preview',auth=null,db=null,api=null,user=null,homeId='',unsubscribeTasks=null,unsubscribeClaims=null,unsubscribeProfiles=null;
let character=null,characters=new Map(),pose='walk',step=0,lastFrame=0,route=1,poseStarted=0,activity=null,travel=null,restExit=null;
const stops=[[1.35,4.25],[1.2,3.7],[1.15,1.25],[.7,2.6],[.72,4.8],[.68,6.1],[.70,7.8],[.65,8.65]];
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
const outfit=v=>({name:String(v.name||'小屋主').slice(0,12),skin:v.skin||'#e9b990',hair:v.hair||'bob',hairColor:v.hairColor||'#4d3834',shirt:v.shirt||'#7899a0'});
const toast=s=>{const e=$('#toast');e.textContent=s;e.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.classList.remove('show'),2600)};
const boundedCode=s=>s.trim().toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,24);
const today=()=>Math.floor(Date.now()/3600000);
const claimKey=()=>`little-home-claims-${hour}`;

function bodyPart(parent,geometry,color,x,y,z){
  const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.75}));
  mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
}
function makeCharacter(v){
  const g=new T.Group(),body=new T.Group();g.add(body);
  const sphere=(r,color,x,y,z)=>bodyPart(body,new T.SphereGeometry(r,16,12),color,x,y,z);
  sphere(.19,v.shirt,0,.40,0).scale.set(.9,1.15,.7);
  sphere(.24,v.skin,0,.75,0).scale.set(1,1.05,.9);
  sphere(.255,v.hairColor,0,.855,-.012).scale.set(1,.48,1);
  if(v.hair==='long')for(const x of [-.20,.20])sphere(.085,v.hairColor,x,.66,-.065).scale.set(.7,1.8,1);
  if(v.hair==='cap'){sphere(.22,v.shirt,0,.93,0).scale.set(1.05,.35,1);sphere(.16,v.shirt,0,.90,.20).scale.set(1.1,.17,.55)}
  const arms=[],legs=[];
  for(const x of [-.085,.085]){
    sphere(.017,'#303135',x,.77,.208);
    const arm=sphere(.064,v.skin,x*2.35,.42,.015);arm.scale.set(.55,1.6,.6);arms.push(arm);
    const leg=sphere(.075,'#3c5267',x,.13,.01);leg.scale.set(.7,1.7,.8);legs.push(leg);
  }
  const smile=bodyPart(body,new T.TorusGeometry(.037,.007,5,12,Math.PI), '#874e4b',0,.68,.218);smile.rotation.z=Math.PI;
  g.userData.body=body;g.userData.arms=arms;g.userData.legs=legs;g.userData.step=Math.random()*8;return g;
}
function setCharacter(v){
  if(!scene)return;
  if(character)scene.remove(character);
  character=makeCharacter(v);scene.add(character);character.position.set(tour[0][0],.07,tour[0][1]);route=1;
  if(pose!=='walk')setPose(pose);
}
function setPose(next){
  if(activity){toast('先完成目前的家事');return}
  travel=null;restExit=null;pose=next;poseStarted=performance.now();
  document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',b.dataset.pose===next));
  if(!character){toast('角色姿勢已選好，請在支援 3D 的瀏覽器觀看');return}
  if(next==='sit'){character.position.set(2.48,.52,2.03);character.rotation.y=Math.PI/2}
  if(next==='lie'){character.position.set(4.86,.47,1.7);character.rotation.y=0}
  if(next==='stand'){character.position.set(1.55,.07,5.9);character.rotation.y=0}
  if(next==='walk'){character.position.set(tour[0][0],.07,tour[0][1]);route=1}
  toast(({walk:'開始在家裡散步',stand:'站在餐廳',sit:'坐在沙發',lie:'躺在主臥床上'})[next]);
}
function moveTo(point,kind='walk'){
  if(activity)return toast('先完成目前的家事');
  if(!character)return;
  if(restExit&&pose!=='walk')character.position.set(restExit[0],.07,restExit[1]);
  restExit=null;travel=null;pose='walk';
  document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',b.dataset.pose==='walk'));
  const stops={sofa:[1.72,2.04],mainBed:[4.05,1.68],childBed:[3.98,6.90]};
  const destination=stops[kind]||point;
  const path=findPath([character.position.x,character.position.z],destination);
  if(!path.length||Math.hypot(path.at(-1)[0]-destination[0],path.at(-1)[1]-destination[1])>.45)return toast('這裡目前走不到');
  travel={kind,phase:'run',path,index:0,exit:destination};
  toast(kind==='walk'?'屋主走過去了':kind==='sofa'?'屋主走去沙發':'屋主走去睡覺');
}
window.homeGameMoveTo=moveTo;
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
      if(d<.04){travel.index++;if(travel.index>=travel.path.length){
        if(travel.kind==='walk'){travel=null;pose='stand'}
        else{travel.phase='settle';travel.from=character.position.clone();travel.progress=0}
      }}else{const move=Math.min(d,dt*1.6);character.position.x+=dx/d*move;character.position.z+=dz/d*move;character.rotation.y=Math.atan2(dx,dz)}
      step+=dt*17;b.position.y=Math.abs(Math.sin(step))*.035;b.rotation.set(0,0,Math.sin(step)*.035);
      leftArm.rotation.x=Math.sin(step)*.5;rightArm.rotation.x=-Math.sin(step)*.5;
      leftLeg.rotation.x=-Math.sin(step)*.4;rightLeg.rotation.x=Math.sin(step)*.4;
    }else{
      travel.progress=Math.min(1,travel.progress+dt/.65);
      const target=travel.kind==='sofa'?[2.54,.51,2.03]:travel.kind==='mainBed'?[5.16,.78,1.64]:[5.12,.78,7.00];
      character.position.lerpVectors(travel.from,new T.Vector3(...target),travel.progress);
      if(travel.progress>=1){
        const kind=travel.kind;restExit=travel.exit;travel=null;
        pose=kind==='sofa'?'sit':'lie';
        character.rotation.y=kind==='mainBed'?-Math.PI/2:kind==='childBed'?Math.PI:Math.PI/2;
        document.querySelectorAll('[data-pose]').forEach(btn=>btn.classList.toggle('active',btn.dataset.pose===pose));
        if(kind==='sofa')window.homeScene?.showNews(true);
      }
    }
  }else if(activity?.phase==='run'||activity?.phase==='return'){
    const [x,z]=activity.path[activity.index],dx=x-character.position.x,dz=z-character.position.z,d=Math.hypot(dx,dz);
    if(d<.035){activity.index++;if(activity.index>=activity.path.length){
      if(activity.phase==='return'){route=activity.route;activity=null;renderTasks()}
      else{activity.phase='work';activity.started=now;character.userData.body.position.y=0;toast(`開始${activity.task.label}`)}
    }}
    else{const move=Math.min(d,dt*2.05);character.position.x+=dx/d*move;character.position.z+=dz/d*move;character.rotation.y=Math.atan2(dx,dz)}
    step+=dt*19;b.position.y=Math.abs(Math.sin(step))*.050;b.rotation.set(0,0,Math.sin(step)*.055);
    leftArm.rotation.x=Math.sin(step)*.8;rightArm.rotation.x=-Math.sin(step)*.8;
    leftLeg.rotation.x=-Math.sin(step)*.6;rightLeg.rotation.x=Math.sin(step)*.6;
  }else if(activity?.phase==='work'){
    const t=(now-activity.started)/1000;
    b.position.y=.012*Math.sin(t*14);b.rotation.x=.12+Math.sin(t*10)*.12;b.rotation.z=0;
    leftArm.position.z=.18;rightArm.position.z=.18;
    leftArm.position.y=.49+Math.sin(t*16)*.06;rightArm.position.y=.49+Math.sin(t*16+Math.PI)*.06;
    leftArm.rotation.x=rightArm.rotation.x=-.75;
    if(t>=2){const finished=activity;activity=null;b.rotation.x=0;finishTask(finished)}
  }else if(pose==='walk'){
    const [x,z]=tour[route],dx=x-character.position.x,dz=z-character.position.z,d=Math.hypot(dx,dz);
    if(d<.04)route=(route+1)%tour.length;
    else {const move=Math.min(d,dt*.53);character.position.x+=dx/d*move;character.position.z+=dz/d*move;character.rotation.y=Math.atan2(dx,dz)}
    step+=dt*10;b.position.y=Math.abs(Math.sin(step))*.028;b.rotation.z=Math.sin(step)*.035;b.rotation.x=0;
    leftArm.rotation.x=Math.sin(step)*.28;rightArm.rotation.x=-Math.sin(step)*.28;
    leftLeg.rotation.x=-Math.sin(step)*.22;rightLeg.rotation.x=Math.sin(step)*.22;
  }else if(pose==='sit'){
    b.position.y=0;b.rotation.x=-.23;b.rotation.z=0;
  }else if(pose==='lie'){
    b.position.y=0;b.rotation.x=-Math.PI/2;b.rotation.z=0;
  }else{b.position.y=Math.sin(now*.0015)*.008;b.rotation.x=0;b.rotation.z=0}
  const nearBalconyDoor=Math.abs(character.position.x-5.83)<1.12&&Math.abs(character.position.z-8.68)<.82;
  window.homeScene?.setBalconyDoor(nearBalconyDoor);
  window.homeScene?.updateDoorsAt(character.position.x,character.position.z);
  for(const [id,item] of characters){
    const [x,z,angle]=pointOnTour(now*.00043+item.seed*.17);
    item.mesh.position.set(x,.07,z);
    item.mesh.rotation.y=angle;
    item.mesh.userData.body.position.y=Math.abs(Math.sin(now*.006+item.seed))*.02;
  }
}
window.homeGameUpdate=animate;

function readLocalClaims(){claims=safeRead(claimKey(),{})}
function clock(){
  const current=today();
  if(current!==hour){hour=current;claims={};if(mode==='preview')readLocalClaims();else subscribeClaims();renderTasks()}
  const left=3600000-Date.now()%3600000;
  $('#game-clock').textContent=`下個遊戲日 ${String(Math.floor(left/60000)).padStart(2,'0')}:${String(Math.floor(left%60000/1000)).padStart(2,'0')}`;
}
function renderTasks(){
  const list=$('#task-list');list.replaceChildren();
  for(const t of tasks){
    if(claims[t.id])continue;
    const row=document.createElement('div');row.className='task-row';
    const label=document.createElement('span');label.textContent=t.label;
    const button=document.createElement('button');button.textContent='前往';
    button.disabled=!!activity||(mode==='online'&&!user);
    button.onclick=()=>startTask(t);
    row.append(label,button);list.append(row);
  }
  if(!list.children.length){const message=document.createElement('p');message.className='task-intro';message.textContent='這個遊戲日的家事都完成了，下一小時會重置。';list.append(message)}
  renderMarkers();
}
function renderMarkers(){
  const layer=$('#chore-markers');layer.replaceChildren();
  if(!scene)return;
  for(const t of tasks){
    if(claims[t.id])continue;
    const info=placement(t),button=document.createElement('button');
    button.className='chore-marker';button.dataset.task=t.id;
    button.textContent=`${info.icon} ${t.label}`;
    button.title=t.label;
    button.disabled=!!activity||(mode==='online'&&!user);
    button.onclick=e=>{e.stopPropagation();startTask(t)};
    layer.append(button);
  }
  updateMarkers();
}
function updateMarkers(){
  if(!scene)return;
  for(const button of $('#chore-markers').children){
    const t=tasks.find(task=>task.id===button.dataset.task);if(!t)continue;
    const p=new T.Vector3(...placement(t).marker).project(window.homeScene.camera);
    button.hidden=p.z<=-1||p.z>=1||Math.abs(p.x)>.90||Math.abs(p.y)>.86;
    button.style.left=`${(p.x+1)*50}%`;button.style.top=`${(1-p.y)*50}%`;
    button.classList.toggle('busy',activity?.task.id===t.id);
  }
}
function startTask(t){
  if(activity||claims[t.id])return;
  if(mode==='online'&&!user)return toast('請先登入家庭帳號');
  if(!character)return toast('請在支援 3D 的瀏覽器啟動場景');
  if(travel)travel=null;
  if(restExit&&pose!=='walk')character.position.set(restExit[0],.07,restExit[1]);
  else if(pose==='sit')character.position.set(1.75,.07,2.03);
  else if(pose==='lie')character.position.set(3.95,.07,4.85);
  else if(pose==='stand')character.position.set(.75,.07,5.10);
  restExit=null;character.position.y=.07;
  pose='walk';document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',b.dataset.pose==='walk'));
  const path=findPath([character.position.x,character.position.z],placement(t).stop);
  if(path.length<2)return toast('目前找不到通往家事位置的路');
  activity={task:t,phase:'run',path,index:0,day:today()};
  if($('#game-dialog').open)$('#game-dialog').close();
  toast(`${avatar.name} 跑去${t.label}`);renderTasks();
}
async function finishTask(job){
  const nearest=tour.reduce((best,p,i)=>Math.hypot(p[0]-character.position.x,p[1]-character.position.z)<best.distance?{index:i,distance:Math.hypot(p[0]-character.position.x,p[1]-character.position.z)}:best,{index:0,distance:Infinity}).index;
  const path=findPath([character.position.x,character.position.z],tour[nearest]);
  activity={task:job.task,phase:'return',path,index:0,route:(nearest+1)%tour.length};
  if(path.length<2){route=nearest;activity=null}
  renderTasks();
  if(job.day!==today()){toast('新的一天開始了，請重新選家事');return}
  await claimTask(job.task,job.day);
}
async function claimTask(t,day=today()){
  if(mode==='preview'){
    const saved=safeRead(claimKey(),{});if(saved[t.id]){claims=saved;renderTasks();toast('今天這項家事已經有人完成');return}
    if(day!==today())return toast('新的一天開始了，請重新選家事');
    claims[t.id]={name:avatar.name};localStorage.setItem(claimKey(),JSON.stringify(claims));
    renderTasks();toast('完成！下一個遊戲日再重置');return;
  }
  if(!user)return toast('請先登入家庭帳號');
  const ref=api.doc(db,'homes',homeId,'days',String(day),'claims',t.id);
  try{
    await api.runTransaction(db,async tx=>{
      const existing=await tx.get(ref);
      if(existing.exists())throw new Error('今天這項家事已經有人完成');
      if(day!==today())throw new Error('新的一天開始了，請再試一次');
      tx.set(ref,{uid:user.uid,name:avatar.name,at:api.serverTimestamp()});
    });
    toast('完成！家人現在也會看到');
  }catch(e){toast(e.message||'暫時無法完成，請再試一次')}
}
async function addTask(){
  const field=$('#task-new'),label=field.value.trim().slice(0,24);
  if(!label)return;
  if(tasks.length>=30)return toast('最多設定 30 項家事');
  const task={id:'custom-'+Math.random().toString(36).slice(2,10),label,room:$('#task-room').value};
  const next=[...tasks,task];field.value='';
  if(mode==='online'){
    if(!user)return toast('請先登入');
    try{await api.setDoc(api.doc(db,'homes',homeId,'settings','tasks'),{items:next})}
    catch{toast('新增失敗，請再試一次')}
  }else{tasks=next;localStorage.setItem('little-home-tasks',JSON.stringify(tasks));renderTasks()}
}
function fillAvatar(){
  $('#avatar-name').value=avatar.name;$('#avatar-skin').value=avatar.skin;
  $('#avatar-hair').value=avatar.hair;$('#avatar-hair-color').value=avatar.hairColor;$('#avatar-shirt').value=avatar.shirt;
}
async function saveAvatar(){
  avatar=outfit({name:$('#avatar-name').value.trim()||'小屋主',skin:$('#avatar-skin').value,hair:$('#avatar-hair').value,hairColor:$('#avatar-hair-color').value,shirt:$('#avatar-shirt').value});
  localStorage.setItem('little-home-avatar',JSON.stringify(avatar));setCharacter(avatar);
  if(user)try{await api.setDoc(api.doc(db,'homes',homeId,'profiles',user.uid),avatar)}catch{toast('造型已存本機，雲端同步失敗');return}
  $('#game-status').textContent=`${avatar.name} 正在家裡過日子`;toast('角色造型已儲存');
}
function clearSubscriptions(){
  for(const fn of [unsubscribeTasks,unsubscribeClaims,unsubscribeProfiles])fn?.();
  unsubscribeTasks=unsubscribeClaims=unsubscribeProfiles=null;
  for(const item of characters.values())scene?.remove(item.mesh);characters.clear();
}
function subscribeClaims(){
  unsubscribeClaims?.();if(!db||!homeId||!user)return;
  const ref=api.collection(db,'homes',homeId,'days',String(hour),'claims');
  unsubscribeClaims=api.onSnapshot(ref,snap=>{claims={};snap.forEach(d=>claims[d.id]=d.data());renderTasks()},()=>toast('家事同步暫時中斷'));
}
function subscribeHome(){
  clearSubscriptions();if(!user)return;
  homeId=boundedCode($('#home-code').value);
  if(!homeId){toast('請設定家庭代碼');return}
  localStorage.setItem('little-home-code',homeId);
  $('#home-code').value=homeId;
  unsubscribeTasks=api.onSnapshot(api.doc(db,'homes',homeId,'settings','tasks'),snap=>{
    tasks=normalizeTasks(snap.exists()?snap.data().items:defaults);renderTasks();
  },()=>toast('任務設定讀取失敗'));
  subscribeClaims();
  unsubscribeProfiles=api.onSnapshot(api.collection(db,'homes',homeId,'profiles'),snap=>{
    if(!scene)return;
    const present=new Set();
    snap.forEach(d=>{
      if(d.id===user.uid)return;present.add(d.id);
      const v=outfit(d.data()),previous=characters.get(d.id);
      if(previous)scene.remove(previous.mesh);
      const mesh=makeCharacter(v);scene.add(mesh);characters.set(d.id,{mesh,seed:[...d.id].reduce((s,c)=>s+c.charCodeAt(0),0)});
    });
    for(const [id,item] of characters)if(!present.has(id)){scene.remove(item.mesh);characters.delete(id)}
  },()=>{});
  api.getDoc(api.doc(db,'homes',homeId,'profiles',user.uid)).then(s=>{
    if(s.exists()){avatar=outfit(s.data());fillAvatar();setCharacter(avatar)}
    else saveAvatar();
  });
}
async function credentials(register){
  if(!auth)return toast('家庭登入尚未啟用');
  const email=$('#account-email').value.trim(),password=$('#account-password').value;
  if(!email||password.length<6)return toast('請輸入電郵與至少六字元的密碼');
  try{
    if(register)await api.createUserWithEmailAndPassword(auth,email,password);
    else await api.signInWithEmailAndPassword(auth,email,password);
    $('#account-password').value='';
  }catch(e){toast(({ 'auth/email-already-in-use':'這個電郵已註冊','auth/invalid-credential':'帳號或密碼不正確','auth/weak-password':'密碼太短'})[e.code]||'登入失敗，請檢查設定')}
}
async function connect(){
  if(!firebaseConfig?.apiKey||!firebaseConfig?.projectId){
    $('#game-mode').textContent='目前是單機體驗：角色與任務只儲存在這台裝置。跨裝置登入與搶任務待啟用家庭資料庫。';
    $('#account-state').textContent='家庭帳號尚未啟用。';
    return;
  }
  try{
    const base='https://www.gstatic.com/firebasejs/12.19.0/';
    const [app,authLib,store]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
    api={...authLib,...store};const instance=app.initializeApp(firebaseConfig);
    auth=authLib.getAuth(instance);db=store.getFirestore(instance);mode='online';
    $('#game-mode').textContent='已連接家庭資料庫；家人使用相同家庭代碼即可共用每日家事。';
    authLib.onAuthStateChanged(auth,u=>{
      user=u;$('#account-state').textContent=u?`已登入：${u.email}`:'尚未登入';
      if(u)subscribeHome();else{clearSubscriptions();claims={};renderTasks()}
    });
  }catch(e){$('#game-mode').textContent='家庭資料庫連線失敗，請檢查網路與 Firebase 設定。';$('#account-state').textContent='無法登入';}
}

{
  $('#home-code').value=localStorage.getItem('little-home-code')||'';
  fillAvatar();setCharacter(avatar);readLocalClaims();renderTasks();clock();setInterval(clock,1000);
  $('#game-open').onclick=()=>$('#game-dialog').showModal();
  $('#game-close').onclick=()=>$('#game-dialog').close();
  $('#game-dialog').onclick=e=>{if(e.target===$('#game-dialog'))e.target.close()};
  $('#avatar-save').onclick=saveAvatar;
  document.querySelectorAll('[data-pose]').forEach(b=>b.onclick=()=>setPose(b.dataset.pose));
  $('#task-add').onclick=addTask;
  $('#account-register').onclick=()=>credentials(true);
  $('#account-login').onclick=()=>credentials(false);
  $('#account-logout').onclick=()=>auth&&api.signOut(auth);
  $('#home-code').onchange=()=>{if(user)subscribeHome()};
  $('#game-status').textContent=`${avatar.name} 正在家裡過日子`;
  connect();
}
