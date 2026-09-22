// File: lib/types/tournaments.ts
// Page/Component: 토너먼트 도메인 타입
// Purpose: 토너먼트와 참가자 상태에 필요한 데이터 형식을 정의한다.

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  memberId: string;
  memberName: string;
  memberType: string;
  channelId?: string;
  profileImg?: string;
  roles: string[];
  teamName?: string;
  registeredDate: string;
}

export interface TournamentItem {
  id: string;
  name: string;
  status: "진행중" | "접수중" | "종료";
  period: string;
  teams: number;
  prize: string;
  organizer: string;
  desc: string;
}
