// 지도·스트리머 저장 API가 이미지 URL Validator의 성공·400 응답 계약을 유지하는지 확인한다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminApi: vi.fn(),
  createMap: vi.fn(),
  updateMap: vi.fn(),
  createStreamer: vi.fn(),
  updateStreamer: vi.fn(),
  findStreamerByChzzkChannelId: vi.fn(),
  prisma: {
    commonCode: { findFirst: vi.fn() },
    mapItem: { findUnique: vi.fn() },
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth-guards", () => ({ requireAdminApi: mocks.requireAdminApi }));
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/maps/mapService", () => ({
  createMap: mocks.createMap,
  findMaps: vi.fn(),
  updateMap: mocks.updateMap,
}));
vi.mock("@/lib/streamers/streamerService", () => ({
  createStreamer: mocks.createStreamer,
  findStreamerByChzzkChannelId: mocks.findStreamerByChzzkChannelId,
  findStreamers: vi.fn(),
  updateStreamer: mocks.updateStreamer,
}));

import { POST as createMap, PUT as updateMap } from "@/app/api/maps/route";
import {
  POST as createStreamer,
  PUT as updateStreamer,
} from "@/app/api/streamers/route";

const mapResult = {
  id: "1",
  nameKr: "맵",
  nameEn: "Map",
  mode: "CONTROL",
  location: "",
  countryCode: "",
  imageUrl: "https://images.example.com/map.png",
  isActive: true,
  source: "MANUAL" as const,
  sourceKey: "",
  desc: "",
};
const streamerResult = {
  id: "1",
  name: "스트리머",
  profileImg: "https://images.example.com/profile.png",
  channelUrl: "",
  channelId: "",
  isChzzk: false,
  type: "일반 등록",
  followers: "—",
  registeredDate: "2026-09-22",
  memo: "",
  isUse: true,
};

// JSON 요청 본문을 포함한 NextRequest를 생성한다.
function jsonRequest(url: string, method: "POST" | "PUT", body: Record<string, unknown>) {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// 기존 Validator 오류가 API의 400 JSON 계약으로 전달되는지 확인한다.
async function expectValidationError(response: Response, message: string) {
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({ success: false, message });
}

beforeEach(() => {
  mocks.requireAdminApi.mockResolvedValue(null);
  mocks.prisma.commonCode.findFirst.mockResolvedValue({ code: "CONTROL" });
  mocks.prisma.mapItem.findUnique.mockResolvedValue(null);
  mocks.createMap.mockResolvedValue(mapResult);
  mocks.updateMap.mockResolvedValue(mapResult);
  mocks.findStreamerByChzzkChannelId.mockResolvedValue(null);
  mocks.createStreamer.mockResolvedValue(streamerResult);
  mocks.updateStreamer.mockResolvedValue(streamerResult);
});

describe("지도 저장 API 이미지 URL 계약", () => {
  it("유효한 HTTPS 이미지 URL로 등록하면 기존 성공 응답을 반환한다", async () => {
    const response = await createMap(
      jsonRequest("http://localhost/api/maps", "POST", {
        nameEn: "Map",
        mode: "CONTROL",
        isActive: true,
        imageUrl: "https://images.example.com/map.png",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, data: mapResult });
    expect(mocks.createMap).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrl: "https://images.example.com/map.png" }),
    );
  });

  it.each(["", null])("nullable 이미지 URL %j로 등록을 허용한다", async (imageUrl) => {
    const response = await createMap(
      jsonRequest("http://localhost/api/maps", "POST", {
        nameEn: "Map",
        mode: "CONTROL",
        isActive: true,
        imageUrl,
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.createMap).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: "" }));
  });

  it("유효한 HTTPS 이미지 URL로 수정하면 기존 성공 응답을 반환한다", async () => {
    const response = await updateMap(
      jsonRequest("http://localhost/api/maps", "PUT", {
        id: "1",
        nameEn: "Map",
        mode: "CONTROL",
        isActive: true,
        imageUrl: "https://images.example.com/map.png",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, data: mapResult });
    expect(mocks.updateMap).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({ imageUrl: "https://images.example.com/map.png" }),
    );
  });

  it.each([
    ["http URL", "http://images.example.com/map.png", "이미지 URL은 https: 주소만 사용할 수 있습니다."],
    ["javascript URL", "javascript:alert(1)", "이미지 URL은 https: 주소만 사용할 수 있습니다."],
    ["data URL", "data:image/png;base64,AAAA", "이미지 URL은 https: 주소만 사용할 수 있습니다."],
    ["blob URL", "blob:https://example.com/image", "이미지 URL은 https: 주소만 사용할 수 있습니다."],
    ["잘못된 URL", "not a url", "이미지 URL 형식이 올바르지 않습니다."],
    ["비문자 URL", 123, "이미지 URL은 문자열 또는 빈 값이어야 합니다."],
  ])("%s을 400 Validator 오류로 반환한다", async (_label, imageUrl, message) => {
    const response = await createMap(
      jsonRequest("http://localhost/api/maps", "POST", {
        nameEn: "Map",
        mode: "CONTROL",
        isActive: true,
        imageUrl,
      }),
    );

    await expectValidationError(response, message);
    expect(mocks.createMap).not.toHaveBeenCalled();
  });

  it("필수 입력값 누락을 400 메시지로 반환한다", async () => {
    const response = await createMap(jsonRequest("http://localhost/api/maps", "POST", {}));

    await expectValidationError(response, "영문명과 맵 모드는 필수입니다.");
    expect(mocks.createMap).not.toHaveBeenCalled();
  });

  it("수정 요청에서도 Validator URL 오류를 400으로 반환한다", async () => {
    const response = await updateMap(
      jsonRequest("http://localhost/api/maps", "PUT", {
        id: "1",
        nameEn: "Map",
        mode: "CONTROL",
        isActive: true,
        imageUrl: "http://images.example.com/map.png",
      }),
    );

    await expectValidationError(response, "이미지 URL은 https: 주소만 사용할 수 있습니다.");
    expect(mocks.updateMap).not.toHaveBeenCalled();
  });
});

describe("스트리머 저장 API 이미지 URL 계약", () => {
  it("유효한 HTTPS 이미지 URL로 등록하면 기존 성공 응답을 반환한다", async () => {
    const response = await createStreamer(
      jsonRequest("http://localhost/api/streamers", "POST", {
        name: "스트리머",
        isChzzk: false,
        profileImg: "https://images.example.com/profile.png",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      message: "[스트리머] 스트리머가 DB에 성공적으로 등록되었습니다.",
      data: streamerResult,
    });
    expect(mocks.createStreamer).toHaveBeenCalledWith(
      expect.objectContaining({ profileImg: "https://images.example.com/profile.png" }),
    );
  });

  it.each(["", null])("nullable 이미지 URL %j로 등록을 허용한다", async (profileImg) => {
    const response = await createStreamer(
      jsonRequest("http://localhost/api/streamers", "POST", {
        name: "스트리머",
        isChzzk: false,
        profileImg,
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.createStreamer).toHaveBeenCalledWith(expect.objectContaining({ profileImg: "" }));
  });

  it("유효한 HTTPS 이미지 URL로 수정하면 기존 성공 응답을 반환한다", async () => {
    const response = await updateStreamer(
      jsonRequest("http://localhost/api/streamers", "PUT", {
        id: "1",
        name: "스트리머",
        isChzzk: false,
        profileImg: "https://images.example.com/profile.png",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      message: "[스트리머] 스트리머 정보가 수정되었습니다.",
      data: streamerResult,
    });
    expect(mocks.updateStreamer).toHaveBeenCalledWith(
      expect.objectContaining({ profileImg: "https://images.example.com/profile.png" }),
    );
  });

  it.each([
    ["http URL", "http://images.example.com/profile.png", "이미지 URL은 https: 주소만 사용할 수 있습니다."],
    ["javascript URL", "javascript:alert(1)", "이미지 URL은 https: 주소만 사용할 수 있습니다."],
    ["data URL", "data:image/png;base64,AAAA", "이미지 URL은 https: 주소만 사용할 수 있습니다."],
    ["blob URL", "blob:https://example.com/image", "이미지 URL은 https: 주소만 사용할 수 있습니다."],
    ["잘못된 URL", "not a url", "이미지 URL 형식이 올바르지 않습니다."],
    ["비문자 URL", 123, "프로필 이미지 URL은 문자열 또는 빈 값이어야 합니다."],
  ])("%s을 400 Validator 오류로 반환한다", async (_label, profileImg, message) => {
    const response = await createStreamer(
      jsonRequest("http://localhost/api/streamers", "POST", {
        name: "스트리머",
        isChzzk: false,
        profileImg,
      }),
    );

    await expectValidationError(response, message);
    expect(mocks.createStreamer).not.toHaveBeenCalled();
  });

  it("필수 입력값 누락을 400 메시지로 반환한다", async () => {
    const response = await createStreamer(
      jsonRequest("http://localhost/api/streamers", "POST", { isChzzk: false }),
    );

    await expectValidationError(response, "스트리머 이름 또는 채널명을 입력해주세요.");
    expect(mocks.createStreamer).not.toHaveBeenCalled();
  });

  it("수정 요청에서도 Validator URL 오류를 400으로 반환한다", async () => {
    const response = await updateStreamer(
      jsonRequest("http://localhost/api/streamers", "PUT", {
        id: "1",
        name: "스트리머",
        isChzzk: false,
        profileImg: "http://images.example.com/profile.png",
      }),
    );

    await expectValidationError(response, "이미지 URL은 https: 주소만 사용할 수 있습니다.");
    expect(mocks.updateStreamer).not.toHaveBeenCalled();
  });
});
