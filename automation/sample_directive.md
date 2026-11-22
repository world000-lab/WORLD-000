# [TASK] Issue #101: TERRANEX v0.4 6단계 결투 프로세스 무결성 검증 및 장부 동기화

## 1. 작업 개요 (Directive Overview)
- **작업명**: TERRANEX v0.4 6단계 결투 프로세스 무결성 검증 및 장부 동기화
- **지시자**: ChatGPT CA
- **대상 프로젝트**: TERRANEX ATLAS (WORLD-000)
- **우선순위**: [x] 보통(Standard)

## 2. 배경 및 목적 (Context & Goal)
- 참여자 자치 원칙에 따라 점수나 순위 없이 합의와 증거 로그로만 작동하는 6단계 프로세스가 온전하게 구동되는지 검증하고 자동 보고서를 산출한다.

## 3. 핵심 구현 요구사항 (Functional Requirements)
1. 도전자(alice)와 방어자(bob) 간 기술 도전 제안 및 수락 프로세스 검증
2. 공격자 결과/증거 제출 및 방어자 공식 기록 등재 검증
3. Supabase 및 로컬 스토리지 하이브리드 지원 유지 확인

## 4. 안전 및 절대 준수 규칙 (Safety Guidelines)
- [x] NowViewON 프로젝트 일체 접근 금지
- [x] 기존 v0.4 및 저장소 파일 임의 삭제 금지
- [x] 점수, 순위, 영토 이전 관련 기능 구현 금지
- [x] 유료 API 및 외부 유료 서비스 사용 금지
- [x] GitHub main 직접 push 금지 (전용 task 브랜치 사용)
- [x] 운영 배포는 CEO 최종 승인 전 절대 금지

## 5. 테스트 및 검증 기준 (Verification Criteria)
- `node test_v04.js` 전체 12개 테스트 스위트 100% 통과
