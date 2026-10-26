const {test}=require('node:test'),assert=require('node:assert/strict'),R=require('../records.js'),fs=require('node:fs'),vm=require('node:vm');
test('legacy profiles default owned filter on without writing or changing quest records',()=>{
 const raw=JSON.stringify({active:1,profiles:[0,1,2].map(i=>({name:'협객'+i,done:['old','unknown'],doing:['progress'],owned:['전봉']}))});
 const storage={raw,writes:0,getItem(){return this.raw},setItem(k,v){this.raw=v;this.writes++}},s=R.open(storage);
 assert.equal(storage.writes,0);assert.equal(storage.raw,raw);assert(s.model.profiles.every(p=>p.ownedOnly===true));
 s.commit(m=>{m.profiles[1].ownedOnly=false});const reopened=R.open(storage);
 assert.deepEqual(reopened.model.profiles.map(p=>p.ownedOnly),[true,false,true]);
 assert.deepEqual(reopened.model.profiles[1].done,['old','unknown']);assert.deepEqual(reopened.model.profiles[1].doing,['progress']);
 const other=R.open({getItem:()=>null,setItem(){}});other.importBackup(reopened.backup());assert.deepEqual(other.model.profiles,reopened.model.profiles);
});
test('owned filter only narrows companion scope and keeps recruitment visible',()=>{
 const all=JSON.parse(fs.readFileSync('quests-core.json','utf8')).quests,app=fs.readFileSync('app.js','utf8');
 const state={data:{quests:all},scope:{kind:'all'},ownedOnly:true,query:'',difficulty:'all',status:'all'};
 const ctx={state,GanghoBrowse:require('../browse.js'),profile:()=>({owned:[]}),status:()=> 'todo',difficultyTags:()=>[]};vm.createContext(ctx);
 vm.runInContext(app.split('\n').filter(l=>/^(const normalizeSearch=|function searchRank\(|function filtered\()/.test(l)).join('\n')+'\nthis.run=filtered',ctx);
 assert.equal(ctx.run().length,389);state.scope={kind:'category',value:'동료임무'};
 assert(ctx.run().every(q=>q.requiresOwnedCompanion!==true));assert(ctx.run().length>0);
 state.ownedOnly=false;assert(ctx.run().some(q=>q.requiresOwnedCompanion===true));
});
test('owned checkbox is outside status buttons and mobile inputs share 15px',()=>{
 const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('update.css','utf8');
 assert(html.includes('class="status-tools"><div class="statuses"'));assert(!html.includes('id="recentRegions"'));assert.equal((html.match(/id="ownedOnly"/g)||[]).length,1);
 assert(css.includes('.controls select,.controls input,.controls #browseButton,.controls input::placeholder{font-size:15px}'));
});
