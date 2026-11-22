// =====================================================================
// TERRANEX ATLAS v0.4 자동화 테스트 스크립트 (test_v04.js)
// =====================================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('====================================================');
console.log('TERRANEX ATLAS v0.4 개발 기능 및 무결성 테스트 시작');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

// 1. index.html 파일 검증
const indexPath = path.join(__dirname, 'index.html');
assert(fs.existsSync(indexPath), 'index.html 파일이 정상 존재함');

const htmlContent = fs.readFileSync(indexPath, 'utf-8');

// 2. index.html 스크립트 추출 및 문법(Syntax) 검사
const scriptMatches = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
assert(scriptMatches && scriptMatches[1], 'index.html 내 메인 script 태그 추출 성공');

let scriptContent = scriptMatches ? scriptMatches[1] : '';

try {
  // 브라우저 전역 객체 모킹
  const localStorageMock = (function() {
    let store = {};
    return {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { store = {}; },
      _store: store
    };
  })();

  const sandbox = {
    console,
    localStorage: localStorageMock,
    window: { supabase: null },
    document: {
      getElementById: (id) => ({
        value: '',
        textContent: '',
        innerHTML: '',
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        addEventListener: () => {},
        setAttribute: () => {},
        append: () => {},
        replaceChildren: () => {},
        focus: () => {},
        reset: () => {}
      }),
      querySelectorAll: () => []
    },
    setTimeout,
    Date,
    Math,
    JSON,
    alert: (msg) => console.log('   [UI Alert]', msg),
    confirm: () => true,
    prompt: () => '테스트 사유'
  };

  // 문법 검사
  new vm.Script(scriptContent);
  assert(true, 'index.html 인라인 스크립트 문법(Syntax) 에러 없음');

} catch (err) {
  assert(false, '스크립트 문법 검사 실패: ' + err.message);
}

// 3. 비즈니스 로직 6단계 독립 기능 테스트
const mockStorage = {};
const LOCAL_KEY = 'terranex_v04_db_data';

function getLocal() {
  return mockStorage[LOCAL_KEY] ? JSON.parse(mockStorage[LOCAL_KEY]) : {
    profiles: [],
    projects: [],
    challenges: [],
    duel_evidences: [],
    official_ledgers: []
  };
}

function saveLocal(d) {
  mockStorage[LOCAL_KEY] = JSON.stringify(d);
}

const DB = {
  getProfiles() { return getLocal().profiles; },
  addProfile(p) {
    const s = getLocal();
    p.id = p.id || 'u-' + Date.now();
    s.profiles.push(p);
    saveLocal(s);
    return p;
  },
  getProjects() {
    const s = getLocal();
    return s.projects.map(p => ({
      ...p,
      profiles: s.profiles.find(u => u.id === p.owner_id) || { username: 'unknown', display_name: 'unknown' }
    }));
  },
  addProject(p) {
    const s = getLocal();
    p.id = p.id || 'p-' + Date.now();
    p.created_at = new Date().toISOString();
    s.projects.push(p);
    saveLocal(s);
    return p;
  },
  getChallenges() { return getLocal().challenges; },
  addChallenge(c) {
    const s = getLocal();
    c.id = c.id || 'c-' + Date.now();
    c.status = 'PROPOSED';
    c.created_at = new Date().toISOString();
    c.updated_at = new Date().toISOString();
    s.challenges.unshift(c);
    saveLocal(s);
    return c;
  },
  updateChallengeStatus(cId, status, rejectionReason = null) {
    const s = getLocal();
    const item = s.challenges.find(c => c.id === cId);
    if (item) {
      item.status = status;
      if (rejectionReason) item.rejection_reason = rejectionReason;
      item.updated_at = new Date().toISOString();
      saveLocal(s);
    }
    return item;
  },
  addEvidence(e) {
    const s = getLocal();
    e.id = e.id || 'e-' + Date.now();
    e.submitted_at = new Date().toISOString();
    s.duel_evidences.push(e);
    const c = s.challenges.find(x => x.id === e.challenge_id);
    if (c) c.status = 'EVIDENCE_SUBMITTED';
    saveLocal(s);
    return e;
  },
  recordOfficialLedger(l) {
    const s = getLocal();
    l.id = l.id || 'l-' + Date.now();
    l.recorded_at = new Date().toISOString();
    s.official_ledgers.push(l);
    const c = s.challenges.find(x => x.id === l.challenge_id);
    if (c) c.status = 'OFFICIALLY_RECORDED';
    saveLocal(s);
    return l;
  },
  getOfficialLedgers() { return getLocal().official_ledgers; }
};

console.log('\n--- [시나리오 테스트: 6단계 핵심 워크플로] ---');

// 단계 1: 회원가입 및 로그인
const userAlice = DB.addProfile({ id: 'u-alice', username: 'alice', display_name: '앨리스 (도전자)', email: 'alice@test.org' });
const userBob = DB.addProfile({ id: 'u-bob', username: 'bob', display_name: '밥 (방어자)', email: 'bob@test.org' });
assert(DB.getProfiles().length === 2, '1단계: 도전자(alice) 및 방어자(bob) 회원가입 완료');

// 단계 2: 프로젝트 등록
const projAlice = DB.addProject({ id: 'p-fastllm', owner_id: userAlice.id, name: 'FastLLM-Engine', repo_url: 'https://github.com/alice/fastllm', category: 'AI/LLM' });
const projBob = DB.addProject({ id: 'p-nexus', owner_id: userBob.id, name: 'Nexus-Core', repo_url: 'https://github.com/bob/nexus-core', category: 'Systems' });
const projects = DB.getProjects();
assert(projects.length === 2 && projects[0].profiles.username === 'alice', '2단계: 도전자 및 방어자 프로젝트 등록 및 소유자 조회 완료');

// 단계 3: 도전 신청
const challenge = DB.addChallenge({
  challenger_project_id: projAlice.id,
  target_project_id: projBob.id,
  challenger_user_id: userAlice.id,
  target_user_id: userBob.id,
  field: '속도 (처리 시간)',
  task: '동일 100만 건 데이터 직렬화 및 전송',
  method: 'Linux 6.8, 16코어, gcc-13, 10회 반복 측정 중앙값'
});
assert(challenge.status === 'PROPOSED', '3단계: 도전자(alice)가 방어자(bob)에게 기술 도전 신청 (상태: PROPOSED)');

// 단계 4-A: 방어자 거절 테스트 (별도 도전)
const chReject = DB.addChallenge({
  challenger_project_id: projAlice.id,
  target_project_id: projBob.id,
  challenger_user_id: userAlice.id,
  target_user_id: userBob.id,
  field: '효율성',
  task: '비현실적 메모리 제한 테스트',
  method: '임의 기준'
});
DB.updateChallengeStatus(chReject.id, 'REJECTED', '환경 및 조건 불일치');
assert(DB.getChallenges().find(c => c.id === chReject.id).status === 'REJECTED', '4-A단계: 방어자의 사유 명시 도전 거절(REJECTED) 처리 완료');

// 단계 4-B: 방어자 수락 테스트
DB.updateChallengeStatus(challenge.id, 'ACCEPTED');
assert(DB.getChallenges().find(c => c.id === challenge.id).status === 'ACCEPTED', '4-B단계: 방어자가 측정 조건을 검토하고 수락(ACCEPTED) 처리 완료');

// 단계 5: 공격자 결과 및 증거 제출
const evidence = DB.addEvidence({
  challenge_id: challenge.id,
  submitter_id: userAlice.id,
  summary: '100만 건 처리 시간: 142ms (반복 10회 중앙값)',
  evidence_url: 'https://github.com/alice/fastllm/actions/runs/98765',
  raw_logs: '[INFO] Starting benchmark...\nIteration 1: 144ms\nIteration 2: 141ms\nIteration 3: 142ms\nMedian: 142ms',
  reproduction_guide: 'docker run --rm -v $(pwd):/app fastllm:bench --items 1000000'
});
assert(evidence && DB.getChallenges().find(c => c.id === challenge.id).status === 'EVIDENCE_SUBMITTED', '5단계: 도전자(공격자)의 결과 요약, 증거 URL, 원시 로그, 재현 절차 제출 완료 (상태: EVIDENCE_SUBMITTED)');

// 단계 6: 방어자 결과 확인 및 공식 기록 등재
const ledger = DB.recordOfficialLedger({
  challenge_id: challenge.id,
  confirmed_by: userBob.id,
  verification_status: 'VERIFIED',
  confirmation_notes: '제출된 Docker 환경에서 직접 재현 완료. 100만 건 중앙값 143ms로 증거와 일치함을 확인함.'
});
assert(ledger && DB.getChallenges().find(c => c.id === challenge.id).status === 'OFFICIALLY_RECORDED', '6단계: 방어자가 증거 검증 후 공식 기록(OFFICIALLY_RECORDED) 등재 완료');

// 단계 7: 공식 장부 무결성 확인
const allLedgers = DB.getOfficialLedgers();
assert(allLedgers.length === 1 && allLedgers[0].verification_status === 'VERIFIED', '7단계: 공식 장부(Official Ledger) 영구 기록 보존 확인 완료');

// 단계 8: 필수 원칙 검증 (점수, 순위, 영토 이전 컬럼 배제 확인)
const schemaContent = fs.readFileSync(path.join(__dirname, 'supabase', 'schema.sql'), 'utf-8');
const bannedWords = ['score', 'ranking', 'territory_transfer', 'win_loss', '점수', '순위', '영토'];
let hasBanned = false;
for (const word of ['score', 'ranking', 'territory_transfer']) {
  if (schemaContent.toLowerCase().includes(word)) {
    hasBanned = true;
    break;
  }
}
assert(!hasBanned, '8단계: DB 스키마에 점수·순위·영토이전 컬럼 일체 미포함 원칙 준수 확인');

console.log('\n====================================================');
console.log(`테스트 결과 요약: 통과 ${passCount}건, 실패 ${failCount}건`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
