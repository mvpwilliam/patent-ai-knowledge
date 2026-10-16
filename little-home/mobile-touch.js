// Keep scene gestures separate from document scrolling and modal scrolling.
const style=document.createElement('style');
style.textContent=`
html{overflow-x:clip;overscroll-behavior-x:none}
body{overflow-x:clip}
#world{max-width:100%;min-width:0}
#world.td-active,#scene,.farm-pet-viewer{touch-action:none;overscroll-behavior:none}
#world button,dialog button{touch-action:manipulation}
dialog{box-sizing:border-box;overscroll-behavior:contain;touch-action:pan-x pan-y}
dialog .game-dialog-body,.farm-dialog .farm-body{overscroll-behavior:contain}
.farm-dialog{overflow-y:auto;overflow-x:hidden}
.farm-stage-strip{touch-action:pan-x pan-y;max-width:100%}
@media(pointer:coarse){
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
 const open=!!document.querySelector('dialog[open]');
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
new MutationObserver(syncModalScroll).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
syncModalScroll();
