export function createRoom(canvas,onPick){
 const frame=document.createElement('iframe');
 frame.title='自己家的客廳 · 密室逃脫';frame.src='./index.html?escapeScene=1';
 frame.style.cssText='width:100%;height:100%;border:0;display:block';canvas.replaceWith(frame);
 let paused=false;
 const send=data=>frame.contentWindow?.postMessage(data,location.origin);
 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==frame.contentWindow)return;
  if(e.data?.type==='escape-pick'&&!paused)onPick(e.data.id);
  if(e.data?.type==='escape-ready'){document.getElementById('load-error').hidden=true;send({type:'escape-pause',paused})}
 });
 return {sync(){},pause(value){paused=value;send({type:'escape-pause',paused})},reset(){send({type:'escape-reset'})},focus(){},lookAtPainting(){}};
}
