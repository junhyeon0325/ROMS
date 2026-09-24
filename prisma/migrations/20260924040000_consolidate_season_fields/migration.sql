BEGIN;

-- 사용 중인 팀 수나 로고가 있다면 정보 손실 없이 별도로 처리할 수 있도록 중단한다.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "seasons" WHERE "teams" <> 0 OR "logo_url" IS NOT NULL) THEN
    RAISE EXCEPTION '사용 중인 teams 또는 logo_url 값이 있어 컬럼 삭제를 중단합니다.';
  END IF;
END $$;

-- 두 메모가 모두 있으면 서로 다른 내용을 순서대로 남기고, 같으면 한 번만 저장한다.
UPDATE "seasons"
SET "remarks" = CASE
  WHEN NULLIF(btrim("remarks"), '') IS NULL THEN NULLIF(btrim("desc"), '')
  WHEN NULLIF(btrim("desc"), '') IS NULL OR btrim("remarks") = btrim("desc") THEN "remarks"
  ELSE "remarks" || E'\n\n' || "desc"
END;

ALTER TABLE "seasons" DROP COLUMN "desc";
ALTER TABLE "seasons" DROP COLUMN "teams";
ALTER TABLE "seasons" DROP COLUMN "logo_url";

COMMIT;
