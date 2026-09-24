// 참가자 API가 인증과 입력 검증을 거친 뒤 서비스에 전달하는지 확인한다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), add: vi.fn(), find: vi.fn(), update: vi.fn(), updateBatch: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/auth-guards", () => ({ requireAdminApi: mocks.auth }));
vi.mock("@/lib/seasons/participantService", () => ({
  ParticipantError: class ParticipantError extends Error { constructor(message: string, public status: number) { super(message); } },
  addParticipants: mocks.add, findParticipants: mocks.find, updateParticipantRoles: mocks.update, updateParticipants: mocks.updateBatch, removeParticipant: mocks.remove,
}));
import { GET, PATCH, POST, PUT } from "@/app/api/seasons/[seasonId]/participants/route";

const context = { params: Promise.resolve({ seasonId: "7" }) };

describe("대회 참가자 API", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue(null); mocks.find.mockResolvedValue([]); mocks.add.mockResolvedValue([]); });

  it("인증 실패 시 참가자 조회를 실행하지 않는다", async () => {
    mocks.auth.mockResolvedValue(NextResponse.json({ success: false }, { status: 401 }));
    expect((await GET(new NextRequest("http://localhost/api/seasons/7/participants"), context)).status).toBe(401);
    expect(mocks.find).not.toHaveBeenCalled();
  });

  it("참가자 테이블 미생성 오류를 운영 설정 안내로 반환한다", async () => {
    mocks.find.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("table missing", { code: "P2021", clientVersion: "5.22.0" }));
    const response = await GET(new NextRequest("http://localhost/api/seasons/7/participants"), context);
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ message: expect.stringContaining("DB 마이그레이션") });
  });

  it("대량 저장 트랜잭션 시간 초과를 다시 시도할 수 있는 오류로 반환한다", async () => {
    mocks.find.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("transaction timed out", { code: "P2028", clientVersion: "5.22.0" }));
    const response = await GET(new NextRequest("http://localhost/api/seasons/7/participants"), context);
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ message: expect.stringContaining("시간이 초과") });
  });

  it("잘못된 ID와 역할 형식을 거부하고 저장을 실행하지 않는다", async () => {
    const request = (body: unknown) => new NextRequest("http://localhost/api/seasons/7/participants", { method: "POST", body: JSON.stringify(body) });
    expect((await POST(request({ streamerIds: ["no"], roles: ["PLAYER"] }), context)).status).toBe(400);
    expect((await POST(request({ streamerIds: ["1"], roles: [5] }), context)).status).toBe(400);
    expect(mocks.add).not.toHaveBeenCalled();
  });

  it("검증된 여러 선수와 역할 코드를 전달한다", async () => {
    const request = new NextRequest("http://localhost/api/seasons/7/participants", { method: "POST", body: JSON.stringify({ streamerIds: ["1", "2"], roles: ["PLAYER", "CAPTAIN"], positions: { "1": "TANK", "2": "SUPPORT" } }) });
    expect((await POST(request, context)).status).toBe(200);
    expect(mocks.add).toHaveBeenCalledWith(BigInt(7), [BigInt(1), BigInt(2)], ["PLAYER", "CAPTAIN"], { "1": "TANK", "2": "SUPPORT" });
  });

  it("감독 참가자의 포지션 없는 등록을 서비스에 전달한다", async () => {
    const request = new NextRequest("http://localhost/api/seasons/7/participants", { method: "POST", body: JSON.stringify({ streamerIds: ["1"], roles: ["COACH"], positions: { "1": null } }) });
    expect((await POST(request, context)).status).toBe(200);
    expect(mocks.add).toHaveBeenCalledWith(BigInt(7), [BigInt(1)], ["COACH"], { "1": null });
  });

  it("역할 변경 시 참가자 ID를 확인한다", async () => {
    const request = new NextRequest("http://localhost/api/seasons/7/participants", { method: "PUT", body: JSON.stringify({ streamerId: "0", roles: ["PLAYER"] }) });
    expect((await PUT(request, context)).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("포지션 없이 역할만 변경하는 요청을 허용한다", async () => {
    const request = new NextRequest("http://localhost/api/seasons/7/participants", { method: "PUT", body: JSON.stringify({ streamerId: "1", roles: ["PLAYER", "CAPTAIN"] }) });
    expect((await PUT(request, context)).status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(BigInt(7), BigInt(1), ["PLAYER", "CAPTAIN"], undefined);
  });

  it("여러 참가자의 역할·포지션을 한 요청으로 검증해 전달한다", async () => {
    const request = new NextRequest("http://localhost/api/seasons/7/participants", { method: "PATCH", body: JSON.stringify({ participants: [{ streamerId: "1", roles: ["PLAYER"] }, { streamerId: "2", roles: ["COACH"], position: null }] }) });
    expect((await PATCH(request, context)).status).toBe(200);
    expect(mocks.updateBatch).toHaveBeenCalledWith(BigInt(7), [{ streamerId: BigInt(1), roles: ["PLAYER"] }, { streamerId: BigInt(2), roles: ["COACH"], position: null }]);
  });

  it("일괄 참가자 저장의 잘못된 ID를 거부한다", async () => {
    const request = new NextRequest("http://localhost/api/seasons/7/participants", { method: "PATCH", body: JSON.stringify({ participants: [{ streamerId: "0", roles: ["PLAYER"] }] }) });
    expect((await PATCH(request, context)).status).toBe(400);
    expect(mocks.updateBatch).not.toHaveBeenCalled();
  });
});
