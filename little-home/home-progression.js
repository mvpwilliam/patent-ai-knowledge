export const MAX_XP=1200;
export function levelInfo(xp=0){
 const value=Math.max(0,Math.min(MAX_XP,Number(xp)||0));
 const level=Math.min(20,1+Math.floor(value*19/MAX_XP+1e-8));
 const titles=['家事新手','居家小幫手','家事達人','家務高手','家庭神隊友'];
 return {level,title:titles[Math.floor(level/5)],progress:level===20?1:(value-(level-1)*MAX_XP/19)/(MAX_XP/19)};
}
// One transaction updates every stored member, regardless of online presence.
export function hitHomeMonster(meta,actorId,actor,{now=Date.now(),memberIds=[],normalize=p=>p,record=()=>{}}={}){
 const monster=meta.monster;
 if(!monster||now<monster.bornAt||monster.hits>=100)throw new Error('哥吉拉還沒出現');
 monster.hits++;
 if(monster.hits<100)return false;
 meta.players||={};meta.players[actorId]=actor;
 for(const id of new Set([...Object.keys(meta.players),...memberIds,actorId])){
  const p=id===actorId?actor:normalize(meta.players[id]);
  p.xp=Math.min(MAX_XP,Math.round((Math.max(0,Number(p.xp)||0)+5*MAX_XP/19)*1e6)/1e6);
  record(p,'擊退哥吉拉 · 全體升 5 級（最高 20 級）',0);meta.players[id]=p;
 }
 monster.defeats=(monster.defeats||0)+1;monster.lastDefeatedAt=now;
 monster.bornAt=now+3600000;monster.hits=0;
 return true;
}
