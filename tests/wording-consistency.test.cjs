const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const D=require('../quest-display.js'),raw=JSON.parse(fs.readFileSync('quests-core.json','utf8'));
const data=D.prepare(raw),get=id=>data.quests.find(q=>q.id===id);
test('wording normalization is read-only and idempotent',()=>{
 const before=JSON.stringify(raw);D.prepare(raw);assert.equal(JSON.stringify(raw),before);
 assert.deepEqual(D.prepare(data),data);
 for(const q of data.quests){const old=raw.quests.find(x=>x.id===q.id);for(const k of ['id','officialNames','regions','sourceUrl','difficultyTags','prerequisiteQuests','followupQuests'])if(!['prerequisiteQuests','followupQuests'].includes(k)&&!(q.id==='draft-journal-miwen03'&&k==='regions'))assert.deepEqual(q[k],old[k]);}
});
test('character wording does not change martial-art, equipment or faction ranks',()=>{
 assert.equal(get('1.3-q12').recommendedLevel,'40레벨 이상');
 assert(get('1.9-q03').recommendedLevel.includes('문황경 200등급'));
 assert(get('1.8-q01').prerequisites.includes('요리≥180등급'));
 assert(get('draft-companion-533').prerequisites.includes('금패 신포 등급'));
 assert(get('1.13-q09').materials.includes('은화 최소 48냥, 60등급 방어구 하나씩'));
 assert(get('1.13-q01').prerequisites[0].includes('시작은 50레벨부터 가능'));
});
test('quest reference formatting preserves start, partial progress and exclusion semantics',()=>{
 assert(get('1.21-q05').prerequisites.includes('주요임무 「의문 가득, 칠살 재현」 시작'));
 assert(get('1.10-q10').prerequisites.includes('주요임무 「천리추격·지옥무문」 진행 중 해금'));
 assert(get('1.10-q09').prerequisites[0].includes('「백마사 살인사건」까지 진행'));
 assert(get('1.13-q11').prerequisites.includes('차선임무 「광대의 감정」 진행 중이 아님'));
 assert(get('1.13-q08').prerequisites.includes('주요임무 「연남연북」 완료'));
});
test('variable final rewards use one summary; intermediate and fixed rewards remain intact',()=>{
 const ids=['1.3-q01','1.5-q06','1.8-q08','1.10-q16','1.10-q21','1.14-q06','1.27-q06'];
 for(const q of data.quests){const old=raw.quests.find(x=>x.id===q.id);if(q.id==='draft-journal-miwen03'){assert.equal(q.finalRewards.length,1);assert.equal(q.finalRewards[0].text,'[영허단] × 3, [조화단] × 3, [비영단] × 1, [명성] × 1');}else if(ids.includes(q.id)||q.id==='1.21-q05'||old.finalRewards.some(r=>/^선택지에 따라 (?:최종보상 |보상 )?상이$/.test(r.text))){assert.equal(q.finalRewards.length,1);assert.equal(q.finalRewards[0].text,'선택지에 따라 상이');}else assert.deepEqual(q.finalRewards,old.finalRewards.map(r=>({...r,text:D.rewardText(r.text)})));}
 assert(get('1.23-q05').finalRewards[0].text.includes('중간 선택지'));
});

test('quantity formatting preserves every digit, unit and explanation without guessing rank numbers',()=>{
 for(const q of raw.quests)for(const text of [...q.materials,...q.finalRewards.map(r=>r.text)]){
   const result=D.quantity(text);
   assert.deepEqual(result.match(/\d+/g),text.match(/\d+/g),q.id+': '+text);
   const content=s=>s.replace(/[\[\]「」xｘ×\s]/g,'');
   assert.equal(content(result),content(text),q.id+': '+text);
   assert.equal(D.quantity(result),result);
 }
 assert.equal(D.quantity('은화 1냥 500푼'),'[은화] × 1냥 500푼');
 assert.equal(D.quantity('「장생결 잔편」 x 1'),'「장생결 잔편」 × 1');
 assert.equal(D.quantity('60등급 방어구 하나씩, 요리 180등급, 호감도 120 이상'),'60등급 방어구 하나씩, 요리 180등급, 호감도 120 이상');
 assert.equal(D.quantity('약초제조 경로 선택 시 호골 10·용골초 5·백삼 1').startsWith('약초제조 경로 선택 시 [호골] × 10'),true);
});

test('books retain corner quotes in all fields; reward commas do not change names or branch choices',()=>{
 assert.equal(D.quantity('「식진록」 x 1'),'「식진록」 × 1');
 assert.equal(D.quantity('[검술 주석] × 2'),'「검술 주석」 × 2');
 assert.equal(D.quantity('문황경 초본'),'「문황경 초본」');
 assert.equal(D.quantity('도객 수기를 맹상에게 사용'),'「도객 수기」를 맹상에게 사용');
 assert.equal(D.quantity('청휘한영경 1'),'[청휘한영경] × 1');
 assert.equal(D.rewardText('후반 광반생 대화: 열력 3000·은화 5냥'),'후반 광반생 대화: [열력] × 3000, [은화] × 5냥');
 assert.equal(D.rewardText('흑초금미 × 1 / 명성 × 2'),'[흑초금미] × 1 / [명성] × 2');
 assert.equal(D.rewardText('양옥랑·고월추 등장, [명성] × 2'),'양옥랑·고월추 등장, [명성] × 2');
 assert(get('1.14-q03').finalRewards.some(r=>r.text.includes('「식진록」 × 1')));
 assert(get('draft-companion-542').finalRewards.some(r=>r.text.includes('「도객 수기」')));
});
