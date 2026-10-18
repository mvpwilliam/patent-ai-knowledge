// Stable random streams keep transaction retries and replays identical.
export function randomStream(key){let s=2166136261;for(const c of String(key)){s^=c.charCodeAt(0);s=Math.imul(s,16777619)}return ()=>{s+=0x6D2B79F5;let t=Math.imul(s^s>>>15,1|s);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296}}
export function battleStats(pet){if(pet.battleStats)return {...pet.battleStats};const rnd=randomStream('pet-stats-v1:'+pet.id);let attack,defense,agility;do{attack=30+Math.floor(rnd()*41);defense=30+Math.floor(rnd()*41);agility=150-attack-defense}while(agility<30||agility>70);return {hp:200,attack,defense,agility}}
export const attackInterval=s=>3.4-(s.agility-30)*.02;
export function simulateBattle(record){const rnd=randomStream(record.id),stats=record.fighters.map(p=>p.stats),hp=[200,200],due=stats.map(s=>attackInterval(s)),events=[];let winner=-1;
 for(let i=0;i<200&&winner<0;i++){const side=Math.abs(due[0]-due[1])<1e-8?(rnd()<.5?0:1):(due[0]<due[1]?0:1),other=1-side,time=due[side],factor=[.75,.9,1.1,1.25][Math.floor(rnd()*4)],damage=Math.max(1,Math.round(30*stats[side].attack/(stats[other].defense+25)*factor));hp[other]=Math.max(0,hp[other]-damage);events.push({time,side,damage,hp:[...hp]});due[side]+=attackInterval(stats[side]);if(hp[other]===0)winner=side}
 return {events,winner,duration:events.at(-1)?.time||0};
}
export function createPetBattle(f,uid,a,now){const own=f.members[uid],other=f.members[a.opponent];if(!other||a.opponent===uid)throw Error('請選擇家人的夥伴');const pets=[own?.pets.find(p=>p.id===a.pet),other.pets.find(p=>p.id===a.target)];if(pets.some(p=>!p||p.feeds.length<15||p.pendingEvolution))throw Error('雙方都需要完成 5 次進化');for(const pet of pets)pet.battleStats=battleStats(pet);
 const record={id:a.id,at:now,fighters:pets.map((p,i)=>({owner:i?a.opponent:uid,ownerName:i?other.name:own.name,id:p.id,name:p.name,line:p.line,stats:{...p.battleStats}}))};record.winner=simulateBattle(record).winner;own.lastBattle=structuredClone(record);other.lastBattle=structuredClone(record);return record;
}
