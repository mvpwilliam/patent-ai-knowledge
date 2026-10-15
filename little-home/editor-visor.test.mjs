import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from './vendor/three.module.js';
import {createPixelDad} from './pixel-dad.js';
const profile={name:'Test',skin:'#e9b990',hairColor:'#242323',shirt:'#ffffff'};
test('visor follows actual eye height and remains in front across face settings and poses',()=>{
 for(const faceWidth of [.82,1,1.2])for(const eyeSize of [.65,1.4]){
  const actor=createPixelDad(profile,{legendaryOutfit:'neon',faceWidth,eyeSize,eyeGap:1.25,eyewear:'round'});
  const head=actor.getObjectByName('Head'),visor=actor.getObjectByName('Legendary eye visor');assert.ok(visor);
  for(const pose of ['stand','sit','work']){
   actor.userData.updatePose(pose);actor.rotation.y=.8;actor.updateMatrixWorld(true);
   const inverse=head.matrixWorld.clone().invert(),eyes=new T.Box3();
   actor.traverse(n=>{if(/Face pixel \d+ (10|11|12)$/.test(n.name))n.traverse(m=>{if(m.isMesh){m.geometry.computeBoundingBox();eyes.union(m.geometry.boundingBox.clone().applyMatrix4(inverse.clone().multiply(m.matrixWorld)))}})});
   assert.ok(Math.abs(visor.position.y-(eyes.min.y+eyes.max.y)/2)<1e-5);
   assert.ok(visor.position.z-.011>eyes.max.z);
   assert.equal(visor.scale.x,faceWidth);
  }
 }
});
test('other outfits remain available without a neon visor',()=>{
 for(const id of ['goldTiger','space','ninja','angel','wizard']){
  const actor=createPixelDad(profile,{legendaryOutfit:id});assert.equal(actor.getObjectByName('Legendary eye visor'),undefined);
 }
});
test('editor has a definite mobile height and a scrollable content region',()=>{
 const source=readFileSync(new URL('./avatar-editor.js',import.meta.url),'utf8');
 assert.match(source,/\.avatar-studio\[open\]\{[^}]*height:min\(820px,88dvh\)/);
 assert.match(source,/\.avatar-studio \.av-layout\{[^}]*min-height:0;max-height:none;flex:1 1 auto;overflow:auto/);
 for(const field of ['name','skin','hairColor','shirt','hairStyle','eyewear','faceWidth','chin','eyeSize','eyeGap','mouth'])assert.ok(source.includes(field));
 assert.match(source,/\.avatar-studio \.av-head\{[^}]*height:auto/);
 assert.match(source,/\.avatar-studio \.av-foot\{width:100%;max-width:none;margin:0\}/);
});
