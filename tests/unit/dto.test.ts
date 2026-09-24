// 도메인 DTO가 BigInt·날짜·nullable 필드를 클라이언트 전송 형식으로 직렬화하는지 확인한다.
import { describe, expect, it } from "vitest";
import { formatCode } from "@/lib/codes/codeDto";
import { formatCodeGroupDto } from "@/lib/codes/codeGroupDto";
import { formatHeroDto } from "@/lib/heroes/heroDto";
import { formatMapDto } from "@/lib/maps/mapDto";
import { formatStreamerDto } from "@/lib/streamers/streamerDto";

describe("DTO 직렬화", () => {
  it("공통 코드의 nullable 값을 화면 기본값으로 변환한다", () => {
    expect(
      formatCode({
        groupCode: "ROLE",
        code: "ADMIN",
        codeName: "관리자",
        sortOrder: null,
        isUse: null,
        remarks: null,
      }),
    ).toEqual({
      groupCode: "ROLE",
      code: "ADMIN",
      name: "관리자",
      sortOrder: 0,
      isUse: true,
      remarks: "",
    });
  });

  it("코드 그룹 날짜와 nullable 값을 직렬화한다", () => {
    const group = {
      id: BigInt(1),
      groupCode: "ROLE",
      groupName: "역할",
      remarks: null,
      sortOrder: 0,
      isUse: true,
      createdBy: null,
      createdAt: new Date("2026-09-22T14:00:00.000Z"),
      updatedBy: null,
      updatedAt: new Date("2026-09-22T14:00:00.000Z"),
    } as Parameters<typeof formatCodeGroupDto>[0];

    expect(formatCodeGroupDto(group)).toMatchObject({
      groupCode: "ROLE",
      remarks: "",
      createdAt: "2026-09-22",
    });
  });

  it("영웅 BigInt와 nullable 필드를 문자열 기본값으로 변환한다", () => {
    const hero = {
      id: BigInt(12),
      name: "트레이서",
      nameEn: "Tracer",
      role: "DAMAGE",
      isPickable: true,
      imageUrl: null,
      source: "UNKNOWN",
      sourceKey: null,
      createdBy: null,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: new Date(),
      remarks: null,
    } as Parameters<typeof formatHeroDto>[0];

    expect(formatHeroDto(hero)).toEqual({
      id: "12",
      nameKr: "트레이서",
      nameEn: "Tracer",
      role: "DAMAGE",
      isPickable: true,
      imageUrl: "",
      source: "MANUAL",
      sourceKey: "",
      desc: "",
    });
  });

  it("맵 BigInt와 nullable 필드를 문자열 기본값으로 변환한다", () => {
    const map = {
      id: BigInt(21),
      name: "왕의 길",
      nameEn: null,
      mapType: "HYBRID",
      location: null,
      countryCode: null,
      imageUrl: null,
      isActive: false,
      source: "OVERFAST",
      sourceKey: null,
      createdBy: null,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: new Date(),
      remarks: null,
    } as Parameters<typeof formatMapDto>[0];

    expect(formatMapDto(map)).toEqual({
      id: "21",
      nameKr: "왕의 길",
      nameEn: "",
      mode: "HYBRID",
      location: "",
      countryCode: "",
      imageUrl: "",
      isActive: false,
      source: "OVERFAST",
      sourceKey: "",
      desc: "",
    });
  });

  it("스트리머 채널 URL·날짜·nullable 필드를 직렬화한다", () => {
    const streamer = {
      id: BigInt(31),
      name: "러너",
      profileImageUrl: null,
      chzzkChannelId: "channel-id",
      isUse: true,
      createdBy: null,
      createdAt: new Date("2026-09-22T23:59:59.000Z"),
      updatedBy: null,
      updatedAt: new Date(),
      remarks: null,
    } as Parameters<typeof formatStreamerDto>[0];

    expect(formatStreamerDto(streamer)).toEqual({
      id: "31",
      name: "러너",
      profileImg: "",
      channelUrl: "https://chzzk.naver.com/channel-id",
      channelId: "channel-id",
      isChzzk: true,
      type: "치지직 연동",
      followers: "연동됨",
      registeredDate: "2026-09-22",
      memo: "",
      isUse: true,
    });
  });
});
