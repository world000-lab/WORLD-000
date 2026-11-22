# TERRANEX ATLAS v0.4 — Supabase 데이터베이스 설정 가이드

이 문서는 TERRANEX ATLAS v0.4의 다중 사용자 데이터 동기화를 위해 Supabase 백엔드를 설정하는 안내서입니다.

---

## 1. 데이터베이스 원칙
- **참여자 자치 원칙**: 오픈소스 참여자가 직접 프로젝트를 등록하고 기술 검증을 진행합니다.
- **점수·순위·영토 이전 배제**: Star는 영향력일 뿐이며, 어떠한 인위적 점수나 순위, 영토 이전 시스템도 포함하지 않습니다.
- **검증 6단계**:
  1. 회원가입 및 로그인
  2. 프로젝트 등록 및 공개 조회
  3. 도전 신청 (`PROPOSED`)
  4. 방어자의 수락(`ACCEPTED`) 또는 거절(`REJECTED`)
  5. 도전자(공격자)의 결과 및 증거 제출 (`EVIDENCE_SUBMITTED`)
  6. 방어자의 결과 확인 및 공식 장부 영구 기록 (`OFFICIALLY_RECORDED`)

---

## 2. Supabase 설정 방법

1. [Supabase](https://supabase.com)에 로그인하고 새 프로젝트를 생성합니다.
2. 좌측 메뉴의 **SQL Editor**로 이동합니다.
3. `supabase/schema.sql` 파일의 내용을 복사하여 SQL Editor에 붙여넣고 **Run**을 실행합니다.
4. 좌측 메뉴의 **Project Settings > API**로 이동하여 다음 두 가지 정보를 복사합니다:
   - **Project URL** (예: `https://xyzcompany.supabase.co`)
   - **anon public key** (공개 API 키)
5. TERRANEX 웹 화면(`index.html`) 우측 상단의 **[⚙️ Supabase 설정]** 버튼을 클릭하여 URL과 Key를 입력하고 저장합니다.

---

## 3. 로컬 에뮬레이션 (Mock Storage) 모드
- Supabase 프로젝트가 연결되지 않았거나 설정이 비어 있는 경우에도 애플리케이션은 **브라우저 로컬 저장소 기반의 고성능 에뮬레이션 모드**로 자동 전환됩니다.
- 로컬 모드에서는 여러 계정(예: 도전자 계정, 방어자 계정)을 생성하고 즉시 전환하여 결투 신청, 수락, 증거 제출, 공식 기록의 전 과정을 온전하게 테스트할 수 있습니다.
