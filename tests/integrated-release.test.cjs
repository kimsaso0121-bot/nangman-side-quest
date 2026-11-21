const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const raw=JSON.parse(fs.readFileSync('quests-core.json','utf8')),D=require('../quest-display.js'),B=require('../browse.js'),R=require('../records.js'),data=D.prepare(raw);
const ids=['quest-2600','quest-912','quest-1124','quest-1306'],get=id=>data.quests.find(q=>q.id===id);
test('four reviewed regional stories append without altering the previous 395 objects or seven-check decision',()=>{
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(raw.quests.slice(0,395))).digest('hex'),'1ce67688f6c7a1becb51b00aa3a107bb429712f929b4ca11c73efe72ccb97b8e');
 assert.deepEqual(raw.quests.slice(395).map(q=>q.id),ids);
 assert.equal(raw.quests.length,399);assert.equal(data.quests.length,387);
 assert.deepEqual(get('quest-2600').officialNames,['잔신파지법·심','잔신파지법·체','잔신파지법·형']);
 assert.equal(data.quests.filter(q=>q.title==='잔신파지법').length,1);
 for(const id of ids){const q=get(id);assert.equal(q.sourceUrl,null);assert(B.groups.includes(q.browseGroup));}
});
test('breakthrough uses verified recipe total and keeps authoring instructions out of followup information',()=>{
 const q=get('quest-2600');
 for(const [name,n]of [['양신지',147],['오지간수',72],['반혼간',72],['생주로',72],['인삼',25],['영지',25],['하수오',9]])assert(q.materials[0].includes('['+name+'] × '+n));
 assert(q.prerequisites.some(s=>s.includes('열력 68,000 이상 보유')));
 assert(q.prerequisites[1].startsWith('심매 돌파 시: '));
 assert(q.prerequisites[2].startsWith('무학 정진 단계: '));
 assert(!q.prerequisites.some(s=>s.startsWith('진행 중: ')));
 assert(!JSON.stringify(q.materials).includes('68,000'));
 assert(q.finalRewards[0].text.includes('[정진 점수] × 7'));
 assert.deepEqual(q.followupNotes,['레벨 상한이 진행에 따라 93 → 96 → 100으로 확장됩니다.']);
 assert(!JSON.stringify(q).includes('완료 조건으로 넣지'));
});
test('new fixed rewards stay explicit and optional extras are conditional rather than a variable-reward summary',()=>{
 const tower=get('quest-912'),blood=get('quest-1124');
 assert(tower.materials[0].includes('[은화] × 10냥'));assert(tower.materials[1].startsWith('선택:'));assert(!JSON.stringify(tower.materials).includes('제청'));
 for(const q of [tower,blood]){assert.equal(q.finalRewards.length,2);assert.equal(q.finalRewards[1].type,'conditional');assert(q.finalRewards[1].choice);assert(!JSON.stringify(q.finalRewards).includes('선택지에 따라 상이'));}
 assert(blood.materials[0].includes('[은화] × 200냥'));assert(blood.finalRewards[0].text.includes('[은화] × 15냥'));assert(blood.finalRewards[1].text.includes('[은화] × 10냥'));
 const g=get('quest-1306');assert.equal(g.region,'낙양');assert.deepEqual(g.officialNames,['돈황·고창불보']);assert(g.finalRewards[0].text.includes('[호익류금당] × 1'));
 assert.deepEqual(g.prerequisiteQuests.map(r=>r.id),['quest-912','quest-2600']);
});
test('regional checks add four targets to every profile but never duplicate existing completion records',()=>{
 const old=data.quests.filter(q=>!ids.includes(q.id)),p={owned:[],schools:[],gender:'female',done:['1.1-q01'],doing:[]};
 const oldProgress=B.progressFor(old,p),next=B.progressFor(data.quests,p);
 assert.equal(next.total-oldProgress.total,4);assert.equal(next.completed,oldProgress.completed);
 const m=R.empty();m.profiles[0].done=['1.1-q01','sect-1624','unregistered'];m.profiles[1].doing=['quest-912'];const snapshot=JSON.stringify(m),s=R.normalize(m);
 assert.equal(JSON.stringify(m),snapshot);assert.deepEqual(s.profiles[0].done,m.profiles[0].done);assert.deepEqual(s.profiles[1].doing,['quest-912']);
});
