// app/page.tsx
"use client";

import React, { useState, useRef } from "react";
import UserHeader from "@/components/layout/UserHeader";

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("러너리그");
  const [searchQuery, setSearchQuery] = useState("");

  // Toast 상태 관리
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setShowToast(false);
    }, 1800);
  };

  const roleLabel: Record<string, string> = {
    tank: "탱커",
    dps: "딜러",
    support: "힐러",
  };

  const ranking = [
    { name: "제타치즈", role: "dps", wins: 5, kda: "4.8", wr: "78%" },
    { name: "리코샤", role: "tank", wins: 4, kda: "3.1", wr: "71%" },
    { name: "후니베어", role: "support", wins: 3, kda: "5.2", wr: "66%" },
    { name: "폭풍우진", role: "dps", wins: 3, kda: "4.1", wr: "64%" },
    { name: "미스틱캣", role: "tank", wins: 2, kda: "2.9", wr: "58%" },
  ];

  const highlights = [
    { label: "최다처치", value: "60", name: "제타치즈" },
    { label: "최다도움", value: "30", name: "후니베어" },
    { label: "최다죽음", value: "15", name: "산왕이" },
    { label: "최다피해", value: "20k", name: "폭풍우진" },
    { label: "최다치유", value: "30k", name: "리코샤" },
    { label: "최다경감", value: "40k", name: "미스틱캣" },
  ];

  const matches = [
    {
      tag: "RUNNER · W5",
      names: "제타치즈 vs 산왕이",
      score: "3 : 1",
      result: "win",
    },
    {
      tag: "RIVAL · 8강",
      names: "리코샤 vs 노을빛",
      score: "2 : 3",
      result: "lose",
    },
    {
      tag: "RUNNER · W4",
      names: "후니베어 vs 폭풍우진",
      score: "3 : 2",
      result: "win",
    },
    {
      tag: "RIVAL · 4강",
      names: "미스틱캣 vs 제타치즈",
      score: "1 : 3",
      result: "lose",
    },
  ];

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      triggerToast(`"${searchQuery.trim()}" 검색 결과로 이동합니다`);
    }
  };

  return (
    <>
      {/* 1. 상단 사용자 헤더 컴포넌트 삽입 */}
      <UserHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onToast={triggerToast}
      />

      {/* 2. 러너리그 메인 배너 MVP */}
      <div className="hero">
        <div className="hero-rule"></div>
        <div className="hero-eyebrow">Season 05 · Runner League Champion</div>
        <div className="hero-row">
          <div className="hero-num">5</div>
          <div className="hero-info">
            <div className="hero-name">제타치즈</div>
            <div className="hero-meta">
              딜러 · 최다처치 60 · K/D 평균 2.4 · 승률 78%
            </div>
            <button
              className="hero-cta"
              onClick={() => triggerToast("제타치즈 상세화면으로 이동합니다")}
            >
              전적 상세보기 →
            </button>
          </div>
        </div>
      </div>

      {/* 3. 러너리그 메인 컨텐츠 영역 */}
      <div className="content">
        <div className="section">
          <div className="section-head">
            <span className="section-title">러너리그 순위</span>
            <span className="section-sub">클릭 시 선수 상세화면으로 이동</span>
          </div>
          <div className="rank-list" id="rankList">
            {ranking.map((p, i) => (
              <div
                key={p.name}
                className="rank-row"
                onClick={() =>
                  triggerToast(`${p.name} 상세화면으로 이동합니다`)
                }
              >
                <span className={`rank-index ${i === 0 ? "top" : ""}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="rank-player">
                  <span className={`role-mark ${p.role}`}></span>
                  <span className="rank-name">{p.name}</span>
                  <span className="rank-role">{roleLabel[p.role]}</span>
                </div>
                <span className="rank-cell wins">{p.wins} WINS</span>
                <span className="rank-cell">KDA {p.kda}</span>
                <span className="rank-cell">{p.wr}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-head">
            <span className="section-title">이번 시즌 지표</span>
          </div>
          <div className="stat-strip" id="statStrip">
            {highlights.map((h) => (
              <div
                key={h.label}
                className="stat-item"
                onClick={() =>
                  triggerToast(`${h.name} 상세화면으로 이동합니다`)
                }
              >
                <div className="stat-label">{h.label}</div>
                <div className="stat-value">{h.value}</div>
                <div className="stat-name">{h.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="section" style={{ borderBottom: "none" }}>
          <div className="section-head">
            <span className="section-title">최근 경기 결과</span>
          </div>
          <div id="matchList">
            {matches.map((m, idx) => (
              <div
                key={idx}
                className="match-row"
                onClick={() => triggerToast("매치 상세 결과로 이동합니다")}
              >
                <span className="match-tag">{m.tag}</span>
                <span className="match-names">{m.names}</span>
                <span className="match-score">{m.score}</span>
                <span className={`match-badge ${m.result}`}>
                  {m.result === "win" ? "승리" : "패배"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 토스트 알림창 */}
      <div id="toast" className={showToast ? "show" : ""}>
        {toastMessage}
      </div>
    </>
  );
}
