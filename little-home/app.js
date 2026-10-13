import * as T from './vendor/three.module.js';
import {X_SCALE,X_PIVOT,scaleX,entryZero,entryX,kitchenStart,kitchenEnd,sinkX,stoveX,furnitureShift,washerPosition} from './layout.js?v=85';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
const $=s=>document.querySelector(s), canvas=$('#scene'), host=$('#world');
let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'default'});}catch(e){$('#loading').hidden=true;$('#error').hidden=false;throw e}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,100);const root=new T.Group();scene.add(root);
const hemi=new T.HemisphereLight(0xf1f4fa,0x747982,1.35);scene.add(hemi);const sun=new T.DirectionalLight(0xfff6eb,2.1);sun.position.set(-3,12,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:40});sun.shadow.bias=-.0005;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun);const fill=new T.DirectionalLight(0xdce7ff,.65);fill.position.set(7,8,-9);scene.add(fill);
const mats=new Map(),geos=new Map();function mat(c){if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.8}));return mats.get(c)}
const C={wall:'#b8b9ba',trim:'#979b9d',wood:'#a58b6c',woodlight:'#c4ae8b',floor:'#e8d9bd',navy:'#354e63',cream:'#e3e1d9',cab:'#62656b',dark:'#394746',metal:'#6d7773',green:'#789377',white:'#f4f1e6',bed:'#b6c3ac'};
// Architectural X values below are unscaled model metres. The balcony and
// shower share the same new outer line, 54 cm outward in world coordinates.
const OUTER_X=7.18+.54/X_SCALE;
// The master/bath exterior wall moves 20 cm toward the building exterior.
const BATH_EXTERIOR_X=6.47+.20/X_SCALE;
const SHAFT_DEPTH=.35*.8; // reduce the clear depth perpendicular to the balcony by 20%
const SHAFT_INNER_X=5.895+SHAFT_DEPTH/X_SCALE;
const SHAFT_OUTER_X=SHAFT_INNER_X+.13;
const SHAFT_END_Z=5.55+.68; // 55 cm internal Z after two 6.5 cm wall faces
const END_SPAN=OUTER_X-6.47,END_CENTRE=(6.47+OUTER_X)/2;
const SHOWER_WINDOW_SPAN=OUTER_X-BATH_EXTERIOR_X;
const SHOWER_WINDOW_CENTRE=(BATH_EXTERIOR_X+OUTER_X)/2;
// The balcony-facing end-wall surface follows the red line at the shaft end.
// Its inner end overlaps the shaft's outer wall, closing both former gaps.
const BALCONY_START_Z=SHAFT_END_Z,BALCONY_LENGTH=9.20-BALCONY_START_Z;
const BALCONY_CENTRE_Z=(BALCONY_START_Z+9.20)/2;
const BATH_END_SPAN=OUTER_X-SHAFT_INNER_X,BATH_END_CENTRE=(SHAFT_INNER_X+OUTER_X)/2;
const SHOWER_LENGTH=BALCONY_START_Z-4.55,SHOWER_CENTRE_Z=(4.55+BALCONY_START_Z)/2;
function box(x,y,z,w,h,d,c,round=0,parent=root){let key=[w,h,d,round].join(',');if(!geos.has(key))geos.set(key,round?new RoundedBoxGeometry(w,h,d,2,Math.min(round,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d));let m=new T.Mesh(geos.get(key),typeof c==='string'?mat(c):c);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function cyl(x,y,z,r,h,c,r2=r,parent=root){let m=new T.Mesh(new T.CylinderGeometry(r,r2,h,20),mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function ball(x,y,z,r,c,s=[1,1,1],parent=root){let m=new T.Mesh(new T.SphereGeometry(r,16,12),typeof c==='string'?mat(c):c);m.position.set(x,y,z);m.scale.set(...s);m.castShadow=true;parent.add(m);return m}
function rod(a,b,r,c,parent=root){let aa=new T.Vector3(...a),bb=new T.Vector3(...b);let m=cyl(0,0,0,r,aa.distanceTo(bb),c,r,parent);m.position.copy(aa.add(bb).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...b).sub(new T.Vector3(...a)).normalize());return m}
function plant(x,y,z,scale=1){const p=new T.Group();root.add(p);p.position.set(x,y,z);p.scale.setScalar(scale);cyl(0,.16,0,.19,.32,'#d7c9ab',.14,p);cyl(0,.32,0,.16,.02,'#605c43',.16,p);rod([0,.3,0],[0,1.1,0],.017,'#7b7b52',p);for(let i=0;i<9;i++){let a=i*2.4,yy=.48+i*.074,xx=Math.cos(a)*(.32-i*.014),zz=Math.sin(a)*(.32-i*.014);rod([0,yy-.12,0],[xx,yy,zz],.009,'#7b7b52',p);let leaf=ball(xx,yy,zz,.17,i%2?'#809b65':'#9caa76',[1,.27,.5],p);leaf.rotation.y=-a;}return p}
// Capture construction sections so architectural pieces scale in world X,
// while complete furniture assemblies only translate (never stretch).
let builtStart=0;
function finishSection(name,kind='architecture',dx=0){
  const items=root.children.slice(builtStart);
  if(items.length){
    const group=new T.Group();group.name=name;
    for(const item of items)group.add(item);
    if(kind==='architecture'){group.position.x=X_PIVOT*(1-X_SCALE);group.scale.x=X_SCALE}
    else if(kind==='translate')group.position.x=dx;
    root.add(group);
  }
  builtStart=root.children.length;
}
function named(object,name){object.name=name;return object}
// Thin cabinet fronts should not receive their own cabinet's shadow map.
function cabinetFront(object){object.castShadow=false;object.receiveShadow=false;return object}
const floorGroup=new T.Group();root.add(floorGroup);
const woodShades=['#eadcc1','#e6d7b9','#e9dbbe','#e2d2b3','#ecddc2','#e7d8bb'];
function woodBoards(x,z,w,d,alongZ=true,y=.041){
  const span=alongZ?w:d,run=alongZ?d:w,strip=.19,board=1.38;
  for(let i=0;i<Math.ceil(span/strip);i++){
    const s0=-span/2+i*strip,sw=Math.min(strip,span/2-s0);
    if(sw<=0)continue;
    const shift=(i%3)*board/3;
    for(let t=-run/2-shift,j=0;t<run/2;t+=board,j++){
      const lo=Math.max(t,-run/2),hi=Math.min(t+board,run/2);
      if(hi-lo<.02)continue;
      const a=s0+sw/2,b=(lo+hi)/2;
      const p=alongZ?box(x+a,y,z+b,sw-.004,.008,hi-lo-.005,woodShades[(i*3+j)%woodShades.length]):box(x+b,y,z+a,hi-lo-.005,.008,sw-.004,woodShades[(i*3+j)%woodShades.length]);
      // Subtle lengthwise grain follows each plank without dark stripes.
      const grain=(i*7+j*11)%5;
      if(grain<3){if(alongZ)box(x+a+(grain-1)*.035,y+.005,z+b,.003,.001,Math.max(.05,(hi-lo)*.55),'#dac9ab');else box(x+b,y+.005,z+a+(grain-1)*.035,Math.max(.05,(hi-lo)*.55),.001,.003,'#dac9ab')}
    }
  }
}
function floor(x,z,w,d,color=C.floor,finish='wood'){
  box(x,-.18,z,w,.32,d,'#c9baa0',.04);const surface=box(x,.005,z,w,.06,d,color);
  if(finish==='wood')woodBoards(x,z,w,d,true);
  else{for(let xx=x-w/2+.60;xx<x+w/2;xx+=.60)box(xx,.038,z,.006,.002,d,'#77756e');for(let zz=z-d/2+.60;zz<z+d/2;zz+=.60)box(x,.038,zz,w,.002,.006,'#77756e')}
  return surface;
}
// Wood continues beneath the diagonal transition. Its former rectangular
// grey base remained visible on the wood side of the intended red-line edge.
const stoneStartZ=8.345;
floor(2.915,5,5.83,10);
floor((5.83+BATH_EXTERIOR_X)/2,3.225,BATH_EXTERIOR_X-5.83,6.45);
floor(6.115,9.60,.57,.80);
// The second-bedroom boards turn 90 degrees, following the flooring plan.
box(4.24,.042,6.84,3.08,.004,2.52,C.floor);woodBoards(4.24,6.84,3.08,2.52,false,.048);
finishSection('indoor-floors');
named(floor((entryZero+scaleX(0))/2,(7.85+9.995)/2,scaleX(0)-entryZero,9.995-7.85),'entry-wood-under-cabinet');
finishSection('entry-wood-floor','exact');
// The real floor uses muted grey slate. The timber/stone edge follows the
// photographed diagonal from the end panel to the refrigerator corner.
const entryStoneCanvas=document.createElement('canvas');entryStoneCanvas.width=256;entryStoneCanvas.height=256;
const stoneCtx=entryStoneCanvas.getContext('2d');stoneCtx.fillStyle='#696c69';stoneCtx.fillRect(0,0,256,256);
let stoneSeed=1917;const stoneRand=()=>((stoneSeed=(stoneSeed*1664525+1013904223)>>>0)/4294967296);
for(let i=0;i<11500;i++){
  const size=.3+stoneRand()*1.15;
  stoneCtx.fillStyle=['#777a77','#5d615e','#858783','#676a67'][i%4];
  stoneCtx.fillRect(stoneRand()*256,stoneRand()*256,size,size);
}
const entryStoneTexture=new T.CanvasTexture(entryStoneCanvas);entryStoneTexture.colorSpace=T.SRGBColorSpace;
const entryStoneMaterial=new T.MeshStandardMaterial({map:entryStoneTexture,roughness:.92});
// The finish is the only grey surface. The wood beneath it prevents any
// rectangular grey patch from showing beyond the diagonal outline.
const panelTip=[entryX(125),stoneStartZ],fridgeTip=[entryX(207),9.295];
const stoneOutline=[[entryZero,stoneStartZ],panelTip,fridgeTip,[fridgeTip[0],9.995],[entryZero,9.995]];
const stoneShape=new T.Shape();stoneShape.moveTo(stoneOutline[0][0],-stoneOutline[0][1]);
for(const [x,z] of stoneOutline.slice(1))stoneShape.lineTo(x,-z);
stoneShape.closePath();
const stoneGeometry=new T.ShapeGeometry(stoneShape);stoneGeometry.rotateX(-Math.PI/2);
const stoneFinish=new T.Mesh(stoneGeometry,entryStoneMaterial);stoneFinish.position.y=.052;stoneFinish.receiveShadow=true;
named(stoneFinish,'entry-stone-finish');root.add(stoneFinish);
named(rod([panelTip[0],.056,panelTip[1]],[fridgeTip[0],.056,fridgeTip[1]],.007,'#b6aea0'),'entry-diagonal-transition');
finishSection('entry-stone','exact');
// Brown ceramic balcony squares with cool grey grout and soft horizontal
// grain follow the actual floor photograph, independent of the indoor wood.
const tileCanvas=document.createElement('canvas');tileCanvas.width=128;tileCanvas.height=128;
const tileCtx=tileCanvas.getContext('2d'),tilePixels=tileCtx.createImageData(128,128);
for(let py=0;py<128;py++)for(let px=0;px<128;px++){
  const i=(py*128+px)*4,grain=6*Math.sin(py*.42)+3*Math.sin(py*.11+px*.03);
  const fleck=(Math.sin(px*12.9898+py*78.233)*43758.5453)%1;
  const shade=grain+fleck*7;
  tilePixels.data[i]=143+shade;tilePixels.data[i+1]=125+shade;tilePixels.data[i+2]=106+shade;tilePixels.data[i+3]=255;
}
tileCtx.putImageData(tilePixels,0,0);
const balconyTileTexture=new T.CanvasTexture(tileCanvas);balconyTileTexture.colorSpace=T.SRGBColorSpace;
const balconyTileMat=new T.MeshStandardMaterial({map:balconyTileTexture,roughness:.85});
box((5.83+OUTER_X)/2,-.18,BALCONY_CENTRE_Z,OUTER_X-5.83,.32,BALCONY_LENGTH,'#c9baa0',.04);
box((5.83+OUTER_X)/2,.005,BALCONY_CENTRE_Z,OUTER_X-5.83,.06,BALCONY_LENGTH,'#a5aeb0');
for(let tx=5.83;tx<OUTER_X-.001;tx+=.45)for(let tz=BALCONY_START_Z;tz<9.20-.001;tz+=.45){
  const w=Math.min(.45,OUTER_X-tx),d=Math.min(.45,9.20-tz);
  box(tx+w/2,.042,tz+d/2,w-.018,.012,d-.018,balconyTileMat,.001);
}
floor(SHOWER_WINDOW_CENTRE-.0375,SHOWER_CENTRE_Z,SHOWER_WINDOW_SPAN+.075,SHOWER_LENGTH,'#55585b','tile');
floor((SHAFT_OUTER_X+BATH_EXTERIOR_X)/2,(5.55+BALCONY_START_Z)/2,BATH_EXTERIOR_X-SHAFT_OUTER_X,BALCONY_START_Z-5.55,'#55585b','tile');
finishSection('balcony-floors');
// Foundation and soft ground beneath the miniature.
box(2.9,-.52,5,10.5,.28,12.2,'#d3dac4',.13);box(2.9,-.72,5,10.8,.18,12.5,'#bdcbae',.06);
const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({color:0x536e48,opacity:.15}));ground.rotation.x=-Math.PI/2;ground.position.y=-.82;ground.receiveShadow=true;scene.add(ground);
finishSection('foundation');
const walls=[];function wall(x,z,w,d,h=1.15){let g=new T.Group();g.position.set(x,0,z);root.add(g);box(0,h/2,0,w,h,d,C.wall,.018,g);box(0,h+.025,0,w+.045,.05,d+.045,C.trim,.012,g);walls.push(g);return g}
// Two north-facing windows each have a sill and a full-height header. The
// old continuous 1.75 m wall covered the glazing but left the top open.
for(const [a,b] of [[-.075,.42],[2.92,3.645],[6.195,BATH_EXTERIOR_X+.005]])wall((a+b)/2,-.07,b-a,.15,2.6);
for(const [a,b] of [[.42,2.92],[3.645,6.195]]){
  const x=(a+b)/2,w=b-a;
  wall(x,-.07,w,.15,.30);
  const header=new T.Group();header.position.set(x,0,-.07);root.add(header);
  box(0,2.25,0,w,.70,.15,C.wall,.018,header);
  box(0,2.625,0,w+.045,.05,.195,C.trim,.012,header);
  walls.push(header);
}
wall(-.07,3.9,.15,7.9,2.6);
named(wall(BATH_EXTERIOR_X,2.25,.15,4.5,2.6),'master-bath-exterior-wall');
// Fill the corner at the shower window: the adjoining wall bodies have
// different thicknesses and otherwise leave a visible notch in plan view.
named(wall(BATH_EXTERIOR_X,4.55,.15,.15,2.6),'bath-shower-corner');
named(wall(OUTER_X,SHOWER_CENTRE_Z,.13,SHOWER_LENGTH,2.6),'shower-outer-wall');
// Balcony elevation: the window sits between a lower wall and a solid
// header. Together the two solid portions occupy about two thirds of 2.6 m.
named(wall(OUTER_X,BALCONY_CENTRE_Z,.13,BALCONY_LENGTH,1.43),'balcony-parapet');
wall(OUTER_X,9.71,.13,1.02,.55);
const balconyEastWindow=new T.Group();balconyEastWindow.position.set(OUTER_X,0,BALCONY_CENTRE_Z);root.add(balconyEastWindow);
box(0,2.45,0,.13,.30,BALCONY_LENGTH,C.wall,.008,balconyEastWindow);
const balconyPane=new T.MeshPhysicalMaterial({color:'#bed8d9',transparent:true,opacity:.35,roughness:.10,depthWrite:false,side:T.DoubleSide});
// Viewed from inside the balcony: the high-Z/rightmost 20% is fixed.
const slidingWindows=[];
const windowHitMaterial=new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide});
function slidingWindow(parent,width,height,y,name,fixedFraction=0){
  const g=new T.Group();g.name=name;parent.add(g);
  const left=-width/2,right=width/2,split=right-width*fixedFraction;
  const movableWidth=split-left,leafWidth=movableWidth/2;
  const leaves=[];
  for(let i=0;i<2;i++){
    const leaf=new T.Group();leaf.name=name+'-leaf-'+i;leaf.position.z=left+leafWidth*(i+.5);g.add(leaf);
    const track=i===0?-.027:.027;
    box(track,y,0,.018,height-.02,leafWidth-.02,balconyPane,0,leaf);
    for(const z of [-leafWidth/2,leafWidth/2])box(track,y,z,.04,height,.025,'#43494a',0,leaf);
    for(const yy of [y-height/2,y+height/2])box(track,yy,0,.04,.025,leafWidth,'#43494a',0,leaf);
    box(track-.028,y,i===0?leafWidth/2-.045:-leafWidth/2+.045,.025,.14,.018,'#43494a',.003,leaf);
    leaves.push(leaf);
  }
  if(fixedFraction){
    named(box(0,y,(split+right)/2,.018,height-.02,right-split-.02,balconyPane,0,g),name+'-fixed-pane');
    box(0,y,split,.05,height,.03,'#43494a',0,g);
  }
  for(const z of [left,right])box(0,y,z,.065,height+.025,.035,'#43494a',0,g);
  for(const yy of [y-height/2,y+height/2])box(0,yy,0,.07,.035,width,'#43494a',0,g);
  named(box(-.07,y,0,.01,height,width,windowHitMaterial,0,g),name+'-hit-area');
  g.userData.slider={opens:[false,false],progress:[0,0],leaves,origins:leaves.map(l=>l.position.z),travel:leafWidth-.03,split};
  slidingWindows.push(g);return g;
}
slidingWindow(balconyEastWindow,BALCONY_LENGTH-.15,.82,1.865,'balcony-sliding-window',.20);
// Close the installation margins between the window frame and end walls.
for(const [i,sign] of [-1,1].entries())
  named(box(0,1.865,sign*(BALCONY_LENGTH/2-.04),.13,.90,.08,C.wall,0,balconyEastWindow),'balcony-window-end-jamb-'+i);
named(box(0,2.295,0,.07,.05,BALCONY_LENGTH-.15,'#43494a',0,balconyEastWindow),'balcony-window-header-seal');
walls.push(balconyEastWindow);
// The kitchen backsplash wall and the entrance enclosure reach the ceiling.
finishSection('exterior-before-entry');
const outerEnd=scaleX(6.475),doorEnd=entryX(102);
named(wall((doorEnd+outerEnd)/2,10.07,outerEnd-doorEnd,.15,2.6),'doorway-exterior-wall');
// The square entry projects from the TV-wall side. Its room-facing edge
// (x=0) is completely open to the dining area and kitchen passage.
wall((entryZero-.12825+scaleX(-.07))/2,7.85,scaleX(-.07)-(entryZero-.12825),.15,2.6); // shoe side turns into the TV exterior wall
named(wall(entryZero-.064125,8.96,.12825,2.23,2.6),'entry-side-wall'); // solid inner face of the square entry
wall(entryZero-.064125,10.07,.12825,.15,2.6); // short corner before the front door
// Door opening continues directly to the structural column. // long kitchen wall after the door
named(wall(entryX(153.5),9.775,1.03,.44,2.6),'entry-column');
finishSection('entry-walls','exact'); // solid column: door, column, then refrigerator
// Black pegboard on the room-facing upper third of the structural pillar.
const pegCenter=entryX(153.5),pegZ=9.532;
named(box(pegCenter,2.16,pegZ,.96,.86,.018,'#262a2a',.006),'entry-pegboard');
for(let row=0;row<8;row++)for(let col=0;col<10;col++){
  const hole=cyl(entryX(108)+col*.10,1.78+row*.105,pegZ-.012,.007,.001,'#151819');
  hole.rotation.x=Math.PI/2;hole.castShadow=false;hole.receiveShadow=false;
}
box(pegCenter,1.815,pegZ-.025,.70,.026,.03,'#171b1b',.003);
for(const x of [entryX(133),entryX(154),entryX(175)])rod([x,1.81,pegZ-.035],[x,1.68,pegZ-.065],.008,'#a2a7a1');
finishSection('entry-pegboard','exact');
// Youqingmen STRAUSS large bent-wood stool: rounded U profile, dark finish.
const stoolX=entryX(153.5),stoolZ=9.31,stoolColor='#242626';
named(box(stoolX,.435,stoolZ,.70,.055,.34,stoolColor,.027),'entry-bent-stool-top');
for(const x of [stoolX-.315,stoolX+.315])box(x,.225,stoolZ,.07,.42,.34,stoolColor,.025);
finishSection('entry-bent-stool','exact');
wall(6.16,9.635,.66,.87,2.6); // balcony-end column fills the recessed floor
// Interior walls use a full 2.6 m height; low-wall mode is display-only.
const ROOM_WALL_HEIGHT=2.6;
const interiorWalls=[];
function partition(x,z,w,d){const g=wall(x,z,w,d,ROOM_WALL_HEIGHT);g.userData.fullHeight=ROOM_WALL_HEIGHT;interiorWalls.push(g);return g}
// CAD's thick purple lines set the walls; its door arcs set the openings.
// In plan view model X runs downward and model Z runs from right to left.
partition(3.35,2.25,.14,4.5); // uninterrupted living wall ends at the marked master entry
partition((4.45+BATH_EXTERIOR_X)/2,3.65,BATH_EXTERIOR_X-4.45,.14); // extend to the relocated exterior wall
partition(4.45,4.125,.13,.75); // bathroom front wall, z 3.75–4.50
partition(5.14,5.55,1.38,.13); // one shared bath/child wall, x 4.45–5.83
partition(3.05,5.55,.8,.13); // short wall above the child door
partition(2.65,6.875,.13,2.65); // child-room wall along the dining area
partition(4.24,8.2,3.18,.13); // child-room wall along the kitchen
const childWindowZ=(5.55+.065+8.2-.065)/2;
partition(5.83,(SHAFT_END_Z+childWindowZ-.45)/2,.13,childWindowZ-.45-SHAFT_END_Z); // no overlapping face on the shaft; continue flush to the window
partition(5.83,(childWindowZ+.45+8.26)/2,.13,8.26-childWindowZ-.45); // jamb closes the child-room edge before balcony door
partition(5.83,9.595,.13,.95); // tiled return between balcony door and hob
const applianceDivider=partition(3.05,9.68,.13,.78); // shared kitchen/appliance wall
applianceDivider.children.forEach(part=>part.material=mat(C.wall));
// The solid service shaft touches the child-room corner. Beyond it, the
// shower projects as far as the outside edge of the utility balcony.
// The shaft's left face shares the exact outer plane of the adjoining wall.
const SHAFT_LEFT_FACE=5.83-.065;
const SHAFT_BATH_FACE_Z=5.55-.065; // flush with the adjoining bath/child wall, not 6.5 cm behind it
const serviceShaft=named(wall((SHAFT_LEFT_FACE+SHAFT_OUTER_X)/2,(SHAFT_BATH_FACE_Z+SHAFT_END_Z)/2,SHAFT_OUTER_X-SHAFT_LEFT_FACE,SHAFT_END_Z-SHAFT_BATH_FACE_Z,2.6),'service-shaft');
// The shaft is solid; its outer face already provides this wall. A second
// coplanar partition caused a seam and overlapping surfaces here.
// The bath-facing end is solid. The airtight end window belongs opposite
// it, at the kitchen/AC-platform end of the balcony.
named(partition(BATH_END_CENTRE,BALCONY_START_Z-.065,BATH_END_SPAN,.13),'balcony-bath-end-wall');
wall(END_CENTRE,9.20,END_SPAN,.13,1.43);
const balconySouthWindow=new T.Group();balconySouthWindow.position.set(END_CENTRE,0,9.20);root.add(balconySouthWindow);
box(0,2.45,0,END_SPAN,.30,.13,C.wall,.008,balconySouthWindow);
box(0,1.865,0,END_SPAN-.09,.82,.025,balconyPane,0,balconySouthWindow);
for(const x of [-END_SPAN/2+.02,END_SPAN/2-.02])box(x,1.865,0,.045,.87,.065,'#43494a',.002,balconySouthWindow);
for(const y of [1.455,2.275])box(0,y,0,END_SPAN-.04,.05,.07,'#43494a',.002,balconySouthWindow);
walls.push(balconySouthWindow);
// Full-height outward shower wall, aligned with the master-bedroom window
// elevation. The 60 x 90 cm window has a 120 cm sill and a 50 cm header.
const showerWindowWall=new T.Group();showerWindowWall.name='shower-window-wall';showerWindowWall.position.set(SHOWER_WINDOW_CENTRE,0,4.55);root.add(showerWindowWall);
box(0,.60,0,SHOWER_WINDOW_SPAN,1.20,.13,C.wall,.008,showerWindowWall);
box(0,2.35,0,SHOWER_WINDOW_SPAN,.50,.13,C.wall,.008,showerWindowWall);
const showerJamb=(SHOWER_WINDOW_SPAN-.60)/2;
for(const sign of [-1,1])box(sign*(.30+showerJamb/2),1.65,0,showerJamb,.90,.13,C.wall,.006,showerWindowWall);
const showerWindowGlass=new T.MeshPhysicalMaterial({color:'#a7c5c9',transparent:true,opacity:.48,roughness:.1,depthWrite:false,side:T.DoubleSide});
// The operable sash is built in world space below.
for(const x of [-.30,.30])box(x,1.65,0,.025,.90,.15,C.trim,.003,showerWindowWall);
for(const y of [1.20,2.10])box(0,y,0,.62,.035,.15,C.trim,.003,showerWindowWall);
walls.push(showerWindowWall);
// The floor finish plan locates this window at the kitchen end of the child
// room's balcony wall; the bath end remains a solid full-height wall.
const childWindow=new T.Group();childWindow.position.set(5.83,0,childWindowZ);root.add(childWindow);
box(0,.46,0,.13,.92,.90,C.wall,.008,childWindow);
box(0,2.36,0,.13,.48,.90,C.wall,.008,childWindow);
slidingWindow(childWindow,.90,1.20,1.55,'child-sliding-window');
walls.push(childWindow);interiorWalls.push(childWindow);
// The utility balcony retains its windows; glass door leaves and shower panels are removed.
const doorFrames=[];
function doorway(x,z,width,alongZ=true,frameColor='#261916'){const g=new T.Group();g.position.set(x,0,z);if(alongZ)g.rotation.y=Math.PI/2;root.add(g);const h=2.1;
for(const side of [-1,1])box(side*(width/2-.025),h/2,0,.05,h,.18,frameColor,.008,g);
box(0,h+.035,0,width,.07,.18,frameColor,.008,g);
box(0,(h+.07+ROOM_WALL_HEIGHT)/2,0,width,ROOM_WALL_HEIGHT-h-.07,.14,C.wall,.008,g);
doorFrames.push(g)}
// The marked master entrance crosses the short passage beside the bathroom.
// Its opening faces the passage, while the sofa-side wall remains continuous.
doorway(3.90,4.5,1.10,false);
doorway(4.45,5.025,1.05); // bathroom door, z 4.50–5.55
doorway(3.95,5.55,1.0,false); // child door, x 3.45–4.45 beside the bath
finishSection('partitions-and-doorframes');
doorway(entryX(51),10.07,1.02,false,'#454c57');
finishSection('front-door-frame','exact'); // kitchen-side wall, x -1.90 to -1.00
// The three interior leaves share the dark walnut finish and raised moulding
// seen in the reference photo. They rest open into their rooms, leaving the
// hall and the character's paths unobstructed.
const interiorDoors=[];
function walnutDoor(x,z,w,openAngle,closedAngle,vent=false){
  const g=new T.Group();g.position.set(x,0,z);g.rotation.y=openAngle;root.add(g);
  box(w/2,1.04,0,w-.035,2.06,.052,'#261916',.006,g);
  for(const face of [-1,1]){
    const depth=face*.031;
    for(const cx of [w*.27,w*.73])for(const [cy,h] of [[1.62,.58],[1.01,.49],...(vent?[]:[[.37,.46]])]){
      const pw=w*.37;
      box(cx,cy,depth,pw,h,.006,'#32211d',.002,g);
      for(const edge of [-1,1]){
        box(cx+edge*pw/2,cy,depth+face*.006,.010,h+.025,.009,'#5b4033',.002,g);
        box(cx,cy+edge*h/2,depth+face*.006,pw+.015,.010,.009,'#5b4033',.002,g);
      }
    }
    if(vent)for(const cx of [w*.27,w*.73])for(let i=0;i<8;i++){
      box(cx,.23+i*.054,depth+face*.006,w*.30,.018,.012,'#171313',.002,g);
      box(cx,.22+i*.054,depth+face*.011,w*.30,.006,.014,'#594035',.002,g);
    }
    ball(w-.12,1.02,depth+face*.04,.042,'#adb1ac',[1,.65,.42],g);
    rod([w-.12,1.02,depth+face*.055],[w-.28,1.02,depth+face*.055],.014,'#b9bdb7',g);
  }
  g.userData.door={openAngle,closedAngle,open:true,target:openAngle,autoNear:false};
  interiorDoors.push(g);doorFrames.push(g);
}
walnutDoor(3.38,4.5,1.04,.92,0);             // master bedroom
walnutDoor(4.45,5.52,.99,.25,Math.PI/2,true); // bathroom, with lower vents
walnutDoor(3.47,5.55,.95,-.85,0);            // second bedroom
finishSection('interior-door-leaves');
// A dark leaf pivots inward toward the small entry square.
const frontDoor=new T.Group();frontDoor.position.set(entryZero+.025,0,10.00);frontDoor.rotation.y=0;root.add(frontDoor);
box(.485,1.03,-.02,.97,2.04,.055,'#292b2b',.01,frontDoor);
box(.76,1.02,-.09,.13,.045,.025,C.metal,.01,frontDoor);
doorFrames.push(frontDoor);
finishSection('front-door-leaf','exact');
// The full door frame stays within the kitchen segment of the shared wall,
// past the child-room corner at z 8.20.
const balconyDoor=new T.Group();balconyDoor.position.set(5.83,0,8.68);balconyDoor.scale.z=.88;root.add(balconyDoor);
for(const z of [-.48,.48])box(0,1.12,z,.12,2.24,.07,'#24272a',.008,balconyDoor);
box(-.092,1.12,-.49,.045,2.24,.105,'#151b1d',.003,balconyDoor);
box(-.092,2.20,0,.045,.085,1.08,'#151b1d',.003,balconyDoor);
box(0,2.20,0,.12,.10,1.02,'#24272a',.008,balconyDoor);
box(0,2.425,0,.14,.35,1.02,C.wall,.008,balconyDoor);
box(0,.045,0,.15,.09,1.02,'#24272a',.005,balconyDoor);
// Keep the architectural opening and header while removing the glass door.
doorFrames.push(balconyDoor);
// Window frames and sheer curtain folds at the two north windows.
const curtains=new T.Group();curtains.name='living-white-sheer';root.add(curtains);
const sheerMaterial=new T.MeshStandardMaterial({color:'#ffffff',transparent:true,opacity:.52,roughness:1,depthWrite:false,side:T.DoubleSide});
const masterBlinds=new T.Group();masterBlinds.name='master-light-grey-blinds';root.add(masterBlinds);
function windowAt(x,w,living){
  box(x,1.1,.015,w,1.6,.075,'#607779',.015);
  box(x,1.12,.062,w-.12,1.38,.018,new T.MeshStandardMaterial({color:'#b9d3d1',roughness:.25,emissive:'#9dbabc',emissiveIntensity:.2}));
  box(x,1.13,.083,.035,1.38,.025,C.dark);box(x,.53,.083,w,.035,.025,C.dark);
  if(living){
    // Connected pleated fabric instead of opaque rods.
    const vertices=[],indices=[],folds=56;
    for(let i=0;i<=folds;i++){
      const xx=x-w/2+i*w/folds,zz=.18+.035*Math.cos(i*Math.PI/2);
      vertices.push(xx,.23,zz,xx,1.91,zz);
      if(i<folds){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2)}
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
    const fabric=new T.Mesh(geo,sheerMaterial);fabric.name='living-sheer-fabric';curtains.add(fabric);
    box(x,1.95,.16,w+.14,.06,.1,'#ffffff',.02);
  }else{
    box(x,1.88,.17,w,.055,.10,'#c8cace',.008,masterBlinds);
    for(let i=0;i<25;i++){
      const slat=box(x,.44+i*.056,.18,w-.055,.014,.065,'#c8cace',.004,masterBlinds);slat.rotation.x=-.25;
    }
    for(const xx of [x-w*.3,x+w*.3])box(xx,1.13,.205,.008,1.42,.006,'#b9bdc1',0,masterBlinds);
  }
}
windowAt(1.67,2.5,true);windowAt(4.92,2.55,false);
finishSection('balcony-door-and-north-windows');
// Living area: the continuous pale oak remains visible around the seating.
box(.23,.4,2.25,.44,.42,3.2,C.navy,.035);box(.465,.42,1.2,.025,.26,.75,C.white,.008);box(.465,.42,3.25,.025,.26,.75,C.white,.008);box(.465,.42,2.23,.03,.16,.95,C.dark);box(.24,.64,2.28,.43,.045,3.32,C.navy,.014);
box(.15,1.18,2.1,.095,.93,1.65,'#293b3e',.022);const tvMat=new T.MeshStandardMaterial({color:'#60878b',emissive:'#496b70',emissiveIntensity:.45,roughness:.28});box(.204,1.18,2.1,.012,.83,1.54,tvMat,.009);const tvArt=new T.Group();root.add(tvArt);box(.215,1.18,2.1,.007,.055,.9,'#cadcc8',.002,tvArt);box(.216,1.37,2.1,.006,.11,.41,'#d2d9ad',.01,tvArt);box(.216,1.06,2.1,.006,.04,.65,'#9cb9ac',0,tvArt);
const tvTexture=new T.TextureLoader().load('./assets/tv-picture.webp');
tvTexture.colorSpace=T.SRGBColorSpace;
const newsPanel=new T.Mesh(new T.PlaneGeometry(1.52,.77),new T.MeshBasicMaterial({map:tvTexture,side:T.DoubleSide}));
newsPanel.rotation.y=Math.PI/2;newsPanel.position.set(.224,1.18,2.1);newsPanel.visible=false;root.add(newsPanel);
tvArt.visible=false;tvMat.color.set('#141b20');tvMat.emissiveIntensity=0;
function showNews(on){tv=on;tvMat.color.set(on?'#ffffff':'#141b20');tvMat.emissiveIntensity=on?.45:0;tvArt.visible=false;newsPanel.visible=on;}
box(.36,.7,2.1,.13,.09,1.0,C.dark,.025);box(.27,.83,3.36,.13,.35,.19,'#f4f2e8',.026);box(.272,.83,3.25,.10,.34,.018,'#293b3e');box(.32,.72,1.03,.13,.16,.24,'#263f43',.013);box(.32,.72,.885,.14,.17,.07,'#60a7a6',.02);box(.32,.72,1.175,.14,.17,.07,'#ca7064',.02);
finishSection('television-and-console','translate',furnitureShift.tv);
// BoConcept Bergamo three-seater: a 2.5 m straight profile, one long seat,
// three loose back cushions, broad squared arms and low dark feet.
const sofaFabric='#a6a7a5',sofaSeat='#b5b6b4',sofaShade='#969896';
for(const x of [2.37,2.98])for(const z of [.98,3.08])box(x,.065,z,.055,.13,.055,'#292d2e',.008);
box(2.67,.245,2.03,.91,.32,2.5,sofaShade,.075);
box(2.54,.465,2.03,.68,.22,2.06,sofaSeat,.075);
box(3.00,.64,2.03,.22,.69,2.08,sofaFabric,.065);
for(const z of [.85,3.21])box(2.67,.55,z,.91,.70,.16,sofaFabric,.055);
for(let i=0;i<3;i++){let p=box(2.91,.79,1.36+i*.67,.24,.50,.62,sofaSeat,.065);p.rotation.z=-.07}
finishSection('sofa','translate',furnitureShift.sofa);
// The living room has open floor space in front of the sofa: no coffee table.
// Keep the living room clear of the former standing lamp and plants.
// The supplied black-and-white print faces the peninsula on the continuous
// living/dining wall. Its earlier decorative panel has been removed.
box(.035,1.39,6.78,.046,1.09,.79,'#e7e7e4',.004);
const artTexture=new T.TextureLoader().load('./assets/black-white-art.jpg');artTexture.colorSpace=T.SRGBColorSpace;
const print=new T.Mesh(new T.PlaneGeometry(.75,1.04),new T.MeshBasicMaterial({map:artTexture,side:T.DoubleSide}));
print.rotation.y=Math.PI/2;print.position.set(.061,1.39,6.78);root.add(print);
finishSection('black-white-art','translate',furnitureShift.tv);
// Dining table, curved backs, oak seats and peninsula with oven niches.
function chair(x,z){for(let dx of [-.20,.20])for(let dz of [-.20,.20])rod([x+dx*1.2,.07,z+dz*1.2],[x+dx,.49,z+dz],.027,C.wood);box(x,.49,z,.49,.08,.48,'#c6c5af',.07);const back=box(x-.21,.78,z,.075,.34,.5,C.woodlight,.05);rod([x-.20,.61,z-.23],[x+.18,.68,z-.23],.023,C.woodlight);rod([x-.20,.61,z+.23],[x+.18,.68,z+.23],.023,C.woodlight)}
// Move the 135 × 75 cm table toward the child-room wall, aligning that edge
// with the island while preserving their existing alignment along Z.
box(2.22,.76,6.30,.75,.12,1.35,C.woodlight,.10);
box(2.22,.39,6.30,.52,.69,.76,'#c8b493',.12);
chair(1.41,5.94);chair(1.41,6.63);
// A 1.39 m island runs across the dining/kitchen axis, with its right end
// against the bedroom-side wall and circulation to its left.
// Oven and open shelf face the entry; three drawers occupy the right end.
const peninsula=new T.Group();peninsula.position.set(1.94,0,7.30);root.add(peninsula);
box(0,.44,0,1.34,.85,.59,C.cab,.03,peninsula);box(0,.89,0,1.42,.075,.68,'#303237',.028,peninsula);
box(-.38,.55,.314,.46,.38,.024,'#303e3d',0,peninsula);
box(-.38,.54,.34,.38,.29,.05,'#e1dfcf',.02,peninsula);
box(-.38,.54,.37,.29,.19,.006,'#697877',0,peninsula);
box(-.38,.65,.387,.25,.018,.025,C.metal,0,peninsula);
box(.095,.55,.314,.43,.38,.024,'#303e3d',0,peninsula);
for(const yy of [.22,.49,.71]){box(.5,yy,.31,.30,.21,.025,'#b5aa91',.009,peninsula);box(.5,yy+.065,.33,.20,.013,.017,C.dark,0,peninsula)}
finishSection('dining-and-island','exact');
// Keep the second-bedroom boundary clear of the former tall wardrobe block.
// Master bedroom: bed only, with the headboard against the exterior wall.
box(5.31,.08,1.64,2.28,.06,2.6,'#c7cbbb',.06);
finishSection('master-rug');
box(6.34,.54,1.64,.16,.94,2.05,'#b0ad98',.08);
box(5.44,.29,1.64,1.85,.35,1.94,C.wood,.045);
box(5.44,.52,1.64,1.90,.22,1.95,C.white,.08);
box(5.13,.67,1.64,1.25,.15,1.94,C.bed,.075);
for(const z of [1.12,2.15]){const pillow=box(6.04,.70,z,.45,.17,.71,'#f3ecda',.07);pillow.rotation.z=-.04}
box(4.74,.77,1.64,.33,.07,1.95,'#8ea48d',.03);
finishSection('main-bed','translate',furnitureShift.mainBed);
// Bathroom tiled floor, basin, mirror, toilet and open shower area.
const bathFloorStart=4.445,bathFloorEnd=BATH_EXTERIOR_X-.075;
const bathFloorNear=3.65,bathFloorFar=5.55,bathFloorMiddle=(bathFloorNear+bathFloorFar)/2,bathFloorDepth=bathFloorFar-bathFloorNear;
function bathFloorTiles(x0,x1,z0,z1){
  named(box((x0+x1)/2,.07,(z0+z1)/2,x1-x0,.06,z1-z0,'#55585b'),'bath-tile-floor-surface');
  // Shared origin and spacing keep the wet and dry grout aligned.
  for(let x=4.5+Math.ceil((x0-4.5)/.32)*.32;x<x1;x+=.32)
    box(x,.105,(z0+z1)/2,.01,.004,z1-z0,'#777b7c');
  for(let z=3.65+Math.ceil((z0-3.65)/.32)*.32;z<z1;z+=.32)
    box((x0+x1)/2,.105,z,x1-x0,.004,.01,'#777b7c');
}
bathFloorTiles(bathFloorStart,bathFloorEnd,bathFloorNear,bathFloorFar);
finishSection('bath-floor');box(4.73,.42,4.1,.57,.63,.60,C.woodlight,.035);box(4.73,.77,4.1,.62,.10,.64,'#45474b',.03);ball(4.73,.827,4.1,.21,C.white,[1,.12,1]);rod([4.73,.83,3.88],[4.73,1,3.88],.025,C.metal);rod([4.73,1,3.88],[4.73,1,4.0],.025,C.metal);box(4.73,1.27,3.76,.54,.7,.035,'#859e9c',.02);finishSection('basin','translate',furnitureShift.basin);box(5.76,.53,3.98,.47,.76,.23,C.white,.07);ball(5.76,.40,4.33,.28,C.white,[.78,.7,1.15]);ball(5.76,.57,4.33,.22,'#d3ddd4',[.83,.15,1.14]);
finishSection('toilet','translate',furnitureShift.toilet);
// Shower floor follows the walls; the glass enclosure is installed below.
bathFloorTiles(bathFloorEnd,OUTER_X,4.615,BALCONY_START_Z-.065);
bathFloorTiles(SHAFT_OUTER_X,bathFloorEnd,5.55,BALCONY_START_Z-.065);
finishSection('shower-floor');
// Confirmed world-space floor points. Long glass runs along Z,
// parallel to the exterior wall; only the fixed return runs along X.
const showerPoints={P1:{x:5.873625,y:.10,z:5.485},P3:{x:6.109975,y:.10,z:4.625},C:{x:5.873625,y:.10,z:4.625},H:{x:5.873625,y:.10,z:4.840}};
const {P1:showerP1,P3:showerP3,C:showerC,H:showerH}=showerPoints;
const showerGlass=new T.MeshPhysicalMaterial({color:'#d8e6e5',transparent:true,opacity:.24,roughness:.08,metalness:0,depthWrite:false,side:T.DoubleSide});
const glassMetal='#151b1c',glassSeal='#969c9d',glassBase=showerH.y,glassMiddle=glassBase+1;
const showerDoorWidth=showerP1.z-showerH.z;
const showerFixed=new T.Group();showerFixed.name='shower-fixed-glass';root.add(showerFixed);
named(box(showerC.x,glassMiddle,(showerH.z+showerC.z)/2,.01,2,showerH.z-showerC.z,showerGlass,0,showerFixed),'shower-fixed-long-pane');
named(box((showerC.x+showerP3.x)/2,glassMiddle,showerC.z,showerP3.x-showerC.x,2,.01,showerGlass,0,showerFixed),'shower-fixed-return-pane');
// Slim vertical and bottom edges only. No overhead rails or top surfaces.
for(const p of [showerH,showerC,showerP3])box(p.x,glassMiddle,p.z,.009,2,.009,glassMetal,0,showerFixed);
box(showerC.x,glassBase+.005,(showerH.z+showerC.z)/2,.009,.01,showerH.z-showerC.z,glassMetal,0,showerFixed);
box((showerC.x+showerP3.x)/2,glassBase+.005,showerC.z,showerP3.x-showerC.x,.01,.009,glassMetal,0,showerFixed);
const showerDoor=new T.Group();showerDoor.name='shower-door';showerDoor.position.set(showerH.x,0,showerH.z);root.add(showerDoor);
named(box(0,glassMiddle,showerDoorWidth/2,.01,2,showerDoorWidth,showerGlass,0,showerDoor),'shower-door-pane');
for(const z of [0,showerDoorWidth])box(0,glassMiddle,z,.009,2,.009,glassMetal,0,showerDoor);
box(0,glassBase+.005,showerDoorWidth/2,.009,.01,showerDoorWidth,glassMetal,0,showerDoor);
for(const y of [.65,1.65])box(0,y,0,.022,.045,.022,glassMetal,.003,showerDoor);
rod([-.015,1.08,showerDoorWidth-.13],[-.075,1.08,showerDoorWidth-.13],.008,glassMetal,showerDoor);
rod([-.075,.98,showerDoorWidth-.13],[-.075,1.18,showerDoorWidth-.13],.008,glassMetal,showerDoor);
// A 1 cm free-edge seal sits on P1 and meets the shaft corner when closed.
named(box(0,glassMiddle,showerDoorWidth,.014,2,.01,glassSeal,0,showerDoor),'shower-door-wall-seal');
showerDoor.userData.door={open:false,target:0,closedAngle:0,openAngle:Math.PI/2};
finishSection('shower-glass','exact');
doorFrames.push(showerFixed,showerDoor);
// Outward-opening bathroom casement, preserving the existing wall aperture.
const bathWindow=new T.Group();bathWindow.name='bath-window';
const bathWindowWidth=.57*X_SCALE;
bathWindow.position.set(scaleX(SHOWER_WINDOW_CENTRE-.285),0,4.55);root.add(bathWindow);
named(box(bathWindowWidth/2,1.65,0,bathWindowWidth,.86,.018,showerWindowGlass,0,bathWindow),'bath-window-pane');
for(const x of [0,bathWindowWidth])box(x,1.65,0,.015,.89,.028,C.trim,0,bathWindow);
for(const y of [1.205,2.095])box(bathWindowWidth/2,y,0,bathWindowWidth,.015,.028,C.trim,0,bathWindow);
rod([bathWindowWidth-.045,1.59,.025],[bathWindowWidth-.045,1.71,.025],.008,C.metal,bathWindow);
bathWindow.userData.door={open:false,target:0,closedAngle:0,openAngle:Math.PI/2};
const bathWindowHit=named(box(scaleX(SHOWER_WINDOW_CENTRE),1.65,4.55,.60*X_SCALE,.90,.012,windowHitMaterial),'bath-window-hit-area');
bathWindowHit.userData.windowTarget=bathWindow;
finishSection('bath-window-sash','exact');doorFrames.push(bathWindow);
// Mount on the solid end wall opposite the shower window, outside the door arc.
const showerHeadX=(SHAFT_OUTER_X+OUTER_X-.065)/2,showerHeadZ=BALCONY_START_Z-.13-.035;
rod([showerHeadX,.13,showerHeadZ],[showerHeadX,1.60,showerHeadZ],.02,C.metal);
rod([showerHeadX,1.60,showerHeadZ],[showerHeadX,1.60,showerHeadZ-.20],.02,C.metal);
cyl(showerHeadX,1.58,showerHeadZ-.20,.085,.03,C.metal);
finishSection('shower-fixtures');
// Bathroom interior cladding, matching the reference's charcoal stone
// tiles with warm white veins and light 60 x 30 cm rectangular grout lines.
const bathTileCanvas=document.createElement('canvas');bathTileCanvas.width=1024;bathTileCanvas.height=512;
const bathCtx=bathTileCanvas.getContext('2d');
let bathSeed=7396;const bathRand=()=>((bathSeed=(bathSeed*1664525+1013904223)>>>0)/4294967296);
for(let variant=0;variant<4;variant++){
  const ox=(variant%2)*512,oy=Math.floor(variant/2)*256;
  bathCtx.fillStyle=['#363832','#3b3c36','#32362f','#3a3b34'][variant];bathCtx.fillRect(ox,oy,512,256);
  for(let i=0;i<10000;i++){bathCtx.fillStyle=i%2?'rgba(188,185,162,.045)':'rgba(17,22,18,.10)';bathCtx.fillRect(ox+bathRand()*511,oy+bathRand()*255,.5+bathRand()*2,.5+bathRand()*2)}
  for(let vein=0;vein<14;vein++){
    const points=[],vertical=vein%3===0;let x=vertical?bathRand()*512:0,y=vertical?0:bathRand()*256;const slope=(bathRand()-.5)*.65;
    points.push([x,y]);
    for(let step=0;step<70;step++){x+=vertical?(bathRand()-.5)*19:8;y+=vertical?8:slope*8+(bathRand()-.5)*17;if(x<1||x>511||y<1||y>255)break;points.push([x,y])}
    if(points.length<3)continue;
    for(const [width,col] of [[vein<3?3.1:1.2,'rgba(201,194,169,.20)'],[vein<3?1.35:.5,vein<3?'rgba(226,219,192,.86)':'rgba(190,187,165,.43)']]){
      bathCtx.beginPath();bathCtx.moveTo(ox+points[0][0],oy+points[0][1]);
      for(const p of points.slice(1))bathCtx.lineTo(ox+p[0],oy+p[1]);bathCtx.lineWidth=width;bathCtx.strokeStyle=col;bathCtx.stroke();
    }
    if(vein<9){const p=points[Math.floor(points.length*(.25+bathRand()*.5))];bathCtx.beginPath();bathCtx.moveTo(ox+p[0],oy+p[1]);bathCtx.lineTo(ox+Math.min(510,p[0]+24),oy+Math.max(2,Math.min(254,p[1]-38)));bathCtx.lineTo(ox+Math.min(510,p[0]+55),oy+Math.max(2,Math.min(254,p[1]-58)));bathCtx.strokeStyle='rgba(211,204,179,.56)';bathCtx.lineWidth=.7;bathCtx.stroke()}
  }
}
const bathTileTexture=new T.CanvasTexture(bathTileCanvas);bathTileTexture.colorSpace=T.SRGBColorSpace;
const bathTileMaterial=new T.MeshStandardMaterial({map:bathTileTexture,roughness:.48,metalness:0,side:T.DoubleSide});
const bathGroutMaterial=new T.MeshStandardMaterial({color:'#918e80',roughness:.85,side:T.DoubleSide});
function bathWallFace(axis,plane,a,b,lo,hi,facing,name){
  if(b-a<.005||hi-lo<.005)return;
  const group=new T.Group();group.name=name;root.add(group);
  const addPlane=(center,y,width,height,material,offset)=>{
    const mesh=new T.Mesh(new T.PlaneGeometry(width,height),material);
    if(axis==='x'){mesh.rotation.y=facing*Math.PI/2;mesh.position.set(plane+facing*offset,y,center)}
    else{if(facing<0)mesh.rotation.y=Math.PI;mesh.position.set(center,y,plane+facing*offset)}
    mesh.receiveShadow=true;group.add(mesh);return mesh;
  };
  addPlane((a+b)/2,(lo+hi)/2,b-a,hi-lo,bathGroutMaterial,.001);
  for(let i=Math.floor(a/.60);i*.60<b;i++){
    const left=Math.max(a,i*.60),right=Math.min(b,(i+1)*.60);
    for(let j=Math.floor((lo-.10)/.30);.10+j*.30<hi;j++){
      const bottom=Math.max(lo,.10+j*.30),top=Math.min(hi,.10+(j+1)*.30);
      const w=right-left-.002,h=top-bottom-.002;if(w<.001||h<.001)continue;
      const mesh=addPlane((left+right)/2,(bottom+top)/2,w,h,bathTileMaterial,.003);
      const uv=mesh.geometry.attributes.uv,variant=((i+j)%4+4)%4;
      for(let k=0;k<uv.count;k++)uv.setXY(k,(variant%2)*.5+uv.getX(k)*.5*w/.60,Math.floor(variant/2)*.5+uv.getY(k)*.5*h/.30);
      uv.needsUpdate=true;
    }
  }
}
const bathLeft=scaleX(4.515),bathRight=scaleX(BATH_EXTERIOR_X-.075),showerRight=scaleX(OUTER_X-.065);
bathWallFace('z',3.72,bathLeft,bathRight,.10,2.6,1,'bath-tile-master-wall');
bathWallFace('x',bathLeft,3.72,4.50,.10,2.6,1,'bath-tile-entry-wall');
bathWallFace('x',bathLeft,4.50,5.485,2.20,2.6,1,'bath-tile-door-header');
bathWallFace('x',bathRight,3.72,4.625,.10,2.6,-1,'bath-tile-toilet-wall');
bathWallFace('z',SHAFT_BATH_FACE_Z,bathLeft,showerP1.x,.10,2.6,-1,'bath-tile-child-and-shaft-wall');
bathWallFace('x',showerP1.x,SHAFT_BATH_FACE_Z,6.10,.10,2.6,1,'bath-tile-shaft-side');
bathWallFace('x',showerRight,4.615,6.10,.10,2.6,-1,'bath-tile-shower-exterior-wall');
bathWallFace('z',6.10,showerP1.x,showerRight,.10,2.6,-1,'bath-tile-shower-end-wall');
const windowLeft=scaleX(SHOWER_WINDOW_CENTRE-.30),windowRight=scaleX(SHOWER_WINDOW_CENTRE+.30),windowWallLeft=scaleX(BATH_EXTERIOR_X+.075);
bathWallFace('z',4.615,windowWallLeft,showerRight,.10,1.20,1,'bath-tile-window-sill');
bathWallFace('z',4.615,windowWallLeft,showerRight,2.10,2.6,1,'bath-tile-window-header');
bathWallFace('z',4.615,windowWallLeft,windowLeft,1.20,2.10,1,'bath-tile-window-left-jamb');
bathWallFace('z',4.615,windowRight,showerRight,1.20,2.10,1,'bath-tile-window-right-jamb');
bathWallFace('x',windowWallLeft,4.55,4.625,.10,2.6,1,'bath-tile-corner-side');
bathWallFace('z',4.625,bathRight,windowWallLeft,.10,2.6,1,'bath-tile-corner-end');
finishSection('bath-wall-finishes','exact');walls.push(root.getObjectByName('bath-wall-finishes'));
// Child room: only the bed; the headboard faces the opposite kitchen-side wall.
box(5.12,.25,7.00,1.1,.35,1.95,C.wood,.06);
box(5.12,.51,7.00,1.1,.20,1.94,C.white,.055);
box(5.12,.67,6.73,1.11,.13,1.48,'#c0ccbd',.05);
box(5.12,.70,7.76,.72,.18,.37,'#f0dfb7',.07);
box(5.12,.46,8.08,1.13,.55,.11,C.woodlight,.03);
box(5.12,.765,6.40,1.12,.04,.36,'#8fa8a0',.02);
finishSection('child-bed','translate',furnitureShift.childBed);
// Kitchen and appliances. The refrigerator-side built-in is a separate tall
// unit: overhead doors, open display shelf, appliance counter and microwave.
// Appliance cabinet is rebuilt below at its specified 105 × 50 cm size.
// White marble is a 6 mm surface on the existing walls, in 60 x 120 cm
// portrait courses. It does not change the kitchen's footprint.
const marbleCanvas=document.createElement('canvas');marbleCanvas.width=256;marbleCanvas.height=512;
const mctx=marbleCanvas.getContext('2d');mctx.fillStyle='#f4f4f1';mctx.fillRect(0,0,256,512);
for(let i=0;i<16;i++){mctx.beginPath();mctx.moveTo(-30+i*23,-30);mctx.bezierCurveTo(80+i*12,140,40+i*15,290,280+i*5,540);mctx.strokeStyle=i%3?'rgba(137,143,145,.12)':'rgba(116,124,128,.23)';mctx.lineWidth=i%3?1:2;mctx.stroke()}
const marbleTexture=new T.CanvasTexture(marbleCanvas);marbleTexture.colorSpace=T.SRGBColorSpace;
const marble=new T.MeshStandardMaterial({map:marbleTexture,roughness:.27});
for(let x=2.65;x<5.83;x+=.6){const w=Math.min(.6,5.83-x);for(let y=0;y<2.6;y+=1.2){const h=Math.min(1.2,2.6-y);box(x+w/2,y+h/2,8.269,w-.005,h-.005,.006,marble)}}
for(const [z0,z1] of [[7.90,8.12],[9.12,10.07]])for(let z=z0;z<z1;z+=.6){const d=Math.min(.6,z1-z);for(let y=0;y<2.6;y+=1.2){const h=Math.min(1.2,2.6-y);box(5.761,y+h/2,z+d/2,.006,h-.005,d-.005,marble)}}
finishSection('kitchen-wall-finishes');
// Fitted cabinets span the two inner wall faces, not a stretched appliance.
const kitchenW=kitchenEnd-kitchenStart,kitchenX=(kitchenStart+kitchenEnd)/2;
const blackGlass=new T.MeshPhysicalMaterial({color:'#101719',metalness:.12,roughness:.08,clearcoat:1,clearcoatRoughness:.06});
box(kitchenX,1.275,9.989,kitchenW,.68,.006,blackGlass);
named(box(kitchenX,2.11,9.73,kitchenW,.98,.53,'#f3f4f1',.008),'kitchen-upper');
named(box(kitchenX,.45,9.69,kitchenW,.83,.61,'#463b34',.012),'kitchen-base');
named(box(kitchenX,.89,9.645,kitchenW,.07,.70,'#eeefec',.012),'kitchen-counter');
for(let i=0;i<4;i++){
  const w=kitchenW/4,x=kitchenStart+w*(i+.5);
  box(x,2.11,9.458,w-.014,.955,.012,'#fbfbf9',.003);
  box(x,.46,9.376,w-.014,.70,.018,'#40352e',.004);
  box(x,.73,9.36,Math.min(.40,w-.06),.025,.025,'#aeb4b1');
}
box(stoveX,1.594,9.45,.73,.055,.36,'#b7bdba',.005);
box(stoveX,1.562,9.36,.43,.009,.03,'#626b6b');
for(let i=0;i<96;i++){const x=kitchenStart+.01+(i*.437%(kitchenW-.02)),z=9.31+(i*.173%.67);box(x,.928,z,.008,.001,.005,i%3?'#d6d8d5':'#c5c9c7')}
named(box(sinkX,.945,9.61,.72,.035,.43,C.metal,.07),'kitchen-sink');
box(sinkX,.967,9.61,.59,.025,.32,'#a7b9b3',.06);
rod([sinkX,.96,9.86],[sinkX,1.25,9.86],.022,C.metal);rod([sinkX,1.25,9.86],[sinkX,1.25,9.65],.022,C.metal);
named(box(stoveX,.948,9.60,.65,.04,.44,'#283c3e',.025),'kitchen-hob');
for(const x of [stoveX-.18,stoveX+.17]){cyl(x,.984,9.59,.12,.02,C.metal);cyl(x,1,9.59,.08,.023,'#253b3b')}
finishSection('fitted-kitchen','exact');
// 105 cm appliance cabinet; white fronts and wall-grey carcass. The dark
// counter uses the same material as the island. Rear face is flush to wall.
const lightCabinet=C.wall,cabinetFace='#f2f1ec';
const ax=entryX(325.5),aw=1.05,az=9.745,ad=.50,al=entryX(273),ar=entryX(378);
for(const x of [al+.0175,ar-.0175])box(x,1.30,az,.035,2.60,ad,lightCabinet,.004);
box(ax,2.575,az,aw,.05,ad,lightCabinet,.004);
box(ax,.45,az,aw-.07,.83,ad-.02,lightCabinet,.012);
const mainW=.80,shelfW=.18,mainX=al+.035+mainW/2,shelfX=ar-.035-shelfW/2;
box(mainX,2.30,az,mainW,.55,ad-.02,lightCabinet,.004);
for(const x of [mainX-mainW/4,mainX+mainW/4])box(x,2.30,9.505,mainW/2-.016,.52,.018,cabinetFace,.003);
for(const y of [1.79,2.06,2.33])box(shelfX,y,az,shelfW,.026,ad-.02,lightCabinet,.003);
box(shelfX,2.09,9.985,shelfW,.60,.02,lightCabinet);
box(al+.035+mainW+.009,1.89,az,.018,.25,ad-.02,lightCabinet);
for(const y of [1.77,2.01])box(mainX,y,az,mainW,.03,ad-.02,lightCabinet);
box(mainX,1.88,9.985,mainW,.20,.02,lightCabinet);
box(ax,1.49,9.99,aw-.07,.51,.01,lightCabinet);
box(mainX,1.745,9.56,mainW,.018,.055,'#e8e9e3');
named(box(ax,1.20,az,aw,.06,ad,'#303237',.007),'appliance-counter');
const drawerW=.35,drawerX=al+.035+drawerW/2,ovenX=ar-.035-.61/2;
box(al+.035+drawerW+.014,.60,az,.028,1.16,ad-.02,lightCabinet);
box(ovenX,.87,9.52,.55,.42,.04,'#202b2f',.008);
box(ovenX-.02,.88,9.499,.43,.27,.002,'#606d71',.004);
box(ovenX+.225,.87,9.497,.025,.31,.002,'#aeb6b3');
box(ovenX,.59,az,.61,.04,ad-.02,lightCabinet);
box(ovenX,.10,az,.61,.035,ad-.02,lightCabinet);
box(ovenX,.26,9.745,.43,.26,.44,'#343b3b',.03);
for(const y of [.92,.67,.42,.17]){box(drawerX,y,9.504,drawerW-.015,.21,.018,cabinetFace,.004);box(drawerX,y+.045,9.495,.26,.012,.002,'#d8dad7')}
finishSection('appliance-cabinet','exact');
// Exact Panasonic envelope: 65 × 70 × 183 cm, with no scaled appliance.
const fx=entryX(239.5),fz=9.645;
// Put each front face outside the cabinet box. Coplanar faces flicker as
// the camera moves, especially on mobile GPUs.
const fridgeFrontZ=fz-.70/2-.012;
const fridgeSilver=new T.MeshStandardMaterial({color:'#777d81',metalness:.72,roughness:.20});
const fridgeGraphite=new T.MeshStandardMaterial({color:'#45494c',metalness:.66,roughness:.21});
named(box(fx,.96,fz,.65,1.83,.70,'#36393c',.025),'fridge-body');
for(const [x,m] of [[fx-.16,fridgeSilver],[fx+.16,fridgeGraphite]]){
  box(x,1.415,fridgeFrontZ,.305,.86,.006,m,.004);
  box(x,.86,fridgeFrontZ,.305,.20,.006,m,.004);
}
box(fx,.56,fridgeFrontZ,.63,.36,.006,fridgeGraphite,.004);
box(fx,.21,fridgeFrontZ,.63,.31,.006,fridgeGraphite,.004);
for(const y of [.745,.365])box(fx,y,fridgeFrontZ-.005,.61,.018,.002,'#242729');
box(fx+.01,1.36,fridgeFrontZ-.005,.003,.10,.001,'#a5a9aa');
named(box(fx,2.24,fz,.65,.65,.70,lightCabinet,.012),'fridge-upper-carcass');
for(const [i,x] of [fx-.16,fx+.16].entries())named(cabinetFront(box(x,2.24,fridgeFrontZ,.305,.61,.006,cabinetFace,.003)),`fridge-upper-door-${i}`);
finishSection('fridge-and-upper','exact');
// Keep the specified 70 cm depth while clearing the exterior wall's face.
root.getObjectByName('fridge-and-upper').position.z=-.012;
// Full-width entry cabinet from the door-side corner to the dining return.
// The reference has three upper doors, a lit display niche, one row of three
// shallow drawers, three lower doors, and a continuous shoe void at the floor.
const entryFace='#f2f2ef',entryDark='#303838';
const entryCenter=entryZero+.625,entryZ=8.10,entryW=1.25,entryD=.35;
const entryFrontZ=entryZ+entryD/2+.012;
const entryLeft=entryCenter-entryW/2,entryCol=entryW/3;
const entryDoorXs=[0,1,2].map(i=>entryLeft+entryCol*(i+.5));
const entryDoorW=entryCol-.018;
// The broad end panel closes the right side; a second co-planar upright
// there caused the intermittent stripe at the cabinet/panel junction.
box(entryLeft+.0175,1.30,entryZ,.035,2.60,entryD,entryDark,.006);
box(entryCenter,2.585,entryZ,entryW,.03,entryD,entryDark);
// The upper carcass and three equally spaced doors reach the ceiling.
named(box(entryCenter,2.035,entryZ,entryW,1.07,entryD,'#626866'),'entry-upper-carcass');
for(const [i,x] of entryDoorXs.entries())named(cabinetFront(box(x,2.035,entryFrontZ,entryDoorW,1.055,.018,entryFace,.004)),`entry-upper-door-${i}`);
box(entryCenter,1.48,entryZ,entryW,.035,entryD,'#e2d3a9');
for(const x of [entryLeft+.18,entryCenter+entryW/2-.18])cyl(x,1.452,8.17,.035,.015,'#fff0cd');
// Keep the display niche open and extend every shelf to the end panel.
box(entryCenter,1.25,7.937,entryW-.06,.42,.016,'#69716e');
// A single white maneki-neko in the open niche: pink ears and nose, raised
// left paw, red collar, and a small brass bell echo the supplied photograph.
const cat=new T.Group();cat.name='entry-maneki-neko';cat.position.set(entryCenter,1.05,entryZ+.065);root.add(cat);
const porcelain='#f9f7f2',rose='#dc6973',red='#bf353d',gold='#c6a249',ink='#263039';
ball(0,.14,0,.105,porcelain,[.82,1.12,.82],cat);
ball(0,.275,.005,.09,porcelain,[1,.90,.90],cat);
for(const x of [-.056,.056]){
  const ear=ball(x,.348,-.006,.032,porcelain,[.80,1.18,.65],cat);
  ear.rotation.z=x<0?-.30:.30;
  ball(x,.351,.016,.018,rose,[.73,1,.35],cat);
  ball(x*.75,.282,.078,.011,ink,[.75,.65,.35],cat);
  ball(x*.75,.283,.082,.004,gold,[1,1,.4],cat);
  ball(x*.72,.055,.047,.038,porcelain,[1,.65,1],cat);
}
ball(0,.247,.088,.011,rose,[1,.75,.5],cat);
for(const side of [-1,1])for(const y of [.233,.249])rod([side*.018,y,.081],[side*.071,y+.009,.068],.0016,ink,cat);
ball(-.105,.252,.015,.036,porcelain,[.68,1.55,.70],cat);
ball(-.108,.326,.037,.034,porcelain,[.9,.7,.7],cat);
for(const x of [-.119,-.106,-.093])rod([x,.338,.061],[x,.348,.059],.0018,rose,cat);
cyl(0,.188,.015,.083,.021,red,.083,cat);
ball(0,.169,.084,.019,gold,[1,1,.6],cat);
cat.traverse(part=>{if(part.isMesh)part.receiveShadow=false});
box(entryCenter,1.02,entryZ,entryW,.05,entryD,entryDark);
for(const [i,x] of entryDoorXs.entries()){
  named(cabinetFront(box(x,.91,entryFrontZ,entryDoorW,.17,.018,entryFace,.004)),`entry-drawer-${i}`);
  named(cabinetFront(box(x,.55,entryFrontZ,entryDoorW,.58,.018,entryFace,.004)),`entry-lower-door-${i}`);
}
box(entryCenter,.25,entryZ,entryW,.035,entryD,entryDark,.004);
// The 90 cm end panel matches the cabinet top and meets its widened side.
named(cabinetFront(box(entryZero+1.25+.0225,1.30,7.825,.045,2.60,.90,C.navy,.004)),'entry-end-panel');
finishSection('entry-cabinet','exact');
// The back of the cabinet used to coincide exactly with the wall face.
root.getObjectByName('entry-cabinet').position.z=.012;
// On entering, the full-length mirror is on the left side wall. Its width
// is 80% of the 90 cm entry door and its top sits just above the door.
box(entryZero+.016,1.10,9.58,.018,2.20,.72,'#343c3a',.006);
const mirrorMat=new T.MeshPhysicalMaterial({color:'#c9dcda',metalness:.58,roughness:.08,clearcoat:1});
box(entryZero+.029,1.10,9.58,.006,2.16,.69,mirrorMat);
finishSection('entry-mirror','exact');
// Entry pillar pegboard and bent-wood stool are assembled above.
// Panasonic NA-V150RPH-K front-load washer/dryer against the bath-end solid
// wall; its black front and copper-rimmed drum face the kitchen balcony door.
const washer=new T.Group();washer.name='balcony-washer';washer.position.set(washerPosition.x,.045,washerPosition.z);root.add(washer);
box(0,.45,0,.64,.86,.70,'#1c1d20',.018,washer);
box(0,.82,.356,.63,.10,.016,'#242428',.005,washer);
box(-.20,.82,.366,.13,.015,.004,'#a39b91',.002,washer);
box(.22,.82,.366,.065,.018,.004,'#4c4d51',.002,washer);
const drumFace=new T.Mesh(new T.CircleGeometry(.257,48),mat('#07090b'));
drumFace.position.set(0,.48,.362);washer.add(drumFace);
const drumGlass=new T.Mesh(new T.CircleGeometry(.218,48),new T.MeshPhysicalMaterial({color:'#0c1013',metalness:.22,roughness:.16,clearcoat:1}));
drumGlass.position.set(0,.48,.367);washer.add(drumGlass);
const drumRim=new T.Mesh(new T.TorusGeometry(.255,.013,10,64),mat('#ab7969'));
drumRim.position.set(0,.48,.381);washer.add(drumRim);
box(0,.105,.356,.15,.12,.008,'#252629',.016,washer);
for(const x of [-.26,.26])for(const z of [-.28,.28])box(x,.018,z,.055,.036,.055,'#101111',.005,washer);
finishSection('washer','exact');
// AC platform at the kitchen end: the column occupies the inner half and
// the platform's outer edge aligns with the unbroken balcony parapet.
box((6.46+OUTER_X)/2,-.13,9.72,OUTER_X-6.46,.22,1.05,'#a9aba4',.02);
finishSection('ac-platform-floor');
box(6.82,.34,9.72,.56,.67,.66,'#c6c9c5',.025);
box(6.82,.36,9.37,.52,.53,.025,'#e3e5de',.008);
const outdoorFan=cyl(6.82,.36,9.35,.19,.025,'#657471');outdoorFan.rotation.x=Math.PI/2;
for(let i=0;i<8;i++){const a=i*Math.PI/4;rod([6.82,.36,9.33],[6.82+.16*Math.cos(a),.36+.16*Math.sin(a),9.33],.012,'#d0d7d3')}
box(6.82,.73,9.72,.61,.035,.67,'#979d98',.005);
// Guard rail separates the appliance platform from the walkable balcony.
finishSection('ac-outdoor-unit','translate',scaleX(6.82)-6.82+.54);
rod([6.51,.55,9.20],[OUTER_X-.02,.55,9.20],.018,'#899893');
for(const x of [6.51,(6.51+OUTER_X-.02)/2,OUTER_X-.02])rod([x,.08,9.20],[x,.55,9.20],.012,'#899893');
finishSection('ac-platform-railing');
// Small welcoming detail away from the clear dining tabletop.
let night=false,tv=false,curtainClosed=true,wallLow=false,topView=false;
let theta=.77,phi=.76,dist=19.5,target=new T.Vector3(2.9,.2,5),desiredTarget=target.clone(),desiredDist=19.5;
const rooms={all:{name:'我們的家',desc:'沿著玄關進門，穿過木餐桌，走到灑滿日光的客廳。',pos:[2.9,.2,5],dist:19.5},living:{name:'客廳 · 慢慢過日子',desc:'灰藍懸浮電視櫃與灰色 Bergamo 三人座沙發。',pos:[1.7,.4,2.15],dist:9.6},dining:{name:'餐廳 · 一起好好吃飯',desc:'木餐桌連著深色檯面的中島，保留了收納櫃與小烤箱。',pos:[1.8,.3,6.3],dist:8.7},kitchen:{name:'廚房 · 香氣的起點',desc:'冰箱、餐邊櫃、水槽與爐台，依施工圖排在家的後端。',pos:[3.5,.3,9],dist:9.8},main:{name:'主臥 · 把夢收好',desc:'雙人床與窗邊柔光。寢具配色為這個小世界的第一版提案。',pos:[4.9,.3,1.7],dist:9.7},child:{name:'次臥 · 小小的天地',desc:'先留一張單人床，讓空間保持寬敞。',pos:[4.45,.3,6.7],dist:8.7},bath:{name:'浴室 · 清爽一下',desc:'洗手台、馬桶與獨立淋浴區。隔間依施工圖，材質先以簡化配色呈現。',pos:[5.5,.3,4.6],dist:8.5},balcony:{name:'陽台 · 日光',desc:'浴室側放 Panasonic 黑色洗脫烘，冷氣室外機位在柱外獨立小平台。',pos:[7.14,.3,7.8],dist:7.8},entry:{name:'玄關 · 歡迎回家',desc:'滿牆玄關櫃、展示層與深色洞洞板，每天回家的第一個角落。',pos:[-.2,.3,8.9],dist:8.5}};
Object.values(rooms).forEach(r=>r.pos[0]=scaleX(r.pos[0]));
rooms.entry.desc='125 公分玄關櫃、上中下各三片白色面板與開放展示層。';
rooms.bath.desc='深灰石紋牆磚與淺色磚縫，L 形乾濕分離玻璃門可向內開啟。';
target.x=scaleX(target.x);desiredTarget.x=scaleX(desiredTarget.x);
let current='all';function selectRoom(k){current=k;let r=rooms[k];desiredTarget.set(...r.pos);desiredDist=r.dist;$('#roomtitle').textContent=r.name;$('#roomdesc').textContent=r.desc;document.querySelectorAll('[data-room]').forEach(b=>b.classList.toggle('active',b.dataset.room===k));$('#roomactions').replaceChildren();if(k==='kitchen')action('從室內看陽台',()=>{desiredTarget.set(scaleX(5.76),1.35,8.66);desiredDist=3.35;theta=-1.48;phi=1.48;topView=false;$('#top').setAttribute('aria-pressed',false)});if(k==='bath'){action(showerDoor.userData.door.open?'關閉淋浴門':'推開淋浴門',()=>{toggleShowerDoor();selectRoom('bath')});action(bathWindow.userData.door.open?'關閉浴室窗戶':'打開浴室窗戶',()=>{toggleBathWindow();selectRoom('bath')})}if(k==='living'){action(tv?'關閉電視':'開啟電視',()=>{showNews(!tv);selectRoom('living');toast(tv?'電視打開了':'享受安靜的客廳')});action(curtainClosed?'拉開窗簾':'合上窗簾',()=>{curtainClosed=!curtainClosed;curtains.visible=curtainClosed;selectRoom('living');toast(curtainClosed?'窗簾合上了':'陽光進來了')})}}function action(label,fn){let b=document.createElement('button');b.textContent=label;b.onclick=fn;$('#roomactions').append(b)}let toastTimer;function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2400)}
function toggleBathWindow(){const state=bathWindow.userData.door;state.open=!state.open;state.target=state.open?state.openAngle:state.closedAngle;toast(state.open?'浴室窗戶打開了':'浴室窗戶關上了')}
function toggleShowerDoor(){const state=showerDoor.userData.door;state.open=!state.open;state.target=state.open?state.openAngle:state.closedAngle;toast(state.open?'淋浴門向內推開了':'淋浴門關上了')}
document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>selectRoom(b.dataset.room));$('#night').onclick=()=>{night=!night;document.body.classList.toggle('night',night);$('#night').innerHTML=night?'☾ <span>夜晚</span>':'☀ <span>日光</span>';$('#night').setAttribute('aria-pressed',night);hemi.intensity=night?.65:1.35;sun.intensity=night?.35:2.1;fill.intensity=night?.55:.65;sun.color.set(night?'#adc4ed':'#fff6eb');renderer.toneMappingExposure=night?.9:.95;toast(night?'晚安，溫柔的小世界':'早安，今天也是好日子')};$('#walls').onclick=()=>{wallLow=!wallLow;walls.forEach(w=>w.scale.y=wallLow?.32:1);doorFrames.forEach(g=>g.visible=!wallLow);$('#walls').setAttribute('aria-pressed',wallLow);$('#walls span').textContent=wallLow?'低牆':'完整牆';toast(wallLow?'低牆模式 · 查看室內擺設':'完整牆模式 · 房間隔間 2.6 公尺')};$('#top').onclick=()=>{topView=!topView;phi=topView?.045:.76;$('#top').setAttribute('aria-pressed',topView)};$('#reset').onclick=()=>{selectRoom('all');theta=.77;phi=.76;topView=false;$('#top').setAttribute('aria-pressed',false)};$('#plus').onclick=()=>desiredDist=Math.max(5,desiredDist*.86);$('#minus').onclick=()=>desiredDist=Math.min(30,desiredDist/ .86);
// One finger rotates by default; the switch enables faster, wider panning.
// Two fingers pan by their midpoint and pinch to zoom.
function clampPan(){desiredTarget.x=Math.max(-3,Math.min(10,desiredTarget.x));desiredTarget.z=Math.max(-2,Math.min(12,desiredTarget.z))}
function panByPixels(dx,dy){const r=desiredDist*(portrait?1.37:1);const scale=1.85*r*Math.tan(camera.fov*Math.PI/360)/Math.max(1,host.clientHeight);desiredTarget.x+=(-dx*Math.cos(theta)-dy*Math.sin(theta))*scale;desiredTarget.z+=(dx*Math.sin(theta)-dy*Math.cos(theta))*scale;clampPan()}
function panHorizontal(amount){desiredTarget.x+=amount*Math.cos(theta);desiredTarget.z-=amount*Math.sin(theta);clampPan()}
$('#pan-left').onclick=()=>panHorizontal(-1.2);$('#pan-right').onclick=()=>panHorizontal(1.2);
let dragMode='rotate';$('#drag-mode').onclick=()=>{dragMode=dragMode==='pan'?'rotate':'pan';$('#drag-mode').textContent=dragMode==='pan'?'單指：平移':'單指：旋轉';$('#drag-mode').setAttribute('aria-pressed',dragMode==='pan');toast(dragMode==='pan'?'單指拖曳可上下左右移動畫面':'單指拖曳可旋轉視角')};
$('#view-toggle').onclick=()=>{
  const panel=$('#view-panel'),open=panel.hidden;panel.hidden=!open;
  $('#view-toggle').setAttribute('aria-expanded',String(open));
};
canvas.addEventListener('pointerdown',()=>{
  $('#view-panel').hidden=true;$('#view-toggle').setAttribute('aria-expanded','false');
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){
  $('#view-panel').hidden=true;$('#view-toggle').setAttribute('aria-expanded','false');
}});
const pointers=new Map();let lastX=0,lastY=0,pinch=0,midX=0,midY=0,lastTap=null,singleTapTimer=null;
const moveRay=new T.Raycaster(),movePointer=new T.Vector2(),groundPlane=new T.Plane(new T.Vector3(0,1,0),-.06);
const interactionTargets=[];
function hitArea(kind,x,y,z,w,d){
  const mesh=new T.Mesh(new T.BoxGeometry(w,.015,d),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));
  mesh.position.set(x,y,z);mesh.userData.kind=kind;root.add(mesh);interactionTargets.push(mesh);
}
hitArea('sofa',2.54+furnitureShift.sofa,.91,2.03,.92,2.50);
hitArea('mainBed',5.42+furnitureShift.mainBed,.91,1.64,1.91,1.96);
hitArea('childBed',5.12+furnitureShift.childBed,.89,7.00,1.15,2.10);
function moveAt(e){
  const rect=canvas.getBoundingClientRect();
  movePointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
  moveRay.setFromCamera(movePointer,camera);
  const hit=moveRay.intersectObjects(interactionTargets,false)[0];
  const point=new T.Vector3();
  if(hit){window.homeGameMoveTo?.([hit.point.x,hit.point.z],hit.object.userData.kind);return}
  if(moveRay.ray.intersectPlane(groundPlane,point))window.homeGameMoveTo?.([point.x,point.z],'walk');
}
const doorRay=new T.Raycaster(),doorPointer=new T.Vector2();
function toggleDoorAt(e){
  if(wallLow)return;
  const rect=canvas.getBoundingClientRect();
  doorPointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
  doorRay.setFromCamera(doorPointer,camera);
  const hits=doorRay.intersectObjects([...interiorDoors,showerDoor,bathWindow,bathWindowHit,...slidingWindows],true);
  if(!hits.length)return;
  let door=hits[0].object;
  while(door&&!door.userData.door&&!door.userData.slider&&!door.userData.windowTarget)door=door.parent;
  if(!door)return;
  if(door.userData.slider){const state=door.userData.slider;const z=door.worldToLocal(hits[0].point.clone()).z;if(z>state.split)return;const i=Math.abs(z-state.origins[0])<=Math.abs(z-state.origins[1])?0:1;state.opens[i]=!state.opens[i];toast(state.opens[i]?'橫拉窗打開了':'橫拉窗關上了');return}
  if(door===bathWindow||door.userData.windowTarget===bathWindow){toggleBathWindow();if(current==='bath')selectRoom('bath');return}
  if(door===showerDoor){toggleShowerDoor();if(current==='bath')selectRoom('bath');return}
  const state=door.userData.door;state.open=!state.open;
  state.target=state.open?state.openAngle:state.closedAngle;
  toast(state.open?'門打開了':'門關上了');
}
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false});lastX=e.clientX;lastY=e.clientY;if(pointers.size===2){for(const p of pointers.values())p.moved=true;const p=[...pointers.values()];pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);midX=(p[0].x+p[1].x)/2;midY=(p[0].y+p[1].y)/2}});
canvas.addEventListener('pointermove',e=>{const prior=pointers.get(e.pointerId);if(!prior)return;pointers.set(e.pointerId,{...prior,x:e.clientX,y:e.clientY,moved:prior.moved||Math.hypot(e.clientX-prior.startX,e.clientY-prior.startY)>8});if(pointers.size===1){if(dragMode==='pan')panByPixels(e.clientX-lastX,e.clientY-lastY);else{theta-=(e.clientX-lastX)*.006;phi=Math.max(.045,Math.min(1.22,phi-(e.clientY-lastY)*.004));if(topView){topView=false;$('#top').setAttribute('aria-pressed',false)}}}else if(pointers.size===2){const p=[...pointers.values()],n=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),x=(p[0].x+p[1].x)/2,y=(p[0].y+p[1].y)/2;panByPixels(x-midX,y-midY);if(n>5&&pinch>5)desiredDist=Math.max(5,Math.min(30,desiredDist*pinch/n));pinch=n;midX=x;midY=y}lastX=e.clientX;lastY=e.clientY});
function release(e){
  const p=pointers.get(e.pointerId);
  if(e.type==='pointerup'&&pointers.size===1&&p&&!p.moved&&Math.hypot(e.clientX-p.startX,e.clientY-p.startY)<8){
    const now=performance.now();
    if(lastTap&&now-lastTap.time<340&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<26){
      clearTimeout(singleTapTimer);lastTap=null;e.preventDefault();moveAt(e);
    }else{
      lastTap={time:now,x:e.clientX,y:e.clientY};
      const tap={clientX:e.clientX,clientY:e.clientY};
      clearTimeout(singleTapTimer);singleTapTimer=setTimeout(()=>{if(lastTap?.time===now){toggleDoorAt(tap);lastTap=null}},350);
    }
  }
  pointers.delete(e.pointerId);pinch=0;if(pointers.size){const first=[...pointers.values()][0];lastX=first.x;lastY=first.y}
}
canvas.addEventListener('dblclick',e=>e.preventDefault());canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
canvas.addEventListener('wheel',e=>{e.preventDefault();desiredDist=Math.max(5,Math.min(30,desiredDist*Math.exp(e.deltaY*.001)))},{passive:false});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#error').hidden=false});canvas.addEventListener('webglcontextrestored',()=>location.reload());
let portrait=false;function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;portrait=camera.aspect<.85;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(host);resize();let frame=0;function animate(){requestAnimationFrame(animate);target.lerp(desiredTarget,.075);dist+=(desiredDist-dist)*.075;let r=dist*(portrait?1.37:1);camera.position.set(target.x+Math.sin(theta)*Math.sin(phi)*r,target.y+Math.cos(phi)*r,target.z+Math.cos(theta)*Math.sin(phi)*r);camera.lookAt(target);for(const door of [...interiorDoors,showerDoor,bathWindow])door.rotation.y+=(door.userData.door.target-door.rotation.y)*.17;for(const win of slidingWindows){const state=win.userData.slider;for(let i=0;i<2;i++){state.progress[i]+=((state.opens[i]?1:0)-state.progress[i])*.17;state.leaves[i].position.z=state.origins[i]+(i===0?1:-1)*state.travel*state.progress[i]}}window.homeGameUpdate?.(performance.now());renderer.render(scene,camera);if(frame++===0)$('#loading').hidden=true}animate();
// Scene inventory available for non-rendering diagnostics and future game integration.
window.homeScene={layout:{scaleX,entryZero,kitchenStart,kitchenEnd,furnitureShift,sinkX,stoveX,showerPoints},root,scene,camera,renderer,rooms,selectRoom,interiorWalls,doorFrames,showerDoor,toggleShowerDoor,bathWindow,toggleBathWindow,bathWindowHit,slidingWindows,
  setBalconyDoor(){},
  updateDoorsAt(x,z){
    const centers=[[3.90,4.50],[4.45,5.025],[3.95,5.55]];
    interiorDoors.forEach((door,i)=>{
      const state=door.userData.door,near=Math.hypot(x-scaleX(centers[i][0]),z-centers[i][1])<.73;
      if(near){state.target=state.openAngle;state.open=true}
      else if(state.autoNear){state.target=state.closedAngle;state.open=false}
      state.autoNear=near;
    });
  },
  showNews,get currentRoom(){return current}};


