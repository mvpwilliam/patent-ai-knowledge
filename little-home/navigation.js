// Walking envelopes share the revised model's metre coordinates.
import {scaleX,entryZero,entryX,kitchenStart,kitchenEnd,furnitureShift,washerPosition} from './layout.js?v=85';
const radius=.171,cell=.08; // Characters and their walking envelope are both 10% smaller.
const shift=(a,b,c,d,s)=>[a+s,b+s,c,d];
const rect=(x0,x1,z0,z1)=>[scaleX(x0),scaleX(x1),z0,z1];
export const wallObstacles=[
 rect(3.28,3.42,0,4.50), // living/master: only the door beyond the end is passable
 rect(4.45,6.78,3.58,3.72), // master/bath shared wall
 rect(4.385,4.515,3.75,4.50), // bath front jamb; doorway z 4.50–5.55
 rect(2.65,3.45,5.485,5.615), // child entry left jamb
 rect(4.45,5.895,5.485,5.615), // child/bath shared wall
 rect(2.585,2.715,5.55,8.20), // dining/child wall
 rect(2.65,5.83,8.135,8.265), // child/kitchen wall
 rect(5.765,5.895,5.55,8.26), // balcony-facing child wall: glazing is not a doorway
 rect(5.765,5.895,9.12,10.07), // balcony/kitchen return, leave balcony door clear
];
const obstacles=[...wallObstacles,
 shift(0,.49,.60,3.94,furnitureShift.tv),
 shift(2.20,3.14,.77,3.30,furnitureShift.sofa),
 [1.13,2.62,5.57,7.00], // unchanged dining table/chairs
 [1.23,2.65,6.96,7.64], // unchanged island countertop
 [entryX(207),entryX(272),9.295,9.995],
 [entryX(273),entryX(378),9.495,9.995],
 [entryX(102),entryX(205),9.555,9.995],
 [entryX(118.5),entryX(188.5),9.14,9.48], // bent-wood stool below the column pegboard
 [entryZero,entryZero+1.25,7.925,8.275],
 [entryZero+1.25,entryZero+1.295,7.375,8.275], // 90 cm end panel
 [kitchenStart,kitchenEnd,9.295,10.10],
 [scaleX(2.57),scaleX(2.72),5.50,8.21],
 [scaleX(3.27),scaleX(3.43),0,4.50],
 shift(4.42,5.04,3.76,4.46,furnitureShift.basin),
 shift(5.48,6.10,3.85,4.67,furnitureShift.toilet),
 [washerPosition.x-.32,washerPosition.x+.32,washerPosition.z-.35,washerPosition.z+.35],
 shift(4.45,6.43,.50,2.96,furnitureShift.mainBed),
 shift(4.47,5.76,5.91,8.12,furnitureShift.childBed)
];
let dynamicObstacles=[],movementObstacles=obstacles;
export function setDynamicObstacles(rectangles=[]){
 dynamicObstacles=rectangles.map(r=>r.slice());movementObstacles=[...obstacles,...dynamicObstacles];
}
export const crossesDynamicObstacle=(from,to)=>dynamicObstacles.some(rect=>intersectsRect(from,to,rect));
export function walkable(x,z){
 const inX=(a,b)=>x>=scaleX(a)&&x<=scaleX(b);
 const inLiving=inX(.30,3.12)&&z>=.37&&z<=4.50;
 const inHall=inX(.30,4.56)&&z>=4.50&&z<=5.38;
 const inBath=inX(4.45,6.27)&&z>=4.56&&z<=5.36;
 const inDining=inX(.23,2.43)&&z>=5.38&&z<=8.22;
 const inKitchen=inX(.23,5.70)&&z>=8.22&&z<=9.00;
 const inMaster=inX(3.50,6.38)&&z>=.28&&z<=3.54;
 const inMasterEntry=inX(3.50,4.40)&&z>=3.54&&z<=4.72;
 const inChild=inX(2.82,5.68)&&z>=5.69&&z<=8.10;
 const inChildEntry=inX(3.48,4.42)&&z>=5.35&&z<=5.69;
 const inBalcony=inX(6.02,7.59)&&z>=7.23&&z<=9.00;
 const inBalconyDoor=inX(5.68,6.08)&&z>=8.40&&z<=8.96;
 const inEntry=x>=entryZero+radius&&x<=scaleX(.7)&&z>=8.47&&z<=9.60;
 if(!(inLiving||inHall||inBath||inDining||inKitchen||inMaster||inMasterEntry||inChild||inChildEntry||inBalcony||inBalconyDoor||inEntry))return false;
 return !movementObstacles.some(([a,b,c,d])=>x>=a-radius&&x<=b+radius&&z>=c-radius&&z<=d+radius);
}
const key=(i,j)=>i+','+j;
const grid=(i,j)=>[i*cell,j*cell];
const nearest=([x,z])=>{
  let best=null,score=Infinity;
  for(let i=Math.round(x/cell)-5;i<=Math.round(x/cell)+5;i++)
    for(let j=Math.max(0,Math.round(z/cell)-5);j<=Math.round(z/cell)+5;j++){
      const [px,pz]=grid(i,j),d=(px-x)**2+(pz-z)**2;
      if(d<score&&walkable(px,pz)&&(!wallObstacles.some(([a,b,c,d])=>x>=a-radius&&x<=b+radius&&z>=c-radius&&z<=d+radius))&&(!walkable(x,z)||canTraverse([x,z],[px,pz]))){best=[i,j];score=d}
    }
  return best;
};
function intersectsRect(from,to,[a,b,c,d]){
 let lo=0,hi=1;
 for(const [origin,delta,min,max] of [[from[0],to[0]-from[0],a-radius,b+radius],[from[1],to[1]-from[1],c-radius,d+radius]]){
  if(Math.abs(delta)<1e-12){if(origin<min||origin>max)return false;continue}
  let t0=(min-origin)/delta,t1=(max-origin)/delta;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return false;
 }return true;
}
export function crossesWall(from,to){return wallObstacles.some(rect=>intersectsRect(from,to,rect))}
export const canTraverse=(a,b)=>{
  if(movementObstacles.some(rect=>intersectsRect(a,b,rect)))return false;
  const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.01);
  for(let i=0;i<=n;i++){const t=n?i/n:0;if(!walkable(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t))return false}
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
      for(let i=1;i<points.length;){let next=points.length-1;while(next>i&&!canTraverse(smooth.at(-1),points[next]))next--;smooth.push(points[next]);i=next+1}
      return smooth;
    }
    for(const [di,dj] of dirs){
      const i=current.i+di,j=current.j+dj,[x,z]=grid(i,j);
      if(!walkable(x,z)||!canTraverse(grid(current.i,current.j),[x,z]))continue;
      if(di&&dj&&(!walkable((current.i+di)*cell,current.j*cell)||!walkable(current.i*cell,(current.j+dj)*cell)))continue;
      const g=current.g+Math.hypot(di,dj),k=key(i,j);
      if(g>=best.get(k))continue;
      best.set(k,g);prev.set(k,here);
      open.push({i,j,g,f:g+Math.hypot(e[0]-i,e[1]-j)});
    }
  }
  return [];
}




