// File: lib/types/streamers.ts
// Page/Component: 스트리머 도메인 타입
// Purpose: 스트리머 관리와 Chzzk 채널 연동에 필요한 화면·API 데이터 형식을 정의한다.

export interface StreamerItem {
  id: string;
  name: string;
  type: string;
  isChzzk?: boolean;
  channelId?: string;
  channelUrl?: string;
  roles?: string[];
  followers: string;
  registeredDate: string;
  profileImg?: string;
  memo?: string;
  isUse?: boolean;
}

export interface StreamerFormData {
  isChzzk: boolean;
  channelUrl: string;
  name: string;
  profileImg: string;
  memo: string;
  isUse: boolean;
}

export interface ChzzkChannelCandidate {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  followerCount: number;
  followerText: string;
  channelDescription: string;
  openLive?: boolean;
  verifiedMark?: boolean;
}
