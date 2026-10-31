/* Pure, mutually exclusive navigation scopes; shared by the UI and regression tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GanghoBrowse=api;})(globalThis,function(){
  const groups=['중원지역','사악지역','강남소항','동남연해','서남파촉','동북변경','서북대막','설역고산'];
  const branches=[...groups,'동료임무','강호문파','소형세력'];
  function matches(q,scope){
    if(scope.kind==='region')return q.regions.includes(scope.value);
    if(scope.kind==='category')return q.browseCategory===scope.value||q.browseGroup===scope.value||(scope.value==='소형세력'&&q.factionAssociations?.length>0);
    if(scope.kind==='owner')return q.browseCategory===scope.category&&q.owner===scope.value||(scope.category==='소형세력'&&q.factionAssociations?.includes(scope.value));
    return true;
  }
  function entries(quests,branch){
    if(groups.includes(branch))return [...new Set(quests.filter(q=>q.browseGroup===branch).flatMap(q=>q.regions))].filter(Boolean).map(value=>({kind:'region',value,label:value}));
    return [...new Set(quests.filter(q=>q.browseCategory===branch).map(q=>q.owner).concat(branch==='소형세력'?quests.flatMap(q=>q.factionAssociations||[]):[]))].filter(Boolean).map(value=>({kind:'owner',category:branch,value,label:value}));
  }
  function ownedVisible(q,only,owned){return !only||q.browseCategory!=='동료임무'||owned.includes(q.owner);}
  function schoolVisible(q,only,schools=[]){return !only||q.browseCategory!=='강호문파'||schools.includes(q.owner);}
  return {groups,branches,matches,entries,ownedVisible,schoolVisible};
});
