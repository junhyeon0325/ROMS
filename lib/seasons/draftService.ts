// 시즌 팀 자체에 이름과 편성 정보를 저장하고 단일 지명 순서를 관리한다.
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findParticipants } from "./participantService";
import { DraftError, validateDraftInput } from "./draftValidator";
import type { DraftSaveInput, DraftTeam, SeasonDraft } from "@/lib/types/seasonDraft";

// 시즌의 참가자와 저장된 팀 소속을 함께 조회한다.
export async function findSeasonDraft(seasonId: bigint): Promise<SeasonDraft> {
  const [participants, rows] = await Promise.all([
    findParticipants(seasonId),
    prisma.seasonTeam.findMany({ where: { seasonId }, include: { members: true }, orderBy: { id: "asc" } }),
  ]);
  const registered = new Set(participants.map((item) => item.streamerId));
  return { participants, teams: rows.map((row): DraftTeam => ({ id: String(row.id), name: row.name, sortOrder: row.sortOrder, members: row.members.map((member) => String(member.streamerId)).filter((id) => registered.has(id)) })) };
}

// 기존 참가자만 배정하고 시즌 팀 변경과 지명 순서를 한 트랜잭션으로 저장한다.
export async function saveSeasonDraft(seasonId: bigint, input: DraftSaveInput) {
  validateDraftInput(input);
  await prisma.$transaction(async (tx) => {
    const season = await tx.season.findUnique({ where: { id: seasonId }, select: { id: true } });
    if (!season) throw new DraftError("대회를 찾을 수 없습니다.", 404);
    const participants = await tx.seasonParticipant.findMany({ where: { seasonId }, select: { streamerId: true, roles: true, position: true } });
    const byId = new Map(participants.map((item) => [String(item.streamerId), item]));
    const allMemberIds = input.teams.flatMap((team) => team.members);
    if (allMemberIds.some((id) => !byId.has(id)) || input.draftOrders.some((item) => !byId.has(item.streamerId)) || input.draftOrders.length !== participants.length) throw new DraftError("현재 시즌의 등록 참가자만 편성·지명할 수 있습니다. 화면을 다시 조회해주세요.", 409);
    const captains = new Set(participants.filter((item) => item.roles.includes("CAPTAIN")).map((item) => String(item.streamerId)));
    if (input.teams.length !== captains.size || input.teams.some((team) => team.members.filter((id) => captains.has(id)).length !== 1)) throw new DraftError("등록된 팀장마다 팀이 하나씩 있어야 하고 각 팀에는 팀장이 한 명이어야 합니다.", 400);
    if (input.teams.some((team) => team.members.filter((id) => byId.get(id)!.roles.includes("COACH") && !captains.has(id)).length > 1)) throw new DraftError("한 팀에 감독을 두 명 이상 배정할 수 없습니다.", 400);
    // 감독을 제외한 팀장과 선수는 다섯 명까지, 공격과 지원은 각각 두 명까지만 허용한다.
    for (const team of input.teams) {
      const roster = team.members.map((id) => byId.get(id)!).filter((item) => !item.roles.includes("COACH"));
      if (roster.length > 5) throw new DraftError("한 팀에는 팀장을 포함해 최대 5명까지 배정할 수 있습니다.", 400);
      if (roster.filter((item) => item.position === "DAMAGE").length > 2) throw new DraftError("한 팀의 딜러는 최대 2명까지 배정할 수 있습니다.", 400);
      if (roster.filter((item) => item.position === "SUPPORT" || item.position === "HEALER").length > 2) throw new DraftError("한 팀의 힐러는 최대 2명까지 배정할 수 있습니다.", 400);
    }
    if (input.draftOrders.some((item) => item.order !== null && (byId.get(item.streamerId)!.roles.includes("COACH") || captains.has(item.streamerId)))) throw new DraftError("팀장 또는 감독에게 선수 지명 순서를 지정할 수 없습니다.", 400);
    const existing = await tx.seasonTeam.findMany({ where: { seasonId } });
    const existingById = new Map(existing.map((item) => [String(item.id), item]));
    if (input.teams.some((team) => team.id && !existingById.has(team.id))) throw new DraftError("다른 시즌의 팀을 수정할 수 없습니다.", 400);
    const removed = existing.filter((item) => !input.teams.some((team) => team.id === String(item.id)));
    if (removed.length) {
      const teamIds = removed.map((item) => item.id);
      const [matchCount, setCount, banCount] = await Promise.all([
        tx.match.count({ where: { OR: [{ teamAId: { in: teamIds } }, { teamBId: { in: teamIds } }, { winnerTeamId: { in: teamIds } }] } }),
        tx.matchSet.count({ where: { winnerTeamId: { in: teamIds } } }),
        tx.heroBan.count({ where: { teamId: { in: teamIds } } }),
      ]);
      if (matchCount || setCount || banCount) throw new DraftError("경기 또는 영웅 밴 기록이 있는 팀은 삭제할 수 없습니다.", 409);
    }
    await tx.seasonTeamMember.deleteMany({ where: { seasonId } });
    // 유일 제약을 유지하면서 팀장 순서를 교환할 수 있도록 기존 번호를 비운다.
    await tx.seasonTeam.updateMany({ where: { seasonId }, data: { sortOrder: null } });
    for (const item of removed) {
      await tx.seasonTeam.delete({ where: { id: item.id } });
    }
    for (const team of input.teams) {
      let seasonTeamId: bigint;
      if (team.id) {
        const current = existingById.get(team.id)!;
        await tx.seasonTeam.update({ where: { id: current.id }, data: { name: team.name.trim() } });
        seasonTeamId = current.id;
      } else {
        const linked = await tx.seasonTeam.create({ data: { seasonId, name: team.name.trim() } });
        seasonTeamId = linked.id;
      }
      if (team.members.length) await tx.seasonTeamMember.createMany({ data: team.members.map((id) => ({ seasonId, seasonTeamId, streamerId: BigInt(id), position: byId.get(id)!.roles.includes("COACH") ? null : byId.get(id)!.position })) });
      await tx.seasonTeam.update({ where: { id: seasonTeamId }, data: { sortOrder: team.sortOrder } });
    }
    // 유일 제약과 순서 교환이 충돌하지 않도록 기존 번호를 먼저 비운다.
    await tx.seasonParticipant.updateMany({ where: { seasonId }, data: { draftOrder: null } });
    for (const item of input.draftOrders) if (item.order !== null) await tx.seasonParticipant.update({ where: { seasonId_streamerId: { seasonId, streamerId: BigInt(item.streamerId) } }, data: { draftOrder: item.order } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  return findSeasonDraft(seasonId);
}
