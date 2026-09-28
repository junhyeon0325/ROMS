// 시즌 팀 편성 API의 인증 후 입력 검사와 서비스 연결을 검증한다.
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth-guards", () => ({ requireAdminApi: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/seasons/draftService", () => ({ findSeasonDraft: vi.fn().mockResolvedValue({ participants: [], teams: [] }), saveSeasonDraft: vi.fn().mockResolvedValue({ participants: [], teams: [] }) }));
import { GET, PUT } from "@/app/api/seasons/[seasonId]/draft/route";
import { saveSeasonDraft } from "@/lib/seasons/draftService";

const context = (seasonId: string) => ({ params: Promise.resolve({ seasonId }) });

describe("시즌 팀 편성 API", () => {
  it("시즌 ID와 저장 입력 형식을 검사한다", async () => {
    expect((await GET(new NextRequest("http://localhost/api/seasons/x/draft"), context("x"))).status).toBe(400);
    const response = await PUT(new NextRequest("http://localhost/api/seasons/3/draft", { method: "PUT", body: JSON.stringify({ teams: [{ name: "A", members: [1] }], draftOrders: [] }) }), context("3"));
    expect(response.status).toBe(400);
    expect(saveSeasonDraft).not.toHaveBeenCalled();
  });

  it("유효한 입력을 시즌 저장 서비스에 전달한다", async () => {
    const input = { teams: [{ name: "A", sortOrder: 1, members: ["1"] }], draftOrders: [{ streamerId: "1", order: 1 }] };
    const response = await PUT(new NextRequest("http://localhost/api/seasons/3/draft", { method: "PUT", body: JSON.stringify(input) }), context("3"));
    expect(response.status).toBe(200);
    expect(saveSeasonDraft).toHaveBeenCalledWith(BigInt(3), input);
  });
});
