import {furnitureXYZ,furnitureXZ} from './layout.js?v=entry-expand-1';
import * as T from './vendor/three.module.js';
export function bedSlots(kind){
 if(kind==='mainBed')return [1.04,1.64,2.24].map((z,index)=>({kind,index,target:furnitureXYZ(kind,[5.16,.78,z]),pillow:furnitureXYZ(kind,[6.04,.70,z]),exit:furnitureXZ(kind,[4.25,1.68]),angle:-Math.PI/2}));
 if(kind==='childBed')return [4.85,5.39].map((x,index)=>({kind,index,target:furnitureXYZ(kind,[x,.78,7.00]),pillow:furnitureXYZ(kind,[x,.70,7.76]),exit:furnitureXZ(kind,[4.27,6.90]),angle:Math.PI}));
 return [];
}
export function alignBedSlot(character,slot){
 if(!slot.pillow)return slot;
 const head=character.getObjectByName('Head'),body=character.userData.body;
 const mesh=head?.children.find(n=>n.isMesh&&!n.name.startsWith('Legendary'));
 if(!mesh?.geometry)return slot;
 mesh.geometry.computeBoundingBox();const offset=mesh.geometry.boundingBox.getCenter(new T.Vector3());
 // Measure the anatomical head, excluding hats. Ignore the current sit/walk
 // body offsets so the destination stays stable throughout the entry animation.
 for(let node=mesh;node&&node!==body;node=node.parent){
  node.updateMatrix();const matrix=node.matrix.clone();
  if(node.parent===body)matrix.elements[13]=0;
  offset.applyMatrix4(matrix);
 }
 offset.applyAxisAngle(new T.Vector3(1,0,0),-Math.PI/2).multiply(character.scale);
 offset.applyAxisAngle(new T.Vector3(0,1,0),slot.angle);
 return {...slot,target:[slot.pillow[0]-offset.x,slot.target[1],slot.pillow[2]-offset.z]};
}
export function sameBed(a,b){return !!a&&!!b&&a.kind===b.kind&&a.index===b.index}

