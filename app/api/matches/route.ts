// File: app/api/matches/route.ts
// Page/Component: 경기 기록 API
// Purpose: 관리자 인증 후 대회 경기와 세트·밴·선수 기록의 조회·저장·삭제를 처리한다.
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { AuthorizationError, requireAdmin, requireAdminApi } from "@/lib/auth-guards";
import { deleteMatch, findMatch, findMatchSummaries, findMatches, saveMatch, updateMatchSection } from "@/lib/matches/matchService";
import { MatchError, parseMatchInput } from "@/lib/matches/matchValidator";

// 숫자형 ID만 허용해 잘못된 요청을 DB 작업 전에 차단한다.
function parseId(value: string | null): bigint | null { return value && /^[1-9]\d*$/.test(value) ? BigInt(value) : null; }

// 검증 및 참조 오류를 관리자 화면의 공통 응답 형식으로 변환한다.
function failure(error: unknown) {
  if (error instanceof AuthorizationError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
  if (error instanceof MatchError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ success: false, message: "경기를 찾을 수 없습니다." }, { status: 404 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2021", "P2022"].includes(error.code)) return NextResponse.json({ success: false, message: "경기 기록용 DB 마이그레이션 적용이 필요합니다." }, { status: 503 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return NextResponse.json({ success: false, message: "동시에 변경된 경기 기록이 있습니다. 다시 조회한 뒤 저장해주세요." }, { status: 409 });
  console.error("matches API", error);
  return NextResponse.json({ success: false, message: "경기 기록을 처리하지 못했습니다." }, { status: 500 });
}

// 선택한 대회의 경기와 하위 기록을 조회한다.
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(); if (auth) return auth;
  const seasonId = parseId(request.nextUrl.searchParams.get("seasonId"));
  if (!seasonId) return NextResponse.json({ success: false, message: "대회 ID가 올바르지 않습니다." }, { status: 400 });
  const matchId = parseId(request.nextUrl.searchParams.get("matchId"));
  try {
    if (matchId) {
      const match = await findMatch(seasonId, matchId);
      return match ? NextResponse.json({ success: true, data: match }) : NextResponse.json({ success: false, message: "경기를 찾을 수 없습니다." }, { status: 404 });
    }
    if (request.nextUrl.searchParams.get("summary") === "true") return NextResponse.json({ success: true, data: await findMatchSummaries(seasonId) });
    return NextResponse.json({ success: true, data: await findMatches(seasonId) });
  } catch (error) { return failure(error); }
}

// 대회 경기와 입력된 세트 기록을 새로 등록한다.
export async function POST(request: NextRequest) {
  try { const user = await requireAdmin(); const input = parseMatchInput(await request.json()); if (input.id) throw new MatchError("새 경기에는 ID를 지정할 수 없습니다."); return NextResponse.json({ success: true, data: await saveMatch(input, user.id) }); } catch (error) { return failure(error); }
}

// 기존 경기와 세트별 기록을 수정한다.
export async function PUT(request: NextRequest) {
  try { const user = await requireAdmin(); const input = parseMatchInput(await request.json()); if (!input.id) throw new MatchError("수정할 경기 ID가 필요합니다."); return NextResponse.json({ success: true, data: await saveMatch(input, user.id) }); } catch (error) { return failure(error); }
}

// 경기 기본정보·전체 세트·단일 상세 세트 중 요청한 영역만 현재 저장값과 합쳐 수정한다.
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json() as { id?: unknown; scope?: unknown; data?: unknown };
    const id = typeof body?.id === "string" ? parseId(body.id) : null;
    if (!id || (body.scope !== "match" && body.scope !== "sets" && body.scope !== "setDetail")) throw new MatchError("경기 ID와 수정 영역을 확인해주세요.");
    return NextResponse.json({ success: true, data: await updateMatchSection(id, body.scope, body.data, user.id) });
  } catch (error) { return failure(error); }
}

// 명시적 확인 ID와 일치하는 경기만 삭제한다.
export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApi(); if (auth) return auth;
  const id = parseId(request.nextUrl.searchParams.get("id"));
  if (!id || parseId(request.nextUrl.searchParams.get("confirmId")) !== id) return NextResponse.json({ success: false, message: "삭제할 경기의 확인 ID가 필요합니다." }, { status: 400 });
  try { await deleteMatch(id); return NextResponse.json({ success: true }); } catch (error) { return failure(error); }
}
