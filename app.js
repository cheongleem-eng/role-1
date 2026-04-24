/* ============================================================
   제주항공 비상훈련 롤플레잉 — app.js
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

const PHASES = [
  { id: 1, title: "주의집중 방송", instruction: "당신은 음악을 듣고 있는 승객입니다.\n이어폰을 착용하고 계속 음악을 듣고 있으세요.", question: null, evalCriteria: ["이어폰 착용 승객에게 개별 접근하여 주의를 환기시켰는가", "명확하고 침착한 목소리로 안내했는가"] },
  { id: 2, title: "서비스 용품 수거 및 승객 좌석 점검", instruction: "좌석에 착석한 후 등받이를 뒤로 젖혀주세요.", question: null, evalCriteria: ["서비스 용품을 신속하게 수거했는가", "등받이가 젖혀진 승객에게 원위치를 요청했는가"] },
  { id: 3, title: "탈출차림 준비 및 수하물 정리·보관", instruction: "소지한 가방을 선반에 넣으려 하지만 공간이 없습니다.", question: null, evalCriteria: ["수하물 정리 안내를 명확하게 전달했는가", "대안을 신속히 제시했는가"] },
  { id: 4, title: "좌석벨트 착용", instruction: "좌석벨트를 풀어보려 하지만 잘 풀어지지 않아 버클을 만지작거리세요.", question: "저, 죄송한데요. 좌석벨트가 잘 안 풀려요. 어떻게 푸는 건가요?", evalCriteria: ["착용 및 해제 방법을 정확하게 시범 보였는가", "어려움을 겪는 승객을 신속히 발견했는가"] },
  { id: 5, title: "충격방지자세", instruction: "충격방지자세를 언제 취해야 하는지 모릅니다.", question: "저, 충격방지자세는 언제 취해야 하나요? 방법도 알려주세요.", evalCriteria: ["Brace Position을 정확하게 시범 보였는가", "취해야 하는 시점과 신호를 명확히 설명했는가"] },
  { id: 6, title: "탈출구 위치 안내 (착수 시)", instruction: "항공기 후방 승객입니다. 뒤쪽 탈출구가 왜 사용 불가능한지 궁금합니다.", question: "저 뒤쪽에도 탈출구가 있는데, 왜 사용할 수 없나요?", evalCriteria: ["각 탈출구 위치와 사용 가능 여부를 명확히 안내했는가", "이유를 충분히 설명했는가"] },
  { id: 7, title: "협조자 선정", instruction: "당사 직원 티켓으로 탑승한 승무원입니다. 손을 드세요.", question: null, evalCriteria: ["비상시 협조 가능 승객을 적극적으로 찾았는가", "명확한 역할과 임무를 부여했는가"] }
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
let state = { evaluatorName: '', traineeName: '', date: '', currentPhase: 0, evaluations: {} };
let selectedRating = null;

function initFirebase() {
  try {
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.firestore();
      fbReady = true;
      console.log('✅ Firebase 연결 성공');
    }
  } catch (e) {
    console.warn('⚠️ Firebase 오프라인 모드:', e.message);
  }
}

async function startSession() {
  const eName = document.getElementById('input-evaluator-name').value.trim();
  const tName = document.getElementById('input-trainee-name').value.trim();
  const date = document.getElementById('input-date').value;
  if (!eName || !tName || !date) { alert('모든 정보를 입력해주세요.'); return; }

  state = { evaluatorName: eName, traineeName: tName, date, currentPhase: 0, evaluations: {} };
  
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
  document.getElementById('instruction-text').textContent = phase.instruction;
  
  const qBox = document.getElementById('question-box');
  if (phase.question) {
    document.getElementById('question-text').textContent = phase.question;
    qBox.style.display = 'block';
  } else {
    qBox.style.display = 'none';
  }

  document.querySelectorAll('.emoji-btn').forEach(b => {
    b.classList.remove('selected');
    const score = state.evaluations[phase.id]?.score;
    if (score && parseInt(b.dataset.score) === score) b.classList.add('selected');
  });

  document.getElementById('phase-indicator').textContent = `${index + 1} / ${PHASES.length}`;
  document.getElementById('btn-prev').disabled = index === 0;
  document.getElementById('btn-next').disabled = index === PHASES.length - 1;
  updatePhaseNavActive(index);
}

async function setRatingAndSave(score) {
  const phaseId = PHASES[state.currentPhase].id;
  state.evaluations[phaseId] = { score, timestamp: new Date().toISOString() };
  
  document.querySelectorAll('.emoji-btn').forEach(b => {
    b.classList.remove('selected');
    if (parseInt(b.dataset.score) === score) b.classList.add('selected');
  });

  if (fbReady) {
    const docId = `${state.date}_${state.traineeName}_${state.evaluatorName}`;
    await db.collection('evaluations').doc(docId).set({
      trainee: state.traineeName,
      evaluator: state.evaluatorName,
      date: state.date,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await db.collection('evaluations').doc(docId).collection('phases').doc(String(phaseId)).set({
      score,
      phaseTitle: PHASES[state.currentPhase].title,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  markPillDone(state.currentPhase);
  document.getElementById('save-toast').style.display = 'block';
  setTimeout(() => {
    document.getElementById('save-toast').style.display = 'none';
    if (state.currentPhase < PHASES.length - 1) changePhase(1);
    else showSummary();
  }, 800);
}

function changePhase(delta, direct) {
  const next = direct !== undefined ? direct : state.currentPhase + delta;
  if (next >= 0 && next < PHASES.length) renderPhase(next);
}

function confirmEndTraining() {
  if (confirm('훈련을 종료하고 결과를 저장하시겠습니까?')) showSummary();
}

function showSummary() {
  hideAllScreens();
  document.getElementById('screen-summary').classList.add('active');
  const container = document.getElementById('summary-content');
  container.innerHTML = `
    <div class="summary-header-info">
      <h2><i class="ph-fill ph-airplane-tilt"></i> ${state.traineeName} 결과</h2>
      <p>평가자: ${state.evaluatorName} | ${state.date}</p>
    </div>
    <div class="summary-card">
      ${PHASES.map(p => {
        const ev = state.evaluations[p.id];
        return `
          <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid var(--border);">
            <span style="font-size:14px; font-weight:600;">${p.id}. ${p.title}</span>
            <div style="display:flex; align-items:center; gap:8px;">
              ${ev ? EMOJI_MAP[ev.score] : '<i class="ph ph-minus"></i>'}
              <span style="font-size:12px; font-weight:700; color:var(--jeju-orange);">${ev ? SCORE_LABEL[ev.score] : '미평가'}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ============================================================
// ADMIN LOGIC (Excel Auto-save/Load)
// ============================================================
async function promptAdminLogin() {
  const pw = prompt("관리자 비밀번호를 입력하세요.");
  if (pw === "Jeju@ir1") {
    hideAllScreens();
    document.getElementById('screen-admin').classList.add('active');
    await loadAdminData();
  }
}

let adminData = [];
async function loadAdminData() {
  if (!fbReady) return;
  showLoadingOverlay(true);
  try {
    const snap = await db.collection('evaluations').orderBy('date', 'desc').get();
    const list = document.getElementById('admin-date-list');
    list.innerHTML = '';
    adminData = [];

    for (const doc of snap.docs) {
      const meta = doc.data();
      const phasesSnap = await doc.ref.collection('phases').get();
      const phases = {};
      phasesSnap.forEach(p => phases[p.id] = p.data());
      
      const record = { ...meta, id: doc.id, phases };
      adminData.push(record);
    }

    const groups = adminData.reduce((acc, r) => {
      acc[r.date] = (acc[r.date] || 0) + 1;
      return acc;
    }, {});

    Object.keys(groups).sort().reverse().forEach(date => {
      const item = document.createElement('div');
      item.className = 'admin-data-item';
      item.innerHTML = `
        <div>
          <div style="font-weight:800; font-size:17px;">${date}</div>
          <div style="font-size:13px; color:var(--text-secondary); margin-top:4px;">기록된 훈련: ${groups[date]}건</div>
        </div>
        <button class="btn-outline" style="width:auto; padding:8px 16px;" onclick="exportDateToExcel('${date}')">
          <i class="ph ph-file-xls"></i> 엑셀 다운로드
        </button>
      `;
      list.appendChild(item);
    });
  } finally {
    showLoadingOverlay(false);
  }
}

function exportDateToExcel(date) {
  const filtered = adminData.filter(r => r.date === date);
  const rows = filtered.map(r => {
    const row = { '훈련일자': r.date, '평가자': r.evaluator, '피평가자': r.trainee };
    PHASES.forEach(p => {
      row[`${p.id}. ${p.title}`] = r.phases[p.id]?.score || '미평가';
    });
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "평가결과");
  XLSX.writeFile(wb, `제주항공_훈련결과_${date}.xlsx`);
}

function downloadAllExcel() {
  const rows = adminData.map(r => {
    const row = { '훈련일자': r.date, '평가자': r.evaluator, '피평가자': r.trainee };
    PHASES.forEach(p => { row[`${p.id}. ${p.title}`] = r.phases[p.id]?.score || '미평가'; });
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "전체결과");
  XLSX.writeFile(wb, `제주항공_훈련결과_전체.xlsx`);
}

// UI Helpers
function buildPhaseNav() {
  const nav = document.getElementById('phase-nav');
  nav.innerHTML = PHASES.map((p, i) => `<button class="phase-pill ${i===0?'active':''}" onclick="changePhase(null, ${i})" data-index="${i}">${p.id}. ${p.title}</button>`).join('');
}
function updatePhaseNavActive(idx) {
  const pills = document.querySelectorAll('.phase-pill');
  pills.forEach((p, i) => p.classList.toggle('active', i === idx));
  const activePill = pills[idx];
  if (activePill) activePill.parentElement.scrollTo({ left: activePill.offsetLeft - 50, behavior: 'smooth' });
}
function markPillDone(idx) { document.querySelectorAll('.phase-pill')[idx]?.classList.add('done'); }
function hideAllScreens() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); }
function goHome() { if(confirm('홈으로 이동하시겠습니까?')) { hideAllScreens(); document.getElementById('screen-login').classList.add('active'); } }
function backToMain() { hideAllScreens(); document.getElementById('screen-main').classList.add('active'); }
function showLoadingOverlay(v) { 
  let el = document.getElementById('loading-overlay');
  if(!el) {
    el = document.createElement('div'); el.id = 'loading-overlay';
    el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;color:white;font-weight:700;';
    el.innerHTML = '데이터 로딩 중...'; document.body.appendChild(el);
  }
  el.style.display = v ? 'flex' : 'none';
}

window.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('input-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  initFirebase();
});