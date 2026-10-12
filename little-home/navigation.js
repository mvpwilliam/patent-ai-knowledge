// Public-area navigation for the small apartment model. Coordinates are metres
// in the same X/Z plane as the room geometry. Obstacles include the walking
// radius, so the character's body clears furniture instead of only its centre.
const radius=.19,cell=.16;
const obstacles=[
  [0,.47,.60,3.94],       // television cabinet
  [2.20,3.14,.77,3.30],   // sofa and armrests
  [1.13,2.62,5.57,7.00], // dining table and both chairs
  [1.22,2.66,6.95,7.66], // kitchen island
  [1.00,3.07,9.04,10.10],// refrigerator and appliance cabinet
  [3.10,5.85,9.31,10.10],// kitchen base cabinets
  [2.57,2.72,5.50,8.21], // child-bedroom wall
  [3.27,3.43,0,4.50],    // master-bedroom wall
  [4.45,5.01,3.76,4.46], // bathroom basin
  [5.48,6.10,3.85,4.57], // toilet
  [6.18,6.83,6.50,7.23], // washer: approach from its front
  [4.45,6.43,.50,2.96], // main bed
  [4.47,5.76,5.91,8.12] // second bedroom bed
];
export function walkable(x,z){
  const inLiving=x>=.30&&x<=3.12&&z>=.37&&z<=4.50;
  const inHall=x>=.30&&x<=4.56&&z>=4.50&&z<=5.38;
  const inBath=x>=4.45&&x<=6.27&&z>=4.56&&z<=5.36;
  const inDining=x>=.30&&x<=2.43&&z>=5.38&&z<=8.22;
  const inKitchen=x>=.30&&x<=5.70&&z>=8.22&&z<=9.00;
  const inMaster=x>=3.50&&x<=6.38&&z>=.28&&z<=3.54;
  const inMasterEntry=x>=3.50&&x<=4.40&&z>=3.54&&z<=4.72;
  const inChild=x>=2.82&&x<=5.68&&z>=5.69&&z<=8.10;
  const inChildEntry=x>=3.48&&x<=4.42&&z>=5.35&&z<=5.69;
  const inBalcony=x>=6.02&&x<=6.96&&z>=7.23&&z<=9.00;
  const inBalconyDoor=x>=5.68&&x<=6.08&&z>=8.40&&z<=8.96;
  if(!(inLiving||inHall||inBath||inDining||inKitchen||inMaster||inMasterEntry||inChild||inChildEntry||inBalcony||inBalconyDoor))return false;
  return !obstacles.some(([a,b,c,d])=>x>=a-radius&&x<=b+radius&&z>=c-radius&&z<=d+radius);
}
const key=(i,j)=>i+','+j;
const grid=(i,j)=>[i*cell,j*cell];
const nearest=([x,z])=>{
  let best=null,score=Infinity;
  for(let i=Math.max(0,Math.round(x/cell)-5);i<=Math.round(x/cell)+5;i++)
    for(let j=Math.max(0,Math.round(z/cell)-5);j<=Math.round(z/cell)+5;j++){
      const [px,pz]=grid(i,j),d=(px-x)**2+(pz-z)**2;
      if(d<score&&walkable(px,pz)){best=[i,j];score=d}
    }
  return best;
};
const canSee=(a,b)=>{
  const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.01);
  for(let i=0;i<=n;i++){const t=i/n;if(!walkable(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t))return false}
  return true;
};
export function findPath(from,to){
  const s=nearest(from),e=nearest(to);if(!s||!e)return [];
  const start=key(...s),end=key(...e),open=[{i:s[0],j:s[1],g:0,f:0}],best=new Map([[start,0]]),prev=new Map();
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while(open.length){
    open.sort((a,b)=>a.f-b.f);
    const current=open.shift(),here=key(current.i,current.j);
    if(current.g!==best.get(here))continue;
    if(here===end){
      const points=[];let k=here;
      while(k){const [i,j]=k.split(',').map(Number);points.push(grid(i,j));k=prev.get(k)}
      points.reverse();
      const smooth=[points[0]];
      for(let i=1;i<points.length;){let next=points.length-1;while(next>i&&!canSee(smooth.at(-1),points[next]))next--;smooth.push(points[next]);i=next+1}
      return smooth;
    }
    for(const [di,dj] of dirs){
      const i=current.i+di,j=current.j+dj,[x,z]=grid(i,j);
      if(!walkable(x,z))continue;
      if(di&&dj&&(!walkable((current.i+di)*cell,current.j*cell)||!walkable(current.i*cell,(current.j+dj)*cell)))continue;
      const g=current.g+Math.hypot(di,dj),k=key(i,j);
      if(g>=best.get(k))continue;
      best.set(k,g);prev.set(k,here);
      open.push({i,j,g,f:g+Math.hypot(e[0]-i,e[1]-j)});
    }
  }
  return [];
}
