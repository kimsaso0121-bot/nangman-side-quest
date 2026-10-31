const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const D=require('../quest-display.js'),R=require('../records.js'),B=require('../browse.js');
const source=JSON.parse(fs.readFileSync('quests-core.json','utf8')),data=D.prepare(source);
test('eleven quizzes and shop guidance leave the visible catalog but not source data or recorded IDs',()=>{
 const before=JSON.stringify(source),shown=new Set(data.quests.map(q=>q.id));
 assert.equal(source.quests.length,389);assert.equal(data.quests.length,377);assert.equal(D.hiddenIds.size,12);
 assert(shown.has('draft-sect-1821'),'어풍은형 remains visible');
 for(const id of D.hiddenIds){assert(source.quests.some(q=>q.id===id));assert(!shown.has(id));}
 D.prepare(source);assert.equal(JSON.stringify(source),before);
 const p=R.empty();p.profiles[0].done=['draft-journal-quiz-01','1.17-q05','1.1-q01','unknown'];p.profiles[0].doing=['draft-journal-quiz-02'];
 const s=R.open({getItem:()=>null,setItem(){}});s.importBackup(p);assert.deepEqual(s.backup().profiles[0].done,p.profiles[0].done);assert.deepEqual(s.backup().profiles[0].doing,p.profiles[0].doing);
 assert.equal(s.model.profiles[0].done.filter(id=>shown.has(id)).length,1);
});
test('school and filter preferences survive reload and backup per character without writes on load',()=>{
 const original=R.empty();original.active=1;original.profiles[1].name='기존 협객';original.profiles[1].done=['draft-journal-quiz-01','unregistered'];original.profiles[1].owned=['전봉'];
 const raw=JSON.stringify(original),storage={raw,writes:0,getItem(){return this.raw},setItem(k,v){this.raw=v;this.writes++}};
 const s=R.open(storage);assert.equal(storage.writes,0);assert.equal(storage.raw,raw);assert(s.model.profiles.every(p=>p.schoolOnly===false&&p.schools.length===0));
 s.commit(m=>{m.profiles[1].schools=['태을교','소림사'];m.profiles[1].schoolOnly=true});
 const reopened=R.open(storage);assert.equal(storage.writes,1);assert.deepEqual(reopened.model.profiles.map(p=>p.schools),[[],['태을교','소림사'],[]]);
 assert.deepEqual(reopened.model.profiles[1].done,original.profiles[1].done);assert.deepEqual(reopened.model.profiles[1].owned,['전봉']);assert.equal(reopened.model.active,1);
 const imported=R.open({getItem:()=>null,setItem(){}});imported.importBackup(reopened.backup());assert.deepEqual(imported.model.profiles,reopened.model.profiles);
 reopened.commit(m=>{m.profiles[1].schools=[]});assert.deepEqual(reopened.model.profiles[1].done,original.profiles[1].done);
});
test('school settings retain existing safe-save failure and concurrent-change behavior',()=>{
 const raw=JSON.stringify(R.empty()),storage={raw,getItem(){return this.raw},setItem(){throw Error('quota')}};const s=R.open(storage);
 assert.throws(()=>s.commit(m=>{m.profiles[0].schools=['소림사']}));assert.equal(storage.raw,raw);assert.equal(s.model.profiles[0].schools.length,0);
 storage.raw=raw+' ';assert.throws(()=>s.commit(m=>{m.profiles[0].schoolOnly=true}));assert.equal(storage.raw,raw+' ');
 const bad=R.empty();bad.profiles[0].schools='소림사';assert.throws(()=>s.importBackup(bad));
});
test('multi-school filter intersects existing search and scope while leaving all other categories visible',()=>{
 const eligible=data.quests.filter(q=>B.schoolVisible(q,true,['태을교','소림사']));
 assert(eligible.some(q=>q.owner==='태을교'));assert(eligible.some(q=>q.owner==='소림사'));
 assert(eligible.filter(q=>q.browseCategory==='강호문파').every(q=>['태을교','소림사'].includes(q.owner)));
 assert(data.quests.filter(q=>q.browseCategory!=='강호문파').every(q=>eligible.includes(q)));
 assert.equal(data.quests.filter(q=>B.schoolVisible(q,false,[])).length,377);
 assert(!data.quests.filter(q=>B.schoolVisible(q,true,[])).some(q=>q.browseCategory==='강호문파'));
 const state={data,scope:{kind:'category',value:'강호문파'},ownedOnly:false,difficulty:'all',status:'all',query:'활맥법'};
 const context={state,GanghoBrowse:B,profile:()=>({owned:[],schools:['천도문'],schoolOnly:true}),status:()=> 'todo',difficultyTags:()=>[]};vm.createContext(context);
 vm.runInContext(fs.readFileSync('app.js','utf8').split('\n').filter(l=>/^(const normalizeSearch=|function searchRank\(|function filtered\()/.test(l)).join('\n')+'\nthis.run=filtered;',context);
 assert.equal(context.run()[0].title,'천도문·활맥법');state.scope={kind:'owner',category:'강호문파',value:'소림사'};assert.equal(context.run().length,0);
});
test('approved names preserve IDs, official names and relationships across both loading sources',()=>{
 const chunkSource={...source,quests:JSON.parse(fs.readFileSync('data/manifest.json','utf8')).chunks.flatMap(n=>JSON.parse(fs.readFileSync('data/'+n,'utf8')))};
 assert.deepEqual(D.prepare(chunkSource).quests,data.quests);const byId=new Map(data.quests.map(q=>[q.id,q]));
 assert.equal(byId.get('draft-minor-1133').title,'복희도법 진급');assert.equal(byId.get('draft-minor-1134').title,'복희도 승련-무기 강화');
 assert.equal(byId.get('draft-journal-sb').title,'강호잡담·상백-보리 염주');assert.equal(byId.get('draft-journal-ouyang').title,'강호잡담·임종-구양이삼의 차');
 for(const q of data.quests){const old=source.quests.find(x=>x.id===q.id);assert.deepEqual(q.officialNames,old.officialNames);assert.deepEqual(q.materials,old.materials);assert.deepEqual(q.finalRewards,old.finalRewards);if(q.browseCategory==='강호문파')assert(q.title.startsWith(q.owner+'·'));for(const r of [...q.prerequisiteQuests,...q.followupQuests])if(byId.has(r.id))assert.equal(r.title,byId.get(r.id).title);}
 const html=fs.readFileSync('index.html','utf8'),staticList=html.split('<!-- STATIC_QUEST_LIST_START -->')[1].split('<!-- STATIC_QUEST_LIST_END -->')[0];
 assert.equal((staticList.match(/<article /g)||[]).length,377);for(const id of D.hiddenIds)assert(!staticList.includes('data-id="'+id+'"'));
});
