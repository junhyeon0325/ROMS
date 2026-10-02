// 경기·세트·영웅 밴·선수 기록의 관리자 입력과 조회 형식을 정의한다.
export interface MatchStatInput {
  streamerId: string;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  healing: number;
  mitigatedDamage: number;
  usedHeroIds?: string[];
  usedHeroSubareas?: Record<string, string[]>;
  usedHeroTurns?: Record<string, string[]>;
  lineupOrder?: number;
  isPotg: boolean;
}

export interface MapSubareaResultInput {
  order?: number;
  teamAScore?: number | null;
  teamBScore?: number | null;
  teamAProgress: number | null;
  teamBProgress: number | null;
  winnerTeamId: string | null;
}

export interface EscortTurnResultInput {
  attackTeamId?: string;
  points: number | null;
  payloadDistanceMeters: number | null;
}

export interface MatchSetInput {
  id?: string;
  setNumber: number;
  mapId: string | null;
  mapSubareaId?: string | null;
  mapSubareaName?: string;
  mapSubareaResults?: Record<string, MapSubareaResultInput>;
  teamAColor?: "BLUE" | "RED";
  hybridFirstAttackTeamId?: string | null;
  hybridTurnResults?: Record<string, { points: number | null; progressPercent: number | null; captureProgressPercent?: number | null; payloadDistanceMeters?: number | null; attackTeamId?: string }>;
  teamAPushDistanceMeters?: number | null;
  teamBPushDistanceMeters?: number | null;
  escortFirstAttackTeamId?: string | null;
  escortTurnResults?: Record<string, EscortTurnResultInput>;
  teamAEscortDistanceMeters?: number | null;
  teamBEscortDistanceMeters?: number | null;
  teamAEscortScore?: number | null;
  teamBEscortScore?: number | null;
  winnerTeamId: string | null;
  gameDurationSeconds: number | null;
  vodUrl: string;
  bans: { teamId: string; heroId: string }[];
  stats: MatchStatInput[];
}

export interface MatchInput {
  id?: string;
  seasonId: string;
  tournamentStage: string;
  matchDate: string;
  teamAId: string;
  teamBId: string;
  bestOf: number;
  remarks: string;
  sets: MatchSetInput[];
}

export interface MatchRecord extends MatchInput {
  id: string;
  winnerTeamId: string | null;
  teamAName: string;
  teamBName: string;
}
