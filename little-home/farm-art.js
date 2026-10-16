import * as T from './vendor/three.module.js';
import {createFarmPet} from './farm-pets.js?v=farm-balance-6';

const pictures=new Map();
export function cropPicture(id){
 const leaves='<path d="M45 31 34 12 43 8 50 24 54 6 64 10 58 29 72 16 78 24 62 36Z" fill="#54784b"/>';
 const shapes={
  radish:'<path d="M30 37 49 28 70 39 74 58 57 78 49 89 45 77 27 59Z" fill="#eedbc8"/><path d="m49 28 21 11 4 19-17 20-8-22Z" fill="#d4bfaf"/><path d="m30 37 19-9v28l-22 3Z" fill="#fff0dc"/>',
  tomato:'<path d="m23 42 26-12 28 12v31L50 87 23 73Z" fill="#c75c45"/><path d="m23 42 26 10 28-10-28-12Z" fill="#e88164"/><path d="M49 52v35l28-14V42Z" fill="#ad493a"/>',
  pumpkin:'<path d="m20 42 18-11 26 1 17 13v29L65 86H35L19 72Z" fill="#dc913b"/><path d="m38 31-3 55 14 2V33Z" fill="#efb250"/><path d="m64 32 2 54 12-11-1-29Z" fill="#b97732"/><path d="m43 33 1-17 12-2 4 19Z" fill="#58774b"/>'
 };
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="89" rx="32" ry="5" fill="#405e4e" opacity=".10"/>'+(id==='pumpkin'?'':leaves)+shapes[id]+'</svg>');
}

// Offscreen portraits share the game's renderer and release their GPU resources.
export function createPetPortrait(renderer,petData,size=320){
 const scene=new T.Scene(),pet=createFarmPet(petData);
 scene.add(pet,new T.HemisphereLight(0xfff8e5,0x63785c,2));
 const light=new T.DirectionalLight(0xfff4de,3);light.position.set(3,5,5);scene.add(light);
 const bounds=new T.Box3().setFromObject(pet),center=bounds.getCenter(new T.Vector3());
 const radius=bounds.getSize(new T.Vector3()).length()/2,half=radius*1.12;
 const camera=new T.OrthographicCamera(-half,half,half,-half,.01,100);
 const target=new T.WebGLRenderTarget(size,size);target.texture.colorSpace=T.SRGBColorSpace;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d'),frame=ctx.createImageData(size,size),pixels=new Uint8Array(size*size*4);
 let disposed=false;
 return {canvas,render(yaw=.64,pitch=.4){
  if(disposed)return;
  camera.position.copy(center).add(new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(radius*4+1));camera.lookAt(center);
  const old={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),level:renderer.getActiveMipmapLevel(),color:renderer.getClearColor(new T.Color()),alpha:renderer.getClearAlpha(),auto:renderer.autoClear,xr:renderer.xr.enabled};
  try{
   renderer.xr.enabled=false;renderer.autoClear=true;renderer.setRenderTarget(target);renderer.setClearColor(0xf0f1e4,1);renderer.render(scene,camera);
   renderer.readRenderTargetPixels(target,0,0,size,size,pixels);
   for(let y=0;y<size;y++)frame.data.set(pixels.subarray((size-1-y)*size*4,(size-y)*size*4),y*size*4);
   ctx.putImageData(frame,0,0);
  }finally{
   renderer.setRenderTarget(old.target,old.face,old.level);renderer.setClearColor(old.color,old.alpha);renderer.autoClear=old.auto;renderer.xr.enabled=old.xr;
  }
 },dispose(){if(disposed)return;disposed=true;target.dispose();pet.userData.dispose()}};
}
export function beastPicture(renderer,line,stage=5){
 const key=line+':'+stage;if(pictures.has(key))return pictures.get(key);
 const portrait=createPetPortrait(renderer,{line,feeds:Array(stage*3).fill(line),history:[]},240);
 try{portrait.render();const url=portrait.canvas.toDataURL('image/png');pictures.set(key,url);return url}
 finally{portrait.dispose()}
}

// Rendering only on pointer/keyboard changes keeps an idle preview inexpensive.
export function mountPetViewer(container,renderer,pet){
 const portrait=createPetPortrait(renderer,pet),canvas=portrait.canvas;
 canvas.className='farm-pet-viewer';canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',pet.name+'，可拖曳旋轉的 3D 夥伴；方向鍵旋轉');
 container.append(canvas);let yaw=.64,pitch=.4,drag=null,frame=0;
 const repaint=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;portrait.render(yaw,pitch)})};
 canvas.onpointerdown=e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);e.preventDefault()};
 canvas.onpointermove=e=>{if(drag?.id!==e.pointerId)return;yaw-=(e.clientX-drag.x)*.012;pitch=Math.max(-.15,Math.min(1.1,pitch+(e.clientY-drag.y)*.009));drag.x=e.clientX;drag.y=e.clientY;repaint()};
 canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=()=>{drag=null};
 canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home'){yaw=.64;pitch=.4}else if(e.key==='ArrowLeft')yaw-=.2;else if(e.key==='ArrowRight')yaw+=.2;else pitch=Math.max(-.15,Math.min(1.1,pitch+(e.key==='ArrowUp'?.12:-.12)));repaint()};
 try{portrait.render(yaw,pitch)}catch(error){portrait.dispose();canvas.remove();throw error}
 return ()=>{cancelAnimationFrame(frame);portrait.dispose();canvas.remove()};
}


