import * as T from './vendor/three.module.js';
import {createEmberRex} from './ember-rex.js?v=rex-1';
const canvas=document.querySelector('canvas');
try{
 const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const scene=new T.Scene();scene.background=new T.Color('#e5e8dc');const camera=new T.PerspectiveCamera(36,1,.03,60);
 scene.add(new T.HemisphereLight(0xfff7e5,0x829483,2.2));const sun=new T.DirectionalLight(0xffefd7,3);sun.position.set(-3,6,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:.1,far:15});sun.shadow.bias=-.0003;sun.shadow.normalBias=.015;scene.add(sun);const fill=new T.DirectionalLight(0xd9e8e1,.8);fill.position.set(3,2,-4);scene.add(fill);
 const pet=createEmberRex();scene.add(pet);document.querySelector('#stats').textContent=`${pet.userData.stats.triangles.toLocaleString()} 三角面 · ${pet.userData.stats.drawCalls} 模型繪製批次`;
 const ground=new T.Mesh(new T.CylinderGeometry(1.13,1.18,.10,64),new T.MeshStandardMaterial({color:0xd5ddc7,roughness:1}));ground.position.y=-.09;ground.receiveShadow=true;scene.add(ground);
 const room=new T.Group();room.visible=false;scene.add(room);
 function box(w,h,d,color,x,y,z){const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.95}));m.position.set(x,y,z);m.receiveShadow=true;m.castShadow=true;room.add(m);return m}
 box(4,.08,3,0xc5b69c,0,-.08,0);for(let x=-1.8;x<2;x+=.3)box(.008,.005,3,0xac9c84,x,-.036,0);
 box(2.1,.34,.70,0xb6bcaa,-.45,.24,-.95);box(2.1,.48,.18,0xcbd0bd,-.45,.65,-1.2);for(const x of [-1.1,-.45,.2])box(.6,.13,.58,0xe1dfcd,x,.47,-.86);for(const x of [-1.48,.58])box(.15,.35,.73,0xcbd0bd,x,.52,-.95);
 box(.018,1.8,.018,0x728a77,1.35,.9,-.9);for(let i=0;i<=9;i++)box(.12,.008,.02,0x728a77,1.35,i*.2,-.9);
 const labelCanvas=document.createElement('canvas');labelCanvas.width=256;labelCanvas.height=64;const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#405e4e';ctx.font='32px sans-serif';ctx.fillText('180 cm',12,45);const tex=new T.CanvasTexture(labelCanvas),label=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true}));label.scale.set(.65,.16,1);label.position.set(1.38,1.94,-.9);room.add(label);
 let yaw=.65,pitch=.26,distance=2.8,auto=true,walk=false,roar=false,inRoom=false,previous=0,time=0;
 const target=new T.Vector3(0,.48,0),pointers=new Map();let pinch=0;
 function stateButton(id,value){const el=document.getElementById(id);el.classList.toggle('active',value);el.setAttribute('aria-pressed',String(value))}
 function setRoom(value){inRoom=value;room.visible=value;ground.visible=!value;distance=value?5:2.8;target.set(0,value?.75:.48,value?-.15:0);stateButton('room',value);stateButton('closeup',!value)}
 document.getElementById('closeup').onclick=()=>setRoom(false);document.getElementById('room').onclick=()=>setRoom(true);
 document.getElementById('rotate').onclick=()=>{auto=!auto;stateButton('rotate',auto)};document.getElementById('walk').onclick=()=>{walk=!walk;stateButton('walk',walk)};document.getElementById('roar').onclick=()=>{roar=!roar;stateButton('roar',roar)};
 document.getElementById('reset').onclick=()=>{yaw=.65;pitch=.26;setRoom(inRoom)};
 canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});pinch=0;auto=false;stateButton('rotate',false)});
 canvas.addEventListener('pointermove',e=>{const old=pointers.get(e.pointerId);if(!old)return;const dx=e.clientX-old.x,dy=e.clientY-old.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){yaw-=dx*.008;pitch=T.MathUtils.clamp(pitch+dy*.006,-.1,1.15)}else{const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)distance=T.MathUtils.clamp(distance*pinch/Math.max(1,d),1.5,8);pinch=d}});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{pointers.delete(e.pointerId);pinch=0});canvas.addEventListener('wheel',e=>{e.preventDefault();distance=T.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),1.5,8)},{passive:false});
 const resize=new ResizeObserver(()=>{const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()});resize.observe(canvas);
 function frame(now){requestAnimationFrame(frame);if(document.hidden){previous=0;return}if(previous&&now-previous<1000/30)return;const dt=previous?Math.min(.1,(now-previous)/1000):0;previous=now;time+=dt;if(auto)yaw+=dt*.18;pet.userData.update(time,{walk,roar});const fit=distance*Math.max(1,.85/camera.aspect);camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*fit,target.y+Math.sin(pitch)*fit,target.z+Math.cos(yaw)*Math.cos(pitch)*fit);camera.lookAt(target);renderer.render(scene,camera)}requestAnimationFrame(frame);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();document.getElementById('error').hidden=false});
}catch(error){document.getElementById('error').hidden=false;console.error(error)}
