// Deterministic simulation: no DOM, WebGL, account or wall-clock dependencies.
export const DURATION=120;
export const UPGRADES=[
 {id:'power',name:'強力彈簧',detail:'所有武器傷害增加 45%'},
 {id:'rapid',name:'高速齒輪',detail:'攻擊間隔縮短 25%'},
 {id:'repair',name:'修理工具箱',detail:'城堡恢復 45、角色恢復 35 生命'},
 {id:'range',name:'泡泡增幅器',detail:'射程增加 30%，泡泡可以貫穿'},
 {id:'guard',name:'積木護甲',detail:'受到的傷害減少 35%'},
 {id:'speed',name:'滑輪球鞋',detail:'移動加快 25%，閃避冷卻縮短'}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function createBattle(random=Math.random){return {
 random,time:0,status:'playing',phase:1,choiceAt:40,choices:[],upgrades:[],
 hero:{x:0,z:3,hp:100,inv:0,dash:0,dashCD:0,dx:0,dz:-1},
 castle:{x:0,z:0,hp:180},enemies:[],shots:[],effects:[],spawn:1,fire:0,
 weapon:'bubble',damage:1,rate:1,range:1,armor:1,speed:1,pierce:false,
 kills:0,nextId:1,bossSpawned:false,bossDefeated:false,reason:''
};}
export function chooseUpgrade(s,id){
 if(s.status!=='choice'||!s.choices.some(u=>u.id===id))return false;
 if(id==='power')s.damage*=1.45;
 if(id==='rapid')s.rate*=.75;
 if(id==='repair'){s.castle.hp=Math.min(180,s.castle.hp+45);s.hero.hp=Math.min(100,s.hero.hp+35)}
 if(id==='range'){s.range*=1.3;s.pierce=true}
 if(id==='guard')s.armor*=.65;
 if(id==='speed')s.speed*=1.25;
 s.upgrades.push(id);s.choices=[];s.status='playing';return true;
}
function offer(s){
 const pool=[...UPGRADES];s.choices=[];
 while(s.choices.length<3)s.choices.push(pool.splice(Math.floor(s.random()*pool.length),1)[0]);
 s.status='choice';s.choiceAt+=40;s.phase++;s.hero.inv=1.2;
}
function effect(s,x,z,color){if(s.effects.length<24)s.effects.push({x,z,color,life:.3})}
function hitEnemy(s,e,damage){
 e.hp-=damage;e.flash=.12;effect(s,e.x,e.z,'#ffe5a0');
 if(e.hp<=0&&!e.dead){e.dead=true;s.kills++;if(e.kind==='boss')s.bossDefeated=true}
}
export function spawnEnemy(s,kind){
 const side=Math.floor(s.random()*4),offset=(s.random()-.5)*8;
 const x=side===0?-5.5:side===1?5.5:offset,z=side===2?-5.5:side===3?5.5:offset;
 const hp=kind==='boss'?480:kind==='charger'?42:kind==='ranged'?24:28;
 const e={id:s.nextId++,kind,x,z,hp,maxHp:hp,cd:1+s.random(),flash:0,wind:0,charge:0,dx:0,dz:0,dead:false};
 s.enemies.push(e);return e;
}
export function stepBattle(s,input={},dt=1/30){
 if(s.status!=='playing')return;
 dt=clamp(Number.isFinite(dt)?dt:0,0,.1);
 s.time=Math.min(DURATION,s.time+dt);
 const h=s.hero,c=s.castle;
 h.inv=Math.max(0,h.inv-dt);h.dashCD=Math.max(0,h.dashCD-dt);h.dash=Math.max(0,h.dash-dt);
 let mx=Number(input.x)||0,mz=Number(input.z)||0,n=Math.hypot(mx,mz);
 if(n>1){mx/=n;mz/=n}if(n>.05){h.dx=mx/(n>1?1:n);h.dz=mz/(n>1?1:n)}
 if(input.dash&&h.dashCD<=0){h.dash=.22;h.inv=.38;h.dashCD=3.2/s.speed}
 const speed=h.dash>0?10:3.1*s.speed;
 h.x=clamp(h.x+(h.dash>0?h.dx:mx)*speed*dt,-5.1,5.1);
 h.z=clamp(h.z+(h.dash>0?h.dz:mz)*speed*dt,-5.1,5.1);
 if(dist(h,c)<1){const a=Math.atan2(h.z,h.x);h.x=Math.cos(a);h.z=Math.sin(a)}
 s.spawn-=dt;
 if(s.spawn<=0&&s.time<110&&s.enemies.length<8){
  const r=s.random();spawnEnemy(s,s.time<27?'soldier':r<.30?'ranged':r<.57?'charger':'soldier');
  s.spawn=s.time<40?3.8:s.time<80?2.8:3.4;
 }
 if(s.time>=85&&!s.bossSpawned){s.bossSpawned=true;spawnEnemy(s,'boss')}
 s.fire-=dt;
 if(input.attack!==false&&s.fire<=0){
  const target=s.enemies.filter(e=>!e.dead&&dist(e,h)<(s.weapon==='sword'?1.9:5.5*s.range)).sort((a,b)=>dist(a,h)-dist(b,h))[0];
  if(target){
   const d=Math.max(.01,dist(target,h));h.dx=(target.x-h.x)/d;h.dz=(target.z-h.z)/d;
   s.fire=(s.weapon==='sword'?.55:.36)*s.rate;
   if(s.weapon==='sword'){
    effect(s,h.x,h.z,'#81f0db');
    for(const e of s.enemies)if(!e.dead&&dist(e,h)<1.9)hitEnemy(s,e,22*s.damage);
   }else if(s.shots.length<44)s.shots.push({x:h.x,z:h.z,dx:h.dx*10,dz:h.dz*10,life:.7*s.range,enemy:false,damage:13*s.damage,hit:[]});
  }
 }
 for(const e of s.enemies){
  if(e.dead)continue;e.cd-=dt;e.flash=Math.max(0,e.flash-dt);
  const target=dist(e,h)<2.8?h:c,d=Math.max(.01,dist(e,target)),dx=(target.x-e.x)/d,dz=(target.z-e.z)/d;
  if(e.charge>0){e.x=clamp(e.x+e.dx*7*dt,-5.5,5.5);e.z=clamp(e.z+e.dz*7*dt,-5.5,5.5);e.charge-=dt}
  else if(e.wind>0){e.wind-=dt;if(e.wind<=0)e.charge=.6}
  else if((e.kind==='charger'||e.kind==='boss')&&e.cd<=0&&d>1.3){e.wind=.85;e.dx=dx;e.dz=dz;e.cd=e.kind==='boss'?3.5:4.5}
  else if(d>(target===c?1.15:.72)&&!(e.kind==='ranged'&&d<3.7)){
   const v=e.kind==='boss'?.65:e.kind==='charger'?.9:.72;e.x+=dx*v*dt;e.z+=dz*v*dt;
  }
  if(e.kind==='ranged'&&e.cd<=0&&d<5.6&&s.shots.length<44){
   s.shots.push({x:e.x,z:e.z,dx:dx*3,dz:dz*3,life:2,enemy:true,damage:6,hit:[]});e.cd=2.2;
  }
  if(dist(e,h)<(e.kind==='boss'?1:.66)&&h.inv<=0){h.hp-=(e.kind==='boss'?18:8)*s.armor;h.inv=.8;effect(s,h.x,h.z,'#f38778')}
  if(dist(e,c)<(e.kind==='boss'?1.5:1.15)&&e.cd<=0&&e.wind<=0){c.hp-=e.kind==='boss'?16:7;e.cd=1.4;effect(s,0,0,'#f38778')}
 }
 for(const b of s.shots){
  b.x+=b.dx*dt;b.z+=b.dz*dt;b.life-=dt;
  if(b.enemy){
   if(dist(b,h)<.48){if(h.inv<=0){h.hp-=b.damage*s.armor;h.inv=.6}b.life=0}
   else if(dist(b,c)<.85){c.hp-=b.damage;b.life=0}
  }else for(const e of s.enemies){
   if(!e.dead&&!b.hit.includes(e.id)&&dist(b,e)<(e.kind==='boss'?.85:.48)){
    hitEnemy(s,e,b.damage);b.hit.push(e.id);if(!s.pierce){b.life=0;break}
   }
  }
 }
 s.enemies=s.enemies.filter(e=>!e.dead);s.shots=s.shots.filter(b=>b.life>0);
 for(const e of s.effects)e.life-=dt;s.effects=s.effects.filter(e=>e.life>0);
 h.hp=Math.max(0,h.hp);c.hp=Math.max(0,c.hp);
 if(h.hp<=0||c.hp<=0){s.status='lost';s.reason=h.hp<=0?'守衛需要休息了':'城堡被攻破了'}
 else if(s.time>=DURATION){s.status=s.bossDefeated?'won':'lost';s.reason=s.bossDefeated?'守住兩分鐘！':'時間到了，積木恐龍還沒被擊退'}
 else if(s.time>=s.choiceAt&&s.choiceAt<DURATION)offer(s);
}

