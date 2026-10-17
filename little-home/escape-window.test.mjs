import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {createGodzilla} from './godzilla.js';
import {scaleX} from './layout.js';
test('double-size monster stands on floor clear of window and faces inside',()=>{
 const monster=createGodzilla(.84);
 monster.position.set(scaleX(1.70),monster.position.y+.05,.65);
 monster.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(monster);
 assert.ok(Math.abs(box.min.y-.05)<1e-6);
 assert.ok(Math.abs(box.getSize(new T.Vector3()).y-.84)<1e-6);
 assert.ok(box.min.z>.05);
 assert.equal(monster.rotation.y,0);
});
test('living overview contains sofa and window monster on phone and desktop',()=>{
 for(const aspect of [.65,1.6]){
  const camera=new T.PerspectiveCamera(34,aspect,.1,100);
  const target=new T.Vector3(1.65,.75,1.85),r=10.2*(aspect<.85?1.2:1),yaw=-.95,pitch=.86;
  camera.position.set(target.x+Math.sin(yaw)*Math.sin(pitch)*r,target.y+Math.cos(pitch)*r,target.z+Math.cos(yaw)*Math.sin(pitch)*r);
  camera.lookAt(target);camera.updateMatrixWorld();
  for(const point of [[2.2,0,.77],[3.12,1.04,3.29],[1.3,.05,.1],[2,.89,1.1]]){
   const projected=new T.Vector3(...point).project(camera);
   assert.ok(Math.abs(projected.x)<.94&&Math.abs(projected.y)<.94);
  }
 }
});
