// Check the whole projected body, including the interior, against navigation clearance.
export function hasRestSpace(bounds,clearSegment){
 const {min,max}=bounds;
 if(![min.x,min.z,max.x,max.z].every(Number.isFinite)||max.x<min.x||max.z<min.z)return false;
 const rows=Math.max(1,Math.ceil((max.z-min.z)/.04));
 for(let i=0;i<=rows;i++){
  const z=min.z+(max.z-min.z)*i/rows;
  if(!clearSegment([min.x,z],[max.x,z]))return false;
 }
 return true;
}
