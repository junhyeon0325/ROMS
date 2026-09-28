// 시즌별 팀 편성과 지명 순서의 관리자 조회·저장 API다.
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { findSeasonDraft, saveSeasonDraft } from "@/lib/seasons/draftService";
import { DraftError } from "@/lib/seasons/draftValidator";
import type { DraftSaveInput } from "@/lib/types/seasonDraft";

type Context = { params: Promise<{ seasonId: string }> };

// 경로의 시즌 ID를 양의 정수로 해석한다.
async function seasonId(context: Context) {
  const raw = (await context.params).seasonId;
  return /^[1-9]\d*$/.test(raw) ? BigInt(raw) : null;
}

// 저장 예외를 관리자 API의 오류 응답으로 변환한다.
function failure(error: unknown) {
  if (error instanceof DraftError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ success: false, message: "팀원 또는 지명 순서가 이미 등록되어 있습니다." }, { status: 409 });
  console.error("season draft API", error);
  return NextResponse.json({ success: false, message: "팀 편성을 처리하지 못했습니다." }, { status: 500 });
}

// 등록 참가자와 시즌별 팀 편성을 조회한다.
export async function GET(_request: NextRequest, context: Context) {
  const auth = await requireAdminApi(); if (auth) return auth;
  const id = await seasonId(context);
  if (!id) return NextResponse.json({ success: false, message: "대회 ID가 올바르지 않습니다." }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await findSeasonDraft(id) }); } catch (error) { return failure(error); }
}

// 전체 편성 입력 형식을 확인한 뒤 한 시즌의 구성을 저장한다.
export async function PUT(request: NextRequest, context: Context) {
  const auth = await requireAdminApi(); if (auth) return auth;
  const id = await seasonId(context);
  if (!id) return NextResponse.json({ success: false, message: "대회 ID가 올바르지 않습니다." }, { status: 400 });
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new DraftError("입력이 올바르지 않습니다.", 400);
    const input = body as Partial<DraftSaveInput>;
    if (!Array.isArray(input.teams) || !Array.isArray(input.draftOrders) || input.teams.some((team) => !team || typeof team.name !== "string" || typeof team.sortOrder !== "number" || (team.id !== undefined && typeof team.id !== "string") || !Array.isArray(team.members) || team.members.some((member: unknown) => typeof member !== "string")) || input.draftOrders.some((item) => !item || typeof item.streamerId !== "string" || (item.order !== null && typeof item.order !== "number"))) throw new DraftError("팀 또는 지명 입력이 올바르지 않습니다.", 400);
    return NextResponse.json({ success: true, data: await saveSeasonDraft(id, input as DraftSaveInput) });
  } catch (error) { return failure(error); }
}
