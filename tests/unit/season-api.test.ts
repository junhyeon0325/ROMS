// 대회 삭제 API가 명시적 확인 값 없이 데이터 삭제를 실행하지 않는지 확인한다.
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth-guards", () => ({ requireAdminApi: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/seasons/seasonService", () => ({ createSeason: vi.fn(), deleteSeason: vi.fn(), findSeasons: vi.fn(), updateSeason: vi.fn() }));

import { DELETE } from "@/app/api/seasons/route";
import { deleteSeason } from "@/lib/seasons/seasonService";

describe("대회 삭제 API", () => {
  it("확인 ID가 없거나 대상과 다르면 삭제를 거부한다", async () => {
    for (const query of ["id=7", "id=7&confirmId=8"]) {
      const response = await DELETE(new NextRequest(`http://localhost/api/seasons?${query}`));
      expect(response.status).toBe(400);
    }
    expect(deleteSeason).not.toHaveBeenCalled();
  });

  it("확인 ID가 선택한 대회와 일치하면 삭제한다", async () => {
    const response = await DELETE(new NextRequest("http://localhost/api/seasons?id=7&confirmId=7"));
    expect(response.status).toBe(200);
    expect(deleteSeason).toHaveBeenCalledWith(BigInt(7));
  });
});
