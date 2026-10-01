'use strict';
const data=window.CALENDAR_DATA;
const el=id=>document.getElementById(id);
let index=0;
function localDate(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function locate(date){const i=data.findIndex(row=>row.date>=date);return i<0?data.length-1:i;}
function show(i,message=''){
 index=Math.max(0,Math.min(data.length,i));
 const closing=index===data.length;
 const row=data[closing?data.length-1:index];
 const [year,month,day]=row.date.split('-');
 el('date').value=row.date;
 const ornamentDay=Math.min(index+1,244);
 el('ornament').src=(ornamentDay%5?'leaf-single':Math.floor(ornamentDay/5)%2?'flower':'sun')+'.png';
 el('stamp').textContent=year+' / '+month;
 el('day').textContent=closing?'最後一題揭曉':day;
 el('weekday').textContent=closing?'12 月 30 日題目':'星期'+row.weekday;
 el('question').textContent=row.question;
 el('answer-label').textContent=closing?'答案':index===0?'下一個上班日揭曉':data[index-1].date.slice(5).replace('-','/')+' 題目答案';
 el('answer').textContent=closing?row.answer:index===0?'今天先猜猜看':data[index-1].answer;
 el('count').textContent=closing?'244 題全部揭曉':String(index+1).padStart(3,'0')+' / 244';
 el('progress').style.width=(Math.min(index+1,244)/244*100)+'%';
 el('prev').disabled=index===0;el('next').disabled=closing;
 el('next').textContent=index===243?'最後一題答案':'下一頁';
 el('note').textContent=message||'每天一題；下方是前一個上班日的答案。';
 el('paper').classList.toggle('closing',closing);
 el('paper').classList.remove('changing');void el('paper').offsetWidth;el('paper').classList.add('changing');
}
function chooseDate(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
 const i=locate(date);let note='';
 if(date<data[0].date)note='2027 年撕曆從 1 月 4 日開始，先看看第一題。';
 else if(date>data[data.length-1].date)note='2027 年最後一個上班日是 12 月 30 日。';
 else if(data[i].date!==date)note=date.slice(5).replace('-','/')+' 是休假日，顯示下個上班日 '+data[i].date.slice(5).replace('-','/')+'。';
 show(i,note);
}
el('prev').addEventListener('click',()=>show(index-1));
el('next').addEventListener('click',()=>show(index+1));
el('date').addEventListener('change',event=>chooseDate(event.target.value));
el('today').addEventListener('click',()=>chooseDate(localDate()));
document.addEventListener('keydown',event=>{if(event.target.closest('input,button'))return;if(event.key==='ArrowLeft'){event.preventDefault();show(index-1);}if(event.key==='ArrowRight'){event.preventDefault();show(index+1);}});
chooseDate(localDate());
