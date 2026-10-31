/* Approved display changes only; source data and stored quest IDs remain intact. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GanghoDisplay=api;})(globalThis,function(){
  const schools=['천도문','영월궁','소림사','태을교','창랑문','검왕각','극락곡'];
  const hiddenIds=new Set(['1.17-q05',...['01','02','03','04','05','06','08','09','10','11','12'].map(n=>'draft-journal-quiz-'+n)]);
  const titles={
    '1.13-q06':'강호잡담·청화-화령비문',
    'draft-journal-miwen02':'강호잡담·중추-막고굴 불감의 비밀',
    'draft-journal-miwen03':'강호잡담·중동-새외전투·나릉의 유골',
    'draft-journal-ouyang':'강호잡담·임종-구양이삼의 차',
    'draft-journal-sb':'강호잡담·상백-보리 염주',
    'draft-minor-1133':'복희도법 진급',
    'draft-minor-1134':'복희도 승련-무기 강화',
    '1.5-q05':'노목공의 연구-병형 인형','1.5-q05-eul':'노목공의 연구-을형 인형',
    '1.13-q01':'비기 획득-귀원검의','1.13-q08':'진파 검법-오옥 검법',
    '1.13-q09':'상승 도법-복희도법','1.13-q11':'진파내공-청아공','1.23-q04':'진파권법-취몽신권',
    'draft-minor-1289':'공절곡 해금-광인의 대결',
    'draft-minor-1291':'공절곡의 지하 궁전-현음장 정진',
    'draft-minor-1470':'소녀 로잔-마르 부족 해금'
  };
  const shortNames={'소림사':'소림','천도문':'천도','영월궁':'영월','창랑문':'창랑','극락곡':'극락'};
  function title(q){
    let text=titles[q.id]||q.title;
    if(q.browseCategory==='강호문파'&&schools.includes(q.owner)){
      const prefix=shortNames[q.owner];
      if(prefix&&text.startsWith(prefix+'·'))text=text.slice(prefix.length+1);
      if(text.startsWith(q.owner+'·'))text=text.slice(q.owner.length+1);
      else if(text.startsWith(q.owner+' '))text=text.slice(q.owner.length+1);
      text=q.owner+'·'+text;
    }
    return text;
  }
  function prepare(data){
    const names=new Map(data.quests.map(q=>[q.id,title(q)]));
    const relation=r=>({...r,title:names.get(r.id)||r.title});
    return {...data,quests:data.quests.filter(q=>!hiddenIds.has(q.id)).map(q=>({...q,title:names.get(q.id),prerequisiteQuests:(q.prerequisiteQuests||[]).map(relation),followupQuests:(q.followupQuests||[]).map(relation),prerequisites:q.prerequisites.map(s=>s.replaceAll('복희도 진급','복희도법 진급'))}))};
  }
  return {schools,hiddenIds,title,prepare};
});
