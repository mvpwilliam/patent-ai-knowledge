import * as T from './vendor/three.module.js';
import {createFarmPet} from './farm-pets.js?v=farm-1';

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

// Render the actual game geometry once per species; never allocate a second WebGL context.
export function beastPicture(renderer,line){
 if(pictures.has(line))return pictures.get(line);
 const size=320,scene=new T.Scene(),pet=createFarmPet({line,feeds:Array(15).fill(line),history:[]});
 scene.add(pet,new T.HemisphereLight(0xfff8e5,0x63785c,2));
 const light=new T.DirectionalLight(0xfff4de,3);light.position.set(3,5,5);scene.add(light);
 const bounds=new T.Box3().setFromObject(pet),center=bounds.getCenter(new T.Vector3());
 const radius=bounds.getSize(new T.Vector3()).length()/2,half=radius*1.12;
 const camera=new T.OrthographicCamera(-half,half,half,-half,.01,100);
 camera.position.copy(center).add(new T.Vector3(3,2.1,4).normalize().multiplyScalar(radius*4+1));camera.lookAt(center);
 const target=new T.WebGLRenderTarget(size,size);target.texture.colorSpace=T.SRGBColorSpace;
 const old={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),level:renderer.getActiveMipmapLevel(),color:renderer.getClearColor(new T.Color()),alpha:renderer.getClearAlpha(),auto:renderer.autoClear,xr:renderer.xr.enabled};
 try{
  renderer.xr.enabled=false;renderer.autoClear=true;renderer.setRenderTarget(target);renderer.setClearColor(0xf0f1e4,1);renderer.render(scene,camera);
  const pixels=new Uint8Array(size*size*4);renderer.readRenderTargetPixels(target,0,0,size,size,pixels);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d'),frame=ctx.createImageData(size,size);
  for(let y=0;y<size;y++)frame.data.set(pixels.subarray((size-1-y)*size*4,(size-y)*size*4),y*size*4);
  ctx.putImageData(frame,0,0);const url=canvas.toDataURL('image/png');pictures.set(line,url);return url;
 }finally{
  renderer.setRenderTarget(old.target,old.face,old.level);renderer.setClearColor(old.color,old.alpha);renderer.autoClear=old.auto;renderer.xr.enabled=old.xr;
  target.dispose();pet.userData.dispose();
 }
}
