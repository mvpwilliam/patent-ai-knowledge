import * as T from './vendor/three.module.js';
import {firebaseConfig} from './firebase-config.js';

const scene=window.homeScene?.scene;
const $=s=>document.querySelector(s);
const defaults=[
  {id:'floor',label:'掃地、拖地'},
  {id:'dishes',label:'洗碗與整理流理台'},
  {id:'laundry',label:'洗衣與收衣'},
  {id:'bath',label:'清潔浴室'},
  {id:'trash',label:'倒垃圾'}
];
const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
let avatar=safeRead('little-home-avatar',{name:'小屋主',skin:'#e9b990',hair:'bob',hairColor:'#4d3834',shirt:'#7899a0'});
let tasks=safeRead('little-home-tasks',defaults);
let hour=Math.floor(Date.now()/3600000),claims={};
let mode='preview',auth=null,db=null,api=null,user=null,homeId='',unsubscribeTasks=null,unsubscribeClaims=null,unsubscribeProfiles=null;
let character=null,characters=new Map(),pose='walk',step=0,lastFrame=0,route=0,poseStarted=0;
const routePoints=[[1.35,4.3],[1.7,5.7],[2.0,7.35],[2.32,8.75],[1.65,7.25],[1.25,5.2],[1.35,3.5],[1.7,1.4],[2.18,1.15]];
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
  for(const x of [-.085,.085]){
    sphere(.017,'#303135',x,.77,.208);
    sphere(.064,v.skin,x*2.35,.42,.015).scale.set(.55,1.6,.6);
    sphere(.075,'#3c5267',x,.13,.01).scale.set(.7,1.7,.8);
  }
  const smile=bodyPart(body,new T.TorusGeometry(.037,.007,5,12,Math.PI), '#874e4b',0,.68,.218);smile.rotation.z=Math.PI;
  g.userData.body=body;g.userData.step=Math.random()*8;return g;
}
function setCharacter(v){
  if(!scene)return;
  if(character)scene.remove(character);
  character=makeCharacter(v);scene.add(character);character.position.set(1.35,.07,4.3);
  if(pose!=='walk')setPose(pose);
}
function setPose(next){
  pose=next;poseStarted=performance.now();
  document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',b.dataset.pose===next));
  if(!character){toast('角色姿勢已選好，請在支援 3D 的瀏覽器觀看');return}
  if(next==='sit'){character.position.set(2.48,.52,2.03);character.rotation.y=Math.PI/2}
  if(next==='lie'){character.position.set(4.86,.47,1.7);character.rotation.y=0}
  if(next==='stand'){character.position.set(1.55,.07,5.9);character.rotation.y=0}
  if(next==='walk'){character.position.set(...[routePoints[0][0],.07,routePoints[0][1]]);route=1}
  toast(({walk:'開始在家裡散步',stand:'站在餐廳',sit:'坐在沙發',lie:'躺在主臥床上'})[next]);
}
function animate(now){
  if(!character)return;
  const dt=Math.min(.06,(now-lastFrame)/1000||0);lastFrame=now;
  const b=character.userData.body;
  if(pose==='walk'){
    const [x,z]=routePoints[route],dx=x-character.position.x,dz=z-character.position.z,d=Math.hypot(dx,dz);
    if(d<.08)route=(route+1)%routePoints.length;
    else {const move=Math.min(d,dt*.53);character.position.x+=dx/d*move;character.position.z+=dz/d*move;character.rotation.y=Math.atan2(dx,dz)}
    step+=dt*10;b.position.y=Math.abs(Math.sin(step))*.028;b.rotation.z=Math.sin(step)*.035;b.rotation.x=0;
  }else if(pose==='sit'){
    b.position.y=0;b.rotation.x=-.23;b.rotation.z=0;
  }else if(pose==='lie'){
    b.position.y=0;b.rotation.x=-Math.PI/2;b.rotation.z=0;
  }else{b.position.y=Math.sin(now*.0015)*.008;b.rotation.x=0;b.rotation.z=0}
  for(const [id,item] of characters){
    const t=now*.00015+(item.seed%100);
    item.mesh.position.set(1.5+Math.sin(t)*.37,.07,5.25+Math.cos(t)*.44);
    item.mesh.rotation.y=-t;
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
    const row=document.createElement('div');row.className='task-row';
    const label=document.createElement('span');label.textContent=t.label;
    const button=document.createElement('button');button.textContent=claims[t.id]?`✓ ${claims[t.id].name} 完成`:'完成';
    button.disabled=!!claims[t.id]||(mode==='online'&&!user);
    button.onclick=()=>claimTask(t);
    row.append(label,button);list.append(row);
  }
}
async function claimTask(t){
  if(mode==='preview'){
    const saved=safeRead(claimKey(),{});if(saved[t.id]){claims=saved;renderTasks();toast('今天這項家事已經有人完成');return}
    claims[t.id]={name:avatar.name};localStorage.setItem(claimKey(),JSON.stringify(claims));
    renderTasks();toast('完成！下一個遊戲日再重置');return;
  }
  if(!user)return toast('請先登入家庭帳號');
  const day=today(),ref=api.doc(db,'homes',homeId,'days',String(day),'claims',t.id);
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
  const task={id:'custom-'+Math.random().toString(36).slice(2,10),label};
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
    tasks=snap.exists()?snap.data().items:defaults;renderTasks();
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
