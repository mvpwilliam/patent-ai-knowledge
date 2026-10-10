import * as T from './vendor/three.module.js';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
const $=s=>document.querySelector(s), canvas=$('#scene'), host=$('#world');
let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'default'});}catch(e){$('#loading').hidden=true;$('#error').hidden=false;throw e}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,100);const root=new T.Group();scene.add(root);
const hemi=new T.HemisphereLight(0xf1f4fa,0x747982,1.35);scene.add(hemi);const sun=new T.DirectionalLight(0xfff6eb,2.1);sun.position.set(-3,12,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:40});sun.shadow.bias=-.0005;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun);const fill=new T.DirectionalLight(0xdce7ff,.65);fill.position.set(7,8,-9);scene.add(fill);
const mats=new Map(),geos=new Map();function mat(c){if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.8}));return mats.get(c)}
const C={wall:'#777e8b',trim:'#9298a1',wood:'#a58b6c',woodlight:'#c4ae8b',floor:'#d2c8b7',navy:'#354e63',cream:'#e3e1d9',cab:'#62656b',dark:'#394746',metal:'#6d7773',green:'#789377',white:'#f4f1e6',bed:'#b6c3ac'};
function box(x,y,z,w,h,d,c,round=0,parent=root){let key=[w,h,d,round].join(',');if(!geos.has(key))geos.set(key,round?new RoundedBoxGeometry(w,h,d,2,Math.min(round,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d));let m=new T.Mesh(geos.get(key),typeof c==='string'?mat(c):c);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function cyl(x,y,z,r,h,c,r2=r,parent=root){let m=new T.Mesh(new T.CylinderGeometry(r,r2,h,20),mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function ball(x,y,z,r,c,s=[1,1,1],parent=root){let m=new T.Mesh(new T.SphereGeometry(r,16,12),typeof c==='string'?mat(c):c);m.position.set(x,y,z);m.scale.set(...s);m.castShadow=true;parent.add(m);return m}
function rod(a,b,r,c,parent=root){let aa=new T.Vector3(...a),bb=new T.Vector3(...b);let m=cyl(0,0,0,r,aa.distanceTo(bb),c,r,parent);m.position.copy(aa.add(bb).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...b).sub(new T.Vector3(...a)).normalize());return m}
function plant(x,y,z,scale=1){const p=new T.Group();root.add(p);p.position.set(x,y,z);p.scale.setScalar(scale);cyl(0,.16,0,.19,.32,'#d7c9ab',.14,p);cyl(0,.32,0,.16,.02,'#605c43',.16,p);rod([0,.3,0],[0,1.1,0],.017,'#7b7b52',p);for(let i=0;i<9;i++){let a=i*2.4,yy=.48+i*.074,xx=Math.cos(a)*(.32-i*.014),zz=Math.sin(a)*(.32-i*.014);rod([0,yy-.12,0],[xx,yy,zz],.009,'#7b7b52',p);let leaf=ball(xx,yy,zz,.17,i%2?'#809b65':'#9caa76',[1,.27,.5],p);leaf.rotation.y=-a;}return p}
const floorGroup=new T.Group();root.add(floorGroup);
function floor(x,z,w,d,color=C.floor){box(x,-.18,z,w,.32,d,'#c9baa0',.04);box(x,.005,z,w,.06,d,color);for(let zz=z-d/2+.28;zz<z+d/2;zz+=.29){box(x,.04,zz,w,.007,.012,'#cabfa9');for(let xx=x-w/2+(((zz*100)|0)%2?.6:1.3);xx<x+w/2;xx+=1.6)box(xx,.041,zz-.14,.012,.005,.27,'#d2c7b1')}}
floor(3.2,5,6.4,10);floor(-.6,8.95,1.2,2.1,'#c9c8b9');floor(6.85,7.5,.9,3.8,'#b9c2b0');
// Foundation and soft ground beneath the miniature.
box(2.8,-.52,5,9.2,.28,12.2,'#d3dac4',.13);box(2.8,-.72,5,9.5,.18,12.5,'#bdcbae',.06);
const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({color:0x536e48,opacity:.15}));ground.rotation.x=-Math.PI/2;ground.position.y=-.82;ground.receiveShadow=true;scene.add(ground);
const walls=[];function wall(x,z,w,d,h=1.15){let g=new T.Group();g.position.set(x,0,z);root.add(g);box(0,h/2,0,w,h,d,C.wall,.018,g);box(0,h+.025,0,w+.045,.05,d+.045,C.trim,.012,g);box(0,.075,0,w+.035,.11,d+.035,'#545b66',.006,g);walls.push(g);return g}
wall(3.2,-.07,6.55,.15,1.75);wall(-.07,3.9,.15,7.9,1.55);wall(6.47,2.75,.15,5.7,.62);wall(6.47,7.7,.15,4.6,.62);wall(3.2,10.07,6.55,.15,.65);wall(-1.27,8.95,.15,2.25,.8);wall(-.65,7.85,1.35,.15,1.5);wall(-.93,10.07,.65,.15,.25);
// Interior walls use a full 2.6 m height; low-wall mode is display-only.
const ROOM_WALL_HEIGHT=2.6;
const interiorWalls=[];
function partition(x,z,w,d){const g=wall(x,z,w,d,ROOM_WALL_HEIGHT);g.userData.fullHeight=ROOM_WALL_HEIGHT;interiorWalls.push(g);return g}
// CAD's thick purple lines set the walls; its door arcs set the openings.
// In plan view model X runs downward and model Z runs from right to left.
partition(3.35,2.25,.14,4.5); // continuous living/master divider, to the short entrance wall
partition(5.46,3.65,2.02,.14); // master/bath wall, x 4.45–6.47
partition(4.45,4.125,.13,.75); // bathroom front wall, z 3.75–4.50
partition(5.35,5.55,1.8,.13); // bath/child wall below the child door
partition(3.05,5.55,.8,.13); // short wall above the child door
partition(2.65,6.875,.13,2.65); // child-room wall along the dining area
partition(4.24,8.2,3.18,.13); // child-room wall along the kitchen
partition(5.83,7.82,.13,.76); // child room / balcony, left of the window
partition(5.83,6.015,.13,.93); // child room / balcony, right of the window
partition(3.05,9.68,.13,.78); // short kitchen return beside the fridge cabinet
// Glazing between the child room and utility balcony occupies the CAD opening.
const childWindow=new T.Group();childWindow.position.set(5.83,0,6.96);root.add(childWindow);
box(0,.46,0,.13,.92,.96,C.wall,.008,childWindow);
box(0,2.36,0,.13,.48,.96,C.wall,.008,childWindow);
const childGlass=new T.MeshPhysicalMaterial({color:'#bed9d7',transparent:true,opacity:.38,roughness:.17,depthWrite:false,side:T.DoubleSide});
box(0,1.55,0,.018,1.2,.91,childGlass,0,childWindow);
for(const z of [-.47,.47])box(0,1.55,z,.08,1.25,.035,C.trim,0,childWindow);
box(0,.94,0,.1,.05,.96,C.trim,0,childWindow);box(0,2.16,0,.1,.05,.96,C.trim,0,childWindow);
walls.push(childWindow);interiorWalls.push(childWindow);
// Only the utility balcony has a parapet; the shower has a glass enclosure.
wall(7.36,7.5,.13,3.85,.55);
const doorFrames=[];
function doorway(x,z,width,alongZ=true){const g=new T.Group();g.position.set(x,0,z);if(alongZ)g.rotation.y=Math.PI/2;root.add(g);const h=2.1;
for(const side of [-1,1])box(side*(width/2-.025),h/2,0,.05,h,.18,'#454c57',.008,g);
box(0,h+.035,0,width,.07,.18,'#454c57',.008,g);
box(0,(h+.07+ROOM_WALL_HEIGHT)/2,0,width,ROOM_WALL_HEIGHT-h-.07,.14,C.wall,.008,g);
doorFrames.push(g)}
// The master door sits in the short transverse entrance from the living room,
// between the divider and bathroom wall (the door swing on the detailed plan).
doorway(3.90,4.5,1.10,false);
const masterDoor=new T.Group();root.add(masterDoor);
box(3.22,1.01,4.02,.065,2.02,.88,'#3f3532',.012,masterDoor);
for(const y of [.52,1.39])box(3.173,y,4.02,.008,.51,.60,'#51433b',.008,masterDoor);
ball(3.17,1.02,4.29,.035,C.metal,[.8,.8,1],masterDoor);
doorFrames.push(masterDoor);
doorway(4.45,5.025,1.05); // bathroom door, z 4.50–5.55
doorway(3.95,5.55,1.0,false); // child door, x 3.45–4.45 beside the bath
// Window frames and sheer curtain folds at the two north windows.
const curtains=new T.Group();root.add(curtains);function windowAt(x,w){box(x,1.1,.015,w,1.6,.075,'#607779',.015);box(x,1.12,.062,w-.12,1.38,.018,new T.MeshStandardMaterial({color:'#b9d3d1',roughness:.25,emissive:'#9dbabc',emissiveIntensity:.2}));box(x,1.13,.083,.035,1.38,.025,C.dark);box(x,.53,.083,w,.035,.025,C.dark);for(let i=0;i<14;i++){let xx=x-w/2+.055+i*(w-.11)/13;let m=cyl(xx,1.07,.18,.035,1.68,i%2?'#eeeddf':'#d9dfd3',.035,curtains);m.scale.z=.8}box(x,1.95,.16,w+.14,.06,.1,C.cream,.02)}windowAt(1.67,2.5);windowAt(4.92,2.55);
// Living area: blue-gray floating console, television, consoles and soundbar.
box(1.65,.07,2.32,2.7,.06,3.35,'#d6d4bf',.03);for(let i=0;i<12;i++)box(1.65,.107,.75+i*.27,2.65,.006,.011,'#c5c7b5');
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
cyl(1.55,.35,2.16,.43,.1,'#e8dfca');cyl(1.55,.2,2.16,.25,.25,C.wood);box(1.5,.413,2.18,.23,.025,.27,'#9ba68b',.01);cyl(1.74,.44,2.09,.055,.1,'#f9f4e7');
const lampMat=new T.MeshStandardMaterial({color:'#fff1ce',emissive:'#ffe0a1',emissiveIntensity:.5});cyl(2.85,.08,.42,.18,.06,C.metal);rod([2.85,.1,.42],[2.85,1.53,.42],.022,C.metal);ball(2.85,1.56,.42,.18,lampMat);plant(.45,.67,.57,.42);
// Portrait artwork and wall-mounted guitar, simplified as game props.
box(.035,1.12,5.0,.065,.93,.59,'#c4b797',.01);box(.08,1.12,5,.02,.84,.50,C.white);ball(.097,1.21,5,.12,'#384440',[.08,1.25,.75]);box(.097,.96,5,.012,.26,.24,'#384440',.01);
ball(3.22,1.10,3.05,.16,'#957e57',[.25,1.1,.75]);ball(3.22,1.27,3.05,.12,'#a58a5c',[.3,1,.8]);box(3.22,1.54,3.05,.045,.45,.05,C.wood);box(3.22,1.78,3.05,.05,.12,.09,C.dark,.012);
// Dining table, curved backs, oak seats and peninsula with oven niches.
function chair(x,z){for(let dx of [-.20,.20])for(let dz of [-.20,.20])rod([x+dx*1.2,.07,z+dz*1.2],[x+dx,.49,z+dz],.027,C.wood);box(x,.49,z,.49,.08,.48,'#c6c5af',.07);const back=box(x-.21,.78,z,.075,.34,.5,C.woodlight,.05);rod([x-.20,.61,z-.23],[x+.18,.68,z-.23],.023,C.woodlight);rod([x-.20,.61,z+.23],[x+.18,.68,z+.23],.023,C.woodlight)}
box(1.36,.76,6.15,1.03,.12,1.65,C.woodlight,.16);box(1.36,.39,6.15,.59,.69,.88,'#c8b493',.18);chair(.55,5.76);chair(.55,6.52);plant(1.36,.83,6.1,.39);
// The peninsula sits on the dining side of the CAD wall, with its back against it.
const peninsula=new T.Group();peninsula.position.set(2.23,0,6.8);peninsula.rotation.y=-Math.PI/2;root.add(peninsula);
box(0,.44,0,2.28,.85,.59,C.cab,.03,peninsula);box(0,.89,0,2.4,.075,.68,'#303237',.028,peninsula);
for(const x of [-.66,.01]){box(x,.55,.314,.57,.38,.024,'#303e3d',0,peninsula);box(x,.54,.34,.44,.29,.05,'#e1dfcf',.02,peninsula);box(x,.54,.37,.31,.19,.006,'#697877',0,peninsula);box(x,.65,.387,.29,.018,.025,C.metal,0,peninsula)}
for(const yy of [.22,.49,.71]){box(.77,yy,.31,.53,.21,.025,'#b5aa91',.009,peninsula);box(.77,yy+.065,.33,.30,.013,.017,C.dark,0,peninsula)}
// Full-height built-in cabinets beside dining room.
box(3.07,.96,6.21,.38,1.86,1.1,C.cab,.018);for(let z of [5.92,6.46]){box(2.869,.96,z,.015,1.78,.51,'#686b72',.006);box(2.85,.86,z-.16,.022,.28,.016,C.dark)}
// Master bedroom, window-side bed, wardrobe and small bedside tables.
box(4.96,.08,1.64,2.28,.06,2.6,'#c7cbbb',.06);box(5.84,.54,1.64,.16,.94,2.05,'#b0ad98',.08);box(4.94,.29,1.64,1.85,.35,1.94,C.wood,.045);box(4.94,.52,1.64,1.90,.22,1.95,C.white,.08);box(4.63,.67,1.64,1.25,.15,1.94,C.bed,.075);for(let z of [1.12,2.15]){let p=box(5.54,.70,z,.45,.17,.71,'#f3ecda',.07);p.rotation.z=-.04}box(4.24,.77,1.64,.33,.07,1.95,'#8ea48d',.03);for(let z of [.39,2.98]){cyl(5.68,.32,z,.23,.58,C.woodlight);cyl(5.68,.63,z,.24,.05,C.cream);ball(5.68,.79,z,.12,lampMat)}box(5.22,.82,3.37,1.96,1.57,.43,C.cab,.02);for(let x of [4.59,5.23,5.87]){box(x,.83,3.143,.61,1.48,.02,'#75777c');box(x+.23,.83,3.126,.018,.2,.018,C.dark)}plant(3.68,.08,.4,.6);
// Bathroom tiled floor, basin, mirror, toilet and glass shower partition.
box(5.4,.07,4.58,1.91,.06,1.64,'#55585b');for(let x=4.5;x<6.4;x+=.32)box(x,.105,4.58,.01,.004,1.64,'#777b7c');for(let z=3.8;z<5.4;z+=.32)box(5.4,.105,z,1.9,.004,.01,'#777b7c');box(4.73,.42,4.1,.57,.63,.60,C.woodlight,.035);box(4.73,.77,4.1,.62,.10,.64,'#45474b',.03);ball(4.73,.827,4.1,.21,C.white,[1,.12,1]);rod([4.73,.83,3.88],[4.73,1,3.88],.025,C.metal);rod([4.73,1,3.88],[4.73,1,4.0],.025,C.metal);box(4.73,1.27,3.76,.54,.7,.035,'#859e9c',.02);box(5.76,.53,3.98,.47,.76,.23,C.white,.07);ball(5.76,.40,4.33,.28,C.white,[.78,.7,1.15]);ball(5.76,.57,4.33,.22,'#d3ddd4',[.83,.15,1.14]);
// The wet area sits inside the bathroom, separated by glass rather than a low wall.
box(5.9,.07,5.1,1.0,.06,.8,'#55585b');
const showerGlass=new T.MeshPhysicalMaterial({color:'#d9eeee',transparent:true,opacity:.17,roughness:.08,metalness:0,depthWrite:false,side:T.DoubleSide});
box(5.9,1.08,4.7,1.0,2.05,.018,showerGlass);box(5.4,1.08,5.12,.018,2.05,.76,showerGlass);
for(const z of [4.74,5.5])rod([5.4,.08,z],[5.4,2.13,z],.012,C.metal);
rod([5.4,2.14,4.74],[5.4,2.14,5.5],.013,C.metal);
rod([5.4,.10,4.74],[5.4,.10,5.5],.008,C.metal);
rod([5.37,.99,5.19],[5.37,1.33,5.19],.014,C.metal);
rod([6.37,.12,5.15],[6.37,1.53,5.15],.02,C.metal);rod([6.37,1.53,5.15],[6.13,1.53,5.15],.02,C.metal);cyl(6.13,1.51,5.15,.085,.03,C.metal);
// Child room: single bed and desk, no character yet.
box(5.12,.25,6.72,1.1,.35,1.95,C.wood,.06);box(5.12,.51,6.72,1.1,.20,1.94,C.white,.055);box(5.12,.67,6.94,1.11,.13,1.48,'#c0ccbd',.05);box(5.12,.7,5.99,.72,.18,.37,'#f0dfb7',.07);box(5.12,.61,5.7,1.13,1.01,.11,C.woodlight,.03);box(5.12,.765,7.22,1.12,.04,.36,'#8fa8a0',.02);box(4.1,.72,7.18,.65,.09,1.05,C.woodlight,.03);for(let z of [6.74,7.61])box(4.1,.36,z,.055,.7,.055,C.wood);box(4.04,.78,7.0,.4,.018,.32,'#f4ebd7',.005);box(4.08,.81,7.35,.3,.04,.24,'#859b9a',.005);cyl(4.28,.46,7.22,.23,.08,'#b8bc9b');cyl(4.28,.24,7.22,.035,.4,C.wood);box(3.92,1.0,6.22,.3,1.86,.62,C.cab,.02);
// Kitchen and appliances, preserving dark countertops and pale cabinetry.
// The two kitchen counters stop at the short CAD wall beside the fridge cabinet.
box(2.36,.45,9.68,1.2,.83,.61,C.cab,.02);box(2.36,.89,9.66,1.2,.07,.70,'#eee9db',.022);
box(4.5,.45,9.68,2.7,.83,.61,C.cab,.02);box(4.5,.89,9.66,2.75,.07,.70,'#eee9db',.022);
for(const x of [2.05,2.65,3.43,4.05,4.68,5.31]){box(x,.46,9.363,.55,.70,.024,x>4?'#405153':'#707379',.009);box(x,.73,9.345,.38,.025,.025,C.metal)}box(3.95,.945,9.61,.72,.035,.43,C.metal,.07);box(3.95,.967,9.61,.59,.025,.32,'#a7b9b3',.06);rod([3.95,.96,9.86],[3.95,1.25,9.86],.022,C.metal);rod([3.95,1.25,9.86],[3.95,1.25,9.65],.022,C.metal);box(5.45,.948,9.60,.65,.04,.44,'#283c3e',.025);for(const x of [5.27,5.62]){cyl(x,.984,9.59,.12,.02,C.metal);cyl(x,1,9.59,.08,.023,'#253b3b')}box(5.45,1.73,9.74,.89,.14,.49,'#dadbd0',.025);box(5.45,1.95,9.89,.5,.35,.23,C.white,.02);box(2.36,1.65,9.89,1.18,.73,.27,C.cab,.012);box(2.36,1.24,9.9,1.18,.025,.28,'#f9e5ae');box(2.03,1.08,9.58,.32,.3,.26,C.white,.04);box(2.52,1.07,9.61,.28,.29,.31,C.white,.05);cyl(2.75,1.03,9.62,.10,.15,C.white);cyl(2.75,1.19,9.62,.09,.2,'#afc4bd');
box(1.35,.95,9.52,.73,1.85,.83,'#87928b',.045);for(let yy of [1.39,.85,.34])box(1.35,yy,9.08,.67,yy>1?.88:.32,.035,'#a2aaa0',.018);box(1.36,1.39,9.048,.016,.87,.025,'#6a7b73');box(1.37,.73,9.04,.5,.025,.04,C.dark);box(1.55,1.6,9.045,.14,.2,.01,'#e3e4c8');
// Entry cabinet, dark pegboard, bench, shoes, and a welcoming mat.
box(-.65,.95,8.03,.95,1.84,.31,C.cab,.015);box(-.65,.9,8.205,.81,.44,.025,'#405b53');box(-.65,.65,8.23,.95,.045,.39,C.woodlight,.01);box(-.65,1.15,8.23,.95,.025,.39,'#f3dfab');plant(-.87,.68,8.25,.25);box(-.47,.8,8.245,.16,.23,.025,C.cream);box(-.71,.07,9.64,.64,.035,.43,'#9da993',.03);for(let x of [-.75,-.52])ball(x,.1,8.3,.11,'#b8a381',[.65,.45,1.35]);box(.37,.91,9.98,.75,1.0,.04,'#42625e',.02);for(let x=.1;x<.7;x+=.12)for(let y=.5;y<1.35;y+=.12)ball(x,y,9.948,.012,'#273f3e');box(.38,.42,9.60,.7,.22,.5,'#adb9a5',.09);for(let x of [.13,.63])box(x,.2,9.6,.05,.36,.28,C.wood);box(-1.16,.94,9.06,.04,1.46,.66,'#829b95',.025);
// Utility balcony: washing machine, storage, herb pots.
box(6.89,.49,8.72,.65,.91,.66,C.white,.04);let drum=cyl(6.89,.5,8.36,.23,.035,'#839b9b');drum.rotation.x=Math.PI/2;let glass=cyl(6.89,.5,8.33,.17,.04,'#405e60');glass.rotation.x=Math.PI/2;box(6.89,.82,8.37,.49,.08,.025,'#cfdbd0',.01);box(6.89,1.33,8.96,.72,.66,.26,C.cab,.025);plant(6.9,.08,6.08,.62);plant(6.87,.08,6.68,.40);
// Small welcoming details.
plant(.51,.08,4.11,.62);box(1.7,.86,5.66,.20,.03,.26,'#ede4cc',.015);cyl(1.7,.92,5.66,.05,.10,C.white);
let night=false,tv=true,curtainClosed=true,wallLow=false,topView=false;
let theta=.77,phi=.76,dist=19.5,target=new T.Vector3(2.9,.2,5),desiredTarget=target.clone(),desiredDist=19.5;
const rooms={all:{name:'我們的家',desc:'沿著玄關進門，穿過木餐桌，走到灑滿日光的客廳。',pos:[2.9,.2,5],dist:19.5},living:{name:'客廳 · 慢慢過日子',desc:'灰藍懸浮電視櫃、灰色 Bergamo 三人座沙發，還有窗邊的一點綠意。',pos:[1.7,.4,2.15],dist:9.6},dining:{name:'餐廳 · 一起好好吃飯',desc:'木餐桌連著深色檯面的中島，保留了收納櫃與小烤箱。',pos:[1.8,.3,6.3],dist:8.7},kitchen:{name:'廚房 · 香氣的起點',desc:'冰箱、餐邊櫃、水槽與爐台，依施工圖排在家的後端。',pos:[3.5,.3,9],dist:9.8},main:{name:'主臥 · 把夢收好',desc:'雙人床與窗邊柔光。寢具配色為這個小世界的第一版提案。',pos:[4.9,.3,1.7],dist:9.7},child:{name:'次臥 · 小小的天地',desc:'單人床、書桌與收納空間，留給下一章的小主人。',pos:[4.45,.3,6.7],dist:8.7},bath:{name:'浴室 · 清爽一下',desc:'洗手台、馬桶與獨立淋浴區。隔間依施工圖，材質先以簡化配色呈現。',pos:[5.5,.3,4.6],dist:8.5},entry:{name:'玄關 · 歡迎回家',desc:'鞋櫃、穿鞋椅和深色洞洞板，每天回家的第一個角落。',pos:[-.2,.3,8.9],dist:8.5}};
let current='all';function selectRoom(k){current=k;let r=rooms[k];desiredTarget.set(...r.pos);desiredDist=r.dist;$('#roomtitle').textContent=r.name;$('#roomdesc').textContent=r.desc;document.querySelectorAll('[data-room]').forEach(b=>b.classList.toggle('active',b.dataset.room===k));$('#roomactions').replaceChildren();if(k==='living'){action(tv?'關閉電視':'開啟電視',()=>{tv=!tv;tvMat.color.set(tv?'#60878b':'#263b3e');tvMat.emissiveIntensity=tv?.45:0;tvArt.visible=tv;selectRoom('living');toast(tv?'電視打開了':'享受安靜的客廳')});action(curtainClosed?'拉開窗簾':'合上窗簾',()=>{curtainClosed=!curtainClosed;curtains.visible=curtainClosed;selectRoom('living');toast(curtainClosed?'窗簾合上了':'陽光進來了')})}}function action(label,fn){let b=document.createElement('button');b.textContent=label;b.onclick=fn;$('#roomactions').append(b)}let toastTimer;function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2400)}
document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>selectRoom(b.dataset.room));$('#night').onclick=()=>{night=!night;document.body.classList.toggle('night',night);$('#night').innerHTML=night?'☾ <span>夜晚</span>':'☀ <span>日光</span>';$('#night').setAttribute('aria-pressed',night);hemi.intensity=night?.65:1.35;sun.intensity=night?.35:2.1;fill.intensity=night?.55:.65;sun.color.set(night?'#adc4ed':'#fff6eb');lampMat.emissiveIntensity=night?3:.5;renderer.toneMappingExposure=night?.9:.95;toast(night?'晚安，溫柔的小世界':'早安，今天也是好日子')};$('#walls').onclick=()=>{wallLow=!wallLow;walls.forEach(w=>w.scale.y=wallLow?.32:1);doorFrames.forEach(g=>g.visible=!wallLow);$('#walls').setAttribute('aria-pressed',wallLow);$('#walls span').textContent=wallLow?'低牆':'完整牆';toast(wallLow?'低牆模式 · 查看室內擺設':'完整牆模式 · 房間隔間 2.6 公尺')};$('#top').onclick=()=>{topView=!topView;phi=topView?.045:.76;$('#top').setAttribute('aria-pressed',topView)};$('#reset').onclick=()=>{selectRoom('all');theta=.77;phi=.76;topView=false;$('#top').setAttribute('aria-pressed',false)};$('#plus').onclick=()=>desiredDist=Math.max(5,desiredDist*.86);$('#minus').onclick=()=>desiredDist=Math.min(30,desiredDist/ .86);
// Touch-first camera controls: one pointer orbits, two pointers zoom.
const pointers=new Map();let lastX=0,lastY=0,pinch=0;canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});lastX=e.clientX;lastY=e.clientY;if(pointers.size===2){const p=[...pointers.values()];pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}});canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){theta-=(e.clientX-lastX)*.006;phi=Math.max(.045,Math.min(1.22,phi+(e.clientY-lastY)*.004));if(topView){topView=false;$('#top').setAttribute('aria-pressed',false)}}else{let p=[...pointers.values()],n=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(n>5&&pinch>5)desiredDist=Math.max(5,Math.min(30,desiredDist*pinch/n));pinch=n}lastX=e.clientX;lastY=e.clientY});function release(e){pointers.delete(e.pointerId);if(pointers.size){let p=[...pointers.values()][0];lastX=p.x;lastY=p.y}}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);canvas.addEventListener('wheel',e=>{e.preventDefault();desiredDist=Math.max(5,Math.min(30,desiredDist*Math.exp(e.deltaY*.001)))},{passive:false});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#error').hidden=false});canvas.addEventListener('webglcontextrestored',()=>location.reload());
let portrait=false;function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;portrait=camera.aspect<.85;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(host);resize();let frame=0;function animate(){requestAnimationFrame(animate);target.lerp(desiredTarget,.075);dist+=(desiredDist-dist)*.075;let r=dist*(portrait?1.37:1);camera.position.set(target.x+Math.sin(theta)*Math.sin(phi)*r,target.y+Math.cos(phi)*r,target.z+Math.cos(theta)*Math.sin(phi)*r);camera.lookAt(target);renderer.render(scene,camera);if(frame++===0)$('#loading').hidden=true}animate();
// Scene inventory available for non-rendering diagnostics and future game integration.
window.homeScene={scene,camera,renderer,rooms,selectRoom,interiorWalls,doorFrames,get currentRoom(){return current}};
