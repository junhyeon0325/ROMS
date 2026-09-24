// 대회 참가자와 포지션·복수 역할을 팀 편성과 독립적으로 저장하고 조회한다.
import { prisma } from "@/lib/prisma";
import { PARTICIPANT_ROLE_GROUP_CODE, PLAYER_POSITION_GROUP_CODE } from "@/lib/constants/commonCodes";

export class ParticipantError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export interface ParticipantRoleUpdate {
  streamerId: bigint;
  roles: string[];
  position?: string | null;
}

const includeStreamer = { streamer: true } as const;

// DB 참가 관계를 화면에서 사용할 문자열 ID와 역할 코드로 변환한다.
function toDto(item: { id: bigint; seasonId: bigint; streamerId: bigint; roles: string[]; position: string | null; createdAt: Date; streamer: { name: string; profileImageUrl: string | null; chzzkChannelId: string | null } }) {
  return { id: item.id.toString(), seasonId: item.seasonId.toString(), streamerId: item.streamerId.toString(), name: item.streamer.name, profileImg: item.streamer.profileImageUrl || "", channelId: item.streamer.chzzkChannelId || "", roles: item.roles, position: item.position, registeredDate: item.createdAt.toISOString().slice(0, 10) };
}

// 선택한 대회의 참가자를 등록 순서로 조회한다.
export async function findParticipants(seasonId: bigint) {
  const items = await prisma.seasonParticipant.findMany({ where: { seasonId }, include: includeStreamer, orderBy: { createdAt: "asc" } });
  return items.map(toDto);
}

// 현재 활성 공통코드의 역할만 허용한다.
async function assertRoles(roles: string[]) {
  if (!roles.length || new Set(roles).size !== roles.length) throw new ParticipantError("역할을 중복 없이 한 개 이상 선택해주세요.", 400);
  const codes = await prisma.commonCode.findMany({ where: { groupCode: PARTICIPANT_ROLE_GROUP_CODE, isUse: true }, select: { code: true } });
  const allowed = new Set(codes.map((item) => item.code));
  if (roles.some((role) => !allowed.has(role))) throw new ParticipantError("사용할 수 없는 참가 역할이 포함되어 있습니다.", 400);
}

// 현재 활성 선수 포지션 공통코드에 등록된 값만 허용한다.
async function assertPositions(positions: string[]) {
  if (positions.some((position) => !position)) throw new ParticipantError("선수 포지션을 선택해주세요.", 400);
  const codes = await prisma.commonCode.findMany({ where: { groupCode: PLAYER_POSITION_GROUP_CODE, isUse: true }, select: { code: true } });
  const allowed = new Set(codes.map((item) => item.code));
  if (positions.some((position) => !allowed.has(position))) throw new ParticipantError("사용할 수 없는 선수 포지션이 포함되어 있습니다.", 400);
}

// 대회·스트리머·역할을 검증하고 한 대회에 동일 스트리머를 한 번만 등록한다.
export async function addParticipants(seasonId: bigint, streamerIds: bigint[], roles: string[], positions: Record<string, string | null>) {
  if (!streamerIds.length || new Set(streamerIds.map(String)).size !== streamerIds.length) throw new ParticipantError("스트리머를 중복 없이 선택해주세요.", 400);
  await assertRoles(roles);
  const participantPositions = streamerIds.map((streamerId) => positions[streamerId.toString()] ?? null);
  if (Object.keys(positions).length !== streamerIds.length || streamerIds.some((streamerId) => !Object.prototype.hasOwnProperty.call(positions, streamerId.toString()))) throw new ParticipantError("선수별 포지션을 모두 지정해주세요.", 400);
  if (roles.includes("COACH")) {
    if (participantPositions.some((position) => position !== null)) throw new ParticipantError("감독 역할 선수에게 포지션을 지정할 수 없습니다.", 400);
  } else {
    await assertPositions(participantPositions.map((position) => position || ""));
  }
  return prisma.$transaction(async (tx) => {
    const season = await tx.season.findUnique({ where: { id: seasonId }, select: { id: true } });
    if (!season) throw new ParticipantError("대회를 찾을 수 없습니다.", 404);
    const streamers = await tx.streamer.findMany({ where: { id: { in: streamerIds }, isUse: true }, select: { id: true } });
    if (streamers.length !== streamerIds.length) throw new ParticipantError("등록 가능한 스트리머를 찾을 수 없습니다.", 400);
    const existing = await tx.seasonParticipant.findMany({ where: { seasonId, streamerId: { in: streamerIds } }, select: { streamerId: true } });
    if (existing.length) throw new ParticipantError("이미 등록된 스트리머가 포함되어 있습니다.", 409);
    await tx.seasonParticipant.createMany({ data: streamerIds.map((streamerId) => ({ seasonId, streamerId, roles, position: positions[streamerId.toString()] })) });
    const result = await tx.seasonParticipant.findMany({ where: { seasonId, streamerId: { in: streamerIds } }, include: includeStreamer, orderBy: { createdAt: "asc" } });
    return result.map(toDto);
  });
}

// 선택한 대회에서 참가자의 역할과 전달된 경우 포지션만 수정한다.
export async function updateParticipantRoles(seasonId: bigint, streamerId: bigint, roles: string[], position?: string | null) {
  await assertRoles(roles);
  if (roles.includes("COACH")) {
    if (position !== undefined && position !== null) throw new ParticipantError("감독 역할 선수에게 포지션을 지정할 수 없습니다.", 400);
    position = null;
  }
  const existing = await prisma.seasonParticipant.findUnique({ where: { seasonId_streamerId: { seasonId, streamerId } }, select: { id: true, position: true } });
  if (!existing) throw new ParticipantError("참가자를 찾을 수 없습니다.", 404);
  const nextPosition = roles.includes("COACH") ? null : position === undefined ? existing.position : position;
  if (roles.includes("COACH")) position = null;
  else await assertPositions([nextPosition || ""]);
  return toDto(await prisma.seasonParticipant.update({ where: { id: existing.id }, data: { roles, ...(position !== undefined ? { position } : {}) }, include: includeStreamer }));
}

// 참가자 변경을 한 요청·트랜잭션으로 검증하고 역할·포지션이 같은 행을 묶어 갱신한다.
export async function updateParticipants(seasonId: bigint, updates: ParticipantRoleUpdate[]) {
  const streamerIds = updates.map((item) => item.streamerId);
  if (!updates.length || new Set(streamerIds.map(String)).size !== streamerIds.length) throw new ParticipantError("수정할 참가자를 중복 없이 한 명 이상 선택해주세요.", 400);
  if (updates.some((item) => !item.roles.length || new Set(item.roles).size !== item.roles.length)) throw new ParticipantError("역할을 중복 없이 한 개 이상 선택해주세요.", 400);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.seasonParticipant.findMany({ where: { seasonId, streamerId: { in: streamerIds } }, select: { id: true, streamerId: true, position: true } });
    if (existing.length !== updates.length) throw new ParticipantError("참가자를 찾을 수 없습니다.", 404);
    const existingByStreamer = new Map(existing.map((item) => [item.streamerId.toString(), item]));
    const roleCodes = await tx.commonCode.findMany({ where: { groupCode: PARTICIPANT_ROLE_GROUP_CODE, isUse: true }, select: { code: true } });
    const allowedRoles = new Set(roleCodes.map((item) => item.code));
    if (updates.some((item) => item.roles.some((role) => !allowedRoles.has(role)))) throw new ParticipantError("사용할 수 없는 참가 역할이 포함되어 있습니다.", 400);

    const normalized = updates.map((item) => {
      const current = existingByStreamer.get(item.streamerId.toString())!;
      if (item.roles.includes("COACH")) {
        if (item.position !== undefined && item.position !== null) throw new ParticipantError("감독 역할 선수에게 포지션을 지정할 수 없습니다.", 400);
        return { ...item, position: null };
      }
      return { ...item, position: item.position === undefined ? current.position : item.position };
    });
    const positions = normalized.filter((item) => !item.roles.includes("COACH")).map((item) => item.position || "");
    if (positions.length) {
      if (positions.some((position) => !position)) throw new ParticipantError("선수 포지션을 선택해주세요.", 400);
      const positionCodes = await tx.commonCode.findMany({ where: { groupCode: PLAYER_POSITION_GROUP_CODE, isUse: true }, select: { code: true } });
      const allowedPositions = new Set(positionCodes.map((item) => item.code));
      if (positions.some((position) => !allowedPositions.has(position))) throw new ParticipantError("사용할 수 없는 선수 포지션이 포함되어 있습니다.", 400);
    }

    const groups = new Map<string, { roles: string[]; position: string | null; streamerIds: bigint[] }>();
    normalized.forEach((item) => {
      const key = JSON.stringify([item.roles, item.position]);
      const group = groups.get(key) ?? { roles: item.roles, position: item.position, streamerIds: [] };
      group.streamerIds.push(item.streamerId);
      groups.set(key, group);
    });
    for (const group of groups.values()) {
      const result = await tx.seasonParticipant.updateMany({ where: { seasonId, streamerId: { in: group.streamerIds } }, data: { roles: group.roles, position: group.position } });
      if (result.count !== group.streamerIds.length) throw new ParticipantError("참가자 변경 중 일부 선수를 찾을 수 없습니다.", 404);
    }
    const saved = await tx.seasonParticipant.findMany({ where: { seasonId, streamerId: { in: streamerIds } }, include: includeStreamer, orderBy: { createdAt: "asc" } });
    return saved.map(toDto);
  });
}

// 선택한 대회에서 지정 스트리머의 참가 관계만 삭제한다.
export async function removeParticipant(seasonId: bigint, streamerId: bigint) {
  const deleted = await prisma.seasonParticipant.deleteMany({ where: { seasonId, streamerId } });
  if (!deleted.count) throw new ParticipantError("참가자를 찾을 수 없습니다.", 404);
}
