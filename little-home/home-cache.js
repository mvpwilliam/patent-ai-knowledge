const VERSION=1,MAX_AGE=7*24*60*60*1000;
export const homeCacheKey=(uid,home)=>`little-home-snapshot-v${VERSION}:${uid}:${home}`;
export function loadHomeCache(storage,uid,home,now=Date.now()){
 if(!uid||!home)return null;
 try{
  const data=JSON.parse(storage.getItem(homeCacheKey(uid,home))||'null');
  if(data?.version!==VERSION||data.uid!==uid||data.home!==home||!Number.isFinite(data.at)||now-data.at>MAX_AGE||data.at>now+60000)return null;
  if(!data.player||!Number.isFinite(data.player.xp)||!data.avatar)return null;
  return data;
 }catch{return null}
}
export function saveHomeCache(storage,{uid,home,avatar,player,monster},now=Date.now()){
 if(!uid||!home)return false;
 try{
  // Cache only this identity's character, never other members' presence or profiles.
  storage.setItem(homeCacheKey(uid,home),JSON.stringify({version:VERSION,uid,home,at:now,avatar,player,monster:monster||null}));return true;
 }catch{return false}
}
