"use strict";
const CATS = {cardboard:"Cardboard", rigid:"Hard plastic", qsr:"QSR mixed", ewaste:"E-waste"};

/* Benchmarks, ₹ per tonne, ex-yard, excl. transport & GST */
const RATES = {
  cardboard:{lo:14000,hi:18000,label:"Cardboard, baled OCC (mill grade)",basis:"Baled OCC sold direct to a mill, ex-yard. Loose OCC to traders runs ₹10–14/kg; North India mill-delivered price near ₹22/kg.",asof:"Apr–Oct 2026",src:[1,2]},
  pet:{lo:25000,hi:52000,label:"PET bottles, baled",basis:"Low end: South India baled PET index. High end: Gujarat PET bottle scrap index and Scrapo India median asking price.",asof:"Aug–Oct 2026",src:[3,4]},
  hdpe:{lo:20000,hi:50000,label:"HDPE / PP containers, unground",basis:"Delhi NCR collector rate list (₹15–20/kg) to HDPE container scrap guides (₹35–50/kg). Ground, washed regrind trades higher.",asof:"Jul–Oct 2026",src:[5,6,4]},
  mixed:{lo:15000,hi:25000,label:"Mixed rigid plastic, unsorted",basis:"Unsorted heaps earn the mixed-plastic rate; sorting by polymer lifts it.",asof:"2025–2026",src:[5,7]},
  qsr:{lo:-2000,hi:0,label:"QSR mixed waste (cups, soiled paper, wrappers, food)",basis:"No positive scrap market. Non-recyclable combustible fraction goes as RDF to cement kilns, where generators often pay a gate fee. Pull out OCC and PET first.",asof:"2026",src:[8,9]},
  ew_mixed:{lo:35000,hi:42000,label:"E-waste, mixed whole units",basis:"Ludhiana baseline ₹42.26/kg (24 Oct 2026); pickup quotes typically ₹5–7/kg below baseline.",asof:"24 Oct 2026",src:[12]},
  ew_pcb:{lo:150000,hi:400000,label:"E-waste, circuit boards / PCBs",basis:"₹150–400/kg for circuit boards; high-grade motherboards are listed up to ₹800/kg.",asof:"2025–Oct 2026",src:[12,13]},
  ew_cable:{lo:60000,hi:120000,label:"E-waste, cables and wiring",basis:"Copper content drives the rate; stripped copper sells far higher.",asof:"2025–2026",src:[13]},
  ew_casing:{lo:10000,hi:15000,label:"E-waste, plastic casings",basis:"Mixed ABS/HIPS housings after dismantling.",asof:"Oct 2026",src:[12]}
};
const EW_KEYS=["ew_mixed","ew_pcb","ew_cable","ew_casing"];
const SOURCES = [
  ["JoinBin, Cardboard scrap rate in India 2026 (Apr 2026)","https://joinbin.com/scrap-rate-cardboard-india"],
  ["The Pulp & Paper Times, Imported waste paper shortage pushes kraft paper prices higher (Oct 2026)","https://thepulpandpapertimes.com/news/imported-waste-paper-shortage-pushes-kraft-paper-prices-higher-domestic-market-remains-firm-4589"],
  ["Recycleinme, Current Indian plastic prices (19 Aug 2026)","https://www.recycleinme.com/plasticpricelisting/Indian%20Plastic%20Prices"],
  ["Scrapo, Plastic scrap buyers and dealers in India, price index (Oct 2026)","https://scrapo.com/in/plastic-scrap-buyers"],
  ["Operation SHUDDHI, Best plastic scrap prices in India (6 Jul 2026)","https://opshuddhi.org/best-plastic-scrap-prices-india/"],
  ["TodayPriceRates, Plastic scrap price in India (2026)","https://resale.todaypricerates.com/plastic-scrap-price"],
  ["ADS Enviro, 1 kg plastic rate in India (2025)","https://www.adsenviro.in/blog/1-kg-plastic-rate-in-india"],
  ["InfraLens CPHEEO MSW notes, RDF and cement co-processing economics (2026)","https://infralens.in/cpheeo/cpheeo-msw-07"],
  ["MarkNtel Advisors, RDF market note citing SWM Rules 2026 cement fuel substitution","https://www.marknteladvisors.com/press-release/refuse-derived-fuel-market-share"],
  ["ENF Plastic recycling plant directory (company records)","https://www.enfplastic.com/fine-rezyklates"],
  ["CPCB centralised EPR portal for plastic packaging (PWP registration check)","https://eprplastic.cpcb.gov.in/"],
  ["ScrapRates.in, E-waste scrap rate today in Ludhiana (24 Oct 2026)","https://scraprates.in/ludhiana/e-waste-scrap-price"],
  ["TodayPriceRates, E-waste scrap price in India (2025 table)","https://resale.todaypricerates.com/ewaste-scrap-rate"],
  ["Punjab Pollution Control Board, List of recyclers and refurbishers for e-waste in Punjab","https://ppcb.punjab.gov.in/sites/default/files/documents/List%20of%20Recyclers_%20Refurbishers%20for%20Management%20of%20E-Waste%20in%20the%20State%20of%20Punjab.pdf"],
  ["NDMC, DPCC approved list of e-waste dismantlers, recyclers and refurbishers","https://ndmc.gov.in/pdf/dpcc_approved_list_of_e-waste_dismantlers_recyclers_refurbishers_collection_center_of_recycler.pdf"],
  ["Zerodha Daily Brief, How India's e-waste rules found their teeth (EPR floor price, court challenge)","https://thedailybrief.zerodha.com/p/how-indias-e-waste-rules-found-their"],
  ["GreenSutra, E-waste EPR explained 2026 (price band, Delhi HC status)","https://greensutra.in/news/e-waste-epr-explained-2026/"]
];

const CITIES = [
 ["Ludhiana, PB",30.901,75.857],["Amritsar, PB",31.634,74.872],["Jalandhar, PB",31.326,75.576],["Patiala, PB",30.340,76.386],
 ["Mohali, PB",30.704,76.717],["Zirakpur, PB",30.643,76.817],["Rajpura, PB",30.484,76.594],["Khanna, PB",30.705,76.222],
 ["Bathinda, PB",30.211,74.945],["Pathankot, PB",32.274,75.652],["Hoshiarpur, PB",31.532,75.912],["Moga, PB",30.817,75.174],
 ["Phagwara, PB",31.224,75.770],["Firozpur, PB",30.926,74.613],["Sangrur, PB",30.245,75.844],["Chandigarh, UT",30.733,76.779],
 ["Panchkula, HR",30.695,76.854],["Ambala, HR",30.378,76.777],["Kurukshetra, HR",29.969,76.878],["Karnal, HR",29.686,76.990],
 ["Panipat, HR",29.391,76.963],["Hisar, HR",29.149,75.722],["Gurugram, HR",28.459,77.026],["Faridabad, HR",28.408,77.317],
 ["New Delhi, DL",28.613,77.209],["Noida, UP",28.535,77.391],["Ghaziabad, UP",28.669,77.454],["Meerut, UP",28.984,77.706],
 ["Lucknow, UP",26.847,80.946],["Kanpur, UP",26.449,80.331],["Agra, UP",27.177,78.008],["Dehradun, UK",30.316,78.032],
 ["Haridwar, UK",29.945,78.164],["Shimla, HP",31.105,77.173],["Solan, HP",30.905,77.097],["Baddi, HP",30.958,76.791],
 ["Jammu, JK",32.727,74.857]
];
const ROAD = 1.3; /* straight-line to road distance factor */

let recyclers = [], lots = [], quotes = [], db = null, canWrite = false, lastSearch = null;

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const inr = n => (n<0?"−₹":"₹") + Math.abs(Math.round(n)).toLocaleString("en-IN");
function toast(t){const el=$("#toast");el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2200)}
function hav(a,b,c,d){const R=6371,r=x=>x*Math.PI/180;const dl=r(c-a),dn=r(d-b);const h=Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
async function copyText(t){try{await navigator.clipboard.writeText(t);toast("Copied")}catch(e){toast("Select the text and copy it manually")}}
document.addEventListener("click",e=>{const b=e.target.closest("[data-copy]");if(b)copyText(b.dataset.copy)});

/* Tabs */
const TABS=["find","lots","ewaste","dir","rates"];
const tabs=[...document.querySelectorAll("nav.tabs button")];
function showTab(id){tabs.forEach(b=>b.setAttribute("aria-selected",b.dataset.tab===id));TABS.forEach(t=>$("#tab-"+t).hidden=t!==id);try{localStorage.setItem("tab",id)}catch(e){}}
tabs.forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
const h=(location.hash||"").slice(1);let st=null;try{st=localStorage.getItem("tab")}catch(e){}
showTab(TABS.includes(h)?h:(st&&TABS.includes(st)?st:"find"));

/* Location select */
$("#loc").innerHTML = CITIES.map((c,i)=>`<option value="${i}">${esc(c[0])}</option>`).join("") + `<option value="custom">Custom coordinates…</option>`;
$("#loc").addEventListener("change",()=>{$("#customBox").hidden=$("#loc").value!=="custom"});
const catVal=()=>document.querySelector('input[name="cat"]:checked').value;
function syncGrade(){$("#gradeBox").hidden=catVal()!=="rigid";$("#ewGradeBox").hidden=catVal()!=="ewaste"}
document.querySelectorAll('input[name="cat"]').forEach(r=>r.addEventListener("change",syncGrade));
const gradeVal=()=>catVal()==="rigid"?$("#grade").value:catVal()==="ewaste"?$("#ewGrade").value:"";
const rateKey=()=>gradeVal()||catVal();

function readForm(){
  const v=$("#loc").value;let name,lat,lng;
  if(v==="custom"){lat=parseFloat($("#lat").value);lng=parseFloat($("#lng").value);name=$("#locName").value.trim()||"Custom point";
    if(!isFinite(lat)||!isFinite(lng)){toast("Enter latitude and longitude for the custom point");return null}}
  else{const c=CITIES[+v];name=c[0];lat=c[1];lng=c[2]}
  const tonnes=parseFloat($("#tonnes").value);
  if(!(tonnes>0)){toast("Enter a quantity above zero");return null}
  return {locName:name,lat,lng,category:catVal(),grade:gradeVal(),tonnes,radius:+$("#radius").value,notes:$("#notes").value.trim()};
}

function search(){
  const f=readForm(); if(!f) return;
  lastSearch=f;
  const pool=recyclers.filter(r=>(r.categories||[]).includes(f.category));
  const fac=pool.filter(r=>r.kind!=="network"&&isFinite(r.lat)&&r.lat!==null).map(r=>({...r,km:hav(f.lat,f.lng,r.lat,r.lng)*ROAD})).sort((a,b)=>a.km-b.km);
  const near=fac.filter(r=>r.km<=f.radius);
  const nets=pool.filter(r=>r.kind==="network");
  const R=RATES[rateKey()];
  $("#sum").innerHTML=`
    <div><div class="label">Lot</div><div class="big">${f.tonnes.toLocaleString("en-IN")} t</div><div class="muted">${esc(CATS[f.category])}${f.grade?" · "+esc(RATES[f.grade].label.replace(/^E-waste, /,"").split(",")[0]):""}</div></div>
    <div><div class="label">Indicative rate, ex-yard</div><div class="big">${inr(R.lo)} to ${inr(R.hi)}</div><div class="muted">per tonne</div></div>
    <div><div class="label">Indicative lot value</div><div class="big">${inr(R.lo*f.tonnes)} to ${inr(R.hi*f.tonnes)}</div><div class="muted">${f.category==="qsr"?"negative = likely disposal cost":"before transport and GST"}</div></div>
    <div><div class="label">Facilities in range</div><div class="big">${near.length}</div><div class="muted">within ${f.radius} road km of ${esc(f.locName)}</div></div>`;
  $("#matchMeta").textContent=recyclers.length?`${fac.length} facilities on file for this stream`:"";
  const list = near.length?near.slice(0,12):fac.slice(0,3);
  if(!recyclers.length){
    $("#matches").innerHTML=`<div class="empty">The recycler directory is empty. ${db?"It is empty right now; add confirmed recyclers in the Directory tab.":"Connect the database to load it."}</div>`;
  } else if(!list.length){
    $("#matches").innerHTML=`<div class="empty">No facility on file handles this stream yet. Use the network options below or add a recycler.</div>`;
  } else {
    $("#matches").innerHTML=(near.length?(near.length>12?`<p class="note" style="margin-bottom:6px">Showing the 12 closest of ${near.length}.</p>`:""):`<p class="note" style="margin-bottom:6px">None within ${f.radius} km. Closest on file:</p>`)+list.map(r=>card(r)).join("");
  }
  $("#networks").innerHTML=nets.length?`<div class="network"><div class="label" style="margin-bottom:6px">Pan-India networks and service providers for this stream</div>${nets.map(r=>card(r,true)).join("")}</div>`:"";
  $("#rfq").textContent=rfq(f,list,nets);
  $("#saveLot").disabled=!(db&&canWrite);
  $("#saveHint").textContent=db?(canWrite?"Save the lot so the team can log quotes against it.":"You can view the log but your sharing level cannot add lots."):"Lots are saved once the database is connected (see README).";
}

function vClass(v){return v==="Verified"?"v-ok":v==="Partial"?"v-part":"v-no"}
function card(r,net){
  const ph=(r.phones||[]).map(p=>`<span><span class="mono">${esc(p)}</span><button class="copy" type="button" data-copy="${esc(p)}">copy</button></span>`).join("");
  const em=(r.emails||[]).map(p=>`<span><span class="mono">${esc(p)}</span><button class="copy" type="button" data-copy="${esc(p)}">copy</button></span>`).join("");
  const v=r.verification||"Contact pending";
  return `<div class="match">
    <div class="km">${net?`<b>NW</b><small>network</small>`:`<b>${Math.round(r.km)}</b><small>road km</small>`}</div>
    <div style="min-width:0">
      <div class="row" style="gap:8px"><h3>${esc(r.name)}</h3>${(r.categories||[]).map(c=>`<span class="chip c-${c}">${CATS[c]}</span>`).join("")}<span class="${vClass(v)}" style="font-size:.8rem;font-weight:700">${esc(v)}</span></div>
      <div class="muted" style="font-size:.9rem">${esc(r.city||"")}${r.address?" · "+esc(r.address):""}</div>
      <div class="contact">${ph}${em}${(!ph&&!em)?`<span class="v-no">No published phone or email yet</span>`:""}${r.website?`<span><a href="${esc(r.website)}" target="_blank" rel="noopener">website</a></span>`:""}</div>
      ${r.materials?`<p class="note"><b>Takes:</b> ${esc(r.materials)}</p>`:""}
      ${r.notes?`<p class="note">${esc(r.notes)}</p>`:""}
    </div></div>`;
}

function rfq(f,list,nets){
  const emails=[...new Set([...list,...nets].flatMap(r=>r.emails||[]))];
  const what = f.category==="cardboard"?"segregated cardboard (OCC)"
    : f.category==="rigid"?RATES[f.grade].label.toLowerCase()
    : f.category==="ewaste"?RATES[f.grade].label.replace(/^E-waste, /,"e-waste, ")
    : "QSR mixed waste (paper cups, food-soiled paper, wrappers, residual food)";
  const reg = f.category==="ewaste"
    ? "4. SPCB authorisation number and CPCB EPR (e-waste) registration number, and the handover document you will issue"
    : "4. Registration status (SPCB consent / CPCB EPR PWP, if applicable)";
  return `To (Bcc): ${emails.join(", ")||"add recipient emails"}
Subject: RFQ: ${f.tonnes} t ${CATS[f.category].toLowerCase()} available at ${f.locName}, ex-yard rate requested

Dear Sir/Madam,

ECOIL has the following lot ready for sale from its storage point in ${f.locName}:

Material: ${what}
Quantity: ${f.tonnes} tonnes (approx.)
Condition: ${f.notes||"to be shared on request"}
Pickup: buyer's vehicle from our yard

Please quote:
1. Rate per tonne, ex-yard (excluding transport and GST)
2. Payment terms and weighbridge arrangement
3. Earliest pickup date and minimum lot size
${reg}

${f.category==="qsr"?"If you cannot pay for this stream, please quote your gate fee per tonne instead.\n\n":""}Kindly reply within 3 working days.

Regards,
ECOIL, Punjab operations`;
}

$("#lotForm").addEventListener("submit",e=>{e.preventDefault();search()});
$("#copyRfq").addEventListener("click",()=>copyText($("#rfq").textContent));
$("#ewPost").addEventListener("click",()=>{$("#cat-ewaste").checked=true;syncGrade();$("#tonnes").value="1";$("#notes").value="Dismantling not done. Mixed IT and kitchen electronics, stored dry.";showTab("find");search()});

$("#saveLot").addEventListener("click",async()=>{
  if(!db||!lastSearch) return;
  const btn=$("#saveLot");btn.disabled=true;
  try{
    const R=RATES[lastSearch.grade||lastSearch.category];
    await db.collection("lots").add({...lastSearch,status:"Open",rateLo:R.lo,rateHi:R.hi,createdAt:new Date().toISOString()});
    toast("Lot saved");showTab("lots");
  }catch(err){toast(err.code==="quota_exceeded"?"Storage full. Delete old cancelled lots first.":"Could not save. Check your sharing level.");btn.disabled=false}
});

/* Lots */
function renderStages(){
  const n=s=>lots.filter(l=>l.status===s).length;
  $("#stOpen").textContent=n("Open");$("#stQuoted").textContent=n("Quoted");$("#stSold").textContent=n("Sold");$("#stCan").textContent=n("Cancelled");
  const t=lots.filter(l=>l.status==="Sold").reduce((a,l)=>a+Number(l.tonnes||0),0);
  $("#stSoldT").textContent=`${t.toLocaleString("en-IN")} t moved`;
}
/* Recycler choices for a lot: only agencies handling the lot's stream, nearest first */
function recOptions(l){
  const pool=recyclers.filter(r=>(r.categories||[]).includes(l.category));
  const hasLoc=isFinite(l.lat)&&isFinite(l.lng);
  const fac=pool.filter(r=>r.kind!=="network"&&r.lat!=null&&isFinite(r.lat))
    .map(r=>({r,km:hasLoc?hav(l.lat,l.lng,r.lat,r.lng)*ROAD:null}))
    .sort((a,b)=>(a.km??0)-(b.km??0)||a.r.name.localeCompare(b.r.name));
  const nets=pool.filter(r=>r.kind==="network");
  const cat=CATS[l.category]||l.category;
  return `<option value="">Choose ${esc(cat)} recycler (${fac.length+nets.length})</option>`
    +(fac.length?`<optgroup label="Nearest to ${esc(l.locName)}">${fac.map(x=>`<option value="${esc(x.r.name)}">${esc(x.r.name)}${x.km!=null?` · ${Math.round(x.km)} km`:""}</option>`).join("")}</optgroup>`:"")
    +(nets.length?`<optgroup label="Networks">${nets.map(r=>`<option value="${esc(r.name)}">${esc(r.name)}</option>`).join("")}</optgroup>`:"")
    +`<option value="__other">Other recycler (type name)</option>`;
}
function renderLots(){
  $("#lotCount").textContent=lots.length;
  renderStages();
  const flt=$("#lotFilter").value;
  const L=lots.filter(l=>flt==="all"||l.status===flt);
  if(!db){$("#lotList").innerHTML=`<div class="empty">Lots and quotes are saved in the database. Connect Upstash Redis in Vercel (see README) to start the log.</div>`;return}
  if(!L.length){$("#lotList").innerHTML=`<div class="empty">No lots ${flt==="all"?"posted yet":"with this status"}. Run a search in Find &amp; post lot, then press Save lot to start the log.</div>`;return}
  $("#lotList").innerHTML=L.map(l=>{
    const qs=quotes.filter(q=>q.lotId===l.id).sort((a,b)=>b.rate-a.rate);
    const best=qs[0];
    return `<div class="lot" data-lot="${esc(l.id)}">
      <div class="lothead">
        <div class="row" style="gap:10px"><h3>${esc(l.locName)} · ${Number(l.tonnes).toLocaleString("en-IN")} t</h3><span class="chip c-${esc(l.category)}">${CATS[l.category]||esc(l.category)}</span><span class="pill p-${esc(l.status)}">${esc(l.status)}</span></div>
        <span class="muted mono" style="font-size:.8rem">${new Date(l.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span>
      </div>
      <p class="note">${esc(l.notes||"")}</p>
      <p class="note">Benchmark ${inr(l.rateLo)} to ${inr(l.rateHi)} per t${best?` · Best quote <b class="mono">${inr(best.rate)}/t</b> from ${esc(best.recycler)} = <b class="mono">${inr(best.rate*l.tonnes)}</b> for the lot`:" · No quotes logged"}</p>
      ${qs.length?`<div class="scroll" style="margin-top:10px"><table><thead><tr><th>Recycler</th><th class="num">₹/t ex-yard</th><th class="num">Lot value</th><th>Terms / validity</th><th></th></tr></thead><tbody>${qs.map(q=>`<tr><td>${esc(q.recycler)}</td><td class="num">${inr(q.rate)}</td><td class="num">${inr(q.rate*l.tonnes)}</td><td>${esc(q.terms||"")}</td><td>${canWrite?`<button class="copy" type="button" data-delq="${esc(q.id)}">remove</button>`:""}</td></tr>`).join("")}</tbody></table></div>`:""}
      ${canWrite?`<form class="row qform" style="margin-top:12px" data-lotid="${esc(l.id)}">
        <select name="rec" class="recsel" style="flex:2 1 220px" id="q-rec-${esc(l.id)}">${recOptions(l)}</select>
        <input name="recOther" placeholder="Recycler name" style="flex:2 1 180px" hidden id="q-other-${esc(l.id)}">
        <input name="rate" type="number" placeholder="₹ per t" style="flex:1 1 110px" required id="q-rate-${esc(l.id)}">
        <input name="terms" placeholder="Payment terms, valid till" style="flex:2 1 180px" id="q-terms-${esc(l.id)}">
        <button class="btn small" type="submit">Log quote</button>
        <select class="stsel" data-lotid="${esc(l.id)}" style="width:auto" id="q-st-${esc(l.id)}">${["Open","Quoted","Sold","Cancelled"].map(s=>`<option ${s===l.status?"selected":""}>${s}</option>`).join("")}</select>
      </form>`:""}
    </div>`}).join("");
}
$("#lotFilter").addEventListener("change",renderLots);
$("#lotList").addEventListener("submit",async e=>{
  const f=e.target.closest(".qform");if(!f)return;e.preventDefault();
  const name=f.rec.value==="__other"?f.recOther.value.trim():f.rec.value;
  if(!name){toast("Choose the recycler that quoted");return}
  const rate=parseFloat(f.rate.value);if(!isFinite(rate)){toast("Enter the rate per tonne");return}
  try{
    await db.collection("quotes").add({lotId:f.dataset.lotid,recycler:name,rate,terms:f.terms.value.trim(),createdAt:new Date().toISOString()});
    const lot=lots.find(l=>l.id===f.dataset.lotid);
    if(lot&&lot.status==="Open") await db.doc("lots/"+lot.id).update({status:"Quoted"});
    toast("Quote logged");
  }catch(err){toast("Could not log the quote")}
});
$("#lotList").addEventListener("change",async e=>{
  const rs=e.target.closest(".recsel");
  if(rs){const o=rs.form.recOther;o.hidden=rs.value!=="__other";if(!o.hidden)o.focus();return}
  const s=e.target.closest(".stsel");if(!s)return;
  try{await db.doc("lots/"+s.dataset.lotid).update({status:s.value});toast("Status set to "+s.value)}catch(err){toast("Could not update status")}
});
$("#lotList").addEventListener("click",async e=>{
  const b=e.target.closest("[data-delq]");if(!b)return;
  if(b.dataset.armed!=="1"){b.dataset.armed="1";b.textContent="confirm";setTimeout(()=>{b.dataset.armed="";b.textContent="remove"},3000);return}
  try{await db.doc("quotes/"+b.dataset.delq).delete();toast("Quote removed")}catch(err){toast("Could not remove")}
});

/* E-waste page */
function renderEw(){
  const all=recyclers.filter(r=>(r.categories||[]).includes("ewaste"));
  $("#ewCount").textContent=all.length;
  const s=$("#ewState").value;
  const R=all.filter(r=>s==="all"||r.state===s).sort((a,b)=>(a.state||"").localeCompare(b.state||"")||a.name.localeCompare(b.name));
  if(!R.length){$("#ewBody").innerHTML=`<tr><td colspan="7"><div class="empty" style="border:0">${db?"No e-waste agencies on file for this state yet.":"The agency list could not be loaded."}</div></td></tr>`;return}
  $("#ewBody").innerHTML=R.map(r=>`<tr>
    <td><b>${esc(r.name)}</b>${r.notes?`<div class="note">${esc(r.notes)}</div>`:""}</td>
    <td>${esc(r.agencyType||"Recycler")}</td>
    <td>${esc(r.city||"")}${r.address?`<div class="note">${esc(r.address)}</div>`:""}</td>
    <td class="num">${r.capacityT?Number(r.capacityT).toLocaleString("en-IN"):"n/a"}</td>
    <td class="mono" style="white-space:nowrap">${(r.phones||[]).map(esc).join("<br>")||"n/a"}</td>
    <td class="mono">${(r.emails||[]).map(esc).join("<br>")||"n/a"}</td>
    <td><b class="${vClass(r.verification)}">${esc(r.listStatus||r.verification||"")}</b>${(r.sources||[]).map((u,i)=>`<div><a href="${esc(u)}" target="_blank" rel="noopener" style="font-size:.8rem">source ${i+1}</a></div>`).join("")}</td></tr>`).join("");
}
$("#ewState").addEventListener("change",renderEw);
$("#ewRateBody").innerHTML=EW_KEYS.map(k=>{const r=RATES[k];return `<tr><td><b>${esc(r.label.replace(/^E-waste, /,""))}</b></td><td class="num">${inr(r.lo/1000)}</td><td class="num">${inr(r.hi/1000)}</td><td style="max-width:46ch">${esc(r.basis)} <span class="muted">[${r.src.join(", ")}]</span></td><td style="white-space:nowrap">${esc(r.asof)}</td></tr>`}).join("");

/* Directory */
function renderDir(){
  $("#dirCount").textContent=recyclers.length;
  const c=$("#dirCat").value;
  const R=recyclers.filter(r=>c==="all"||(r.categories||[]).includes(c)).sort((a,b)=>(a.kind==="network")-(b.kind==="network")||(a.state||"").localeCompare(b.state||"")||a.name.localeCompare(b.name));
  if(!R.length){$("#dirBody").innerHTML=`<tr><td colspan="7"><div class="empty" style="border:0">${db?"No recyclers for this stream yet. Add one below.":"The directory could not be loaded."}</div></td></tr>`;return}
  $("#dirBody").innerHTML=R.map(r=>{const v=r.verification||"Contact pending";
    return `<tr><td><b>${esc(r.name)}</b>${r.website?`<br><a href="${esc(r.website)}" target="_blank" rel="noopener" style="font-size:.82rem">${esc(r.website.replace(/^https?:\/\/(www\.)?/,"").replace(/\/$/,""))}</a>`:""}${r.materials?`<div class="note">${esc(r.materials)}</div>`:""}</td>
    <td>${(r.categories||[]).map(x=>`<span class="chip c-${x}">${CATS[x]}</span>`).join(" ")}</td>
    <td>${esc(r.kind==="network"?"Pan-India network":(r.city||""))}${r.address?`<div class="note">${esc(r.address)}</div>`:""}${r.coordNote?`<div class="note">${esc(r.coordNote)}</div>`:""}</td>
    <td class="mono" style="white-space:nowrap">${(r.phones||[]).map(esc).join("<br>")||"n/a"}</td>
    <td class="mono">${(r.emails||[]).map(esc).join("<br>")||"n/a"}</td>
    <td>${esc(r.capacity||(r.capacityT?Number(r.capacityT).toLocaleString("en-IN")+" t/yr":""))}</td>
    <td><b class="${vClass(v)}">${esc(v)}</b><div class="note">${esc(r.checkedOn||"")}</div>${(r.sources||[]).map((s,i)=>`<a href="${esc(s)}" target="_blank" rel="noopener" style="font-size:.8rem">src ${i+1}</a>`).join(" ")}${r.notes?`<div class="note">${esc(r.notes)}</div>`:""}</td></tr>`}).join("");
}
$("#dirCat").addEventListener("change",renderDir);
$("#addRec").addEventListener("submit",async e=>{
  e.preventDefault(); if(!db||!canWrite){toast("Connect the database to add recyclers");return}
  const cats=["cardboard","rigid","qsr","ewaste"].filter(c=>$("#rc-"+c).checked);
  if(!cats.length){toast("Tick at least one stream");return}
  const split=s=>s.split(",").map(x=>x.trim()).filter(Boolean);
  const city=$("#rCity").value.trim();
  try{
    await db.collection("recyclers").add({name:$("#rName").value.trim(),kind:"facility",city,state:(city.split(",")[1]||"").trim(),lat:parseFloat($("#rLat").value),lng:parseFloat($("#rLng").value),categories:cats,phones:split($("#rPhone").value),emails:split($("#rEmail").value),materials:$("#rNote").value.trim(),verification:"Verified",checkedOn:"Added by team "+new Date().toLocaleDateString("en-IN"),sources:[]});
    e.target.reset();toast("Recycler added");
  }catch(err){toast("Could not add the recycler")}
});

/* Rates */
$("#rateBody").innerHTML=["cardboard","pet","hdpe","mixed","qsr",...EW_KEYS].map(k=>{const r=RATES[k];return `<tr><td><b>${esc(r.label)}</b></td><td class="num">${inr(r.lo)}</td><td class="num">${inr(r.hi)}</td><td style="max-width:46ch">${esc(r.basis)} <span class="muted">[${r.src.join(", ")}]</span></td><td style="white-space:nowrap">${esc(r.asof)}</td></tr>`}).join("");
$("#srcList").innerHTML=SOURCES.map(s=>`<li><a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a></li>`).join("");

/* Data layer: Vercel API routes backed by Upstash Redis */
function setStatus(on,text){$("#dbDot").classList.toggle("on",on);$("#dbText").textContent=text}
function renderAll(){renderDir();renderLots();renderEw()}
function getKey(){try{return localStorage.getItem("portalKey")||""}catch(e){return ""}}
function setKey(k){try{localStorage.setItem("portalKey",k)}catch(e){}}
async function api(path,{method="GET",body}={}){
  const headers={"content-type":"application/json"};const k=getKey();if(k)headers["x-portal-key"]=k;
  const r=await fetch(path,{method,headers,body:body?JSON.stringify(body):undefined});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(j.error||r.statusText);e.code=j.code||String(r.status);throw e}
  return j;
}
async function refresh(fromPoll){
  const d=await api("/api/data");
  recyclers=d.recyclers||[];quotes=d.quotes||[];
  lots=(d.lots||[]).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  const busy=fromPoll&&document.activeElement&&document.activeElement.closest&&document.activeElement.closest(".qform,#addRec,#lotForm");
  if(busy)return;
  renderAll();if(lastSearch)search();
}
function makeDb(){
  return{
    collection:c=>({add:async data=>{const r=await api(`/api/${c}`,{method:"POST",body:data});await refresh();return r}}),
    doc:p=>{const[c,id]=p.split("/");const u=`/api/${c}?id=${encodeURIComponent(id)}`;return{
      update:async data=>{await api(u,{method:"PATCH",body:data});await refresh()},
      delete:async()=>{await api(u,{method:"DELETE"});await refresh()}}}
  };
}
let pollTimer=null;
async function boot(){
  try{
    await refresh();
    db=makeDb();canWrite=true;$("#keyBox").hidden=true;
    setStatus(true,"Database connected");renderAll();search();
    if(!pollTimer)pollTimer=setInterval(()=>{if(db&&document.visibilityState==="visible")refresh(true).catch(()=>{})},20000);
  }catch(err){
    db=null;canWrite=false;
    if(err.code==="unauthorized"){$("#keyBox").hidden=false;setStatus(false,getKey()?"Access key not accepted":"Enter the access key to load data");return}
    try{const r=await fetch("/data/recyclers.json");if(r.ok)recyclers=await r.json()}catch(e){}
    setStatus(false,err.code==="no_database"?"Database not connected. Directory is read-only.":"Server unreachable. Directory is read-only.");
    renderAll();search();
  }
}
$("#keyBox").addEventListener("submit",e=>{e.preventDefault();setKey($("#keyInput").value.trim());$("#keyInput").value="";boot()});
renderAll();search();boot();
