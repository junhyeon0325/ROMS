ALTER TABLE "matches"
ALTER COLUMN "match_date" TYPE DATE
USING CASE
    WHEN "match_date" IS NULL THEN NULL
    ELSE (("match_date" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Seoul')::DATE
END;
