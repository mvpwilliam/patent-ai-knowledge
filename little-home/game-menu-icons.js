export function applyGameMenuIcons(games){
 const choices=[['城堡保衛戰','castle'],['小屋密室','door'],['客廳防衛戰','tank'],['家庭農場','farm']];
 for(const node of games.querySelectorAll('.game-dialog-body > button,.game-dialog-body > a')){
  const match=choices.find(([label])=>node.textContent.includes(label));if(!match)continue;
  const label=match[0];
  const icon=document.createElement('img');icon.src=new URL(`./assets/game-${match[1]}.webp`,import.meta.url);icon.alt='';icon.width=64;icon.height=64;icon.decoding='async';icon.draggable=false;icon.style.cssText='width:64px;height:64px;object-fit:contain;flex:0 0 64px;filter:drop-shadow(0 2px 2px #263b3025)';
  const text=document.createElement('span');text.textContent=label;text.style.cssText='flex:1;min-width:0;text-align:left;line-height:1.4';
  node.replaceChildren(icon,text);Object.assign(node.style,{display:'flex',alignItems:'center',justifyContent:'flex-start',gap:'12px',height:'84px',minHeight:'84px',padding:'8px 14px',boxSizing:'border-box',background:'#e8eddf',color:'#3d5949'});
 }
}

