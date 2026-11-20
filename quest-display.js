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
  // User-provided revised guide, 2026-11-01. Intermediate loot is not a common final reward.
  const updates={
    '1.22-q06':{
      materials:['[장작] × 10, [술] × 1(마유주·여아홍 제외, 막걸리 추천)','선택: [삽] × 1([귀를 가까이 댄다] 선택 후 숨겨진 술 발굴 시 필요)']
    },
    'draft-journal-miwen03':{
      regions:['기련산'],
      prerequisites:['잡담·중동의 해당 단서 열람','기련산에서 시작']
    },
    '1.21-q05':{
      recommendedLevel:'80레벨 이상',
      prerequisites:['주인공 80레벨 이상','주요임무 「형산풍파」 완료','주요임무 「의문 가득, 칠살 재현」 시작'],
      materials:['[치료약] × 1(구전환혼단 제외, 양옥랑 생존·봐주기 분기에서 사용)','[삽] × 1(양옥랑·고월추 처치 분기에서 매장 시 필요)','[은화] × 2냥(양옥랑 생존 분기의 공연 관람료, 이후 회수)'],
      finalRewards:[
        {type:'user-verified',choice:null,text:'선택지에 따라 상이'}
      ],
      followupNotes:[
        '주요임무 「화기천도, 욱수현위」까지 진행한 경우: [진실을 알린다] 선택 시 추후 주요임무에서 양옥랑·고월추가 적으로 재등장. [진실을 숨깁니다] 선택 시 두 사람이 서역으로 떠나 주요임무에 등장하지 않음.'
      ],
      verifiedAt:'2026-11-01'
    }
  };
  // Wording only: retain source strings, quantities, quest IDs and progression semantics.
  const conditionEdits={
    '남양도 주요 임무 완성, 등급≥20급':'남양도 주요임무 완료, 주인공 20레벨 이상',
    '레벨 ≥ 85, 주요임무 「헝산 활성화」 완료':'주인공 85레벨 이상, 주요임무 「헝산 활성화」 완료',
    '등급 70 이상':'주인공 70레벨 이상',
    '등급 50 이상':'주인공 50레벨 이상',
    '35등급 이상':'주인공 35레벨 이상',
    '70등급 이상':'주인공 70레벨 이상',
    '40등급에 시작 가능/ 임무 중 전투에서 넉넉히 이기려면 캐릭터 60등급이상 필요':'주인공 40레벨부터 시작 가능/ 임무 중 전투에서 넉넉히 이기려면 주인공 60레벨 이상 필요',
    '주요임무-연남연북 완료':'주요임무 「연남연북」 완료',
    '주요임무 천하도종·강호광인 완료':'주요임무 「천하도종·강호광인」 완료',
    '주요임무 탑림 보호막 완료':'주요임무 「탑림 보호막」 완료',
    '주요임무 협력 완료':'주요임무 「협력」 완료',
    '차선임무 독술 완료':'차선임무 「독술」 완료',
    '차선임무 기련산 보물·탕마창의 완료':'차선임무 「기련산 보물·탕마창의」 완료',
    '주요임무 천리추격·지옥무문 진행 중 해금':'주요임무 「천리추격·지옥무문」 진행 중 해금',
    '주요임무 "항주"까지 진행':'주요임무 「항주」까지 진행',
    '주요임무 단독행동에서 호식이 돕기 선택':'주요임무 「단독행동」에서 호식이 돕기 선택',
    '주요임무 축검산장 도달':'주요임무 「축검산장」 도달',
    '후반 8~10단계: 주요임무 비밀 탐색에서 양옥랑 격파 필요':'후반 8~10단계: 주요임무 「비밀 탐색」에서 양옥랑 격파 필요'
  };
  function condition(text){
    return (conditionEdits[text]||text)
      .replaceAll('복희도 진급','복희도법 진급')
      .replace(/주요 임무/g,'주요임무')
      .replace(/캐릭터 (\d+)등급\s*이상/g,'주인공 $1레벨 이상')
      .replace('시작은 50등급부터 가능','시작은 50레벨부터 가능')
      .replace(/주인공 레벨\s*≥\s*(\d+)/g,'주인공 $1레벨 이상')
      .replace('임무완료','임무 완료')
      .replace(/주요임무 \[([^\]]+)\]/g,'주요임무 「$1」')
      .replace(/주요임무를 \[([^\]]+)\]/g,'주요임무 「$1」')
      .replace('「천도엽주, 요승현장」(9장 마지막까지) 임무 완료','「천도엽주, 요승현장」(9장 마지막까지) 완료');
  }
  function level(text){
    // Do not convert martial-art levels such as 문황경 200등급.
    return text.replace(/^(\d+)등급/g,'$1레벨')
      .replace('주인공 50등급 이상','주인공 50레벨 이상')
      .replace(/(이기려면 |대략 |시작은 )(\d+)등급/g,'$1$2레벨');
  }
  const variableFinalRewards=new Set(['1.3-q01','1.5-q06','1.8-q08','1.10-q16','1.10-q21','1.14-q06','1.27-q06']);
  function rewardSummary(q){
    if(variableFinalRewards.has(q.id))return [{type:'user-verified',choice:null,text:'선택지에 따라 상이'}];
    return q.finalRewards.map(r=>({...r,text:r.text.replace(/^선택지에 따라 (?:최종보상 |보상 )?상이$/,'선택지에 따라 상이')}));
  }
  function materialRows(q){
    // Group simultaneous requirements without splitting commas inside explanations.
    // Western dancer's three rows each describe a different conditional use.
    if(q.materials.length<2||q.id==='1.21-q05'||q.id==='1.24-q04')return q.materials;
    const conditional=/^(선택 [12]:|선박 구매:|조선:|선택:|조건부:|남자주인공은 |약초제조 경로 선택 시 |후속 경로만:)/;
    const common=q.materials.filter(s=>!conditional.test(s)),separate=q.materials.filter(s=>conditional.test(s));
    return [...(common.length?[common.join(', ')]:[]),...separate];
  }
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
    return {...data,quests:data.quests.filter(q=>!hiddenIds.has(q.id)).map(original=>{const q={...original,...updates[original.id]};return {...q,title:names.get(q.id),recommendedLevel:level(q.recommendedLevel),prerequisiteQuests:(q.prerequisiteQuests||[]).map(relation),followupQuests:(q.followupQuests||[]).map(relation),prerequisites:q.prerequisites.map(condition),materials:materialRows(q),finalRewards:rewardSummary(q)}})};
  }
  return {schools,hiddenIds,title,prepare};
});
