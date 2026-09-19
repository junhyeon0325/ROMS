// File: app/api/members/route.ts
// Page/Component: members API route
// Purpose: 회원 관리 기능의 실제 의미에 맞는 API 진입점을 제공한다.
// 기존 /api/streamers 호출은 하위 호환을 위해 유지한다.
export { GET, POST, PUT } from "../streamers/route";
