-- TERRANEX v0.4 security hotfix: FAIL CLOSED until Supabase Auth is integrated.
-- Run ONLY after reviewing in a disposable Supabase project.
-- Current index.html uses username-only login; it does NOT create auth.uid().
-- This migration intentionally disables all client writes, preventing impersonation.
-- It does not delete tables or data. Read policies remain unchanged.
BEGIN;
DROP POLICY IF EXISTS "인증 사용자는 프로필 생성 가능" ON public.profiles;
DROP POLICY IF EXISTS "인증 사용자는 프로젝트 등록 가능" ON public.projects;
DROP POLICY IF EXISTS "도전 관계자는 상태 업데이트 가능" ON public.challenges;
DROP POLICY IF EXISTS "인증 사용자는 도전 신청 가능" ON public.challenges;
DROP POLICY IF EXISTS "도전자는 증거 제출 가능" ON public.duel_evidences;
DROP POLICY IF EXISTS "방어자는 공식 기록 생성 가능" ON public.official_ledgers;
-- Deny by absence of INSERT/UPDATE/DELETE policies for anon/authenticated roles.
-- Explicitly revoke table write privileges as defense in depth.
REVOKE INSERT, UPDATE, DELETE ON TABLE
  public.profiles, public.projects, public.challenges,
  public.duel_evidences, public.official_ledgers
FROM anon, authenticated;
COMMIT;
