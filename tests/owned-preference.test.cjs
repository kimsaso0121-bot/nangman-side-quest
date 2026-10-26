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
test('owned filter works in every scope but only excludes unowned companion requirements',()=>{
 const all=JSON.parse(fs.readFileSync('quests-core.json','utf8')).quests,app=fs.readFileSync('app.js','utf8');
 const state={data:{quests:all},scope:{kind:'all'},ownedOnly:true,query:'',difficulty:'all',status:'all'};
 const ctx={state,GanghoBrowse:require('../browse.js'),profile:()=>({owned:[]}),status:()=> 'todo',difficultyTags:()=>[]};vm.createContext(ctx);
 vm.runInContext(app.split('\n').filter(l=>/^(const normalizeSearch=|function searchRank\(|function filtered\()/.test(l)).join('\n')+'\nthis.run=filtered',ctx);
 const required=all.filter(q=>q.browseCategory==='동료임무'&&q.requiresOwnedCompanion===true);
 assert.equal(ctx.run().length,389-required.length);assert(ctx.run().every(q=>!required.includes(q)));
 assert(all.filter(q=>q.browseCategory!=='동료임무').every(q=>ctx.run().includes(q)));
 state.scope={kind:'category',value:'동료임무'};
 assert(ctx.run().every(q=>q.requiresOwnedCompanion!==true));assert(ctx.run().length>0);
 state.ownedOnly=false;assert(ctx.run().some(q=>q.requiresOwnedCompanion===true));
});
test('owned checkbox stays visible in all scopes and popup names the current profile',()=>{
 const app=fs.readFileSync('app.js','utf8'),nav=fs.readFileSync('navigation.js','utf8'),elements={};let p={name:'검증 협객 가',owned:['전봉']};
 const ctx={state:{scope:{kind:'all'},difficulty:'all',ownedOnly:true},$:s=>elements[s]??(elements[s]={}),profile:()=>p,companionGroups:[['강호 동료',['전봉','류여의']]],esc:s=>s};vm.createContext(ctx);
 vm.runInContext(app.split('\n').find(l=>l.startsWith('function filters()'))+'\n'+nav.split('\n').find(l=>l.startsWith('function renderOwned()'))+'\nthis.filters=filters;this.renderOwned=renderOwned',ctx);
 for(const scope of [{kind:'all'},{kind:'region',value:'항주'},{kind:'category',value:'동료임무'}]){ctx.state.scope=scope;ctx.filters();assert.equal(elements['#ownerLine'].hidden,false);assert.equal(elements['#ownedOnly'].checked,true)}
 ctx.renderOwned();assert.equal(elements['#ownedProfileName'].textContent,'검증 협객 가 기준');assert(elements['#companionList'].innerHTML.includes('value="전봉" checked'));
 p={name:'검증 협객 나',owned:['류여의']};ctx.renderOwned();assert.equal(elements['#ownedProfileName'].textContent,'검증 협객 나 기준');assert(!elements['#companionList'].innerHTML.includes('value="전봉" checked'));assert(elements['#companionList'].innerHTML.includes('value="류여의" checked'));
});
test('owned checkbox is outside status buttons and mobile inputs share 15px',()=>{
 const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('update.css','utf8');
 assert(html.includes('class="status-tools"><div class="statuses"'));assert(!html.includes('id="recentRegions"'));assert.equal((html.match(/id="ownedOnly"/g)||[]).length,1);
 assert(css.includes('.controls select,.controls input,.controls #browseButton,.controls input::placeholder{font-size:15px}'));
});
