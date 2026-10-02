// 대회 경기와 세트별 결과·밴·선수 기록을 한 트랜잭션으로 저장한다.
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  MapSubareaResultInput,
  MatchInput,
  MatchRecord,
  MatchSetInput,
} from "@/lib/types/matches";
import {
  computeMatchWinner,
  MatchError,
  parseMatchInput,
} from "./matchValidator";
import { getLatestEscortTeamResult } from "./escortTurns";

const details = {
  teamA: true,
  teamB: true,
  sets: {
    include: {
      playerStats: true,
      heroBans: {
        orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }],
      },
      mapSubarea: true,
    },
    orderBy: { setNumber: "asc" as const },
  },
} satisfies Prisma.MatchInclude;
type MatchRow = Prisma.MatchGetPayload<{ include: typeof details }>;
type MatchTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// 조회 결과의 BigInt를 API와 화면에서 안전하게 사용할 문자열로 바꾼다.
function toRecord(row: MatchRow): MatchRecord {
  return {
    id: String(row.id),
    seasonId: String(row.seasonId),
    tournamentStage: row.tournamentStage,
    matchDate: row.matchDate?.toISOString() ?? "",
    teamAId: String(row.teamAId),
    teamBId: String(row.teamBId),
    bestOf: row.bestOf ?? 0,
    remarks: row.remarks ?? "",
    winnerTeamId: row.winnerTeamId ? String(row.winnerTeamId) : null,
    teamAName: row.teamA.name,
    teamBName: row.teamB.name,
    sets: row.sets.map((set) => ({
      id: String(set.id),
      setNumber: set.setNumber,
      mapId: set.mapId ? String(set.mapId) : null,
      teamAColor: set.teamAColor as "BLUE" | "RED",
      hybridFirstAttackTeamId: set.hybridFirstAttackTeamId
        ? String(set.hybridFirstAttackTeamId)
        : null,
      hybridTurnResults: parseHybridTurnResults(set.hybridTurnResults),
      teamAPushDistanceMeters: set.teamAPushDistanceMeters ?? null,
      teamBPushDistanceMeters: set.teamBPushDistanceMeters ?? null,
      escortFirstAttackTeamId: set.escortFirstAttackTeamId
        ? String(set.escortFirstAttackTeamId)
        : null,
      escortTurnResults: parseEscortTurnResults(set.escortTurnResults),
      teamAEscortDistanceMeters: set.teamAEscortDistanceMeters ?? null,
      teamBEscortDistanceMeters: set.teamBEscortDistanceMeters ?? null,
      teamAEscortScore: set.teamAEscortScore ?? null,
      teamBEscortScore: set.teamBEscortScore ?? null,
      mapSubareaId: set.mapSubareaId ? String(set.mapSubareaId) : null,
      mapSubareaResults: parseMapSubareaResults(set.mapSubareaResults),
      mapSubareaName: set.mapSubarea?.name ?? "",
      winnerTeamId: set.winnerTeamId ? String(set.winnerTeamId) : null,
      gameDurationSeconds: set.gameDurationSeconds,
      vodUrl: set.vodUrl ?? "",
      bans: set.heroBans.map((ban) => ({
        teamId: String(ban.teamId),
        heroId: String(ban.heroId),
      })),
      stats: set.playerStats.map((stat) => ({
        streamerId: String(stat.streamerId),
        kills: stat.kills,
        deaths: stat.deaths,
        assists: stat.assists,
        damage: stat.damage,
        healing: stat.healing,
        mitigatedDamage: stat.mitigatedDamage,
        ...(stat.usedHeroIds !== null
          ? { usedHeroIds: parseUsedHeroIds(stat.usedHeroIds) }
          : {}),
        ...(stat.usedHeroSubareas !== null
          ? { usedHeroSubareas: parseUsedHeroSubareas(stat.usedHeroSubareas) }
          : {}),
        ...(stat.usedHeroTurns !== null
          ? { usedHeroTurns: parseUsedHeroTurns(stat.usedHeroTurns) }
          : {}),
        ...(stat.lineupOrder !== null ? { lineupOrder: stat.lineupOrder } : {}),
        isPotg: stat.isPotg,
      })),
    })),
  };
}

// DB에 저장된 구역별 점유율·승리 팀 JSON을 안전한 입력 형식으로 변환한다.
function parseMapSubareaResults(
  value: string | null,
): Record<string, MapSubareaResultInput> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, MapSubareaResultInput] => {
          const [id, result] = entry;
          return (
            /^\d+$/.test(id) &&
            Boolean(result) &&
            typeof result === "object" &&
            !Array.isArray(result) &&
            (result as MapSubareaResultInput).teamAProgress !== undefined &&
            (result as MapSubareaResultInput).teamBProgress !== undefined &&
            (result as MapSubareaResultInput).winnerTeamId !== undefined
          );
        },
      ),
    );
  } catch {
    return {};
  }
}

// DB에 저장한 사용 영웅 ID 목록을 안전하게 화면용 배열로 변환한다.
function parseUsedHeroIds(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

// DB에 저장된 영웅별 세부 지역 목록을 안전한 ID 배열 맵으로 변환한다.
function parseUsedHeroSubareas(value: string | null): Record<string, string[]> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([heroId, ids]) => [
        heroId,
        Array.isArray(ids)
          ? ids.filter((id): id is string => typeof id === "string")
          : [],
      ]),
    );
  } catch {
    return {};
  }
}

// 저장된 혼합맵 사용 영웅을 기존 팀 ID와 추가 턴 ID별 배열로 복원한다.
function parseUsedHeroTurns(value: string | null): Record<string, string[]> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(
          ([turnId, ids]) =>
            (/^\d+$/.test(turnId) ||
              /^turn-(?:[3-9]|[1-9]\d+)$/.test(turnId)) &&
            Array.isArray(ids),
        )
        .map(([turnId, ids]) => [
          turnId,
          (ids as unknown[]).filter(
            (id): id is string => typeof id === "string",
          ),
        ]),
    );
  } catch {
    return {};
  }
}

// 저장된 혼합맵 공격 턴의 기존 진행률과 새 거점·화물 값을 함께 복원한다.
function parseHybridTurnResults(
  value: string | null,
): NonNullable<MatchSetInput["hybridTurnResults"]> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(
          ([turnId, result]) =>
            (/^\d+$/.test(turnId) ||
              /^turn-(?:[3-9]|[1-9]\d+)$/.test(turnId)) &&
            Boolean(result) &&
            typeof result === "object" &&
            !Array.isArray(result),
        )
        .map(([turnId, result]) => [
          turnId,
          result as NonNullable<MatchSetInput["hybridTurnResults"]>[string],
        ]),
    );
  } catch {
    return {};
  }
}

// 저장된 호위 턴의 공격 팀·점수·화물 거리를 화면 입력 형식으로 복원한다.
function parseEscortTurnResults(value: string | null): NonNullable<MatchSetInput["escortTurnResults"]> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([turnId, result]) =>
          (/^\d+$/.test(turnId) || /^turn-(?:[3-9]|[1-9]\d+)$/.test(turnId)) &&
          Boolean(result) && typeof result === "object" && !Array.isArray(result),
        )
        .map(([turnId, result]) => [turnId, result as NonNullable<MatchSetInput["escortTurnResults"]>[string]]),
    );
  } catch {
    return {};
  }
}

// 선택한 대회의 경기 목록과 기록을 세트 번호 순서로 조회한다.
export async function findMatches(seasonId: bigint): Promise<MatchRecord[]> {
  const rows = await prisma.match.findMany({
    where: { seasonId },
    include: details,
    orderBy: [{ matchDate: "desc" }, { id: "desc" }],
  });
  return rows.map(toRecord);
}

// 목록 표에 필요한 경기 요약만 조회해 세트·선수 기록의 초기 전송을 생략한다.
export async function findMatchSummaries(
  seasonId: bigint,
): Promise<Omit<MatchRecord, "sets">[]> {
  const rows = await prisma.match.findMany({
    where: { seasonId },
    select: {
      id: true,
      seasonId: true,
      tournamentStage: true,
      matchDate: true,
      teamAId: true,
      teamBId: true,
      bestOf: true,
      remarks: true,
      winnerTeamId: true,
      teamA: { select: { name: true } },
      teamB: { select: { name: true } },
    },
    orderBy: [{ matchDate: "desc" }, { id: "desc" }],
  });
  return rows.map((row) => ({
    id: String(row.id),
    seasonId: String(row.seasonId),
    tournamentStage: row.tournamentStage,
    matchDate: row.matchDate?.toISOString() ?? "",
    teamAId: String(row.teamAId),
    teamBId: String(row.teamBId),
    bestOf: row.bestOf ?? 0,
    remarks: row.remarks ?? "",
    winnerTeamId: row.winnerTeamId ? String(row.winnerTeamId) : null,
    teamAName: row.teamA.name,
    teamBName: row.teamB.name,
  }));
}

// 선택한 경기 하나의 세트·밴·선수 상세 기록만 가져온다.
export async function findMatch(
  seasonId: bigint,
  matchId: bigint,
): Promise<MatchRecord | null> {
  const row = await prisma.match.findFirst({
    where: { id: matchId, seasonId },
    include: details,
  });
  return row ? toRecord(row) : null;
}

// 대회 소속·맵풀·현재 편성·영웅 참조와 경기 완료 조건을 확인한다.
async function assertReferences(
  tx: MatchTx,
  input: MatchInput,
  existingId?: bigint,
) {
  const seasonId = BigInt(input.seasonId);
  const teamIds = [BigInt(input.teamAId), BigInt(input.teamBId)];
  const subareaIds = input.sets.flatMap((set) => [
    ...(set.mapSubareaId ? [BigInt(set.mapSubareaId)] : []),
    ...Object.keys(set.mapSubareaResults ?? {}).map(BigInt),
    ...set.stats.flatMap((stat) =>
      Object.values(stat.usedHeroSubareas ?? {})
        .flat()
        .map(BigInt),
    ),
  ]);
  const [season, teams, maps, subareas, members, heroes, oldSets] =
    await Promise.all([
      tx.season.findUnique({ where: { id: seasonId }, select: { id: true } }),
      tx.seasonTeam.findMany({
        where: { id: { in: teamIds }, seasonId },
        select: { id: true },
      }),
      tx.seasonMap.findMany({
        where: { seasonId },
        select: { mapId: true, map: { select: { mapType: true } } },
      }),
      subareaIds.length
        ? tx.mapSubarea.findMany({
            where: { id: { in: subareaIds } },
            select: { id: true, mapId: true },
          })
        : Promise.resolve([]),
      tx.seasonTeamMember.findMany({
        where: {
          seasonId,
          seasonTeamId: { in: teamIds },
          position: { not: null },
        },
        select: { streamerId: true },
      }),
      tx.hero.findMany({
        where: {
          id: {
            in: input.sets
              .flatMap((set) => [
                ...set.bans.map((ban) => ban.heroId),
                ...set.stats.flatMap((stat) => stat.usedHeroIds ?? []),
              ])
              .map((id) => BigInt(id)),
          },
        },
        select: { id: true, role: true },
      }),
      existingId
        ? tx.matchSet.findMany({
            where: { matchId: existingId },
            select: { id: true },
          })
        : Promise.resolve([]),
    ]);
  if (!season) throw new MatchError("대회를 찾을 수 없습니다.", 404);
  if (teams.length !== 2)
    throw new MatchError("선택한 두 팀이 해당 대회에 속하지 않습니다.");
  const mapIds = new Set(maps.map((item) => String(item.mapId)));
  const mapModes = new Map(
    maps.map((item) => [String(item.mapId), item.map?.mapType]),
  );
  if (input.sets.some((set) => set.mapId && !mapIds.has(set.mapId)))
    throw new MatchError("세트 맵은 대회 맵 구성에서 선택해주세요.");
  if (
    input.sets.some(
      (set) =>
        (set.hybridFirstAttackTeamId ||
          Object.keys(set.hybridTurnResults ?? {}).length > 0) &&
        mapModes.get(String(set.mapId)) !== "HYBRID",
    )
  )
    throw new MatchError("공격·수비 턴 기록은 혼합맵에만 입력할 수 있습니다.");
  if (
    input.sets.some(
      (set) =>
        set.stats.some((stat) => Object.keys(stat.usedHeroTurns ?? {}).length > 0) &&
        !["HYBRID", "ESCORT"].includes(mapModes.get(String(set.mapId)) ?? ""),
    )
  )
    throw new MatchError("턴별 사용 영웅은 혼합맵 또는 호위맵에만 입력할 수 있습니다.");
  if (
    input.sets.some(
      (set) =>
        (set.teamAPushDistanceMeters != null ||
          set.teamBPushDistanceMeters != null) &&
        mapModes.get(String(set.mapId)) !== "PUSH",
    )
  )
    throw new MatchError("팀별 밀기 거리는 밀기 맵에만 입력할 수 있습니다.");
  if (
    input.sets.some(
      (set) =>
        (set.escortFirstAttackTeamId != null ||
          Object.keys(set.escortTurnResults ?? {}).length > 0 ||
          set.teamAEscortDistanceMeters != null ||
          set.teamBEscortDistanceMeters != null ||
          set.teamAEscortScore != null ||
          set.teamBEscortScore != null) &&
        mapModes.get(String(set.mapId)) !== "ESCORT",
    )
  )
    throw new MatchError("호위 맵의 선공 팀·점수·화물 거리는 호위 맵에만 입력할 수 있습니다.");
  const subareaById = new Map(
    subareas.map((item) => [String(item.id), String(item.mapId)]),
  );
  if (
    input.sets.some(
      (set) =>
        set.mapSubareaId && subareaById.get(set.mapSubareaId) !== set.mapId,
    )
  )
    throw new MatchError("세부 지역은 선택한 세트 맵에 속해야 합니다.");
  if (
    input.sets.some((set) =>
      Object.keys(set.mapSubareaResults ?? {}).some(
        (id) =>
          !subareaById.has(id) || subareaById.get(id) !== String(set.mapId),
      ),
    )
  )
    throw new MatchError("구역 결과는 해당 세트 맵의 세부 지역이어야 합니다.");
  const playerIds = new Set(members.map((item) => String(item.streamerId)));
  if (
    input.sets.some((set) =>
      set.stats.some((stat) => !playerIds.has(stat.streamerId)),
    )
  )
    throw new MatchError(
      "선수 기록은 현재 두 팀에 편성된 선수만 입력할 수 있습니다.",
    );
  const heroIds = new Set(heroes.map((item) => String(item.id)));
  if (
    input.sets.some(
      (set) =>
        set.bans.some((ban) => !heroIds.has(ban.heroId)) ||
        set.stats.some((stat) =>
          (stat.usedHeroIds ?? []).some((heroId) => !heroIds.has(heroId)),
        ),
    )
  )
    throw new MatchError("등록된 영웅만 밴·선수 기록에 사용할 수 있습니다.");
  const heroById = new Map(heroes.map((hero) => [String(hero.id), hero]));
  for (const set of input.sets) {
    if (set.bans.length > 4)
      throw new MatchError("밴은 정해진 4개 슬롯만 기록할 수 있습니다.");
    const roleCounts = new Map<string, number>();
    for (const ban of set.bans) {
      const role = heroById.get(ban.heroId)?.role;
      if (!role) continue;
      const group = role === "HEALER" ? "SUPPORT" : role;
      const count = (roleCounts.get(group) ?? 0) + 1;
      if (count > 2)
        throw new MatchError(
          "각 포지션은 영웅 밴을 최대 2개까지만 지정할 수 있습니다.",
        );
      roleCounts.set(group, count);
    }
  }
  if (
    input.sets.some((set) =>
      set.stats.some((stat) =>
        Object.values(stat.usedHeroSubareas ?? {})
          .flat()
          .some(
            (id) =>
              !subareaById.has(id) || subareaById.get(id) !== String(set.mapId),
          ),
      ),
    )
  )
    throw new MatchError(
      "영웅 사용 구역은 해당 세트 맵의 세부 지역이어야 합니다.",
    );
  const oldIds = new Set(oldSets.map((item) => String(item.id)));
  if (input.sets.some((set) => set.id && !oldIds.has(set.id)))
    throw new MatchError("다른 경기에 속한 세트를 수정할 수 없습니다.");
  const target = Math.floor(input.bestOf / 2) + 1;
  const scores = new Map([
    [input.teamAId, 0],
    [input.teamBId, 0],
  ]);
  let clinchNumber: number | null = null;
  for (const set of [...input.sets].sort((a, b) => a.setNumber - b.setNumber)) {
    if (!set.winnerTeamId) continue;
    if (clinchNumber !== null)
      throw new MatchError("승리 확정 뒤에는 완료 세트를 추가할 수 없습니다.");
    const score = (scores.get(set.winnerTeamId) ?? 0) + 1;
    scores.set(set.winnerTeamId, score);
    if (score === target) clinchNumber = set.setNumber;
  }
}

// 전체 저장에서는 세트 목록을 동기화하고 상세 저장에서는 대상 세트의 하위 기록만 갱신한다.
async function saveSets(
  tx: MatchTx,
  matchId: bigint,
  input: MatchInput,
  actorId: string,
  targetSetId?: string,
) {
  const keepIds = input.sets
    .filter((set) => set.id)
    .map((set) => BigInt(set.id!));
  if (!targetSetId)
    await tx.matchSet.deleteMany({
      where: { matchId, id: { notIn: keepIds } },
    });
    for (const set of targetSetId
    ? input.sets.filter((item) => item.id === targetSetId)
    : input.sets) {
    // 호위 턴이 입력되면 각 팀의 마지막 공격 결과를 기존 팀별 요약 컬럼에도 저장한다.
    const hasEscortTurnResults = Object.keys(set.escortTurnResults ?? {}).length > 0;
    const teamALastEscortTurn = hasEscortTurnResults
      ? getLatestEscortTeamResult(set, input.teamAId, input.teamBId, input.teamAId)
      : null;
    const teamBLastEscortTurn = hasEscortTurnResults
      ? getLatestEscortTeamResult(set, input.teamAId, input.teamBId, input.teamBId)
      : null;
    const data = {
      setNumber: set.setNumber,
      mapId: set.mapId ? BigInt(set.mapId) : null,
      ...(set.mapSubareaId !== undefined
        ? { mapSubareaId: set.mapSubareaId ? BigInt(set.mapSubareaId) : null }
        : {}),
      ...(set.mapSubareaResults !== undefined
        ? { mapSubareaResults: JSON.stringify(set.mapSubareaResults) }
        : {}),
      teamAColor: set.teamAColor ?? "BLUE",
      hybridFirstAttackTeamId: set.hybridFirstAttackTeamId
        ? BigInt(set.hybridFirstAttackTeamId)
        : null,
      ...(set.hybridTurnResults !== undefined
        ? { hybridTurnResults: JSON.stringify(set.hybridTurnResults) }
        : {}),
      teamAPushDistanceMeters: set.teamAPushDistanceMeters ?? null,
      teamBPushDistanceMeters: set.teamBPushDistanceMeters ?? null,
      escortFirstAttackTeamId: set.escortFirstAttackTeamId
        ? BigInt(set.escortFirstAttackTeamId)
        : null,
      ...(set.escortTurnResults !== undefined
        ? { escortTurnResults: JSON.stringify(set.escortTurnResults) }
        : {}),
      teamAEscortDistanceMeters: hasEscortTurnResults ? teamALastEscortTurn?.payloadDistanceMeters ?? null : set.teamAEscortDistanceMeters ?? null,
      teamBEscortDistanceMeters: hasEscortTurnResults ? teamBLastEscortTurn?.payloadDistanceMeters ?? null : set.teamBEscortDistanceMeters ?? null,
      teamAEscortScore: hasEscortTurnResults ? teamALastEscortTurn?.points ?? null : set.teamAEscortScore ?? null,
      teamBEscortScore: hasEscortTurnResults ? teamBLastEscortTurn?.points ?? null : set.teamBEscortScore ?? null,
      winnerTeamId: set.winnerTeamId ? BigInt(set.winnerTeamId) : null,
      gameDurationSeconds: set.gameDurationSeconds,
      vodUrl: set.vodUrl || null,
    };
    const row = set.id
      ? await tx.matchSet.update({
          where: { id: BigInt(set.id) },
          data: { ...data, updatedBy: actorId },
        })
      : await tx.matchSet.create({
          data: { ...data, matchId, createdBy: actorId, updatedBy: actorId },
        });
    const oldStats = await tx.playerSetStat.findMany({
      where: { matchSetId: row.id },
    });
    const oldBans = await tx.heroBan.findMany({
      where: { matchSetId: row.id },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    for (const [index, ban] of set.bans.entries()) {
      const data = {
        teamId: BigInt(ban.teamId),
        heroId: BigInt(ban.heroId),
        sortOrder: index + 1,
      };
      if (oldBans[index]) {
        if (
          oldBans[index].teamId !== data.teamId ||
          oldBans[index].heroId !== data.heroId ||
          oldBans[index].sortOrder !== data.sortOrder
        )
          await tx.heroBan.update({
            where: { id: oldBans[index].id },
            data: { ...data, updatedBy: actorId },
          });
      } else
        await tx.heroBan.create({
          data: {
            ...data,
            matchSetId: row.id,
            createdBy: actorId,
            updatedBy: actorId,
          },
        });
    }
    if (oldBans.length > set.bans.length)
      await tx.heroBan.deleteMany({
        where: {
          matchSetId: row.id,
          id: { in: oldBans.slice(set.bans.length).map((ban) => ban.id) },
        },
      });
    const statIds = new Set(set.stats.map((stat) => stat.streamerId));
    const removedStatIds = oldStats
      .filter((stat) => !statIds.has(String(stat.streamerId)))
      .map((stat) => stat.id);
    if (removedStatIds.length)
      await tx.playerSetStat.deleteMany({
        where: { matchSetId: row.id, id: { in: removedStatIds } },
      });
    const oldByPlayer = new Map(
      oldStats.map((stat) => [String(stat.streamerId), stat]),
    );
    for (const stat of set.stats) {
      const data = {
        kills: stat.kills,
        deaths: stat.deaths,
        assists: stat.assists,
        damage: stat.damage,
        healing: stat.healing,
        mitigatedDamage: stat.mitigatedDamage,
        ...(stat.usedHeroIds !== undefined
          ? { usedHeroIds: JSON.stringify(stat.usedHeroIds) }
          : {}),
        ...(stat.usedHeroSubareas !== undefined
          ? { usedHeroSubareas: JSON.stringify(stat.usedHeroSubareas) }
          : {}),
        ...(stat.usedHeroTurns !== undefined
          ? { usedHeroTurns: JSON.stringify(stat.usedHeroTurns) }
          : {}),
        lineupOrder: stat.lineupOrder ?? null,
        isPotg: stat.isPotg,
      };
      const old = oldByPlayer.get(stat.streamerId);
      if (old) {
        if (
          Object.entries(data).some(
            ([key, value]) => old[key as keyof typeof old] !== value,
          )
        )
          await tx.playerSetStat.update({
            where: { id: old.id },
            data: { ...data, updatedBy: actorId },
          });
      } else
        await tx.playerSetStat.create({
          data: {
            ...data,
            matchSetId: row.id,
            streamerId: BigInt(stat.streamerId),
            createdBy: actorId,
            updatedBy: actorId,
          },
        });
    }
  }
}

// 한 경기와 그 하위 기록을 원자적으로 생성하거나 수정한다.
export async function saveMatch(
  input: MatchInput,
  actorId: string,
): Promise<MatchRecord> {
  const id = input.id ? BigInt(input.id) : null;
  const savedId = await prisma.$transaction(
    async (tx) => {
      if (id) {
        const existing = await tx.match.findUnique({
          where: { id },
          select: { seasonId: true },
        });
        if (!existing) throw new MatchError("경기를 찾을 수 없습니다.", 404);
        if (String(existing.seasonId) !== input.seasonId)
          throw new MatchError("경기의 대회를 변경할 수 없습니다.");
      }
      await assertReferences(tx, input, id ?? undefined);
      const data = {
        seasonId: BigInt(input.seasonId),
        tournamentStage: input.tournamentStage.trim(),
        matchDate: input.matchDate ? new Date(input.matchDate) : null,
        teamAId: BigInt(input.teamAId),
        teamBId: BigInt(input.teamBId),
        bestOf: input.bestOf,
        winnerTeamId: computeMatchWinner(input)
          ? BigInt(computeMatchWinner(input)!)
          : null,
        remarks: input.remarks.trim() || null,
      };
      const row = id
        ? await tx.match.update({
            where: { id },
            data: { ...data, updatedBy: actorId },
          })
        : await tx.match.create({
            data: { ...data, createdBy: actorId, updatedBy: actorId },
          });
      await saveSets(tx, row.id, input, actorId);
      return row.id;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  const row = await prisma.match.findFirstOrThrow({
    where: { id: savedId },
    include: details,
  });
  return toRecord(row);
}

// 요청한 경기 영역을 현재 DB 값과 합치고 상세 저장에서는 다른 세트의 변경을 보존한다.
export async function updateMatchSection(
  id: bigint,
  scope: "match" | "sets" | "setDetail",
  payload: unknown,
  actorId: string,
): Promise<MatchRecord> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw new MatchError("수정할 경기 정보가 올바르지 않습니다.");
  const savedId = await prisma.$transaction(
    async (tx) => {
      const current = await tx.match.findUnique({
        where: { id },
        include: details,
      });
      if (!current) throw new MatchError("경기를 찾을 수 없습니다.", 404);
      const previous = toRecord(current);
      const data = payload as Record<string, unknown>;
      // 상세 저장은 서버의 나머지 세트를 그대로 두고 요청한 세트만 합친다.
      const targetSet =
        scope === "setDetail"
          ? (data.set as Record<string, unknown> | null)
          : null;
      const targetSetId =
        typeof targetSet?.id === "string" ? targetSet.id : null;
      if (
        scope === "setDetail" &&
        (!targetSetId || !previous.sets.some((set) => set.id === targetSetId))
      )
        throw new MatchError("수정할 세트가 현재 경기에 없습니다.");
      const merged =
        scope === "match"
          ? {
              ...previous,
              tournamentStage: data.tournamentStage,
              matchDate: data.matchDate,
              teamAId: data.teamAId,
              teamBId: data.teamBId,
              bestOf: data.bestOf,
              remarks: data.remarks,
            }
          : {
              ...previous,
              sets:
                scope === "setDetail"
                  ? previous.sets.map((set) =>
                      set.id === targetSetId ? targetSet : set,
                    )
                  : data.sets,
            };
      const input = parseMatchInput(merged);
      if (
        scope === "match" &&
        previous.sets.length &&
        (previous.teamAId !== input.teamAId ||
          previous.teamBId !== input.teamBId)
      )
        throw new MatchError(
          "세트 기록이 있는 경기의 팀은 변경할 수 없습니다.",
        );
      await assertReferences(
        tx,
        scope === "match" ? { ...input, sets: [] } : input,
        id,
      );
      if (scope === "match") {
        await tx.match.update({
          where: { id },
          data: {
            tournamentStage: input.tournamentStage.trim(),
            matchDate: input.matchDate ? new Date(input.matchDate) : null,
            teamAId: BigInt(input.teamAId),
            teamBId: BigInt(input.teamBId),
            bestOf: input.bestOf,
            remarks: input.remarks.trim() || null,
            winnerTeamId: computeMatchWinner(input)
              ? BigInt(computeMatchWinner(input)!)
              : null,
            updatedBy: actorId,
          },
        });
      } else {
        await tx.match.update({
          where: { id },
          data: {
            winnerTeamId: computeMatchWinner(input)
              ? BigInt(computeMatchWinner(input)!)
              : null,
            updatedBy: actorId,
          },
        });
        await saveSets(tx, id, input, actorId, targetSetId ?? undefined);
      }
      return id;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  return toRecord(
    await prisma.match.findFirstOrThrow({
      where: { id: savedId },
      include: details,
    }),
  );
}

// 명시적으로 선택한 한 경기와 하위 기록을 삭제한다.
export async function deleteMatch(id: bigint) {
  await prisma.match.delete({ where: { id } });
}
