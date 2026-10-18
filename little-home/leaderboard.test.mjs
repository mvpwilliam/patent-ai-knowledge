import test from 'node:test';
import assert from 'node:assert/strict';
import {castleScore,battleResult,saveBestScore,rankingRows} from './leaderboard.js';
test('castle score awards completion and remaining life only on victory',()=>{
 const s={kills:12,time:120,castle:{hp:80},status:'won'};
 assert.equal(castleScore(s),5200);s.status='lost';assert.equal(castleScore(s),2400);
 s.time=12.9;assert.equal(castleScore(s),1320);
});
test('best score is isolated by game, retry-safe and never grants a prize',()=>{
 const p={coins:42,medals:{}};
 const a=battleResult('castle',{kills:2,time:10,status:'lost',castle:{hp:0}});
 assert.equal(saveBestScore(p,a,1),true);assert.equal(saveBestScore(p,a,2),false);
 assert.equal(p.bestScores.castle.at,1);assert.equal(saveBestScore(p,{...a,score:100},3),false);
 const b=battleResult('shooter',{score:2900,kills:4,rescues:1,time:60,status:'won'});
 assert.equal(saveBestScore(p,b,4),true);assert.equal(p.bestScores.castle.score,300);assert.equal(p.bestScores.shooter.score,2900);
 assert.equal(p.coins,42);assert.deepEqual(p.medals,{});
 assert.throws(()=>saveBestScore(p,{...a,finished:false}));assert.throws(()=>saveBestScore(p,{...a,kind:'farm'}));assert.throws(()=>saveBestScore(p,{...a,score:NaN}));
});
test('family ranking sorts descending, ties share rank, missing and other-game scores excluded',()=>{
 const players={a:{bestScores:{castle:{score:300,at:2}}},b:{bestScores:{castle:{score:500,at:3}}},c:{bestScores:{castle:{score:500,at:1}}},d:{bestScores:{shooter:{score:9000}}},e:{}};
 const rows=rankingRows(players,{a:{name:'小明'},b:{name:'小華'}},'castle');
 assert.deepEqual(rows.map(r=>[r.id,r.rank]),[['c',1],['b',1],['a',3]]);assert.equal(rows[2].name,'小明');
 assert.equal(rankingRows({d:players.d},{},'castle').length,0);
});
