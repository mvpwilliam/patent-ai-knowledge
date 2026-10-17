// Keep scene gestures separate from document scrolling and modal scrolling.
const style=document.createElement('style');
style.textContent=`
html{overflow-x:clip;overscroll-behavior-x:none}
body{overflow-x:clip}
#world{max-width:100%;min-width:0}
#world.td-active,#scene,.farm-pet-viewer{touch-action:none;overscroll-behavior:none}
#world button,dialog button{touch-action:manipulation}
html.game-scroll-locked{overflow:hidden;overscroll-behavior:none}
.td-card{max-height:85dvh;overflow-y:auto;overscroll-behavior:contain}
dialog{box-sizing:border-box;overscroll-behavior:contain;touch-action:pan-x pan-y}
dialog .game-dialog-body,.farm-dialog .farm-body{overscroll-behavior:contain}
.farm-dialog{overflow-y:auto;overflow-x:hidden}
.farm-stage-strip{touch-action:pan-x pan-y;max-width:100%}
@media(pointer:coarse){
 #world.td-active{position:fixed!important;inset:0!important;width:100%!important;height:100dvh!important;min-height:0!important;max-height:none!important;z-index:100;border-radius:0}
 input:not([type=range]):not([type=checkbox]):not([type=radio]),select,textarea,.farm-body input{font-size:16px!important}
 body>header{max-width:100%;box-sizing:border-box}
}
`;
document.head.append(style);

// Safari's gesture events must not turn a scene pinch into page magnification.
for(const name of ['gesturestart','gesturechange','gestureend']){
 document.addEventListener(name,event=>{
  if(event.target instanceof Element&&event.target.closest('#world,.farm-pet-viewer,dialog'))event.preventDefault();
 },{passive:false});
}

// Native dialogs block clicks behind them, but do not consistently lock body
// scrolling on touch browsers. Preserve the exact page position across dialogs.
let saved=null;
function syncModalScroll(){
 const open=!!document.querySelector('dialog[open],#world.td-active')||document.body.hasAttribute('data-escape-page')||new URLSearchParams(location.search).has('escapeScene');
 document.documentElement.classList.toggle('game-scroll-locked',open);
 if(open&&!saved){
  const body=document.body;const props=['position','top','left','right','width','overflow'];
  saved={x:window.scrollX,y:window.scrollY,styles:props.map(name=>[name,body.style.getPropertyValue(name),body.style.getPropertyPriority(name)])};
  body.style.position='fixed';body.style.top=`-${saved.y}px`;body.style.left='0';body.style.right='0';body.style.width='100%';body.style.overflow='hidden';
 }else if(!open&&saved){
  const previous=saved;saved=null;
  for(const [name,value,priority] of previous.styles){if(value)document.body.style.setProperty(name,value,priority);else document.body.style.removeProperty(name)}
  window.scrollTo(previous.x,previous.y);
 }
}
new MutationObserver(syncModalScroll).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','class']});
syncModalScroll();

// Stop rubber-band scrolling at dialog boundaries while retaining inner lists.
let touch=null;
document.addEventListener('touchstart',e=>{const t=e.touches[0];touch=t?{x:t.clientX,y:t.clientY}:null},{passive:true});
document.addEventListener('touchmove',e=>{
 if(!saved||!touch)return;
 const t=e.touches[0];if(!t)return;
 const dx=touch.x-t.clientX,dy=touch.y-t.clientY;touch={x:t.clientX,y:t.clientY};
 const boundary=e.target instanceof Element?e.target.closest('dialog[open],.td-card'):null;
 if(boundary&&e.touches.length===1){
  for(let node=e.target;node instanceof Element;node=node.parentElement){
   const css=getComputedStyle(node),vertical=Math.abs(dy)>=Math.abs(dx);
   const overflow=vertical?css.overflowY:css.overflowX;
   const pos=vertical?node.scrollTop:node.scrollLeft,delta=vertical?dy:dx;
   const max=vertical?node.scrollHeight-node.clientHeight:node.scrollWidth-node.clientWidth;
   if(/auto|scroll/.test(overflow)&&max>1&&((delta>0&&pos<max-1)||(delta<0&&pos>0)))return;
   if(node===boundary)break;
  }
 }
 if(e.cancelable)e.preventDefault();
},{passive:false});
document.addEventListener('touchend',()=>{touch=null},{passive:true});
document.addEventListener('touchcancel',()=>{touch=null},{passive:true});
