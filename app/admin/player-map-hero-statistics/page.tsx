// File: app/admin/player-map-hero-statistics/page.tsx
// Page/Component: PlayerMapHeroStatisticsPage
// Purpose: 관리자에게 선수·맵·영웅 조합별 읽기 전용 사용 통계를 표시한다.
import PlayerMapHeroStatistics from "./PlayerMapHeroStatistics";

// 관리자 인증 레이아웃 안에서 조합별 통계 그리드를 연다.
export default function PlayerMapHeroStatisticsPage() {
  return <PlayerMapHeroStatistics />;
}
