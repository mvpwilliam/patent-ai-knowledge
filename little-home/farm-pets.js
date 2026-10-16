import * as T from './vendor/three.module.js';
import {createEmberRex} from './ember-rex.js?v=farm-shape-5';
import {stage} from './farm-core.js?v=farm-1';
export function createFarmPet(pet){
 const s=stage(pet),line=pet.line||'mixed';
 if(line==='tomato'&&s>=3){const g=createEmberRex({growthStage:s});g.scale.multiplyScalar([0,0,0,.65,.82,1][s]);return g}
 const root=new T.Group(),material=new T.MeshStandardMaterial({vertexColors:true,roughness:.95,flatShading:true}),batches=[],geos=[];
 const palette=line==='radish'?[0x819e65,0xb5cb89,0x566e48]:line==='pumpkin'?[0xd69640,0xeebd68,0x7d8a6b]:line==='tomato'?[0xcc6851,0xe89d6a,0x9f4537]:[0xeadbb6,0xf2e7cc,0x9bbbab];const [base,light,dark]=s?palette:[0xedc65e,0xf9df8a,0xd79b43];
 function joint(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);batches.push({g,parts:[]});return g}
 function piece(g,geo,color,x,y,z,rx=0,ry=0,rz=0){geo.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(1,1,1)));batches.find(v=>v.g===g).parts.push({geo,color})}
 function box(g,w,h,d,c,x=0,y=0,z=0,rx=0,ry=0,rz=0){const b=Math.min(.018,w/5,h/5,d/5),shape=new T.Shape();shape.moveTo(-w/2+b,-h/2+b);shape.lineTo(w/2-b,-h/2+b);shape.lineTo(w/2-b,h/2-b);shape.lineTo(-w/2+b,h/2-b);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:d-2*b,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:1,steps:1});geo.translate(0,0,-d/2+b);piece(g,geo,c,x,y,z,rx,ry,rz)}
 function leaf(g,x,y,z,size,color,rx=0,rz=0){const geo=new T.OctahedronGeometry(size,0);geo.scale(.48,1,.27);piece(g,geo,color,x,y,z,rx,0,rz)}
 // Each stage changes anatomy, not only scale: chick, adorned chick,
 // tailed fledgling, juvenile beast, winged/armoured beast, final guardian.
 const adult=s>=3,quad=adult&&(line==='pumpkin'||line==='mixed'||(line==='radish'&&s===5));
 const length=adult?([0,0,0,.45,.58,.74][s]):(s===2?.36:.29);
 const width=adult?([0,0,0,.34,.42,.52][s]):.30;
 const bodyY=quad?.30:adult?.38:.25;
 const rootBody=joint(root,0,bodyY,0),body=rootBody;
 const head=joint(body,0,quad?.19:adult?.30:.20,adult?length*.46:.10),legs=[],wings=[];
 const bodyColor=line==='pumpkin'&&adult?dark:base;
 box(body,width,adult?.34:.29,length,bodyColor,0,.06,0);
 box(body,width*.72,.23,.045,0xf1dfb6,0,.06,length/2+.01);
 const headW=adult?(line==='pumpkin'?.37:.34):.30,headD=adult?.34:.28;
 box(head,headW,adult?.28:.28,headD,line==='pumpkin'&&adult?dark:light);
 const bird=!adult||line==='mixed';
 if(bird){box(head,.13,.075,.11,0xe6a349,0,-.05,headD/2+.04);for(const side of [-1,1]){box(head,.044,.065,.018,0x304638,side*.095,.025,headD/2+.008);box(head,.012,.016,.02,0xfff8dd,side*.087,.04,headD/2+.019)}}
 else{box(head,.28,.12,.21,line==='pumpkin'?dark:base,0,-.04,.22);box(head,.25,.045,.21,0xf5e1b7,0,-.108,.21);for(const side of [-1,1]){box(head,.018,.07,.055,0x2b4438,side*(headW/2+.006),.045,.08);box(head,.02,.018,.018,0xfff7db,side*(headW/2+.01),.062,.09);box(head,.04,.045,.11,dark,side*.16,.104,.065)}}
 const feet=quad?4:2;
 for(let i=0;i<feet;i++){const x=(i%2?-1:1)*(width/2+.015),z=quad?(i<2?length*.30:-length*.30):0;
  const l=joint(body,x,-.16,z);legs.push(l);box(l,adult?.14:.10,quad?.18:adult?.23:.15,.14,adult?dark:0xdca146,0,adult?-.03:-.015,0);box(l,adult?.17:.13,.065,.20,adult?dark:0xdca146,0,adult?-.13:-.072,.045);for(const dx of [-.04,0,.04])box(l,.028,.027,.055,0xf2d5a0,dx,adult?-.14:-.082,.14)}
 if(!adult){for(const side of [-1,1]){const wing=joint(body,side*.17,.09,0);wings.push(wing);box(wing,.08,.17,.20,base);for(let i=0;i<3;i++)box(wing,.04,.045,.10,light,side*.025,-.04+i*.045,-.05)}}
 else if(!quad){for(const side of [-1,1]){box(body,.07,.15,.08,dark,side*(width/2+.025),.16,.16,0,0,side*.25);box(body,.08,.055,.12,light,side*(width/2+.04),.09,.21)}}
 const colors=[0x92b6ae,0xe5b65c,0xd59487];
 function featherFan(parent,count,span,y,z,size,colourful=false){for(let i=0;i<count;i++){const t=count===1?0:(i/(count-1)-.5);leaf(parent,t*span,y+Math.cos(t*2)*.04,z,size,colourful?colors[i%3]:i%2?light:dark,-.6,-t*1.8)}}
 function tailSegments(count){for(let i=0;i<count;i++)box(body,.17-i*.025,.10,.19,base,0,.02+i*.035,-length/2-.06-i*.13,-.25)}
 if(line==='radish'&&s){
  if(s===1){box(head,.035,.13,.035,dark,0,.19,0);for(const side of [-1,1])leaf(head,side*.07,.28,0,.11,light,0,-side*.85)}
  if(s===2){featherFan(head,3,.18,.24,0,.16);featherFan(body,5,.32,.15,-.28,.17);tailSegments(1)}
  if(adult){for(const side of [-1,1])leaf(head,side*.11,.23,-.02,s===3?.20:.25,dark,-.15,-side*.3);tailSegments(s===3?3:4);for(let i=0;i<s;i++)leaf(body,0,.28-i*.025,-.10-i*.13,.09,light,-.55);}
  if(s>=4){for(const side of [-1,1]){const wing=joint(body,side*width/2,.24,-.12);wings.push(wing);for(let i=0;i<(s===4?3:5);i++)leaf(wing,side*(.12+i*.08),.20+i*.025,-i*.09,s===4?.31:.39,i%2?light:dark,-.55,-side*.82);box(wing,.045,.38,.045,base,side*.12,.13,0,0,0,-side*.65)}}
  if(s===5){for(const side of [-1,1]){box(head,.045,.29,.045,0xc6c479,side*.13,.29,-.01,0,0,-side*.2);for(let i=0;i<2;i++)leaf(head,side*(.16+i*.04),.31+i*.10,-.01,.10,0xb8c176,0,-side*.65)}featherFan(body,3,.22,.15,-.87,.18)}
 }
 if(line==='tomato'&&s){
  for(let i=0;i<(s===1?1:2);i++)leaf(head,(i-.5)*.08,.24,0,.15,i?0xe98c48:0xc94d38,0,-.2);
  if(s===2){box(body,.18,.12,.25,base,0,.03,-.25,-.35);featherFan(body,3,.15,.17,-.40,.17);leaf(body,0,.22,-.46,.20,0xf4b948,-.4)}
 }
 if(line==='pumpkin'&&s){
  const shell=s===1?.21:s===2?.25:[0,0,0,.30,.36,.44][s];
  const shellY=s===1?.20:.13,shellZ=s===1?-.02:-.10;
  piece(body,new T.SphereGeometry(shell,10,5,0,Math.PI*2,0,Math.PI*(s===1?.52:.78)),base,0,shellY,shellZ);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;box(body,.13,s===1?.17:shell*1.15,.15,i%2?light:0xca8538,Math.sin(a)*shell*.73,shellY+.06,Math.cos(a)*shell*.73+shellZ,0,a)}
  box(body,.07,.12,.07,dark,0,shellY+shell,shellZ,0,0,-.15);
  if(s>=2){for(const side of [-1,1])for(let i=0;i<(s===2?1:s-1);i++)box(body,s===2?.10:.15,.14,.15,dark,side*(shell+.02),.07,-.18+i*.15,0,0,side*.25)}
  if(adult){for(let i=0;i<3;i++)box(body,.15-i*.03,.10,.17,dark,0,-.01,-length/2-.10-i*.12);if(s>=4)for(const side of [-1,1])box(head,.12,.15,.15,dark,side*.20,.11,-.04,0,0,side*.25)}
  if(s===5){for(const side of [-1,1])leaf(head,side*.18,.24,-.02,.23,0x7d8170,-.35,-side*.25);box(head,.13,.085,.14,0xd79743,0,.17,.07);for(const side of [-1,1])box(body,.20,.20,.22,dark,side*.39,.10,-.28,0,0,side*.2)}
 }
 if(line==='mixed'&&s){
  featherFan(head,s===1?3:s===2?4:5,s===1?.15:.25,.22,-.02,s===1?.12:.17,true);
  if(s>=2)featherFan(body,s===2?5:7,s===2?.30:.45,.12,-length/2-.12,s===2?.21:.29,true);
  if(adult){for(const side of [-1,1]){leaf(head,side*.18,.18,-.04,.17,light,0,-side*.5);box(head,.11,.16,.10,0xe7c780,side*.19,-.05,.02);box(body,.27,.15,.08,0xf6e7bc,0,.18,length/2+.04)}}
  if(s>=4){for(const side of [-1,1]){const wing=joint(body,side*width/2,.22,-.10);wings.push(wing);for(let i=0;i<(s===4?4:6);i++)leaf(wing,side*(.09+i*.07),.21+i*.025,-i*.08,s===4?.29:.36,colors[i%3],-.5,-side*.75)}}
  if(s===5){for(let i=0;i<7;i++){const a=i*Math.PI/6;leaf(head,Math.cos(a)*.24,Math.sin(a)*.23-.08,-.06,.14,i%2?0xe7c16f:0xf4dfaa,0,-a)}for(const side of [-1,1])leaf(head,side*.16,.31,-.09,.23,0xe9c974,0,-side*.3)}
 }
 // Small inherited crest marks retain previous-stage diet colours.
 for(const [i,heritage] of [...new Set(pet.history||[])].filter(k=>k!==line).entries())box(body,.04,.045,.04,{radish:0x92b16c,tomato:0xd67355,pumpkin:0xd9ab55,mixed:0xc1cdb2}[heritage],(i-1)*.055,.24,-.17);
 for(const batch of batches){const p=[],n=[],c=[];for(const {geo,color} of batch.parts){const flat=geo.index?geo.toNonIndexed():geo,col=new T.Color(color);p.push(...flat.attributes.position.array);n.push(...flat.attributes.normal.array);for(let i=0;i<flat.attributes.position.count;i++)c.push(col.r,col.g,col.b);if(flat!==geo)flat.dispose();geo.dispose()}if(p.length){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeBoundingSphere();geos.push(g);const mesh=new T.Mesh(g,material);mesh.castShadow=mesh.receiveShadow=true;batch.g.add(mesh)}}
 root.scale.setScalar(adult?.82+s*.035:.85+s*.10);root.userData.update=(t,{walk=false}={})=>{head.rotation.y=Math.sin(t*1.2)*.07;legs.forEach((l,i)=>{l.position.y=-.16+(walk?Math.max(0,Math.sin(t*7+i*Math.PI))*.035:0)});wings.forEach((w,i)=>w.rotation.z=Math.sin(t*2)*.04*(i%2?-1:1))};root.userData.dispose=()=>{geos.forEach(g=>g.dispose());material.dispose()};return root;
}

