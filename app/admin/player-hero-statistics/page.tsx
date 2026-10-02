// File: app/admin/player-hero-statistics/page.tsx
// Page/Component: PlayerHeroStatisticsPage
// Purpose: 관리자에게 선수별 영웅 사용 통계를 독립된 페이지로 표시한다.
import PlayerPairStatistics from "@/components/admin/PlayerPairStatistics";

// 선수와 영웅 조합의 읽기 전용 통계 화면을 연다.
export default function PlayerHeroStatisticsPage() {
  return <PlayerPairStatistics kind="hero" />;
}
