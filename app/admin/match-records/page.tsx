// File: app/admin/match-records/page.tsx
// Page/Component: AdminMatchRecordsPage
// Purpose: 대회 운영 관리에서 저장된 경기 결과와 상세 기록을 조회 전용으로 표시한다.
import MatchRecordBrowser from "./MatchRecordBrowser";

// 관리자 조회 화면의 클라이언트 그리드를 연다.
export default function AdminMatchRecordsPage() {
  return <MatchRecordBrowser />;
}
