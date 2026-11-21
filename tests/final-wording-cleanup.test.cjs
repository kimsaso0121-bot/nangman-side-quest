const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const raw=JSON.parse(fs.readFileSync('quests-core.json','utf8')),D=require('../quest-display.js'),data=D.prepare(raw),get=id=>data.quests.find(q=>q.id===id),source=id=>raw.quests.find(q=>q.id===id);
test('exact duplicated rain warning displays once without editing the two source clauses',()=>{
 const line='진행 중 선택지에 따라 강우의 생사가 달라집니다.';
 assert.equal(source('1.10-q12').prerequisites.filter(s=>s===line).length,2);
 assert.equal(get('1.10-q12').prerequisites.filter(s=>s===line).length,1);
});
test('mandatory intermediate stage labels become specific without changing their numbers or martial arts',()=>{
 for(const [id,prefix]of [['sect-1625','의천검 강화 시:'],['quest-912','하방가 사건 개방 시:']]){
  const before=source(id).prerequisites.find(s=>s.startsWith('진행 중:'));
  const after=get(id).prerequisites.find(s=>s.startsWith(prefix));assert(after,id);
  assert.deepEqual(after.match(/\d+/g),before.match(/\d+/g));
 }
 assert(!get('quest-1306').prerequisites.some(s=>s.includes('독술')));
 assert(source('quest-1306').prerequisites.some(s=>s.includes('독술 200')));
});
test('five APK-verified questions use confirmed conditions without changing source records',()=>{
 assert(get('draft-sect-1670').prerequisites.includes('천강검지결 10중 달성'));
 assert(get('draft-sect-1671').prerequisites.includes('태을교 소속(임무 시작·첫 재주조 대화 시)'));
 assert(!get('draft-sect-1671').prerequisites.some(s=>s.includes('도면')));
 assert.deepEqual(get('draft-minor-1020').prerequisites,['차선임무 「심음류도술」 완료','주인공 100레벨 이상','설주 보유','낮 시간(게임 시간 5~18시)에 시작']);
 assert(get('draft-minor-1470').prerequisites.includes('대소사 「간담상조」 달성(공헌 25,000 이상)'));
 assert.deepEqual(get('draft-sect-1670').followupNotes,['신소 승련 후에는 판매·분해·버리기가 불가능합니다.']);
 assert.deepEqual(get('draft-sect-1671').followupNotes,[]);
});
test('ordinary firestarter is square-bracketed while book quotes and quantities remain intact',()=>{
 for(const id of ['1.12-q04','1.20-q10']){assert(get(id).materials.some(s=>s.includes('[불붙이개]')));assert(!JSON.stringify(get(id).materials).includes('「불붙이개」'));}
 assert(get('1.12-q04').materials[0].includes('「장생결 파손된 잔편」'));
});
test('hidden followups are display-only exclusions and raw quiz relationships remain available for records',()=>{
 const q=get('1.14-q06'),s=source('1.14-q06');
 assert.equal(s.followupQuests.filter(r=>D.hiddenIds.has(r.id)).length,11);
 assert(!q.followupQuests.some(r=>D.hiddenIds.has(r.id)));
 assert(q.followupQuests.some(r=>r.id==='draft-journal-miwen03'));
});
test('prerequisite names are formatted without converting learning, progress or non-departure conditions',()=>{
 assert(get('1.20-q05').prerequisites.includes('차선임무 「기우 임무-진기 찾기」 완료, 진무양의 호감도≥80'));
 assert(get('1.19-q04').prerequisites.includes('차선임무 「용상반야공」 완료, [용상반야공] 6중까지 수련'));
 assert(get('1.12-q04').prerequisites.includes('류여의 특성 레벨업 임무 완료, 류여의가 아군에서 이탈하지 않음'));
 assert(get('1.2-q08').prerequisites.includes('남양도 주요임무 완료, 주인공 20레벨 이상'));
 assert.equal(raw.quests.length,399);assert.equal(data.quests.length,387);assert.deepEqual(D.prepare(data),data);
});
