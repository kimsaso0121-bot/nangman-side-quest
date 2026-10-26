const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),all=JSON.parse(fs.readFileSync(path.join(root,'quests-core.json'),'utf8')).quests;
const q=id=>all.find(x=>x.id===id);
test('final approved event names and materials preserve original IDs',()=>{
 assert.equal(q('1.13-q06').title,'강호잡담·청화-화령비문');
 assert.equal(q('draft-journal-ouyang').title,'강호잡담·임종-후속편');
 assert.deepEqual(q('1.13-q06').officialNames,[]);
 assert.deepEqual(q('draft-journal-ouyang').officialNames,[]);
 assert.deepEqual(q('1.13-q09').officialNames,['팔괘문 해금조건']);
 assert.equal(q('draft-minor-1470').materials[11],'백작 × 30');
 assert.equal(q('draft-journal-ouyang').finalRewards[0].text,'은화 × 5냥, 소자질단 × 3, 서호 용정 × 1');
});
test('condition quotes and hyphen title format follow final approval',()=>{
 assert.equal(q('1.4-q11').prerequisites[0],'차선임무 「비의 황혼」, 「저녁노을 감상」, 「도법주석」, 「묵침창 후속편」 완료');
 assert.equal(q('1.5-q07').title,'태허신도결-「철인문」 관문의 전제 임무');
 assert.equal(q('1.10-q09').title,'정곰보-정소비 가입 임무');
 assert.equal(q('1.10-q07').title,'미제 살인 사건-종무월 가입 임무');
 assert.ok(!all.some(x=>/[()（）]/.test(x.title)));
});
test('internal processing notes and raw reward code are not displayed',()=>{
 const visible=all.map(x=>JSON.stringify([x.title,x.prerequisites,x.materials,x.finalRewards,x.followupNotes])).join('\n');
 for(const s of ['별도 완료 체크는 만들지 않습니다','별도 해금 임무 체크는 만들지 않습니다','한 편의 여러 문항은 하나의 체크로 기록합니다','AddP('])assert.ok(!visible.includes(s),s);
 assert.ok(q('1.4-q08').prerequisites.some(x=>x.includes('10중 달성')));
 assert.ok(q('1.13-q11').prerequisites.some(x=>x.includes('진행 중이 아님')));
});
test('renamed relationship labels resolve without changing target identity',()=>{
 const byId=new Map(all.map(x=>[x.id,x]));
 for(const x of all)for(const r of [...x.prerequisiteQuests,...x.followupQuests])if(r.id)assert.equal(r.title,byId.get(r.id).title);
});
