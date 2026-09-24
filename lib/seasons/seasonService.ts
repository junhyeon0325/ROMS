// 대회·세부 일정·등수별 상금을 한 저장 단위로 처리한다.
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatMoneyInput } from "@/lib/seasons/money";
import { formatSeasonDto, toKstDate } from "@/lib/seasons/seasonDto";
import type { SeasonPayload } from "@/lib/seasons/seasonValidator";

const includeDetails = { schedules: { orderBy: { sortOrder: "asc" as const } }, rankPrizes: { orderBy: { rank: "asc" as const } }, _count: { select: { seasonTeams: true } } };

// 대회 기본 필드를 만들고 소개·메모를 공통 비고 컬럼에 저장한다.
function toData(payload: SeasonPayload) {
  return {
    name: payload.name, status: payload.status,
    startDate: new Date(`${payload.startDate}T00:00:00.000Z`),
    endDate: new Date(`${payload.endDate}T00:00:00.000Z`),
    prize: `${formatMoneyInput(payload.prizeAmount)}원`,
    prizeAmount: new Prisma.Decimal(payload.prizeAmount),
    remarks: payload.remarks || null,
  };
}

// 날짜를 변경하지 않은 기존 일정의 시각은 보존하고 새 날짜만 자정으로 저장한다.
function toScheduleData(schedule: SeasonPayload["schedules"][number], sortOrder: number, previous?: { startAt: Date | null; endAt: Date | null }) {
  const startAt = schedule.startDate ? toKstDate(previous?.startAt ?? null) === schedule.startDate ? previous!.startAt : new Date(`${schedule.startDate}T00:00:00.000Z`) : null;
  const endAt = schedule.endDate ? toKstDate(previous?.endAt ?? null) === schedule.endDate ? previous!.endAt : new Date(`${schedule.endDate}T00:00:00.000Z`) : null;
  return { name: schedule.name, startAt, endAt, sortOrder };
}

// 화면 목록을 최신 생성 순으로 조회한다.
export async function findSeasons() {
  return (await prisma.season.findMany({ include: includeDetails, orderBy: { createdAt: "desc" } })).map(formatSeasonDto);
}

// 대회와 입력된 등수별 상금·일정을 함께 생성한다.
export async function createSeason(payload: SeasonPayload) {
  return formatSeasonDto(await prisma.season.create({
    data: { ...toData(payload), schedules: { create: payload.schedules.map((schedule, index) => toScheduleData(schedule, index)) }, rankPrizes: { create: payload.rankPrizes.map((prize) => ({ rank: prize.rank, amount: new Prisma.Decimal(prize.amount) })) } },
    include: includeDetails,
  }));
}

// 일정 ID와 변경하지 않은 기존 시각을 보존하고 모든 갱신을 한 트랜잭션으로 묶는다.
export async function updateSeason(id: bigint, payload: SeasonPayload) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.season.findUnique({ where: { id }, include: { schedules: true } });
    if (!existing) throw new Error("대회를 찾을 수 없습니다.");
    const existingById = new Map(existing.schedules.map((schedule) => [schedule.id.toString(), schedule]));
    const existingIds = new Set(existingById.keys());
    const retainedIds = payload.schedules.filter((schedule) => schedule.id).map((schedule) => schedule.id!);
    if (retainedIds.some((scheduleId) => !existingIds.has(scheduleId)) || new Set(retainedIds).size !== retainedIds.length) throw new Error("세부 일정 ID가 올바르지 않습니다.");
    await tx.season.update({
      where: { id },
      data: { ...toData(payload), rankPrizes: { deleteMany: {}, create: payload.rankPrizes.map((prize) => ({ rank: prize.rank, amount: new Prisma.Decimal(prize.amount) })) } },
    });
    await tx.seasonSchedule.deleteMany({ where: { seasonId: id, id: { notIn: retainedIds.map(BigInt) } } });
    for (const [sortOrder, schedule] of payload.schedules.entries()) {
      const data = toScheduleData(schedule, sortOrder, schedule.id ? existingById.get(schedule.id) : undefined);
      if (schedule.id) await tx.seasonSchedule.update({ where: { id: BigInt(schedule.id) }, data });
      else await tx.seasonSchedule.create({ data: { ...data, seasonId: id } });
    }
    const updated = await tx.season.findUniqueOrThrow({ where: { id }, include: includeDetails });
    return formatSeasonDto(updated);
  });
}

// 확인된 시즌 삭제 요청을 처리하고 DB 관계에 따라 연결된 기록을 함께 삭제한다.
export async function deleteSeason(id: bigint) {
  await prisma.season.delete({ where: { id } });
}
