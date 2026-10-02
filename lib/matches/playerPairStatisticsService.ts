// 저장된 선수 세트 기록을 선수·맵 또는 선수·영웅 단위로 서버에서 집계한다.
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PairKind = "map" | "hero";
export type PairQuery = {
  kind: PairKind;
  seasonId: bigint;
  playerId?: bigint;
  itemId?: bigint;
  search: string;
  sort: "uses" | "matches" | "wins" | "rate" | "player" | "item";
  page: number;
};

const pageSize = 20;

// 맵은 선수·세트 참여를, 영웅은 사용 영웅 ID가 기록된 선수·세트를 기초 행으로 만든다.
function usageSql(query: PairQuery) {
  const item = query.kind === "map" ? Prisma.sql`ms.map_id` : Prisma.sql`hero.value::bigint`;
  const heroJoin = query.kind === "hero"
    ? Prisma.sql`CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(p.used_hero_ids, '[]')::jsonb) AS hero(value)`
    : Prisma.empty;
  const validItem = query.kind === "map" ? Prisma.sql`ms.map_id IS NOT NULL` : Prisma.sql`hero.value ~ '^[1-9][0-9]*$'`;
  return Prisma.sql`WITH usage AS (
    SELECT DISTINCT p.streamer_id, ${item} AS item_id, ms.id AS set_id, m.id AS match_id,
      ms.winner_team_id, tm.season_team_id AS team_id
    FROM player_set_stats p JOIN match_sets ms ON ms.id = p.match_set_id
    JOIN matches m ON m.id = ms.match_id
    LEFT JOIN season_team_members tm ON tm.season_id = m.season_id AND tm.streamer_id = p.streamer_id
      AND tm.season_team_id IN (m.team_a_id, m.team_b_id)
    ${heroJoin}
    WHERE m.season_id = ${query.seasonId} AND ${validItem}
      ${query.playerId ? Prisma.sql`AND p.streamer_id = ${query.playerId}` : Prisma.empty}
      ${query.itemId ? query.kind === "map"
    ? Prisma.sql`AND ms.map_id = ${query.itemId}`
    : Prisma.sql`AND hero.value = ${String(query.itemId)}` : Prisma.empty}
  ), stats AS (
    SELECT s.id AS player_id, s.name AS player_name, catalog.id AS item_id, catalog.name AS item_name,
      COUNT(DISTINCT u.set_id)::int AS uses,
      COUNT(DISTINCT u.match_id)::int AS matches,
      COUNT(DISTINCT u.set_id)::int AS sets,
      COUNT(DISTINCT u.set_id) FILTER (WHERE u.team_id IS NOT NULL AND u.winner_team_id = u.team_id)::int AS wins,
      COUNT(DISTINCT u.set_id) FILTER (WHERE u.team_id IS NOT NULL AND u.winner_team_id IS NOT NULL AND u.winner_team_id <> u.team_id)::int AS losses
    FROM usage u JOIN streamers s ON s.id = u.streamer_id
    ${query.kind === "map" ? Prisma.sql`JOIN maps catalog ON catalog.id = u.item_id` : Prisma.sql`JOIN heroes catalog ON catalog.id = u.item_id`}
    GROUP BY s.id, s.name, catalog.id, catalog.name
  )`;
}

// 요청 가능한 정렬 조건만 고정된 SQL 열로 변환한다.
function orderSql(sort: PairQuery["sort"]) {
  const columns = {
    uses: Prisma.sql`uses DESC`, matches: Prisma.sql`matches DESC`, wins: Prisma.sql`wins DESC`,
    rate: Prisma.sql`CASE WHEN wins + losses > 0 THEN wins::numeric / (wins + losses) ELSE -1 END DESC`,
    player: Prisma.sql`player_name ASC`, item: Prisma.sql`item_name ASC`,
  };
  return columns[sort];
}

type DbRow = { player_id: bigint; player_name: string; item_id: bigint; item_name: string; uses: number; matches: number; sets: number; wins: number; losses: number };

// 검색·정렬·페이지를 DB에 적용해 선수와 선택 항목의 조합 한 페이지를 반환한다.
export async function browsePlayerPairStatistics(query: PairQuery) {
  const cte = usageSql(query);
  const search = Prisma.sql`(player_name ILIKE ${`%${query.search}%`} OR item_name ILIKE ${`%${query.search}%`})`;
  const [countRows, rows] = await Promise.all([
    prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`${cte} SELECT COUNT(*) AS total FROM stats WHERE ${search}`),
    prisma.$queryRaw<DbRow[]>(Prisma.sql`${cte} SELECT * FROM stats WHERE ${search}
      ORDER BY ${orderSql(query.sort)}, player_id ASC, item_id ASC
      LIMIT ${pageSize} OFFSET ${(query.page - 1) * pageSize}`),
  ]);
  return { total: Number(countRows[0]?.total ?? 0), page: query.page, pageSize,
    rows: rows.map((row) => ({ playerId: String(row.player_id), playerName: row.player_name,
      itemId: String(row.item_id), itemName: row.item_name, uses: row.uses,
      matches: row.matches, sets: row.sets, wins: row.wins, losses: row.losses })) };
}

// 해당 대회에서 실제 조합을 만드는 선수와 맵 또는 영웅만 필터로 제공한다.
export async function findPlayerPairFilters(kind: PairKind, seasonId: bigint) {
  const source = usageSql({ kind, seasonId, search: "", sort: "uses", page: 1 });
  const [players, items] = await Promise.all([
    prisma.$queryRaw<{ id: bigint; name: string }[]>(Prisma.sql`${source}
      SELECT DISTINCT player_id AS id, player_name AS name FROM stats ORDER BY name`),
    prisma.$queryRaw<{ id: bigint; name: string }[]>(Prisma.sql`${source}
      SELECT DISTINCT item_id AS id, item_name AS name FROM stats ORDER BY name`),
  ]);
  const convert = (values: { id: bigint; name: string }[]) => values.map((item) => ({ id: String(item.id), name: item.name }));
  return { players: convert(players), items: convert(items) };
}
