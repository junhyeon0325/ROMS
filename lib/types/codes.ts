// File: lib/types/codes.ts
// Page/Component: 공통 코드 도메인 타입
// Purpose: 공통 코드 그룹과 상세 코드의 API·화면 데이터 형식을 정의한다.

export interface CodeGroupItem {
  groupCode: string;
  groupName: string;
  remarks?: string;
  sortOrder: number;
  isUse: boolean;
  createdAt?: string;
}

export interface CodeItem {
  groupCode: string;
  code: string;
  name: string;
  sortOrder: number;
  isUse: boolean;
  remarks?: string;
}
