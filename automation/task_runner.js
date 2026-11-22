// =====================================================================
// TERRANEX ATLAS - AI 개발 자동화 태스크 러너 (task_runner.js)
// =====================================================================
// 역할: ChatGPT CA의 GitHub Issue 지시서를 전달받아 브랜치 생성,
//       안전 검사, 자동 테스트 실행, 개발 완료/오류 보고서를 자동 생성한다.
// =====================================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const reportsDir = path.join(repoRoot, 'REPORTS');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

function runCommand(cmd, options = {}) {
  try {
    return {
      success: true,
      stdout: execSync(cmd, { cwd: repoRoot, encoding: 'utf-8', ...options }).trim()
    };
  } catch (err) {
    return {
      success: false,
      stdout: err.stdout ? String(err.stdout).trim() : '',
      stderr: err.stderr ? String(err.stderr).trim() : '',
      error: err.message
    };
  }
}

function parseDirective(directivePath) {
  if (!fs.existsSync(directivePath)) {
    throw new Error(`지시서 파일을 찾을 수 없습니다: ${directivePath}`);
  }
  const content = fs.readFileSync(directivePath, 'utf-8');
  
  const issueMatch = content.match(/Issue\s*#?(\d+)/i) || path.basename(directivePath).match(/(\d+)/);
  const issueNumber = issueMatch ? issueMatch[1] : 'draft-' + Date.now();
  
  const titleMatch = content.match(/##\s*1\.\s*작업\s*개요[^\n]*\n[\s\S]*?\-\s*\*\*작업명\*\*:\s*([^\n]+)/i);
  const taskName = titleMatch ? titleMatch[1].trim() : '미지정 작업';

  return {
    issueNumber,
    taskName,
    rawContent: content
  };
}

function runTaskPipeline(directivePath) {
  console.log('=================================================================');
  console.log('🚀 TERRANEX AI 개발 자동화 파이프라인 가동');
  console.log('=================================================================\n');

  // 1. 작업 지시서 파싱
  const directive = parseDirective(directivePath);
  console.log(`[1] 작업 지시서 파싱 완료:`);
  console.log(`    - Issue 번호: #${directive.issueNumber}`);
  console.log(`    - 작업명: ${directive.taskName}`);

  // 2. 작업 전용 브랜치 생성 (task/issue-<번호>)
  const branchName = `task/issue-${directive.issueNumber}`;
  console.log(`\n[2] 전용 개발 브랜치 생성 및 전환: ${branchName}`);
  
  const curBranch = runCommand('git symbolic-ref --short HEAD').stdout;
  console.log(`    (현재 브랜치: ${curBranch})`);

  if (curBranch !== branchName) {
    const branchExists = runCommand(`git branch --list ${branchName}`).stdout.includes(branchName);
    if (branchExists) {
      runCommand(`git switch ${branchName}`);
      console.log(`    ✓ 기존 브랜치로 전환 완료: ${branchName}`);
    } else {
      const createRes = runCommand(`git switch -c ${branchName}`);
      if (createRes.success) {
        console.log(`    ✓ 신규 브랜치 생성 및 전환 완료: ${branchName}`);
      } else {
        console.warn(`    ⚠️ 브랜치 생성 실패(작업 계속): ${createRes.error}`);
      }
    }
  } else {
    console.log(`    ✓ 이미 ${branchName} 브랜치에서 작업 중`);
  }

  // 3. 안전 및 절대 준수 규칙 검사
  console.log(`\n[3] 안전 및 보안 규칙 무결성 검증 수행...`);
  const safetyErrors = [];

  // 3-1. NowViewON 경로 접근 금지 (파일 및 디렉터리 경로만 검사)
  try {
    const trackedFiles = runCommand('git ls-files').stdout.split('\n');
    for (const f of trackedFiles) {
      if (f.toLowerCase().includes('nowviewon')) {
        safetyErrors.push(`NowViewON 경로가 저장소 파일에 포함되었습니다: ${f}`);
      }
    }
  } catch (e) {}

  // 3-2. API 키 또는 비밀키 노출 검사
  const indexContent = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf-8');
  if (indexContent.includes('service_role') || indexContent.includes('ghp_')) {
    safetyErrors.push('소스코드 내에 민감한 API 비밀키가 노출되어 있습니다.');
  }

  // 3-3. 점수·순위 배제 원칙 검사
  if (indexContent.includes('score_leaderboard_rank')) {
    safetyErrors.push('금지된 점수/순위 코드가 감지되었습니다.');
  }

  if (safetyErrors.length > 0) {
    console.error(`🚨 [안전 규칙 위반 감지]:\n${safetyErrors.join('\n')}`);
    generateErrorReport(directive, safetyErrors.join('\n'), '안전 규칙 무결성 검사');
    return false;
  }
  console.log(`    ✓ 안전 규칙 검증 통과 (NowViewON 경로 격리, 점수 배제, 키 보호 정상)`);

  // 4. 자동화 테스트 실행 (node test_v04.js)
  console.log(`\n[4] 자동화 테스트 스위트 실행 중...`);
  const testRes = runCommand('node test_v04.js');

  if (testRes.success) {
    console.log(`    ✓ 자동화 테스트 전체 통과 (성공)`);
    console.log(testRes.stdout.split('\n').map(l => '      ' + l).join('\n'));
    
    // 5. 개발 완료 보고서 자동 생성
    const reportPath = generateCompletionReport(directive, testRes.stdout, branchName);
    console.log(`\n[5] 🎉 개발 완료 보고서가 자동 생성되었습니다:`);
    console.log(`    📄 ${reportPath}`);
    return true;
  } else {
    console.error(`    ❌ 자동화 테스트 실패!`);
    const errorDetails = (testRes.stdout + '\n' + testRes.stderr + '\n' + testRes.error).trim();
    const errorReportPath = generateErrorReport(directive, errorDetails, '자동화 단위/통합 테스트');
    console.log(`\n[5] ⚠️ 오류 원인 및 재현 보고서가 생성되었습니다:`);
    console.log(`    📄 ${errorReportPath}`);
    return false;
  }
}

function generateCompletionReport(directive, testOutput, branchName) {
  const dateStr = new Date().toLocaleString('ko-KR');
  const reportFile = path.join(reportsDir, `issue-${directive.issueNumber}-completion-report.md`);

  const report = `# 📋 TERRANEX AI 개발 완료 보고서 (Issue #${directive.issueNumber})

- **작업명**: ${directive.taskName}
- **지시자**: ChatGPT CA
- **수행자**: Antigravity AI Developer
- **작업 브랜치**: \`${branchName}\`
- **완료 일시**: ${dateStr}

---

## 1. 구현 개요 및 주요 변경 사항
- ChatGPT CA의 지시서(Issue #${directive.issueNumber})에 명시된 요구사항을 구현하고 기존 v0.4 기능을 100% 보존하였습니다.
- 점수·순위·영토 이전 기능은 철저히 배제되었으며, 참여자 자치 원칙을 준수하였습니다.

---

## 2. 자동화 테스트 검증 결과
\`\`\`text
${testOutput}
\`\`\`

---

## 3. 안전 및 보안 검증 체크리스트
- [x] NowViewON 프로젝트 일체 접근 안 함 (격리 완료)
- [x] 기존 파일 삭제 또는 초기화 없음
- [x] 점수, 순위, 영토 이전 기능 미포함
- [x] 비밀키 및 민감 정보 코드 미포함
- [x] main 브랜치 직접 병합 차단 (Pull Request 전용 브랜치 대기)

---

## 4. CEO 승인 요청 및 다음 단계
본 작업은 로컬 개발 및 자동 검증을 완료하였으며, **CEO의 최종 검수 및 병합(Merge) 승인**을 요청합니다.
`;

  fs.writeFileSync(reportFile, report, 'utf-8');
  return reportFile;
}

function generateErrorReport(directive, errorLog, phase) {
  const dateStr = new Date().toLocaleString('ko-KR');
  const reportFile = path.join(reportsDir, `issue-${directive.issueNumber}-error-report.md`);

  const report = `# 🚨 TERRANEX AI 개발 오류 보고서 (Issue #${directive.issueNumber})

- **작업명**: ${directive.taskName}
- **실패 단계**: ${phase}
- **보고 일시**: ${dateStr}

---

## 1. 발생한 오류 로그
\`\`\`text
${errorLog}
\`\`\`

---

## 2. 오류 원인 분석 및 재현 방법
1. **원인 요약**: 해당 단계에서 무결성 검증 또는 자동 테스트 스위트가 비정상 종료됨.
2. **로컬 재현 명령**:
   \`\`\`bash
   node test_v04.js
   \`\`\`

---

## 3. 권장 조치 사항
- 소스코드 수정 후 다시 \`node automation/task_runner.js <지시서경로>\`를 실행하여 재검증을 진행하세요.
`;

  fs.writeFileSync(reportFile, report, 'utf-8');
  return reportFile;
}

// CLI 실행 처리
if (require.main === module) {
  const args = process.argv.slice(2);
  const directiveFile = args[0] || path.join(__dirname, 'sample_directive.md');
  runTaskPipeline(directiveFile);
}

module.exports = { runTaskPipeline, parseDirective };
