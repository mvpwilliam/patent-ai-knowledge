export const SCORE_GAMES={castle:{name:'城堡保衛戰',rule:'擊退一隻＋100；存活每秒＋10；通關＋2,000；通關時城堡每點生命＋10。'},shooter:{name:'客廳防衛戰',rule:'擊退一隻＋100；救援一位夥伴＋500；擊敗哥吉拉＋2,000。'}};
const whole=(n,max=1000000)=>Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):0;
export function castleScore(s){return whole(s.kills)*100+whole(s.time,120)*10+(s.status==='won'?2000+whole(s.castle?.hp,180)*10:0)}
export function battleResult(kind,s){return {kind,score:kind==='castle'?castleScore(s):whole(s.score),won:s.status==='won',finished:['won','lost'].includes(s.status),kills:whole(s.kills),time:whole(s.time),rescues:whole(s.rescues,5)}}
export function saveBestScore(player,result,at=Date.now()){
 if(!Object.hasOwn(SCORE_GAMES,result.kind)||!result.finished||!Number.isSafeInteger(result.score)||result.score<0||result.score>10000000)throw new Error('這局成績無法登錄');
 if(!player.bestScores||typeof player.bestScores!=='object'||Array.isArray(player.bestScores))player.bestScores={};
 const old=player.bestScores[result.kind];if(old&&old.score>=result.score)return false;
 player.bestScores[result.kind]={score:result.score,won:!!result.won,at,time:whole(result.time),kills:whole(result.kills),rescues:whole(result.rescues,5)};return true;
}
export function rankingRows(players,profiles,kind){
 const rows=Object.entries(players||{}).flatMap(([id,p])=>{const r=p.bestScores?.[kind];return r&&Number.isSafeInteger(r.score)&&r.score>=0?[{...r,id,name:profiles?.[id]?.name||'玩家'}]:[]});
 rows.sort((a,b)=>b.score-a.score||(a.at||0)-(b.at||0)||a.id.localeCompare(b.id));
 let rank=0;rows.forEach((r,i)=>{if(i===0||r.score!==rows[i-1].score)rank=i+1;r.rank=rank});return rows;
}
function styles(){if(document.getElementById('leaderboard-style'))return;const l=document.createElement('link');l.id='leaderboard-style';l.rel='stylesheet';l.href=new URL('./leaderboard.css?v=rank-2',import.meta.url);document.head.append(l)}
export function resultScorePanel(result,submit){
 styles();const box=document.createElement('section');box.className='result-score';const score=document.createElement('strong'),note=document.createElement('p'),retry=document.createElement('button');
 score.textContent=`本局 ${result.score.toLocaleString()} 分`;note.textContent='正在保存排行榜成績…';note.setAttribute('role','status');retry.textContent='重試保存成績';retry.hidden=true;box.append(score,note,retry);
 async function save(){retry.hidden=true;try{note.textContent=await submit(result)}catch(e){note.textContent=e.message||'成績未保存，請重試';retry.hidden=false}}
 retry.onclick=save;save();return box;
}
export function installLeaderboard({getState}){
 styles();const dialog=document.createElement('dialog');dialog.className='game-dialog leaderboard-dialog';dialog.setAttribute('aria-label','積分排行榜');
 dialog.innerHTML='<div class="dialog-head"><h2>積分排行榜</h2><button aria-label="關閉排行榜">×</button></div><div class="game-dialog-body"><p data-scope></p><div class="leaderboard-tabs" role="group" aria-label="選擇遊戲"></div><ul class="leaderboard-rule"></ul><div class="leaderboard-table"></div></div>';
 document.body.append(dialog);dialog.querySelector('.dialog-head button').onclick=()=>dialog.close();let selected='castle';
 for(const [id,g] of Object.entries(SCORE_GAMES)){const b=document.createElement('button');b.textContent=g.name;b.dataset.game=id;b.onclick=()=>{selected=id;render()};dialog.querySelector('.leaderboard-tabs').append(b)}
 function render(){
  if(!dialog.open)return;const {players,profiles,uid,online,ready}=getState();
  dialog.querySelector('[data-scope]').textContent=online?(ready?'家庭排行榜 · 每位玩家只列最高分':'家庭資料連線中，請稍候…'):'本機排行榜 · 加入家庭後可和家人比較';
  const rules=dialog.querySelector('.leaderboard-rule');rules.replaceChildren();
  for(const line of [...SCORE_GAMES[selected].rule.replace(/。$/,'').split('；'),'完成本局即記分，失敗也可上榜','中途退出不計分','相同分數並列']){const li=document.createElement('li');li.textContent=line;rules.append(li)}
  dialog.querySelectorAll('[data-game]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.game===selected)));
  const body=dialog.querySelector('.leaderboard-table');body.replaceChildren();if(online&&!ready)return;
  const rows=rankingRows(players,profiles,selected);if(!rows.length){const p=document.createElement('p');p.textContent='還沒有成績，來挑戰第一筆紀錄！';body.append(p);return}
  const table=document.createElement('table');table.innerHTML='<thead><tr><th scope="col">名次</th><th scope="col">玩家</th><th scope="col">最高分</th></tr></thead>';const tbody=document.createElement('tbody');
  for(const r of rows){const tr=document.createElement('tr');tr.classList.toggle('is-me',r.id===uid);for(const value of [`${r.rank}`,r.name+(r.id===uid?'（你）':''),r.score.toLocaleString()]){const td=document.createElement('td');td.textContent=value;tr.append(td)}const note=document.createElement('small');note.textContent=r.won?'通關':'挑戰紀錄';tr.lastElementChild.append(note);tbody.append(tr)}table.append(tbody);body.append(table);
 }
 return {open(kind='castle'){selected=Object.hasOwn(SCORE_GAMES,kind)?kind:'castle';if(!dialog.open)dialog.showModal();render()},refresh:render};
}
