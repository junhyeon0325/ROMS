// File: app/admin/seasons/team-names/page.tsx
// Page/Component: AdminSeasonTeamNamesPage
// Purpose: 선택한 대회 팀의 이름을 편집하고 기존 팀 편성과 함께 저장한다.
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Shield, Users } from "lucide-react";
import AdminAvatar from "@/components/admin/AdminAvatar";
import SeasonInlineSelect from "@/components/admin/SeasonInlineSelect";
import { useAdmin } from "@/lib/context/AdminContext";
import {
  fetchSeasonDraft,
  saveSeasonDraftClient,
} from "@/lib/seasons/draftClient";
import { prepareCaptainTeams } from "@/lib/seasons/draftBoard";
import { validateDraftInput } from "@/lib/seasons/draftValidator";
import type { DraftTeam, SeasonDraft } from "@/lib/types/seasonDraft";

// 선택한 대회의 팀 편성을 불러와 이름만 편집해 기존 드래프트 API로 저장한다.
export default function AdminSeasonTeamNamesPage() {
  const { seasons, seasonsStatus, reloadSeasons, showFeedback } = useAdmin();
  const [seasonId, setSeasonId] = useState("");
  const [data, setData] = useState<SeasonDraft>({
    participants: [],
    teams: [],
  });
  const [teams, setTeams] = useState<DraftTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedSeason =
    seasons.find((season) => season.id === seasonId) ?? null;
  const participantById = useMemo(
    () =>
      new Map(
        data.participants.map((participant) => [
          participant.streamerId,
          participant,
        ]),
      ),
    [data.participants],
  );
  const hasChanges = teams.some(
    (team) =>
      team.name !== data.teams.find((saved) => saved.id === team.id)?.name,
  );

  // 대회 변경 시 기존 팀·참가자를 조회하고 아직 저장되지 않은 팀장별 팀도 준비한다.
  useEffect(() => {
    if (!seasonId) {
      setData({ participants: [], teams: [] });
      setTeams([]);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    fetchSeasonDraft(seasonId)
      .then((result) => {
        if (!active) return;
        if (!result.success || !result.data) {
          setError(result.message || "팀 정보를 불러오지 못했습니다.");
          return;
        }
        setData(result.data);
        setTeams(
          prepareCaptainTeams(result.data).map((team, index) => ({
            id: team.id || team.key,
            name: team.name,
            sortOrder: team.sortOrder ?? index + 1,
            members: team.members,
          })),
        );
      })
      .catch(() => {
        if (active) setError("팀 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [seasonId]);

  // 이름 변경만 반영하면서 기존 팀원과 지명 순서는 보존해 저장한다.
  const save = async () => {
    if (!seasonId || loading || saving) return;
    const memberTeam = new Set(teams.flatMap((team) => team.members));
    const input = {
      teams: teams.map((team, index) => ({
        ...(data.teams.some((saved) => saved.id === team.id)
          ? { id: team.id }
          : {}),
        name: team.name.trim(),
        sortOrder: team.sortOrder ?? index + 1,
        members: team.members,
      })),
      draftOrders: data.participants.map((participant) => ({
        streamerId: participant.streamerId,
        order:
          participant.roles.includes("COACH") ||
          participant.roles.includes("CAPTAIN") ||
          !memberTeam.has(participant.streamerId)
            ? null
            : participant.draftOrder,
      })),
    };
    try {
      validateDraftInput(input);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "팀 이름을 확인해주세요.",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await saveSeasonDraftClient(seasonId, input);
      if (!result.success || !result.data) {
        setError(result.message || "팀 이름을 저장하지 못했습니다.");
        return;
      }
      setData(result.data);
      setTeams(
        prepareCaptainTeams(result.data).map((team, index) => ({
          id: team.id || team.key,
          name: team.name,
          sortOrder: team.sortOrder ?? index + 1,
          members: team.members,
        })),
      );
      showFeedback("팀 이름을 저장했습니다.");
    } catch {
      setError("저장 요청에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-800/10 p-4 md:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f99e1a] text-sm font-bold text-slate-950 shadow-sm">
            팀
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white md:text-base">
                {selectedSeason?.name || "팀명 지정하기"}
              </h2>
              {selectedSeason && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selectedSeason.status === "진행중" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400" : selectedSeason.status === "개최 예정" ? "bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}
                >
                  {selectedSeason.status}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              팀별 이름을 지정하고 현재 편성을 유지한 채 저장합니다.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {seasonsStatus === "ready" && seasons.length > 0 && (
            <SeasonInlineSelect
              seasons={seasons}
              value={seasonId}
              onChange={setSeasonId}
              disabled={loading || saving}
            />
          )}
          {seasonsStatus === "error" && (
            <button
              type="button"
              onClick={reloadSeasons}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-700"
            >
              다시 시도
            </button>
          )}
          {seasonsStatus === "ready" && !seasons.length && (
            <Link
              href="/admin/seasons"
              className="rounded-lg bg-[#f99e1a] px-4 py-2 text-xs font-bold text-slate-950"
            >
              + 새 대회 등록
            </Link>
          )}
          <button
            type="button"
            disabled={!seasonId || !hasChanges || loading || saving}
            onClick={() => void save()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#f99e1a] px-4 py-2 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              "저장 중..."
            ) : (
              <>
                <Check size={14} aria-hidden="true" />
                팀명 저장
              </>
            )}
          </button>
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="shrink-0 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#111726] md:p-4">
        {!seasonId ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 text-center">
            <Users
              size={28}
              className="text-slate-300 dark:text-slate-600"
              aria-hidden="true"
            />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              대회를 선택해주세요
            </h3>
            <p className="text-xs text-slate-500">
              선택한 대회의 팀과 팀원을 확인할 수 있습니다.
            </p>
          </div>
        ) : loading ? (
          <p className="p-10 text-center text-sm text-slate-500">
            팀 정보를 불러오는 중...
          </p>
        ) : teams.length ? (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {teams.map((team, index) => {
              const captain = team.members
                .map((id) => participantById.get(id))
                .find((participant) => participant?.roles.includes("CAPTAIN"));
              const members = team.members
                .map((id) => participantById.get(id))
                .filter((participant) => !!participant);
              return (
                <article
                  key={team.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                      {team.sortOrder}번 팀
                    </span>
                    <span className="text-[11px] text-slate-500">
                      팀원{" "}
                      {
                        members.filter(
                          (member) => !member.roles.includes("COACH"),
                        ).length
                      }
                      명
                    </span>
                  </div>
                  <label
                    htmlFor={`team-name-${team.id}`}
                    className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400"
                  >
                    팀 이름
                  </label>
                  <input
                    id={`team-name-${team.id}`}
                    value={team.name}
                    maxLength={100}
                    disabled={saving}
                    onChange={(event) =>
                      setTeams((current) =>
                        current.map((item) =>
                          item.id === team.id
                            ? { ...item, name: event.target.value }
                            : item,
                        ),
                      )
                    }
                    placeholder={`${captain?.name || `팀 ${index + 1}`} 팀`}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {members.map((member) => (
                      <div
                        key={member.streamerId}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <AdminAvatar
                          name={member.name}
                          profileImg={member.profileImg}
                          size="h-7 w-7 text-[9px]"
                        />
                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                          {member.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 text-[9px] ${member.roles.includes("CAPTAIN") ? "font-bold text-amber-600 dark:text-amber-400" : "text-slate-400"}`}
                        >
                          {member.roles.includes("CAPTAIN") ? (
                            <>
                              <Shield size={10} aria-hidden="true" />
                              팀장
                            </>
                          ) : member.roles.includes("COACH") ? (
                            "감독"
                          ) : (
                            "선수"
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 text-center">
            <Users
              size={28}
              className="text-slate-300 dark:text-slate-600"
              aria-hidden="true"
            />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              등록된 팀이 없습니다
            </h3>
            <p className="text-xs text-slate-500">
              팀장을 등록하고 팀 구성 및 드래프트에서 편성을 준비해주세요.
            </p>
            <Link
              href="/admin/seasons/structure"
              className="mt-1 rounded-lg bg-[#f99e1a] px-3 py-2 text-xs font-bold text-slate-950"
            >
              선수 등록 및 역할 배정
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
