/* ============================================================
   제주항공 비상훈련 롤플레잉 — app.js
   ============================================================ */

// ============================================================
// 🔥 FIREBASE 설정 — 여기만 본인 프로젝트 값으로 교체하세요!
// ============================================================
const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// ============================================================
// DATA — 훈련 단계 정의
// ============================================================
const PHASES = [
  {
    id: 1,
    title: "주의집중 방송",
    instruction: "당신은 음악을 듣고 있는 승객입니다. 이어폰을 착용하고 계속 음악을 듣고 있으세요. 승무원의 별도 지시가 있을 때까지 역할을 유지하세요.",
    question: null,
    evalCriteria: [
      "이어폰 착용 승객에게 개별 접근하여 주의를 환기시켰는가",
      "명확하고 침착한 목소리로 안내했는가",
      "승객과 적절한 아이컨택을 유지했는가"
    ]
  },
  {
    id: 2,
    title: "서비스 용품 수거 및 승객 좌석 점검",
    instruction: "좌석에 착석한 후 등받이를 뒤로 젖혀주세요. 승무원의 별도 지시가 있을 때까지 그대로 유지하세요.",
    question: null,
    evalCriteria: [
      "서비스 용품(트레이, 컵 등)을 신속하게 수거했는가",
      "등받이가 젖혀진 승객에게 직접 접근하여 원위치를 요청했는가",
      "정중하고 단호한 어조로 요청을 전달했는가",
      "좌석 상태를 꼼꼼하게 확인하며 이동했는가"
    ]
  },
  {
    id: 3,
    title: "탈출차림 준비 및 수하물 정리·보관",
    instruction: "소지한 가방을 선반에 넣으려 하지만 선반에 공간이 없습니다. 앉지 말고 두리번거리며 승무원의 지시를 기다리세요.",
    question: null,
    evalCriteria: [
      "수하물 정리 안내를 명확하게 전달했는가",
      "선반 공간이 없는 승객에게 적절한 대안을 신속히 제시했는가",
      "탈출 시 방해가 되는 물품을 식별하고 조치했는가",
      "승객의 협조를 이끌어내는 커뮤니케이션을 수행했는가"
    ]
  },
  {
    id: 4,
    title: "좌석벨트 착용",
    instruction: "좌석벨트를 풀어보려 하지만 잘 풀어지지 않아 버클 부분을 계속 만지작거리세요. 승무원의 별도 지시가 있을 때까지 역할을 유지하세요.",
    question: "저, 죄송한데요. 좌석벨트가 잘 안 풀려요. 어떻게 푸는 건가요? 그리고 언제 풀어도 되나요?",
    evalCriteria: [
      "좌석벨트 착용 방법과 해제 방법을 정확하게 시범 보였는가",
      "착용 상태를 직접 확인하고 미착용 승객에게 조치했는가",
      "어려움을 겪는 승객을 신속하게 발견하고 도움을 제공했는가",
      "해제 가능 시점(비상착수 전/후)에 대해 명확히 설명했는가"
    ]
  },
  {
    id: 5,
    title: "충격방지자세",
    instruction: "충격방지자세를 언제 취해야 하는지 모릅니다. 승무원이 지나갈 때 손을 들거나 질문하세요.",
    question: "저, 충격방지자세는 언제 취해야 하나요? 방법도 알려주실 수 있나요?",
    evalCriteria: [
      "충격방지자세(Brace Position)를 정확하게 시범 보였는가",
      "자세를 취해야 하는 시점과 신호를 명확하게 설명했는가",
      "어린이·노약자 등 특수 승객에 대한 별도 안내를 했는가",
      "승객이 자세를 올바르게 취하는지 확인했는가"
    ]
  },
  {
    id: 6,
    title: "탈출구 위치 안내 (착수 시)",
    instruction: "항공기 후방에 앉은 승객입니다. 뒤쪽 탈출구가 가깝지만 왜 사용 불가능한지 궁금합니다. 승무원이 지나갈 때 질문하세요.",
    question: "저 뒤쪽에도 탈출구가 있는데, 왜 사용할 수 없다고 하나요? 이유를 설명해 주실 수 있어요?",
    evalCriteria: [
      "각 탈출구 위치와 사용 가능 여부를 명확하게 안내했는가",
      "착수 시 사용 불가 탈출구에 대한 이유를 설명했는가",
      "대체 탈출구로 승객을 유도하는 능력을 발휘했는가",
      "패닉 상황에서 승객을 침착하게 안내했는가"
    ]
  },
  {
    id: 7,
    title: "협조자 선정",
    instruction: "당사 직원 티켓으로 탑승한 승무원입니다. 승무원이 지나갈 때 손을 드세요. 이후 승무원의 지시에 따르세요.",
    question: null,
    evalCriteria: [
      "비상시 협조 가능한 승객(직원 탑승자 포함)을 적극적으로 찾았는가",
      "협조자에게 명확한 역할과 임무를 부여했는가",
      "협조자와 효과적인 소통을 유지했는가",
      "비상 상황 전반에 걸쳐 팀워크를 발휘했는가"
    ]
  }
];

const EMOJI_MAP   = { 
  1: '<i class="ph-fill ph-smiley-sad"></i>', 
  2: '<i class="ph-fill ph-smiley-meh"></i>', 
  3: '<i class="ph-fill ph-smiley-blank"></i>', 
  4: '<i class="ph-fill ph-smiley"></i>', 
  5: '<i class="ph-fill ph-smiley-wink"></i>' 
};
const SCORE_LABEL = { 1: '매우 불만족', 2: '불만족', 3: '보통', 4: '만족', 5: '매우 만족' };

// ============================================================
// STATE
// ============================================================
let db      = null;
let fbReady = false;

let state = {
  evaluatorName: '',
  traineeName: '',
  date: '',
  currentPhase: 0,
  evaluations: {}
};

let selectedRating = null;

// ============================================================
// 🔥 FIREBASE INIT
// ============================================================
function initFirebase() {
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    db      = firebase.firestore();
    fbReady = true;
    console.log('✅ Firebase Firestore 연결 성공');
  } catch (e) {
    console.warn('⚠️ Firebase 초기화 실패 — 로컬 모드:', e.message);
    fbReady = false;
  }
}

function getPhaseRef(trainee, phaseId) {
  return db
    .collection('evaluations')
    .doc(`${state.date}_${trainee}`)
    .collection('phases')
    .doc(String(phaseId));
}

async function upsertSessionMeta() {
  if (!fbReady || !state.traineeName) return;
  try {
    await db.collection('evaluations').doc(`${state.date}_${state.traineeName}`).set({
      trainee: state.traineeName,
      evaluator: state.evaluatorName,
      date: state.date,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error('세션 메타 저장 실패:', e);
  }
}

async function savePhaseToFirestore(phaseId, data) {
  if (!fbReady || !state.traineeName) return;
  try {
    await getPhaseRef(state.traineeName, phaseId).set(data, { merge: true });
    console.log(`✅ Phase ${phaseId} 저장 완료`);
  } catch (e) {
    console.error('Firestore 저장 오류:', e);
    showFbError();
  }
}

async function loadSessionFromFirestore() {
  if (!fbReady || !state.traineeName) return;
  try {
    showLoadingOverlay(true);
    const snap = await db
      .collection('evaluations')
      .doc(`${state.date}_${state.traineeName}`)
      .collection('phases')
      .get();

    snap.forEach(doc => {
      state.evaluations[parseInt(doc.id)] = doc.data();
    });
    refreshPhasePills();
    console.log(`✅ ${snap.size}개 단계 불러오기 완료`);
  } catch (e) {
    console.error('Firestore 불러오기 실패:', e);
  } finally {
    showLoadingOverlay(false);
  }
}

// ============================================================
// SESSION / LOGIN
// ============================================================
async function startSession() {
  const eName = document.getElementById('input-evaluator-name').value.trim();
  const tName = document.getElementById('input-trainee-name').value.trim();
  const date  = document.getElementById('input-date').value;

  if (!eName) { alert('나의 이름(평가자)을 입력해주세요.'); return; }
  if (!tName) { alert('평가 대상(승무원)의 이름을 입력해주세요.'); return; }
  if (!date) { alert('훈련 날짜를 선택해주세요.'); return; }

  state.evaluatorName = eName;
  state.traineeName = tName;
  state.date = date;
  state.currentPhase = 0;
  state.evaluations = {};

  hideAllScreens();
  document.getElementById('screen-main').classList.add('active');
  document.getElementById('header-names').innerHTML = `<i class="ph-fill ph-user" style="color:var(--jeju-orange)"></i> ${eName} <i class="ph-bold ph-caret-right" style="margin:0 4px; color:var(--text-secondary)"></i> <i class="ph-fill ph-airplane-tilt" style="color:var(--jeju-orange)"></i> ${tName}`;

  buildPhaseNav();
  
  if (fbReady) {
    await loadSessionFromFirestore();
  }
  
  renderPhase(0);
}

// ============================================================
// MAIN SCREEN RENDER
// ============================================================
function buildPhaseNav() {
  const nav = document.getElementById('phase-nav');
  nav.innerHTML = '';
  PHASES.forEach((p, i) => {
    const pill = document.createElement('button');
    pill.className = 'phase-pill' + (i === 0 ? ' active' : '');
    pill.textContent = `${p.id}. ${p.title}`;
    pill.dataset.index = i;
    pill.onclick = () => changePhase(null, i);
    nav.appendChild(pill);
  });
}

function renderPhase(index) {
  const phase = PHASES[index];
  state.currentPhase = index;
  selectedRating = null;

  // Reset to Roleplay view
  showRoleplaySection();

  // Header
  document.getElementById('phase-number').textContent = phase.id;
  document.getElementById('phase-title').textContent  = phase.title;

  // Passenger Instruction
  document.getElementById('instruction-text').textContent = phase.instruction;
  const qBox = document.getElementById('question-box');
  if (phase.question) {
    document.getElementById('question-text').textContent = phase.question;
    qBox.style.display = 'block';
  } else {
    qBox.style.display = 'none';
  }

  // Evaluator Criteria
  const ul = document.getElementById('eval-criteria');
  ul.innerHTML = '';
  phase.evalCriteria.forEach(c => {
    const li = document.createElement('li');
    li.textContent = c;
    ul.appendChild(li);
  });

  // Reset or Load Rating
  document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('eval-comment').value = '';
  document.getElementById('save-toast').style.display = 'none';

  const existing = state.evaluations[phase.id];
  if (existing) {
    selectedRating = existing.score;
    document.getElementById('eval-comment').value = existing.comment || '';
    const btn = document.querySelector(`.emoji-btn[data-score="${existing.score}"]`);
    if (btn) btn.classList.add('selected');
  }

  // Navigation state
  document.getElementById('phase-indicator').textContent = `${index + 1} / ${PHASES.length}`;
  document.getElementById('btn-prev').disabled = index === 0;
  document.getElementById('btn-next').disabled = index === PHASES.length - 1;
  updatePhaseNavActive(index);
  window.scrollTo(0, 0);
}

function changePhase(delta, direct) {
  const next = direct !== undefined ? direct : state.currentPhase + delta;
  if (next < 0 || next >= PHASES.length) return;
  renderPhase(next);
}

function setRating(btn, score) {
  document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedRating = score;
}

async function saveEval() {
  if (!selectedRating) { alert('평가 점수를 선택해주세요.'); return; }

  const comment  = document.getElementById('eval-comment').value.trim();
  const phaseId  = PHASES[state.currentPhase].id;

  const record = {
    score:      selectedRating,
    comment,
    phaseId,
    phaseTitle: PHASES[state.currentPhase].title,
    trainee:    state.traineeName,
    evaluator:  state.evaluatorName,
    date:       state.date,
    timestamp:  new Date().toISOString(),
    ...(fbReady && { savedAt: firebase.firestore.FieldValue.serverTimestamp() })
  };

  // 로컬 캐시
  state.evaluations[phaseId] = record;

  // Firestore 저장
  await upsertSessionMeta();
  await savePhaseToFirestore(phaseId, record);

  markPillDone(state.currentPhase);

  const toast = document.getElementById('save-toast');
  toast.textContent = fbReady ? '✅ Firestore에 저장되었습니다!' : '✅ 로컬에 저장되었습니다 (오프라인)';
  toast.style.display = 'block';
  
  setTimeout(() => { 
    toast.style.display = 'none'; 
    // Auto advance after saving
    if (state.currentPhase < PHASES.length - 1) {
      changePhase(1);
    }
  }, 1000);
}

// ============================================================
// SUMMARY SCREEN
// ============================================================
function showSummary() {
  hideAllScreens();
  document.getElementById('screen-summary').classList.add('active');

  let totalScore = 0, count = 0;
  const container = document.getElementById('summary-content');
  container.innerHTML = '';

  const headerInfo = document.createElement('div');
  headerInfo.className = 'summary-header-info';
  headerInfo.innerHTML = `
    <h2><i class="ph-fill ph-airplane-tilt" style="color:var(--jeju-orange)"></i> 대상: ${state.traineeName} 승무원</h2>
    <p>훈련 날짜: ${state.date} &nbsp;|&nbsp; 평가자: ${state.evaluatorName}</p>
    <span class="fb-badge ${fbReady ? '' : 'offline'}">${fbReady ? '🔥 Firestore 연동됨' : '📴 오프라인 모드'}</span>
    <div class="avg-score-wrap">
      <span class="avg-score-label">평균 점수:</span>
      <span class="avg-score-val" id="avg-score-val">집계 중...</span>
    </div>
  `;
  container.appendChild(headerInfo);

  PHASES.forEach(phase => {
    const ev = state.evaluations[phase.id];
    const card = document.createElement('div');
    card.className = 'summary-card';
    card.innerHTML = `
      <div class="summary-card-header">
        <span class="phase-number">${phase.id}</span>
        <span style="font-weight:700;font-size:15px;">${phase.title}</span>
      </div>
      <div class="summary-card-body">
        ${ev
          ? `<div class="summary-score">
               <span class="summary-emoji">${EMOJI_MAP[ev.score]}</span>
               <div>
                 <div class="summary-score-num">${ev.score} / 5</div>
                 <div class="summary-score-label">${SCORE_LABEL[ev.score]}</div>
               </div>
             </div>
             ${ev.comment ? `<p class="summary-comment">"${ev.comment}"</p>` : ''}`
          : `<p style="color:#9CA3AF;font-size:14px;">⚠️ 아직 평가되지 않았습니다</p>`
        }
      </div>
    `;
    container.appendChild(card);
    if (ev) { totalScore += ev.score; count++; }
  });

  const avgEl = document.getElementById('avg-score-val');
  if (count > 0) {
    const avg      = (totalScore / count).toFixed(1);
    const avgEmoji = avg >= 4.5 ? '<i class="ph-fill ph-smiley-wink"></i>' : avg >= 3.5 ? '<i class="ph-fill ph-smiley"></i>' : avg >= 2.5 ? '<i class="ph-fill ph-smiley-blank"></i>' : avg >= 1.5 ? '<i class="ph-fill ph-smiley-meh"></i>' : '<i class="ph-fill ph-smiley-sad"></i>';
    avgEl.textContent = `${avgEmoji} ${avg} / 5 (${count}/${PHASES.length}개 항목 평가)`;
  } else {
    avgEl.textContent = '평가 항목 없음';
  }
}

function backToMain() {
  hideAllScreens();
  document.getElementById('screen-main').classList.add('active');
}

// ============================================================
// ADMIN & EXPORT
// ============================================================
async function promptAdminLogin() {
  const pw = prompt("관리자 비밀번호를 입력하세요.");
  if (pw === "Jeju@ir1") {
    hideAllScreens();
    document.getElementById('screen-admin').classList.add('active');
    await loadAndRenderAdminData();
  } else if (pw !== null) {
    alert("비밀번호가 일치하지 않습니다.");
  }
}

let adminDataCache = [];

async function loadAndRenderAdminData() {
  if (!fbReady) {
    alert("오프라인 모드에서는 전체 데이터를 불러올 수 없습니다.");
    return;
  }
  
  showLoadingOverlay(true);
  try {
    const listContainer = document.getElementById('admin-date-list');
    listContainer.innerHTML = '';
    adminDataCache = [];
    
    // Get all sessions metadata
    const metaSnap = await db.collection('evaluations').get();
    const dateGroups = {};
    
    for (const doc of metaSnap.docs) {
      const meta = doc.data();
      const date = meta.date;
      if (!date) continue;
      
      if (!dateGroups[date]) dateGroups[date] = [];
      
      const phasesSnap = await doc.ref.collection('phases').get();
      const phasesData = {};
      phasesSnap.forEach(pDoc => {
        phasesData[pDoc.id] = pDoc.data();
      });
      
      const record = {
        trainee: meta.trainee,
        evaluator: meta.evaluator,
        date: meta.date,
        phases: phasesData
      };
      
      dateGroups[date].push(record);
      adminDataCache.push(record);
    }
    
    if (Object.keys(dateGroups).length === 0) {
      listContainer.innerHTML = '<p style="color:var(--text-secondary); font-size:14px;">데이터가 없습니다.</p>';
      return;
    }
    
    const sortedDates = Object.keys(dateGroups).sort().reverse();
    for (const date of sortedDates) {
      const count = dateGroups[date].length;
      
      const item = document.createElement('div');
      item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:16px; background:white; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.05);';
      item.innerHTML = `
        <div>
          <div style="font-weight:700; font-size:16px; color:var(--text-primary);">${date}</div>
          <div style="font-size:13px; color:var(--text-secondary); margin-top:4px;">총 ${count}건의 훈련 데이터</div>
        </div>
        <button class="btn-outline" style="padding:8px 12px; font-size:13px; width:auto;" onclick="downloadExcelByDate('${date}')">다운로드</button>
      `;
      listContainer.appendChild(item);
    }
    
  } catch (e) {
    console.error('관리자 데이터 로드 실패:', e);
    alert('데이터를 불러오는데 실패했습니다.');
  } finally {
    showLoadingOverlay(false);
  }
}

function formatDataForExcel(records) {
  const rows = [];
  for (const rec of records) {
    const baseRow = {
      '훈련 날짜': rec.date,
      '훈련생 (승객/평가자)': rec.evaluator,
      '평가 대상 (승무원)': rec.trainee,
    };
    
    let totalScore = 0;
    let count = 0;
    
    PHASES.forEach(p => {
      const phaseData = rec.phases[p.id];
      if (phaseData) {
        baseRow[`[${p.id}] ${p.title} - 점수`] = phaseData.score;
        baseRow[`[${p.id}] ${p.title} - 코멘트`] = phaseData.comment || '';
        totalScore += phaseData.score;
        count++;
      } else {
        baseRow[`[${p.id}] ${p.title} - 점수`] = '미평가';
        baseRow[`[${p.id}] ${p.title} - 코멘트`] = '';
      }
    });
    
    baseRow['평균 점수'] = count > 0 ? (totalScore / count).toFixed(1) : '0.0';
    rows.push(baseRow);
  }
  return rows;
}

function downloadExcelByDate(date) {
  const records = adminDataCache.filter(r => r.date === date);
  const rows = formatDataForExcel(records);
  generateExcel(rows, `제주항공_객실훈련평가_${date}.xlsx`);
}

function downloadAllExcel() {
  if (adminDataCache.length === 0) {
    alert("다운로드할 데이터가 없습니다.");
    return;
  }
  const rows = formatDataForExcel(adminDataCache);
  generateExcel(rows, `제주항공_객실훈련평가_전체데이터.xlsx`);
}

function generateExcel(rows, filename) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "평가결과");
  
  const colWidths = [
    { wch: 12 }, // 날짜
    { wch: 20 }, // 훈련생
    { wch: 20 }, // 평가대상
  ];
  PHASES.forEach(() => { colWidths.push({ wch: 10 }); colWidths.push({ wch: 30 }); });
  colWidths.push({ wch: 10 }); // 평균
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, filename);
}

// ============================================================
// UI HELPERS
// ============================================================
function updatePhaseNavActive(activeIndex) {
  document.querySelectorAll('#phase-nav .phase-pill').forEach((p, i) => {
    p.classList.toggle('active', i === activeIndex);
  });
}

function markPillDone(index) {
  const pills = document.querySelectorAll('#phase-nav .phase-pill');
  if (pills[index]) pills[index].classList.add('done');
}

function refreshPhasePills() {
  PHASES.forEach((p, i) => { 
    if (state.evaluations[p.id]) markPillDone(i); 
  });
}

function hideAllScreens() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
}

function goHome() {
  if (confirm('메인 화면으로 이동하시겠습니까? 현재까지 평가한 내용은 유지됩니다.')) {
    hideAllScreens();
    document.getElementById('screen-login').classList.add('active');
  }
}

function showLoadingOverlay(visible) {
  let el = document.getElementById('loading-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loading-overlay';
    el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
    el.innerHTML = '<div style="background:white;padding:28px 36px;border-radius:16px;font-weight:700;font-size:16px;text-align:center;">🔥 Firestore에서<br>불러오는 중...</div>';
    document.body.appendChild(el);
  }
  el.style.display = visible ? 'flex' : 'none';
}

function showFbError() {
  const toast = document.getElementById('save-toast');
  if (!toast) return;
  const origBg    = toast.style.background;
  const origColor = toast.style.color;
  toast.textContent = '⚠️ Firestore 저장 실패 — 로컬에만 저장됨';
  toast.style.background = '#FEF2F2';
  toast.style.color      = '#DC2626';
  toast.style.display    = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
    toast.style.background = origBg;
    toast.style.color      = origColor;
  }, 3000);
}

function showRoleplaySection() {
  const roleplaySec = document.getElementById('section-roleplay');
  const evalSec = document.getElementById('section-evaluate');
  if(roleplaySec && evalSec) {
    roleplaySec.style.display = 'block';
    evalSec.style.display = 'none';
  }
}

function showEvalSection() {
  const roleplaySec = document.getElementById('section-roleplay');
  const evalSec = document.getElementById('section-evaluate');
  if(roleplaySec && evalSec) {
    roleplaySec.style.display = 'none';
    evalSec.style.display = 'block';
    window.scrollTo(0, 0);
  }
}

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('input-date').value = new Date().toISOString().split('T')[0];
  initFirebase();
});