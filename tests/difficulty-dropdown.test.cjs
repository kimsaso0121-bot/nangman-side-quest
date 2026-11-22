const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8'),nav=fs.readFileSync('navigation.js','utf8'),app=fs.readFileSync('app.js','utf8');
const select=html.match(/<select id="difficultySelect"[\s\S]*?<\/select>/)[0];
const optionRows=s=>[...s.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)].map(m=>({value:m[1],textContent:m[2],tagName:'OPTION'}));
const children=[optionRows(select)[0],...[...select.matchAll(/<optgroup label="([^"]+)">([\s\S]*?)<\/optgroup>/g)].map(m=>({tagName:'OPTGROUP',label:m[1],children:optionRows(m[2])}))];
function setup(){
 const nodes={},handlers={},counts={changes:0,rows:0,history:0};let ctx;
 const options=optionRows(select),buttons=options.map(o=>({...o,dataset:{difficulty:o.value},focus(){ctx.document.activeElement=this},scrollIntoView(){}}));
 const el=id=>nodes[id]??(nodes[id]={hidden:true,attrs:{},setAttribute(k,v){this.attrs[k]=v},focus(){ctx.document.activeElement=this}});
 Object.assign(el('#difficultySelect'),{children,value:'all',dispatchEvent(){counts.changes++;ctx.state.difficulty=this.value;counts.rows++;counts.history++}});
 Object.assign(el('#difficultyItems'),{querySelector:()=>buttons.find(b=>b.value===ctx.state.difficulty),querySelectorAll:()=>buttons});
 ctx={state:{data:{},difficulty:'all',query:'감초',scope:{kind:'region',value:'항주'},status:'todo'},document:{activeElement:null},$:el,esc:s=>s,Event:class {},closeBrowse(){counts.browseClosed=true},addEventListener(k,fn){(handlers[k]??=[]).push(fn)}};
 vm.createContext(ctx);vm.runInContext(nav.slice(nav.indexOf('function renderDifficulty()'),nav.indexOf("$('#ownedOnly').onchange=")),ctx);
 return {ctx,nodes,handlers,buttons,counts,el};
}
test('difficulty uses an attached dropdown and preserves every original filter value with two always-open groups',()=>{
 assert(select.includes('hidden aria-hidden="true" tabindex="-1"'));
 assert(html.includes('id="difficultyButton"'));assert(html.includes('id="difficultyItems" role="listbox"'));
 assert.deepEqual(children.slice(1).map(g=>[g.label,g.children.length]),[['레벨 기준',14],['전투력 기준',6]]);
 const x=setup();x.ctx.renderDifficulty();const rendered=x.el('#difficultyItems').innerHTML;
 assert.equal((rendered.match(/role="option"/g)||[]).length,21);assert.equal((rendered.match(/role="group"/g)||[]).length,2);
 assert(!/aria-expanded|<details|showModal/.test(rendered));assert(rendered.includes('aria-selected="true"'));
});
test('selecting difficulty retains region, search and status and uses the existing change event without a record save',()=>{
 const x=setup(),before={...x.ctx.state};x.el('#difficultyButton').onclick();assert.equal(x.el('#difficultyItems').hidden,false);assert(x.counts.browseClosed);
 x.el('#difficultyItems').onclick({target:{closest:()=>x.buttons.find(b=>b.value==='power:70')}});
 assert.equal(x.el('#difficultySelect').value,'power:70');assert.equal(x.ctx.state.difficulty,'power:70');assert.equal(x.counts.changes,1);assert.equal(x.counts.history,1);
 for(const k of ['scope','query','status'])assert.equal(x.ctx.state[k],before[k]);assert(x.el('#difficultyItems').hidden);assert.equal(x.ctx.document.activeElement,x.el('#difficultyButton'));
 assert(!nav.slice(nav.indexOf('function renderDifficulty()'),nav.indexOf("$('#ownedOnly').onchange=")).includes('save('));
});
test('arrows, Home, End, Escape, outside click and focus exit keep dropdown dismissal predictable',()=>{
 const x=setup(),key=x.handlers.keydown[0],event=k=>({key:k,target:{closest:()=>true},preventDefault(){}});
 key(event('ArrowDown'));assert(!x.el('#difficultyItems').hidden);assert.equal(x.ctx.document.activeElement,x.buttons[0]);
 key(event('End'));assert.equal(x.ctx.document.activeElement,x.buttons.at(-1));key(event('Home'));assert.equal(x.ctx.document.activeElement,x.buttons[0]);
 key(event('ArrowUp'));assert.equal(x.ctx.document.activeElement,x.buttons.at(-1));key(event('Escape'));assert(x.el('#difficultyItems').hidden);
 x.ctx.openDifficulty();x.handlers.click[0]({composedPath:()=>[]});assert(x.el('#difficultyItems').hidden);
 x.ctx.openDifficulty();x.handlers.focusin[0]({target:{closest:()=>null}});assert(x.el('#difficultyItems').hidden);
});
test('restoring view history synchronizes the custom label with the preserved native value',()=>{
 const nodes={'#difficultySelect':{selectedOptions:[{textContent:'60레벨'}]},'#difficultyLabel':{},'#ownerLine':{},'#ownedOnly':{}},ctx={state:{difficulty:'level:60',ownedOnly:true},$:s=>nodes[s]};vm.createContext(ctx);
 vm.runInContext(app.split('\n').find(l=>l.startsWith('function filters()'))+'\nfilters();',ctx);
 assert.equal(nodes['#difficultySelect'].value,'level:60');assert.equal(nodes['#difficultyLabel'].textContent,'60레벨');
 assert.equal(nodes['#ownedOnly'].checked,true);
});
test('both dropdown panels match their trigger width without a wider minimum',()=>{
 const css=fs.readFileSync('update.css','utf8'),rule=css.match(/#browseItems,#difficultyItems\{([^}]+)\}/)[1];
 assert(rule.includes('width:100%;'));assert(!rule.includes('230px'));assert(!rule.includes('min-width:'));
});
