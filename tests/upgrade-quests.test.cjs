const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const raw=JSON.parse(fs.readFileSync('quests-core.json','utf8')),D=require('../quest-display.js'),B=require('../browse.js'),R=require('../records.js'),data=D.prepare(raw);
const ids=['sect-1624','sect-1625','sect-1721'],get=id=>data.quests.find(q=>q.id===id);
test('three agreed upgrades append unique checks without changing any of the 392 existing records',()=>{
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(raw.quests.slice(0,392))).digest('hex'),'8295d41fe7f9adef9069c3f6eec64f2c92ec68a4526182ed02cb35f04d89b8b5');
 assert.deepEqual(raw.quests.slice(392,395).map(q=>q.id),ids);
 assert.deepEqual(ids.map(id=>get(id).officialNames),[['무기 승련'],['의천검'],['천랑북가 승련']]);
 for(const id of ids){const q=get(id);assert.equal(q.browseCategory,'강호문파');assert.equal(q.sourceUrl,null);assert(q.title.startsWith(q.owner+'·'));}
});
test('weapon upgrade is one check for two weapons; material totals and acquired-item exclusions are preserved',()=>{
 assert.deepEqual(get('sect-1624').materials,['[곤오석] × 200, [연금니] × 20, [신수천정] × 4, [진기] × 2,000']);
 assert(get('sect-1624').prerequisites.some(s=>s.includes('잔월장갑')));assert(!JSON.stringify(get('sect-1624')).includes('잔월장투'));
 assert.deepEqual(get('sect-1625').materials,['[곤오석] × 100, [연금니] × 10, [진기] × 1,750']);
 assert.deepEqual(get('sect-1721').materials,['[곤오석] × 90, [창랑 공헌] × 14,000']);
 assert.equal(get('sect-1721').recommendedLevel,'등급 정보 없음');
 assert.equal(get('sect-1721').finalRewards[0].text,'[천랑북가] 100레벨 승련');
 assert(fs.readFileSync('index.html','utf8').includes('<option value="level:100">100레벨</option>'));
});
test('school selection changes the target by two Lingyue checks or one Canglang check without completing them',()=>{
 const p={owned:[],schools:[],done:[],doing:[]},old=data.quests.filter(q=>!ids.includes(q.id));
 assert.equal(B.progressFor(data.quests,p).total,B.progressFor(old,p).total);
 for(const [school,n] of [['영월궁',2],['창랑문',1]]){p.schools=[school];assert.equal(B.progressFor(data.quests,p).total-B.progressFor(old,p).total,n);}
 const model=R.empty();model.profiles[0].done=['draft-sect-1620','draft-sect-1720'];const normalized=R.normalize(model);
 assert.deepEqual(normalized.profiles[0].done,model.profiles[0].done);assert(ids.every(id=>!normalized.profiles[0].done.includes(id)));
});
