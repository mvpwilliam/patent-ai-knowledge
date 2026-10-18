import {shirtArtwork} from './farm-shirts.js?v=shirts-16';
const images=new Map();
export function shirtPreview(id,label){
 if(!images.has(id)){const canvas=document.createElement('canvas');canvas.width=320;canvas.height=360;const c=canvas.getContext('2d');c.beginPath();c.moveTo(105,30);c.lineTo(62,48);c.lineTo(18,116);c.lineTo(67,146);c.lineTo(88,117);c.lineTo(82,330);c.lineTo(238,330);c.lineTo(232,117);c.lineTo(253,146);c.lineTo(302,116);c.lineTo(258,48);c.lineTo(215,30);c.quadraticCurveTo(160,72,105,30);c.closePath();c.fillStyle='#f7f0dc';c.fill();c.strokeStyle='#d6cdb7';c.lineWidth=3;c.stroke();c.beginPath();c.moveTo(105,30);c.quadraticCurveTo(160,83,215,30);c.strokeStyle='#365544';c.lineWidth=8;c.stroke();c.beginPath();c.moveTo(20,113);c.lineTo(67,143);c.moveTo(253,143);c.lineTo(300,113);c.stroke();c.drawImage(shirtArtwork(id),105,90,110,180);images.set(id,canvas.toDataURL())}
 const img=document.createElement('img');img.src=images.get(id);img.alt=label+'紀念 T-shirt';img.width=112;img.height=126;img.style.cssText='display:block;width:112px;height:126px;object-fit:contain;margin:0 auto';return img;
}
