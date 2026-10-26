/* Attached hierarchy (not a modal); selecting one scope replaces the preceding one. */
// Only desktop moves the existing progress node; mobile keeps its original position.
const desktopProgress=matchMedia('(min-width:821px)');
function placeProgress(){const el=$('.progress'),intro=$('.intro');if(desktopProgress.matches)$('.profiles').append(el);else intro.after(el)}
desktopProgress.addEventListener('change',placeProgress);placeProgress();
let browseBranch=null,browseEntries=[];
function renderBrowse(){
  browseEntries=[{kind:'all',label:'전체 임무'}];
  for(const branch of GanghoBrowse.branches){
    browseEntries.push({kind:'branch',value:branch,label:branch});
    if(browseBranch===branch)browseEntries.push({kind:'category',value:branch,label:branch+' 전체',child:true},...GanghoBrowse.entries(state.data.quests,branch).map(e=>({...e,child:true})));
  }
  $('#browseItems').innerHTML=browseEntries.map((e,i)=>`<button type="button" data-entry="${i}" class="${e.child?'browse-child':''}" ${e.kind==='branch'?`aria-expanded="${browseBranch===e.value}"`:''}><span>${esc(e.label)}</span>${e.kind==='branch'?`<span aria-hidden="true">${browseBranch===e.value?'−':'+'}</span>`:''}</button>`).join('');
}
function closeBrowse(focus=false){$('#browseItems').hidden=true;$('#browseButton').setAttribute('aria-expanded','false');if(focus)$('#browseButton').focus()}
$('#browseButton').onclick=()=>{if(!state.data)return;if(!$('#browseItems').hidden){closeBrowse();return}renderBrowse();$('#browseItems').hidden=false;$('#browseButton').setAttribute('aria-expanded','true')};
$('#browseItems').onclick=e=>{const b=e.target.closest('[data-entry]');if(!b)return;const entry=browseEntries[Number(b.dataset.entry)];if(entry.kind==='branch'){browseBranch=browseBranch===entry.value?null:entry.value;renderBrowse();$('#browseItems').querySelector(`[data-entry="${browseEntries.findIndex(e=>e.kind==='branch'&&e.value===entry.value)}"]`).focus()}else{state.scope=entry;$('#browseLabel').textContent=entry.kind==='all'?'전체 임무':entry.value;filters();rows();rememberViewFilters();closeBrowse(true)}};
addEventListener('click',e=>{if(!e.composedPath().includes($('.browse-picker')))closeBrowse()});
addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#browseItems').hidden){closeBrowse(true);e.preventDefault()}if((e.key==='ArrowDown'||e.key==='ArrowUp')&&e.target.closest('.browse-picker')&&!$('#browseItems').hidden){const buttons=[...$('#browseItems').querySelectorAll('button')],i=buttons.indexOf(document.activeElement);buttons[(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();e.preventDefault()}});
$('#ownedOnly').onchange=e=>{profile().ownedOnly=e.target.checked;save();filters();rows();rememberViewFilters()};
const companionGroups=[['초기 동료',['여진해','진원봉','소유설']],['세력 동료',['종무월','강일천']],['강호 동료',['류여의','전봉','맹상','탁발준','정소비','도연일','백로','사고란','야무유','석소로']],['원보 동료',['능연','양연헌','상호건','태길이','화공노승','배이나','월영','진무쌍','이일진','소패음','두월한','도화','우영이','설용성','남지의']]];
function renderOwned(){$('#companionList').innerHTML=companionGroups.map(([g,ns])=>`<fieldset><legend>${g}</legend><div>${ns.map(n=>`<label><input type="checkbox" value="${esc(n)}" ${profile().owned.includes(n)?'checked':''}>${esc(n)}</label>`).join('')}</div></fieldset>`).join('')}
$('#ownedButton').onclick=()=>{renderOwned();$('#ownedDialog').showModal()};
$('#companionList').onchange=e=>{const name=e.target.value;if(!companionGroups.some(([,ns])=>ns.includes(name)))return;profile().owned=profile().owned.filter(n=>n!==name);if(e.target.checked)profile().owned.push(name);if(!save())renderOwned();rows()};
