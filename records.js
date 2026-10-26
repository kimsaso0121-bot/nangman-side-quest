/* Additive v1-compatible records. No write on load, no automatic reset or ID pruning. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GanghoRecords=api;})(globalThis,function(){
  const KEY='gangho-notebook-v1',NAMES=['첫째 협객','둘째 협객','셋째 협객'];
  const clone=x=>JSON.parse(JSON.stringify(x));
  const empty=()=>({recordVersion:2,active:0,recent:[],profiles:NAMES.map((name,i)=>({id:`character-${i+1}`,name,done:[],doing:[],owned:[]}))});
  function ids(value,optional=false){
    if(value===undefined&&optional)return [];
    if(!Array.isArray(value)||!value.every(x=>typeof x==='string'))throw Error('기록 목록 형식이 올바르지 않습니다.');
    return [...new Set(value)];
  }
  function normalize(value){
    if(!value||typeof value!=='object'||Array.isArray(value)||value.profiles?.length!==3)throw Error('세 캐릭터 기록을 확인할 수 없습니다.');
    if(value.recordVersion!==undefined&&(!Number.isInteger(value.recordVersion)||value.recordVersion>2))throw Error('지원하지 않는 기록 버전입니다. 원본을 보존합니다.');
    if(value.version!==undefined&&![1,2].includes(value.version))throw Error('지원하지 않는 백업 버전입니다. 원본을 보존합니다.');
    if(value.app!==undefined&&value.app!=='강호수첩')throw Error('강호수첩 기록 파일이 아닙니다.');
    const result=clone(value);
    result.profiles=value.profiles.map((p,i)=>{
      if(!p||typeof p!=='object'||typeof p.name!=='string')throw Error('캐릭터 기록이 불완전합니다.');
      const done=ids(p.done);
      // Retain the historical alias itself as well as its existing canonical completion.
      if(done.includes('1.10-q19')&&!done.includes('1.10-q10'))done.push('1.10-q10');
      const doing=ids(p.doing,true).filter(id=>!done.includes(id)),owned=ids(p.owned,true);
      return {...clone(p),id:p.id||`character-${i+1}`,name:p.name,done,doing,owned,ownedOnly:p.ownedOnly!==false};
    });
    result.active=Number.isInteger(value.active)&&value.active>=0&&value.active<3?value.active:0;
    result.recordVersion=2;
    if(result.recent===undefined)result.recent=[];
    return result;
  }
  function status(p,id){return p.done.includes(id)?'done':p.doing.includes(id)?'doing':'todo';}
  function cycle(p,id){
    const next={todo:'doing',doing:'done',done:'todo'}[status(p,id)];
    p.done=p.done.filter(x=>x!==id);p.doing=p.doing.filter(x=>x!==id);
    if(next==='doing')p.doing.push(id);if(next==='done')p.done.push(id);
    return next;
  }
  function open(storage){
    let raw=null,model=empty(),blocked=false,error='';
    try{raw=storage.getItem(KEY);if(raw!==null)model=normalize(JSON.parse(raw));}
    catch(e){blocked=true;error='저장된 기록을 읽지 못해 변경을 중단했습니다. 원본은 지우지 않았습니다. '+e.message;}
    const store={get model(){return clone(model);},get blocked(){return blocked;},get error(){return error;},
      commit(update){
        if(blocked)throw Error(error);
        const next=clone(model);update(next);const validated=normalize(next),text=JSON.stringify(validated);
        if(storage.getItem(KEY)!==raw)throw Error('다른 창에서 기록이 변경됐습니다. 덮어쓰지 않았습니다. 새로고침해 주세요.');
        storage.setItem(KEY,text);raw=text;model=validated;return clone(model);
      },
      backup(){if(blocked)throw Error(error);return {...clone(model),app:'강호수첩',version:2};},
      importBackup(value){const validated=normalize(value);return store.commit(m=>Object.assign(m,validated));}
    };
    return store;
  }
  return {KEY,NAMES,empty,normalize,status,cycle,open};
});
