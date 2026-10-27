const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('mobile compact layout leaves storage and PC styling outside its media scope',()=>{
 const css=fs.readFileSync('update.css','utf8'),html=fs.readFileSync('index.html','utf8');
 assert(html.includes('class="owned-label-wide">보유 동료 임무만</span><span class="owned-label-mobile">보유 동료만</span>'));
 const mobile=css.slice(css.indexOf('@media(max-width:820px){\n  .controls select'),css.indexOf('/* Approved wide-PC layout'));
 for(const value of ['flex-wrap:nowrap;gap:12px','min-width:0;min-height:36px;padding:4px 9px','gap:10px;font-size:13px','width:17px;height:17px;margin:0','grid-template-columns:auto minmax(0,1fr) max-content;gap:10px'])assert(mobile.includes(value),value);
 assert(css.includes('.controls #ownerLine .owned-label-wide{font:inherit}'));
 assert(css.includes('.controls .status-tools>#ownerLine{display:flex;width:auto;flex:0 0 auto;'));
});
