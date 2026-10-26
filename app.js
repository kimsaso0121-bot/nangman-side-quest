const KEY="gangho-notebook-v1",NAMES=["첫째 협객","둘째 협객","셋째 협객"],$=s=>document.querySelector(s),esc=(v="")=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const DIFFICULTY_EXTRA={
  "1.3-q13":{powers:[50]},"1.3-q15":{powers:[78]},"1.4-q05":{powers:[60]},"1.4-q13":{levels:[70]},
  "1.5-q07":{powers:[41]},"1.6-q09":{levels:[60]},"1.7-q04":{powers:[68]},"1.8-q13":{powers:[74]},
  "1.10-q07":{levels:[40]},"1.10-q15":{powers:[37]},"1.11-q07":{powers:[40]},"1.11-q08":{powers:[70]},
  "1.13-q11":{powers:[70]},"1.13-q14":{powers:[60]},"1.14-q04":{levels:[50]},"1.14-q06":{powers:[60]},
  "1.14-q07":{levels:[70]},"1.14-q08":{powers:[78]},"1.18-q02":{powers:[30]},"1.19-q04":{powers:[45]},
  "1.21-q04":{powers:[47]},"1.22-q05":{powers:[40]},"1.26-q02":{powers:[72]},"1.27-q02":{levels:[90],powers:[60]},
  "1.27-q05":{powers:[20]},"1.28-q01":{powers:[50]},"1.29-q01":{levels:[80]},"1.30-q01":{powers:[25]}
};
const migrateDone=items=>[...new Set((Array.isArray(items)?items:[]).map(id=>id==="1.10-q19"?"1.10-q10":id))];
const state={data:null,profiles:NAMES.map((name,i)=>({id:`character-${i+1}`,name,done:[]})),active:0,region:"전체 지역",difficulty:"all",recent:[],status:"all",query:"",selected:null};
const recordStore=GanghoRecords.open({getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)});
function syncRecords(){Object.assign(state,recordStore.model)}
syncRecords();
state.scope={kind:'all'};state.ownedOnly=false;
function save(){try{recordStore.commit(m=>Object.assign(m,{profiles:state.profiles,active:state.active,recent:state.recent}));syncRecords();return true}catch(e){syncRecords();alert(e.message);return false}}
if(recordStore.blocked)queueMicrotask(()=>alert(recordStore.error));
const profile=()=>state.profiles[state.active],done=()=>new Set(profile().done),quest=id=>state.data.quests.find(q=>q.id===id);
const status=id=>GanghoRecords.status(profile(),id),marks={todo:'',doing:'−',done:'✓'},labels={todo:'미완',doing:'진행중',done:'완료'};
const checked=s=>s==='doing'?'mixed':String(s==='done');
const noInfo=x=>/^(정보 없음|등급 정보 없음|보상 정보 없음)$/.test(x);
const list=(a,e="없음")=>!a?.length?`<p class="none">${esc(e)}</p>`:a.length===1&&(a[0]==='없음'||noInfo(a[0]))?`<p class="none">${noInfo(a[0])?'정보 없음':'없음'}</p>`:`<ul>${a.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`,rewards=a=>a?.length?`<ul>${a.map(x=>`<li>${x.choice?`<strong>${esc(x.choice)}</strong> `:""}${esc(x.text)}</li>`).join("")}</ul>`:`<p class="none">없음</p>`;
const powerBand=n=>n>=70?70:Math.floor(n/10)*10;
function difficultyTags(q){const tags=[],text=q.recommendedLevel||"",extra=DIFFICULTY_EXTRA[q.id]||{};if(/전투력|전력/.test(text)){const m=text.match(/(\d+)\s*(?:만|W)/i);if(m)tags.push(`power:${powerBand(+m[1])}`)}else{const m=text.match(/(\d+)\s*(?:등급|레벨)/);if(m)tags.push(`level:${+m[1]}`)}for(const n of extra.levels||[])tags.push(`level:${n}`);for(const n of extra.powers||[])tags.push(`power:${powerBand(n)}`);return[...new Set(tags)]}
const normalizeSearch=value=>String(value??'').normalize('NFC').toLowerCase().replace(/\s+/g,'');
function searchRank(q,t){const title=normalizeSearch(q.title);if(title===t)return 0;if(title.startsWith(t))return 1;if(title.includes(t))return 2;const names=(q.officialNames||[]).map(normalizeSearch);if(names.includes(t))return 3;if(names.some(s=>s.includes(t)))return 4;return 5}
function filtered(){if(!state.data)return[];const t=normalizeSearch(state.query);const matches=state.data.quests.filter(q=>GanghoBrowse.matches(q,state.scope)&&GanghoBrowse.ownedVisible(q,state.ownedOnly,profile().owned)&&(state.difficulty==="all"||difficultyTags(q).includes(state.difficulty))&&(state.status==="all"||state.status===status(q.id))&&(!t||normalizeSearch([q.title,...q.regions,q.owner,...q.officialNames,q.recommendedLevel,...q.prerequisites,...q.materials,...q.finalRewards.map(x=>x.text)].join(' ')).includes(t)));return t?matches.map((q,i)=>({q,i,rank:searchRank(q,t)})).sort((a,b)=>a.rank-b.rank||a.i-b.i).map(x=>x.q):matches}
function profiles(){$("#profileTabs").innerHTML=state.profiles.map((p,i)=>`<button class="${i===state.active?"active":""}" data-profile="${i}"><i>${i+1}</i>${esc(p.name)}</button>`).join("")}
function filters(){$("#difficultySelect").value=state.difficulty;$("#ownerLine").hidden=!(state.scope.value==='동료임무'||state.scope.category==='동료임무');$("#ownedOnly").checked=state.ownedOnly}
function progress(){const n=profile().done.filter(quest).length,t=state.data.quests.length,p=Math.round(n/t*100);$("#doneCount").textContent=n;$("#totalCount").textContent=t;$("#doingCount").textContent=profile().doing.filter(quest).length;$("#progressPercent").textContent=`${p}%`;$("#progressBar").style.width=`${p}%`}
function rows(){const qs=filtered(),d=done(),limit=matchMedia("(max-width:820px)").matches?12:7;$("#questList").innerHTML=qs.map(q=>{const c=d.has(q.id),s=status(q.id),chars=[...q.title],title=chars.length>limit?`${chars.slice(0,limit).join("")}…`:q.title;return`<article class="quest ${c?"completed":s==="doing"?"doing":""} ${q.id===state.selected?"selected":""}" data-id="${q.id}"><button class="check" data-check="${q.id}" role="checkbox" aria-checked="${checked(s)}" aria-label="${esc(q.title)}: ${labels[s]}, 누르면 다음 상태">${marks[s]}</button><div><strong title="${esc(q.title)}">${esc(title)}</strong></div><span>${esc(q.recommendedLevel)}</span><span>${esc(q.materials.length?q.materials.join(", "):"없음")}</span><b>${labels[s]}</b></article>`}).join("");$("#emptyState").hidden=!!qs.length;updateResult()}
function updateResult(){const active=state.scope.kind!=='all'||state.difficulty!=='all'||state.status!=='all'||!!state.query.trim()||state.ownedOnly;$("#resultCount").hidden=!active;$("#resultCount").textContent=active?"검색 결과 "+filtered().length+"개":""}
function detail(){const q=quest(state.selected);if(!q)return;const s=status(q.id),follow=[...q.followupQuests.map(x=>`${x.region?x.region+' · ':''}${x.title}`),...q.followupNotes],prior=(q.prerequisiteQuests||[]).map(x=>`${x.title}${({progress:' (진행 조건)',reference:' (참고)',conflict:' (진행 중 충돌)'})[x.relation]||''}`);$("#questDetail").innerHTML=`<span class="detail-corner corner-tl" aria-hidden="true"></span><span class="detail-corner corner-tr" aria-hidden="true"></span><span class="detail-corner corner-bl" aria-hidden="true"></span><span class="detail-corner corner-br" aria-hidden="true"></span><header>${q.officialNames?.some(x=>!x.startsWith('※'))?`<p>공식 임무명 : ${esc(q.officialNames.filter(x=>!x.startsWith('※')).join(', '))}</p>`:''}<h2>${esc(q.title)}</h2><button class="${s==='done'?'completed':s==='doing'?'doing':''}" data-detail-check="${q.id}" role="checkbox" aria-checked="${checked(s)}" aria-label="${labels[s]}, 누르면 다음 상태"><i>${marks[s]}</i>${s==='done'?'완료한 임무':s==='doing'?'진행중 임무':'미완료 임무'}</button></header><div class="detail-body"><section><h3>◆ 추천 등급</h3>${(/^(등급 정보 없음|정보 없음|없음)?$/.test(q.recommendedLevel||'')?'<p class="none">정보 없음</p>':list([q.recommendedLevel]))}</section><section><h3>◆ 전제조건</h3>${list(q.prerequisites)}</section><section><h3>◆ 선행임무</h3>${list(prior)}</section><section><h3>◆ 준비물</h3>${list(q.materials)}</section><section><h3>◆ 최종보상</h3>${q.finalRewards.length?rewards(q.finalRewards):'<p class="none">없음</p>'}</section><section><h3>◆ 후속 정보</h3>${list(follow)}</section>${q.sourceUrl?`<a href="${esc(q.sourceUrl)}" target="_blank" rel="noopener noreferrer">나무위키에서 자세히 보기 <span>↗</span></a>`:'<p class="linkless">공략 링크 없음</p>'}</div>`}
const render=()=>{profiles();filters();progress();rows();detail()},toggle=id=>{GanghoRecords.cycle(profile(),id);save();progress();rows();detail()};
$("#profileTabs").onclick=e=>{const b=e.target.closest("[data-profile]");if(b){state.active=+b.dataset.profile;save();render()}};
$("#renameButton").onclick=()=>{$("#renameInput").value=profile().name;$("#renameDialog").showModal();requestAnimationFrame(()=>$("#renameInput").select())};
$("#renameClose").onclick=$("#renameCancel").onclick=()=>$("#renameDialog").close();
$("#renameForm").onsubmit=e=>{e.preventDefault();profile().name=$("#renameInput").value.trim().slice(0,12)||NAMES[state.active];save();profiles();$("#renameDialog").close()};
$("#difficultySelect").onchange=e=>{state.difficulty=e.target.value;rows();rememberViewFilters()};$("#searchInput").oninput=e=>{state.query=e.target.value;rows();rememberViewFilters();if(matchMedia("(max-width:820px)").matches&&document.body.classList.contains('detail-open'))returnToList()};$("#statusTabs").onclick=e=>{const b=e.target.closest("[data-status]");if(b){state.status=b.dataset.status;[...$("#statusTabs").children].forEach(x=>x.classList.toggle("active",x===b));rows();rememberViewFilters()}};
// View history only: never writes quest completion, profiles, or browser storage.
let detailBackPending=false;
function captureViewFilters(){return{query:state.query,scope:state.scope,difficulty:state.difficulty,status:state.status,ownedOnly:state.ownedOnly}}
function rememberViewFilters(){const view=history.state?.ganghoView;if(view)history.replaceState({...history.state,ganghoView:{...view,filters:captureViewFilters()}},'',location.href)}
function syncViewControls(){$('#searchInput').value=state.query;$('#browseLabel').textContent=state.scope.kind==='all'?'전체 임무':state.scope.value;filters();[...$('#statusTabs').children].forEach(b=>b.classList.toggle('active',b.dataset.status===state.status))}
function showQuest(id){if(!state.data||!quest(id))return;const mobile=matchMedia('(max-width:820px)').matches;if(mobile){const previous=history.state?.ganghoView;const position=previous?.kind==='detail'?previous:{listScroll:$('#questList').scrollTop,pageScroll:scrollY};if(previous?.kind!=='detail')history.replaceState({...history.state,ganghoView:{kind:'list',...position,filters:captureViewFilters()}},'',location.href);const entry={...history.state,ganghoView:{...position,kind:'detail',id,filters:captureViewFilters()}};if(previous?.kind==='detail')history.replaceState(entry,'',location.href);else history.pushState(entry,'',location.href)}state.selected=id;rows();detail();document.body.classList.toggle('detail-open',mobile)}
function returnToList(){if(detailBackPending)return;if(history.state?.ganghoView?.kind==='detail'){detailBackPending=true;history.back()}else document.body.classList.remove('detail-open')}
function restoreViewHistory(restoreFilters=false){detailBackPending=false;const view=history.state?.ganghoView;if(!state.data)return;if(restoreFilters===true&&view?.filters){const f=view.filters;if(typeof f.query==='string')state.query=f.query;if(f.scope&&typeof f.scope.kind==='string')state.scope=f.scope;if(typeof f.difficulty==='string')state.difficulty=f.difficulty;if(['all','todo','doing','done'].includes(f.status))state.status=f.status;state.ownedOnly=f.ownedOnly===true;rows()}if(view?.kind==='detail'&&quest(view.id)){state.selected=view.id;rows();detail();document.body.classList.toggle('detail-open',matchMedia('(max-width:820px)').matches)}else{document.body.classList.remove('detail-open');if(view?.kind==='list')requestAnimationFrame(()=>{$('#questList').scrollTop=view.listScroll||0;scrollTo(0,view.pageScroll||0)})}rememberViewFilters();requestAnimationFrame(()=>syncViewControls())}
addEventListener('popstate',()=>restoreViewHistory());
addEventListener('pageshow',()=>{if(state.data)requestAnimationFrame(()=>syncViewControls())});
const confirmSource=url=>{$("#sourceConfirm").href=url;$("#sourceDialog").showModal()};
$("#questList").onclick=e=>{const c=e.target.closest("[data-check]");if(c){e.stopPropagation();toggle(c.dataset.check);return}const r=e.target.closest("[data-id]");if(r)showQuest(r.dataset.id)};$("#questDetail").onclick=e=>{const b=e.target.closest("[data-detail-check]");if(b){toggle(b.dataset.detailCheck);return}const a=e.target.closest('a[href*="namu.wiki"]');if(a){e.preventDefault();confirmSource(a.href)}};$("#mobileBack").onclick=returnToList;
$("#helpButton").onclick=()=>$("#helpDialog").showModal();$("#sourceButton").onclick=e=>{e.preventDefault();confirmSource(e.currentTarget.href)};$("#sourceConfirm").onclick=()=>$("#sourceDialog").close();
$("#backupButton").onclick=()=>$("#backupDialog").showModal();
$("#exportButton").onclick=()=>{try{const b=new Blob([JSON.stringify(recordStore.backup(),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="강호수첩-기록.json";a.click();URL.revokeObjectURL(a.href)}catch(e){alert(e.message)}};
$("#importInput").onchange=async e=>{try{const file=e.target.files[0];if(!file)return;recordStore.importBackup(JSON.parse(await file.text()));syncRecords();render();alert("기록을 불러왔습니다.");$("#backupDialog").close()}catch(error){alert("기록을 변경하지 않았습니다. "+error.message)}finally{e.target.value=''}};
$("#resetButton").onclick=()=>{if(confirm(`${profile().name}의 기록을 모두 지울까요?`)){profile().done=[];profile().doing=[];save();render();$("#backupDialog").close()}};
async function loadQuestData(){
  const version=Date.now();
  try{
    const manifestResponse=await fetch(`./data/manifest.json?v=${version}`,{cache:"no-store"});
    if(!manifestResponse.ok)throw new Error(manifestResponse.status);
    const manifest=await manifestResponse.json();
    const chunks=await Promise.all(manifest.chunks.map(async file=>{
      const response=await fetch(`./data/${file}?v=${version}`,{cache:"no-store"});
      if(!response.ok)throw new Error(response.status);
      return response.json();
    }));
    const quests=chunks.flat();
    if(quests.length!==manifest.questCount)throw new Error("quest-count-mismatch");
    return{schemaVersion:manifest.schemaVersion,quests,companions:manifest.companions};
  }catch{
    const response=await fetch(`./quests-core.json?v=${version}`,{cache:"no-store"});
    if(!response.ok)throw new Error(response.status);
    return response.json();
  }
}
loadQuestData().then(d=>{state.data=d;state.selected=d.quests[0].id;restoreViewHistory(true);render()}).catch(()=>document.body.innerHTML="<main><h1>데이터를 불러오지 못했습니다.</h1></main>");
addEventListener("resize",()=>{if(state.data)rows()});

