// 경기 입력의 구조와 완료 조건을 검증하고 세트 승수로 승리팀을 계산한다.
import type { MatchInput } from "@/lib/types/matches";

export class MatchError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

const idPattern = /^[1-9]\d*$/;
// 문자열 ID가 양의 정수 형식인지 확인한다.
const validId = (value: unknown): value is string => typeof value === "string" && idPattern.test(value);
// 세트의 선택 항목이 비어 있거나 유효한 ID인지 확인한다.
const validNullableId = (value: unknown) => value === null || validId(value);
// 선수 기록의 수치가 음수가 아닌 안전한 정수인지 확인한다.
const validCount = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

// 요청 본문의 중첩 항목을 검증해 잘못된 값이 서비스 계층에 도달하지 않게 한다.
export function parseMatchInput(value: unknown): MatchInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new MatchError("경기 입력이 올바르지 않습니다.");
  const input = value as Partial<MatchInput>;
  if ((input.id !== undefined && !validId(input.id)) || !validId(input.seasonId) || !validId(input.teamAId) || !validId(input.teamBId) || input.teamAId === input.teamBId) throw new MatchError("대회와 서로 다른 두 팀을 선택해주세요.");
  if (typeof input.tournamentStage !== "string" || !input.tournamentStage.trim() || input.tournamentStage.trim().length > 100 || ![3, 5, 7].includes(input.bestOf as number)) throw new MatchError("경기 단계와 진행 방식(Bo3·Bo5·Bo7)을 확인해주세요.");
  const dateOnlyMatch = typeof input.matchDate === "string" ? input.matchDate.match(/^(\d{4}-\d{2}-\d{2})$/) : null;
  const validDateOnly = Boolean(dateOnlyMatch && !Number.isNaN(Date.parse(`${dateOnlyMatch[1]}T00:00:00.000Z`)) && new Date(`${dateOnlyMatch[1]}T00:00:00.000Z`).toISOString().slice(0, 10) === dateOnlyMatch[1]);
  const validDateTime = typeof input.matchDate === "string" && /^\d{4}-\d{2}-\d{2}T/.test(input.matchDate) && !Number.isNaN(Date.parse(input.matchDate));
  if (typeof input.matchDate !== "string" || (input.matchDate && !validDateOnly && !validDateTime) || typeof input.remarks !== "string" || input.remarks.length > 2000 || !Array.isArray(input.sets) || input.sets.length > input.bestOf!) throw new MatchError("경기 날짜·비고·세트 수를 확인해주세요.");
  const setNumbers = new Set<number>();
  const setIds = new Set<string>();
  for (const set of input.sets) {
    if (!set || (set.id !== undefined && !validId(set.id)) || !Number.isSafeInteger(set.setNumber) || set.setNumber < 1 || set.setNumber > input.bestOf! || setNumbers.has(set.setNumber) || (set.id && setIds.has(set.id))) throw new MatchError("세트 번호 또는 세트 ID가 올바르지 않습니다.");
    setNumbers.add(set.setNumber);
    if (set.id) setIds.add(set.id);
    if (!validNullableId(set.mapId) || (set.mapSubareaId !== undefined && !validNullableId(set.mapSubareaId)) || (set.mapSubareaId && !set.mapId) || (set.teamAColor !== undefined && !["BLUE", "RED"].includes(set.teamAColor)) || !validNullableId(set.winnerTeamId) || (set.winnerTeamId !== null && ![input.teamAId, input.teamBId].includes(set.winnerTeamId)) || (set.winnerTeamId && !set.mapId)) throw new MatchError("세트 맵·세부 지역·팀 색상과 승리팀을 확인해주세요.");
    if (set.hybridFirstAttackTeamId !== undefined && set.hybridFirstAttackTeamId !== null && ![input.teamAId, input.teamBId].includes(set.hybridFirstAttackTeamId)) throw new MatchError("선공 팀은 해당 경기의 두 팀 중에서 선택해주세요.");
    if ([set.teamAPushDistanceMeters, set.teamBPushDistanceMeters].some((distance) => distance !== undefined && distance !== null && (typeof distance !== "number" || !Number.isFinite(distance) || distance < 0))) throw new MatchError("밀기 맵의 팀별 진행 거리는 0 이상의 유한한 미터 값이어야 합니다.");
    const extraTurnIds = Object.keys(set.hybridTurnResults ?? {}).filter((id) => /^turn-(?:[3-9]|[1-9]\d+)$/.test(id)).sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));
    if (extraTurnIds.some((id, index) => id !== `turn-${index + 3}`)) throw new MatchError("추가 턴의 순서가 올바르지 않습니다.");
    // 새 거점 비율과 화물 거리는 각각 퍼센트 범위와 음이 아닌 유한한 미터 값으로 검증한다.
    if (set.hybridTurnResults !== undefined && (!set.hybridTurnResults || typeof set.hybridTurnResults !== "object" || Array.isArray(set.hybridTurnResults) || Object.entries(set.hybridTurnResults).some(([turnId, result]) => !([input.teamAId, input.teamBId].includes(turnId) || extraTurnIds.includes(turnId)) || !result || typeof result !== "object" || (extraTurnIds.includes(turnId) ? ![input.teamAId, input.teamBId].includes(result.attackTeamId ?? "") : result.attackTeamId !== undefined) || (result.points !== null && (!validCount(result.points) || result.points > 99)) || (result.progressPercent !== null && (!validCount(result.progressPercent) || result.progressPercent > 100)) || (result.captureProgressPercent !== undefined && result.captureProgressPercent !== null && (!Number.isSafeInteger(result.captureProgressPercent) || result.captureProgressPercent < 0 || result.captureProgressPercent > 100)) || (result.payloadDistanceMeters !== undefined && result.payloadDistanceMeters !== null && (typeof result.payloadDistanceMeters !== "number" || !Number.isFinite(result.payloadDistanceMeters) || result.payloadDistanceMeters < 0))))) throw new MatchError("공격 턴의 팀·점수·거점 진행률·화물 거리를 확인해주세요.");
    if (Object.keys(set.hybridTurnResults ?? {}).length > 0 && !set.hybridFirstAttackTeamId) throw new MatchError("공격 턴 결과를 저장하려면 선공 팀을 지정해주세요.");
    if (set.stats.some((stat) => Object.values(stat.usedHeroTurns ?? {}).some((heroes) => heroes.length > 0)) && !set.hybridFirstAttackTeamId) throw new MatchError("턴별 사용 영웅을 저장하려면 선공 팀을 지정해주세요.");
    if (set.mapSubareaResults !== undefined && (!set.mapSubareaResults || typeof set.mapSubareaResults !== "object" || Array.isArray(set.mapSubareaResults) || Object.entries(set.mapSubareaResults).some(([id, result]) => !validId(id) || !result || typeof result !== "object" || (result.order !== undefined && !validCount(result.order)) || ![result.teamAScore, result.teamBScore].every((value) => value === undefined || value === null || (validCount(value) && value <= 99)) || ![result.teamAProgress, result.teamBProgress].every((value) => value === null || (Number.isSafeInteger(value) && value >= 0 && value <= 100)) || !validNullableId(result.winnerTeamId) || (result.winnerTeamId !== null && ![input.teamAId, input.teamBId].includes(result.winnerTeamId))))) throw new MatchError("구역별 점수·점유율은 허용 범위의 정수로, 승리 팀은 해당 경기 팀으로 입력해주세요.");
    if (set.gameDurationSeconds !== null && (!validCount(set.gameDurationSeconds) || set.gameDurationSeconds === 0)) throw new MatchError("경기 시간은 양의 정수(초)로 입력해주세요.");
    if (typeof set.vodUrl !== "string" || set.vodUrl.length > 2000 || (set.vodUrl && !/^https?:\/\//i.test(set.vodUrl))) throw new MatchError("VOD 주소는 http 또는 https 주소여야 합니다.");
    if (!Array.isArray(set.bans) || !Array.isArray(set.stats)) throw new MatchError("영웅 밴과 선수 기록 형식을 확인해주세요.");
    const banKeys = new Set<string>();
    for (const ban of set.bans) {
      if (!ban || ![input.teamAId, input.teamBId].includes(ban.teamId) || !validId(ban.heroId) || banKeys.has(`${ban.teamId}:${ban.heroId}`)) throw new MatchError("영웅 밴의 팀·영웅 또는 중복을 확인해주세요.");
      banKeys.add(`${ban.teamId}:${ban.heroId}`);
    }
    const players = new Set<string>();
    for (const stat of set.stats) {
      if (!stat || !validId(stat.streamerId) || players.has(stat.streamerId) || ![stat.kills, stat.deaths, stat.assists, stat.damage, stat.healing, stat.mitigatedDamage].every(validCount) || (stat.lineupOrder !== undefined && !validCount(stat.lineupOrder)) || (stat.usedHeroIds !== undefined && (!Array.isArray(stat.usedHeroIds) || stat.usedHeroIds.some((id) => !validId(id)) || new Set(stat.usedHeroIds).size !== stat.usedHeroIds.length)) || (stat.usedHeroSubareas !== undefined && (!stat.usedHeroSubareas || typeof stat.usedHeroSubareas !== "object" || Array.isArray(stat.usedHeroSubareas) || Object.entries(stat.usedHeroSubareas).some(([heroId, ids]) => !validId(heroId) || !Array.isArray(ids) || ids.some((id) => !validId(id)) || new Set(ids).size !== ids.length))) || typeof stat.isPotg !== "boolean") throw new MatchError("선수 기록의 선수·수치 또는 중복을 확인해주세요.");
      if (stat.usedHeroSubareas && Object.keys(stat.usedHeroSubareas).some((heroId) => !(stat.usedHeroIds ?? []).includes(heroId))) throw new MatchError("세부 지역 기록은 선수의 사용 영웅에 연결해야 합니다.");
      if (stat.usedHeroTurns !== undefined && (!stat.usedHeroTurns || typeof stat.usedHeroTurns !== "object" || Array.isArray(stat.usedHeroTurns) || Object.entries(stat.usedHeroTurns).some(([turnId, ids]) => !([input.teamAId, input.teamBId].includes(turnId) || extraTurnIds.includes(turnId)) || !Array.isArray(ids) || ids.some((id) => !validId(id) || !(stat.usedHeroIds ?? []).includes(id)) || new Set(ids).size !== ids.length))) throw new MatchError("턴별 사용 영웅과 선공 팀을 확인해주세요.");
      players.add(stat.streamerId);
    }
    if (set.stats.filter((stat) => stat.isPotg).length > 1) throw new MatchError("세트 POTG는 한 명만 선택해주세요.");
  }
  return input as MatchInput;
}

// 목표 세트 승수에 도달한 팀만 경기 승리팀으로 확정한다.
export function computeMatchWinner(input: Pick<MatchInput, "bestOf" | "teamAId" | "teamBId" | "sets">): string | null {
  const target = Math.floor(input.bestOf / 2) + 1;
  const scores = new Map([[input.teamAId, 0], [input.teamBId, 0]]);
  for (const set of [...input.sets].sort((a, b) => a.setNumber - b.setNumber)) {
    if (!set.winnerTeamId) continue;
    const score = (scores.get(set.winnerTeamId) ?? 0) + 1;
    scores.set(set.winnerTeamId, score);
    if (score === target) return set.winnerTeamId;
  }
  return null;
}
