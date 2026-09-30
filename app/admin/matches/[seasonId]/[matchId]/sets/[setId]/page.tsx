// File: app/admin/matches/[seasonId]/[matchId]/sets/[setId]/page.tsx
// Page/Component: AdminMatchSetDetailPage
// Purpose: 선택한 세트의 결과 정보와 양 팀 선수별 경기 기록을 편집한다.
import SetDetailEditor from "@/components/admin/SetDetailEditor";

// 세트와 대회를 식별하는 경로 값을 상세 입력 화면에 전달한다.
export default async function AdminMatchSetDetailPage({
  params,
}: {
  params: Promise<{ seasonId: string; matchId: string; setId: string }>;
}) {
  const { seasonId, matchId, setId } = await params;
  return (
    <SetDetailEditor seasonId={seasonId} matchId={matchId} setId={setId} />
  );
}
