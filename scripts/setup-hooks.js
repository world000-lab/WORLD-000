// =====================================================================
// TERRANEX ATLAS - Git Hooks 설치 및 활성화 스크립트
// =====================================================================

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const hookSrc = path.join(repoRoot, '.githooks', 'pre-push');
const gitHooksDir = path.join(repoRoot, '.git', 'hooks');
const hookDest = path.join(gitHooksDir, 'pre-push');

console.log('🛡️ TERRANEX Git Safety Guard 설치 시작...');

if (!fs.existsSync(gitHooksDir)) {
  console.error('❌ .git/hooks 디렉터리를 찾을 수 없습니다.');
  process.exit(1);
}

if (!fs.existsSync(hookSrc)) {
  console.error('❌ .githooks/pre-push 원본 파일을 찾을 수 없습니다.');
  process.exit(1);
}

try {
  fs.copyFileSync(hookSrc, hookDest);
  try {
    fs.chmodSync(hookDest, '755');
  } catch (e) {
    // Windows 환경에서는 chmod가 무시될 수 있음
  }
  console.log('✅ pre-push 훅이 .git/hooks/pre-push 에 성공적으로 설치되었습니다.');
  console.log('   - main 브랜치 직접 push 차단 활성화됨');
  console.log('   - push 전 자동화 테스트 강제 실행 활성화됨');
} catch (err) {
  console.error('❌ 훅 설치 오류:', err.message);
  process.exit(1);
}
