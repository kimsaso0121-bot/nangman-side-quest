const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const raw=JSON.parse(fs.readFileSync('quests-core.json','utf8')),D=require('../quest-display.js'),R=require('../records.js'),B=require('../browse.js'),data=D.prepare(raw),get=id=>data.quests.find(q=>q.id===id);
const newIds=['1.14-q10','1.14-q11','1.22-q06'];
test('all 389 existing source quests are byte-for-byte equivalent as JSON objects; original three additions remain in place',()=>{
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(raw.quests.slice(0,389))).digest('hex'),'c50dfa47dcb0320533f2e4aa6738bf8f92d250b1a3703d14118426b825ff5aed');
 assert.deepEqual(raw.quests.slice(389,392).map(q=>q.id),newIds);assert.equal(raw.quests.length,399);assert.equal(data.quests.length,387);
});
test('simultaneous materials form one bullet without dropping amounts, parentheses or explanations',()=>{
 assert.deepEqual(get('1.10-q01').materials,['[은화] × 180냥, [진기] × 1300']);
 assert.equal(get('1.14-q09').materials.length,1);
 assert(get('1.14-q09').materials[0].includes('돌(수량 미확인), 나무(수량 미확인)'));
 for(const q of data.quests){if(q.id==='1.21-q05'||q.id==='1.22-q06')continue;const old=raw.quests.find(x=>x.id===q.id);for(const s of old.materials)assert(q.materials.some(line=>line.includes(D.quantity(s))),q.title+': '+s);}
});
test('route, sex and optional requirements retain separate bullets; source is immutable and preparation is idempotent',()=>{
 assert.equal(get('1.3-q16').materials.length,2);assert(get('1.3-q16').materials[0].startsWith('선택 1:'));assert(get('1.3-q16').materials[1].startsWith('선택 2:'));
 assert.equal(get('1.10-q22').materials.length,2);assert(get('1.10-q22').materials[1].startsWith('조선:'));
 assert.equal(get('1.20-q03').materials.length,2);assert(get('1.20-q03').materials[1].startsWith('남자주인공은'));
 assert.equal(get('draft-companion-427').materials.length,2);assert(get('draft-companion-427').materials[1].startsWith('조건부:'));
 assert.equal(get('draft-sect-1616').materials.length,2);assert(get('draft-sect-1616').materials[0].includes('귀환 [동전] × 500푼'));assert(get('draft-sect-1616').materials[1].startsWith('선택:'));
 assert.equal(get('1.21-q05').materials.length,3);
 const before=JSON.stringify(raw);D.prepare(raw);assert.equal(JSON.stringify(raw),before);assert.deepEqual(D.prepare(data),data);
});
test('new quests use the agreed core fields, regional classifications and existing prerequisite ID',()=>{
 const bun=get('1.14-q10'),training=get('1.14-q11'),drunk=get('1.22-q06');
 assert.equal(bun.recommendedLevel,'45레벨 이상');assert.equal(training.recommendedLevel,'60레벨 이상');assert.equal(drunk.recommendedLevel,'80레벨 이상');
 assert(training.prerequisites.includes('차선임무 「1위 다툼」 완료'));assert.equal(training.prerequisiteQuests[0].id,'1.6-q02');
 assert(training.prerequisites.some(s=>s.includes('맑은 날 오시')));assert(drunk.prerequisites.some(s=>s.includes('술시~인시')));
 assert.equal(drunk.browseGroup,'서북대막');assert.equal(bun.browseGroup,'동북변경');
 for(const q of [bun,training,drunk]){assert.equal(q.materials.length,q===drunk?2:1);assert.equal(q.browseCategory,'지역 차선임무');assert.deepEqual(q.officialNames,[]);assert(!/[()（）]/.test(q.title));assert.equal(q.followupQuests.length,0);assert(B.matches(q,{kind:'region',value:q.region}));assert(B.ownedVisible(q,true,[]));}
 assert(drunk.materials[0].includes('마유주·여아홍 제외'));assert(drunk.materials[1].includes('숨겨진 술 발굴 시 필요'));
 assert.equal(training.finalRewards[0].text,'[명성] × 5, [은화] × 2냥, [열력] × 1,500');assert(training.followupNotes.some(s=>s.includes('[벽력주] × 1 또는 [수전] × 1')));
});
test('optional shovel and palace route explanation remain separate without losing source content',()=>{
 const drunk=get('1.22-q06'),palace=get('1.24-q04');
 assert.equal(drunk.materials[1].startsWith('선택: [삽] × 1'),true);
 assert.equal(drunk.materials.map(s=>s.replace(/^선택: /,'')).join(', '),raw.quests.find(q=>q.id===drunk.id).materials[0]);
 assert.deepEqual(palace.materials,raw.quests.find(q=>q.id===palace.id).materials);
 assert.equal(palace.materials.length,2);assert(palace.materials[1].startsWith('선택지에 따라 전부 없어도 진행 가능'));
});

test('45-level difficulty selection is available and matches the new bun quest',()=>{
 const app=fs.readFileSync('app.js','utf8'),ctx={DIFFICULTY_EXTRA:{},powerBand:n=>n};vm.createContext(ctx);vm.runInContext(app.split('\n').find(s=>s.startsWith('function difficultyTags('))+'\nthis.tags=difficultyTags;',ctx);
 assert(ctx.tags(get('1.14-q10')).includes('level:45'));assert(fs.readFileSync('index.html','utf8').includes('<option value="level:45">45레벨</option>'));
});
test('중동 journal quest starts in Qilian and is not listed under Youzhou',()=>{
 const q=get('draft-journal-miwen03');assert.equal(q.region,'기련산');assert.equal(q.browseGroup,'서북대막');assert.deepEqual(q.regions,['기련산']);assert.deepEqual(q.prerequisites,['잡담·중동의 해당 단서 열람']);
 assert.deepEqual(q.finalRewards,[{type:'common',choice:null,text:'[영허단] × 3, [조화단] × 3, [비영단] × 1, [명성] × 1',sourceLineId:null}]);
 assert(B.matches(q,{kind:'region',value:'기련산'}));assert(!B.matches(q,{kind:'region',value:'유주'}));assert.equal(q.id,'draft-journal-miwen03');
 const source=raw.quests.find(x=>x.id===q.id);assert.deepEqual(source.regions,['기련산','유주']);
 for(const key of ['title','materials','finalRewards','followupNotes','followupQuests','officialNames','sourceUrl'])assert.deepEqual(q[key],D.prepare({quests:[source]}).quests[0][key]);
});
test('adding quests and grouping materials never rewrites existing profile records',()=>{
 const original=R.empty();original.profiles[0].done=['1.1-q01','1.17-q05','unknown-quest'];original.profiles[0].doing=['1.14-q09'];original.profiles[1].owned=['전봉'];
 const json=JSON.stringify(original),storage={writes:0,getItem:()=>json,setItem(){this.writes++}},store=R.open(storage);D.prepare(raw);
 assert.equal(storage.writes,0);assert.deepEqual(store.model.profiles[0].done,original.profiles[0].done);assert.deepEqual(store.model.profiles[0].doing,original.profiles[0].doing);assert(!store.model.profiles[0].done.some(id=>newIds.includes(id)));
});
