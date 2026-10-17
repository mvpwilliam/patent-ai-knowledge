import {NOTE,OVERLAY,PLAQUE,initial,grid,cabinetCode,act} from './escape-core.js?v=escape-1';
const $=id=>document.getElementById(id),key='little-home-escape-01';
let state=initial();try{const saved=JSON.parse(localStorage.getItem(key));if(saved?.version===1&&Number.isFinite(saved.elapsed)&&Array.isArray(saved.notes)&&Array.isArray(saved.corners))state={...state,...saved}}catch{}
let room=null,current=null,paused=false;
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{}}
function time(t){t=Math.floor(t)%6000;return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')}
function ui(){ $('time').textContent=time(state.elapsed);$('coins').textContent=state.coins.toLocaleString();$('hp').textContent=state.hp+'/100';$('stage').textContent=state.escaped?'完成 / 已逃出小屋':state.painting?'03 / 尋找歸途':state.cabinet?'02 / 畫中的方向':'01 / 尋找三份證詞';room?.sync(state)}
function message(text){$('status').textContent=text}
const dialog=$('detail'),content=$('content');
function text(p,cls=''){const el=document.createElement('p');el.textContent=p;el.className=cls;content.append(el);return el}
function buttons(entries){const wrap=document.createElement('div');wrap.className='actions';for(const [label,fn,primary]of entries){const b=document.createElement('button');b.textContent=label;if(primary)b.className='primary';b.onclick=fn;wrap.append(b)}content.append(wrap)}
function show(title){$('detail-title').textContent=title;content.replaceChildren();if(!dialog.open)dialog.showModal()}
function remember(id){if(!state.notes.includes(id)){state.notes.push(id);save()}}
function run(type,value){const msg=act(state,type,value);save();ui();message(msg);return msg}
function feedback(msg){content.querySelector('.feedback')?.remove();text(msg,'feedback')}
function password(type){const form=document.createElement('form');form.className='code';const input=document.createElement('input');input.type='text';input.inputMode='numeric';input.pattern='[0-9]{4}';input.maxLength=4;input.autocomplete='off';input.placeholder='四位密碼';input.setAttribute('aria-label','四位密碼');const b=document.createElement('button');b.textContent='解鎖';b.className='primary';form.append(input,b);form.onsubmit=e=>{e.preventDefault();const msg=run(type,input.value);if(type==='door'&&state.escaped){showWin();return}if(type==='cabinet'&&state.cabinet){open('cabinet');feedback(msg)}else feedback(msg)};content.append(form)}
function snapshot(){if(!state.snapshot){text('螢幕上尚未留下紀錄。');return}const p=state.snapshot;text(`定格時間 ${time(p.time)}\n金幣 ${p.coins.toLocaleString()}\n怪獸生命 ${p.hp}/100`,'paper');if(state.cabinet)text('已封存 · 開櫃密碼 '+cabinetCode(state));}
function open(id){if(paused)return;current=id;
 if(id==='note'){show('沙發上的紙條');text(NOTE,'paper');buttons([['收好紙條，開始探索',()=>dialog.close(),true]]);remember('note');return}
 if(id==='sofa'){show('電視前的沙發');text('坐墊邊露出一張紙。兩側寬厚的扶手，剛好讓手歇息。');buttons([['閱讀紙條',()=>open('note')],['查看坐墊',()=>{show('沙發坐墊');text('坐墊下沒有東西。扶手側面似乎有幾道刻痕。');buttons([['查看扶手',()=>open('arm')]])}],['查看左右扶手',()=>open('arm')]]);return}
 if(id==='arm'){show('沙發扶手 · 刻痕');text('靠電視那一側，刻著一個時鐘和兩個相乘的方框。');text('［分］ × ［秒］','paper');remember('arm');return}
 if(id==='tv'){show('黑色的眼睛');text('螢幕下有一顆「定格」鍵，旁邊刻著時鐘、金幣與怪獸圖示。');snapshot();buttons([[state.cabinet?'查看封存紀錄':'按下定格',()=>{const msg=run('snapshot');open('tv');feedback(msg)},true]]);return}
 if(id==='monster'){show('怪獸雕像');text('底座有一顆紅色試煉鈕。旁邊寫著：「承受 27 點傷害，每局一次。」');text(`畫面生命值：${state.hp}/100`);buttons([['啟動試煉',()=>{const msg=run('trial');open('monster');feedback(msg)},true]]);return}
 if(id==='cabinet'){show(state.cabinet?'櫃子 · 已開啟':'四位密碼鎖櫃');if(state.cabinet){text('你在櫃子中找到一張透明定位片。');text(OVERLAY,'paper');buttons([['前往查看畫作',()=>open('painting'),true]]);return}text('鎖面刻著：三份證詞相加。四格不足，以零補齊。');password('cabinet');return}
 if(id==='painting'){show('迷向方陣畫');text(state.painting?'畫框暗格已打開，裡面藏著門鎖銘牌。':'畫框的厚邊有刻印。四角各有一個淺淺的凹槽。');if(state.painting){text('四角紀錄：4862','paper');text(PLAQUE);return}
  const g=document.createElement('div');g.className='grid';grid(state.turns).flat().forEach((n,i)=>{const b=document.createElement('button');b.textContent=n;b.disabled=![0,2,6,8].includes(i);b.classList.toggle('selected',state.corners.includes(i));b.setAttribute('aria-label',({0:'左上角',2:'右上角',6:'左下角',8:'右下角'}[i]||'中央數字')+' '+n);b.onclick=()=>{const msg=run('corner',i);open('painting');feedback(msg)};g.append(b)});content.append(g);
  if(state.overlay)text(OVERLAY);
  buttons([['查看畫框右側',()=>open('edge')],['順時針轉 90°',()=>{run('rotate');open('painting')}],...(state.cabinet&&!state.overlay?[['放上透明定位片',()=>{run('overlay');open('painting')},true]]:[])]);return}
 if(id==='edge'){show('畫框厚邊 · 方位刻印');const directions=['右 →','下 ↓','左 ←','上 ↑'];text('刻印與畫作一起轉動。從正面看，目前北方指向：');text('N · 北 '+directions[state.turns%4],'paper');remember('north');buttons([['回到畫作正面',()=>open('painting'),true]]);return}
 if(id==='door'){show('出口大門');if(state.escaped){showWin();return}text('門邊的數字盤等待四位密碼。');if(state.painting){text(PLAQUE,'paper');text('四角紀錄：4862　／　開櫃密碼：'+cabinetCode(state))}password('door');return}
 if(id==='notebook'){show('紙條與紀錄');text(NOTE,'paper');if(state.notes.includes('arm'))text('扶手刻字：［分］×［秒］');snapshot();if(state.cabinet)text('透明定位片：'+OVERLAY);if(state.notes.includes('north'))text('畫框的北方刻印會隨畫作轉動，與攝影機方向無關。');if(state.painting)text('四角紀錄：4862\n門鎖銘牌：'+PLAQUE);return}
}
function showWin(){show('你找到了畫面之外');text('熟悉的時間、金幣與生命值，原來一直在指引你。大門已經打開。','paper');buttons([['回到小屋',()=>location.href='./',true],['留在房間看看',()=>dialog.close()]])}
$('close').onclick=()=>dialog.close();$('notebook').onclick=()=>open('notebook');document.querySelectorAll('[data-object]').forEach(b=>b.onclick=()=>open(b.dataset.object));$('reset-view').onclick=()=>room?.reset();
$('restart').onclick=()=>{show('重新開始本局？');text('這會清除本局線索與密碼進度。');buttons([['保留進度',()=>dialog.close()],['重新開始',()=>{state=initial();save();ui();message('新的密室等待探索。');open('note')},true]])};
const pauseDialog=document.createElement('dialog');
pauseDialog.setAttribute('aria-label','遊戲暫停');
pauseDialog.innerHTML='<h2>遊戲已暫停</h2><p>計時與解謎操作已停止。</p><div class="actions"><button class="primary" data-resume>繼續遊戲</button><button data-quit>放棄並退出</button></div>';
document.body.append(pauseDialog);
function resumeGame(){paused=false;previous=performance.now();room?.pause(false);pauseDialog.close()}
function pauseGame(){if(paused||state.escaped)return;paused=true;room?.pause(true);save();pauseDialog.showModal()}
function quitGame(){
 if(state.escaped){location.href='./';return}
 state=initial();save();location.href='./';
}
pauseDialog.querySelector('[data-resume]').onclick=resumeGame;
pauseDialog.querySelector('[data-quit]').onclick=quitGame;
pauseDialog.addEventListener('cancel',e=>{e.preventDefault();resumeGame()});
const pauseButton=document.createElement('button');pauseButton.textContent='暫停';pauseButton.id='pause-game';pauseButton.onclick=pauseGame;
document.querySelector('header').append(pauseButton);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.open&&!pauseDialog.open){e.preventDefault();pauseGame()}});
let previous=performance.now(),savedAt=0;setInterval(()=>{const now=performance.now();if(!document.hidden&&!state.escaped&&!paused)state.elapsed+=Math.min((now-previous)/1000,2);previous=now;ui();if(now-savedAt>3000){save();savedAt=now}},250);document.addEventListener('visibilitychange',()=>{previous=performance.now();if(document.hidden&&!state.escaped)pauseGame();save()});window.addEventListener('pagehide',save);
ui();if(state.escaped)showWin();else open('note');
import('./escape-real-room.js?v=retain-view-3').then(({createRoom})=>{room=createRoom($('view'),open);room.pause(paused);ui()}).catch(()=>{$('load-error').hidden=false});
