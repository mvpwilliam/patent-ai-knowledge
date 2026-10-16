import {mountPetViewer} from './farm-art.js?v=evo-10';

// A short, cancellable reveal using the actual before/after 3D models.
export function playEvolution(container,renderer,before,after){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const root=document.createElement('div');root.className='farm-evolution-reveal';
 root.innerHTML='<style>.farm-evolution-reveal{position:relative;isolation:isolate;overflow:hidden;border-radius:24px;background:radial-gradient(ellipse,#fff8ce,#dbe7cf 65%,#a5bbaa);text-align:center;padding:12px}.farm-evolution-stage{position:relative;aspect-ratio:1;max-height:360px;margin:auto}.farm-evolution-model{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none}.farm-evolution-model canvas{width:100%;height:100%;object-fit:contain}.farm-evolution-halo{position:absolute;inset:8%;border-radius:50%;border:4px solid #fff1a9;box-shadow:0 0 35px #ffe49d,inset 0 0 35px #fff8d2;pointer-events:none}.farm-evolution-reveal p{position:relative;font-weight:600}.farm-evolution-reveal button{position:relative}</style><div class="farm-evolution-stage"><div class="farm-evolution-halo"></div><div class="farm-evolution-model" data-before></div><div class="farm-evolution-model" data-after></div></div><p role="status" aria-live="polite">光芒正在聚集…</p><button type="button">略過動畫</button>';
 container.append(root);const old=root.querySelector('[data-before]'),next=root.querySelector('[data-after]'),label=root.querySelector('p');
 const disposers=[],animations=[];let timer,reveal,done=false,resolve;
 const finished=new Promise(r=>resolve=r);
 function dispose(){if(done)return;done=true;clearTimeout(timer);clearTimeout(reveal);for(const a of animations)a.cancel();for(const d of disposers)d();root.remove();resolve()}
 root.querySelector('button').onclick=dispose;
 try{disposers.push(mountPetViewer(old,renderer,before,{transparent:true}));disposers.push(mountPetViewer(next,renderer,after,{transparent:true}));
  const duration=reduced?650:2800;
  if(reduced){old.style.display='none';label.textContent=after.name+'，進化完成！'}
  else{
   const animate=(el,frames)=>animations.push(el.animate(frames,{duration,fill:'both',easing:'ease-in-out'}));
   animate(old,[{opacity:1,filter:'brightness(1)',transform:'scale(1)',offset:0},{opacity:1,filter:'brightness(3)',transform:'scale(.92)',offset:.38},{opacity:0,filter:'brightness(4)',transform:'scale(.8)',offset:.52},{opacity:0,offset:1}]);
   animate(next,[{opacity:0,transform:'scale(.7)',filter:'brightness(3)',offset:0},{opacity:0,transform:'scale(.7)',filter:'brightness(3)',offset:.4},{opacity:1,transform:'scale(1.06)',filter:'brightness(1.4)',offset:.65},{opacity:1,transform:'scale(1)',filter:'brightness(1)',offset:1}]);
   animate(root.querySelector('.farm-evolution-halo'),[{opacity:0,transform:'scale(.3)',offset:0},{opacity:1,transform:'scale(.8)',offset:.38},{opacity:.8,transform:'scale(1.3)',offset:.65},{opacity:0,transform:'scale(1.6)',offset:1}]);
   reveal=setTimeout(()=>{label.textContent=after.name+'，進化完成！'},duration*.55);
  }
  timer=setTimeout(dispose,duration);
 }catch(error){dispose()}
 return {finished,dispose};
}
