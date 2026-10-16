import {installFarm} from './farm-ui.js?v=roam-12';
import {installLivingShooter} from './living-shooter.js?v=shooter-1';
import * as T from './vendor/three.module.js';
import {createBattle,stepBattle,chooseUpgrade,DURATION} from './toy-defense-core.js?v=games2-1';

export function installToyDefense({canStart,makeHero,onWin,farmOptions}){
 const world=document.querySelector('#world'),canvas=document.querySelector('#scene');
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./toy-defense.css?v=toy3-1',import.meta.url);document.head.append(css);
 const entry=document.createElement('button');entry.type='button';entry.title='遊戲區';entry.setAttribute('aria-label',entry.title);
 entry.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 4h4v4h3V4h3v4h3V4h3v16H4zM10 20v-6h4v6"/></svg>';
 document.querySelector('.scene-menu-options').append(entry);
 const games=document.createElement('dialog');games.className='game-dialog compact-dialog';games.setAttribute('aria-label','遊戲區');
 games.innerHTML="<div class=\"dialog-head\"><h2>遊戲區</h2><button aria-label=\"關閉遊戲區\">×</button></div><div class=\"game-dialog-body\" style=\"display:grid;gap:14px\"><button id=\"start-defense\" style=\"box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:9px;width:100%;height:56px;min-height:56px;padding:0 14px;border:0;border-radius:14px;font:inherit;font-size:16px;line-height:1.3;text-align:center;text-decoration:none;background:#405f50;color:#fff\"><span aria-hidden=\"true\">🏰</span><span>城堡保衛戰</span></button><a href=\"./escape.html\" style=\"box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:9px;width:100%;height:56px;min-height:56px;padding:0 14px;border:0;border-radius:14px;font:inherit;font-size:16px;line-height:1.3;text-align:center;text-decoration:none;background:#e8eddf;color:#3d5949\"><svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"flex-shrink:0\"><path d=\"M5 21V3h14v18M3 21h18M8 21V6h8v15\"/><rect x=\"10\" y=\"12\" width=\"4\" height=\"4\" rx=\"1\"/><path d=\"M11 12v-1a1 1 0 0 1 2 0v1\"/></svg><span>小屋密室 · 畫面之外</span></a></div>";
 document.body.append(games);games.querySelector('.dialog-head button').onclick=()=>games.close();games.querySelector('#start-defense').onclick=()=>{games.close();open()};
 const ui=document.createElement('section');ui.id='toy-defense';ui.hidden=true;ui.setAttribute('aria-label','玩具保衛戰');
 ui.innerHTML=`<div class="td-hud"><div><small>TOY DEFENSE / 120 SEC</small><strong id="td-wave">客廳保衛戰</strong></div><strong id="td-clock">2:00</strong><button id="td-pause" aria-label="暫停戰鬥">Ⅱ</button></div>
 <div class="td-bars"><label>城堡 <progress id="td-castle" max="180" value="180"></progress><b id="td-castle-num">180</b></label><label>守衛 <progress id="td-hero" max="100" value="100"></progress><b id="td-hero-num">100</b></label><label id="td-boss-row" hidden>恐龍 <progress id="td-boss" max="480" value="480"></progress></label></div>
 <p id="td-notice" role="status">守住城堡，擊退積木恐龍</p>
 <div class="td-controls"><div id="td-stick" role="group" aria-label="拖曳移動角色"><span></span><small>移動</small></div><div class="td-actions"><button id="td-weapon">🫧<small>泡泡槍／切換</small></button><button id="td-dash">➜<small>閃避</small></button></div></div>
 <div id="td-shade"><section class="td-card" role="dialog" aria-modal="true" aria-labelledby="td-title" tabindex="-1"><small class="td-kicker">LITTLE HOME · 玩具時刻</small><h2 id="td-title"></h2><div id="td-content"></div><div id="td-buttons"></div></section></div>`;
 world.append(ui);
 const $=id=>ui.querySelector('#'+id);
 let state=null,scene=null,camera=null,hero=null,castle=null,active=false,last=0,runId='',resultShown=false,saving=false,saved=false,previousMode='',quitPending=false;
 let oldClear,oldAlpha,geometries=[],materials=[],visuals=new Map(),shotViews=[],effectViews=[],stickPointer=null,stick={x:0,z:0},dash=false,keys=new Set();
 const matCache=new Map(),geoCache=new Map();
 const material=color=>{if(!matCache.has(color)){const m=new T.MeshLambertMaterial({color});materials.push(m);matCache.set(color,m)}return matCache.get(color)};
 function box(parent,w,h,d,color,x=0,y=h/2,z=0){const key=[w,h,d].join('/');if(!geoCache.has(key)){const geo=new T.BoxGeometry(w,h,d);geometries.push(geo);geoCache.set(key,geo)}const mesh=new T.Mesh(geoCache.get(key),material(color));mesh.position.set(x,y,z);parent.add(mesh);return mesh}
 function toy(kind){
  const g=new T.Group(),boss=kind==='boss',color=boss?'#789970':kind==='ranged'?'#ae8cc1':kind==='charger'?'#e9a35e':'#cf6b61';
  if(boss){box(g,1.1,.7,1.3,color,0,.7);box(g,.85,.65,.85,color,0,1.25,.55);box(g,.65,.3,.8,'#e5d59e',0,1.05,.98);box(g,.35,.3,1.2,color,0,.65,-1);for(const x of [-.42,.42])box(g,.36,.5,.5,color,x,.25);for(const z of [-.5,-.1,.3])box(g,.22,.24,.2,'#f1d386',0,1.13,z)}
  else{box(g,.52,.45,.38,color,0,.6);box(g,.42,.32,.38,'#ead6b1',0,.99);box(g,.55,.14,.48,color,0,1.18);for(const x of [-.17,.17])box(g,.17,.32,.22,'#54656b',x,.22);for(const x of [-.35,.35])box(g,.16,.38,.18,color,x,.62);if(kind==='ranged')box(g,.16,.16,.65,'#6c5a88',.35,.65,.3)}
  for(const x of [-.13,.13])box(g,.07,.07,.025,'#273c3a',x,boss?1.38:1.02,boss?.986:.205);
  return g;
 }
 function build(){
  scene=new T.Scene();scene.background=new T.Color('#e7e4d9');camera=new T.OrthographicCamera(-8,8,8,-8,.1,80);camera.position.set(0,17,11);camera.lookAt(0,0,0);
  scene.add(new T.HemisphereLight(0xffffff,0x78846f,2));const sun=new T.DirectionalLight(0xffeed9,2.1);sun.position.set(-4,12,5);scene.add(sun);
  box(scene,16,.2,16,'#c7b69a',0,-.25);box(scene,11.9,.08,11.9,'#8caaa0',0,-.09);box(scene,11.3,.03,11.3,'#adc0b1',0,-.035);
  for(let i=-5;i<=5;i++){box(scene,.025,.012,11.3,'#a1b8a7',i,0);box(scene,11.3,.012,.025,'#a1b8a7',0,0,i)}
  // Furniture sits outside the bounded miniature rug: no pathfinding traps.
  box(scene,7,1.3,1.4,'#dfddd2',0,.65,-6.8);box(scene,7,.7,.35,'#eeece5',0,1.5,-7.3);
  for(const x of [-2.3,0,2.3])box(scene,2.15,.25,1.15,'#efede3',x,1.4,-6.7);
  box(scene,1.1,1,5,'#667972',-7,.5,0);box(scene,.18,2.2,3.1,'#344541',-7,2,0);
  for(const [x,z,c] of [[5.9,4,'#e6bf77'],[-5.9,4.6,'#8da4c7'],[4.4,-5.9,'#d78172']])box(scene,.55,.3,.55,c,x,.15,z);
  castle=new T.Group();scene.add(castle);box(castle,1.4,.8,1.3,'#dbb66e');box(castle,.4,.5,.12,'#735f4c',0,.25,.67);
  for(const x of [-.6,.6])for(const z of [-.55,.55]){box(castle,.4,1.2,.4,'#e9cf93',x,.6,z);box(castle,.5,.18,.5,'#ce705c',x,1.25,z)}
  box(castle,.05,.7,.05,'#715c47',0,1.3);box(castle,.45,.26,.04,'#5b9c93',.2,1.5);
  const actor=makeHero?.()||toy('soldier');actor.scale.multiplyScalar(.8);hero=new T.Group();hero.add(actor);hero.userData.actor=actor;scene.add(hero);
  const gun=new T.Group();box(gun,.16,.18,.43,'#80c9c4',.4,.68,.3);box(gun,.11,.11,.14,'#e4c77b',.4,.68,.58);hero.add(gun);hero.userData.gun=gun;
  const sword=new T.Group();box(sword,.12,.7,.08,'#e9dbab',.4,.95,.27);box(sword,.32,.07,.12,'#b98c56',.4,.63,.27);hero.add(sword);hero.userData.sword=sword;
 }
 function modal(title,content,buttons){
  $('td-shade').hidden=false;$('td-title').textContent=title;$('td-content').replaceChildren();
  if(typeof content==='string'){const p=document.createElement('p');p.textContent=content;$('td-content').append(p)}else $('td-content').append(content);
  $('td-buttons').replaceChildren();for(const [label,fn,primary] of buttons){const b=document.createElement('button');b.textContent=label;if(primary)b.className='td-primary';b.onclick=fn;$('td-buttons').append(b)}
  ui.querySelector('.td-card').focus();clearInput();
 }
 function clearInput(){keys.clear();stick={x:0,z:0};stickPointer=null;dash=false;$('td-stick').querySelector('span').style.transform='translate(0,0)'}
 function open(){
  if(active)return;if(!canStart())return;
  try{build()}catch(e){dispose();window.homeGameFeedback?.('戰場載入失敗，請重新整理後再試');return}
  active=true;state=createBattle();runId=crypto.randomUUID();last=0;resultShown=false;saved=false;quitPending=false;
  $('td-weapon').innerHTML='🫧<small>泡泡槍／切換</small>';
  const renderer=window.homeScene.renderer;oldClear=renderer.getClearColor(new T.Color());oldAlpha=renderer.getClearAlpha();
  ui.hidden=false;world.classList.add('td-active');
  const menu=document.querySelector('#scene-game-panel');menu.hidden=true;document.querySelector('#scene-menu-toggle').setAttribute('aria-expanded','false');
  state.status='intro';
  modal('玩具保衛戰','兩分鐘守住城堡，並擊退最後的積木恐龍。自動瞄準攻擊，手機拖曳左下搖桿走位。電腦用 WASD／方向鍵移動、空白鍵閃避、K 切換武器。第 40、80 秒暫停選能力，切到背景也會暫停。',[
   ['開始守護 · 2:00',()=>{state.status='playing';$('td-shade').hidden=true;last=0},true],['回到小屋',close]
  ]);
 }
 function dispose(){hero?.userData.disposeCostume?.();hero?.traverse(n=>{n.geometry?.dispose();if(n.material){for(const m of Array.isArray(n.material)?n.material:[n.material])m.dispose()}});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();geometries=[];materials=[];matCache.clear();geoCache.clear();visuals.clear();shotViews=[];effectViews=[];scene=null;hero=null;castle=null}
 function close(){if(saving)return;active=false;ui.hidden=true;world.classList.remove('td-active');clearInput();if(oldClear)window.homeScene.renderer.setClearColor(oldClear,oldAlpha);dispose();state=null;entry.focus()}
 function resume(){state.status=previousMode||'playing';quitPending=false;last=0;if(state.status==='choice')showChoice();else $('td-shade').hidden=true}
 function pause(){if(!active||!['playing','choice'].includes(state.status))return;previousMode=state.status;state.status='paused';modal('休息一下','倒數已暫停。', [['繼續保衛戰',resume,true],['結束這一局',confirmQuit]])}
 function confirmQuit(){quitPending=true;modal('離開這一局？','這局進度不保留，未通關不會獲得獎勵。',[['繼續遊玩',resume,true],['離開戰場',close]])}
 function showChoice(){
  const list=document.createElement('div');list.className='td-choices';
  for(const u of state.choices){const b=document.createElement('button'),name=document.createElement('strong'),detail=document.createElement('small');name.textContent=u.name;detail.textContent=u.detail;b.append(name,detail);b.onclick=()=>{chooseUpgrade(state,u.id);$('td-shade').hidden=true;last=0};list.append(b)}
  modal('選一個玩具升級',list,[]);
 }
 async function claim(){
  if(saving||saved)return;saving=true;
  modal('正在保存戰利品','請稍候，正在寫入你的角色資料。',[]);
  try{const text=await onWin(runId);saved=true;modal('城堡守住了！',text,[['回家擺放獎盃',close,true]])}
  catch(e){modal('勝利！獎勵尚未保存',e.message||'連線暫時失敗，可重試領取。',[['重試保存',claim,true],['放棄獎勵並回家',()=>{modal('放棄這次獎勵？','離開後無法重新領取這局獎勵。',[['繼續領取',claim,true],['確定離開',close]])}]])}
  finally{saving=false}
 }
 function finish(){
  resultShown=true;clearInput();
  if(state.status==='won')modal('兩分鐘，守護成功！',`擊退 ${state.kills} 隻玩具怪。獲得 30 幣、20 EXP；首次勝利獲得積木恐龍獎盃。`,[['領取戰利品',claim,true]]);
  else modal('再挑戰一次',`${state.reason}。本局擊退 ${state.kills} 隻玩具怪，撐了 ${Math.floor(state.time)} 秒。`,[['再玩兩分鐘',()=>{for(const g of visuals.values())scene.remove(g);visuals.clear();state=createBattle();runId=crypto.randomUUID();resultShown=false;saved=false;last=0;$('td-weapon').innerHTML='🫧<small>泡泡槍／切換</small>';$('td-shade').hidden=true},true],['回到小屋',close]]);
 }
 function sync(){
  hero.position.set(state.hero.x,0,state.hero.z);hero.rotation.y=Math.atan2(state.hero.dx,state.hero.dz);hero.visible=state.hero.inv<=0||Math.floor(state.time*14)%2===0;
  hero.userData.gun.visible=state.weapon==='bubble';hero.userData.sword.visible=state.weapon==='sword';hero.userData.sword.rotation.x=state.weapon==='sword'&&state.fire>.3?-.7:0;
  const moving=keys.size>0||Math.hypot(stick.x,stick.z)>.05;const legs=hero.userData.actor.userData.legs||[];legs.forEach((leg,i)=>{leg.rotation.x=moving&&state.status==='playing'?Math.sin(state.time*13+i*Math.PI)*.45:0});
  castle.scale.y=.99+Math.sin(state.time*2)*.01;
  const ids=new Set(state.enemies.map(e=>e.id));for(const [id,g] of visuals)if(!ids.has(id)){scene.remove(g);visuals.delete(id)}
  for(const e of state.enemies){let g=visuals.get(e.id);if(!g){g=toy(e.kind);visuals.set(e.id,g);scene.add(g)}g.position.set(e.x,e.flash>0?.12:0,e.z);g.rotation.y=Math.atan2(e.dx||state.hero.x-e.x,e.dz||state.hero.z-e.z);g.scale.setScalar(e.wind>0?1.13:1);g.visible=e.flash<=0||Math.floor(state.time*30)%2===0}
  while(shotViews.length<state.shots.length){const m=box(scene,.19,.19,.19,'#a5e5e3');shotViews.push(m)}
  shotViews.forEach((m,i)=>{const b=state.shots[i];m.visible=!!b;if(b){m.position.set(b.x,.65,b.z);m.material=material(b.enemy?'#dd776a':'#9fe7e1')}});
  while(effectViews.length<state.effects.length){const m=box(scene,.5,.08,.5,'#ffe5a0');effectViews.push(m)}
  effectViews.forEach((m,i)=>{const e=state.effects[i];m.visible=!!e;if(e){m.position.set(e.x,.12,e.z);m.scale.setScalar(1+(.3-e.life)*4);m.material=material(e.color)}});
  $('td-clock').textContent=`${Math.floor(Math.ceil(DURATION-state.time)/60)}:${String(Math.ceil(DURATION-state.time)%60).padStart(2,'0')}`;
  $('td-wave').textContent=`第 ${state.phase} 波 · 擊退 ${state.kills}`;
  $('td-castle').value=state.castle.hp;$('td-hero').value=state.hero.hp;$('td-castle-num').textContent=Math.ceil(state.castle.hp);$('td-hero-num').textContent=Math.ceil(state.hero.hp);
  const boss=state.enemies.find(e=>e.kind==='boss');$('td-boss-row').hidden=!boss;if(boss)$('td-boss').value=boss.hp;
  $('td-notice').textContent=boss?'積木恐龍出現！膨脹蓄力時，準備閃避':state.bossDefeated?'恐龍擊退！繼續守住城堡到 0:00':'自動攻擊 · 走位保護城堡';
  $('td-dash').disabled=state.hero.dashCD>0;$('td-dash').querySelector('small').textContent=state.hero.dashCD>0?state.hero.dashCD.toFixed(1)+' 秒':'閃避';
 }
 window.homeBattleFrame=now=>{
  if(!active||!scene)return false;
  const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
  const x=stick.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
  const z=stick.z+(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
  const old=state.status;stepBattle(state,{x,z,dash},dt);dash=false;
  if(state.status==='choice'&&old!=='choice')showChoice();if(['won','lost'].includes(state.status)&&!resultShown)finish();
  const aspect=Math.max(.3,canvas.clientWidth/Math.max(1,canvas.clientHeight));const halfH=Math.max(7.6,7/aspect);camera.left=-halfH*aspect;camera.right=halfH*aspect;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();
  sync();window.homeScene.renderer.render(scene,camera);return true;
 };
 entry.onclick=()=>games.showModal();$('td-pause').onclick=pause;
 const switchWeapon=()=>{if(state?.status!=='playing')return;state.weapon=state.weapon==='bubble'?'sword':'bubble';$('td-weapon').innerHTML=state.weapon==='bubble'?'🫧<small>泡泡槍／切換</small>':'⚔<small>玩具劍／切換</small>'};
 $('td-weapon').onclick=switchWeapon;$('td-dash').onclick=()=>{dash=true};
 const pad=$('td-stick');
 function moveStick(e){if(e.pointerId!==stickPointer)return;const r=pad.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dz=e.clientY-r.top-r.height/2,n=Math.max(32,Math.hypot(dx,dz));stick={x:dx/n,z:dz/n};pad.querySelector('span').style.transform=`translate(${stick.x*28}px,${stick.z*28}px)`}
 pad.onpointerdown=e=>{if(state?.status!=='playing')return;stickPointer=e.pointerId;pad.setPointerCapture(e.pointerId);moveStick(e)};pad.onpointermove=moveStick;
 for(const event of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(event,e=>{if(e.pointerId===stickPointer)clearInput()});
 for(const event of ['pointerdown','pointermove','pointerup','dblclick','wheel'])canvas.addEventListener(event,e=>{if(active){e.preventDefault();e.stopImmediatePropagation()}},{capture:true,passive:false});
 document.addEventListener('keydown',e=>{
  if(!active)return;
  if(e.key==='Tab'&&!$('td-shade').hidden){const bs=[...$('td-shade').querySelectorAll('button:not(:disabled)')];if(bs.length){e.preventDefault();const index=bs.indexOf(document.activeElement);bs[(index+(e.shiftKey?-1:1)+bs.length)%bs.length].focus()}return}
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','escape','k'].includes(e.key.toLowerCase())){e.preventDefault();e.stopImmediatePropagation();keys.add(e.key.toLowerCase());if(e.code==='Space'&&!e.repeat)dash=true;if(e.key.toLowerCase()==='k'&&!e.repeat)switchWeapon();if(e.key==='Escape'&&!e.repeat){if(state.status==='paused')resume();else pause()}}
 },true);
 document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{clearInput();pause()});document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){clearInput();pause()}});
 installLivingShooter({games,canStart,makeHero,onWin});
 if(farmOptions)installFarm({games,canStart,options:farmOptions});
}










