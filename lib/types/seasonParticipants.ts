// 대회에 등록된 스트리머와 공통코드 기반 포지션·복수 역할의 화면 데이터 형식이다.
export interface SeasonParticipantRecord {
  id: string;
  seasonId: string;
  streamerId: string;
  name: string;
  profileImg: string;
  channelId: string;
  roles: string[];
  position: string | null;
  registeredDate: string;
}
