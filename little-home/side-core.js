export const LENGTH=100;
export const PLATFORMS=[{x:13,y:1.4,w:4},{x:20,y:2.5,w:4},{x:29,y:1.5,w:5},{x:45,y:1.7,w:5},{x:52,y:2.7,w:4},{x:70,y:1.6,w:5},{x:79,y:2.5,w:4}];
export const WEAPONS={P:{name:'手槍',rate:.25,damage:24,speed:22},H:{name:'重機槍',rate:.085,damage:18,speed:27},F:{name:'火焰槍',rate:.16,damage:20,speed:15},R:{name:'火箭筒',rate:.55,damage:65,speed:14},T:{name:'坦克重砲',rate:.32,damage:45,speed:24}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function pool(n){return Array.from({length:n},()=>({active:false}))}
function put(pool,value){const o=pool.find(o=>!o.active);if(o)Object.assign(o,value,{active:true});return o}
export function createSideGame(){return {status:'playing',time:0,score:0,kills:0,rescues:0,front:0,wave:0,shots:pool(160),enemies:pool(30),effects:pool(32),hero:{x:2,y:0,vy:0,face:1,hp:100,ground:true,crouch:false,weapon:'P',ammo:0,fireAt:0,inv:0,jumpHeld:false,grenadeHeld:false,grenades:6},tank:{x:60,y:0,hp:180,riding:false},boss:{x:94,y:0,hp:1000,maxHp:1000,active:false,attackAt:0,warning:0,pattern:0},crates:[{x:9,y:0,weapon:'H',hp:48},{x:28,y:1.5,weapon:'F',hp:48},{x:42,y:0,weapon:'R',hp:48},{x:68,y:0,weapon:'H',hp:48},{x:86,y:0,weapon:'R',hp:48}],drops:[],hostages:[{x:23,y:2.5,saved:false},{x:49,y:1.7,saved:false},{x:77,y:0,saved:false}],notice:'向右前進 · 擊破補給箱',noticeUntil:5}}
function notice(s,t){s.notice=t;s.noticeUntil=s.time+3}
function effect(s,x,y,r=1){put(s.effects,{x,y,r,life:.35})}
function hurt(s,damage){const h=s.hero;if(s.time<h.inv)return;h.inv=s.time+.9;if(s.tank.riding){s.tank.hp=Math.max(0,s.tank.hp-damage);if(!s.tank.hp){s.tank.riding=false;effect(s,h.x,.7,2);notice(s,'坦克損壞，繼續前進！')}}else h.hp=Math.max(0,h.hp-damage);if(!h.hp)s.status='lost'}
function kill(s,e){if(e.hp>0||!e.active)return;e.active=false;s.kills++;s.score+=100;effect(s,e.x,e.y+.6,.6)}
function blast(s,x,y,damage,r){effect(s,x,y,r);for(const e of s.enemies)if(e.active&&Math.hypot(e.x-x,e.y+.6-y)<r){e.hp-=damage;kill(s,e)}const b=s.boss;if(b.active&&Math.hypot(b.x-x,b.y+1.5-y)<r+1)b.hp-=damage;for(const c of s.crates)if(c.hp>0&&Math.hypot(c.x-x,c.y+.5-y)<r)c.hp-=damage;}
export function toggleSideTank(s){if(s.status!=='playing'||s.tank.hp<=0)return;if(s.tank.riding){s.tank.riding=false;notice(s,'離開坦克')}else if(Math.abs(s.hero.x-s.tank.x)<2&&s.hero.y<.5){s.tank.riding=true;s.hero.y=0;s.hero.vy=0;notice(s,'玩具坦克啟動！')}}
function bullet(s,x,y,vx,vy,damage,kind='P',enemy=false){return put(s.shots,{x,y,oldX:x,oldY:y,vx,vy,damage,kind,enemy,life:kind==='F'?.45:kind==='G'?1.1:3})}
function fire(s,input){const h=s.hero,id=s.tank.riding?'T':h.weapon,w=WEAPONS[id];if(s.time<h.fireAt)return;h.fireAt=s.time+w.rate;const up=input.up&&!h.crouch,dx=up&&!input.x?0:h.face,dy=up?1:0,n=Math.hypot(dx,dy)||1;const y=h.y+(s.tank.riding?1.1:h.crouch?.48:1.1);for(const spread of id==='F'?[-.18,0,.18]:id==='T'?[-.04,.04]:[0]){const a=Math.atan2(dy,dx)+spread;bullet(s,h.x+dx*.45,y,Math.cos(a)*w.speed,Math.sin(a)*w.speed,w.damage,id)}if(!s.tank.riding&&id!=='P'&&--h.ammo<=0){h.weapon='P';h.ammo=0;notice(s,'彈藥用完，切回手槍')}}
function segmentHit(q,x,y,w,h){const minX=x-w/2,maxX=x+w/2,minY=y,maxY=y+h;let lo=0,hi=1;for(const [o,d,a,b] of [[q.oldX,q.x-q.oldX,minX,maxX],[q.oldY,q.y-q.oldY,minY,maxY]]){if(Math.abs(d)<1e-8){if(o<a||o>b)return false;continue}let t=(a-o)/d,u=(b-o)/d;if(t>u)[t,u]=[u,t];lo=Math.max(lo,t);hi=Math.min(hi,u);if(lo>hi)return false}return true}
export function stepSide(s,input,dt){if(s.status!=='playing')return;dt=clamp(dt,0,.04);s.time+=dt;const h=s.hero,t=s.tank,b=s.boss;s.front=Math.max(s.front,h.x);h.crouch=!!input.down&&h.ground&&!t.riding;if(input.x)h.face=Math.sign(input.x);h.x=clamp(h.x+(h.crouch?0:input.x||0)*dt*(t.riding?4.7:5),.6,b.active?90.8:98);
 if(input.jump&&!h.jumpHeld&&h.ground&&!t.riding){h.vy=9;h.ground=false}h.jumpHeld=!!input.jump;const oldY=h.y;h.vy-=18*dt;h.y+=h.vy*dt;h.ground=false;if(h.vy<=0)for(const p of PLATFORMS)if(h.x>p.x-.25&&h.x<p.x+p.w+.25&&oldY>=p.y&&h.y<=p.y){h.y=p.y;h.vy=0;h.ground=true;break}if(h.y<=0||t.riding){h.y=0;h.vy=0;h.ground=true}if(t.riding)t.x=h.x;
 if(input.fire)fire(s,input);if(input.grenade&&!h.grenadeHeld&&h.grenades>0){h.grenades--;bullet(s,h.x,h.y+1,h.face*8,6,95,'G')}h.grenadeHeld=!!input.grenade;
 const triggers=[6,16,26,37,48,58,70,81];if(s.wave<triggers.length&&h.x>triggers[s.wave]){for(let i=0;i<3;i++)put(s.enemies,{x:Math.min(88,h.x+9+i*2),y:0,hp:48+(s.wave>4?24:0),fireAt:s.time+1+i*.4});s.wave++}
 for(const e of s.enemies)if(e.active){const d=h.x-e.x;if(Math.abs(d)>5)e.x+=Math.sign(d)*dt*1.4;if(Math.abs(d)<16&&s.time>e.fireAt){e.fireAt=s.time+1.9;bullet(s,e.x,e.y+.85,Math.sign(d)*7,0,12,'E',true)}if(Math.abs(d)<.6&&Math.abs(h.y-e.y)<1)hurt(s,12)}
 if(h.x>=85&&!b.active){b.active=true;b.attackAt=s.time+2;notice(s,'哥吉拉出現！避開紅色攻擊預警')}
 if(b.active&&b.hp>0){if(s.time>=b.attackAt&&!b.warning){b.warning=s.time+1;b.pattern=(b.pattern+1)%2}if(b.warning&&s.time>=b.warning){b.warning=0;b.attackAt=s.time+3.2;if(b.pattern===0){for(let i=0;i<6;i++)bullet(s,b.x-1,1.0+i*.12,-9-i*.3,0,18,'E',true)}else{bullet(s,b.x-1,.2,-8,0,20,'W',true);bullet(s,b.x-1,3,-6,-2,16,'E',true)}}}
 for(const q of s.shots){if(!q.active)continue;q.oldX=q.x;q.oldY=q.y;if(q.kind==='G')q.vy-=14*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;
  if(q.life<=0||q.y<0){q.active=false;if(q.kind==='G'||q.kind==='R')blast(s,q.x,Math.max(.2,q.y),q.damage,2.4);continue}
  if(q.enemy){if(segmentHit(q,h.x,h.y,t.riding?1.6:.65,t.riding?1.4:h.crouch?.6:1.55)){hurt(s,q.damage);q.active=false}continue}
  if(q.kind==='G')continue;let hit=false;for(const e of s.enemies)if(e.active&&segmentHit(q,e.x,e.y,.8,1.5)){e.hp-=q.damage;kill(s,e);hit=true;break}
  if(!hit&&b.active&&b.hp>0&&segmentHit(q,b.x,0,2.5,3.8)){b.hp-=q.damage;hit=true}
  if(!hit)for(const c of s.crates)if(c.hp>0&&segmentHit(q,c.x,c.y,.9,1.3)){c.hp-=q.damage;hit=true;break}
  if(hit){q.active=false;if(q.kind==='R')blast(s,q.x,q.y,q.damage*.5,2);else effect(s,q.x,q.y,.25)}
 }
 for(const c of s.crates)if(c.hp<=0&&!c.opened){c.opened=true;s.drops.push({x:c.x,y:c.y,weapon:c.weapon});effect(s,c.x,c.y+.4,.8)}
 s.drops=s.drops.filter(d=>{if(Math.abs(h.x-d.x)<1&&Math.abs(h.y-d.y)<1.5){h.weapon=d.weapon;h.ammo=d.weapon==='R'?15:80;notice(s,WEAPONS[d.weapon].name+' 補給！');return false}return true});
 for(const p of s.hostages)if(!p.saved&&Math.abs(p.x-h.x)<1&&Math.abs(p.y-h.y)<1){p.saved=true;s.rescues++;s.score+=500;h.grenades=Math.min(12,h.grenades+2);h.hp=Math.min(100,h.hp+20);s.drops.push({x:p.x+.5,y:p.y,weapon:'H'});notice(s,'救援成功！＋500 分、補給與手榴彈')}
 for(const e of s.effects)if(e.active){e.life-=dt;if(e.life<=0)e.active=false}
 if(b.active&&b.hp<=0&&s.status==='playing'){b.hp=0;s.status='won';s.score+=2000;effect(s,b.x,1.6,4)}
}
