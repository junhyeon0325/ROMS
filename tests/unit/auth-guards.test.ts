// 인증 가드가 세션과 역할에 따라 사용자 반환, 401, 403 분기를 일관되게 처리하는지 확인한다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth";

vi.mock("server-only", () => ({}));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

import {
  AuthorizationError,
  requireAdmin,
  requireAdminApi,
  requireDeveloper,
  requireDeveloperApi,
  requireUser,
} from "@/lib/auth-guards";

const mockedGetServerSession = vi.mocked(getServerSession);

const sessionFor = (role: "USER" | "ADMIN" | "DEV") => ({
  user: { id: "1", email: "user@example.com", role },
  expires: "2099-01-01T00:00:00.000Z",
});

beforeEach(() => {
  mockedGetServerSession.mockReset();
});

describe("인증 가드", () => {
  it("세션이 없으면 401 AuthorizationError를 던진다", async () => {
    mockedGetServerSession.mockResolvedValue(null);

    await expect(requireUser()).rejects.toMatchObject({
      name: "AuthorizationError",
      status: 401,
      message: "로그인이 필요합니다.",
    });
  });

  it("일반 사용자의 관리자 접근을 403으로 거부한다", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor("USER"));

    await expect(requireAdmin()).rejects.toEqual(
      new AuthorizationError(403, "관리자 권한이 필요합니다."),
    );
  });

  it.each(["ADMIN", "DEV"] as const)("%s 역할의 관리자 접근을 허용한다", async (role) => {
    mockedGetServerSession.mockResolvedValue(sessionFor(role));

    await expect(requireAdmin()).resolves.toMatchObject({ role });
  });

  it("DEV 이외 역할의 개발자 접근을 403으로 거부한다", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor("ADMIN"));

    await expect(requireDeveloper()).rejects.toMatchObject({ status: 403 });
  });

  it("DEV 역할의 개발자 접근을 허용한다", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor("DEV"));

    await expect(requireDeveloper()).resolves.toMatchObject({ role: "DEV" });
  });

  it("API 관리자 가드는 미인증 요청을 401 JSON 응답으로 변환한다", async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const response = await requireAdminApi();
    expect(response?.status).toBe(401);
    await expect(response?.json()).resolves.toEqual({
      success: false,
      message: "로그인이 필요합니다.",
    });
  });

  it("API 개발자 가드는 권한 부족을 403 JSON 응답으로 변환한다", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor("ADMIN"));

    const response = await requireDeveloperApi();
    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toEqual({
      success: false,
      message: "개발자 권한이 필요합니다.",
    });
  });
});
