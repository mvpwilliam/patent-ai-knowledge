import * as T from './vendor/three.module.js';

// Reusable articulated game asset. Units are metres; the pet is about 0.9m tall.
// Static parts are baked into one vertex-colour mesh per moving joint.
export function createEmberRex({growthStage=5}={}){
 const root=new T.Group();root.name='熔焰番茄龍';root.scale.setScalar(.8);
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.9,metalness:0,flatShading:true});
 const batches=[],geometries=[];
 const C={red:0xb64c3e,light:0xcf6550,dark:0x843b35,belly:0xf1d3a0,gold:0xe7a33f,flame:0xf5bf57,black:0x263b32,white:0xfff4d8,mouth:0x543531};
 function joint(parent,name,x=0,y=0,z=0){const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);batches.push({g,parts:[]});return g}
 function part(g,w,h,d,color,x,y,z,rx=0,ry=0,rz=0,bevel=.025){
  const b=Math.min(bevel,w/5,h/5,d/5),shape=new T.Shape();shape.moveTo(-w/2+b,-h/2+b);shape.lineTo(w/2-b,-h/2+b);shape.lineTo(w/2-b,h/2-b);shape.lineTo(-w/2+b,h/2-b);shape.closePath();
  const geo=new T.ExtrudeGeometry(shape,{depth:d-2*b,bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:1,steps:1,curveSegments:1});geo.translate(0,0,-d/2+b);
  const m=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(1,1,1));geo.applyMatrix4(m);batches.find(o=>o.g===g).parts.push({geo,color});
 }
 function spike(g,x,y,z,size,color,lean=0){const geo=new T.ConeGeometry(size*.45,size,4,1);geo.rotateY(Math.PI/4);geo.rotateX(lean);geo.translate(x,y+size*.35,z);batches.find(o=>o.g===g).parts.push({geo,color})}
 const body=joint(root,'body',0,.425,0);
 part(body,.38,.43,.41,C.red,0,.12,0,-.16);part(body,.29,.22,.28,C.light,0,.32,.12,-.15);
 // Layered belly scutes, clearly visible from the front and three-quarter view.
 for(let i=0;i<4;i++)part(body,.24-i*.018,.072,.055,i%2?C.belly:0xe6bf87,0,.29-i*.072,.213+i*.008,-.1,0,0,.009);
 for(const side of [-1,1]){part(body,.12,.13,.22,C.light,side*.17,.14,-.01,0,0,side*.12);part(body,.07,.1,.1,C.dark,side*.202,.04,-.07,0,0,side*.2)}
 const head=joint(body,'head',0,.35,.16);head.scale.setScalar(growthStage===3?1.12:growthStage===4?1.05:1);
 part(head,.36,.27,.33,C.red,0,.115,.055);part(head,.37,.17,.30,C.light,0,.065,.24);
 part(head,.33,.055,.29,C.mouth,0,-.025,.25,0,0,0,.008);
 // Eye sockets, inset square pupils and glints on both sides.
 for(const s of [-1,1]){part(head,.018,.105,.105,C.dark,s*.182,.13,.13,0,0,0,.004);part(head,.023,.072,.067,C.white,s*.191,.129,.15,0,0,0,.003);part(head,.026,.048,.035,C.black,s*.195,.123,.166,0,0,0,.002);part(head,.028,.016,.012,0xffffff,s*.198,.14,.176,0,0,0,.001);part(head,.05,.045,.14,C.light,s*.17,.198,.15,0,0,s*-.08,.008);part(head,.018,.027,.04,C.dark,s*.184,.071,.342,0,0,0,.003)}
 const jaw=joint(head,'jaw',0,-.04,.10);part(jaw,.30,.066,.38,C.belly,0,-.025,.10,0,0,0,.016);part(jaw,.32,.064,.16,C.red,0,-.019,-.055);
 for(const s of [-1,1])for(let i=0;i<3;i++){spike(jaw,s*.126,.01,.13+i*.065,.035,C.white);const geo=new T.ConeGeometry(.012,.027,4);geo.rotateZ(Math.PI);geo.translate(s*.145,-.021,.24+i*.06);batches.find(o=>o.g===head).parts.push({geo,color:C.white})}
 const legs=[],arms=[];
 for(const s of [-1,1]){const leg=joint(body,'leg',s*.205,-.08,-.015);legs.push(leg);part(leg,.20,.25,.23,C.light,0,-.055,0,-.2);part(leg,.14,.19,.14,C.red,0,-.20,.055,.15);part(leg,.21,.105,.30,C.dark,0,-.285,.12);for(let i=0;i<3;i++)part(leg,.052,.044,.082,C.belly,(i-1)*.067,-.288,.269,0,0,0,.007);
 const arm=joint(body,'arm',s*.205,.25,.17);arms.push(arm);part(arm,.075,.13,.085,C.dark,0,-.05,.005,-.5,0,s*.25,.012);part(arm,.085,.06,.13,C.light,0,-.105,.055);for(const offset of [-.022,.022])part(arm,.021,.027,.045,C.belly,offset,-.11,.125,0,0,0,.004)}
 const tail=joint(body,'tail',0,-.015,-.18);tail.scale.setScalar(growthStage===3?.75:growthStage===4?.88:1);
 part(tail,.25,.20,.28,C.red,0,-.02,-.10,-.18);part(tail,.18,.16,.26,C.light,0,.005,-.31,.30);part(tail,.12,.13,.23,C.red,0,.073,-.50,.42);part(tail,.08,.10,.18,C.dark,0,.15,-.65,.58);
 const fire=joint(tail,'tail flame',0,.24,-.73);fire.visible=growthStage>=4;fire.scale.setScalar(growthStage===4?.65:1);spike(fire,0,0,0,.20,C.gold,-.2);spike(fire,-.045,-.015,.015,.12,0xe47833,-.6);spike(fire,.045,.01,-.015,.14,C.flame,.25);part(fire,.065,.095,.07,0xffd97b,0,.045,.01,0,0,.15,.005);
 // Alternating golden plates keep the spine legible at gameplay scale.
 for(const [y,z,size] of [[.36,-.12,.18],[.23,-.21,.17],[.07,-.26,.14]])spike(body,0,y,z,size,C.gold,-.5);
 for(const [y,z,size] of [[.08,-.16,.13],[.12,-.35,.11],[.20,-.55,.08]])spike(tail,0,y,z,size,C.flame,-.45);
 spike(head,0,.24,-.02,growthStage===3?.10:.17,C.gold,-.3);if(growthStage===5)spike(head,0,.20,-.15,.12,0xdd8438,-.5);
 // Bake by joint: considerably fewer draw calls than one mesh for each detail.
 for(const {g,parts} of batches){const pos=[],normal=[],colors=[];for(const {geo,color} of parts){const flat=geo.index?geo.toNonIndexed():geo;const c=new T.Color(color);pos.push(...flat.attributes.position.array);normal.push(...flat.attributes.normal.array);for(let i=0;i<flat.attributes.position.count;i++)colors.push(c.r,c.g,c.b);if(flat!==geo)flat.dispose();geo.dispose()}if(!pos.length)continue;const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normal,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeBoundingSphere();geometries.push(geo);const mesh=new T.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh)}
 root.userData.update=(time,{walk=false,roar=false}={})=>{body.position.y=.425+Math.abs(Math.sin(time*(walk?8:2.4)))*.005;head.rotation.x=Math.sin(time*1.7)*.035;tail.rotation.y=Math.sin(time*2.2)*.12;fire.rotation.z=Math.sin(time*3)*.05;jaw.rotation.x=roar?Math.max(0,Math.sin(time*4))*.32:.045;legs.forEach((l,i)=>{const stride=walk?Math.sin(time*8+i*Math.PI):0;l.position.y=-.08+Math.max(0,stride)*.045;l.position.z=-.015+stride*.055});arms.forEach((a,i)=>a.rotation.x=walk?Math.sin(time*8+i*Math.PI)*.13:Math.sin(time*2)*.04)};
 root.userData.dispose=()=>{geometries.forEach(g=>g.dispose());material.dispose()};
 root.userData.stats={drawCalls:geometries.length,triangles:geometries.reduce((n,g)=>n+g.attributes.position.count/3,0)};
 return root;
}

