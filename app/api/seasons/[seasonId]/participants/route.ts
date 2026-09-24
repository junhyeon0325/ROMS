// 대회 참가자 조회·등록·역할 변경·제외 요청을 관리자 인증 후 처리한다.
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { addParticipants, findParticipants, ParticipantError, removeParticipant, updateParticipantRoles, updateParticipants } from "@/lib/seasons/participantService";

type Context = { params: Promise<{ seasonId: string }> };
const parseId = (value: unknown) => typeof value === "string" && /^[1-9]\d*$/.test(value) ? BigInt(value) : null;

// 클라이언트 오류와 DB 중복 제약 위반을 기존 API 응답 형식으로 변환한다.
function failure(error: unknown) {
  if (error instanceof ParticipantError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ success: false, message: "이미 등록된 스트리머가 포함되어 있습니다." }, { status: 409 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") return NextResponse.json({ success: false, message: "대회 참가자 테이블이 준비되지 않았습니다. DB 마이그레이션 적용이 필요합니다." }, { status: 503 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2024", "P2028"].includes(error.code)) return NextResponse.json({ success: false, message: "선수 일괄 등록 처리 시간이 초과되었습니다. 잠시 후 다시 시도해주세요." }, { status: 503 });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("season participants API database error:", error);
    return NextResponse.json({ success: false, message: `대회 참가자 데이터베이스 오류가 발생했습니다. (${error.code})` }, { status: 500 });
  }
  console.error("season participants API", error);
  return NextResponse.json({ success: false, message: "대회 참가자 처리에 실패했습니다." }, { status: 500 });
}

// 경로의 대회 ID를 검증해 저장 동작이 잘못된 대상에 적용되지 않게 한다.
async function seasonId(context: Context) { return parseId((await context.params).seasonId); }

// 선택한 대회의 저장된 참가자 목록을 반환한다.
export async function GET(_request: NextRequest, context: Context) {
  const auth = await requireAdminApi(); if (auth) return auth;
  const id = await seasonId(context); if (!id) return NextResponse.json({ success: false, message: "대회 ID가 올바르지 않습니다." }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await findParticipants(id) }); } catch (error) { return failure(error); }
}

// 여러 스트리머를 공통 역할과 함께 원자적으로 등록한다.
export async function POST(request: NextRequest, context: Context) {
  const auth = await requireAdminApi(); if (auth) return auth;
  const id = await seasonId(context); if (!id) return NextResponse.json({ success: false, message: "대회 ID가 올바르지 않습니다." }, { status: 400 });
  try {
    const body = await request.json();
    if (!body || !Array.isArray(body.streamerIds) || !Array.isArray(body.roles) || body.roles.some((value: unknown) => typeof value !== "string") || body.streamerIds.some((value: unknown) => !parseId(value)) || !body.positions || typeof body.positions !== "object" || Array.isArray(body.positions) || Object.values(body.positions).some((value: unknown) => value !== null && typeof value !== "string")) return NextResponse.json({ success: false, message: "참가자 입력이 올바르지 않습니다." }, { status: 400 });
    return NextResponse.json({ success: true, data: await addParticipants(id, body.streamerIds.map((value: string) => BigInt(value)), body.roles, body.positions) });
  } catch (error) { return failure(error); }
}

// 기존 참가자의 복수 역할을 갱신한다.
export async function PUT(request: NextRequest, context: Context) {
  const auth = await requireAdminApi(); if (auth) return auth;
  const id = await seasonId(context); if (!id) return NextResponse.json({ success: false, message: "대회 ID가 올바르지 않습니다." }, { status: 400 });
  try {
    const body = await request.json(); const streamerId = parseId(body?.streamerId);
    if (!streamerId || !Array.isArray(body.roles) || body.roles.some((value: unknown) => typeof value !== "string") || (body.position !== undefined && body.position !== null && typeof body.position !== "string")) return NextResponse.json({ success: false, message: "참가자 역할 및 포지션 입력이 올바르지 않습니다." }, { status: 400 });
    return NextResponse.json({ success: true, data: await updateParticipantRoles(id, streamerId, body.roles, body.position) });
  } catch (error) { return failure(error); }
}

// 변경된 참가자들의 역할·포지션을 한 번의 관리자 요청으로 저장한다.
export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireAdminApi(); if (auth) return auth;
  const id = await seasonId(context); if (!id) return NextResponse.json({ success: false, message: "대회 ID가 올바르지 않습니다." }, { status: 400 });
  try {
    const body = await request.json();
    if (!body || !Array.isArray(body.participants) || body.participants.some((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return true;
      const participant = item as { streamerId?: unknown; roles?: unknown; position?: unknown };
      return !parseId(participant.streamerId) || !Array.isArray(participant.roles) || participant.roles.some((role: unknown) => typeof role !== "string") || (participant.position !== undefined && participant.position !== null && typeof participant.position !== "string");
    })) return NextResponse.json({ success: false, message: "참가자 역할 및 포지션 입력이 올바르지 않습니다." }, { status: 400 });
    const updates = body.participants.map((item: { streamerId: string; roles: string[]; position?: string | null }) => ({ streamerId: BigInt(item.streamerId), roles: item.roles, ...(item.position !== undefined ? { position: item.position } : {}) }));
    return NextResponse.json({ success: true, data: await updateParticipants(id, updates) });
  } catch (error) { return failure(error); }
}

// 명시한 스트리머만 대회 참가 목록에서 제외한다.
export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireAdminApi(); if (auth) return auth;
  const id = await seasonId(context); const streamerId = parseId(request.nextUrl.searchParams.get("streamerId"));
  if (!id || !streamerId) return NextResponse.json({ success: false, message: "대회 또는 스트리머 ID가 올바르지 않습니다." }, { status: 400 });
  try { await removeParticipant(id, streamerId); return NextResponse.json({ success: true }); } catch (error) { return failure(error); }
}
