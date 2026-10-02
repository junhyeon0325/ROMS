// File: app/admin/match-statistics/page.tsx
// Page/Component: AdminMatchStatisticsPage
// Purpose: 선수·맵·영웅별 저장 경기 통계를 관리자에게 조회 전용으로 표시한다.
import MatchStatistics from "./MatchStatistics";

// 관리자 인증 레이아웃 안에서 통계 조회 화면을 렌더링한다.
export default function AdminMatchStatisticsPage() {
  return <MatchStatistics />;
}
