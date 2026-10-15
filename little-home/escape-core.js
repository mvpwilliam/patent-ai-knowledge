export const NOTE='屋子的答案，不全藏在屋裡。讓黑色的眼睛記住此刻，流動的數字便有了證詞。坐在電視前，讓手歇息的地方，藏著時間的算法。財富只留末兩位；巨獸不問剩下多少，只問失去多少。三份證詞相加，四格不足，以零補齊。第一把鎖後，方向才會說真話。';
export const OVERLAY='正對畫作，先認清北。將北轉向上方，再讀四角：西北 → 東北 → 東南 → 西南。依序觸碰四角，讓畫中的歸途留下紀錄。';
export const PLAQUE='歸途，是畫中四角連成的數。扣去開櫃時的四位證詞，便是出口。若落入負數，加上一萬；不足四位，以零補齊。';
export function initial(){return {version:1,elapsed:840,coins:1360,hp:100,trial:false,snapshot:null,cabinet:false,turns:0,corners:[],overlay:false,painting:false,escaped:false,notes:[]}}
export function grid(turns){let a=[[2,7,4],[9,5,1],[6,3,8]];for(let i=0;i<turns%4;i++)a=a[0].map((_,c)=>a.map(r=>r[c]).reverse());return a}
export function cabinetCode(s){if(!s.snapshot)return null;const p=s.snapshot;return String(Math.floor(p.time/60)*(p.time%60)+p.coins%100+100-p.hp).padStart(4,'0')}
export function doorCode(s){return String((4862-Number(cabinetCode(s))+10000)%10000).padStart(4,'0')}
export function act(s,type,value){
 if(s.escaped)return '你已成功離開密室。';
 if(type==='trial'){if(s.trial)return '試煉已完成，傷痕留在畫面上。';s.hp=73;s.trial=true;return '雕像亮起紅光。畫面上的生命值變了。'}
 if(type==='snapshot'){if(s.cabinet)return '開櫃時的證詞已封存。';s.snapshot={time:Math.floor(s.elapsed)%6000,coins:s.coins,hp:s.hp,trial:s.trial};return '電視記下此刻。可隨時查看，開櫃前可重新定格。'}
 if(type==='cabinet'){
  if(!/^\d{4}$/.test(value))return '請輸入四位數字，包含開頭的零。';
  if(!s.snapshot)return '電視尚未留下證詞。';
  if(!s.snapshot.trial)return '這份定格中的巨獸，還沒有經歷試煉。';
  if(value!==cabinetCode(s))return '鎖沒有打開。請核對線索與電視保存的讀數。';
  s.cabinet=true;return '櫃門開啟！取得透明定位片，電視紀錄已封存。';
 }
 if(type==='overlay'){if(!s.cabinet)return '還沒有可以放上去的道具。';s.overlay=true;return '定位片已放上畫框。'}
 if(type==='rotate'){if(s.painting)return '畫作暗格已開啟。';s.turns=(s.turns+1)%4;s.corners=[];return '畫作順時針旋轉 90°。'}
 if(type==='corner'){
  if(s.painting)return '已取得門鎖銘牌。';if(!s.overlay)return '四角有凹槽，似乎需要一張定位片。';
  s.corners.push(value);if(s.corners.length<4)return `已按下 ${s.corners.length} 個角。`;
  const ok=s.turns===3&&s.corners.join(',')==='0,2,8,6';s.corners=[];
  if(!ok)return '畫框輕響後復位。請核對北方與四角順序。';
  s.painting=true;return '暗格開啟！記錄四角數字 4862，取得門鎖銘牌。';
 }
 if(type==='door'){
  if(!s.painting)return '門鎖還缺少畫作暗格中的銘牌。';
  if(!/^\d{4}$/.test(value)||value!==doorCode(s))return '門鎖亮起紅燈。請再讀一次銘牌。';
  s.escaped=true;return '門開了。你找到了畫面之外的答案。';
 }
 return '';
}
