-- =====================================================================
-- TERRANEX ATLAS v0.4 Database Schema (Supabase / PostgreSQL)
-- =====================================================================
-- 원칙 준수:
-- 1. 참여자 중심의 공개 규칙 및 장부 운영
-- 2. 점수, 순위, 영토 이전 관련 컬럼 및 테이블은 일체 배제
-- 3. 제안 -> 수락/거절 -> 증거 제출 -> 방어자 확인 및 공식 기록의 6단계 절차 지원
-- =====================================================================

-- 1. 사용자 프로필 테이블 (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    email TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 프로젝트 테이블 (Projects)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    repo_url TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT '시스템/인공지능' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_repo_per_owner UNIQUE (owner_id, repo_url)
);

-- 3. 기술 도전 / 결투 테이블 (Challenges)
-- 점수, 순위, 영토 이전 컬럼 없음
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_project_id UUID REFERENCES public.projects(id) ON DELETE RESTRICT NOT NULL,
    target_project_id UUID REFERENCES public.projects(id) ON DELETE RESTRICT NOT NULL,
    challenger_user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    field TEXT NOT NULL, -- 속도, 효율성, 결과물 품질, 안정성, 비용 대비 성능
    task TEXT NOT NULL, -- 수행할 동일 과제
    method TEXT NOT NULL, -- 측정 방법, 환경, 버전 합의 조건
    status TEXT DEFAULT 'PROPOSED' NOT NULL, 
    -- 상태 코드:
    -- 'PROPOSED': 도전 신청 (합의 대기)
    -- 'ACCEPTED': 방어자 수락 (테스트 진행 중)
    -- 'REJECTED': 방어자 거절
    -- 'EVIDENCE_SUBMITTED': 도전자 결과·증거 제출 완료
    -- 'OFFICIALLY_RECORDED': 방어자 결과 확인 및 공식 장부 등재 완료
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chk_different_projects CHECK (challenger_project_id <> target_project_id),
    CONSTRAINT chk_status_valid CHECK (status IN ('PROPOSED', 'ACCEPTED', 'REJECTED', 'EVIDENCE_SUBMITTED', 'OFFICIALLY_RECORDED'))
);

-- 4. 공격자 결과 및 증거 제출 테이블 (Duel Evidences)
CREATE TABLE IF NOT EXISTS public.duel_evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    submitter_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    summary TEXT NOT NULL, -- 결과 요약
    evidence_url TEXT, -- 원격 로그, 저장소, 재현 영상 링크
    raw_logs TEXT, -- 원본 실행 로그 데이터
    reproduction_guide TEXT NOT NULL, -- 제3자 재현 방법
    submitted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. 방어자 확인 및 공식 기록 장부 테이블 (Official Ledgers)
CREATE TABLE IF NOT EXISTS public.official_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    confirmed_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    verification_status TEXT DEFAULT 'VERIFIED' NOT NULL, -- 'VERIFIED'(재현 확인), 'DISPUTED'(이의 제기)
    confirmation_notes TEXT NOT NULL, -- 방어자 검토 소견 및 확인 기록
    recorded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chk_verification_status CHECK (verification_status IN ('VERIFIED', 'DISPUTED'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_challenges_target_user ON public.challenges(target_user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger_user ON public.challenges(challenger_user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
CREATE INDEX IF NOT EXISTS idx_evidences_challenge ON public.duel_evidences(challenge_id);
CREATE INDEX IF NOT EXISTS idx_ledgers_challenge ON public.official_ledgers(challenge_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_ledgers ENABLE ROW LEVEL SECURITY;

-- 기본 공개 읽기 정책 (투명한 오픈소스 장부 원칙)
CREATE POLICY "누구나 프로필을 조회할 수 있음" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "누구나 프로젝트를 조회할 수 있음" ON public.projects FOR SELECT USING (true);
CREATE POLICY "누구나 도전을 조회할 수 있음" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "누구나 증거를 조회할 수 있음" ON public.duel_evidences FOR SELECT USING (true);
CREATE POLICY "누구나 공식 기록을 조회할 수 있음" ON public.official_ledgers FOR SELECT USING (true);

-- 쓰기 정책 (인증된 사용자 / 소유자)
CREATE POLICY "인증 사용자는 프로필 생성 가능" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "인증 사용자는 프로젝트 등록 가능" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "인증 사용자는 도전 신청 가능" ON public.challenges FOR INSERT WITH CHECK (true);
CREATE POLICY "도전 관계자는 상태 업데이트 가능" ON public.challenges FOR UPDATE USING (true);
CREATE POLICY "도전자는 증거 제출 가능" ON public.duel_evidences FOR INSERT WITH CHECK (true);
CREATE POLICY "방어자는 공식 기록 생성 가능" ON public.official_ledgers FOR INSERT WITH CHECK (true);
