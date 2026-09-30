// File: app/admin/matches/MatchManagement.tsx
// Page/Component: MatchManagement
// Purpose: 공통코드 관리 그리드와 같은 방식으로 상단 경기와 하단 세트를 등록·수정한다.
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SeasonInlineSelect from "@/components/admin/SeasonInlineSelect";
import AdminCard from "@/components/admin/AdminCard";
import AdminGridHeaderActions from "@/components/admin/AdminGridHeaderActions";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import AdminTable from "@/components/admin/AdminTable";
import { useAdmin } from "@/lib/context/AdminContext";
import {
  computeMatchWinner,
  parseMatchInput,
} from "@/lib/matches/matchValidator";
import { formatGameDuration, parseGameDuration } from "@/lib/matches/duration";
import type { SeasonDraft } from "@/lib/types/seasonDraft";
import type {
  MatchInput,
  MatchRecord,
  MatchSetInput,
} from "@/lib/types/matches";

type MapOption = {
  id: string;
  nameKr: string;
  sortOrder: number;
  subareas?: { id: string; name: string }[];
};
type ApiResult<T> = { success: boolean; data?: T; message?: string };
const inlineClass =
  "w-full min-w-24 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-[#f99e1a] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white";
const editRowClass = "bg-amber-500/10 dark:bg-amber-500/15";
const detailLinkClass =
  "inline-flex min-w-20 items-center justify-center rounded-md border border-amber-500 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:text-amber-300";
const detailDisabledClass =
  "inline-flex min-w-20 cursor-not-allowed items-center justify-center rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500";

// 새 경기 입력의 기본값을 현재 대회에 맞춰 만든다.
function emptyMatch(seasonId: string): MatchInput {
  return {
    seasonId,
    tournamentStage: "",
    matchDate: "",
    teamAId: "",
    teamBId: "",
    bestOf: 3,
    remarks: "",
    sets: [],
  };
}

// 미완료 세트도 저장할 수 있는 기본 입력 행을 만든다.
function emptySet(setNumber: number): MatchSetInput {
  return {
    setNumber,
    mapId: null,
    mapSubareaId: null,
    teamAColor: "BLUE",
    winnerTeamId: null,
    gameDurationSeconds: null,
    vodUrl: "",
    bans: [],
    stats: [],
  };
}

// DB 응답의 ISO 문자열에서 저장된 경기 날짜를 그대로 가져온다.
function toMatchDate(value: string): string {
  return value ? value.slice(0, 10) : "";
}

// 선택 대회의 경기 목록과 선택 경기의 세트 기록을 상하로 연결한다.
export default function MatchManagement() {
  const { seasons, seasonsStatus, showFeedback } = useAdmin();
  const [seasonId, setSeasonId] = useState("");
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [draft, setDraft] = useState<SeasonDraft | null>(null);
  const [maps, setMaps] = useState<MapOption[]>([]);
  const [form, setForm] = useState<MatchInput | null>(null);
  const [selectedSetIndex, setSelectedSetIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [matchMode, setMatchMode] = useState<"add" | "edit" | null>(null);
  const [setMode, setSetMode] = useState<"add" | "edit" | null>(null);
  const [matchSearch, setMatchSearch] = useState("");
  const [setSearch, setSetSearch] = useState("");
  const [durationDrafts, setDurationDrafts] = useState<Record<number, string>>(
    {},
  );
  const teams = useMemo(() => draft?.teams ?? [], [draft]);
  // 경기와 세트 결과에 표시할 대회 팀 이름을 찾는다.
  const teamName = (id: string | null) =>
    teams.find((team) => team.id === id)?.name ?? "미정";
  const winnerId =
    form?.teamAId && form?.teamBId ? computeMatchWinner(form) : null;
  const savedMatch = matches.find((match) => match.id === form?.id);
  const matchDirty = Boolean(
    savedMatch &&
    form &&
    (savedMatch.tournamentStage !== form.tournamentStage ||
      toMatchDate(savedMatch.matchDate) !== form.matchDate ||
      savedMatch.teamAId !== form.teamAId ||
      savedMatch.teamBId !== form.teamBId ||
      savedMatch.bestOf !== form.bestOf ||
      savedMatch.remarks !== form.remarks),
  );
  const setsDirty = Boolean(
    savedMatch &&
    form &&
    JSON.stringify(savedMatch.sets) !== JSON.stringify(form.sets),
  );
  const index = selectedSetIndex ?? -1;
  const set = index >= 0 ? (form?.sets[index] ?? null) : null;
  const filteredMatches = matches.filter((match) =>
    `${match.tournamentStage} ${match.teamAName} ${match.teamBName}`
      .toLowerCase()
      .includes(matchSearch.trim().toLowerCase()),
  );
  const filteredSets = (form?.sets ?? [])
    .map((item, at) => ({ ...item, rowIndex: at }))
    .filter(
      (item) =>
        !(setMode === "add" && !item.id) &&
        `${item.setNumber} ${maps.find((map) => map.id === item.mapId)?.nameKr ?? ""} ${teamName(item.winnerTeamId)}`
          .toLowerCase()
          .includes(setSearch.trim().toLowerCase()),
    );

  // 상세 화면에서 돌아오면 쿼리에 담긴 대회와 경기를 다시 선택한다.
  useEffect(() => {
    const requestedSeasonId = new URLSearchParams(window.location.search).get(
      "seasonId",
    );
    if (requestedSeasonId) setSeasonId(requestedSeasonId);
  }, []);

  // 경기 요약을 먼저 표시하고, 편집에 필요한 참조 데이터는 병렬로 채운다.
  useEffect(() => {
    if (!seasonId) {
      setMatches([]);
      setDraft(null);
      setMaps([]);
      setForm(null);
      setSelectedSetIndex(null);
      setDurationDrafts({});
      setMatchMode(null);
      setSetMode(null);
      setLoading(false);
      setMatchesLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setMatchesLoading(true);
    setForm(null);
    setSelectedSetIndex(null);
    setMatchMode(null);
    setSetMode(null);
    setError("");
    setMatches([]);
    setDraft(null);
    setMaps([]);
    const matchRequest = fetch(
      `/api/matches?seasonId=${encodeURIComponent(seasonId)}&summary=true`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const result = (await response.json()) as ApiResult<
          Omit<MatchRecord, "sets">[]
        >;
        if (!response.ok || !result.success)
          throw new Error(result.message || "경기 목록을 불러오지 못했습니다.");
        if (controller.signal.aborted) return [];
        const rows = (result.data ?? []).map((match) => ({
          ...match,
          sets: [],
        }));
        setMatches(rows);
        setMatchesLoading(false);
        const requestedMatchId = new URLSearchParams(
          window.location.search,
        ).get("matchId");
        const requestedMatch = rows.find(
          (item) => item.id === requestedMatchId,
        );
        if (requestedMatch) {
          setDetailLoading(true);
          void fetch(
            `/api/matches?seasonId=${encodeURIComponent(requestedMatch.seasonId)}&matchId=${encodeURIComponent(requestedMatch.id)}`,
            { signal: controller.signal },
          )
            .then(async (response) => {
              const detail = (await response.json()) as ApiResult<MatchRecord>;
              if (!response.ok || !detail.success || !detail.data)
                throw new Error(
                  detail.message || "경기 상세 기록을 불러오지 못했습니다.",
                );
              if (!controller.signal.aborted) {
                setMatches((current) =>
                  current.map((item) =>
                    item.id === detail.data!.id ? detail.data! : item,
                  ),
                );
                setForm({
                  ...detail.data,
                  matchDate: toMatchDate(detail.data.matchDate),
                });
              }
            })
            .catch((cause: unknown) => {
              if (!controller.signal.aborted)
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "경기 상세 기록을 불러오지 못했습니다.",
                );
            })
            .finally(() => {
              if (!controller.signal.aborted) setDetailLoading(false);
            });
        }
        return rows;
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "경기 목록을 불러오지 못했습니다.",
          );
          setMatchesLoading(false);
        }
        return [];
      });
    const referenceRequest = Promise.all([
      fetch(`/api/seasons/${encodeURIComponent(seasonId)}/draft`, {
        signal: controller.signal,
      }),
      fetch(`/api/seasons/${encodeURIComponent(seasonId)}/maps`, {
        signal: controller.signal,
      }),
    ])
      .then(async ([draftResponse, mapsResponse]) => {
        const [draftResult, mapResult] = await Promise.all([
          draftResponse.json() as Promise<ApiResult<SeasonDraft>>,
          mapsResponse.json() as Promise<ApiResult<MapOption[]>>,
        ]);
        if (controller.signal.aborted) return;
        if (!draftResult.success || !mapResult.success)
          throw new Error(
            draftResult.message ||
              mapResult.message ||
              "경기 입력 정보를 불러오지 못했습니다.",
          );
        setDraft(draftResult.data ?? null);
        setMaps(mapResult.data ?? []);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "경기 입력 정보를 불러오지 못했습니다.",
          );
      });
    void Promise.all([matchRequest, referenceRequest]).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [seasonId]);

  // 경기의 단일 필드를 이전 입력을 보존하면서 갱신한다.
  const updateForm = <K extends keyof MatchInput>(
    key: K,
    value: MatchInput[K],
  ) => setForm((current) => (current ? { ...current, [key]: value } : current));
  // 세트의 일부 필드만 교체해 다른 세트 입력을 보존한다.
  const updateSet = (index: number, patch: Partial<MatchSetInput>) =>
    setForm((current) =>
      current
        ? {
            ...current,
            sets: current.sets.map((set, at) =>
              at === index ? { ...set, ...patch } : set,
            ),
          }
        : current,
    );
  // 비어 있는 첫 세트 번호를 골라 하단 목록에 초안을 추가하고 바로 선택한다.
  const addSet = () => {
    if (!form || form.sets.length >= form.bestOf) return;
    const nextNumber = Array.from(
      { length: form.bestOf },
      (_, at) => at + 1,
    ).find((number) => !form.sets.some((item) => item.setNumber === number));
    if (!nextNumber) return;
    const nextSets = [...form.sets, emptySet(nextNumber)].sort(
      (a, b) => a.setNumber - b.setNumber,
    );
    updateForm("sets", nextSets);
    setSelectedSetIndex(
      nextSets.findIndex((item) => item.setNumber === nextNumber),
    );
    setSetMode("add");
  };
  // 상단의 경기 기본정보만 저장하며 하단의 입력 중인 세트는 보존한다.
  const saveMatch = async () => {
    if (!form || saving) return;
    try {
      const input = parseMatchInput(form);
      setSaving(true);
      setError("");
      const body = !input.id
        ? input
        : {
            id: input.id,
            scope: "match",
            data: {
              tournamentStage: input.tournamentStage,
              matchDate: input.matchDate,
              teamAId: input.teamAId,
              teamBId: input.teamBId,
              bestOf: input.bestOf,
              remarks: input.remarks,
            },
          };
      const response = await fetch("/api/matches", {
        method: input.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as ApiResult<MatchRecord>;
      if (!result.success || !result.data)
        throw new Error(result.message || "경기 기록을 저장하지 못했습니다.");
      const saved = result.data;
      setMatches((current) => [
        saved,
        ...current.filter((item) => item.id !== saved.id),
      ]);
      setForm({
        ...saved,
        sets: form.sets,
        matchDate: toMatchDate(saved.matchDate),
      });
      setMatchMode(null);
      showFeedback("경기 정보를 저장했습니다.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "경기 기록을 저장하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };
  // 하단의 세트·밴·선수 기록만 저장하고 상단 경기 기본정보는 변경하지 않는다.
  const saveSets = async () => {
    if (!form?.id || saving) return;
    if (matchDirty) {
      setError("경기 기본정보 변경을 먼저 저장해주세요.");
      return;
    }
    if (
      form.sets.some(
        (item) =>
          durationDrafts[item.setNumber] !== undefined &&
          parseGameDuration(durationDrafts[item.setNumber]) === undefined,
      )
    ) {
      setError("경기 시간은 분:초 형식으로 입력해주세요. 예: 8:56");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          scope: "sets",
          data: { sets: form.sets },
        }),
      });
      const result = (await response.json()) as ApiResult<MatchRecord>;
      if (!result.success || !result.data)
        throw new Error(result.message || "세트 기록을 저장하지 못했습니다.");
      const saved = result.data;
      setMatches((current) =>
        current.map((item) => (item.id === saved.id ? saved : item)),
      );
      setForm({ ...saved, matchDate: toMatchDate(saved.matchDate) });
      setDurationDrafts({});
      setSetMode(null);
      showFeedback("세트 기록을 저장했습니다.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "세트 기록을 저장하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };
  // 관리자 확인을 받은 현재 경기만 삭제한다.
  const remove = async () => {
    if (
      !form?.id ||
      saving ||
      !window.confirm("이 경기와 모든 세트·밴·선수 기록을 삭제하시겠습니까?")
    )
      return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        `/api/matches?id=${encodeURIComponent(form.id)}&confirmId=${encodeURIComponent(form.id)}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as ApiResult<never>;
      if (!result.success)
        throw new Error(result.message || "경기를 삭제하지 못했습니다.");
      setMatches((current) => current.filter((item) => item.id !== form.id));
      setForm(null);
      setSelectedSetIndex(null);
      setMatchMode(null);
      setSetMode(null);
      showFeedback("경기를 삭제했습니다.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "경기를 삭제하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  // 선택한 경기의 상세 세트 기록을 지연 조회해 목록 응답을 가볍게 유지한다.
  const selectMatch = async (match: MatchRecord) => {
    if (
      (matchMode || setMode || setsDirty) &&
      !window.confirm(
        "저장하지 않은 입력을 버리고 다른 경기를 선택하시겠습니까?",
      )
    )
      return;
    setError("");
    setDurationDrafts({});
    setDetailLoading(true);
    try {
      const response = await fetch(
        `/api/matches?seasonId=${encodeURIComponent(match.seasonId)}&matchId=${encodeURIComponent(match.id)}`,
      );
      const result = (await response.json()) as ApiResult<MatchRecord>;
      if (!response.ok || !result.success || !result.data)
        throw new Error(
          result.message || "경기 상세 기록을 불러오지 못했습니다.",
        );
      setMatches((current) =>
        current.map((item) =>
          item.id === result.data!.id ? result.data! : item,
        ),
      );
      setForm({
        ...result.data,
        matchDate: toMatchDate(result.data.matchDate),
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "경기 상세 기록을 불러오지 못했습니다.",
      );
    } finally {
      setDetailLoading(false);
    }
    setSelectedSetIndex(null);
    setMatchMode(null);
    setSetMode(null);
  };
  // 경기 인라인 입력을 취소하고 저장된 데이터로 복원한다.
  const cancelMatch = () => {
    if (matchMode === "add") setForm(null);
    else if (savedMatch)
      setForm({ ...savedMatch, matchDate: toMatchDate(savedMatch.matchDate) });
    setMatchMode(null);
    setError("");
  };
  // 선택한 세트 입력을 취소하고 서버에서 읽은 세트 목록으로 복원한다.
  const cancelSet = () => {
    if (savedMatch && form) setForm({ ...form, sets: savedMatch.sets });
    setDurationDrafts({});
    setSetMode(null);
    setSelectedSetIndex(null);
    setError("");
  };
  // 선택 세트를 삭제한 목록을 저장하고 기존 세트의 다른 기록을 보존한다.
  const removeSet = async () => {
    if (
      !form?.id ||
      !set ||
      !window.confirm(`${set.setNumber}세트와 밴·선수 기록을 삭제하시겠습니까?`)
    )
      return;
    if (matchDirty || setsDirty) {
      setError("저장하지 않은 변경을 먼저 저장하거나 취소해주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          scope: "sets",
          data: { sets: form.sets.filter((_, at) => at !== index) },
        }),
      });
      const result = (await response.json()) as ApiResult<MatchRecord>;
      if (!result.success || !result.data)
        throw new Error(result.message || "세트를 삭제하지 못했습니다.");
      setMatches((current) =>
        current.map((item) =>
          item.id === result.data!.id ? result.data! : item,
        ),
      );
      setForm({
        ...result.data,
        matchDate: toMatchDate(result.data.matchDate),
      });
      setSelectedSetIndex(null);
      showFeedback("세트를 삭제했습니다.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "세트를 삭제하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  // 경기 추가·수정 시 공통코드 그리드와 같은 인라인 입력 행을 표시한다.
  const matchEditor = (label: string) =>
    form ? (
      <tr className={editRowClass}>
        <td className="px-2 py-2 text-center">
          <span className="rounded bg-[#f99e1a] px-2 py-0.5 text-[11px] font-bold text-slate-950">
            {label}
          </span>
        </td>
        <td className="px-2 py-1.5">
          <input
            autoFocus
            className={inlineClass}
            value={form.tournamentStage}
            maxLength={100}
            placeholder="예: 결승"
            onChange={(event) =>
              updateForm("tournamentStage", event.target.value)
            }
          />
        </td>
        <td className="px-2 py-1.5">
          <input
            className={inlineClass}
            type="date"
            aria-label="경기 날짜"
            value={form.matchDate}
            onChange={(event) => updateForm("matchDate", event.target.value)}
          />
        </td>
        <td className="px-2 py-1.5">
          <select
            className={inlineClass}
            value={form.teamAId}
            onChange={(event) => updateForm("teamAId", event.target.value)}
          >
            <option value="">팀 선택</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </td>
        <td className="px-2 py-1.5">
          <select
            className={inlineClass}
            value={form.teamBId}
            onChange={(event) => updateForm("teamBId", event.target.value)}
          >
            <option value="">팀 선택</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </td>
        <td className="px-2 py-1.5">
          <select
            className={inlineClass}
            value={form.bestOf}
            onChange={(event) =>
              updateForm("bestOf", Number(event.target.value))
            }
          >
            {[3, 5, 7].map((number) => (
              <option key={number} value={number}>
                Bo{number}
              </option>
            ))}
          </select>
        </td>
        <td className="px-2 py-1.5 text-center text-slate-500">
          {winnerId ? teamName(winnerId) : "미확정"}
        </td>
        <td className="px-2 py-1.5">
          <input
            className={inlineClass}
            value={form.remarks}
            maxLength={2000}
            placeholder="비고"
            onChange={(event) => updateForm("remarks", event.target.value)}
          />
        </td>
      </tr>
    ) : null;

  // 세트 추가·수정 입력과 저장된 세트의 상세 페이지 이동을 표에 표시한다.
  const setEditor = (label: string) =>
    set && form ? (
      <tr className={editRowClass}>
        <td className="px-2 py-2 text-center">
          <span className="rounded bg-[#f99e1a] px-2 py-0.5 text-[11px] font-bold text-slate-950">
            {label}
          </span>
        </td>
        <td className="px-3 py-2 font-bold">{set.setNumber}세트</td>
        <td className="px-2 py-1.5">
          <select
            className={inlineClass}
            value={set.mapId ?? ""}
            onChange={(event) => {
              const mapId = event.target.value || null;
              updateSet(index, {
                mapId,
                hybridFirstAttackTeamId:
                  mapId === set.mapId
                    ? (set.hybridFirstAttackTeamId ?? null)
                    : null,
                hybridTurnResults:
                  mapId === set.mapId ? (set.hybridTurnResults ?? {}) : {},
                stats:
                  mapId === set.mapId
                    ? set.stats
                    : set.stats.map((stat) => ({ ...stat, usedHeroTurns: {} })),
                mapSubareaId:
                  mapId === set.mapId ? (set.mapSubareaId ?? null) : null,
                winnerTeamId: mapId ? set.winnerTeamId : null,
              });
            }}
          >
            <option value="">미정</option>
            {maps.map((map) => (
              <option key={map.id} value={map.id}>
                {map.nameKr}
              </option>
            ))}
          </select>
        </td>
        <td className="px-2 py-1.5">
          <select
            className={inlineClass}
            value={set.winnerTeamId ?? ""}
            disabled={!set.mapId}
            onChange={(event) =>
              updateSet(index, { winnerTeamId: event.target.value || null })
            }
          >
            <option value="">미정</option>
            {[form.teamAId, form.teamBId].filter(Boolean).map((id) => (
              <option key={id} value={id}>
                {teamName(id)}
              </option>
            ))}
          </select>
        </td>
        <td className="px-2 py-1.5">
          <input
            className={inlineClass}
            type="text"
            inputMode="numeric"
            pattern="[0-9:]*"
            aria-label="경기 시간 (분:초)"
            value={
              durationDrafts[set.setNumber] ??
              formatGameDuration(set.gameDurationSeconds)
            }
            placeholder="예: 8:56"
            onChange={(event) => {
              const value = event.target.value.replace(/[^\d:]/g, "");
              setDurationDrafts((current) => ({
                ...current,
                [set.setNumber]: value,
              }));
              const seconds = parseGameDuration(value);
              if (seconds !== undefined)
                updateSet(index, { gameDurationSeconds: seconds });
            }}
            onBlur={() => {
              const value = durationDrafts[set.setNumber];
              if (value !== undefined && parseGameDuration(value) !== undefined)
                setDurationDrafts((current) => {
                  const next = { ...current };
                  delete next[set.setNumber];
                  return next;
                });
            }}
          />
        </td>
        <td className="px-2 py-1.5">
          <input
            className={inlineClass}
            type="url"
            value={set.vodUrl}
            placeholder="https://..."
            onChange={(event) =>
              updateSet(index, { vodUrl: event.target.value })
            }
          />
        </td>
        <td className="px-2 py-1.5">
          {set.id && form.id ? (
            <Link
              href={`/admin/matches/${seasonId}/${form.id}/sets/${set.id}`}
              onClick={(event) => {
                event.stopPropagation();
                if (matchMode || matchDirty || setsDirty) {
                  event.preventDefault();
                  showFeedback(
                    "편집 중인 변경을 먼저 저장하거나 취소해주세요.",
                  );
                }
              }}
              className={detailLinkClass}
            >
              보기/수정
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className={detailDisabledClass}
              title="세트를 먼저 저장해주세요"
            >
              보기/수정
            </button>
          )}
        </td>
      </tr>
    ) : null;

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 text-slate-900 dark:text-slate-100">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-800/10 p-4 md:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f99e1a] text-sm font-bold text-slate-950">
            🏆
          </span>
          <div>
            <h1 className="text-sm font-bold md:text-base">경기 기록 관리</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              상단 경기 등록 · 하단 세트 등록
            </p>
          </div>
        </div>
        <SeasonInlineSelect
          seasons={seasons}
          value={seasonId}
          onChange={setSeasonId}
          disabled={loading || saving}
        />
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {error}
        </p>
      )}
      <div className="flex min-h-[300px] flex-1 flex-col">
        <AdminCard
          title="경기 등록"
          countBadge={`총 ${filteredMatches.length}경기`}
          className="h-full flex flex-col !p-4 md:!p-5"
          actions={
            <AdminGridHeaderActions
              isBusy={matchMode !== null}
              hasSelection={!!form?.id}
              onAdd={() => {
                if (!seasonId || !draft) {
                  showFeedback("대회를 먼저 선택해주세요.");
                  return;
                }
                if (setMode || setsDirty) {
                  showFeedback("세트 변경을 먼저 저장하거나 취소해주세요.");
                  return;
                }
                setForm(emptyMatch(seasonId));
                setSelectedSetIndex(null);
                setMatchMode("add");
                setSetMode(null);
                setError("");
              }}
              onEdit={() => {
                if (form?.id) setMatchMode("edit");
              }}
              onDelete={() => void remove()}
              onCancel={cancelMatch}
              onSave={() => void saveMatch()}
              addLabel="경기 추가"
              saveDisabled={saving}
              saveLabel={saving ? "저장 중..." : "저장"}
            />
          }
        >
          <div className="mb-2.5 flex shrink-0 items-center justify-between gap-3">
            <AdminSearchInput
              value={matchSearch}
              onChange={setMatchSearch}
              placeholder="경기 단계 또는 팀 검색..."
              containerClassName="w-full max-w-xs sm:max-w-sm"
            />
            <span className="hidden text-[11px] text-slate-400 sm:block">
              행을 선택하면 하단에 해당 경기의 세트가 표시됩니다.
            </span>
          </div>
          <AdminTable<MatchRecord>
            columns={[
              {
                key: "state",
                header: "상태",
                width: "w-16",
                render: () => "등록",
              },
              {
                key: "tournamentStage",
                header: "경기 단계",
                width: "min-w-28",
              },
              {
                key: "matchDate",
                header: "경기 날짜",
                width: "min-w-32",
                render: (row) =>
                  row.matchDate ? toMatchDate(row.matchDate) : "미정",
              },
              { key: "teamAName", header: "팀 A", width: "min-w-28" },
              { key: "teamBName", header: "팀 B", width: "min-w-28" },
              {
                key: "bestOf",
                header: "진행 방식",
                width: "w-24",
                render: (row) => `Bo${row.bestOf}`,
              },
              {
                key: "winnerTeamId",
                header: "경기 결과",
                width: "min-w-28",
                render: (row) =>
                  row.winnerTeamId === row.teamAId
                    ? row.teamAName
                    : row.winnerTeamId === row.teamBId
                      ? row.teamBName
                      : "미확정",
              },
              {
                key: "remarks",
                header: "비고",
                width: "min-w-36",
                render: (row) => row.remarks || "-",
              },
            ]}
            data={filteredMatches}
            keyField="id"
            selectedId={form?.id}
            onRowClick={selectMatch}
            isLoading={matchesLoading || seasonsStatus === "loading"}
            emptyTitle={
              seasonId
                ? "등록된 경기가 없습니다."
                : "상단에서 대회를 선택해주세요."
            }
            topRow={matchMode === "add" ? matchEditor("NEW") : null}
            renderRow={(row) =>
              matchMode === "edit" && form?.id === row.id
                ? matchEditor("수정")
                : null
            }
          />
        </AdminCard>
      </div>
      <div className="flex min-h-[300px] flex-1 flex-col">
        <AdminCard
          title="세트 등록"
          countBadge={`총 ${filteredSets.length}세트`}
          className="h-full flex flex-col !p-4 md:!p-5"
          actions={
            <AdminGridHeaderActions
              isBusy={setMode !== null}
              hasSelection={!!set?.id}
              onAdd={() => {
                if (!form?.id) {
                  showFeedback("상단에서 저장된 경기를 선택해주세요.");
                  return;
                }
                if (matchMode || matchDirty) {
                  showFeedback("경기 변경을 먼저 저장하거나 취소해주세요.");
                  return;
                }
                if (form.sets.length >= form.bestOf) {
                  showFeedback("진행 방식에 따른 최대 세트 수에 도달했습니다.");
                  return;
                }
                addSet();
              }}
              onEdit={() => {
                if (set) setSetMode("edit");
              }}
              onDelete={() => void removeSet()}
              onCancel={cancelSet}
              onSave={() => void saveSets()}
              addLabel="세트 추가"
              saveDisabled={saving}
              saveLabel={saving ? "저장 중..." : "저장"}
            />
          }
        >
          <div className="mb-2.5 flex shrink-0 items-center justify-between gap-3">
            <AdminSearchInput
              value={setSearch}
              onChange={setSetSearch}
              placeholder="세트 번호 또는 맵 검색..."
              containerClassName="w-full max-w-xs sm:max-w-sm"
            />
            <span className="hidden text-[11px] text-slate-400 sm:block">
              {form?.id
                ? `${teamName(form.teamAId)} vs ${teamName(form.teamBId)} · Bo${form.bestOf}`
                : "상단 경기 선택 후 세트를 등록하세요."}
            </span>
          </div>
          <AdminTable<MatchSetInput & { rowIndex: number }>
            columns={[
              {
                key: "state",
                header: "상태",
                width: "w-16",
                render: (row) => (row.winnerTeamId ? "완료" : "초안"),
              },
              {
                key: "setNumber",
                header: "세트",
                width: "w-24",
                render: (row) => `${row.setNumber}세트`,
              },
              {
                key: "mapId",
                header: "맵",
                width: "min-w-36",
                render: (row) => {
                  const map = maps.find((item) => item.id === row.mapId);
                  return map ? (
                    <span>
                      {map.nameKr}
                      {row.mapSubareaName && (
                        <span className="text-slate-400">
                          {" "}
                          · {row.mapSubareaName}
                        </span>
                      )}
                    </span>
                  ) : (
                    "미정"
                  );
                },
              },
              {
                key: "winnerTeamId",
                header: "승리팀",
                width: "min-w-28",
                render: (row) =>
                  row.winnerTeamId ? teamName(row.winnerTeamId) : "미정",
              },
              {
                key: "gameDurationSeconds",
                header: "경기 시간(분:초)",
                width: "min-w-24",
                render: (row) =>
                  formatGameDuration(row.gameDurationSeconds) || "-",
              },
              {
                key: "vodUrl",
                header: "VOD",
                width: "min-w-40",
                render: (row) =>
                  row.vodUrl ? (
                    <a
                      href={row.vodUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="text-amber-600 underline"
                    >
                      영상 보기
                    </a>
                  ) : (
                    "-"
                  ),
              },
              {
                key: "detail",
                header: "상세 기록",
                width: "w-28",
                render: (row) =>
                  row.id && form?.id ? (
                    <Link
                      href={`/admin/matches/${seasonId}/${form.id}/sets/${row.id}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (matchMode || matchDirty || setMode || setsDirty) {
                          event.preventDefault();
                          showFeedback(
                            "편집 중인 변경을 먼저 저장하거나 취소해주세요.",
                          );
                        }
                      }}
                      className={detailLinkClass}
                    >
                      보기/수정
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className={detailDisabledClass}
                      title="세트를 먼저 저장해주세요"
                    >
                      보기/수정
                    </button>
                  ),
              },
            ]}
            data={filteredSets}
            keyField={(row) => String(row.setNumber)}
            selectedId={set ? String(set.setNumber) : null}
            onRowClick={(row) => {
              if (setMode || setsDirty) {
                showFeedback("세트 변경을 먼저 저장하거나 취소해주세요.");
                return;
              }
              setSelectedSetIndex(row.rowIndex);
            }}
            isLoading={loading || detailLoading}
            emptyTitle={
              form?.id
                ? "등록된 세트가 없습니다."
                : "상단에서 저장된 경기를 선택해주세요."
            }
            topRow={setMode === "add" ? setEditor("NEW") : null}
            renderRow={(row) =>
              setMode === "edit" && index === row.rowIndex
                ? setEditor("수정")
                : null
            }
          />
        </AdminCard>
      </div>
    </section>
  );
}
