// 저장된 경기·세트·선수 기록을 DB에서 필터링하고 페이지 단위로 집계한다.
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type StatisticsTab = "players" | "maps" | "heroes";
export type StatisticsQuery = {
  seasonId: bigint;
  tab: StatisticsTab;
  page: number;
  search: string;
  teamId?: bigint;
  mapId?: bigint;
  playerId?: bigint;
  heroId?: bigint;
  sort: "name" | "matches" | "sets" | "wins" | "rate" | "uses";
  detailId?: bigint;
};

const pageSize = 20;

// 선수·영웅 기록의 JSON 배열에서 특정 영웅 사용 여부를 DB 조건으로 확인한다.
function heroCondition(heroId: bigint) {
  return Prisma.sql`COALESCE(p.used_hero_ids, '[]')::jsonb @> jsonb_build_array(${String(heroId)})`;
}

// 세트 기준 필터를 SQL 단계에서 적용해 전체 경기 기록을 애플리케이션으로 옮기지 않는다.
function setFilter(query: StatisticsQuery) {
  return Prisma.sql`
    m.season_id = ${query.seasonId}
    ${query.teamId ? Prisma.sql`AND ${query.teamId} IN (m.team_a_id, m.team_b_id)` : Prisma.empty}
    ${query.mapId ? Prisma.sql`AND ms.map_id = ${query.mapId}` : Prisma.empty}
    ${query.playerId ? Prisma.sql`AND EXISTS (SELECT 1 FROM player_set_stats fp WHERE fp.match_set_id = ms.id AND fp.streamer_id = ${query.playerId})` : Prisma.empty}
    ${query.heroId ? Prisma.sql`AND EXISTS (SELECT 1 FROM player_set_stats p WHERE p.match_set_id = ms.id AND ${heroCondition(query.heroId)})` : Prisma.empty}
  `;
}

// 탭마다 저장된 관계만 사용해 집계 가능한 열과 승패 분모를 만든다.
function statisticsSql(query: StatisticsQuery) {
  const filter = setFilter(query);
  if (query.tab === "maps") return Prisma.sql`
    WITH stats AS (
      SELECT map.id, map.name, map.map_type AS subtitle,
        COUNT(DISTINCT ms.match_id)::int AS matches,
        COUNT(*)::int AS sets,
        COUNT(*) FILTER (WHERE ms.winner_team_id IS NOT NULL)::int AS decided,
        COUNT(*) FILTER (WHERE ms.winner_team_id = ${query.teamId ?? BigInt(0)})::int AS wins,
        COUNT(*) FILTER (WHERE ms.winner_team_id IS NOT NULL AND ms.winner_team_id <> ${query.teamId ?? BigInt(0)})::int AS losses,
        0::int AS uses
      FROM match_sets ms JOIN matches m ON m.id = ms.match_id
      JOIN maps map ON map.id = ms.map_id
      WHERE ${filter}
      GROUP BY map.id, map.name, map.map_type
    )`;
  if (query.tab === "players") return Prisma.sql`
    WITH stats AS (
      SELECT s.id, s.name, COALESCE(MAX(t.name), '팀 미확인') AS subtitle,
        COUNT(DISTINCT m.id)::int AS matches, COUNT(DISTINCT ms.id)::int AS sets,
        COUNT(DISTINCT ms.id) FILTER (WHERE ms.winner_team_id IS NOT NULL AND tm.season_team_id IS NOT NULL)::int AS decided,
        COUNT(DISTINCT ms.id) FILTER (WHERE ms.winner_team_id = tm.season_team_id)::int AS wins,
        COUNT(DISTINCT ms.id) FILTER (WHERE ms.winner_team_id IS NOT NULL AND tm.season_team_id IS NOT NULL AND ms.winner_team_id <> tm.season_team_id)::int AS losses,
        0::int AS uses
      FROM player_set_stats p JOIN match_sets ms ON ms.id = p.match_set_id
      JOIN matches m ON m.id = ms.match_id JOIN streamers s ON s.id = p.streamer_id
      LEFT JOIN season_team_members tm ON tm.season_id = m.season_id AND tm.streamer_id = p.streamer_id
        AND tm.season_team_id IN (m.team_a_id, m.team_b_id)
      LEFT JOIN season_teams t ON t.id = tm.season_team_id
      WHERE ${filter} ${query.teamId ? Prisma.sql`AND tm.season_team_id = ${query.teamId}` : Prisma.empty}
        ${query.playerId ? Prisma.sql`AND p.streamer_id = ${query.playerId}` : Prisma.empty}
        ${query.heroId ? Prisma.sql`AND ${heroCondition(query.heroId)}` : Prisma.empty}
      GROUP BY s.id, s.name
    )`;
  return Prisma.sql`
    WITH usage AS (
      SELECT DISTINCT p.id AS stat_id, p.streamer_id, ms.id AS set_id, m.id AS match_id,
        ms.winner_team_id, tm.season_team_id AS team_id, hero_id.value::bigint AS hero_id
      FROM player_set_stats p JOIN match_sets ms ON ms.id = p.match_set_id
      JOIN matches m ON m.id = ms.match_id
      LEFT JOIN season_team_members tm ON tm.season_id = m.season_id AND tm.streamer_id = p.streamer_id
        AND tm.season_team_id IN (m.team_a_id, m.team_b_id)
      CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(p.used_hero_ids, '[]')::jsonb) AS hero_id(value)
      WHERE ${filter} ${query.teamId ? Prisma.sql`AND tm.season_team_id = ${query.teamId}` : Prisma.empty}
        ${query.playerId ? Prisma.sql`AND p.streamer_id = ${query.playerId}` : Prisma.empty}
        ${query.heroId ? Prisma.sql`AND hero_id.value = ${String(query.heroId)}` : Prisma.empty}
    ), stats AS (
      SELECT h.id, h.name, h.role AS subtitle,
        COUNT(DISTINCT u.match_id)::int AS matches, COUNT(DISTINCT u.set_id)::int AS sets,
        COUNT(DISTINCT u.stat_id) FILTER (WHERE u.winner_team_id IS NOT NULL AND u.team_id IS NOT NULL)::int AS decided,
        COUNT(DISTINCT u.stat_id) FILTER (WHERE u.winner_team_id = u.team_id)::int AS wins,
        COUNT(DISTINCT u.stat_id) FILTER (WHERE u.winner_team_id IS NOT NULL AND u.team_id IS NOT NULL AND u.winner_team_id <> u.team_id)::int AS losses,
        COUNT(DISTINCT u.stat_id)::int AS uses
      FROM usage u JOIN heroes h ON h.id = u.hero_id
      GROUP BY h.id, h.name, h.role
    )`;
}

// 검증된 정렬 값만 SQL 식으로 변환하고 같은 값에는 ID 순서를 고정한다.
function orderSql(sort: StatisticsQuery["sort"], tab: StatisticsTab) {
  if (sort === "name") return Prisma.sql`name ASC, id ASC`;
  if (sort === "matches") return Prisma.sql`matches DESC, id ASC`;
  if (sort === "wins") return Prisma.sql`wins DESC, id ASC`;
  if (sort === "rate") return Prisma.sql`CASE WHEN wins + losses > 0 THEN wins::numeric / (wins + losses) ELSE -1 END DESC, id ASC`;
  if (sort === "uses" && tab === "heroes") return Prisma.sql`uses DESC, id ASC`;
  return Prisma.sql`sets DESC, id ASC`;
}

type DbRow = { id: bigint; name: string; subtitle: string; matches: number; sets: number; decided: number; wins: number; losses: number; uses: number };

// 집계 결과의 총 건수와 요청 페이지를 각각 DB에서 읽고 BigInt ID를 직렬화한다.
export async function browseStatistics(query: StatisticsQuery) {
  const cte = statisticsSql(query);
  const search = Prisma.sql`name ILIKE ${`%${query.search}%`}`;
  const [countRows, rows] = await Promise.all([
    prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`${cte} SELECT COUNT(*) AS total FROM stats WHERE ${search}`),
    prisma.$queryRaw<DbRow[]>(Prisma.sql`${cte} SELECT * FROM stats WHERE ${search}
      ORDER BY ${orderSql(query.sort, query.tab)} LIMIT ${pageSize} OFFSET ${(query.page - 1) * pageSize}`),
  ]);
  return { total: Number(countRows[0]?.total ?? 0), page: query.page, pageSize,
    rows: rows.map((row) => ({ ...row, id: String(row.id) })) };
}

// 선택 통계 행에 실제 기여한 경기만 날짜순으로 한 페이지씩 반환한다.
export async function browseStatisticMatches(query: StatisticsQuery) {
  if (!query.detailId) throw new Error("통계 항목 ID가 필요합니다.");
  const entityFilter = query.tab === "maps"
    ? Prisma.sql`ms.map_id = ${query.detailId}`
    : query.tab === "players"
      ? Prisma.sql`EXISTS (SELECT 1 FROM player_set_stats p WHERE p.match_set_id = ms.id AND p.streamer_id = ${query.detailId}
          ${query.heroId ? Prisma.sql`AND ${heroCondition(query.heroId)}` : Prisma.empty}
          ${query.teamId ? Prisma.sql`AND EXISTS (SELECT 1 FROM season_team_members tm WHERE tm.season_id = m.season_id AND tm.streamer_id = p.streamer_id AND tm.season_team_id = ${query.teamId})` : Prisma.empty})`
      : Prisma.sql`EXISTS (SELECT 1 FROM player_set_stats p WHERE p.match_set_id = ms.id AND ${heroCondition(query.detailId)}
          ${query.playerId ? Prisma.sql`AND p.streamer_id = ${query.playerId}` : Prisma.empty}
          ${query.teamId ? Prisma.sql`AND EXISTS (SELECT 1 FROM season_team_members tm WHERE tm.season_id = m.season_id AND tm.streamer_id = p.streamer_id AND tm.season_team_id = ${query.teamId})` : Prisma.empty})`;
  const eligible = Prisma.sql`FROM match_sets ms JOIN matches m ON m.id = ms.match_id
    JOIN season_teams a ON a.id = m.team_a_id JOIN season_teams b ON b.id = m.team_b_id
    WHERE ${setFilter(query)} AND ${entityFilter}`;
  const [countRows, rows] = await Promise.all([
    prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`SELECT COUNT(DISTINCT m.id) AS total ${eligible}`),
    prisma.$queryRaw<{ id: bigint; matchDate: Date | null; tournamentStage: string; teamA: string; teamB: string }[]>(Prisma.sql`
      SELECT m.id, m.match_date AS "matchDate", m.tournament_stage AS "tournamentStage",
        a.name AS "teamA", b.name AS "teamB" ${eligible}
      GROUP BY m.id, m.match_date, m.tournament_stage, a.name, b.name
      ORDER BY m.match_date DESC NULLS LAST, m.id DESC LIMIT ${pageSize} OFFSET ${(query.page - 1) * pageSize}`),
  ]);
  return { total: Number(countRows[0]?.total ?? 0), page: query.page, pageSize,
    rows: rows.map((row) => ({ ...row, id: String(row.id), matchDate: row.matchDate?.toISOString().slice(0, 10) ?? null })) };
}

// 시즌별 실제 선택 가능한 팀·맵·선수와 영웅 사전을 가벼운 목록으로 읽는다.
export async function findStatisticsFilters(seasonId: bigint) {
  const [teams, maps, players, heroes] = await Promise.all([
    prisma.seasonTeam.findMany({ where: { seasonId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.mapItem.findMany({ where: { matchSets: { some: { match: { seasonId } } } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.streamer.findMany({ where: { playerSetStats: { some: { matchSet: { match: { seasonId } } } } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.hero.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const convert = (items: { id: bigint; name: string }[]) => items.map((item) => ({ id: String(item.id), name: item.name }));
  return { teams: convert(teams), maps: convert(maps), players: convert(players), heroes: convert(heroes) };
}
