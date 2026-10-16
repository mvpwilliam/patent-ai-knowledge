export const CROPS={radish:{name:'小蘿蔔',minutes:15,yield:3,color:'#b6cd85'},tomato:{name:'番茄',minutes:15,yield:3,color:'#cb6853'},pumpkin:{name:'南瓜',minutes:15,yield:3,color:'#dea342'}};
export const LINES={radish:['小雞','蘿蔔芽雞','蘿蔔角雞','蘿蔔幼龍','蘿蔔翼龍','疾風蘿蔔龍'],tomato:['小雞','番茄冠雞','番茄火尾雞','番茄幼龍','番茄焰龍','熔焰番茄龍'],pumpkin:['小雞','南瓜殼雞','南瓜甲雞','南瓜幼甲獸','南瓜重甲獸','岩甲南瓜獸'],mixed:['小雞','三蔬彩雞','三蔬羽獸','三蔬靈獸','三蔬守護獸','三蔬彩羽獸']};
export const AWARDS=[{id:'sow',name:'都是我在種',key:'sow',goal:30},{id:'water',name:'都是我在澆',key:'water',goal:30},{id:'harvest',name:'都是我在收',key:'harvest',goal:30},{id:'feed',name:'都是我在餵',key:'feed',goal:30},{id:'grown',name:'我養大的',key:'grown',goal:1}];
export const dayKey=now=>new Date(now+8*3600000).toISOString().slice(0,10);
export const FEED_COST=3,FEED_INTERVAL=15*60000;
export const stage=pet=>Math.max(0,Math.min(5,Math.floor((pet?.feeds.length||0)/3))-(pet?.pendingEvolution?1:0));
export const species=pet=>LINES[pet?.line||'mixed'][stage(pet)];
export function newFarm(){return {version:1,plots:Array.from({length:12},(_,id)=>({id,plantId:null,cycle:'',plantedAt:0,wateredAt:0,readyAt:0})),seeds:{radish:12,tomato:12,pumpkin:12},stock:{radish:0,tomato:0,pumpkin:0},harvests:0,members:{},log:[],applied:[]}}
export const slots=f=>f.harvests>=90?12:f.harvests>=30?9:6;
export const plotState=(p,now)=>!p.plantId?'EMPTY':!p.wateredAt?'PLANTED':now>=p.readyAt?'READY':'GROWING';
export function member(f,uid,name){return f.members[uid]||(f.members[uid]={name:name||'家人',counts:{sow:0,water:0,harvest:0,feed:0,grown:0},pets:[],activeId:null,homeId:null,feedDay:'',fedToday:0,awards:[]})}
export function newPet(id){return {id,name:'小雞',named:false,line:'mixed',feeds:[],history:[],createdAt:0}}
// Migrate legacy digestion records immediately; new evolutions happen on the third feed.
export function settleEvolutions(f,now){
 for(const m of Object.values(f.members)){
  for(const pet of m.pets){const pending=pet.pendingEvolution;if(!pending)continue;
   pet.line=pending.line;pet.history.push(pending.line);delete pet.pendingEvolution;
   if(!pet.named)pet.name=species(pet);if(stage(pet)===5)m.counts.grown++;
  }
  for(const award of AWARDS)if(m.counts[award.key]>=award.goal&&!m.awards.includes(award.id))m.awards.push(award.id);
 }
 return f;
}
// Cap legacy crop deadlines using their original watering time; never delay a ripe crop.
const cropDeadline=p=>p.plantId&&CROPS[p.plantId]&&p.wateredAt>0?Math.min(p.readyAt||Infinity,p.wateredAt+CROPS[p.plantId].minutes*60000):p.readyAt;
export function normalizeCropTimers(f){for(const p of f.plots)p.readyAt=cropDeadline(p);return f}
export function displayFarm(f,now){
 const due=Object.values(f.members).some(m=>m.pets.some(p=>p.pendingEvolution));
 return due||f.plots.some(p=>p.readyAt!==cropDeadline(p))?settleEvolutions(normalizeCropTimers(structuredClone(f)),now):f;
}
function check(ok,text){if(!ok)throw new Error(text)}
function currentPet(m,id){const pet=m.pets.find(p=>p.id===id);check(pet,'找不到這隻夥伴');return pet}
// Execute inside the household's Firestore transaction. A cycle token protects stale dialogs.
export function farmAction(f,uid,name,a,now){
 check(Number.isFinite(now),'時間讀取失敗');if(f.applied.includes(a.id))return {duplicate:true};
 normalizeCropTimers(f);settleEvolutions(f,now);
 const m=member(f,uid,name);m.name=String(name||m.name).slice(0,12);let message='',evolution=null;
 if(['sow','water','harvest'].includes(a.type)){
  const p=f.plots[a.plot];check(p&&a.plot<slots(f),'這塊土地尚未開放');check(p.cycle===a.cycle,'這塊土地已被家人更新，請重新打開');const status=plotState(p,now);
  if(a.type==='sow'){check(status==='EMPTY','這格已經種植了');check(CROPS[a.crop]&&f.seeds[a.crop]>0,'種子不足');f.seeds[a.crop]--;Object.assign(p,{plantId:a.crop,cycle:a.id,plantedAt:now,wateredAt:0,readyAt:0});m.counts.sow++;message='播種了'+CROPS[a.crop].name}
  if(a.type==='water'){check(status==='PLANTED','這株已澆過水，不需要重複澆水');p.wateredAt=now;p.readyAt=now+CROPS[p.plantId].minutes*60000;m.counts.water++;message='澆好了'+CROPS[p.plantId].name}
  if(a.type==='harvest'){check(status==='READY','作物還沒成熟，請稍候');const crop=CROPS[p.plantId];f.stock[p.plantId]+=crop.yield;f.seeds[p.plantId]++;f.harvests++;m.counts.harvest++;message=`採收${crop.name} × ${crop.yield}，已放入家庭倉庫`;Object.assign(p,{plantId:null,cycle:a.id,plantedAt:0,wateredAt:0,readyAt:0})}
 }else if(a.type==='adopt'){
  check(!m.activeId||stage(currentPet(m,m.activeId))===5,'先把目前的小雞養成，再領取下一隻');check(m.pets.length<24,'收藏牧場已達 24 隻');const pet=newPet(a.id);pet.createdAt=now;m.pets.push(pet);m.activeId=pet.id;message='領養了一隻小雞';
 }else if(a.type==='feed'){
  const pet=currentPet(m,a.pet);check(pet.id===m.activeId&&stage(pet)<5,'這隻已完成養成');check(pet.feeds.length===a.expectedFeeds,'夥伴已經被餵食，請更新畫面');check(now>=(m.feedReadyAt||0),'兩次餵食需間隔 15 分鐘');check(CROPS[a.crop]&&f.stock[a.crop]>=FEED_COST,'家庭倉庫至少需要 3 個同種作物');const day=dayKey(now);check(!m.feedDay||day>=m.feedDay,'日期異常，請確認裝置時間');if(m.feedDay!==day){m.feedDay=day;m.fedToday=0}check(m.fedToday<3,'今天已餵食 3 次，明天再來');
  f.stock[a.crop]-=FEED_COST;m.feedReadyAt=now+FEED_INTERVAL;m.fedToday++;m.counts.feed++;pet.feeds.push(a.crop);message=`餵了${CROPS[a.crop].name} × ${FEED_COST}，15 分鐘後可再次餵食`;
  if(pet.feeds.length%3===0){const block=pet.feeds.slice(-3),line=Object.keys(CROPS).find(k=>block.filter(v=>v===k).length>=2)||'mixed';pet.line=line;pet.history.push(line);if(!pet.named)pet.name=species(pet);if(stage(pet)===5)m.counts.grown++;evolution=structuredClone(pet);message=`進化完成！${pet.name} · 進化 ${stage(pet)}/5`}
 }else if(a.type==='rename'){const pet=currentPet(m,a.pet);const n=String(a.name||'').trim();check(n.length>0&&n.length<=12,'名字請輸入 1–12 個字');pet.name=n;pet.named=true;message='替夥伴取名為'+n}
 else if(a.type==='home'){const pet=currentPet(m,a.pet);check(stage(pet)===5,'最終進化後才能帶回小屋');m.homeId=a.pet;message=`帶${pet.name}回小屋放養`}
 else if(a.type==='return'){m.homeId=null;message='夥伴回到農場'}
 else if(a.type==='shirt'){check(!a.award||m.awards.includes(a.award),'這件紀念 T-shirt 尚未解鎖');message=a.award?'穿上紀念 T-shirt':'換回原本的上衣圖案'}
 else throw new Error('未知的農場操作');
 for(const award of AWARDS)if(m.counts[award.key]>=award.goal&&!m.awards.includes(award.id))m.awards.push(award.id);
 f.applied=[a.id,...f.applied].slice(0,160);f.log=[{id:a.id,name:m.name,text:message,at:now},...f.log].slice(0,20);return {message,evolution,shirt:a.type==='shirt'?a.award:undefined};
}



