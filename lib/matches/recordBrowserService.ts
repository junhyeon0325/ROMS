// 관리자 경기 기록 조회 화면에 필요한 목록과 단일 경기 상세를 읽기 전용으로 제공한다.
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type RecordQuery = {
  seasonId: bigint;
  page: number;
  search: string;
  teamId?: bigint;
  mapId?: bigint;
  matchId?: bigint;
  setNumber?: number;
  sort: "dateDesc" | "dateAsc" | "stage" | "idDesc";
};

const pageSize = 20;

// BigInt와 날짜를 JSON에서 안전하게 읽을 수 있는 값으로 바꾼다.
function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, item) =>
    typeof item === "bigint" ? String(item) : item,
  )) as T;
}

// 필터 조건을 DB에 적용하고 한 페이지의 경기와 세트 결과만 조회한다.
export async function browseMatchRecords(query: RecordQuery) {
  const where: Prisma.MatchWhereInput = {
    seasonId: query.seasonId,
    ...(query.matchId ? { id: query.matchId } : {}),
    ...(query.teamId ? { OR: [{ teamAId: query.teamId }, { teamBId: query.teamId }] } : {}),
    ...(query.mapId || query.setNumber ? {
      sets: { some: {
        ...(query.mapId ? { mapId: query.mapId } : {}),
        ...(query.setNumber ? { setNumber: query.setNumber } : {}),
      } },
    } : {}),
    ...(query.search ? { AND: [{ OR: [
      { tournamentStage: { contains: query.search, mode: "insensitive" } },
      { teamA: { name: { contains: query.search, mode: "insensitive" } } },
      { teamB: { name: { contains: query.search, mode: "insensitive" } } },
    ] }] } : {}),
  };
  const orderBy: Prisma.MatchOrderByWithRelationInput[] = query.sort === "dateAsc"
    ? [{ matchDate: "asc" }, { id: "asc" }]
    : query.sort === "stage"
      ? [{ tournamentStage: "asc" }, { id: "desc" }]
      : query.sort === "idDesc"
        ? [{ id: "desc" }]
        : [{ matchDate: "desc" }, { id: "desc" }];
  const [total, rows] = await Promise.all([
    prisma.match.count({ where }),
    prisma.match.findMany({
      where, orderBy, skip: (query.page - 1) * pageSize, take: pageSize,
      select: {
        id: true, seasonId: true, tournamentStage: true, matchDate: true,
        bestOf: true, winnerTeamId: true,
        teamA: { select: { id: true, name: true } },
        teamB: { select: { id: true, name: true } },
        sets: { orderBy: { setNumber: "asc" }, select: {
          id: true, setNumber: true, winnerTeamId: true,
          map: { select: { id: true, name: true, mapType: true } },
        } },
      },
    }),
  ]);
  return serialize({ total, page: query.page, pageSize, rows: rows.map((row) => ({
    ...row,
    scoreA: row.sets.filter((set) => set.winnerTeamId === row.teamA.id).length,
    scoreB: row.sets.filter((set) => set.winnerTeamId === row.teamB.id).length,
  })) });
}

// 선택 대회에서 실제 기록에 연결된 팀과 맵만 필터 선택지로 가져온다.
export async function findRecordFilters(seasonId: bigint) {
  const [teams, usedMaps] = await Promise.all([
    prisma.seasonTeam.findMany({ where: { seasonId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.matchSet.findMany({ where: { match: { seasonId }, mapId: { not: null } }, distinct: ["mapId"], select: { mapId: true } }),
  ]);
  const maps = await prisma.mapItem.findMany({
    where: { id: { in: usedMaps.flatMap((item) => item.mapId ? [item.mapId] : []) } },
    select: { id: true, name: true, mapType: true }, orderBy: { name: "asc" },
  });
  return serialize({ teams, maps });
}

// 상세 요청이 있을 때만 경기의 저장 필드와 연결된 팀·맵·선수·밴 자료를 읽는다.
export async function findRecordDetail(seasonId: bigint, matchId: bigint) {
  const row = await prisma.match.findFirst({
    where: { id: matchId, seasonId },
    include: {
      season: true,
      teamA: { include: { members: { include: { streamer: true } } } },
      teamB: { include: { members: { include: { streamer: true } } } },
      winnerTeam: true,
      sets: {
        orderBy: { setNumber: "asc" },
        include: {
          map: { include: { subareas: true } }, mapSubarea: true, winnerTeam: true,
          playerStats: { include: { streamer: true }, orderBy: [{ lineupOrder: "asc" }, { id: "asc" }] },
          heroBans: { include: { team: true, hero: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
        },
      },
    },
  });
  return row ? serialize(row) : null;
}
