// File: app/api/codes/groups/route.ts
// Page/Component: 코드 그룹 API route
// Purpose: 공통 코드 그룹 요청을 인증 후 검증·서비스 계층으로 전달한다.

import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { createCodeGroup, deleteCodeGroup, findCodeGroup, findCodeGroups, updateCodeGroup } from "@/lib/codes/codeGroupService";
import { normalizeCodeGroupPayload, validateCodeGroupPayload } from "@/lib/codes/codeGroupValidator";

// 예외 객체에서 기존 API 응답의 error 필드에 넣을 메시지를 추출한다.
function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

// 공통 코드 그룹 목록을 조회한다.
export async function GET() {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try { return NextResponse.json({ success: true, data: await findCodeGroups() }); }
  catch (error) { console.error("GET /api/codes/groups error:", error); return NextResponse.json({ success: false, message: "공통코드 그룹 목록을 불러오지 못했습니다.", error: getErrorMessage(error) }, { status: 500 }); }
}

// 새 공통 코드 그룹을 검증하고 중복 없이 등록한다.
export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    const payload = normalizeCodeGroupPayload(await request.json());
    const validationError = validateCodeGroupPayload(payload);
    if (validationError) return NextResponse.json({ success: false, message: validationError }, { status: 400 });
    if (await findCodeGroup(payload.groupCode)) return NextResponse.json({ success: false, message: `이미 존재하는 그룹 코드 [${payload.groupCode}] 입니다.` }, { status: 409 });
    const data = await createCodeGroup(payload);
    return NextResponse.json({ success: true, message: `그룹 [${data.groupCode}]이(가) 데이터베이스에 등록되었습니다.`, data });
  } catch (error) { console.error("POST /api/codes/groups error:", error); return NextResponse.json({ success: false, message: "공통코드 그룹 등록 중 데이터베이스 오류가 발생했습니다.", error: getErrorMessage(error) }, { status: 500 }); }
}

// 기존 공통 코드 그룹을 검증한 값으로 수정한다.
export async function PUT(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    const payload = normalizeCodeGroupPayload(await request.json());
    const validationError = validateCodeGroupPayload(payload);
    if (validationError) return NextResponse.json({ success: false, message: validationError }, { status: 400 });
    const data = await updateCodeGroup(payload);
    return NextResponse.json({ success: true, message: `그룹 [${data.groupCode}] 정보가 수정되었습니다.`, data });
  } catch (error) { console.error("PUT /api/codes/groups error:", error); return NextResponse.json({ success: false, message: "공통코드 그룹 수정 중 데이터베이스 오류가 발생했습니다.", error: getErrorMessage(error) }, { status: 500 }); }
}

// 요청 URL 또는 본문의 그룹 코드를 기준으로 코드 그룹을 삭제한다.
export async function DELETE(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const body = searchParams.get("groupCode") ? {} : await request.json().catch(() => ({}));
    const groupCode = (searchParams.get("groupCode") || body.groupCode || "").trim().toUpperCase();
    const validationError = validateCodeGroupPayload({ groupCode, groupName: "", remarks: null, sortOrder: 0, isUse: true }, false);
    if (validationError) return NextResponse.json({ success: false, message: validationError }, { status: 400 });
    await deleteCodeGroup(groupCode);
    return NextResponse.json({ success: true, message: `그룹 [${groupCode}] 및 소속 상세 코드가 데이터베이스에서 삭제되었습니다.` });
  } catch (error) { console.error("DELETE /api/codes/groups error:", error); return NextResponse.json({ success: false, message: "공통코드 그룹 삭제 중 데이터베이스 오류가 발생했습니다.", error: getErrorMessage(error) }, { status: 500 }); }
}
