// File: lib/types/seasons.ts
// Page/Component: 시즌 도메인 타입
// Purpose: 시즌 등록 정보와 참가자 상태에 필요한 데이터 형식을 정의한다.

export interface SeasonParticipant {
  id: string;
  seasonId: string;
  memberId: string;
  memberName: string;
  memberType: string;
  channelId?: string;
  profileImg?: string;
  roles: string[];
  teamName?: string;
  registeredDate: string;
}

export interface SeasonItem {
  id: string;
  name: string;
  status: "개최 예정" | "진행중" | "종료";
  period: string;
  startDate: string;
  endDate: string;
  schedules: SeasonSchedule[];
  rankPrizes: SeasonRankPrize[];
  teamCount: number;
  prize: string;
  prizeAmount: string | null;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeasonSchedule {
  id?: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
}

export interface SeasonRankPrize {
  rank: number;
  amount: string;
}
