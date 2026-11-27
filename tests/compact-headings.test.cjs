const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('approved brand and detail typography shrink without changing header or divider geometry',()=>{
 const css=fs.readFileSync('update.css','utf8');
 for(const s of ['.topbar .brand-title{font-size:23px}', '.topbar .seal{width:36px;height:38px;font-size:9px}', '#questDetail>header h2{font-size:28px}', '.topbar .brand-title{font-size:19px}', '.topbar .seal{width:28px;height:30px;font-size:7px}', '#questDetail>header h2{font-size:25px}'])assert(css.includes(s),s);
 assert(css.includes('left:12.5%;width:75%;height:1px'));
});
