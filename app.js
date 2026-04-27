/* ============================================================
   제주항공 비상훈련 롤플레잉 — app.js
   ============================================================ */

// 🔥 FIREBASE 설정 — 본인의 프로젝트 값으로 교체되어 있어야 합니다!
const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

const PHASES = [
  { id: 1, title: "주의집중 방송", instruction: "당신은 음악을 듣고 있는 승객입니다.\n이어폰을 착용하고 계속 음악을 듣고 있으세요.\n승무원의 별도 지시가 있을 때까지 역할을 유지하세요.", question: null, evalCriteria: ["이어폰 착용 승객에게 개별 접근하여 주의를 환기시켰는가", "명확하고 침착한 목소리로 안내했는가", "승객과 적절한 아이컨택을 유지했는가"] },
  { id: 2, title: "서비스 용품 수거 및 승객 좌석 점검", instruction: "좌석에 착석한 후 등받이를 뒤로 젖혀주세요.\n승무원의 별도 지시가 있을 때까지 그대로 유지하세요.", question: null, evalCriteria: ["서비스 용품을 신속하게 수거했는가", "등받이가 젖혀진 승객에게 원위치를 요청했는가", "정중하고 단호한 어조로 요청을 전달했는가"] },
  { id: 3, title: "탈출차림 준비 및 수하물 정리·보관", instruction: "소지한 가방을 선반에 넣으려 하지만 선반에 공간이 없습니다.\n앉지 말고 두리번거리며 승무원의 지시를 기다리세요.", question: null, evalCriteria: ["수하물 정리 안내를 명확하게 전달했는가", "선반 공간이 없는 승객에게 적절한 대안을 제시했는가", "탈출 시 방해가 되는 물품을 조치했는가"] },
  { id: 4, title: "좌석벨트 착용", instruction: "좌석벨트를 풀어보려 하지만 잘 풀어지지 않아 버클 부분을 계속 만지작거리세요.\n승무원의 별도 지시가 있을 때까지 역할을 유지하세요.", question: "저, 죄송한데요. 좌석벨트가 잘 안 풀려요.\n어떻게 푸는 건가요? 그리고 언제 풀어도 되나요?", evalCriteria: ["착용 및 해제 방법을 정확하게 시범 보였는가", "미착용 승객에게 적절한 조치를 했는가", "해제 가능 시점에 대해 명확히 설명했는가"] },
  { id: 5, title: "충격방지자세", instruction: "충격방지자세를 언제 취해야 하는지 모릅니다.\n승무원이 지나갈 때 손을 들거나 질문하세요.", question: "저, 충격방지자세는 언제 취해야 하나요?\n방법도 알려주실 수 있나요?", evalCriteria: ["충격방지자세를 정확하게 시범 보였는가", "자세를 취해야 하는 시점을 명확히 설명했는가", "승객이 자세를 올바르게 취하는지 확인했는가"] },
  { id: 6, title: "탈출구 위치 안내 (착수 시)", instruction: "항공기 후방 승객입니다. 뒤쪽 탈출구가 가깝지만 왜 사용 불가능한지 궁금합니다.", question: "저 뒤쪽에도 탈출구가 있는데, 왜 사용할 수 없다고 하나요?\n이유를 설명해 주실 수 있어요?", evalCriteria: ["각 탈출구 위치와 사용 가능 여부를 명확하게 안내했는가", "착수 시 사용 불가 탈출구에 대한 이유를 설명했는가", "대체 탈출구로 승객을 유도했는가"] },
  { 
    id: 7, 
    title: "협조자 선정", 
    instruction: [
      "당사 직원 티켓으로 탑승한 승무원입니다.\n승무원이 지나갈 때 손을 드세요.",
      "당신은 경찰관 입니다.\n승무원이 지나갈 때 손을 드세요.",
      "당신은 소방관 입니다.\n승무원이 지나갈 때 손을 드세요."
    ], 
    question: null, 
    evalCriteria: ["비상시 협조 가능한 승객을 적극적으로 찾았는가", "협조자에게 명확한 역할과 임무를 부여했는가", "협조자와 효과적인 소통을 유지했는가"] 
  }
];

const EMOJI_MAP = { 
  1: '<i class="ph-duotone ph-smiley-angry"></i>', 
  2: '<i class="ph-duotone ph-smiley-sad"></i>', 
  3: '<i class="ph-duotone ph-smiley-meh"></i>', 
  4: '<i class="ph-duotone ph-smiley"></i>', 
  5: '<i class="ph-duotone ph-star"></i>' 
};
const SCORE_LABEL = { 1: '매우 불만족', 2: '불만족', 3: '보통', 4: '만족', 5: '매우 만족' };

let db = null;
let fbReady = false;
let state = { evaluatorName: '', traineeName: '', date: '', currentPhase: 0, evaluations: {}, selectedInstructions: {} };

function initFirebase() {
  try {
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.firestore();
      fbReady = true;
      console.log('✅ Firebase 연결 성공');
    }
  } catch (e) {
    console.warn('⚠️ Firebase 연결 실패 (오프라인 모드):', e.message);
  }
}

async function startSession() {
  const eName = document.getElementById('input-evaluator-name').value.trim();
  const tName = document.getElementById('input-trainee-name').value.trim();
  const date = document.getElementById('input-date').value;
  if (!eName || !tName || !date) { alert('평가자, 대상 이름, 날짜를 모두 입력해주세요.'); return; }
  
  // 랜덤 지시사항 미리 결정 (세션 동안 고정)
  const selectedInstructions = {};
  PHASES.forEach(p => {
    if (Array.isArray(p.instruction)) {
      const idx = Math.floor(Math.random() * p.instruction.length);
      selectedInstructions[p.id] = p.instruction[idx];
    }
  });

  state = { evaluatorName: eName, traineeName: tName, date, currentPhase: 0, evaluations: {}, selectedInstructions };
  hideAllScreens();
  document.getElementById('screen-main').classList.add('active');
  document.getElementById('header-names').innerHTML = `<i class="ph-fill ph-user"></i> ${eName} <i class="ph-bold ph-caret-right"></i> <i class="ph-fill ph-airplane-tilt"></i> ${tName}`;
  buildPhaseNav();
  if (fbReady) await loadSessionFromFirestore();
  renderPhase(0);
}

function renderPhase(index) {
  const phase = PHASES[index];
  state.currentPhase = index;
  document.getElementById('phase-number').textContent = phase.id;
  document.getElementById('phase-title').textContent = phase.title;
  
  // 지시사항 결정 (배열인 경우 미리 결정된 값 사용)
  const instruction = Array.isArray(phase.instruction) 
    ? state.selectedInstructions[phase.id] 
    : phase.instruction;
    
  document.getElementById('instruction-text').textContent = instruction;
  const qBox = document.getElementById('question-box');
  if (phase.question) {
    document.getElementById('question-text').textContent = phase.question;
    qBox.style.display = 'block';
  } else {
    qBox.style.display = 'none';
  }
  document.querySelectorAll('.emoji-btn').forEach(b => {
    b.classList.remove('selected');
    const existingScore = state.evaluations[phase.id]?.score;
    if (existingScore && parseInt(b.dataset.score) === existingScore) b.classList.add('selected');
  });
  document.getElementById('phase-indicator').textContent = `${index + 1} / ${PHASES.length}`;
  document.getElementById('btn-prev').disabled = index === 0;
  document.getElementById('btn-next').disabled = index === PHASES.length - 1;
  updatePhaseNavActive(index);
  document.querySelector('.scroll-content').scrollTo(0, 0);
}

async function setRatingAndSave(score) {
  const phaseId = PHASES[state.currentPhase].id;
  state.evaluations[phaseId] = { score, phaseTitle: PHASES[state.currentPhase].title, timestamp: new Date().toISOString() };
  
  document.querySelectorAll('.emoji-btn').forEach(b => {
    b.classList.remove('selected');
    if (parseInt(b.dataset.score) === score) b.classList.add('selected');
  });

  if (fbReady) {
    const docId = `${state.date}_${state.traineeName}_${state.evaluatorName}`;
    try {
      await db.collection('evaluations').doc(docId).set({
        trainee: state.traineeName, evaluator: state.evaluatorName, date: state.date, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      await db.collection('evaluations').doc(docId).collection('phases').doc(String(phaseId)).set({
        score, phaseTitle: PHASES[state.currentPhase].title, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) { console.error("저장 실패:", e); }
  }

  markPillDone(state.currentPhase);
  const toast = document.getElementById('save-toast');
  if (toast) {
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 800);
  }

  setTimeout(() => {
    if (state.currentPhase < PHASES.length - 1) changePhase(1);
    else showSummary();
  }, 400);
}

function changePhase(delta, direct) {
  const next = direct !== undefined ? direct : state.currentPhase + delta;
  if (next >= 0 && next < PHASES.length) renderPhase(next);
}

function confirmEndTraining() {
  if (confirm('훈련을 종료하고 결과를 보시겠습니까?')) showSummary();
}

function showSummary() {
  hideAllScreens();
  document.getElementById('screen-summary').classList.add('active');
  const container = document.getElementById('summary-content');
  let listHtml = PHASES.map(p => {
    const ev = state.evaluations[p.id];
    return `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid var(--border);">
        <span style="font-size:14px; font-weight:600;">${p.id}. ${p.title}</span>
        <div style="display:flex; align-items:center; gap:8px;">
          ${ev ? EMOJI_MAP[ev.score] : '<i class="ph ph-minus" style="color:var(--text-secondary)"></i>'}
          <span style="font-size:12px; font-weight:700; color:var(--jeju-orange); min-width:45px; text-align:right;">${ev ? SCORE_LABEL[ev.score] : '미평가'}</span>
        </div>
      </div>
    `;
  }).join('');
  container.innerHTML = `
    <div class="summary-header-info">
      <h2><i class="ph-fill ph-airplane-tilt"></i> ${state.traineeName} 결과</h2>
      <p>평가자: ${state.evaluatorName} | ${state.date}</p>
    </div>
    <div class="summary-card">${listHtml}</div>
  `;
}

async function promptAdminLogin() {
  const pw = prompt("관리자 비밀번호를 입력하세요.");
  if (pw === "Jeju@ir1") {
    hideAllScreens();
    document.getElementById('screen-admin').classList.add('active');
    await loadAdminData();
  }
}

let adminDataCache = [];
async function loadAdminData() {
  if (!fbReady) return;
  showLoadingOverlay(true);
  try {
    const snap = await db.collection('evaluations').orderBy('date', 'desc').get();
    const list = document.getElementById('admin-date-list');
    list.innerHTML = '';
    adminDataCache = [];
    const dateGroups = {};
    for (const doc of snap.docs) {
      const meta = doc.data();
      const phasesSnap = await doc.ref.collection('phases').get();
      const phases = {};
      phasesSnap.forEach(p => phases[p.id] = p.data());
      const record = { ...meta, phases };
      adminDataCache.push(record);
      dateGroups[meta.date] = (dateGroups[meta.date] || 0) + 1;
    }
    Object.keys(dateGroups).sort().reverse().forEach(date => {
      const item = document.createElement('div');
      item.className = 'admin-data-item';
      item.innerHTML = `
        <div><div style="font-weight:800; font-size:16px;">${date}</div><div style="font-size:13px; color:var(--text-secondary); margin-top:4px;">훈련 기록: ${dateGroups[date]}건</div></div>
        <button class="btn-outline" style="width:auto; padding:8px 12px; font-size:13px;" onclick="exportDateToExcel('${date}')">엑셀 받기</button>
      `;
      list.appendChild(item);
    });
  } finally { showLoadingOverlay(false); }
}

function exportDateToExcel(date) {
  const filtered = adminDataCache.filter(r => r.date === date);
  const rows = filtered.map(r => {
    const row = { '훈련일자': r.date, '평가자': r.evaluator, '피평가자': r.trainee };
    PHASES.forEach(p => { row[`${p.id}. ${p.title}`] = r.phases[p.id]?.score || '미평가'; });
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Result");
  XLSX.writeFile(wb, `제주항공_훈련결과_${date}.xlsx`);
}

function downloadAllExcel() {
  const rows = adminDataCache.map(r => {
    const row = { '훈련일자': r.date, '평가자': r.evaluator, '피평가자': r.trainee };
    PHASES.forEach(p => { row[`${p.id}. ${p.title}`] = r.phases[p.id]?.score || '미평가'; });
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Total");
  XLSX.writeFile(wb, `제주항공_훈련결과_전체.xlsx`);
}

function buildPhaseNav() {
  const nav = document.getElementById('phase-nav');
  if (nav) nav.innerHTML = PHASES.map((p, i) => `<button class="phase-pill ${i===0?'active':''}" onclick="changePhase(null, ${i})" data-index="${i}">${p.id}. ${p.title}</button>`).join('');
}
function updatePhaseNavActive(idx) {
  const pills = document.querySelectorAll('.phase-pill');
  pills.forEach((p, i) => p.classList.toggle('active', i === idx));
  const activePill = pills[idx];
  if (activePill && activePill.parentElement) activePill.parentElement.scrollTo({ left: activePill.offsetLeft - (activePill.parentElement.offsetWidth / 2) + (activePill.offsetWidth / 2), behavior: 'smooth' });
}
function markPillDone(idx) { document.querySelectorAll('.phase-pill')[idx]?.classList.add('done'); }
async function loadSessionFromFirestore() {
  if (!fbReady) return;
  const docId = `${state.date}_${state.traineeName}_${state.evaluatorName}`;
  try {
    const snap = await db.collection('evaluations').doc(docId).collection('phases').get();
    snap.forEach(doc => { state.evaluations[parseInt(doc.id)] = doc.data(); });
    PHASES.forEach((p, i) => { if (state.evaluations[p.id]) markPillDone(i); });
  } catch (e) { console.error("불러오기 실패:", e); }
}
function hideAllScreens() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); }

function showModule(moduleId) {
  hideAllScreens();
  if (moduleId === 'login') {
    document.getElementById('screen-login').classList.add('active');
  } else if (moduleId === 'pram') {
    document.getElementById('screen-pram').classList.add('active');
    setTimeout(() => {
      const iframe = document.getElementById('iframe-pram');
      iframe.src = 'https://cheongleem-eng.github.io/b737-door-system-1-/';
    }, 100);
  } else if (moduleId === 'interphone') {
    document.getElementById('screen-interphone').classList.add('active');
    setTimeout(() => {
      const iframe = document.getElementById('iframe-interphone');
      iframe.src = 'https://cheongleem-eng.github.io/PHONE2/';
    }, 100);
  }
}

function goHome() { 
  if (confirm('초기 포털 화면으로 이동하시겠습니까?')) { 
    hideAllScreens(); 
    document.getElementById('screen-portal').classList.add('active'); 
  } 
}
function backToMain() { hideAllScreens(); document.getElementById('screen-main').classList.add('active'); }
function showLoadingOverlay(v) { 
  let el = document.getElementById('loading-overlay');
  if (!el) {
    el = document.createElement('div'); el.id = 'loading-overlay';
    el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;color:white;font-weight:700;';
    el.innerHTML = '데이터 처리 중...'; document.body.appendChild(el);
  }
  el.style.display = v ? 'flex' : 'none';
}
window.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('input-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  initFirebase();
});