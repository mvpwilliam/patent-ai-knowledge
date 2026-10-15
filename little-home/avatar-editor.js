import * as T from './vendor/three.module.js';
import {createPixelDad,normalizeAvatarDesign} from './pixel-dad.js?v=editor-visor-1';
export function openAvatarEditor(profile,design={},required=false){return new Promise(resolve=>{
 const dialog=document.createElement('dialog');dialog.className='avatar-studio';dialog.innerHTML=`<header class="av-head"><div><small>CHARACTER STUDIO</small><h2>${required?'建立你的角色':'編輯角色'}</h2></div>${required?'':'<button class="av-close" aria-label="關閉">✕</button>'}</header><div class="av-layout"><section class="av-view"><canvas width="280" height="340" aria-label="可拖曳旋轉的角色預覽"></canvas><p>拖曳人物旋轉，查看側面和背面</p></section><section class="av-fields"><label>名字<input data-field="name" maxlength="12" placeholder="你的名字"></label><div class="av-colors"><label>膚色<input type="color" data-field="skin"></label><label>髮色<input type="color" data-field="hairColor"></label><label>衣服<input type="color" data-field="shirt"></label><label>牛仔褲<input type="color" data-design="jeans"></label></div><label>髮型<select data-design="hairStyle"><option value="centerPart">韓系中分</option><option value="sidePart">俐落側分</option><option value="crew">短刺髮</option><option value="blunt">男生齊瀏海</option><option value="wavy">蓬鬆微捲</option><option value="swept">後梳油頭</option><option value="korean">韓系四六分</option><option value="braids">可愛雙辮子</option><option value="bob">齊瀏海短髮</option><option value="bluntLong">齊瀏海長髮</option><option value="ponytail">俐落高馬尾</option><option value="buns">可愛雙丸子</option><option value="short">俐落短髮</option><option value="long">柔順長髮</option><option value="cap">休閒帽子</option></select></label><label>眼鏡<select data-design="eyewear"><option value="none">不戴眼鏡</option><option value="round">圓框眼鏡</option><option value="literary">文青眼鏡</option><option value="sunglasses">太陽眼鏡</option></select></label><div class="av-sliders"></div></section></div><footer class="av-foot"><span role="status"></span><button class="av-save">${required?'完成造型，進入小屋':'儲存造型'}</button></footer>`;
 if(!document.getElementById('avatar-studio-css')){const style=document.createElement('style');style.id='avatar-studio-css';style.textContent=`.avatar-studio{box-sizing:border-box;width:min(780px,94vw);max-width:94vw;max-height:88dvh;border:0;border-radius:22px;padding:0;background:#fbfaf5;color:#34433b;overflow:hidden}.avatar-studio::backdrop{background:#172a2380;backdrop-filter:blur(4px)}.avatar-studio .av-head{position:static;display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid #dae0d6;background:#fbfaf5}.av-head h2{margin:4px 0;font-size:22px}.av-head small{font-size:10px;letter-spacing:2px;color:#738471}.av-layout{display:grid;grid-template-columns:280px 1fr;max-height:calc(88dvh - 160px);overflow:auto}.av-view{position:sticky;top:0;align-self:start;padding:18px;background:#e9eee6;text-align:center}.av-view canvas{display:block;width:100%;height:auto;touch-action:none;border-radius:15px}.av-view p{font-size:11px;color:#738471}.av-poses{display:flex;gap:8px;justify-content:center}.av-fields{padding:18px 22px}.av-fields h3{margin:0 0 12px;font-size:14px}.av-fields label{display:block;margin:12px 0;font-size:12px}.av-fields input:not([type=checkbox]),.av-fields select{box-sizing:border-box;width:100%;margin-top:6px;border:1px solid #d2d9cb;border-radius:8px;padding:8px;background:white;color:#34433b}.av-fields input[type=range]{padding:0;accent-color:#557253}.av-colors{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.av-colors input[type=color]{width:40px;height:40px;padding:3px}.av-foot{position:static;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 22px;border-top:1px solid #dae0d6;background:#fbfaf5}.av-foot span{font-size:12px;color:#a05242}.avatar-studio button{cursor:pointer}.av-save{background:#52704b;color:white;border:0;border-radius:10px;padding:12px 18px;white-space:nowrap}.av-close{border:0;background:#e6ebdf;border-radius:50%;width:34px;height:34px}.av-poses button{border:1px solid #c4d0bc;background:white;border-radius:8px;padding:7px 15px}@media(max-width:600px){.av-layout{grid-template-columns:1fr}.av-view{position:static;padding:8px}.av-view canvas{width:150px;height:182px;margin:auto}.av-view p{margin:4px}.av-fields{padding:14px 18px}.av-head h2{font-size:18px}.av-foot{padding:12px 16px}.av-layout{max-height:calc(88dvh - 148px)}}`;style.textContent+=`
.avatar-studio[open]{display:flex;flex-direction:column;height:min(820px,88dvh)}
.avatar-studio .av-head,.avatar-studio .av-foot{flex-shrink:0}
.avatar-studio .av-layout{min-height:0;max-height:none;flex:1 1 auto;overflow:auto;overscroll-behavior:contain;grid-template-columns:minmax(0,280px) minmax(0,1fr)}
.avatar-studio .av-head{height:auto;min-height:76px;width:100%;max-width:none;margin:0;gap:12px}
.avatar-studio .av-foot{width:100%;max-width:none;margin:0}
.avatar-studio .av-fields,.avatar-studio .av-view{min-width:0}
@media(max-width:600px){.avatar-studio .av-layout{grid-template-columns:minmax(0,1fr)}.avatar-studio .av-head{padding:14px 18px}.avatar-studio .av-close{width:44px;height:44px;flex-shrink:0}}
.avatar-studio .av-foot{position:static;display:flex;flex-direction:column;align-items:stretch;gap:8px;padding:12px 16px max(12px,env(safe-area-inset-bottom))}
.avatar-studio .av-foot span:empty{display:none}
.avatar-studio .av-save{display:block;flex-shrink:0;width:100%;min-width:0;min-height:54px;padding:15px 20px;font-size:17px;font-weight:700;line-height:1.4;border-radius:14px;touch-action:manipulation}
`;document.head.append(style)}
 let draft={...profile},shape=normalizeAvatarDesign(design),yaw=.25,pose='stand',renderer,scene,actor,camera;
 const canvas=dialog.querySelector('.av-view canvas'),fields=dialog.querySelector('.av-fields');
 for(const [key,label,min,max]of [['faceWidth','臉寬',.82,1.2],['chin','下巴飽滿度',.6,1.6],['eyeSize','眼睛大小',.65,1.4],['eyeGap','眼睛間距',.75,1.25],['browAngle','眉毛角度',-.5,.5]]){const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=.01;input.dataset.design=key;l.append(input);dialog.querySelector('.av-sliders').append(l)}
 function sync(){for(const e of fields.querySelectorAll('[data-field]'))e.value=draft[e.dataset.field];for(const e of fields.querySelectorAll('[data-design]')){if(e.type==='checkbox')e.checked=shape[e.dataset.design];else e.value=shape[e.dataset.design]}}
 function dispose(){actor?.userData.disposeCostume?.();actor?.traverse(n=>{n.geometry?.dispose();if(n.material)n.material.dispose()})}
 function draw(){if(!renderer)return;actor.rotation.y=yaw;actor.userData.updatePose(pose);renderer.render(scene,camera)}
 function rebuild(){try{dispose();scene=new T.Scene();scene.background=new T.Color('#e9eee6');scene.add(new T.HemisphereLight('#ffffff','#69705f',2.5));const light=new T.DirectionalLight('#ffffff',2);light.position.set(-2,4,3);scene.add(light);actor=createPixelDad(draft,shape);scene.add(actor);draw()}catch(e){dialog.querySelector('.av-foot span').textContent='預覽暫時無法顯示，仍可儲存造型。'}}
 function read(){for(const e of fields.querySelectorAll('[data-field]'))draft[e.dataset.field]=e.value;for(const e of fields.querySelectorAll('[data-design]'))shape[e.dataset.design]=e.type==='checkbox'?e.checked:e.type==='range'?Number(e.value):e.value;draft.hair=['long','cap'].includes(shape.hairStyle)?shape.hairStyle:'korean';shape.glasses=shape.eyewear==='round';shape=normalizeAvatarDesign(shape);rebuild()}
 fields.addEventListener('input',read);fields.addEventListener('change',read);

 for(const b of dialog.querySelectorAll('[data-view]'))b.onclick=()=>{pose=b.dataset.view;draw()};
 let pointer=null;canvas.onpointerdown=e=>{pointer=e.clientX;canvas.setPointerCapture(e.pointerId)};canvas.onpointermove=e=>{if(pointer===null)return;yaw+=(e.clientX-pointer)*.015;pointer=e.clientX;draw()};canvas.onpointerup=canvas.onpointercancel=()=>pointer=null;
 let done=false;function finish(value){if(done)return;done=true;dispose();renderer?.dispose();dialog.close();dialog.remove();resolve(value)}
 dialog.querySelector('.av-close')?.addEventListener('click',()=>finish(null));dialog.addEventListener('cancel',e=>{e.preventDefault();if(!required)finish(null)});
 dialog.querySelector('.av-save').onclick=()=>{if(!draft.name.trim()){dialog.querySelector('.av-foot span').textContent='請輸入名字';fields.querySelector('[data-field=name]').focus();return}finish({profile:{...draft,name:draft.name.trim().slice(0,12)},design:normalizeAvatarDesign(shape)})};
 document.body.append(dialog);sync();dialog.showModal();
 try{renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(280,340,false);camera=new T.PerspectiveCamera(35,280/340,.01,10);camera.position.set(0,.55,2.05);camera.lookAt(0,.50,0);rebuild();
 draw();
 }catch{dialog.querySelector('.av-foot span').textContent='3D預覽無法啟動，仍可選造型。'}
})}










