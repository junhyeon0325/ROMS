// 시즌 맵 구성 API의 인증, ID·중복 입력 검증과 서비스 연결을 확인한다.
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth-guards", () => ({ requireAdminApi: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/seasons/mapPoolService", () => ({ findSeasonMaps: vi.fn().mockResolvedValue([]), saveSeasonMaps: vi.fn().mockResolvedValue([]) }));
import { GET, PUT } from "@/app/api/seasons/[seasonId]/maps/route";
import { saveSeasonMaps } from "@/lib/seasons/mapPoolService";

const context = (seasonId: string) => ({ params: Promise.resolve({ seasonId }) });

describe("시즌 맵 구성 API", () => {
  it("구성을 조회한다", async () => {
    const response = await GET(new NextRequest("http://localhost/api/seasons/4/maps"), context("4"));
    expect(response.status).toBe(200);
  });

  it("잘못된 ID와 중복 맵 입력은 거부한다", async () => {
    expect((await GET(new NextRequest("http://localhost/api/seasons/x/maps"), context("x"))).status).toBe(400);
    const duplicate = await PUT(new NextRequest("http://localhost/api/seasons/4/maps", { method: "PUT", body: JSON.stringify({ mapIds: ["5", "5"] }) }), context("4"));
    expect(duplicate.status).toBe(400);
    expect(saveSeasonMaps).not.toHaveBeenCalled();
  });

  it("유효한 맵 ID 배열을 구성 저장 서비스에 전달한다", async () => {
    const response = await PUT(new NextRequest("http://localhost/api/seasons/4/maps", { method: "PUT", body: JSON.stringify({ mapIds: ["5", "6"] }) }), context("4"));
    expect(response.status).toBe(200);
    expect(saveSeasonMaps).toHaveBeenCalledWith(BigInt(4), [BigInt(5), BigInt(6)]);
  });
});
