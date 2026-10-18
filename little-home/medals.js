// Code-native vector medals: crisp at phone size, no image download or animation loop.
export const MEDALS=Object.freeze({
 escape:{name:'密室逃脫大師',game:'小屋密室',rule:'解開大門密碼，成功逃出小屋',ribbon:'#608c7b',code:'ESCAPE MASTER'},
 castle:{name:'城堡守護者',game:'城堡保衛戰',rule:'守住城堡兩分鐘，擊退最後的恐龍',ribbon:'#3e657b',code:'CASTLE GUARDIAN'},
 shooter:{name:'客廳捍衛者',game:'客廳防衛戰',rule:'完成橫向闖關，擊敗哥吉拉',ribbon:'#985b43',code:'LOBBY DEFENDER'}
});
export function awardMedal(player,id,at=Date.now()){
 if(!Object.hasOwn(MEDALS,id))throw new Error('未知獎牌');
 if(!player.medals||typeof player.medals!=='object'||Array.isArray(player.medals))player.medals={};
 if(player.medals[id])return false;
 player.medals[id]={earnedAt:at};return true;
}
const contextKey='little-home-escape-medal-context';
export function beginEscapeMedal(owner,name){sessionStorage.setItem(contextKey,JSON.stringify({owner,name}));}
export function escapeMedalContext(){try{return JSON.parse(sessionStorage.getItem(contextKey))||null}catch{return null}}
export const pendingMedalKey=owner=>'little-home-pending-escape-medal:'+owner;
export function queueEscapeMedal(context,at=Date.now()){
 if(!context?.owner)return false;
 const key=pendingMedalKey(context.owner);
 if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({earnedAt:at}));
 return true;
}
let serial=0;
function style(){
 if(document.querySelector('#medal-styles'))return;
 const css=document.createElement('link');css.id='medal-styles';css.rel='stylesheet';css.href=new URL('./medals.css?v=medal-row-2',import.meta.url);document.head.append(css);
}
export function medalCard(id,{name='',earnedAt=null,locked=false,compact=false}={}){
 style();const m=MEDALS[id];if(!m)throw new Error('未知獎牌');
 const prefix='medal-'+(++serial),g=prefix+'-gold',c=prefix+'-copper',b=prefix+'-black';
 const motif=id==='escape'?`<path d="M137 206v-98l71-15v113" fill="#746345" stroke="#e1c88b" stroke-width="4"/><path d="M148 203v-85l48-10v95" fill="#263632" stroke="#b49a66" stroke-width="3"/><path d="m151 120 29 9v71l-29 4z" fill="#b18c53"/><circle cx="174" cy="161" r="3" fill="#f3db96"/><path d="M108 195v-37h24v37m-22-38v-17h20v17" fill="#8f9b77" stroke="#d7c28d" stroke-width="3"/><path d="M111 198v15m18-15v15" stroke="#d7c28d" stroke-width="8"/><path d="M202 171h27m-5 0v9m-10-9v7" stroke="#e0bd69" stroke-width="5"/><circle cx="202" cy="171" r="8" fill="none" stroke="#e0bd69" stroke-width="5"/>`
 :id==='castle'?`<path d="M106 207v-88h17v15h16v-15h18v88m-44-88V99h14v14h14V99h14v20M175 207v-88h17v15h16v-15h17v88m-43-88V99h14v14h14V99h14v20" fill="#bb9964" stroke="#e8cf8c" stroke-width="3"/><path d="M137 156h58v51h-58z" fill="#968258" stroke="#e8cf8c" stroke-width="3"/><path d="M156 207v-23a10 10 0 0 1 20 0v23" fill="#273730"/><path d="M166 151V86m0 0h31l-7 11 7 11h-31" fill="#638c80" stroke="#e0c47d" stroke-width="3"/><path d="M119 147v14m93-14v14" stroke="#273730" stroke-width="7"/>`
 :`<path d="m106 186 15-28h91l16 28" fill="#6f8667" stroke="#d7bd80" stroke-width="3"/><rect x="102" y="181" width="132" height="29" rx="14" fill="#272f2b" stroke="#ceb47a" stroke-width="4"/><g fill="#8b8e71" stroke="#d5bf85" stroke-width="2"><circle cx="120" cy="196" r="8"/><circle cx="144" cy="196" r="8"/><circle cx="168" cy="196" r="8"/><circle cx="192" cy="196" r="8"/><circle cx="216" cy="196" r="8"/></g><path d="m142 157 9-28h39l16 28" fill="#91a07a" stroke="#d7bd80" stroke-width="3"/><path d="M185 140h52" stroke="#e0c88b" stroke-width="10"/><path d="m115 115 12-18 13 18-5 15h-14z" fill="#acb692"/><path d="m113 134 28-1 8 24h-36z" fill="#6e886d"/><path d="m204 101 4-9 4 9 10 1-8 7 2 10-8-5-9 5 3-10-8-7z" fill="#ecd18d"/>`;
 const el=document.createElement('figure');el.className='medal-card'+(locked?' is-locked':'')+(compact?' is-compact':'');
 el.innerHTML=`<svg viewBox="0 0 336 340" role="img" aria-label="${m.name}"><defs><linearGradient id="${g}" x2="1" y2="1"><stop stop-color="#f8e3a2"/><stop offset=".35" stop-color="#a7894f"/><stop offset=".58" stop-color="#ead49a"/><stop offset="1" stop-color="#8b6d3a"/></linearGradient><linearGradient id="${c}" x2="1" y2="1"><stop stop-color="#e0b89a"/><stop offset=".45" stop-color="#755348"/><stop offset=".7" stop-color="#d4a388"/><stop offset="1" stop-color="#63463f"/></linearGradient><linearGradient id="${b}" x2=".7" y2="1"><stop stop-color="#3f4748"/><stop offset="1" stop-color="#191f23"/></linearGradient></defs>
 <path d="m108 6 30 96h59l31-96-36 9-24 56-24-56z" fill="${m.ribbon}" stroke="#263c43" stroke-width="8"/><path d="m120 9 26 82m70-82-26 82" stroke="#cfb474" stroke-width="3"/>
 <path d="M107 73h122v33H107z" fill="none" stroke="url(#${g})" stroke-width="9"/>
 <path d="m168 72 73 17 12 21 43 14 4 91 17 33-21 48-128 40L40 296l-21-48 17-33 4-91 43-14 12-21z" fill="#11191b" stroke="#171b1c" stroke-width="9"/>
 <path d="m168 68 73 17 12 21 43 14 4 91 17 33-21 48-128 40L40 292l-21-48 17-33 4-91 43-14 12-21z" fill="url(#${b})" stroke="url(#${c})" stroke-width="7"/>
 <path d="m168 80 67 16 11 20 39 13 4 85 16 30-18 39-119 36L49 283l-18-39 16-30 4-85 39-13 11-20z" fill="none" stroke="#b89268" stroke-width="1.5"/>
 <circle cx="168" cy="163" r="87" fill="#1e292b" stroke="url(#${g})" stroke-width="7"/><circle cx="168" cy="163" r="78" fill="url(#${b})" stroke="#a98f5e" stroke-width="1"/>
 <g opacity=".55" fill="#d5b982"><path d="m65 156-10-12 2 18 10 7-12 1 7 15 13 2-10 7 11 12 12-2-7 12 15 7 8-4M271 156l10-12-2 18-10 7 12 1-7 15-13 2 10 7-11 12-12-2 7 12-15 7-8-4"/></g>
 ${motif}
 <path d="m43 224 27 7h196l27-7-7 60-118 36-118-36z" fill="url(#${b})" stroke="url(#${c})" stroke-width="4"/>
 <text x="168" y="255" text-anchor="middle" fill="#eed59a" font-size="23" font-weight="800" font-family="system-ui,sans-serif">${m.name}</text><text x="168" y="276" text-anchor="middle" fill="#c9b485" font-size="10" letter-spacing="2" font-family="system-ui,sans-serif">${m.code}</text>
 <path d="m168 286 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="url(#${g})"/>
 </svg>`;
 const caption=document.createElement('figcaption'),label=document.createElement('strong'),note=document.createElement('small');
 label.textContent=locked?'尚未獲得':name?`${name} · 通關紀念`:'通關紀念';
 note.textContent=locked?m.rule:earnedAt?`${m.game} · ${new Date(earnedAt).toLocaleDateString('zh-TW')}`:m.game;
 caption.append(label,note);el.append(caption);return el;
}
export function renderMedalCollection(container,player,name){
 container.replaceChildren();const h=document.createElement('h3');h.textContent=`我的獎牌 · ${Object.keys(MEDALS).filter(id=>player.medals?.[id]).length} / 3`;container.append(h);
 const grid=document.createElement('div');grid.className='medal-collection';
 for(const id of Object.keys(MEDALS))grid.append(medalCard(id,{name,earnedAt:player.medals?.[id]?.earnedAt,locked:!player.medals?.[id]}));container.append(grid);
}
