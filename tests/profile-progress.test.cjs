const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const R=require('../records.js'),B=require('../browse.js'),D=require('../quest-display.js');
const data=D.prepare(JSON.parse(fs.readFileSync('quests-core.json','utf8'))),all=data.quests;
const memory=raw=>({raw,writes:0,getItem(){return this.raw},setItem(k,v){if(this.fail)throw Error('quota');this.raw=v;this.writes++}});

test('legacy gender defaults to unspecified without writes or loss; three profiles and backups stay independent',()=>{
 const original=R.empty();original.profiles.forEach(p=>{delete p.gender;p.done=['1.1-q01','unknown'];p.doing=['hidden'];p.extra={keep:true}});
 const raw=JSON.stringify(original),storage=memory(raw),store=R.open(storage);
 assert.equal(storage.writes,0);assert.equal(storage.raw,raw);assert(store.model.profiles.every(p=>p.gender==='unspecified'));
 store.commit(m=>{m.profiles[0].gender='female';m.profiles[1].gender='male';m.profiles[1].schools=['태을교'];m.profiles[1].owned=['석소로']});
 const reopened=R.open(storage),imported=R.open(memory(null));imported.importBackup(reopened.backup());
 assert.deepEqual(imported.backup(),reopened.backup());assert.deepEqual(reopened.model.profiles.map(p=>p.gender),['female','male','unspecified']);
 for(const p of reopened.model.profiles){assert.deepEqual(p.done,['1.1-q01','unknown']);assert.deepEqual(p.doing,['hidden']);assert.deepEqual(p.extra,{keep:true})}
});

test('gender save and import keep transactional storage, malformed values and concurrent changes protected',()=>{
 const raw=JSON.stringify(R.empty()),storage=memory(raw),store=R.open(storage);storage.fail=true;
 assert.throws(()=>store.commit(m=>{m.profiles[0].gender='female'}));assert.equal(storage.raw,raw);assert.equal(store.model.profiles[0].gender,'unspecified');
 storage.fail=false;storage.raw=raw+' ';assert.throws(()=>store.commit(m=>{m.profiles[0].gender='male'}));assert.equal(storage.raw,raw+' ');
 for(const gender of ['other','',null,0,{},[]]){const bad=R.empty();bad.profiles[0].gender=gender;const s=memory(JSON.stringify(bad)),blocked=R.open(s);assert(blocked.blocked);assert.equal(s.writes,0);assert.throws(()=>blocked.commit(()=>{}));const target=R.open(memory(raw));assert.throws(()=>target.importBackup(bad));assert.equal(target.model.profiles[0].gender,'unspecified')}
});

test('target catalog includes general quests and only selected companion and school quests, independent of display switches',()=>{
 const p={owned:['석소로'],schools:['태을교'],gender:'unspecified',done:[],doing:[]};
 const target=all.filter(q=>B.targetEligible(q,p));
 assert(target.some(q=>q.browseCategory==='동료임무'&&q.owner==='석소로'));
 assert(target.filter(q=>q.browseCategory==='동료임무').every(q=>q.owner==='석소로'));
 assert(target.filter(q=>q.browseCategory==='강호문파').every(q=>q.owner==='태을교'));
 assert(all.filter(q=>!['동료임무','강호문파'].includes(q.browseCategory)).every(q=>target.includes(q)));
 assert.deepEqual(B.progressFor(all,p),B.progressFor(all,{...p,ownedOnly:false,schoolOnly:false}));
 assert.deepEqual(B.progressFor(all,p),B.progressFor(all,{...p,ownedOnly:true,schoolOnly:true}));
});

test('new companion or school expands target; excluded completions and doing records return when reselected',()=>{
 const p={owned:[],schools:[],gender:'unspecified',done:[],doing:[]};const base=all.filter(q=>B.targetEligible(q,p));p.done=base.map(q=>q.id);
 const companion=all.filter(q=>q.browseCategory==='동료임무'&&q.owner==='석소로'),school=all.filter(q=>q.browseCategory==='강호문파'&&q.owner==='태을교');
 assert.equal(B.progressFor(all,p).percent,100);p.owned=['석소로'];let progress=B.progressFor(all,p);
 assert.equal(progress.total,base.length+companion.length);assert.equal(progress.completed,base.length);assert(progress.percent<100);
 p.done.push(companion[0].id,'unknown');p.doing.push(companion[1].id);p.schools=['태을교'];progress=B.progressFor(all,p);assert.equal(progress.total,base.length+companion.length+school.length);assert.equal(progress.inProgress,1);
 const before=JSON.stringify(p);B.progressFor(all,p);assert.equal(JSON.stringify(p),before);p.owned=[];assert.equal(B.progressFor(all,p).completed,base.length);assert.equal(B.progressFor(all,p).inProgress,0);
 assert(p.done.includes(companion[0].id));assert(p.doing.includes(companion[1].id));p.owned=['석소로'];assert.equal(B.progressFor(all,p).completed,base.length+1);assert.equal(B.progressFor(all,p).inProgress,1);
});

test('only verified bald quest is excluded for women; male and unspecified remain included without record changes',()=>{
 const p={owned:data.companions,schools:D.schools,done:['1.14-q02'],doing:[]},base=B.progressFor(all,p),female={...p,gender:'female'},before=JSON.stringify(female);
 assert.deepEqual(B.progressFor(all,{...p,gender:'male'}),base);assert.deepEqual(B.progressFor(all,{...p,gender:'unspecified'}),base);
 assert.equal(B.progressFor(all,female).total,base.total-1);assert.equal(B.progressFor(all,female).completed,0);assert.equal(JSON.stringify(female),before);
 const excluded=all.filter(q=>!B.targetEligible(q,female));assert.deepEqual(excluded.map(q=>q.id),['1.14-q02']);
});

test('empty catalog is 0%, duplicates and unknown IDs cannot inflate counts; 100% requires every target',()=>{
 assert.deepEqual(B.progressFor([],{done:[],doing:[]}),{completed:0,inProgress:0,total:0,percent:0});
 const quests=Array.from({length:300},(_,i)=>({id:String(i),browseCategory:'지역 차선임무'})),p={done:quests.slice(1).map(q=>q.id),doing:['1','0']};p.done.push('1','unknown');
 assert.deepEqual(B.progressFor(quests,p),{completed:299,inProgress:1,total:300,percent:99});p.done.push('0');assert.equal(B.progressFor(quests,p).percent,100);
});

test('rendered counters ignore search, scope, status and display filters and safely wait for data',()=>{
 const elements={},p={owned:[],schools:[],gender:'female',done:['1.1-q01','1.14-q02'],doing:['1.1-q02']},state={data};
 const ctx={state,profile:()=>p,GanghoBrowse:B,$:s=>elements[s]??(elements[s]={style:{}})};vm.createContext(ctx);
 vm.runInContext(fs.readFileSync('app.js','utf8').split('\n').find(l=>l.startsWith('function progress()'))+'\nthis.run=progress;',ctx);ctx.run();const before=JSON.stringify(elements);
 Object.assign(state,{query:'다리',scope:{kind:'owner',value:'석소로'},status:'done',difficulty:'level:80',ownedOnly:false});ctx.run();assert.equal(JSON.stringify(elements),before);
 assert.equal(elements['#doneCount'].textContent,1);assert.equal(elements['#doingCount'].textContent,1);assert.equal(elements['#totalCount'].textContent,B.progressFor(all,p).total);
 state.data=null;assert.doesNotThrow(()=>ctx.run());
});

test('gender is a simple shared setting, both existing tabs remain, and all setting changes update progress',()=>{
 const html=fs.readFileSync('index.html','utf8'),nav=fs.readFileSync('navigation.js','utf8');
 assert.equal((html.match(/role="tab"/g)||[]).length,2);assert.equal((html.match(/id="profileGender"/g)||[]).length,1);
 assert(html.includes('value="unspecified">미설정'));assert(html.includes('value="female">여'));assert(html.includes('value="male">남'));
 for(const id of ['profileGender','companionList','schoolList'])assert(nav.split('\n').find(l=>l.startsWith("$('#"+id+"').onchange=")).includes('progress()'));
});

test('compact gender select matches filter tones and chevron without enlarging its measured size',()=>{
 const css=fs.readFileSync('update.css','utf8'),rule=css.match(/#ownedDialog \.settings-gender select\{([^}]+)\}/)[1];
 for(const value of ['width:96px','min-height:36px','padding:4px 25px 4px 9px','border:1px solid #8d7658','border-radius:5px','background-color:#f4ecdc','color:#382e24','appearance:none'])assert(rule.includes(value),value);
 assert(css.includes('#ownedDialog .settings-gender{position:relative;display:inline-flex;align-items:center;gap:8px;font-size:14px}'));
 assert(css.includes('border-right:2px solid #382e24;border-bottom:2px solid #382e24;transform:translateY(-68%) rotate(45deg);pointer-events:none'));
});

test('settings header names the current character, with gender centered separately below and no extra tab',()=>{
 const html=fs.readFileSync('index.html','utf8'),dialog=html.match(/<dialog id="ownedDialog">[\s\S]*?<\/dialog>/)[0];
 assert(dialog.includes('<small>협객 설정</small><h2 id="settingsTitle"><span id="ownedProfileName"></span></h2>'));
 const row=dialog.match(/<p class="settings-profile">([\s\S]*?)<\/p>/)[1];assert(row.includes('id="profileGender"'));assert(!row.includes('ownedProfileName'));
 assert.equal((dialog.match(/id="ownedProfileName"/g)||[]).length,1);assert.equal((dialog.match(/role="tab"/g)||[]).length,2);
 assert(html.includes('id="renameInput" maxlength="12"')); // Do not change existing name constraints as part of header placement.
});
