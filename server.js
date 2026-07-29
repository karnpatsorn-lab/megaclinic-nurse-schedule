// Mega Clinic - Nurse PT shift schedule, live from Airtable
const express = require("express");
const app = express();

const BASE_ID = "appWBXBKpvnL7ZAkl";
const TABLE_ID = "tblK9JBp6uVsJpfFy"; // เวร
const TOKEN = process.env.AIRTABLE_TOKEN;

const BRANCH_COLOR = {
  "สยาม": "#0EA5E9",
  "ศรีนครินทร์": "#14B8A6",
  "เวสต์เกต": "#F97316",
  "ลาดพร้าว": "#EC4899",
  "รังสิต": "#8B5CF6",
};
const BRANCH_CODE = {
  "สยาม": "SQ",
  "ศรีนครินทร์": "SR",
  "เวสต์เกต": "WG",
  "ลาดพร้าว": "LP",
  "รังสิต": "FR",
};

async function fetchAllRecords() {
  let records = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!r.ok) throw new Error("Airtable error " + r.status + ": " + (await r.text()));
    const data = await r.json();
    records = records.concat(data.records || []);
    offset = data.offset;
  } while (offset);
  return records;
}

app.get("/api/shifts", async (req, res) => {
  try {
    if (!TOKEN) return res.status(500).json({ error: "AIRTABLE_TOKEN not set" });
    const records = await fetchAllRecords();
    const shifts = records
      .map((rec) => {
        const f = rec.fields || {};
        const branch = f["สาขา"] || "";
        return {
          date: f["วันที่"] || "",
          branch,
          code: BRANCH_CODE[branch] || "",
          color: BRANCH_COLOR[branch] || "#999",
          nurse: f["พยาบาล"] || "",
          phone: f["เบอร์โทร"] || "",
          status: f["สถานะ"] || "",
        };
      })
      .filter((s) => s.date && s.branch && s.nurse);
    res.set("Cache-Control", "no-store");
    res.json({ shifts, updatedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.get("/", (req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(HTML);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("listening on " + PORT));

const HTML = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ตารางเวรพยาบาล · Mega Clinic</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:"Sarabun","Segoe UI",Tahoma,sans-serif;background:#fff0f7;color:#3b1030}
header{background:linear-gradient(90deg,#EC4899,#BE185D);color:#fff;padding:16px 24px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;position:sticky;top:0;z-index:20;box-shadow:0 2px 10px rgba(0,0,0,.12)}
header h1{margin:0;font-size:24px;font-weight:800}
.lock{background:rgba(255,255,255,.22);padding:8px 16px;border-radius:999px;font-size:14px;font-weight:700}
.upd{margin-left:auto;font-size:13px}
.wrap{max-width:1300px;margin:0 auto;padding:16px}
.bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
button,select{font-family:inherit;font-size:16px;font-weight:700;border:2px solid #f6b3d0;border-radius:12px;padding:9px 15px;background:#fff;color:#BE185D;cursor:pointer}
button.on{background:#BE185D;color:#fff;border-color:#BE185D}
b.lbl{font-size:22px;color:#BE185D}
.legend{display:flex;gap:10px;flex-wrap:wrap;margin-left:auto}
.lg{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#6b2447}
.dot{width:14px;height:14px;border-radius:5px;display:inline-block}
.dowrow{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;position:sticky;top:70px;z-index:10;background:#fff0f7;padding:4px 0}
.dow{text-align:center;font-weight:800;color:#BE185D;padding:4px 0;font-size:16px;border-radius:10px}
.dow.we{color:#BE185D;background:#ffe1ee}
.wk{display:grid;grid-template-columns:repeat(7,1fr);gap:10px}
.wk.month{grid-auto-rows:minmax(46px,auto)}
.wk.week{grid-auto-rows:minmax(320px,auto)}
.day{background:#fff;border:2px solid #f6d8e8;border-radius:16px;padding:9px;display:flex;flex-direction:column;gap:8px}
.day.blank{background:repeating-linear-gradient(135deg,#fff,#fff 10px,#fdf1f6 10px,#fdf1f6 20px);border:2px dashed #f6d8e8}
.day.empty{justify-content:flex-start}
.day.empty .dn{opacity:.45}
.dn{font-weight:800;color:#9d174d;font-size:17px;display:flex;align-items:center;gap:6px}
.dn .wd{font-size:12px;font-weight:700;color:#c2568a;background:#ffe1ee;padding:2px 7px;border-radius:8px}
.today{outline:4px solid #f9a8d4}
.today .dn{color:#BE185D}
.none{color:#d79ab8;font-size:13px;font-style:italic;padding:6px 2px}
.chip{border-radius:12px;padding:9px 11px;color:#fff;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.chip .info{flex:1;min-width:0}
.chip .b{font-size:12px;font-weight:800;opacity:.9;letter-spacing:.3px;display:block}
.chip .nm{font-size:18px;font-weight:800;line-height:1.25;display:block;white-space:normal;word-break:break-word}
.chip .ph{flex-shrink:0;display:inline-flex;align-items:center;gap:4px;color:#fff;font-size:15px;font-weight:800;text-decoration:none;background:rgba(255,255,255,.28);padding:6px 10px;border-radius:10px}
.foot{margin-top:16px;color:#9d6b86;font-size:14px;text-align:center}
.loading{padding:40px;text-align:center;color:#BE185D;font-size:18px;font-weight:700;grid-column:1/-1}
@media(max-width:900px){.wk,.dowrow{grid-template-columns:1fr}.dow{display:none}.dowrow{position:static}.wk.week{grid-auto-rows:auto}.day.empty{display:none}header h1{font-size:20px}.dn::before{content:attr(data-wd)" ";font-size:13px;color:#c2568a;background:#ffe1ee;padding:2px 7px;border-radius:8px;margin-right:4px}}
</style></head><body>
<header><h1>🩺 ตารางเวรพยาบาล Part-Time</h1><span class="lock">🔒 ดูอย่างเดียว · โทรหาพยาบาลได้ · 🔄 ข้อมูลสด</span><span class="upd" id="upd">กำลังโหลด...</span></header>
<div class="wrap">
 <div class="bar">
  <button id="btnWeek" onclick="setMode('week')">สัปดาห์นี้</button>
  <button id="btnMonth" onclick="setMode('month')">ทั้งเดือน</button>
  <button onclick="mv(-1)">‹ ก่อนหน้า</button><button onclick="jumpToday()">วันนี้</button><button onclick="mv(1)">ถัดไป ›</button>
  <b class="lbl" id="lbl"></b>
  <div class="legend" id="legend"></div>
 </div>
 <div class="dowrow" id="dowrow"></div>
 <div class="wk" id="cal"><div class="loading">⏳ กำลังโหลดตารางเวรจาก Airtable...</div></div>
 <div class="foot" id="foot"></div>
</div>
<script>
let DATA=[];
const TH=["","มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const DOW=["อา","จ","อ","พ","พฤ","ศ","ส"];
const BR={"สยาม":"#0EA5E9","ศรีนครินทร์":"#14B8A6","เวสต์เกต":"#F97316","ลาดพร้าว":"#EC4899","รังสิต":"#8B5CF6"};
const $=id=>document.getElementById(id);
let mode='month', anchor;
function fmtISO(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
async function load(){
 try{
  const r=await fetch('/api/shifts',{cache:'no-store'});
  const j=await r.json();
  if(j.error){ $('upd').textContent='โหลดข้อมูลไม่สำเร็จ'; $('cal').innerHTML='<div class="loading">⚠️ '+j.error+'</div>'; return; }
  DATA=j.shifts;
  $('upd').textContent='อัปเดตล่าสุด: '+new Date(j.updatedAt).toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'});
  $('legend').innerHTML=Object.keys(BR).map(b=>'<span class="lg"><span class="dot" style="background:'+BR[b]+'"></span>'+b+'</span>').join('');
  const todayISO=fmtISO(new Date());
  const dates=DATA.map(s=>s.date).sort();
  anchor=new Date();
  if(dates.length && (todayISO<dates[0] || todayISO>dates[dates.length-1])) anchor=new Date(dates[0]);
  setMode('month');
 }catch(e){
  $('upd').textContent='โหลดข้อมูลไม่สำเร็จ';
  $('cal').innerHTML='<div class="loading">⚠️ เชื่อมต่อ Airtable ไม่ได้ ลองรีเฟรชหน้านี้อีกครั้ง</div>';
 }
}
load();
setInterval(load, 60000); // refresh every 60s
function setMode(m){mode=m;$('btnWeek').className=mode==='week'?'on':'';$('btnMonth').className=mode==='month'?'on':'';render()}
function jumpToday(){anchor=new Date();render()}
function mv(n){
 if(mode==='week') anchor=new Date(anchor.getFullYear(),anchor.getMonth(),anchor.getDate()+n*7);
 else anchor=new Date(anchor.getFullYear(),anchor.getMonth()+n,1);
 render();
}
function chipHTML(s){
 return '<div class="chip" style="background:'+s.color+'"><div class="info"><span class="b">'+s.branch+'</span><span class="nm">'+s.nurse+'</span></div>'+
  (s.phone?('<a class="ph" href="tel:'+s.phone+'">☎ '+s.phone+'</a>'):'')+'</div>';
}
function render(){
 if(!anchor) return;
 const todayISO=fmtISO(new Date());
 let h='',dowh='',cnt=0,days=[];
 if(mode==='week'){
  const dow0=anchor.getDay();
  const start=new Date(anchor.getFullYear(),anchor.getMonth(),anchor.getDate()-dow0);
  for(let i=0;i<7;i++) days.push(new Date(start.getFullYear(),start.getMonth(),start.getDate()+i));
  $('lbl').textContent=fmtISO(days[0])+' – '+fmtISO(days[6]);
  dowh=DOW.map((d,i)=>'<div class="dow'+(i===0||i===6?' we':'')+'">'+d+'</div>').join('');
  for(const dt of days){
   const iso=fmtISO(dt);
   const sh=DATA.filter(s=>s.date===iso); cnt+=sh.length;
   const chips=sh.length?sh.map(chipHTML).join(''):'<div class="none">— ไม่มีเวร —</div>';
   h+='<div class="day'+(iso===todayISO?' today':'')+'"><div class="dn" data-wd="'+DOW[dt.getDay()]+'"><span class="wd">'+DOW[dt.getDay()]+'</span>'+dt.getDate()+' '+TH[dt.getMonth()+1].slice(0,3)+'</div>'+chips+'</div>';
  }
 } else {
  const y=anchor.getFullYear(),m=anchor.getMonth();
  $('lbl').textContent=TH[m+1]+' '+(y+543);
  dowh=DOW.map((d,i)=>'<div class="dow'+(i===0||i===6?' we':'')+'">'+d+'</div>').join('');
  const lead=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate();
  for(let i=0;i<lead;i++)h+='<div class="day blank"></div>';
  for(let d=1;d<=dim;d++){
   const iso=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
   const sh=DATA.filter(s=>s.date===iso); cnt+=sh.length;
   const chips=sh.map(chipHTML).join('');
   h+='<div class="day'+(iso===todayISO?' today':'')+(sh.length?'':' empty')+'"><div class="dn">'+d+'</div>'+chips+'</div>';
  }
 }
 $('dowrow').innerHTML=dowh;
 $('cal').className='wk '+mode;
 $('cal').innerHTML=h;
 $('foot').textContent='รวม '+cnt+' เวร · แตะเบอร์เพื่อโทรออกได้ทันที · ข้อมูลสดจาก Airtable';
}
</script></body></html>`;
