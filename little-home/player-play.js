// Shared checks for playful, non-damaging player interactions.
export const PLAY_COOLDOWN=2500;
export function validatePlayHit(event,attacker,target,now,position){
 if(!target?.presence?.online||now-target.presence.at>=45000)throw Error('對方已離線');
 if(now-(attacker?.playAttack?.at||0)<PLAY_COOLDOWN)throw Error('稍等一下再出拳');
 const t=target.presence;
 if(!position||Math.hypot(position.x-t.x,position.z-t.z)>1.05||Math.abs(position.y-(t.y||.07))>.7)throw Error('對方走遠了，請再點一次');
 return {...event,at:now};
}
export function recentPlayHits(players,now){
 return Object.entries(players||{}).flatMap(([id,p])=>{
  const e=p.playAttack,age=now-e?.at;
  return e&&typeof e.target==='string'&&age>=0&&age<2400?[{...e,attacker:id,age}]:[];
 });
}
