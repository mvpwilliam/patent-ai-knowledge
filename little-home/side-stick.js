export function stickDirection(dx,dy,radius){
 const length=Math.hypot(dx,dy),limit=Math.max(1,radius),scale=length>limit?limit/length:1;
 const x=dx*scale/limit,y=dy*scale/limit;
 return {dx:dx*scale,dy:dy*scale,left:x<-.32,right:x>.32,up:y<-.42,down:y>.42};
}
export function bindSideStick(pad,canMove){
 let pointer=null,state=stickDirection(0,0,1);const knob=pad.querySelector('i');
 function reset(){const old=pointer;pointer=null;state=stickDirection(0,0,1);knob.style.transform='translate(0px,0px)';pad.classList.remove('held');if(old!==null&&pad.hasPointerCapture(old))pad.releasePointerCapture(old)}
 function move(e){if(e.pointerId!==pointer)return;e.preventDefault();if(!canMove()){reset();return}const r=pad.getBoundingClientRect();state=stickDirection(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2,r.width*.29);knob.style.transform=`translate(${state.dx}px,${state.dy}px)`}
 pad.addEventListener('pointerdown',e=>{if(pointer!==null||!canMove()||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();pointer=e.pointerId;pad.setPointerCapture(pointer);pad.classList.add('held');move(e)});
 pad.addEventListener('pointermove',move);
 for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,e=>{if(e.pointerId===pointer)reset()});
 pad.addEventListener('contextmenu',e=>e.preventDefault());
 return {pressed:key=>!!state[key],reset};
}
