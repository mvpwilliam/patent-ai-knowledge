// Deterministic simulation; X/Z floor coordinates, independent of Three.js and DOM.
export const DURATION=120;
export const COVER=[{x:-4,z:-2,w:1.4,d:3.6},{x:3.8,z:2.6,w:2.4,d:1.2}];
export const WEAPONS={P:{name:'手槍',rate:.28,damage:16,speed:15,ammo:0},H:{name:'重機槍',rate:.09,damage:13,speed:18,ammo:90},F:{name:'火焰散彈',rate:.38,damage:18,speed:12,ammo:30},R:{name:'爆破火箭',rate:.65,damage:65,speed:10,ammo:15},T:{name:'雙管重砲',rate:.3,damage:25,speed:16,ammo:0}};
const pool=n=>Array.from({length:n},()=>({active:false}));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function blocked(x,z,r=.25){return Math.abs(x)>5.7-r||Math.abs(z)>5.7-r||COVER.some(o=>Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r)}
function move(o,x,z,r){if(!blocked(o.x+x,o.z,r))o.x+=x;if(!blocked(o.x,o.z+z,r))o.z+=z}
export function createShooter(){return {status:'intro',time:0,score:0,kills:0,rescues:0,fire:0,spawn:1,dropAt:16,seq:0,notice:'靠近黃色人質救援；拾取 H / F / R 武器箱',noticeUntil:5,hero:{x:0,z:3,hp:100,inv:0,angle:Math.PI,weapon:'P',ammo:0},tank:{x:4.5,z:-3.8,hp:160,riding:false},boss:{active:false,dead:false,x:0,z:-1.7,hp:900,max:900,phase:'idle',timer:3,attack:0,angle:0},hostages:[{x:-5,z:4.6,saved:false},{x:4.8,z:4.7,saved:false}],crates:[{x:-1.8,z:-3.8,hp:30,kind:'H'},{x:2.1,z:.5,hp:30,kind:'F'},{x:3.5,z:-4.5,hp:30,kind:'R'}],enemies:pool(24),bullets:pool(160),pickups:pool(12),effects:pool(24)} }
function notice(s,text){s.notice=text;s.noticeUntil=s.time+3}
function effect(s,x,z,r=1){const e=s.effects.find(o=>!o.active);if(e)Object.assign(e,{active:true,x,z,r,life:.3})}
function drop(s,x,z,kind){const p=s.pickups.find(o=>!o.active);if(p)Object.assign(p,{active:true,x,z,kind})}
export function equip(s,kind){s.hero.weapon=kind;s.hero.ammo=WEAPONS[kind].ammo;notice(s,`${kind} · ${WEAPONS[kind].name}`)}
export function toggleTank(s){if(s.status!=='playing'||s.tank.hp<=0)return false;const h=s.hero,t=s.tank;if(t.riding){for(const [x,z] of [[.9,0],[-.9,0],[0,.9],[0,-.9]])if(!blocked(t.x+x,t.z+z,.25)){t.riding=false;h.x=t.x+x;h.z=t.z+z;h.inv=1;return true}return false}if(dist(h,t)<1.5){t.riding=true;h.x=t.x;h.z=t.z;notice(s,'坦克啟動！再次按 E 或下車按鈕離開');return true}return false}
function hurt(s,damage){const h=s.hero;if(h.inv>0)return;h.inv=.75;if(s.tank.riding){s.tank.hp=Math.max(0,s.tank.hp-damage);if(!s.tank.hp){s.tank.riding=false;h.inv=2;notice(s,'坦克損壞！已安全彈出')}}else h.hp=Math.max(0,h.hp-damage);if(!h.hp)s.status='lost'}
function kill(s,e){e.active=false;s.kills++;s.score+=100;effect(s,e.x,e.z,.7);if(s.kills%7===0)drop(s,e.x,e.z,['H','F','R'][s.kills/7%3|0])}
function damageEnemy(s,e,d){e.hp-=d;if(e.hp<=0)kill(s,e)}
function hitBoss(s,d){const b=s.boss;b.hp=Math.max(0,b.hp-d);if(!b.hp){b.active=false;b.dead=true;s.score+=2000;s.status='won';effect(s,b.x,b.z,3)}}
function blast(s,b){effect(s,b.x,b.z,1.7);for(const e of s.enemies)if(e.active&&dist(e,b)<1.7)damageEnemy(s,e,b.damage);if(s.boss.active&&dist(s.boss,b)<2.5)hitBoss(s,b.damage)}
function shot(s,x,z,a,kind,enemy=false){const b=s.bullets.find(o=>!o.active);if(!b)return;const w=WEAPONS[kind]||WEAPONS.P;Object.assign(b,{active:true,x,z,dx:Math.sin(a),dz:Math.cos(a),speed:enemy?4.5:w.speed,life:kind==='F'?.3:2,damage:enemy?12:w.damage,kind,enemy})}
export function stepShooter(s,input={},dt=1/60){if(s.status!=='playing')return;dt=Math.min(.04,Math.max(0,dt));s.time+=dt;const h=s.hero,b=s.boss,t=s.tank;h.inv=Math.max(0,h.inv-dt);s.fire-=dt;
 const mx=input.x||0,mz=input.z||0,n=Math.max(1,Math.hypot(mx,mz)),speed=t.riding?2.3:3.3;move(h,mx/n*speed*dt,mz/n*speed*dt,t.riding?.52:.25);if(t.riding){t.x=h.x;t.z=h.z}
 if(Number.isFinite(input.angle))h.angle=input.angle;
 if(input.auto){let near=null,d=Infinity;for(const e of s.enemies)if(e.active&&dist(h,e)<d){near=e;d=dist(h,e)}if(b.active&&dist(h,b)<d)near=b;if(near)h.angle=Math.atan2(near.x-h.x,near.z-h.z)}
 if(input.fire&&s.fire<=0){const kind=t.riding?'T':h.weapon,w=WEAPONS[kind];s.fire=w.rate;if(kind==='F'){for(const a of [-.25,0,.25])shot(s,h.x,h.z,h.angle+a,kind)}else if(kind==='T'){for(const offset of [-.22,.22])shot(s,h.x+Math.cos(h.angle)*offset,h.z-Math.sin(h.angle)*offset,h.angle,kind)}else shot(s,h.x,h.z,h.angle,kind);if(!t.riding&&kind!=='P'&&--h.ammo<=0){h.weapon='P';h.ammo=0;notice(s,'彈藥用盡，切回手槍')}}
 for(const p of s.pickups)if(p.active&&dist(h,p)<.8){equip(s,p.kind);p.active=false}
 for(const p of s.hostages)if(!p.saved&&dist(h,p)<.85){p.saved=true;s.rescues++;s.score+=500;drop(s,p.x,p.z,'H');notice(s,'救援成功！＋500 分、H 武器箱')}
 if(s.time>s.dropAt){drop(s,0,2,['H','F','R'][s.seq%3]);s.dropAt+=22}
 s.spawn-=dt;if(s.spawn<=0&&s.time<100){s.spawn=s.time<35?2.1:1.4;const e=s.enemies.find(o=>!o.active);if(e){const side=s.seq++%4;Object.assign(e,{active:true,x:[-5,5,2,-2][side],z:[-4,-4,5,-5][side],hp:32+(s.time>50?16:0),ranged:s.seq%3===0,fire:1.5})}}
 for(const e of s.enemies)if(e.active){const d=dist(h,e),a=Math.atan2(h.x-e.x,h.z-e.z);e.angle=a;if(d>(e.ranged?3:.6)){const oldX=e.x,oldZ=e.z;move(e,Math.sin(a)*dt*1.05,Math.cos(a)*dt*1.05,.23);if(Math.hypot(e.x-oldX,e.z-oldZ)<dt*.15)move(e,Math.cos(a)*dt*1.05,-Math.sin(a)*dt*1.05,.23)}if(d<.65)hurt(s,9);e.fire-=dt;if(e.ranged&&e.fire<=0){shot(s,e.x,e.z,a,'P',true);e.fire=2.2}}
 if(s.time>=65&&!b.active&&!b.dead){b.active=true;notice(s,'哥吉拉出現！紅色是攻擊預告，移開再反擊')}
 if(b.active){b.timer-=dt;if(b.timer<=0){if(b.phase==='idle'){b.phase='warn';b.attack=(b.attack+1)%2;b.angle=Math.atan2(h.x-b.x,h.z-b.z);b.timer=1.35}else if(b.phase==='warn'){b.phase='hit';b.timer=.65;if(!b.attack&&dist(h,b)<3)hurt(s,28)}else{b.phase='idle';b.timer=2.7}}if(b.phase==='hit'&&b.attack){const dx=h.x-b.x,dz=h.z-b.z,along=dx*Math.sin(b.angle)+dz*Math.cos(b.angle),across=Math.abs(dx*Math.cos(b.angle)-dz*Math.sin(b.angle));if(along>0&&along<12&&across<.5)hurt(s,24)}}
 for(const q of s.bullets)if(q.active){q.life-=dt;q.x+=q.dx*q.speed*dt;q.z+=q.dz*q.speed*dt;if(q.life<=0||blocked(q.x,q.z,.04)){q.active=false;continue}if(q.enemy){if(dist(h,q)<(t.riding?.6:.38)){hurt(s,q.damage);q.active=false}continue}let hit=false;for(const c of s.crates)if(c.hp>0&&dist(c,q)<.48){c.hp-=q.damage;if(c.hp<=0)drop(s,c.x,c.z,c.kind);hit=true;break}if(!hit)for(const e of s.enemies)if(e.active&&dist(e,q)<.45){if(q.kind!=='R')damageEnemy(s,e,q.damage);hit=true;break}if(!hit&&b.active&&dist(b,q)<1){if(q.kind!=='R')hitBoss(s,q.damage);hit=true}if(hit){if(q.kind==='R')blast(s,q);else effect(s,q.x,q.z,.3);q.active=false}}
 for(const e of s.effects)if(e.active){e.life-=dt;if(e.life<=0)e.active=false}
 if(s.time>=DURATION&&s.status==='playing')s.status=b.dead?'won':'lost';
}
export function rewardCoins(s){return s.status==='won'?30+Math.min(20,Math.floor(s.score/500)):0}
