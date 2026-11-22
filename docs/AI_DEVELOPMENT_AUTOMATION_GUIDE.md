# TERRANEX ATLAS — AI 개발 자동화 협업 시스템 가이드

본 문서는 **ChatGPT CA(Chief Architect)**와 **Antigravity AI 개발자** 간의 GitHub Issue 기반 자동화 협업 프로세스를 안내합니다.

---

## 1. 전체 개발 라이프사이클 (6단계)

```
[1단계: 지시] ChatGPT CA가 GitHub Issue 지시서 템플릿으로 작업 등록
   │
   ▼
[2단계: 수신 및 실행] Antigravity가 작업 지시서 수신 후 automation/task_runner.js 실행
   │
   ▼
[3단계: 안전 검증 및 브랜치] 전용 task 브랜치 자동 생성, NowViewON 및 안전 규칙 검사
   │
   ▼
[4단계: 코딩 및 자동 테스트] 비즈니스 로직 구현 후 node test_v04.js 자동 검증
   │
   ▼
[5단계: 보고서 자동 산출] REPORTS/issue-<번호>-completion-report.md 자동 생성
   │
   ▼
[6단계: PR 및 CEO 승인] Pull Request 생성 후 CEO의 최종 검수 및 main 병합 승인
```

---

## 2. 작업 지시서 템플릿
- 파일 위치: `.github/ISSUE_TEMPLATE/ai_task_directive.md`
- GitHub 저장소에서 **New Issue → [ChatGPT CA] 개발 작업 지시서**를 선택하여 작성합니다.

---

## 3. 로컬 자동화 러너 실행 방법
```bash
# 특정 지시서 파일로 파이프라인 가동 (전용 브랜치 생성 + 테스트 + 보고서 자동 생성)
node automation/task_runner.js automation/sample_directive.md
```

---

## 4. 안전 가드 (main 직접 병합 방지)
- Git Hook (`.githooks/pre-push`): 로컬에서 main 브랜치로 직접 push하는 행위를 원천 차단합니다.
- 설치 스크립트:
  ```bash
  node scripts/setup-hooks.js
  ```
- GitHub Actions (`.github/workflows/test-and-verify.yml`): PR 생성 시 안전 규칙과 자동화 테스트를 클라우드 CI에서 강제 검증합니다.

---

## 5. 완전 자동화의 기술적 한계와 솔직한 보고 (현실적 제약)

1. **GitHub Issue 발생 시 Antigravity 자동 실행(외부 트리거)**:
   - **현재 불가능한 이유**: GitHub 클라우드 웹훅이 로컬 PC의 데스크톱 앱(Antigravity)을 외부에서 직접 깨우려면 고정 공인 IP, 포트포워딩, 상시 실행 데몬 서버, 그리고 보안 터널링이 필요합니다. 또한 로컬 샌드박스 정책상 외부 신호에 의한 무인 임의 코드 실행은 보안상 엄격히 제한됩니다.
   - **실제 운영 방식 (반자동)**: ChatGPT CA가 Issue를 등록하면, 사용자가 Antigravity에서 *"Issue #101 작업 진행해"* 라고 한 줄 지시하거나, `node automation/task_runner.js`를 실행하면 이후의 모든 과정(브랜치 생성, 코딩, 테스트, 보고서 생성)은 100% 전자동으로 완료됩니다.

2. **CEO 승인이 필요한 작업**:
   - `git push` (원격 저장소 업로드)
   - GitHub Pull Request 생성 및 main 브랜치 병합(Merge)
   - 운영 서버 배포 (GitHub Pages 반영)
   - 유료 외부 API 결제 및 연동
