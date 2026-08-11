const KEY="gangho-notebook-v1",NAMES=["첫째 협객","둘째 협객","셋째 협객"],$=s=>document.querySelector(s),esc=(v="")=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const migrateDone=items=>[...new Set((Array.isArray(items)?items:[]).map(id=>id==="1.10-q19"?"1.10-q10":id))];
const state={data:null,profiles:NAMES.map((name,i)=>({id:`character-${i+1}`,name,done:[]})),active:0,region:"전체 지역",recent:[],status:"all",query:"",selected:null};
try{const s=JSON.parse(localStorage.getItem(KEY)||"null");if(s?.profiles){state.profiles=NAMES.map((n,i)=>({id:`character-${i+1}`,name:String(s.profiles[i]?.name||n).slice(0,12),done:migrateDone(s.profiles[i]?.done)}));state.active=Math.min(2,Math.max(0,+s.active||0));state.recent=Array.isArray(s.recent)?s.recent.slice(0,3):[]}}catch{localStorage.removeItem(KEY)}
const save=()=>localStorage.setItem(KEY,JSON.stringify({profiles:state.profiles,active:state.active,recent:state.recent})),profile=()=>state.profiles[state.active],done=()=>new Set(profile().done),quest=id=>state.data.quests.find(q=>q.id===id);
const list=(a,e="없음")=>a?.length?`<ul>${a.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:`<p class="none">${e}</p>`,rewards=a=>a?.length?`<ul>${a.map(x=>`<li>${x.choice?`<strong>${esc(x.choice)}</strong> `:""}${esc(x.text)}</li>`).join("")}</ul>`:`<p class="none">보상 정보 없음</p>`;
function filtered(){const d=done(),t=state.query.trim().toLowerCase();return state.data.quests.filter(q=>(state.region==="전체 지역"||q.region===state.region)&&(state.status==="all"||state.status==="done"===d.has(q.id))&&(!t||[q.title,q.region,q.recommendedLevel,...q.prerequisites,...q.materials,...q.finalRewards.map(x=>x.text)].join(" ").toLowerCase().includes(t)))}
function profiles(){$("#profileTabs").innerHTML=state.profiles.map((p,i)=>`<button class="${i===state.active?"active":""}" data-profile="${i}"><i>${i+1}</i>${esc(p.name)}</button>`).join("")}
function filters(){const rs=[...new Set(state.data.quests.map(q=>q.region))];$("#regionSelect").innerHTML=["전체 지역",...rs].map(r=>`<option ${r===state.region?"selected":""}>${esc(r)}</option>`).join("");$("#recentRegions").innerHTML=state.recent.map(r=>`<button data-region="${esc(r)}">${esc(r)}</button>`).join("")}
function progress(){const n=profile().done.filter(quest).length,t=state.data.quests.length,p=Math.round(n/t*100);$("#doneCount").textContent=n;$("#totalCount").textContent=t;$("#progressPercent").textContent=`${p}%`;$("#progressBar").style.width=`${p}%`}
function rows(){const qs=filtered(),d=done(),limit=matchMedia("(max-width:820px)").matches?12:7;$("#questList").innerHTML=qs.map(q=>{const c=d.has(q.id),chars=[...q.title],title=chars.length>limit?`${chars.slice(0,limit).join("")}…`:q.title;return`<article class="quest ${c?"completed":""} ${q.id===state.selected?"selected":""}" data-id="${q.id}"><button class="check" data-check="${q.id}">${c?"✓":""}</button><div><strong title="${esc(q.title)}">${esc(title)}</strong></div><span>${esc(q.region)}</span><span>${esc(q.recommendedLevel)}</span><span>${esc(q.materials.length?q.materials.join(", "):"없음")}</span><b>${c?"완료":"미완"}</b></article>`}).join("");$("#emptyState").hidden=!!qs.length}
function detail(){const q=quest(state.selected);if(!q)return;const c=done().has(q.id),follow=[...q.followupQuests.map(x=>`${x.region} · ${x.title}`),...q.followupNotes];$("#questDetail").innerHTML=`<span class="detail-corner corner-tl" aria-hidden="true"></span><span class="detail-corner corner-tr" aria-hidden="true"></span><span class="detail-corner corner-bl" aria-hidden="true"></span><span class="detail-corner corner-br" aria-hidden="true"></span><header><p>선택 임무 · ${esc(q.region)}</p><h2>${esc(q.title)}</h2><button class="${c?"completed":""}" data-detail-check="${q.id}"><i>${c?"✓":""}</i>${c?"완료한 임무":"완료로 표시"}</button></header><div class="detail-body"><section><h3>◆ 추천 등급</h3>${list(q.recommendedLevel.split("\n"))}</section><section><h3>◆ 선행조건</h3>${list(q.prerequisites)}</section><section><h3>◆ 준비물</h3>${list(q.materials)}</section><section><h3>◆ 최종보상</h3>${rewards(q.finalRewards)}</section><section><h3>◆ 후속 차선임무</h3>${list(follow)}</section><a href="${esc(q.sourceUrl)}" target="_blank">나무위키에서 자세히 보기 <span>↗</span></a></div>`}
const render=()=>{profiles();filters();progress();rows();detail()},toggle=id=>{const d=done();d.has(id)?d.delete(id):d.add(id);profile().done=[...d];save();progress();rows();detail()},choose=r=>{state.region=r;if(r!=="전체 지역"){state.recent=[r,...state.recent.filter(x=>x!==r)].slice(0,3);save()}filters();rows()};
$("#profileTabs").onclick=e=>{const b=e.target.closest("[data-profile]");if(b){state.active=+b.dataset.profile;save();render()}};
$("#renameButton").onclick=()=>{$("#renameInput").value=profile().name;$("#renameDialog").showModal();requestAnimationFrame(()=>$("#renameInput").select())};
$("#renameClose").onclick=$("#renameCancel").onclick=()=>$("#renameDialog").close();
$("#renameForm").onsubmit=e=>{e.preventDefault();profile().name=$("#renameInput").value.trim().slice(0,12)||NAMES[state.active];save();profiles();$("#renameDialog").close()};
$("#regionSelect").onchange=e=>choose(e.target.value);$("#recentRegions").onclick=e=>{const b=e.target.closest("[data-region]");if(b)choose(b.dataset.region)};$("#searchInput").oninput=e=>{state.query=e.target.value;rows()};$("#statusTabs").onclick=e=>{const b=e.target.closest("[data-status]");if(b){state.status=b.dataset.status;[...$("#statusTabs").children].forEach(x=>x.classList.toggle("active",x===b));rows()}};
const confirmSource=url=>{$("#sourceConfirm").href=url;$("#sourceDialog").showModal()};
$("#questList").onclick=e=>{const c=e.target.closest("[data-check]");if(c){e.stopPropagation();toggle(c.dataset.check);return}const r=e.target.closest("[data-id]");if(r){state.selected=r.dataset.id;rows();detail();if(matchMedia("(max-width:820px)").matches)document.body.classList.add("detail-open")}};$("#questDetail").onclick=e=>{const b=e.target.closest("[data-detail-check]");if(b){toggle(b.dataset.detailCheck);return}const a=e.target.closest('a[href*="namu.wiki"]');if(a){e.preventDefault();confirmSource(a.href)}};$("#mobileBack").onclick=()=>document.body.classList.remove("detail-open");
$("#helpButton").onclick=()=>$("#helpDialog").showModal();$("#sourceButton").onclick=e=>{e.preventDefault();confirmSource(e.currentTarget.href)};$("#sourceConfirm").onclick=()=>$("#sourceDialog").close();
$("#backupButton").onclick=()=>$("#backupDialog").showModal();$("#exportButton").onclick=()=>{const b=new Blob([JSON.stringify({app:"강호수첩",version:1,profiles:state.profiles},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="강호수첩-완료기록.json";a.click();URL.revokeObjectURL(a.href)};$("#importInput").onchange=async e=>{try{const x=JSON.parse(await e.target.files[0].text());if(x.profiles?.length!==3)throw 0;state.profiles=NAMES.map((n,i)=>({id:`character-${i+1}`,name:String(x.profiles[i].name||n).slice(0,12),done:migrateDone(x.profiles[i].done).filter(quest)}));save();render();alert("기록을 불러왔습니다.");$("#backupDialog").close()}catch{alert("올바른 기록 파일인지 확인해 주세요.")}};$("#resetButton").onclick=()=>{if(confirm(`${profile().name}의 기록을 모두 지울까요?`)){profile().done=[];save();render();$("#backupDialog").close()}};
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
    return{schemaVersion:manifest.schemaVersion,quests};
  }catch{
    const response=await fetch(`./quests-core.json?v=${version}`,{cache:"no-store"});
    if(!response.ok)throw new Error(response.status);
    return response.json();
  }
}
loadQuestData().then(d=>{state.data=d;state.selected=d.quests[0].id;save();render()}).catch(()=>document.body.innerHTML="<main><h1>데이터를 불러오지 못했습니다.</h1></main>");
addEventListener("resize",()=>{if(state.data)rows()});

