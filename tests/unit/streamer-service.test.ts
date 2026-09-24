// 스트리머 서비스의 Prisma 호출과 DTO 반환 계약을 검증한다.
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    streamer: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));

import {
  createStreamer,
  findStreamerByChzzkChannelId,
  findStreamers,
  updateStreamer,
} from "@/lib/streamers/streamerService";
import { normalizeStreamerPayload } from "@/lib/streamers/streamerValidator";

const streamerRecord = {
  id: BigInt(1),
  name: "테스트 스트리머",
  profileImageUrl: "https://cdn.example.com/profiles/streamer.webp",
  chzzkChannelId: "channel-id",
  isUse: true,
  createdBy: null,
  createdAt: new Date("2026-09-22T00:00:00.000Z"),
  updatedBy: null,
  updatedAt: new Date("2026-09-22T00:00:00.000Z"),
  remarks: "메모",
};

// 스트리머 생성·수정에 사용하는 검증 완료 입력을 만든다.
function createPayload(overrides: Record<string, unknown> = {}) {
  return normalizeStreamerPayload({
    name: "테스트 스트리머",
    profileImg: "https://cdn.example.com/profiles/streamer.webp",
    chzzkChannelId: "channel-id",
    isUse: true,
    memo: "메모",
    ...overrides,
  });
}

describe("streamerService", () => {
  beforeEach(() => {
    mocks.prisma.streamer.findMany.mockResolvedValue([]);
    mocks.prisma.streamer.findFirst.mockResolvedValue(null);
  });

  it("조회 결과를 스트리머 DTO 배열로 반환한다", async () => {
    mocks.prisma.streamer.findMany.mockResolvedValue([streamerRecord]);

    await expect(findStreamers()).resolves.toEqual([
      expect.objectContaining({
        id: "1",
        channelId: "channel-id",
        channelUrl: "https://chzzk.naver.com/channel-id",
        type: "치지직 연동",
      }),
    ]);
    expect(mocks.prisma.streamer.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } });
  });

  it("조회 결과가 없으면 빈 배열을 반환한다", async () => {
    await expect(findStreamers()).resolves.toEqual([]);
  });

  it("채널 ID 중복 조회에서 기존 스트리머를 반환한다", async () => {
    mocks.prisma.streamer.findFirst.mockResolvedValue(streamerRecord);

    await expect(findStreamerByChzzkChannelId("channel-id")).resolves.toBe(streamerRecord);
    expect(mocks.prisma.streamer.findFirst).toHaveBeenCalledWith({
      where: { chzzkChannelId: "channel-id" },
    });
  });

  it("채널 ID 중복 조회에서 결과가 없으면 null을 반환한다", async () => {
    await expect(findStreamerByChzzkChannelId("missing-channel")).resolves.toBeNull();
  });

  it("정상 생성 시 nullable 값을 Prisma 데이터로 변환하고 DTO를 반환한다", async () => {
    mocks.prisma.streamer.create.mockResolvedValue({
      ...streamerRecord,
      profileImageUrl: null,
      chzzkChannelId: null,
      remarks: null,
    });

    await expect(
      createStreamer(createPayload({ profileImg: "", chzzkChannelId: "", memo: "" })),
    ).resolves.toMatchObject({
      id: "1",
      profileImg: "",
      channelId: "",
      type: "일반 등록",
    });
    expect(mocks.prisma.streamer.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        profileImageUrl: null,
        chzzkChannelId: null,
        remarks: null,
      }),
    });
  });

  it("정상 수정 시 문자열 ID를 BigInt 조건으로 변환하고 isUse를 보존한다", async () => {
    mocks.prisma.streamer.update.mockResolvedValue({ ...streamerRecord, isUse: false });

    await expect(updateStreamer(createPayload({ id: "1", isUse: false }))).resolves.toMatchObject({
      id: "1",
      isUse: false,
    });
    expect(mocks.prisma.streamer.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: BigInt(1) }, data: expect.objectContaining({ isUse: false }) }),
    );
  });

  it("Prisma 예외는 서비스의 기존 오류 계약대로 그대로 전파한다", async () => {
    const databaseError = new Error("database unavailable");
    mocks.prisma.streamer.create.mockRejectedValueOnce(databaseError);

    await expect(createStreamer(createPayload())).rejects.toBe(databaseError);
  });
});
