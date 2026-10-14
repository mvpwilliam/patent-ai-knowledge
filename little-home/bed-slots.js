import {furnitureXYZ,furnitureXZ} from './layout.js?v=walkways-20-1';
export function bedSlots(kind){
 if(kind==='mainBed')return [1.04,1.64,2.24].map((z,index)=>({kind,index,target:furnitureXYZ(kind,[5.16,.78,z]),exit:furnitureXZ(kind,[4.25,1.68]),angle:-Math.PI/2}));
 if(kind==='childBed')return [4.85,5.39].map((x,index)=>({kind,index,target:furnitureXYZ(kind,[x,.78,7.00]),exit:furnitureXZ(kind,[4.27,6.90]),angle:Math.PI}));
 return [];
}
export function sameBed(a,b){return !!a&&!!b&&a.kind===b.kind&&a.index===b.index}
