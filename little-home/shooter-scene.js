import * as T from './vendor/three.module.js';
import {COVER} from './shooter-core.js?v=shooter-1';
export function createShooterScene(makeHero){
 const scene=new T.Scene();scene.background=new T.Color('#e5e7da');
 const camera=new T.OrthographicCamera(-8,8,8,-8,.1,80);camera.position.set(0,15,15);camera.lookAt(0,0,0);
 const geometry=new T.BoxGeometry(1,1,1),materials=new Map(),extras=[];
 const mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshLambertMaterial({color:c}));return materials.get(c)};
 function box(p,w,h,d,c,x=0,y=h/2,z=0){const m=new T.Mesh(geometry,mat(c));m.scale.set(w,h,d);m.position.set(x,y,z);p.add(m);return m}
 scene.add(new T.HemisphereLight(0xffffff,0x708274,2));const light=new T.DirectionalLight(0xfff1d7,2.2);light.position.set(-5,12,6);scene.add(light);
 box(scene,12,.16,12,'#c7b99f',0,-.15);for(let x=-5.5;x<6;x+=.65)box(scene,.018,.02,12,'#b4a489',x,-.05);
 box(scene,12,2,.18,'#e2e0d4',0,.9,-6);box(scene,.18,1.4,12,'#ccd3c8',-6,.6);
 box(scene,6.3,.03,6.5,'#aebdb0',0,-.04,.3);box(scene,5.9,.03,6.1,'#becbbc',0,-.02,.3);
 // Sofa and low sideboard are also collision cover, shared with the simulation.
 for(const c of COVER)box(scene,c.w,.55,c.d,c.x<0?'#e6e1cf':'#63796d',c.x,.28,c.z);
 box(scene,.3,1.1,3.6,'#d6d1be',-4.55,.7,-2);for(const z of [-3.1,-2,-.9])box(scene,1.1,.2,1,'#f1ecde',-3.9,.66,z);
 for(const z of [-3.7,-.3])box(scene,1.4,.8,.25,'#d6d1be',-4,.55,z);
 box(scene,4.4,.6,.65,'#64746a',.5,.3,-5.5);box(scene,3.7,1.8,.13,'#273e39',.5,1.6,-5.7);box(scene,3.35,1.45,.03,'#536d65',.5,1.6,-5.61);
 box(scene,.07,1,.07,'#bc9860',4,1.6,-5.7);box(scene,1.4,1.1,.08,'#d4b77f',4,1.6,-5.8);box(scene,1.15,.85,.09,'#879f8a',4,1.6,-5.74);
 function soldier(color='#bd7769',bound=false){const g=new T.Group();box(g,.44,.5,.32,color,0,.65);box(g,.4,.35,.34,'#e5c5a2',0,1.08);box(g,.46,.12,.38,color,0,1.29);for(const x of [-.13,.13]){box(g,.16,.32,.22,'#3c524d',x,.23);box(g,.045,.045,.02,'#273833',x,1.12,.18)}for(const x of [-.3,.3])box(g,.14,.42,.2,color,x,.65);if(bound){box(g,.65,.07,.37,'#f8efcf',0,.62);box(g,.08,.53,.36,'#f8efcf',0,.68)}else box(g,.12,.14,.55,'#34423d',.29,.7,.3);return g}
 const hero=new T.Group(),actor=makeHero?.()||soldier('#4f8274');actor.scale.multiplyScalar(.72);hero.add(actor);scene.add(hero);box(hero,.14,.14,.6,'#e4bb70',.28,.62,.37);
 const tank=new T.Group();scene.add(tank);box(tank,1.15,.48,1.25,'#819279',0,.45);for(const x of [-.6,.6]){box(tank,.25,.36,1.45,'#3e5149',x,.25);for(const z of [-.5,0,.5])box(tank,.28,.16,.2,'#829184',x,.25,z)}box(tank,.7,.3,.7,'#a3ae8e',0,.84);for(const x of [-.23,.23])box(tank,.16,.16,.85,'#64765c',x,.86,.65);
 const boss=new T.Group();scene.add(boss);box(boss,1.3,1.4,.9,'#637f66',0,1);box(boss,.95,.85,.95,'#78916e',0,2,.2);box(boss,.9,.35,.75,'#acbb83',0,1.8,.75);box(boss,.65,1,.13,'#aeb785',0,.9,.5);for(const x of [-.55,.55]){box(boss,.45,.45,.7,'#546d58',x,.23,.1);box(boss,.25,.65,.3,'#78916e',x,.95,.65);box(boss,.12,.12,.04,'#f3df8f',x*.65,2.15,.69)}for(let i=0;i<4;i++)box(boss,.25,.3,.25,'#c7ce98',0,2.25-i*.3,-.35-i*.3);box(boss,.45,.3,1.5,'#637f66',0,.35,-1);
 const enemies=Array.from({length:24},()=>{const g=soldier();g.visible=false;scene.add(g);return g});
 const bullets=Array.from({length:160},()=>{const m=box(scene,.14,.14,.28,'#f1c675');m.visible=false;return m});
 function label(text,color){const c=document.createElement('canvas');c.width=c.height=96;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,96,96);ctx.fillStyle='#fff9e8';ctx.font='bold 64px sans-serif';ctx.textAlign='center';ctx.fillText(text,48,71);const tex=new T.CanvasTexture(c);const m=new T.SpriteMaterial({map:tex});extras.push(tex,m);const sp=new T.Sprite(m);sp.scale.set(.55,.55,1);return sp}
 const pickups=Array.from({length:12},()=>{const g=new T.Group();for(const [k,c] of [['H','#607e62'],['F','#d17c47'],['R','#79729c']]){const m=label(k,c);m.name=k;g.add(m)}scene.add(g);g.visible=false;return g});
 const hostages=Array.from({length:2},()=>{const g=soldier('#e9c45d',true);scene.add(g);return g});
 const crates=Array.from({length:3},()=>{const g=new T.Group();box(g,.7,.65,.7,'#b19161');box(g,.74,.1,.74,'#e5c28b',0,.5);scene.add(g);return g});
 const effects=Array.from({length:24},()=>{const m=box(scene,1,1,1,'#f4bf68');m.visible=false;return m});
 const ringGeo=new T.RingGeometry(.92,1,48),ringMat=new T.MeshBasicMaterial({color:0xe47760,transparent:true,opacity:.65,side:T.DoubleSide});extras.push(ringGeo,ringMat);const ring=new T.Mesh(ringGeo,ringMat);ring.rotation.x=-Math.PI/2;scene.add(ring);
 const laser=box(scene,.85,.035,12,'#e47760');
 return {scene,camera,sync(s,aspect){const half=Math.max(7.6,6.8/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();const h=s.hero;hero.position.set(h.x,0,h.z);hero.rotation.y=h.angle;hero.visible=!s.tank.riding&&(h.inv<=0||Math.floor(s.time*14)%2===0);tank.position.set(s.tank.x,0,s.tank.z);tank.rotation.y=s.tank.riding?h.angle:0;tank.visible=s.tank.hp>0;boss.visible=s.boss.active;boss.position.set(s.boss.x,0,s.boss.z);boss.rotation.y=s.boss.angle;
 enemies.forEach((g,i)=>{const e=s.enemies[i];g.visible=e.active;if(e.active){g.position.set(e.x,0,e.z);g.rotation.y=e.angle||0}});bullets.forEach((m,i)=>{const q=s.bullets[i];m.visible=q.active;if(q.active){m.position.set(q.x,.65,q.z);m.rotation.y=Math.atan2(q.dx,q.dz);m.material=mat(q.enemy?'#e47760':q.kind==='F'?'#f69244':q.kind==='R'?'#b8abdc':'#f1c675');m.scale.setScalar(q.kind==='R'?.26:.14)}});
 pickups.forEach((g,i)=>{const p=s.pickups[i];g.visible=p.active;if(p.active){g.position.set(p.x,.8+Math.sin(s.time*3)*.08,p.z);g.children.forEach(c=>c.visible=c.name===p.kind)}});hostages.forEach((g,i)=>{const p=s.hostages[i];g.visible=!p.saved;g.position.set(p.x,0,p.z)});crates.forEach((g,i)=>{const p=s.crates[i];g.visible=p.hp>0;g.position.set(p.x,0,p.z)});effects.forEach((m,i)=>{const e=s.effects[i];m.visible=e.active;if(e.active){m.position.set(e.x,.35,e.z);m.scale.setScalar(e.r*(1-e.life/.4));m.rotation.y=s.time*4}});
 const b=s.boss,warning=b.active&&b.phase!=='idle';ring.visible=warning&&!b.attack;ring.position.set(b.x,.02,b.z);ring.scale.setScalar(3);laser.visible=warning&&!!b.attack;laser.position.set(b.x+Math.sin(b.angle)*6,.03,b.z+Math.cos(b.angle)*6);laser.rotation.y=b.angle;
 },dispose(){geometry.dispose();for(const m of materials.values())m.dispose();for(const o of extras)o.dispose();actor.userData.disposeCostume?.();const gs=new Set(),ms=new Set();actor.traverse(n=>{if(n.geometry&&n.geometry!==geometry)gs.add(n.geometry);if(n.material)for(const m of Array.isArray(n.material)?n.material:[n.material])if(![...materials.values()].includes(m))ms.add(m)});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose())}};
}
