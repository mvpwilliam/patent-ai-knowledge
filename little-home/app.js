import * as T from './vendor/three.module.js';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
const $=s=>document.querySelector(s), canvas=$('#scene'), host=$('#world');
let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'default'});}catch(e){$('#loading').hidden=true;$('#error').hidden=false;throw e}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,100);const root=new T.Group();scene.add(root);
const hemi=new T.HemisphereLight(0xf1f4fa,0x747982,1.35);scene.add(hemi);const sun=new T.DirectionalLight(0xfff6eb,2.1);sun.position.set(-3,12,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:40});sun.shadow.bias=-.0005;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun);const fill=new T.DirectionalLight(0xdce7ff,.65);fill.position.set(7,8,-9);scene.add(fill);
const mats=new Map(),geos=new Map();function mat(c){if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.8}));return mats.get(c)}
const C={wall:'#b8b9ba',trim:'#979b9d',wood:'#a58b6c',woodlight:'#c4ae8b',floor:'#e8d9bd',navy:'#354e63',cream:'#e3e1d9',cab:'#62656b',dark:'#394746',metal:'#6d7773',green:'#789377',white:'#f4f1e6',bed:'#b6c3ac'};
function box(x,y,z,w,h,d,c,round=0,parent=root){let key=[w,h,d,round].join(',');if(!geos.has(key))geos.set(key,round?new RoundedBoxGeometry(w,h,d,2,Math.min(round,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d));let m=new T.Mesh(geos.get(key),typeof c==='string'?mat(c):c);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function cyl(x,y,z,r,h,c,r2=r,parent=root){let m=new T.Mesh(new T.CylinderGeometry(r,r2,h,20),mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function ball(x,y,z,r,c,s=[1,1,1],parent=root){let m=new T.Mesh(new T.SphereGeometry(r,16,12),typeof c==='string'?mat(c):c);m.position.set(x,y,z);m.scale.set(...s);m.castShadow=true;parent.add(m);return m}
function rod(a,b,r,c,parent=root){let aa=new T.Vector3(...a),bb=new T.Vector3(...b);let m=cyl(0,0,0,r,aa.distanceTo(bb),c,r,parent);m.position.copy(aa.add(bb).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...b).sub(new T.Vector3(...a)).normalize());return m}
function plant(x,y,z,scale=1){const p=new T.Group();root.add(p);p.position.set(x,y,z);p.scale.setScalar(scale);cyl(0,.16,0,.19,.32,'#d7c9ab',.14,p);cyl(0,.32,0,.16,.02,'#605c43',.16,p);rod([0,.3,0],[0,1.1,0],.017,'#7b7b52',p);for(let i=0;i<9;i++){let a=i*2.4,yy=.48+i*.074,xx=Math.cos(a)*(.32-i*.014),zz=Math.sin(a)*(.32-i*.014);rod([0,yy-.12,0],[xx,yy,zz],.009,'#7b7b52',p);let leaf=ball(xx,yy,zz,.17,i%2?'#809b65':'#9caa76',[1,.27,.5],p);leaf.rotation.y=-a;}return p}
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
  box(x,-.18,z,w,.32,d,'#c9baa0',.04);box(x,.005,z,w,.06,d,color);
  if(finish==='wood')woodBoards(x,z,w,d,true);
  else{for(let xx=x-w/2+.60;xx<x+w/2;xx+=.60)box(xx,.038,z,.006,.002,d,'#77756e');for(let zz=z-d/2+.60;zz<z+d/2;zz+=.60)box(x,.038,zz,w,.002,.006,'#77756e')}
}
// Keep the indoor wood finish clear of the utility balcony (x 5.83–7.18,
// z 6.45–9.20). The floor underneath used to show through its tile finish.
floor(2.915,5,5.83,10);
floor(6.115,3.225,.57,6.45);
floor(6.115,9.60,.57,.80);
// The second-bedroom boards turn 90 degrees, following the flooring plan.
box(4.24,.042,6.84,3.08,.004,2.52,C.floor);woodBoards(4.24,6.84,3.08,2.52,false,.048);
floor(-1.025,8.95,2.05,2.1,'#85847d','tile');
// The revised entry tile cuts diagonally into the indoor wood toward the
// refrigerator. Its surface sits just above the boards in this small wedge.
const entryTileShape=new T.BufferGeometry();
entryTileShape.setAttribute('position',new T.Float32BufferAttribute([
  0,.052,8.15, 1.30,.052,9.30, 1.30,.052,10.0,
  0,.052,8.15, 1.30,.052,10.0, 0,.052,10.0
],3));
entryTileShape.computeVertexNormals();
const entryTile=new T.Mesh(entryTileShape,new T.MeshStandardMaterial({color:'#85847d',roughness:.88,side:T.DoubleSide}));
entryTile.receiveShadow=true;root.add(entryTile);
rod([0,.058,8.15],[1.30,.058,9.30],.009,'#77776f');
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
box(6.505,-.18,7.825,1.35,.32,2.75,'#c9baa0',.04);
box(6.505,.005,7.825,1.35,.06,2.75,'#a5aeb0');
for(let tx=5.83;tx<7.18-.001;tx+=.45)for(let tz=6.45;tz<9.20-.001;tz+=.45){
  const w=Math.min(.45,7.18-tx),d=Math.min(.45,9.20-tz);
  box(tx+w/2,.042,tz+d/2,w-.018,.012,d-.018,balconyTileMat,.001);
}
floor(6.825,5.50,.71,1.90,'#55585b','tile');
// Foundation and soft ground beneath the miniature.
box(2.55,-.52,5,9.7,.28,12.2,'#d3dac4',.13);box(2.55,-.72,5,10,.18,12.5,'#bdcbae',.06);
const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({color:0x536e48,opacity:.15}));ground.rotation.x=-Math.PI/2;ground.position.y=-.82;ground.receiveShadow=true;scene.add(ground);
const walls=[];function wall(x,z,w,d,h=1.15){let g=new T.Group();g.position.set(x,0,z);root.add(g);box(0,h/2,0,w,h,d,C.wall,.018,g);box(0,h+.025,0,w+.045,.05,d+.045,C.trim,.012,g);walls.push(g);return g}
// Two north-facing windows each have a sill and a full-height header. The
// old continuous 1.75 m wall covered the glazing but left the top open.
for(const [a,b] of [[-.075,.42],[2.92,3.645],[6.195,6.475]])wall((a+b)/2,-.07,b-a,.15,2.6);
for(const [a,b] of [[.42,2.92],[3.645,6.195]]){
  const x=(a+b)/2,w=b-a;
  wall(x,-.07,w,.15,.30);
  const header=new T.Group();header.position.set(x,0,-.07);root.add(header);
  box(0,2.25,0,w,.70,.15,C.wall,.018,header);
  box(0,2.625,0,w+.045,.05,.195,C.trim,.012,header);
  walls.push(header);
}
wall(-.07,3.9,.15,7.9,2.6);
wall(6.47,2.25,.15,4.5,2.6); // master and toilet side, ending at the shower glass
wall(7.18,5.50,.13,1.90,2.6); // projecting shower exterior
// The east edge of the enclosed balcony is a full-height wall with airtight
// glazing above its sill. The AC platform continues beyond it behind a rail.
wall(7.18,7.825,.13,2.75,.65);
wall(7.18,9.71,.13,1.02,.55);
const balconyEastWindow=new T.Group();balconyEastWindow.position.set(7.18,0,7.825);root.add(balconyEastWindow);
box(0,2.365,0,.13,.47,2.75,C.wall,.008,balconyEastWindow);
const balconyPane=new T.MeshPhysicalMaterial({color:'#bed8d9',transparent:true,opacity:.35,roughness:.10,depthWrite:false,side:T.DoubleSide});
box(0,1.39,0,.025,1.48,2.60,balconyPane,0,balconyEastWindow);
for(const z of [-1.335,0,1.335])box(0,1.39,z,.065,1.50,.045,'#43494a',.002,balconyEastWindow);
for(const y of [.65,2.13])box(0,y,0,.07,.055,2.70,'#43494a',.002,balconyEastWindow);
walls.push(balconyEastWindow);
// The kitchen backsplash wall and the entrance enclosure reach the ceiling.
wall(3.2,10.07,6.55,.15,2.6);
// The square entry projects from the TV-wall side. Its room-facing edge
// (x=0) is completely open to the dining area and kitchen passage.
wall(-1.06,7.85,2.12,.15,2.6); // shoe side turns into the TV exterior wall
wall(-2.05,8.96,.15,2.23,2.6); // solid inner face of the square entry
wall(-2.0,10.07,.10,.15,2.6); // short corner before the front door
wall(-.50,10.07,1.0,.15,2.6); // long kitchen wall after the door
wall(-.67,9.86,.56,.42,2.6); // solid column: door, column, then refrigerator
wall(6.16,9.635,.66,.87,2.6); // balcony-end column fills the recessed floor
// Interior walls use a full 2.6 m height; low-wall mode is display-only.
const ROOM_WALL_HEIGHT=2.6;
const interiorWalls=[];
function partition(x,z,w,d){const g=wall(x,z,w,d,ROOM_WALL_HEIGHT);g.userData.fullHeight=ROOM_WALL_HEIGHT;interiorWalls.push(g);return g}
// CAD's thick purple lines set the walls; its door arcs set the openings.
// In plan view model X runs downward and model Z runs from right to left.
partition(3.35,2.25,.14,4.5); // uninterrupted living wall ends at the marked master entry
partition(5.46,3.65,2.02,.14); // master/bath wall, x 4.45–6.47
partition(4.45,4.125,.13,.75); // bathroom front wall, z 3.75–4.50
partition(5.14,5.55,1.38,.13); // one shared bath/child wall, x 4.45–5.83
partition(3.05,5.55,.8,.13); // short wall above the child door
partition(2.65,6.875,.13,2.65); // child-room wall along the dining area
partition(4.24,8.2,3.18,.13); // child-room wall along the kitchen
partition(5.83,6.275,.13,1.45); // single solid wall from bath corner to window
partition(5.83,8.08,.13,.36); // jamb closes the child-room edge before balcony door
partition(5.83,9.595,.13,.95); // tiled return between balcony door and hob
const applianceDivider=partition(3.05,9.68,.13,.78); // shared kitchen/appliance wall
applianceDivider.children.forEach(part=>part.material=mat('#696b6a'));
// The solid service shaft touches the child-room corner. Beyond it, the
// shower projects as far as the outside edge of the utility balcony.
const serviceShaft=wall(6.15,6.00,.64,.90,2.6);
partition(6.47,6.00,.13,.90); // shaft / projecting shower side
partition(6.47,4.63,.13,.26); // solid return on the bath-side corner of shower
// The bath-facing end is solid. The airtight end window belongs opposite
// it, at the kitchen/AC-platform end of the balcony.
partition(6.825,6.45,.71,.13);
wall(6.825,9.20,.71,.13,.65);
const balconySouthWindow=new T.Group();balconySouthWindow.position.set(6.825,0,9.20);root.add(balconySouthWindow);
box(0,2.365,0,.71,.47,.13,C.wall,.008,balconySouthWindow);
box(0,1.39,0,.62,1.48,.025,balconyPane,0,balconySouthWindow);
for(const x of [-.335,.335])box(x,1.39,0,.045,1.50,.065,'#43494a',.002,balconySouthWindow);
for(const y of [.65,2.13])box(0,y,0,.67,.055,.07,'#43494a',.002,balconySouthWindow);
walls.push(balconySouthWindow);
// Full-height outward shower wall, aligned with the master-bedroom window
// elevation. The 60 x 90 cm window has a 120 cm sill and a 50 cm header.
const showerWindowWall=new T.Group();showerWindowWall.position.set(6.825,0,4.55);root.add(showerWindowWall);
box(0,.60,0,.71,1.20,.13,C.wall,.008,showerWindowWall);
box(0,2.35,0,.71,.50,.13,C.wall,.008,showerWindowWall);
for(const x of [-.3275,.3275])box(x,1.65,0,.055,.90,.13,C.wall,.006,showerWindowWall);
const showerWindowGlass=new T.MeshPhysicalMaterial({color:'#a7c5c9',transparent:true,opacity:.48,roughness:.1,depthWrite:false,side:T.DoubleSide});
box(0,1.65,0,.60,.90,.025,showerWindowGlass,0,showerWindowWall);
for(const x of [-.30,.30])box(x,1.65,0,.025,.90,.15,C.trim,.003,showerWindowWall);
for(const y of [1.20,2.10])box(0,y,0,.62,.035,.15,C.trim,.003,showerWindowWall);
walls.push(showerWindowWall);
// The floor finish plan locates this window at the kitchen end of the child
// room's balcony wall; the bath end remains a solid full-height wall.
const childWindow=new T.Group();childWindow.position.set(5.83,0,7.45);root.add(childWindow);
box(0,.46,0,.13,.92,.90,C.wall,.008,childWindow);
box(0,2.36,0,.13,.48,.90,C.wall,.008,childWindow);
const childGlass=new T.MeshPhysicalMaterial({color:'#bed9d7',transparent:true,opacity:.38,roughness:.17,depthWrite:false,side:T.DoubleSide});
box(0,1.55,0,.018,1.2,.88,childGlass,0,childWindow);
for(const z of [-.45,.45])box(0,1.55,z,.08,1.25,.035,C.trim,0,childWindow);
box(0,.94,0,.1,.05,.90,C.trim,0,childWindow);box(0,2.16,0,.1,.05,.90,C.trim,0,childWindow);
walls.push(childWindow);interiorWalls.push(childWindow);
// The utility balcony has airtight north and east windows; the shower has a glass enclosure.
const doorFrames=[];
function doorway(x,z,width,alongZ=true){const g=new T.Group();g.position.set(x,0,z);if(alongZ)g.rotation.y=Math.PI/2;root.add(g);const h=2.1;
for(const side of [-1,1])box(side*(width/2-.025),h/2,0,.05,h,.18,'#454c57',.008,g);
box(0,h+.035,0,width,.07,.18,'#454c57',.008,g);
box(0,(h+.07+ROOM_WALL_HEIGHT)/2,0,width,ROOM_WALL_HEIGHT-h-.07,.14,C.wall,.008,g);
doorFrames.push(g)}
// The marked master entrance crosses the short passage beside the bathroom.
// Its opening faces the passage, while the sofa-side wall remains continuous.
doorway(3.90,4.5,1.10,false);
doorway(4.45,5.025,1.05); // bathroom door, z 4.50–5.55
doorway(3.95,5.55,1.0,false); // child door, x 3.45–4.45 beside the bath
doorway(-1.45,10.07,.90,false); // kitchen-side wall, x -1.90 to -1.00
// A dark leaf pivots inward toward the small entry square.
const frontDoor=new T.Group();frontDoor.position.set(-1.88,0,10.00);frontDoor.rotation.y=-.34;root.add(frontDoor);
box(.45,1.03,-.02,.89,2.04,.055,'#292b2b',.01,frontDoor);
box(.76,1.02,-.09,.13,.045,.025,C.metal,.01,frontDoor);
doorFrames.push(frontDoor);
// The full door frame stays within the kitchen segment of the shared wall,
// past the child-room corner at z 8.20.
const balconyDoor=new T.Group();balconyDoor.position.set(5.83,0,8.68);balconyDoor.scale.z=.88;root.add(balconyDoor);
for(const z of [-.48,.48])box(0,1.12,z,.12,2.24,.07,'#24272a',.008,balconyDoor);
// The left jamb faces the kitchen and sits proud of the tiled end wall.
box(-.092,1.12,-.49,.045,2.24,.105,'#151b1d',.003,balconyDoor);
box(-.092,2.20,0,.045,.085,1.08,'#151b1d',.003,balconyDoor);
box(0,2.20,0,.12,.10,1.02,'#24272a',.008,balconyDoor);
box(0,2.425,0,.14,.35,1.02,C.wall,.008,balconyDoor); // lintel to the 2.6 m wall top
box(0,.045,0,.15,.09,1.02,'#24272a',.005,balconyDoor);
const balconyGlass=new T.MeshPhysicalMaterial({color:'#a8c4c5',transparent:true,opacity:.45,roughness:.13,metalness:.08,depthWrite:false,side:T.DoubleSide});
box(0,1.46,0,.035,1.36,.91,balconyGlass,0,balconyDoor);
box(-.027,.37,0,.024,.70,.89,'#25292a',.008,balconyDoor);
for(let y=.14;y<.66;y+=.075)box(-.051,y,0,.026,.027,.85,'#3b4142',.003,balconyDoor);
box(-.08,1.08,-.35,.04,.35,.025,C.metal,.009,balconyDoor);
doorFrames.push(balconyDoor);
// Window frames and sheer curtain folds at the two north windows.
const curtains=new T.Group();root.add(curtains);function windowAt(x,w){box(x,1.1,.015,w,1.6,.075,'#607779',.015);box(x,1.12,.062,w-.12,1.38,.018,new T.MeshStandardMaterial({color:'#b9d3d1',roughness:.25,emissive:'#9dbabc',emissiveIntensity:.2}));box(x,1.13,.083,.035,1.38,.025,C.dark);box(x,.53,.083,w,.035,.025,C.dark);for(let i=0;i<14;i++){let xx=x-w/2+.055+i*(w-.11)/13;let m=cyl(xx,1.07,.18,.035,1.68,i%2?'#eeeddf':'#d9dfd3',.035,curtains);m.scale.z=.8}box(x,1.95,.16,w+.14,.06,.1,C.cream,.02)}windowAt(1.67,2.5);windowAt(4.92,2.55);
// Living area: the continuous pale oak remains visible around the seating.
box(.23,.4,2.25,.44,.42,3.2,C.navy,.035);box(.465,.42,1.2,.025,.26,.75,C.white,.008);box(.465,.42,3.25,.025,.26,.75,C.white,.008);box(.465,.42,2.23,.03,.16,.95,C.dark);box(.24,.64,2.28,.43,.045,3.32,C.navy,.014);
box(.15,1.18,2.1,.095,.93,1.65,'#293b3e',.022);const tvMat=new T.MeshStandardMaterial({color:'#60878b',emissive:'#496b70',emissiveIntensity:.45,roughness:.28});box(.204,1.18,2.1,.012,.83,1.54,tvMat,.009);const tvArt=new T.Group();root.add(tvArt);box(.215,1.18,2.1,.007,.055,.9,'#cadcc8',.002,tvArt);box(.216,1.37,2.1,.006,.11,.41,'#d2d9ad',.01,tvArt);box(.216,1.06,2.1,.006,.04,.65,'#9cb9ac',0,tvArt);
box(.36,.7,2.1,.13,.09,1.0,C.dark,.025);box(.27,.83,3.36,.13,.35,.19,'#f4f2e8',.026);box(.272,.83,3.25,.10,.34,.018,'#293b3e');box(.32,.72,1.03,.13,.16,.24,'#263f43',.013);box(.32,.72,.885,.14,.17,.07,'#60a7a6',.02);box(.32,.72,1.175,.14,.17,.07,'#ca7064',.02);
// BoConcept Bergamo three-seater: a 2.5 m straight profile, one long seat,
// three loose back cushions, broad squared arms and low dark feet.
const sofaFabric='#a6a7a5',sofaSeat='#b5b6b4',sofaShade='#969896';
for(const x of [2.37,2.98])for(const z of [.98,3.08])box(x,.065,z,.055,.13,.055,'#292d2e',.008);
box(2.67,.245,2.03,.91,.32,2.5,sofaShade,.075);
box(2.54,.465,2.03,.68,.22,2.06,sofaSeat,.075);
box(3.00,.64,2.03,.22,.69,2.08,sofaFabric,.065);
for(const z of [.85,3.21])box(2.67,.55,z,.91,.70,.16,sofaFabric,.055);
for(let i=0;i<3;i++){let p=box(2.91,.79,1.36+i*.67,.24,.50,.62,sofaSeat,.065);p.rotation.z=-.07}
// The living room has open floor space in front of the sofa: no coffee table.
const lampMat=new T.MeshStandardMaterial({color:'#fff1ce',emissive:'#ffe0a1',emissiveIntensity:.5});cyl(2.85,.08,.42,.18,.06,C.metal);rod([2.85,.1,.42],[2.85,1.53,.42],.022,C.metal);ball(2.85,1.56,.42,.18,lampMat);plant(.45,.67,.57,.42);
// The supplied black-and-white print faces the peninsula on the continuous
// living/dining wall. Its earlier decorative panel has been removed.
box(.035,1.39,7.22,.046,1.09,.79,'#e7e7e4',.004);
const artTexture=new T.TextureLoader().load('./assets/black-white-art.jpg');artTexture.colorSpace=T.SRGBColorSpace;
const print=new T.Mesh(new T.PlaneGeometry(.75,1.04),new T.MeshBasicMaterial({map:artTexture,side:T.DoubleSide}));
print.rotation.y=Math.PI/2;print.position.set(.061,1.39,7.22);root.add(print);
// Dining table, curved backs, oak seats and peninsula with oven niches.
function chair(x,z){for(let dx of [-.20,.20])for(let dz of [-.20,.20])rod([x+dx*1.2,.07,z+dz*1.2],[x+dx,.49,z+dz],.027,C.wood);box(x,.49,z,.49,.08,.48,'#c6c5af',.07);const back=box(x-.21,.78,z,.075,.34,.5,C.woodlight,.05);rod([x-.20,.61,z-.23],[x+.18,.68,z-.23],.023,C.woodlight);rod([x-.20,.61,z+.23],[x+.18,.68,z+.23],.023,C.woodlight)}
// 135 × 75 cm dining table: its kitchen-side edge (z=6.975) lines up with
// the island's dining-side edge (z=6.96), with no oversized overhang.
box(1.36,.76,6.30,.75,.12,1.35,C.woodlight,.10);
box(1.36,.39,6.30,.52,.69,.76,'#c8b493',.12);
chair(.55,5.94);chair(.55,6.63);
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
// Keep the second-bedroom boundary clear of the former tall wardrobe block.
// Master bedroom: bed only, with the headboard against the exterior wall.
box(5.31,.08,1.64,2.28,.06,2.6,'#c7cbbb',.06);
box(6.34,.54,1.64,.16,.94,2.05,'#b0ad98',.08);
box(5.44,.29,1.64,1.85,.35,1.94,C.wood,.045);
box(5.44,.52,1.64,1.90,.22,1.95,C.white,.08);
box(5.13,.67,1.64,1.25,.15,1.94,C.bed,.075);
for(const z of [1.12,2.15]){const pillow=box(6.04,.70,z,.45,.17,.71,'#f3ecda',.07);pillow.rotation.z=-.04}
box(4.74,.77,1.64,.33,.07,1.95,'#8ea48d',.03);
// Bathroom tiled floor, basin, mirror, toilet and glass shower partition.
box(5.4,.07,4.58,1.91,.06,1.64,'#55585b');for(let x=4.5;x<6.4;x+=.32)box(x,.105,4.58,.01,.004,1.64,'#777b7c');for(let z=3.8;z<5.4;z+=.32)box(5.4,.105,z,1.9,.004,.01,'#777b7c');box(4.73,.42,4.1,.57,.63,.60,C.woodlight,.035);box(4.73,.77,4.1,.62,.10,.64,'#45474b',.03);ball(4.73,.827,4.1,.21,C.white,[1,.12,1]);rod([4.73,.83,3.88],[4.73,1,3.88],.025,C.metal);rod([4.73,1,3.88],[4.73,1,4.0],.025,C.metal);box(4.73,1.27,3.76,.54,.7,.035,'#859e9c',.02);box(5.76,.53,3.98,.47,.76,.23,C.white,.07);ball(5.76,.40,4.33,.28,C.white,[.78,.7,1.15]);ball(5.76,.57,4.33,.22,'#d3ddd4',[.83,.15,1.14]);
// The shower projects beyond the bath toward the balcony. In local plan
// coordinates the toilet-side wall end A=(0,0), C=(15,0), B=(15,79) cm.
// The short leg A-C is perpendicular to that wall; C-B runs parallel to it.
box(6.825,.07,5.50,.65,.06,1.76,'#55585b');
const showerGlass=new T.MeshPhysicalMaterial({color:'#c7e0df',transparent:true,opacity:.34,roughness:.08,metalness:0,depthWrite:false,side:T.DoubleSide});
const A={x:6.47,z:4.76},Ccorner={x:6.62,z:4.76},B={x:6.62,z:5.55};
const showerH=2.00,doorW=.65,fixedW=B.z-Ccorner.z-doorW;
// Short fixed pane, A to C: a 15 cm return without a gap at the toilet wall.
box((A.x+Ccorner.x)/2,1.08,A.z,Ccorner.x-A.x,showerH,.012,showerGlass);
for(const x of [A.x,Ccorner.x])rod([x,.08,A.z],[x,2.08,A.z],.008,'#232c2d');
rod([A.x,2.08,A.z],[Ccorner.x,2.08,A.z],.008,'#232c2d');
// Long side: a 65 cm door at C and the remaining 14 cm fixed at the shaft.
box(Ccorner.x,1.08,Ccorner.z+doorW+fixedW/2,.012,showerH,fixedW,showerGlass);
for(const z of [Ccorner.z+doorW,B.z])rod([Ccorner.x,.08,z],[Ccorner.x,2.08,z],.008,'#232c2d');
rod([Ccorner.x,2.08,Ccorner.z+doorW],[Ccorner.x,2.08,B.z],.008,'#232c2d');
const showerDoor=new T.Group();showerDoor.position.set(Ccorner.x,0,Ccorner.z);root.add(showerDoor);
box(0,1.08,doorW/2,.012,showerH,doorW,showerGlass,0,showerDoor);
rod([0,.08,0],[0,2.08,0],.008,'#232c2d',showerDoor);
rod([0,2.08,0],[0,2.08,doorW],.008,'#232c2d',showerDoor);
rod([0,.08,doorW],[0,2.08,doorW],.008,'#232c2d',showerDoor);
rod([-.04,.93,.53],[-.04,1.25,.53],.010,'#232c2d',showerDoor);
// The dashed plan arc shows the door opening inward, away from the outer
// window at z=4.55. The door itself stays closed on the straight C-B line.
for(let j=0;j<18;j+=2){const a=j*Math.PI/60,b=(j+1)*Math.PI/60;rod([Ccorner.x+doorW*Math.sin(a),.135,Ccorner.z+doorW*Math.cos(a)],[Ccorner.x+doorW*Math.sin(b),.135,Ccorner.z+doorW*Math.cos(b)],.006,'#cfad7d')}
// Opaque return at the shaft end remains a solid service enclosure.
box(6.552,1.30,6.00,.032,2.58,.90,'#51565b',.004);
// A small cross seal closes the last centimetres to the shaft's end face.
box(6.585,1.08,5.55,.07,showerH,.012,showerGlass);
rod([7.04,.12,5.47],[7.04,1.53,5.47],.02,C.metal);rod([7.04,1.53,5.47],[6.84,1.53,5.47],.02,C.metal);cyl(6.84,1.51,5.47,.085,.03,C.metal);
// Child room: only the bed; the headboard faces the opposite kitchen-side wall.
box(5.12,.25,7.00,1.1,.35,1.95,C.wood,.06);
box(5.12,.51,7.00,1.1,.20,1.94,C.white,.055);
box(5.12,.67,6.73,1.11,.13,1.48,'#c0ccbd',.05);
box(5.12,.70,7.76,.72,.18,.37,'#f0dfb7',.07);
box(5.12,.46,8.08,1.13,.55,.11,C.woodlight,.03);
box(5.12,.765,6.40,1.12,.04,.36,'#8fa8a0',.02);
// Kitchen and appliances. The refrigerator-side built-in is a separate tall
// unit: overhead doors, open display shelf, appliance counter and microwave.
box(2.36,.45,9.68,1.2,.83,.61,C.cab,.02);
// White marble is a 6 mm surface on the existing walls, in 60 x 120 cm
// portrait courses. It does not change the kitchen's footprint.
const marbleCanvas=document.createElement('canvas');marbleCanvas.width=256;marbleCanvas.height=512;
const mctx=marbleCanvas.getContext('2d');mctx.fillStyle='#f4f4f1';mctx.fillRect(0,0,256,512);
for(let i=0;i<16;i++){mctx.beginPath();mctx.moveTo(-30+i*23,-30);mctx.bezierCurveTo(80+i*12,140,40+i*15,290,280+i*5,540);mctx.strokeStyle=i%3?'rgba(137,143,145,.12)':'rgba(116,124,128,.23)';mctx.lineWidth=i%3?1:2;mctx.stroke()}
const marbleTexture=new T.CanvasTexture(marbleCanvas);marbleTexture.colorSpace=T.SRGBColorSpace;
const marble=new T.MeshStandardMaterial({map:marbleTexture,roughness:.27});
for(let x=2.65;x<5.83;x+=.6){const w=Math.min(.6,5.83-x);for(let y=0;y<2.6;y+=1.2){const h=Math.min(1.2,2.6-y);box(x+w/2,y+h/2,8.269,w-.005,h-.005,.006,marble)}}
for(const [z0,z1] of [[7.90,8.12],[9.12,10.07]])for(let z=z0;z<z1;z+=.6){const d=Math.min(.6,z1-z);for(let y=0;y<2.6;y+=1.2){const h=Math.min(1.2,2.6-y);box(5.761,y+h/2,z+d/2,.006,h-.005,d-.005,marble)}}
// The continuous black glass splashback is flush with the wall behind the
// sink and hob, directly between the counter and handle-free uppers.
const blackGlass=new T.MeshPhysicalMaterial({color:'#101719',metalness:.12,roughness:.08,clearcoat:1,clearcoatRoughness:.06});
box(4.475,1.275,9.989,2.71,.68,.006,blackGlass);
box(4.475,2.11,9.68,2.71,.98,.53,'#f3f4f1',.008);
for(const x of [3.46,4.14,4.82,5.50])box(x,2.11,9.406,.665,.955,.012,'#fbfbf9',.003);
// The slim stainless hood is concealed beneath the cupboard above the hob.
box(5.45,1.594,9.45,.73,.055,.36,'#b7bdba',.005);
box(5.45,1.562,9.36,.43,.009,.03,'#626b6b');
box(4.5,.45,9.68,2.7,.83,.61,'#463b34',.012);
box(4.5,.89,9.66,2.75,.07,.70,'#eeefec',.012);
for(const x of [3.43,4.05,4.68,5.31]){box(x,.46,9.363,.55,.70,.018,'#40352e',.004);box(x,.73,9.344,.40,.025,.025,'#aeb4b1')}
// Fine pale flecks on the white stone, deliberately subtle at room scale.
for(let i=0;i<96;i++){const x=3.14+(i*0.437%2.68),z=9.35+(i*0.173%.59);box(x,.928,z,.008,.001,.005,i%3?'#d6d8d5':'#c5c9c7')}
box(3.95,.945,9.61,.72,.035,.43,C.metal,.07);box(3.95,.967,9.61,.59,.025,.32,'#a7b9b3',.06);rod([3.95,.96,9.86],[3.95,1.25,9.86],.022,C.metal);rod([3.95,1.25,9.86],[3.95,1.25,9.65],.022,C.metal);
box(5.45,.948,9.60,.65,.04,.44,'#283c3e',.025);for(const x of [5.27,5.62]){cyl(x,.984,9.59,.12,.02,C.metal);cyl(x,1,9.59,.08,.023,'#253b3b')}
// Cabinet above the refrigerator, with its face aligned to the fridge.
box(1.35,2.24,9.55,.78,.65,.78,'#77736e',.012);
for(const x of [1.17,1.53])box(x,2.24,9.145,.35,.61,.018,'#f2f1ec',.005);
// Refrigerator-side appliance cabinet, front at z=9.17. From the kitchen
// opening toward the fridge: a narrow three-tier open shelf, two overhead
// doors, a cup niche, an open appliance counter, a microwave and robot bay,
// with drawers in the narrower bay next to the refrigerator.
const cabinetFace='#f2f1ec',cabinetInterior='#263535';
for(const x of [1.76,2.96])box(x,1.30,9.56,.035,2.60,.76,'#797b77',.004);
box(2.36,2.57,9.56,1.18,.05,.76,'#777b78',.004);
box(2.24,2.30,9.55,.93,.55,.72,'#858983',.005);
for(const x of [2.005,2.475])box(x,2.30,9.181,.455,.52,.012,cabinetFace,.003);
box(2.71,2.28,9.56,.022,.60,.69,'#626967');
for(const y of [1.79,2.06,2.33])box(2.83,y,9.51,.23,.026,.62,'#92928a',.003);
box(2.83,1.83,9.89,.23,.46,.012,'#555e5b');
// Open horizontal cup shelf below the two overhead doors.
box(2.24,2.01,9.55,.93,.03,.69,'#858981');
box(2.24,1.77,9.55,.93,.04,.69,'#858981');
box(2.24,1.88,9.89,.91,.18,.014,'#394846');
for(const x of [2.02,2.20,2.38,2.55])cyl(x,1.815,9.45,.045,.12,'#bfc6c2');
// Grey wall above the counter and the slim under-cabinet light.
box(2.36,1.49,9.928,1.16,.51,.008,'#737775');
box(2.24,1.745,9.28,.93,.018,.055,'#e8e9e3');
box(2.36,1.20,9.54,1.18,.06,.76,'#303237',.007);
// Microwave left and shallow drawer stack right, per the elevation photo.
box(2.25,.60,9.54,.028,1.16,.73,cabinetInterior);
box(2.59,.88,9.89,.69,.55,.018,cabinetInterior);
box(2.59,.61,9.54,.70,.045,.72,'#454b4b');
box(2.59,.87,9.14,.58,.42,.04,'#202b2f',.008);
box(2.56,.88,9.112,.43,.27,.01,'#606d71',.004);
box(2.83,.87,9.106,.025,.31,.015,'#aeb6b3');
box(2.59,.19,9.89,.69,.36,.018,cabinetInterior);
box(2.59,.09,9.53,.69,.035,.72,'#555d59');
box(2.59,.26,9.53,.43,.26,.44,'#343b3b',.03);
for(const y of [.92,.67,.42,.17]){box(2.005,y,9.167,.455,.21,.016,cabinetFace,.004);box(2.005,y+.045,9.149,.28,.012,.012,'#d8dad7')}
// Small countertop appliances preserve the open work surface.
box(2.66,1.34,9.55,.22,.22,.20,'#f1f0eb',.035);
box(2.27,1.32,9.50,.30,.18,.18,'#f1f0eb',.04);
box(1.35,.95,9.52,.73,1.85,.83,'#87928b',.045);for(let yy of [1.39,.85,.34])box(1.35,yy,9.08,.67,yy>1?.88:.32,.035,'#a2aaa0',.018);box(1.36,1.39,9.048,.016,.87,.025,'#6a7b73');box(1.37,.73,9.04,.5,.025,.04,C.dark);box(1.55,1.6,9.045,.14,.2,.01,'#e3e4c8');
// Full-width entry cabinet from the door-side corner to the dining return.
// The reference has three upper doors, a lit display niche, one row of three
// shallow drawers, three lower doors, and a continuous shoe void at the floor.
const entryFace='#f2f1ec',entryDark='#303838';
const entryX=-1.06,entryZ=8.065,entryW=1.90,entryD=.40;
for(const x of [-2.02,-.10])box(x,1.28,entryZ,.035,2.55,entryD,entryDark,.006);
box(entryX,2.56,entryZ,entryW,.035,entryD,entryDark);
box(entryX,1.88,entryZ,entryW,.76,entryD,'#626866');
for(const x of [-1.69,-1.06,-.43])box(x,1.88,8.277,.615,.74,.018,entryFace,.004);
box(entryX,1.48,entryZ,entryW,.035,entryD,'#e2d3a9');
for(const x of [-1.83,-.29])cyl(x,1.452,8.17,.035,.015,'#fff0cd');
// Set the niche backing at the rear so the display shelf has real depth.
box(entryX,1.25,7.948,entryW-.06,.42,.016,'#69716e');
box(entryX,1.02,entryZ,entryW,.05,entryD,entryDark);
for(const x of [-1.69,-1.06,-.43]){
  box(x,.91,8.277,.615,.17,.018,entryFace,.004);
  box(x,.55,8.277,.615,.58,.018,entryFace,.004);
}
box(entryX,.25,entryZ,entryW,.035,entryD,entryDark,.004);
// The open dining end is slightly softened without creating a seat niche.
box(-.10,.60,entryZ,.055,1.20,entryD,entryFace,.018);
box(-1.50,.07,9.64,.64,.035,.43,'#9da993',.03);
// On entering, the full-length mirror is on the left side wall. Its width
// is 80% of the 90 cm entry door and its top sits just above the door.
box(-1.961,1.10,9.58,.018,2.20,.72,'#343c3a',.006);
const mirrorMat=new T.MeshPhysicalMaterial({color:'#c9dcda',metalness:.58,roughness:.08,clearcoat:1});
box(-1.948,1.10,9.58,.006,2.16,.69,mirrorMat);
// Pegboard belongs to the wall between the door and refrigerator, from
// ceiling height down to about one third of the refrigerator height.
box(.40,1.907,9.970,.88,1.386,.008,'#37494a',.002);
for(let x=.02;x<.80;x+=.11)for(let y=1.25;y<2.56;y+=.11)ball(x,y,9.962,.008,'#1f2d2e');
// A single dark bent-wood nesting table under the pegboard: rounded bridge
// top and curved returns, open beneath it like the reference piece.
const bentTableProfile=new T.Shape();
bentTableProfile.moveTo(-.35,0);bentTableProfile.lineTo(-.35,.45);
bentTableProfile.quadraticCurveTo(-.35,.55,-.25,.55);
bentTableProfile.lineTo(.25,.55);bentTableProfile.quadraticCurveTo(.35,.55,.35,.45);
bentTableProfile.lineTo(.35,0);bentTableProfile.lineTo(.285,0);
bentTableProfile.lineTo(.285,.42);bentTableProfile.quadraticCurveTo(.285,.48,.225,.48);
bentTableProfile.lineTo(-.225,.48);bentTableProfile.quadraticCurveTo(-.285,.48,-.285,.42);
bentTableProfile.lineTo(-.285,0);bentTableProfile.closePath();
const bentTable=new T.Mesh(new T.ExtrudeGeometry(bentTableProfile,{depth:.36,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:2,curveSegments:10}),mat('#222323'));
bentTable.position.set(.40,.055,9.43);bentTable.castShadow=true;bentTable.receiveShadow=true;root.add(bentTable);
// Leave the walkable utility balcony completely clear.
// AC platform at the kitchen end: the column occupies the inner half and
// the platform's outer edge aligns with the unbroken balcony parapet.
box(6.82,-.13,9.72,.72,.22,1.05,'#a9aba4',.02);
box(6.82,.34,9.72,.56,.67,.66,'#c6c9c5',.025);
box(6.82,.36,9.37,.52,.53,.025,'#e3e5de',.008);
const outdoorFan=cyl(6.82,.36,9.35,.19,.025,'#657471');outdoorFan.rotation.x=Math.PI/2;
for(let i=0;i<8;i++){const a=i*Math.PI/4;rod([6.82,.36,9.33],[6.82+.16*Math.cos(a),.36+.16*Math.sin(a),9.33],.012,'#d0d7d3')}
box(6.82,.73,9.72,.61,.035,.67,'#979d98',.005);
// Guard rail separates the appliance platform from the walkable balcony.
rod([6.51,.55,9.20],[7.16,.55,9.20],.018,'#899893');
for(const x of [6.51,6.83,7.16])rod([x,.08,9.20],[x,.55,9.20],.012,'#899893');
// Small welcoming detail away from the clear dining tabletop.
plant(.51,.08,4.11,.62);
let night=false,tv=true,curtainClosed=true,wallLow=false,topView=false;
let theta=.77,phi=.76,dist=19.5,target=new T.Vector3(2.9,.2,5),desiredTarget=target.clone(),desiredDist=19.5;
const rooms={all:{name:'我們的家',desc:'沿著玄關進門，穿過木餐桌，走到灑滿日光的客廳。',pos:[2.9,.2,5],dist:19.5},living:{name:'客廳 · 慢慢過日子',desc:'灰藍懸浮電視櫃、灰色 Bergamo 三人座沙發，還有窗邊的一點綠意。',pos:[1.7,.4,2.15],dist:9.6},dining:{name:'餐廳 · 一起好好吃飯',desc:'木餐桌連著深色檯面的中島，保留了收納櫃與小烤箱。',pos:[1.8,.3,6.3],dist:8.7},kitchen:{name:'廚房 · 香氣的起點',desc:'冰箱、餐邊櫃、水槽與爐台，依施工圖排在家的後端。',pos:[3.5,.3,9],dist:9.8},main:{name:'主臥 · 把夢收好',desc:'雙人床與窗邊柔光。寢具配色為這個小世界的第一版提案。',pos:[4.9,.3,1.7],dist:9.7},child:{name:'次臥 · 小小的天地',desc:'先留一張單人床，讓空間保持寬敞。',pos:[4.45,.3,6.7],dist:8.7},bath:{name:'浴室 · 清爽一下',desc:'洗手台、馬桶與獨立淋浴區。隔間依施工圖，材質先以簡化配色呈現。',pos:[5.5,.3,4.6],dist:8.5},balcony:{name:'陽台 · 日光',desc:'陽台內已清空，經廚房玻璃門進出。冷氣室外機在柱外獨立小平台。',pos:[6.55,.3,7.8],dist:7.8},entry:{name:'玄關 · 歡迎回家',desc:'滿牆玄關櫃、展示層與深色洞洞板，每天回家的第一個角落。',pos:[-.2,.3,8.9],dist:8.5}};
let current='all';function selectRoom(k){current=k;let r=rooms[k];desiredTarget.set(...r.pos);desiredDist=r.dist;$('#roomtitle').textContent=r.name;$('#roomdesc').textContent=r.desc;document.querySelectorAll('[data-room]').forEach(b=>b.classList.toggle('active',b.dataset.room===k));$('#roomactions').replaceChildren();if(k==='kitchen')action('從室內看陽台門',()=>{desiredTarget.set(5.76,1.35,8.66);desiredDist=3.35;theta=-1.48;phi=1.48;topView=false;$('#top').setAttribute('aria-pressed',false)});if(k==='living'){action(tv?'關閉電視':'開啟電視',()=>{tv=!tv;tvMat.color.set(tv?'#60878b':'#263b3e');tvMat.emissiveIntensity=tv?.45:0;tvArt.visible=tv;selectRoom('living');toast(tv?'電視打開了':'享受安靜的客廳')});action(curtainClosed?'拉開窗簾':'合上窗簾',()=>{curtainClosed=!curtainClosed;curtains.visible=curtainClosed;selectRoom('living');toast(curtainClosed?'窗簾合上了':'陽光進來了')})}}function action(label,fn){let b=document.createElement('button');b.textContent=label;b.onclick=fn;$('#roomactions').append(b)}let toastTimer;function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2400)}
document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>selectRoom(b.dataset.room));$('#night').onclick=()=>{night=!night;document.body.classList.toggle('night',night);$('#night').innerHTML=night?'☾ <span>夜晚</span>':'☀ <span>日光</span>';$('#night').setAttribute('aria-pressed',night);hemi.intensity=night?.65:1.35;sun.intensity=night?.35:2.1;fill.intensity=night?.55:.65;sun.color.set(night?'#adc4ed':'#fff6eb');lampMat.emissiveIntensity=night?3:.5;renderer.toneMappingExposure=night?.9:.95;toast(night?'晚安，溫柔的小世界':'早安，今天也是好日子')};$('#walls').onclick=()=>{wallLow=!wallLow;walls.forEach(w=>w.scale.y=wallLow?.32:1);doorFrames.forEach(g=>g.visible=!wallLow);$('#walls').setAttribute('aria-pressed',wallLow);$('#walls span').textContent=wallLow?'低牆':'完整牆';toast(wallLow?'低牆模式 · 查看室內擺設':'完整牆模式 · 房間隔間 2.6 公尺')};$('#top').onclick=()=>{topView=!topView;phi=topView?.045:.76;$('#top').setAttribute('aria-pressed',topView)};$('#reset').onclick=()=>{selectRoom('all');theta=.77;phi=.76;topView=false;$('#top').setAttribute('aria-pressed',false)};$('#plus').onclick=()=>desiredDist=Math.max(5,desiredDist*.86);$('#minus').onclick=()=>desiredDist=Math.min(30,desiredDist/ .86);
// One finger pans by default; the visible switch restores orbit rotation.
// Two fingers pan by their midpoint and pinch to zoom.
function clampPan(){desiredTarget.x=Math.max(-1.5,Math.min(8.5,desiredTarget.x));desiredTarget.z=Math.max(-.5,Math.min(10.5,desiredTarget.z))}
function panByPixels(dx,dy){const r=desiredDist*(portrait?1.37:1);const scale=1.1*r*Math.tan(camera.fov*Math.PI/360)/Math.max(1,host.clientHeight);desiredTarget.x+=(-dx*Math.cos(theta)+dy*Math.sin(theta))*scale;desiredTarget.z+=(dx*Math.sin(theta)+dy*Math.cos(theta))*scale;clampPan()}
function panHorizontal(amount){desiredTarget.x+=amount*Math.cos(theta);desiredTarget.z-=amount*Math.sin(theta);clampPan()}
$('#pan-left').onclick=()=>panHorizontal(.8);$('#pan-right').onclick=()=>panHorizontal(-.8);
let dragMode='pan';$('#drag-mode').onclick=()=>{dragMode=dragMode==='pan'?'rotate':'pan';$('#drag-mode').textContent=dragMode==='pan'?'單指：平移':'單指：旋轉';$('#drag-mode').setAttribute('aria-pressed',dragMode==='pan');toast(dragMode==='pan'?'單指拖曳可左右移動畫面':'單指拖曳可旋轉視角')};
const pointers=new Map();let lastX=0,lastY=0,pinch=0,midX=0,midY=0;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});lastX=e.clientX;lastY=e.clientY;if(pointers.size===2){const p=[...pointers.values()];pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);midX=(p[0].x+p[1].x)/2;midY=(p[0].y+p[1].y)/2}});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){if(dragMode==='pan')panByPixels(e.clientX-lastX,e.clientY-lastY);else{theta-=(e.clientX-lastX)*.006;phi=Math.max(.045,Math.min(1.22,phi+(e.clientY-lastY)*.004));if(topView){topView=false;$('#top').setAttribute('aria-pressed',false)}}}else if(pointers.size===2){const p=[...pointers.values()],n=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),x=(p[0].x+p[1].x)/2,y=(p[0].y+p[1].y)/2;panByPixels(x-midX,y-midY);if(n>5&&pinch>5)desiredDist=Math.max(5,Math.min(30,desiredDist*pinch/n));pinch=n;midX=x;midY=y}lastX=e.clientX;lastY=e.clientY});
function release(e){pointers.delete(e.pointerId);pinch=0;if(pointers.size){const p=[...pointers.values()][0];lastX=p.x;lastY=p.y}}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
canvas.addEventListener('wheel',e=>{e.preventDefault();desiredDist=Math.max(5,Math.min(30,desiredDist*Math.exp(e.deltaY*.001)))},{passive:false});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#error').hidden=false});canvas.addEventListener('webglcontextrestored',()=>location.reload());
let portrait=false;function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;portrait=camera.aspect<.85;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(host);resize();let frame=0;function animate(){requestAnimationFrame(animate);target.lerp(desiredTarget,.075);dist+=(desiredDist-dist)*.075;let r=dist*(portrait?1.37:1);camera.position.set(target.x+Math.sin(theta)*Math.sin(phi)*r,target.y+Math.cos(phi)*r,target.z+Math.cos(theta)*Math.sin(phi)*r);camera.lookAt(target);renderer.render(scene,camera);if(frame++===0)$('#loading').hidden=true}animate();
// Scene inventory available for non-rendering diagnostics and future game integration.
window.homeScene={scene,camera,renderer,rooms,selectRoom,interiorWalls,doorFrames,get currentRoom(){return current}};
