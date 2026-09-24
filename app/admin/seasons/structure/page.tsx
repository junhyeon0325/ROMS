// File: app/admin/seasons/structure/page.tsx
// Page/Component: AdminSeasonStructurePage
// Purpose: 대회 선수 등록·역할 배정과 기존 구성 탭을 제공한다.
"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/context/AdminContext";
import AdminCard from "@/components/admin/AdminCard";
import AdminFormActions from "@/components/admin/AdminFormActions";
import AdminModal from "@/components/admin/AdminModal";
import ParticipantManager from "./ParticipantManager";
import Link from "next/link";

interface GroupTeam {
  id: string;
  name: string;
  captain: string;
  seed: number;
}

interface Group {
  name: string;
  teams: GroupTeam[];
}

// 선택한 대회의 참가자 관리와 기존 구성 탭을 함께 표시한다.
export default function AdminSeasonStructurePage() {
  const { seasons, showFeedback } = useAdmin();
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [activeTab, setActiveTab] = useState<"participants" | "groups" | "bracket" | "rules">("participants");
  const [groups, setGroups] = useState<Group[]>([]);

  // 경기 규칙 폼 상태
  const [ruleConfig, setRuleConfig] = useState({
    groupFormat: "Bo3",
    playoffFormat: "Bo5",
    finalFormat: "Bo7",
    teamsPerGroup: 4,
    qualifiersPerGroup: 2,
    heroBanEnabled: true,
    maxHeroBans: 1,
    mapPickRule: "패자 선택제 (Loser's Pick)",
    overtimeRule: "공식 오버워치 타이브레이커 쟁탈 1선승",
  });

  const selectedSeason = seasons.find((item) => item.id === selectedSeasonId) || seasons[0];
  const [seasonModalOpen, setSeasonModalOpen] = useState(false);
  const [participantModalOpen, setParticipantModalOpen] = useState(false);

  const handleSaveStructure = () => {
    if (!selectedSeason) {
      showFeedback("대회가 존재하지 않아 저장할 수 없습니다.");
      return;
    }
    showFeedback(`[${selectedSeason.name}] 대회 구성 및 규정이 저장되었습니다.`);
  };

  const handleResetStructure = () => {
    showFeedback("대회 구성 설정이 기본값으로 초기화되었습니다.");
  };

  return (
    <section className="h-full min-h-0 flex flex-col gap-4">
      {/* 1) 대회 기본 정보 요약 바 & 탭 네비게이션 */}
      {selectedSeason ? (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-800/10 border border-amber-500/20 dark:border-amber-500/20 rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-[#f99e1a] text-slate-950 flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              🏆
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                  {selectedSeason.name}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedSeason.status === "진행중"
                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400"
                      : selectedSeason.status === "개최 예정"
                      ? "bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {selectedSeason.status}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">총 상금: {selectedSeason.prize}</p>
            </div>
          </div>

          {/* 시즌 선택과 참가자 추가를 상단 시즌 정보에 배치한다. */}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={!seasons.length} onClick={() => setSeasonModalOpen(true)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              대회 선택: {selectedSeason.name} ▾
            </button>
            <button type="button" onClick={() => setParticipantModalOpen(true)} className="rounded-lg bg-[#f99e1a] px-4 py-2 text-xs font-bold text-slate-950">
              + 선수 추가
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span className="text-3xl block mb-2">🏆</span>
          <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
            등록된 대회가 없습니다.
          </p>
          <p className="text-slate-400 dark:text-slate-500 mb-4">
            대회 구성을 설정하려면 먼저 대회를 생성해 주세요.
          </p>
          <Link
            href="/admin/seasons"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#f99e1a] hover:bg-[#ea8c08] text-slate-950 shadow-sm transition-all"
          >
            + 새 대회 등록하기
          </Link>
        </div>
      )}

      {/* 3) 2단 분할 레이아웃 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* ========================================================= */}
        {/* 탭 1: 참가 인원 및 역할 관리 */}
        {/* ========================================================= */}
        {activeTab === "participants" && <ParticipantManager key={selectedSeason?.id || "empty"} seasonId={selectedSeason?.id || ""} isAddOpen={participantModalOpen} onAddOpenChange={setParticipantModalOpen} />}

        {activeTab === "groups" && (
          <div className="xl:col-span-12 h-full min-h-0 flex flex-col">
            <AdminCard
              title="조별 예선 그룹 편성 (Group Stage)"
              countBadge={`총 ${groups.length}개조`}
              className="h-full"
              actions={
                <button
                  type="button"
                  onClick={() => {
                    if (groups.length === 0) {
                      showFeedback("편성된 조가 없어 셔플을 진행할 수 없습니다.");
                      return;
                    }
                    showFeedback("조 무작위 셔플 추첨이 완료되었습니다.");
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  🎲 조 추첨 셔플
                </button>
              }
            >
              {groups.length === 0 ? (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500 flex-1 min-h-0 flex flex-col justify-center items-center">
                  <span className="text-3xl block mb-2">📋</span>
                  <p className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-1">
                    편성된 조별 예선 그룹이 없습니다.
                  </p>
                  <p className="text-[11px] text-slate-400 mb-4">
                    먼저 [참가 인원 및 역할] 탭에서 팀장 및 참가자를 구성한 후 조 편성을 진행해주세요.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("participants")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#f99e1a] text-slate-950 hover:bg-[#ea8c08] transition-all"
                  >
                    참가 인원 및 역할 탭으로 이동 →
                  </button>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar">
                  {groups.map((grp) => (
                    <div
                      key={grp.name}
                      className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40"
                    >
                      <div className="bg-slate-100/80 dark:bg-slate-800/80 px-4 py-2.5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {grp.name} (풀리그 라운드로빈)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          상위 2팀 본선 4강 진출
                        </span>
                      </div>

                      <div className="p-3 divide-y divide-slate-200/60 dark:divide-slate-800/60">
                        {grp.teams.map((team) => (
                          <div
                            key={team.id}
                            className="py-2.5 px-2 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center">
                                {team.seed}
                              </span>
                              <div>
                                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                                  {team.name}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  팀장: {team.captain}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => showFeedback(`[${team.name}] 팀 정보 수정`)}
                                className="text-[11px] px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500"
                              >
                                시드 조정
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>
          </div>
        )}

        {/* ========================================================= */}
        {/* 탭 3: 토너먼트 트리 */}
        {/* ========================================================= */}
        {activeTab === "bracket" && (
          <div className="xl:col-span-12 h-full min-h-0 flex flex-col">
            <AdminCard
              title="본선 토너먼트 대진 브래킷"
              countBadge="4강 토너먼트"
              className="h-full"
            >
              <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 custom-scrollbar flex flex-col justify-center text-center py-16 text-slate-400 dark:text-slate-500">
                <span className="text-3xl block mb-2">🎯</span>
                <p className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-1">
                  생성된 본선 대진표가 없습니다.
                </p>
                <p className="text-[11px] text-slate-400">
                  조별 풀리그 순위가 확정된 후 본선 토너먼트 대진 브래킷이 자동 생성됩니다.
                </p>
              </div>
            </AdminCard>
          </div>
        )}

        {/* ========================================================= */}
        {/* 탭 4: 세트 및 룰 설정 */}
        {/* ========================================================= */}
        {activeTab === "rules" && (
          <>
            <div className="xl:col-span-7 h-full min-h-0 flex flex-col">
              <AdminCard title="세트별 진행 맵 및 룰 구성" countBadge="표준 OW2 규정" className="h-full">
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 text-xs pr-1.5 custom-scrollbar">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">1세트: 쟁탈 (Control)</div>
                      <div className="text-slate-500 text-[11px]">고정 맵풀: 네팔, 일리오스, 오아시스</div>
                    </div>
                    <span className="font-mono text-amber-500 dark:text-amber-400 font-bold">Bo3 필수</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">2세트: 혼합 (Hybrid)</div>
                      <div className="text-slate-500 text-[11px]">고정 맵풀: 왕의 길, 눔바니, 미드타운</div>
                    </div>
                    <span className="font-mono text-amber-500 dark:text-amber-400 font-bold">Bo3 필수</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">3세트: 플래시포인트 / 밀기</div>
                      <div className="text-slate-500 text-[11px]">고정 맵풀: 수라바사, 뉴 정크 시티, 이스페란사</div>
                    </div>
                    <span className="font-mono text-amber-500 dark:text-amber-400 font-bold">Bo3 결정세트</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">4세트: 호위 (Escort)</div>
                      <div className="text-slate-500 text-[11px]">고정 맵풀: 서킷 로얄, 지브롤터 감시기지</div>
                    </div>
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">Bo5 연장세트</span>
                  </div>
                </div>
              </AdminCard>
            </div>

            <div className="xl:col-span-5 h-full min-h-0 flex flex-col">
              <AdminCard
                title="대회 규정 및 세부 설정"
                className="h-full"
                actions={
                  <AdminFormActions
                    onSave={handleSaveStructure}
                    onNew={handleResetStructure}
                    saveLabel="규정 저장"
                    newLabel="설정 초기화"
                  />
                }
              >
                <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      조별 풀리그 경기 방식
                    </label>
                    <select
                      value={ruleConfig.groupFormat}
                      onChange={(e) => setRuleConfig({ ...ruleConfig, groupFormat: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    >
                      <option value="Bo1">단판제 (Bo1)</option>
                      <option value="Bo3">3판 2선승제 (Bo3)</option>
                      <option value="Bo5">5판 3선승제 (Bo5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      본선 토너먼트 경기 방식
                    </label>
                    <select
                      value={ruleConfig.playoffFormat}
                      onChange={(e) => setRuleConfig({ ...ruleConfig, playoffFormat: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    >
                      <option value="Bo3">3판 2선승제 (Bo3)</option>
                      <option value="Bo5">5판 3선승제 (Bo5)</option>
                      <option value="Bo7">7판 4선승제 (Bo7)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      결승전 경기 방식
                    </label>
                    <select
                      value={ruleConfig.finalFormat}
                      onChange={(e) => setRuleConfig({ ...ruleConfig, finalFormat: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    >
                      <option value="Bo5">5판 3선승제 (Bo5)</option>
                      <option value="Bo7">7판 4선승제 (Bo7)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        조당 팀 수
                      </label>
                      <input
                        type="number"
                        value={ruleConfig.teamsPerGroup}
                        onChange={(e) =>
                          setRuleConfig({ ...ruleConfig, teamsPerGroup: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        조별 본선 진출 팀 수
                      </label>
                      <input
                        type="number"
                        value={ruleConfig.qualifiersPerGroup}
                        onChange={(e) =>
                          setRuleConfig({ ...ruleConfig, qualifiersPerGroup: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          영웅 밴(Ban) 시스템 운영
                        </div>
                        <div className="text-[11px] text-slate-400">
                          팀별 세트당 지정 영웅 밴 적용
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={ruleConfig.heroBanEnabled}
                        onChange={(e) =>
                          setRuleConfig({ ...ruleConfig, heroBanEnabled: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-[#f99e1a] focus:ring-[#f99e1a] accent-[#f99e1a]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        맵 선택 권한 규칙
                      </label>
                      <input
                        type="text"
                        value={ruleConfig.mapPickRule}
                        onChange={(e) =>
                          setRuleConfig({ ...ruleConfig, mapPickRule: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        동점 타이브레이커 규정
                      </label>
                      <input
                        type="text"
                        value={ruleConfig.overtimeRule}
                        onChange={(e) =>
                          setRuleConfig({ ...ruleConfig, overtimeRule: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </AdminCard>
            </div>
          </>
        )}
      </div>
      <AdminModal isOpen={seasonModalOpen} onClose={() => setSeasonModalOpen(false)} title="대회 선택" description="저장된 대회를 선택하면 참가자 목록을 불러옵니다." maxWidth="lg">
        <div className="space-y-2">{seasons.map((season) => <button key={season.id} type="button" onClick={() => { setSelectedSeasonId(season.id); setActiveTab("participants"); setSeasonModalOpen(false); }} className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm ${selectedSeason?.id === season.id ? "border-amber-500 bg-amber-500/10" : "border-slate-200 dark:border-slate-700"}`}><span className="font-semibold">{season.name}</span><span className="text-xs text-slate-500">{season.status}</span></button>)}</div>
      </AdminModal>
    </section>
  );
}
