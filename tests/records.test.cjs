const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('../records.js');
const legacy=()=>({active:2,recent:['낙양'],custom:{keep:true},profiles:[0,1,2].map((i)=>({id:`character-${i+1}`,name:`기존협객${i}`,done:['1.1-q01','unknown-id'],extra:'keep'}))});
function memory(value=null){return {raw:value,writes:0,getItem(){return this.raw;},setItem(k,v){this.writes++;if(this.fail)throw Error('quota');this.raw=v;}};}
test('load is read-only and preserves legacy completion, names, extra fields and selection',()=>{
 const original=JSON.stringify(legacy()),s=memory(original),store=R.open(s);
 assert.equal(s.writes,0);assert.equal(s.raw,original);assert.equal(store.model.active,2);
 assert.deepEqual(store.model.profiles[0].done,['1.1-q01','unknown-id']);assert.equal(store.model.profiles[0].extra,'keep');
 assert.equal(store.model.profiles[1].name,'기존협객1');assert.deepEqual(store.model.custom,{keep:true});
});
test('empty storage has no example completion and does not write on load',()=>{
 const s=memory(),store=R.open(s);assert.equal(s.writes,0);assert.equal(store.model.profiles.length,3);
 assert(store.model.profiles.every(p=>!p.done.length&&!p.doing.length&&!p.owned.length));
});
test('same cycle preserves all other existing/unknown completions and separates profiles',()=>{
 const s=memory(JSON.stringify(legacy())),store=R.open(s);
 for(const expected of ['doing','done','todo']){store.commit(m=>R.cycle(m.profiles[0],'new-id'));assert.equal(R.status(store.model.profiles[0],'new-id'),expected);}
 assert.deepEqual(store.model.profiles[0].done,['1.1-q01','unknown-id']);
 assert.equal(R.status(store.model.profiles[1],'new-id'),'todo');
 const reopened=R.open(s);assert.deepEqual(reopened.model,store.model);
});
test('an existing done record stays done until clicked, then cycles to todo',()=>{
 const store=R.open(memory(JSON.stringify(legacy())));assert.equal(R.status(store.model.profiles[0],'1.1-q01'),'done');
 store.commit(m=>R.cycle(m.profiles[0],'1.1-q01'));assert.equal(R.status(store.model.profiles[0],'1.1-q01'),'todo');
});
test('malformed or partial storage is never cleared or overwritten',()=>{
 for(const raw of ['{bad','null','{}',JSON.stringify({profiles:[{}]})]){
  const s=memory(raw),store=R.open(s);assert(store.blocked);assert.throws(()=>store.commit(()=>{}));assert.equal(s.raw,raw);assert.equal(s.writes,0);
 }
});
test('storage read errors block writes',()=>{
 const store=R.open({getItem(){throw Error('denied');},setItem(){throw Error('must not write');}});assert(store.blocked);assert.throws(()=>store.commit(()=>{}));
});
test('quota failure rolls back model and leaves raw original',()=>{
 const s=memory(JSON.stringify(legacy())),store=R.open(s),before=JSON.stringify(store.model);s.fail=true;
 assert.throws(()=>store.commit(m=>R.cycle(m.profiles[0],'new')));assert.equal(JSON.stringify(store.model),before);assert.equal(s.raw,JSON.stringify(legacy()));
});
test('concurrent external change is not overwritten',()=>{
 const s=memory(JSON.stringify(legacy())),store=R.open(s);s.raw='changed elsewhere';assert.throws(()=>store.commit(m=>R.cycle(m.profiles[0],'new')));assert.equal(s.raw,'changed elsewhere');
});
test('new backup roundtrip preserves progress, ownership, unknown IDs and active selection',()=>{
 const store=R.open(memory(JSON.stringify(legacy())));store.commit(m=>{R.cycle(m.profiles[0],'new');m.profiles[0].owned=['도연일'];});
 const backup=store.backup(),other=R.open(memory());other.importBackup(backup);
 assert.deepEqual(other.model.profiles,store.model.profiles);assert.equal(other.model.active,store.model.active);
 assert.deepEqual(other.model.custom,store.model.custom);
});
test('version1 backup loads without filtering absent IDs or slicing names',()=>{
 const value=legacy();value.profiles[0].name='아주아주긴기존캐릭터이름도보존';const store=R.open(memory());store.importBackup({app:'강호수첩',version:1,profiles:value.profiles});
 assert.equal(store.model.profiles[0].name,value.profiles[0].name);assert(store.model.profiles[0].done.includes('unknown-id'));
});
test('bad backup import is transactional and future schemas are protected',()=>{
 const s=memory(JSON.stringify(legacy())),store=R.open(s),before=s.raw;
 for(const data of [{profiles:[]},{profiles:[{}, {}, {}]}, {...legacy(),recordVersion:999},{...legacy(),app:'other'}])assert.throws(()=>store.importBackup(data));
 assert.equal(s.raw,before);assert.equal(s.writes,0);
});
