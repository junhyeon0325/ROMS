// 선수·맵·영웅 사용을 저장된 선수 세트 기록에서 서버 측에 집계한다.
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type UsageQuery = {
  seasonId: bigint;
  playerId?: bigint;
  mapId?: bigint;
  heroId?: bigint;
  search: string;
  sort: "uses" | "matches" | "wins" | "rate" | "player" | "map" | "hero";
  page: number;
};

const pageSize = 20;

// 영웅 ID 배열의 중복 값은 한 선수·세트의 사용 1회로 정규화한다.
function usageCte(query: UsageQuery) {
  return Prisma.sql`WITH usage AS (
    SELECT DISTINCT p.streamer_id, ms.map_id, hero.value::bigint AS hero_id,
      ms.id AS set_id, m.id AS match_id, ms.winner_team_id, tm.season_team_id AS team_id
    FROM player_set_stats p
    JOIN match_sets ms ON ms.id = p.match_set_id
    JOIN matches m ON m.id = ms.match_id
    LEFT JOIN season_team_members tm ON tm.season_id = m.season_id AND tm.streamer_id = p.streamer_id
      AND tm.season_team_id IN (m.team_a_id, m.team_b_id)
    CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(p.used_hero_ids, '[]')::jsonb) AS hero(value)
    WHERE m.season_id = ${query.seasonId} AND ms.map_id IS NOT NULL AND hero.value ~ '^[1-9][0-9]*$'
      ${query.playerId ? Prisma.sql`AND p.streamer_id = ${query.playerId}` : Prisma.empty}
      ${query.mapId ? Prisma.sql`AND ms.map_id = ${query.mapId}` : Prisma.empty}
      ${query.heroId ? Prisma.sql`AND hero.value = ${String(query.heroId)}` : Prisma.empty}
  ), stats AS (
    SELECT s.id AS player_id, s.name AS player_name, map.id AS map_id, map.name AS map_name,
      h.id AS hero_id, h.name AS hero_name,
      COUNT(DISTINCT u.set_id)::int AS uses,
      COUNT(DISTINCT u.match_id)::int AS matches,
      COUNT(DISTINCT u.set_id)::int AS sets,
      COUNT(DISTINCT u.set_id) FILTER (WHERE u.team_id IS NOT NULL AND u.winner_team_id = u.team_id)::int AS wins,
      COUNT(DISTINCT u.set_id) FILTER (WHERE u.team_id IS NOT NULL AND u.winner_team_id IS NOT NULL AND u.winner_team_id <> u.team_id)::int AS losses
    FROM usage u JOIN streamers s ON s.id = u.streamer_id
    JOIN maps map ON map.id = u.map_id JOIN heroes h ON h.id = u.hero_id
    GROUP BY s.id, s.name, map.id, map.name, h.id, h.name
  )`;
}

// 허용된 정렬 키를 SQL 열에 매핑하고 동률에는 ID 순서를 고정한다.
function sortSql(sort: UsageQuery["sort"]) {
  const columns = {
    uses: Prisma.sql`uses DESC`, matches: Prisma.sql`matches DESC`, wins: Prisma.sql`wins DESC`,
    rate: Prisma.sql`CASE WHEN wins + losses > 0 THEN wins::numeric / (wins + losses) ELSE -1 END DESC`,
    player: Prisma.sql`player_name ASC`, map: Prisma.sql`map_name ASC`, hero: Prisma.sql`hero_name ASC`,
  };
  return columns[sort];
}

type DbRow = { player_id: bigint; player_name: string; map_id: bigint; map_name: string; hero_id: bigint; hero_name: string; uses: number; matches: number; sets: number; wins: number; losses: number };

// 검색·정렬·페이지를 DB에 적용해 조합별 통계 한 페이지와 총 행 수를 반환한다.
export async function browsePlayerMapHeroStatistics(query: UsageQuery) {
  const cte = usageCte(query);
  const search = Prisma.sql`(player_name ILIKE ${`%${query.search}%`} OR map_name ILIKE ${`%${query.search}%`} OR hero_name ILIKE ${`%${query.search}%`})`;
  const [counts, rows] = await Promise.all([
    prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`${cte} SELECT COUNT(*) AS total FROM stats WHERE ${search}`),
    prisma.$queryRaw<DbRow[]>(Prisma.sql`${cte} SELECT * FROM stats WHERE ${search}
      ORDER BY ${sortSql(query.sort)}, player_id ASC, map_id ASC, hero_id ASC
      LIMIT ${pageSize} OFFSET ${(query.page - 1) * pageSize}`),
  ]);
  return { total: Number(counts[0]?.total ?? 0), page: query.page, pageSize,
    rows: rows.map((row) => ({ playerId: String(row.player_id), playerName: row.player_name,
      mapId: String(row.map_id), mapName: row.map_name, heroId: String(row.hero_id), heroName: row.hero_name,
      uses: row.uses, matches: row.matches, sets: row.sets, wins: row.wins, losses: row.losses })) };
}

// 선택 대회에서 기록에 등장한 선수·맵·영웅만 필터 선택지로 반환한다.
export async function findPlayerMapHeroFilters(seasonId: bigint) {
  const [players, maps, heroes] = await Promise.all([
    prisma.$queryRaw<{ id: bigint; name: string }[]>(Prisma.sql`
      SELECT DISTINCT s.id, s.name FROM player_set_stats p
      JOIN match_sets ms ON ms.id = p.match_set_id JOIN matches m ON m.id = ms.match_id
      JOIN streamers s ON s.id = p.streamer_id
      CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(p.used_hero_ids, '[]')::jsonb) hero(value)
      JOIN heroes h ON h.id::text = hero.value
      WHERE m.season_id = ${seasonId} AND ms.map_id IS NOT NULL ORDER BY s.name`),
    prisma.$queryRaw<{ id: bigint; name: string }[]>(Prisma.sql`
      SELECT DISTINCT map.id, map.name FROM player_set_stats p
      JOIN match_sets ms ON ms.id = p.match_set_id JOIN matches m ON m.id = ms.match_id
      JOIN maps map ON map.id = ms.map_id
      CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(p.used_hero_ids, '[]')::jsonb) hero(value)
      JOIN heroes h ON h.id::text = hero.value
      WHERE m.season_id = ${seasonId} ORDER BY map.name`),
    prisma.$queryRaw<{ id: bigint; name: string }[]>(Prisma.sql`
      SELECT DISTINCT h.id, h.name FROM player_set_stats p
      JOIN match_sets ms ON ms.id = p.match_set_id JOIN matches m ON m.id = ms.match_id
      CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(p.used_hero_ids, '[]')::jsonb) hero(value)
      JOIN heroes h ON h.id::text = hero.value
      WHERE m.season_id = ${seasonId} AND ms.map_id IS NOT NULL ORDER BY h.name`),
  ]);
  const convert = (items: { id: bigint; name: string }[]) => items.map((item) => ({ id: String(item.id), name: item.name }));
  return { players: convert(players), maps: convert(maps), heroes: convert(heroes) };
}
