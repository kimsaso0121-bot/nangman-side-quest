const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const D=require('../quest-display.js'),raw=JSON.parse(fs.readFileSync('quests-core.json','utf8')),data=D.prepare(raw);
test('detail shows prerequisites once and does not render a duplicate prior-quest section',()=>{
 const app=fs.readFileSync('app.js','utf8'),line=app.split('\n').find(l=>l.startsWith('function detail()'));
 for(const q of data.quests){const target={innerHTML:''},ctx={quest:()=>q,state:{selected:q.id},status:()=> 'todo',esc:s=>s,checked:()=> 'false',labels:{todo:'미완료'},marks:{todo:''},$:()=>target,list:items=>items.join('|'),rewards:items=>items.map(r=>r.text).join('|')};vm.createContext(ctx);vm.runInContext(line+'\ndetail();',ctx);
  assert.equal((target.innerHTML.match(/◆ 전제조건/g)||[]).length,1,q.title);
  assert(!target.innerHTML.includes('◆ 선행임무'),q.title);
  for(const condition of q.prerequisites)assert(target.innerHTML.includes(condition),q.title+': '+condition);
 }
});
test('existing progress, skill and exclusion conditions remain explicit rather than becoming completion requirements',()=>{
 const get=id=>data.quests.find(q=>q.id===id);
 assert(get('1.3-q03').prerequisites.includes('차선임무 「모란미인도」 완료'));
 assert(get('1.4-q07').prerequisites.some(s=>s.includes('백포승려 구출까지 진행')));
 assert(get('1.4-q08').prerequisites.some(s=>s.includes('[건원공] 10중 달성')));
 assert(get('1.13-q11').prerequisites.some(s=>s.includes('진행 중이 아님')));
 assert(get('draft-minor-1033').prerequisites.some(s=>s.includes('후반 진행에는')));
});
test('all internal quest relationships and original data survive presentation consolidation',()=>{
 const before=JSON.stringify(raw),byId=new Map(raw.quests.map(q=>[q.id,q]));
 const related=data.quests.filter(q=>q.prerequisiteQuests.length);assert.equal(related.length,88);
 assert.equal(related.reduce((n,q)=>n+q.prerequisiteQuests.length,0),139);
 for(const q of data.quests)assert.deepEqual(q.prerequisiteQuests.map(r=>({id:r.id,relation:r.relation,stage:r.stage,sourceClause:r.sourceClause})),byId.get(q.id).prerequisiteQuests.map(r=>({id:r.id,relation:r.relation,stage:r.stage,sourceClause:r.sourceClause})));
 D.prepare(raw);assert.equal(JSON.stringify(raw),before);
});
