// app/api/codes/groups/route.ts
/**
 * [공통코드 그룹 Supabase DB CRUD API 엔드포인트]
 * - Prisma Client를 통해 common_code_groups 테이블과 연동
 * - 그룹 목록 조회(GET), 등록(POST), 수정(PUT), 삭제(DELETE)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 포맷 직렬화 헬퍼 함수
function formatCodeGroup(g: any) {
  return {
    groupCode: g.groupCode,
    groupName: g.groupName,
    remarks: g.remarks || "",
    sortOrder: g.sortOrder ?? 0,
    isUse: g.isUse ?? true,
    createdAt: g.createdAt ? new Date(g.createdAt).toISOString().split("T")[0] : "",
  };
}

// 1. 공통코드 그룹 목록 조회 (GET)
export async function GET() {
  try {
    const groups = await prisma.commonCodeGroup.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const data = groups.map(formatCodeGroup);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("GET /api/codes/groups error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "공통코드 그룹 목록을 불러오지 못했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// 2. 신규 공통코드 그룹 등록 (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupCode, groupName, remarks, sortOrder, isUse } = body;

    const trimmedCode = groupCode?.trim().toUpperCase();
    const trimmedName = groupName?.trim();
    const remarkVal = remarks?.trim() || null;

    if (!trimmedCode || !trimmedName) {
      return NextResponse.json(
        { success: false, message: "그룹 코드와 그룹명을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    const CODE_REGEX = /^[A-Z0-9_]+$/;
    if (!CODE_REGEX.test(trimmedCode)) {
      return NextResponse.json(
        { success: false, message: "그룹 코드는 영문 대문자, 숫자, 언더스코어(_)만 사용할 수 있습니다. (예: SYSTEM_ROLE)" },
        { status: 400 }
      );
    }

    // 중복 체크
    const existing = await prisma.commonCodeGroup.findUnique({
      where: { groupCode: trimmedCode },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `이미 존재하는 그룹 코드 [${trimmedCode}] 입니다.` },
        { status: 409 }
      );
    }

    const created = await prisma.commonCodeGroup.create({
      data: {
        groupCode: trimmedCode,
        groupName: trimmedName,
        remarks: remarkVal,
        sortOrder: Number(sortOrder) || 0,
        isUse: isUse !== false,
      },
    });

    return NextResponse.json({
      success: true,
      message: `그룹 [${created.groupCode}]이(가) 데이터베이스에 등록되었습니다.`,
      data: formatCodeGroup(created),
    });
  } catch (error: any) {
    console.error("POST /api/codes/groups error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "공통코드 그룹 등록 중 데이터베이스 오류가 발생했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// 3. 공통코드 그룹 정보 수정 (PUT)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupCode, groupName, remarks, sortOrder, isUse } = body;

    const trimmedCode = groupCode?.trim().toUpperCase();
    const trimmedName = groupName?.trim();

    if (!trimmedCode) {
      return NextResponse.json(
        { success: false, message: "수정할 그룹 코드가 누락되었습니다." },
        { status: 400 }
      );
    }

    if (!trimmedName) {
      return NextResponse.json(
        { success: false, message: "그룹명을 입력해주세요." },
        { status: 400 }
      );
    }

    const updated = await prisma.commonCodeGroup.update({
      where: { groupCode: trimmedCode },
      data: {
        groupName: trimmedName,
        remarks: remarks !== undefined ? (remarks?.trim() || null) : undefined,
        sortOrder: Number(sortOrder) || 0,
        isUse: isUse !== false,
      },
    });

    return NextResponse.json({
      success: true,
      message: `그룹 [${updated.groupCode}] 정보가 수정되었습니다.`,
      data: formatCodeGroup(updated),
    });
  } catch (error: any) {
    console.error("PUT /api/codes/groups error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "공통코드 그룹 수정 중 데이터베이스 오류가 발생했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// 4. 공통코드 그룹 삭제 (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let groupCode = searchParams.get("groupCode");

    if (!groupCode) {
      const body = await request.json().catch(() => ({}));
      groupCode = body?.groupCode;
    }

    const trimmedCode = groupCode?.trim().toUpperCase();

    if (!trimmedCode) {
      return NextResponse.json(
        { success: false, message: "삭제할 그룹 코드가 필요합니다." },
        { status: 400 }
      );
    }

    await prisma.commonCodeGroup.delete({
      where: { groupCode: trimmedCode },
    });

    return NextResponse.json({
      success: true,
      message: `그룹 [${trimmedCode}] 및 소속 세부 코드가 데이터베이스에서 삭제되었습니다.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/codes/groups error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "공통코드 그룹 삭제 중 데이터베이스 오류가 발생했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
