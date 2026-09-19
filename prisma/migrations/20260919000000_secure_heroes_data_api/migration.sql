-- Supabase Data API는 PostgREST JWT 역할(anon/authenticated)에 RLS를 적용한다.
-- 웹 앱은 서버의 Prisma 연결을 통해서만 영웅 데이터를 조회하므로, 공개 Data API 읽기는 제공하지 않는다.
ALTER TABLE public.heroes ENABLE ROW LEVEL SECURITY;

-- 재실행 또는 과거 수동 정책이 있어도 이 마이그레이션의 권한 모델로 수렴시킨다.
DROP POLICY IF EXISTS heroes_admin_select ON public.heroes;
DROP POLICY IF EXISTS heroes_admin_insert ON public.heroes;
DROP POLICY IF EXISTS heroes_admin_update ON public.heroes;
DROP POLICY IF EXISTS heroes_admin_delete ON public.heroes;

-- Supabase Auth JWT의 app_metadata.role이 ADMIN인 로그인 사용자만 Data API를 사용할 수 있다.
-- anon 및 일반 authenticated 사용자는 정책이 없어 SELECT/INSERT/UPDATE/DELETE가 모두 거부된다.
CREATE POLICY heroes_admin_select
  ON public.heroes
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

CREATE POLICY heroes_admin_insert
  ON public.heroes
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

CREATE POLICY heroes_admin_update
  ON public.heroes
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

CREATE POLICY heroes_admin_delete
  ON public.heroes
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');
