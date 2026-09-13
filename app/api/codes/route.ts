// app/api/codes/route.ts
/**
 * [세부 공통코드 Supabase DB CRUD API 엔드포인트]
 * - Prisma Client를 통해 common_codes 테이블과 연동
 * - 세부 코드 목록 조회(GET), 등록(POST), 수정(PUT), 삭제(DELETE)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 포맷 직렬화 헬퍼 함수
function formatCode(c: any) {
  return {
    group: c.groupCode,
    code: c.code,
    name: c.codeName,
    sort: c.sortOrder ?? 0,
    useYn: c.isUse ? "Y" : ("N" as "Y" | "N"),
    desc: c.remarks || "",
  };
}

// 1. 세부 공통코드 목록 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupCode = searchParams.get("group");

    const whereCondition = groupCode ? { groupCode: groupCode.trim().toUpperCase() } : {};

    const codes = await prisma.commonCode.findMany({
      where: whereCondition,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const data = codes.map(formatCode);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("GET /api/codes error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "세부 코드 목록을 불러오지 못했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// 2. 신규 세부 공통코드 등록 (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const group = (body.group || body.groupCode)?.trim().toUpperCase();
    const code = body.code?.trim().toUpperCase();
    const name = (body.name || body.codeName)?.trim();
    const sort = body.sort ?? body.sortOrder ?? 1;
    const useYn = body.useYn ?? "Y";
    const desc = body.desc ?? body.remarks ?? "";

    if (!group) {
      return NextResponse.json(
        { success: false, message: "상위 코드 그룹이 지정되지 않았습니다." },
        { status: 400 }
      );
    }

    if (!code || !name) {
      return NextResponse.json(
        { success: false, message: "코드 ID와 코드명을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    // 그룹 존재 여부 확인
    const groupExists = await prisma.commonCodeGroup.findUnique({
      where: { groupCode: group },
    });
    if (!groupExists) {
      return NextResponse.json(
        { success: false, message: `존재하지 않는 상위 코드 그룹 [${group}] 입니다.` },
        { status: 404 }
      );
    }

    // 동일 그룹 내 코드 중복 체크
    const existing = await prisma.commonCode.findUnique({
      where: {
        groupCode_code: {
          groupCode: group,
          code: code,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `해당 그룹에 이미 동일한 코드 [${code}]가 존재합니다.` },
        { status: 409 }
      );
    }

    const created = await prisma.commonCode.create({
      data: {
        groupCode: group,
        code: code,
        codeName: name,
        sortOrder: Number(sort) || 0,
        isUse: useYn === "Y",
        remarks: desc?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `코드 [${created.code}]이(가) 데이터베이스에 등록되었습니다.`,
      data: formatCode(created),
    });
  } catch (error: any) {
    console.error("POST /api/codes error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "세부 코드 등록 중 데이터베이스 오류가 발생했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// 3. 세부 공통코드 정보 수정 (PUT)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const group = (body.group || body.groupCode)?.trim().toUpperCase();
    const code = body.code?.trim().toUpperCase();
    const name = (body.name || body.codeName)?.trim();
    const sort = body.sort ?? body.sortOrder ?? 1;
    const useYn = body.useYn;
    const desc = body.desc ?? body.remarks;

    if (!group || !code) {
      return NextResponse.json(
        { success: false, message: "수정할 그룹 코드와 세부 코드 ID가 필요합니다." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, message: "코드명을 입력해주세요." },
        { status: 400 }
      );
    }

    const updated = await prisma.commonCode.update({
      where: {
        groupCode_code: {
          groupCode: group,
          code: code,
        },
      },
      data: {
        codeName: name,
        sortOrder: Number(sort) || 0,
        ...(useYn !== undefined ? { isUse: useYn === "Y" } : {}),
        remarks: desc !== undefined ? (desc?.trim() || null) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: `코드 [${updated.code}] 정보가 수정되었습니다.`,
      data: formatCode(updated),
    });
  } catch (error: any) {
    console.error("PUT /api/codes error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "세부 코드 수정 중 데이터베이스 오류가 발생했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// 4. 세부 공통코드 삭제 (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let group = searchParams.get("group");
    let code = searchParams.get("code");

    if (!group || !code) {
      const body = await request.json().catch(() => ({}));
      group = body?.group || body?.groupCode;
      code = body?.code;
    }

    const trimmedGroup = group?.trim().toUpperCase();
    const trimmedCode = code?.trim().toUpperCase();

    if (!trimmedGroup || !trimmedCode) {
      return NextResponse.json(
        { success: false, message: "삭제할 그룹 코드와 세부 코드 ID가 필요합니다." },
        { status: 400 }
      );
    }

    await prisma.commonCode.delete({
      where: {
        groupCode_code: {
          groupCode: trimmedGroup,
          code: trimmedCode,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `코드 [${trimmedCode}]이(가) 데이터베이스에서 삭제되었습니다.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/codes error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "세부 코드 삭제 중 데이터베이스 오류가 발생했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
