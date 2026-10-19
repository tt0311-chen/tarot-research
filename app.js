import {DECKS,cardInfo,deckCardIds} from './decks.js';
import {shuffleWholeDeck,reshuffleRemaining,drawNext} from './shuffle.js';
import {dbPut,dbGet,dbAll,dbInsertIfMissing} from './storage.js';

const $=selector=>document.querySelector(selector);
let current=null;
let toastTimeout;
const safe=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmtDate=date=>{try{return new Date(date).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});}catch{return String(date||'');}};
const uid=()=>crypto.randomUUID?crypto.randomUUID():`${Date.now().toString(36)}-${Array.from(crypto.getRandomValues(new Uint32Array(3))).join('-')}`;
const deckNames=ids=>ids.map(id=>DECKS[id].short).join('、');

function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),3300);}
function setSaved(message){$('#save-status').textContent=message;}
function switchView(name){
  for(const button of document.querySelectorAll('[data-view]'))button.classList.toggle('active',button.dataset.view===name);
  for(const view of document.querySelectorAll('.view'))view.classList.toggle('active',view.id===`${name}-view`);
  if(name==='history')renderHistory().catch(showError);
  if(name==='backup')renderBackupStats().catch(showError);
  window.scrollTo({top:0,behavior:'smooth'});
}
function showError(e){console.error(e);toast(`操作失敗：${e?.message||e}`);}
async function persist(){
  if(!current)return;
  current.updatedAt=new Date().toISOString();
  await dbPut(current);
  setSaved(`已儲存 · ${fmtDate(current.updatedAt)}`);
}
function newSessionForm(){current=null;$('#setup-panel').classList.remove('hidden');$('#active-session').classList.add('hidden');$('#active-session').innerHTML='';switchView('draw');}

async function createSession(evt){
  evt.preventDefault();
  const title=$('#session-title').value.trim(),question=$('#session-question').value.trim();
  const lines=$('#session-positions').value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
  const keys=[...document.querySelectorAll('input[name=systems]:checked')].map(el=>el.value);
  if(!title||!question){toast('請先輸入標題與完整問題');return;}
  if(!keys.length){toast('請至少選一套牌');return;}
  if(!lines.length||lines.length>20){toast('牌位需要 1 至 20 個');return;}
  const positions=lines.map((line,i)=>{
    const parts=line.split('｜');
    return {id:`p${i+1}`,label:(parts.shift()||`位置 ${i+1}`).trim(),question:parts.join('｜').trim()};
  });
  const decks={};
  for(const key of keys){
    const stack=shuffleWholeDeck();
    stack.main=positions.map(()=>drawNext(stack));
    decks[key]=stack;
  }
  current={version:1,id:uid(),title,question,positions,bottomQuestion:$('#bottom-question').value.trim(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),decks,clarifiers:[],notes:[]};
  try{await persist();renderSession();toast('三套牌堆已建立，底牌與正逆位已固定');}catch(e){showError(e);}
}

function cardMarkup(deckId,card,bottom=false){
  const info=cardInfo(deckId,card.id);
  const reversed=card.reversed;
  const reversedInterpretation=DECKS[deckId].reverseMeaningDefault;
  const orientation=reversed?'逆位':'正位';
  return `<div class="card-tile" data-system="${deckId}"><div class="card-system"><span class="dot ${deckId}"></span>${safe(DECKS[deckId].short)}${bottom?' · 底牌':''}</div><div class="card-face" title="${safe(info.zh)} ${orientation}"><div class="face-inner ${reversed?'upside-down':''}"><div class="face-rank">${info.kind==='major'?String(info.num).padStart(2,'0'):info.kind==='pip'?info.num:'✧'}</div><div class="face-symbol">${info.symbol}</div><div class="face-suit">✦ ✧ ✦</div></div></div><div class="card-name">${safe(info.zh)}</div><div class="card-en">${safe(info.en)}</div><div class="card-extra">${safe(info.subtitle)}</div><span class="card-orientation ${reversed?'reversed':''}">${orientation}</span>${reversed&&!reversedInterpretation?'<div class="card-extra">物理逆向 · 本系統預設不以逆位解義</div>':''}</div>`;
}
function cardsAt(session,index,kind='main'){
  return `<div class="card-grid">${Object.entries(session.decks).map(([key,deck])=>{
    const card=kind==='bottom'?deck.bottom:deck.main[index];
    return cardMarkup(key,card,kind==='bottom');
  }).join('')}</div>`;
}
function renderClarifiers(posIndex){
  const list=current.clarifiers.filter(item=>item.positionIndex===posIndex);
  return list.map((item,i)=>`<div class="clarifier-item"><div class="clarifier-head"><h4>補牌 ${i+1} <small class="muted">${safe(fmtDate(item.createdAt))}</small></h4><span class="clarifier-method">${item.method==='reshuffle'?'重新洗剩餘牌':'延續原牌序'}</span></div><p>${safe(item.question)}</p><div class="card-grid">${Object.entries(item.draws).map(([key,card])=>cardMarkup(key,card)).join('')}</div></div>`).join('');
}
function renderSession(){
  if(!current)return;
  $('#setup-panel').classList.add('hidden');$('#active-session').classList.remove('hidden');
  const deckIds=Object.keys(current.decks);
  const sessionHtml=`
  <div class="session-head"><div class="session-meta"><span>占卜 ${safe(fmtDate(current.createdAt))}</span><span>${safe(deckNames(deckIds))}</span><span>${current.positions.length} 張＋底牌／每套牌</span></div><h2>${safe(current.title)}</h2><p>${safe(current.question)}</p><div class="session-tools"><button type="button" data-action="fresh" class="btn ghost small">＋ 開始新占卜</button><button type="button" data-action="export-session" class="btn secondary small">⇩ 匯出本次 Markdown</button></div></div>
  <div class="section-title"><div><div class="step">02 · READING</div><h2>原始牌陣</h2><p>依洗好的固定牌序發牌；每一套牌完全獨立。</p></div></div>
  ${current.positions.map((pos,i)=>`<section class="position-block"><div class="position-head"><div><h3><span class="position-index">${String(i+1).padStart(2,'0')}</span>${safe(pos.label)}</h3>${pos.question?`<p>${safe(pos.question)}</p>`:''}</div><button type="button" class="btn ghost small" data-action="choose-clarifier" data-position="${i}">＋ 補牌</button></div>${cardsAt(current,i)}${renderClarifiers(i)}</section>`).join('')}
  <section class="bottom-panel"><h3>✧ 底牌 · 洗牌完成時固定</h3><p class="muted">${safe(current.bottomQuestion||'影響整體的深層因素')}</p>${cardsAt(current,0,'bottom')}</section>
  <div class="deck-stats">${deckIds.map(key=>`<span>${safe(DECKS[key].short)} · 剩餘 ${current.decks[key].remaining.length} 張 · 補洗 ${current.decks[key].shuffles.filter(s=>s.mode==='clarifier').length} 次</span>`).join('')}</div>
  <section class="clarifier-form hidden" id="clarifier-area"><h3>補牌 · 向牌再問清楚</h3><p>先寫好補問，才開始洗剩餘牌。已經翻開的原牌、先前補牌及原底牌不放回。</p><form id="clarifier-form" class="inline-form"><div class="form-row"><div><label for="clarifier-position">補問哪個位置？</label><select id="clarifier-position" required>${current.positions.map((pos,i)=>`<option value="${i}">${i+1}. ${safe(pos.label)}</option>`).join('')}</select></div><div><label for="clarifier-method">補牌洗牌方式</label><select id="clarifier-method"><option value="reshuffle">重新洗剩餘牌（預設）</option><option value="continue">直接抽下一張</option></select></div></div><label for="clarifier-question">補問完整原文</label><textarea id="clarifier-question" rows="3" required maxlength="10000" placeholder="例如：這張牌指的是想念，還是目前生活已經得到滿足？"></textarea><div class="field-title">使用牌系</div><div class="deck-select">${deckIds.map(key=>`<label><input type="checkbox" name="clarifier-systems" value="${key}" checked/><span class="dot ${key}"></span>${safe(DECKS[key].short)}</label>`).join('')}</div><div class="clarifier-actions"><button type="submit" class="btn primary">洗牌並抽補牌 →</button><button type="button" data-action="cancel-clarifier" class="btn ghost">取消</button></div></form></section>
  <section class="add-note"><h3>補充解讀與事後驗證</h3><p class="muted">只追加新紀錄，不覆蓋原問題與抽牌結果。</p><form id="note-form" class="inline-form"><label for="note-type">紀錄類型</label><select id="note-type"><option value="interpretation">牌面解讀</option><option value="reassessment">重新評估</option><option value="reality">現實事件／驗證</option></select><label for="note-text">紀錄原文</label><textarea id="note-text" rows="4" maxlength="30000" required placeholder="完整保留當時解讀，或記錄之後真正發生的事…"></textarea><div class="clarifier-actions"><button type="submit" class="btn secondary">＋ 追加紀錄</button></div></form>${current.notes.map(item=>`<div class="note-item"><small>${safe(fmtDate(item.at))} · ${safe(({interpretation:'牌面解讀',reassessment:'重新評估',reality:'現實事件／驗證'})[item.type]||item.type)}</small><p>${safe(item.text)}</p></div>`).join('')}</section>
  `;
  $('#active-session').innerHTML=sessionHtml;
}
function showClarifier(position){$('#clarifier-area').classList.remove('hidden');$('#clarifier-position').value=String(position);$('#clarifier-question').focus();$('#clarifier-area').scrollIntoView({behavior:'smooth',block:'center'});}
async function submitClarifier(e){
  e.preventDefault();
  if(!current)return;
  const pos=Number($('#clarifier-position').value);
  const question=$('#clarifier-question').value.trim();
  const method=$('#clarifier-method').value;
  const keys=[...document.querySelectorAll('input[name=clarifier-systems]:checked')].map(el=>el.value);
  if(!question||!keys.length||!current.positions[pos])return toast('請確認補問、牌位與至少一套牌');
  if(keys.some(key=>!current.decks[key]?.remaining.length))return toast('有牌系已無剩餘牌可抽');
  if(!confirm(`確認針對「${current.positions[pos].label}」補問？\n\n${question}\n\n方式：${method==='reshuffle'?'重新洗剩餘牌':'直接抽下一張'}\n\n抽出後不會覆蓋原牌。`))return;
  const draws={};
  for(const key of keys){
    const deck=current.decks[key];
    if(method==='reshuffle')reshuffleRemaining(deck);
    draws[key]=drawNext(deck);
  }
  current.clarifiers.push({id:uid(),createdAt:new Date().toISOString(),positionIndex:pos,question,method,draws});
  try{await persist();renderSession();document.querySelectorAll('.position-block')[pos].scrollIntoView({behavior:'smooth',block:'start'});toast('補牌已保存，原牌與底牌保持不變');}catch(e){showError(e);}
}
async function submitNote(e){
  e.preventDefault();if(!current)return;
  const type=$('#note-type').value,text=$('#note-text').value.trim();if(!text)return;
  current.notes.push({id:uid(),at:new Date().toISOString(),type,text});
  try{await persist();renderSession();toast('已追加紀錄，不覆蓋原始內容');}catch(e){showError(e);}
}
async function renderHistory(){
  const all=(await dbAll()).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const term=$('#history-search').value.trim().toLowerCase();
  const items=all.filter(s=>[s.title,s.question,...(s.positions||[]).map(p=>p.label)].join(' ').toLowerCase().includes(term));
  $('#history-list').innerHTML=items.length?items.map(s=>`<button type="button" class="history-card" data-open-session="${safe(s.id)}"><div class="history-meta">${safe(fmtDate(s.createdAt))} · ${s.positions?.length||0} 位置 · ${s.clarifiers?.length||0} 組補牌</div><h3>${safe(s.title)}</h3><p>${safe(s.question.slice(0,190))}${s.question.length>190?'…':''}</p></button>`).join(''):`<div class="empty"><span>◌</span>沒有符合的占卜紀錄</div>`;
}
async function openSession(id){try{const found=await dbGet(id);if(!found)throw Error('找不到這筆紀錄');current=found;switchView('draw');renderSession();}catch(e){showError(e);}}
async function renderBackupStats(){const all=await dbAll();const totalClarifiers=all.reduce((n,s)=>n+(s.clarifiers?.length||0),0);$('#backup-stats').textContent=`本機目前有 ${all.length} 場占卜、${totalClarifiers} 次補牌。最後備份時間不會由網站追蹤，請自行定期保存檔案。`;}
function download(name,text,mime){const blob=new Blob([text],{type:mime});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=name;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function csvCell(value){let v=String(value??'');if(/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replaceAll('"','""')+'"';}
function sessionMarkdown(s){
  const body=[`# ${s.title}`,`日期：${fmtDate(s.createdAt)}`,`原問題：\n${s.question}`,`牌系：${deckNames(Object.keys(s.decks))}`,'', '## 原始牌陣'];
  for(const [i,p] of s.positions.entries()){
    body.push(`### ${i+1}. ${p.label}`,p.question||'');
    for(const [key,deck] of Object.entries(s.decks)){
      const card=deck.main[i],info=cardInfo(key,card.id);
      body.push(`- ${DECKS[key].short}：${info.zh} (${info.en})｜${card.reversed?'逆位':'正位'}`);
    }
    const clarifiers=s.clarifiers.filter(c=>c.positionIndex===i);
    for(const [k,c] of clarifiers.entries()){
      body.push(`\n補牌 ${k+1}（${fmtDate(c.createdAt)}｜${c.method==='reshuffle'?'重新洗剩餘牌':'連續抽取'}）：\n${c.question}`);
      for(const [key,card] of Object.entries(c.draws)){
        const info=cardInfo(key,card.id);
        body.push(`- ${DECKS[key].short}：${info.zh} (${info.en})｜${card.reversed?'逆位':'正位'}`);
      }
    }
    body.push('');
  }
  body.push('## 底牌',s.bottomQuestion||'');
  for(const [key,deck] of Object.entries(s.decks)){
    const info=cardInfo(key,deck.bottom.id),card=deck.bottom;
    body.push(`- ${DECKS[key].short}：${info.zh} (${info.en})｜${card.reversed?'逆位':'正位'}`);
  }
  if(s.notes.length){body.push('','## 解讀及現實驗證（追加紀錄）');for(const note of s.notes)body.push(`### ${fmtDate(note.at)} · ${note.type}`,note.text,'');}
  body.push('','> 本紀錄的塔羅牌僅屬象徵解讀，並非對其他人內心狀態的客觀確認。');
  return body.join('\n');
}
async function exportAll(kind){
  try{
    const all=(await dbAll()).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
    const day=new Date().toISOString().slice(0,10);
    if(kind==='json')download(`tarot-backup-${day}.json`,JSON.stringify({format:'tarot-research-private-v1',version:1,exportedAt:new Date().toISOString(),sessions:all},null,2),'application/json;charset=utf-8');
    else if(kind==='md')download(`tarot-history-${day}.md`,all.map(sessionMarkdown).join('\n\n---\n\n'),'text/markdown;charset=utf-8');
    else if(kind==='csv'){
      const rows=[['id','date','title','question','decks','positions','clarifiers'],...all.map(s=>[s.id,s.createdAt,s.title,s.question,Object.keys(s.decks).join(';'),s.positions.length,s.clarifiers.length])];
      download(`tarot-index-${day}.csv`,'\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');
    }
    toast(`已產生 ${kind.toUpperCase()} 檔案`);
  }catch(e){showError(e);}
}
function validImportEntry(s){
  if(!s||typeof s!=='object'||typeof s.id!=='string'||s.id.length>100||!s.createdAt||!Array.isArray(s.positions)||!s.positions.length||!s.decks||typeof s.question!=='string'||!Array.isArray(s.clarifiers)||!Array.isArray(s.notes))return false;
  const ids=new Set(deckCardIds());
  for(const [key,d] of Object.entries(s.decks)){
    if(!DECKS[key]||!d||!Array.isArray(d.main)||d.main.length!==s.positions.length||!Array.isArray(d.remaining)||!d.bottom||!Array.isArray(d.shuffles))return false;
    const cardList=[...d.main,d.bottom,...d.remaining,...s.clarifiers.flatMap(c=>c.draws?.[key]?[c.draws[key]]:[])];
    if(cardList.some(c=>!c||!ids.has(c.id)||typeof c.reversed!=='boolean'))return false;
    if(cardList.length!==78||new Set(cardList.map(c=>c.id)).size!==78)return false;
  }
  return true;
}
async function importJSON(){
  const input=$('#import-file'),file=input.files?.[0];if(!file)return toast('請先選擇 JSON 備份檔');
  try{
    const text=await file.text();if(text.length>70_000_000)throw Error('檔案超過 70MB');
    const data=JSON.parse(text);
    if(data?.format!=='tarot-research-private-v1'||data.version!==1||!Array.isArray(data.sessions))throw Error('不是相容的 Tarot Research JSON 備份');
    if(data.sessions.some(s=>!validImportEntry(s)))throw Error('備份內容不完整，或牌堆有重複／缺漏，已拒絕匯入');
    if(!confirm(`即將匯入 ${data.sessions.length} 場占卜。\n相同 ID 會跳過，不會覆寫舊紀錄。\n\n確定繼續？`))return;
    let added=0;
    for(const session of data.sessions)if(await dbInsertIfMissing(session))added++;
    input.value='';await renderBackupStats();toast(`匯入完成：新增 ${added} 場、略過 ${data.sessions.length-added} 場`);
  }catch(e){showError(e);}
}

function initEvents(){
  for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>switchView(button.dataset.view));
  $('#new-form').addEventListener('submit',createSession);
  $('#history-search').addEventListener('input',()=>renderHistory().catch(showError));
  $('#history-list').addEventListener('click',e=>{const card=e.target.closest('[data-open-session]');if(card)openSession(card.dataset.openSession);});
  $('#active-session').addEventListener('click',e=>{
    const btn=e.target.closest('[data-action]');if(!btn)return;
    if(btn.dataset.action==='fresh')newSessionForm();
    else if(btn.dataset.action==='choose-clarifier')showClarifier(Number(btn.dataset.position));
    else if(btn.dataset.action==='cancel-clarifier')$('#clarifier-area').classList.add('hidden');
    else if(btn.dataset.action==='export-session')download(`tarot-${current.id.slice(0,8)}.md`,sessionMarkdown(current),'text/markdown;charset=utf-8');
  });
  $('#active-session').addEventListener('submit',e=>{
    if(e.target.id==='clarifier-form')submitClarifier(e);
    if(e.target.id==='note-form')submitNote(e);
  });
  $('#export-json').addEventListener('click',()=>exportAll('json'));
  $('#export-md').addEventListener('click',()=>exportAll('md'));
  $('#export-csv').addEventListener('click',()=>exportAll('csv'));
  $('#import-json').addEventListener('click',importJSON);
}

async function bootstrap(){
  initEvents();
  try{
    if(!('indexedDB'in window))throw Error('此瀏覽器不支援 IndexedDB');
    const items=(await dbAll()).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
    if(items.length){current=items[0];renderSession();setSaved(`已載入最近紀錄 · ${fmtDate(current.updatedAt)}`);}else setSaved('本機資料庫已就緒');
  }catch(e){showError(e);setSaved('儲存空間不可用：建議使用 HTTPS 網站');}
  if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(console.error);
}
bootstrap();
