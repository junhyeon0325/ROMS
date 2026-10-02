// File: app/admin/match-records/[matchId]/page.tsx
// Page/Component: AdminMatchRecordDetailPage
// Purpose: 선택 경기의 저장 기록을 읽기 전용 상세 페이지에서 보여준다.
import MatchRecordDetail from "./MatchRecordDetail";

// 경로의 경기 ID와 조회 대회 ID를 상세 화면에 전달한다.
export default async function AdminMatchRecordDetailPage({
  params, searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ seasonId?: string }>;
}) {
  const [{ matchId }, { seasonId }] = await Promise.all([params, searchParams]);
  return <MatchRecordDetail matchId={matchId} seasonId={seasonId ?? ""} />;
}
