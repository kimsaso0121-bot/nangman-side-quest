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
    'draft-sect-1670':{
      prerequisites:['차선임무 「천강검지결」 완료','천강검지결 10중 달성','차선임무 「인뇌입소」 완료','장백산 유수의 정련 기능 활성화'],
      followupNotes:['신소 승련 후에는 판매·분해·버리기가 불가능합니다.']
    },
    'draft-sect-1671':{
      prerequisites:['장백산 유수의 정련 기능 활성화','태을교 소속(임무 시작·첫 재주조 대화 시)'],
      followupNotes:[]
    },
    'draft-minor-1020':{
      prerequisites:['차선임무 「심음류도술」 완료','주인공 100레벨 이상','설주 보유','낮 시간(게임 시간 5~18시)에 시작']
    },
    'quest-1306':{
      prerequisites:['차선임무 「뇌봉탑」 완료','절경 돌파 완료(잔신파지법·형 완료)','[화개] 획득 이력']
    },
    '1.22-q06':{
      materials:['[장작] × 10, [술] × 1(마유주·여아홍 제외, 막걸리 추천)','선택: [삽] × 1([귀를 가까이 댄다] 선택 후 숨겨진 술 발굴 시 필요)']
    },
    'draft-journal-miwen03':{
      regions:['기련산'],
      prerequisites:['잡담·중동의 해당 단서 열람'],
      finalRewards:[{type:'common',choice:null,text:'[영허단] × 3, [조화단] × 3, [비영단] × 1, [명성] × 1',sourceLineId:null}]
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
    '[용상반야공] 임무 완료, [용상반야공] 6중까지 수련':'차선임무 「용상반야공」 완료, [용상반야공] 6중까지 수련',
    '[기연 임무-진기 찾기] 임무 완료':'차선임무 「기우 임무-진기 찾기」 완료',
    '[기연 임무-진기 찾기] 임무 완료, 진무양의 호감도≥80':'차선임무 「기우 임무-진기 찾기」 완료, 진무양의 호감도≥80',
    '천도문 진파 학습 임무 완료':'차선임무 「천도삼식-진파 학습」 완료',
    '신소 임무 완료 및 신소 교환':'차선임무 「신소」 완료 및 신소 교환',
    '천강검지결 임무 완료':'차선임무 「천강검지결」 완료',
    '인뇌입소 임무 완료':'차선임무 「인뇌입소」 완료',
    '심음류도술 임무 완료':'차선임무 「심음류도술」 완료',
    '대소사 공헌 25,000 이상(단계 명칭 확인 필요)':'대소사 「간담상조」 달성(공헌 25,000 이상)',
    '진행 중: 영월검법·월녀검법·의천검결·무상검결 중 하나 활성화':'의천검 강화 시: 영월검법·월녀검법·의천검결·무상검결 중 하나 활성화',
    '진행 중: 주인공 80레벨 이상·낮 시간에 진행하는 단계가 있음':'하방가 사건 개방 시: 주인공 80레벨 이상·낮 시간',
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
    return books((conditionEdits[text]||text)
      .replaceAll('복희도 진급','복희도법 진급')
      .replace(/주요 임무/g,'주요임무')
      .replace(/캐릭터 (\d+)등급\s*이상/g,'주인공 $1레벨 이상')
      .replace('시작은 50등급부터 가능','시작은 50레벨부터 가능')
      .replace(/주인공 레벨\s*≥\s*(\d+)/g,'주인공 $1레벨 이상')
      .replace('임무완료','임무 완료')
      .replace(/주요임무 \[([^\]]+)\]/g,'주요임무 「$1」')
      .replace(/주요임무를 \[([^\]]+)\]/g,'주요임무 「$1」')
      .replace('「천도엽주, 요승현장」(9장 마지막까지) 임무 완료','「천도엽주, 요승현장」(9장 마지막까지) 완료'));
  }
  function level(text){
    // Do not convert martial-art levels such as 문황경 200등급.
    return text.replace(/^(\d+)등급/g,'$1레벨')
      .replace('주인공 50등급 이상','주인공 50레벨 이상')
      .replace(/(이기려면 |대략 |시작은 )(\d+)등급/g,'$1$2레벨');
  }
  const variableFinalRewards=new Set(['1.3-q01','1.5-q06','1.8-q08','1.10-q16','1.10-q21','1.14-q06','1.27-q06']);
  // Display-only quantity formatting. Explicit names avoid treating skill ranks,
  // quest numbers, equipment levels and prices inside prose as item quantities.
  const quantityNames=['은화','은자','동전','명성','열력','진기','공덕','공헌','문파공헌','목재','호편주','문방사보','청금석','해몽탕','불붙이개','양초','양가죽','사담','황정','홍경천','삽','뼈','호골','녹용','인삼','은월만도','흑황우','기관 자물쇠','웅황','우황','금은화','흑단 염주 도면','비취옥패','음양화','호혈','녹혈','설은','자금','운문현정','자연석','비결 잔본','화양단','한월령','검남소춘','얼음잠사','월광석','한사옥죽','청휘한영경','잠사','오루','목련꽃','자정향','호피','탕후루','짐승덫','뇌공등','백작','단전진기','백용갑','항요전','비영단','지네','독사샘','전갈꼬리','운철','천년한철','곤오석','연금니','신목보갑','칠성암','흑옥정','한목심','체력','초혼단','한옥주','지황','흰도토리','세수단','무상단','곤륜석','연금흙','흑철갑','나무통','지혈산','불향','도술 주석','경공 주석','권각 주석','보리 염주','탕마창결','내공 주석'];
  quantityNames.push('영허단','조화단','대력환','벽령단','영지','적동','흑철','용골초','백삼','소주','당귀','유리병','감초','하수오','구전환혼단','칠성가물치','도객 수기','흑초금미','경험','경험치','윤지전','풍지전','극지전','길도','암철','염석','천원락','한석검보','소자질단','서호 용정');
  const amount='\\d[\\d,]*(?:[~～]\\d[\\d,]*)?(?:냥(?:\\s*\\d[\\d,]*푼)?|푼|개|마리|점)?';
  const namedQuantity=new RegExp('(^|[\\s,·:(])('+quantityNames.sort((a,b)=>b.length-a.length).join('|')+')\\s+(?:[xｘ×]\\s*)?('+amount+')(?=$|[\\s,·/()])','g');
  const bracketQuantity=new RegExp('(\\[[^\\]]+\\]|「[^」]+」)\\s*(?:[xｘ×]\\s*)?('+amount+')(?=$|[\\s,·/()])','g');
  const bookNames=['식진록','문황경 초본','문황경 잔본','장생결 파손된 잔편','장생결 잔편','태허도결 잔편','인괴 잔편','인괴잔편','영월 비결 잔본','청연보법 비결 잔본','비결 잔본','검술 주석','내공 주석','도술 주석','경공 주석','권각 주석','도객 수기','조각 상세내용','탕마창결','어초문답','서호잡영'];
  bookNames.push('강호 견문록','나비독경','도덕경','무하곤보','묵경·초편','문황경 비본','백화창보','복희도보','분뢰도보','약왕경 상권','열양장보','음양진법록','철사장경','호월장경','한석검보');
  const bookPattern=new RegExp('(?<![가-힣A-Za-z])(?:\\[|「)?('+bookNames.sort((a,b)=>b.length-a.length).join('|')+')(?:\\]|」)?','g');
  function books(text){return text.replace(bookPattern,'「$1」').replaceAll('「불붙이개」','[불붙이개]');}
  function quantity(text){
    return books(text.replace(bracketQuantity,(_,name,n)=>'['+name.slice(1,-1)+'] × '+n)
      .replace(namedQuantity,(_,prefix,name,n)=>prefix+'['+name+'] × '+n));
  }
  const rewardSeparator=new RegExp('('+amount+')\\s*·\\s*(?=[\\[「])','g');
  function rewardText(text){return quantity(text).replace(rewardSeparator,'$1, ');}
  function rewardSummary(q){
    if(variableFinalRewards.has(q.id))return [{type:'user-verified',choice:null,text:'선택지에 따라 상이'}];
    return q.finalRewards.map(r=>({...r,text:rewardText(r.text.replace(/^선택지에 따라 (?:최종보상 |보상 )?상이$/,'선택지에 따라 상이'))}));
  }
  function materialRows(q){
    // Group simultaneous requirements without splitting commas inside explanations.
    // Western dancer's three rows each describe a different conditional use.
    if(q.materials.length<2||q.id==='1.21-q05'||q.id==='1.24-q04')return q.materials.map(quantity);
    const conditional=/^(선택 [12]:|선박 구매:|조선:|선택:|조건부:|남자주인공은 |약초제조 경로 선택 시 |후속 경로만:)/;
    const common=q.materials.filter(s=>!conditional.test(s)),separate=q.materials.filter(s=>conditional.test(s));
    return [...(common.length?[common.join(', ')]:[]),...separate].map(quantity);
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
    return {...data,quests:data.quests.filter(q=>!hiddenIds.has(q.id)).map(original=>{const q={...original,...updates[original.id]};return {...q,title:names.get(q.id),recommendedLevel:level(q.recommendedLevel),prerequisiteQuests:(q.prerequisiteQuests||[]).map(relation),followupQuests:(q.followupQuests||[]).filter(r=>!hiddenIds.has(r.id)).map(relation),followupNotes:(q.followupNotes||[]).map(books),prerequisites:[...new Set(q.prerequisites.map(condition))],materials:materialRows(q),finalRewards:rewardSummary(q)}})};
  }
  return {schools,hiddenIds,title,prepare,quantity,rewardText,books};
});
