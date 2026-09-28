// 시즌 전용 팀 편성과 참가자별 단일 지명 순서를 화면과 API에서 공유한다.
import type { SeasonParticipantRecord } from "./seasonParticipants";

export interface DraftTeam {
  id: string;
  name: string;
  sortOrder: number | null;
  members: string[];
}

export interface SeasonDraft {
  participants: SeasonParticipantRecord[];
  teams: DraftTeam[];
}

export interface DraftSaveTeam {
  id?: string;
  name: string;
  sortOrder: number;
  members: string[];
}

export interface DraftSaveInput {
  teams: DraftSaveTeam[];
  draftOrders: { streamerId: string; order: number | null }[];
}
