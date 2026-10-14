// Interaction points follow the torso bounds, rather than the monster's centre.
export function monsterApproachPoints(box){
 const [left,right,front,back]=box,points=[];
 for(const margin of [.32,.42,.52])for(const t of [0,.25,.5,.75,1]){
  const x=left+(right-left)*t,z=front+(back-front)*t;
  points.push([x,front-margin],[x,back+margin],[left-margin,z],[right+margin,z]);
 }
 return points;
}
export function blocksMonsterHit(hit,distance){
 if(hit.distance>=distance-.01)return false;
 for(let node=hit.object;node;node=node.parent)if(!node.visible||node.userData.cameraFaded)return false;
 const materials=Array.isArray(hit.object.material)?hit.object.material:[hit.object.material];
 // Fully transparent touch proxies and faded walls are not visual blockers.
 return materials.some(m=>m&&m.visible!==false&&m.opacity>.05&&(!m.transparent||m.opacity>=.9));
}
