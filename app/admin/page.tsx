"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("공통 마스터 관리");
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 관리자 메뉴 목록 정의 (ROMS_메뉴구성도.md 기준)
  const adminMenuList = [
    "공통 마스터 관리",
    "시즌 및 팀/로스터 관리",
    "매치 관리 & 기록 입력",
    "경기 결과 & 스탯 조회",
  ];

  // 메뉴 검색 필터링 로직
  const filteredMenuList = adminMenuList.filter((menu) =>
    menu.toLowerCase().includes(menuSearchQuery.trim().toLowerCase()),
  );

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setShowToast(false);
    }, 1800);
  };

  // Mock Admin Data
  const adminStats = [
    { label: "등록 스트리머", value: "42명", name: "전체 등록 완료" },
    { label: "진행 시즌", value: "S05", name: "러너리그 Season 05" },
    { label: "완료 경기", value: "18", name: "누적 매치 완료" },
    { label: "평균 KDA", value: "3.42", name: "시즌 통합 평균" },
    { label: "최고 승률", value: "78%", name: "제타치즈 (딜러)" },
    { label: "시스템 상태", value: "OK", name: "Prisma DB 정상" },
  ];

  const recentMatches = [
    {
      id: 101,
      tag: "RUNNER · W5",
      teamA: "제타치즈 팀",
      teamB: "산왕이 팀",
      score: "3 : 1",
      winner: "제타치즈 팀",
      date: "2026.08.05",
      status: "최종 승인",
    },
    {
      id: 102,
      tag: "RIVAL · 8강",
      teamA: "리코샤 팀",
      teamB: "노을빛 팀",
      score: "2 : 3",
      winner: "노을빛 팀",
      date: "2026.08.04",
      status: "최종 승인",
    },
    {
      id: 103,
      tag: "RUNNER · W4",
      teamA: "후니베어 팀",
      teamB: "폭풍우진 팀",
      score: "3 : 2",
      winner: "후니베어 팀",
      date: "2026.08.02",
      status: "최종 승인",
    },
    {
      id: 104,
      tag: "RUNNER · W6",
      teamA: "미스틱캣 팀",
      teamB: "카이저 팀",
      score: "0 : 0",
      winner: "미정",
      date: "2026.08.08",
      status: "경기 예정",
    },
  ];

  const streamers = [
    {
      id: 1,
      name: "제타치즈",
      nickname: "ZetaCheese",
      position: "DAMAGE",
      team: "제타치즈 팀",
      status: "활성",
    },
    {
      id: 2,
      name: "리코샤",
      nickname: "Ricosha",
      position: "TANK",
      team: "리코샤 팀",
      status: "활성",
    },
    {
      id: 3,
      name: "후니베어",
      nickname: "HooniBear",
      position: "HEALER",
      team: "후니베어 팀",
      status: "활성",
    },
    {
      id: 4,
      name: "폭풍우진",
      nickname: "StormWoojin",
      position: "DAMAGE",
      team: "폭풍우진 팀",
      status: "활성",
    },
    {
      id: 5,
      name: "미스틱캣",
      nickname: "MysticCat",
      position: "TANK",
      team: "미스틱캣 팀",
      status: "활성",
    },
  ];

  return (
    <>
      <div className="admin-layout">
        {/* 좌측 사이드바 Nav 영역 */}
        <aside className="admin-sidebar">
          <div
            className="sidebar-brand"
            onClick={() => triggerToast("관리자 홈으로 이동합니다")}
          >
            RO<span>MS</span> <span className="admin-tag">[ADMIN]</span>
          </div>
          <div className="sidebar-menu">
            {adminMenuList.map((menu) => {
              const isSearched = filteredMenuList.includes(menu);
              const isActive = activeTab === menu;

              return (
                <div
                  key={menu}
                  className={`sidebar-item ${isActive ? "active" : ""} ${!isSearched ? "dimmed" : ""} `}
                  onClick={() => {
                    setActiveTab(menu);
                    triggerToast(`${menu} 화면으로 전환합니다`);
                  }}
                >
                  <span className="sidebar-item-bullet">•</span>
                  <span className="sidebar-item-text">{menu}</span>
                </div>
              );
            })}
          </div>
          <div className="sidebar-footer">
            <Link href="/" className="admin-switch-btn">
              ← 사용자 대시보드
            </Link>
          </div>
        </aside>
        {/* 메인 콘텐츠 영역 */}
        <div className="admin-main">
          <header className="admin-header">
            <div className="menu-search-box">
              <input
                type="text"
                className="menu-search-input"
                placeholder="메뉴 검색 (예: 경기, 스트리머...)"
                value={menuSearchQuery}
                onChange={(e) => setMenuSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredMenuList.length > 0) {
                    setActiveTab(filteredMenuList[0]);
                    triggerToast(`${filteredMenuList[0]} 메뉴로 이동했습니다`);
                  }
                }}
              />
              {/* 검색 아이콘 */}
              <svg
                className="menu-search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </header>
          <main className="admin-body">
            {/* 1. 상단 KPI 요약 스트립 */}
            <section className="section" style={{ paddingTop: 0 }}>
              <div className="section-head">
                <h2 className="section-title">SYSTEM OVERVIEW</h2>
                <span className="section-sub">실시간 운영 현황 요약</span>
              </div>
              <div className="stat-strip">
                {adminStats.map((stat, idx) => (
                  <div key={idx} className="stat-item">
                    <div className="stat-label">{stat.label}</div>
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-name">{stat.name}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. 빠른 실행 CTA 바 */}
            <div style={{ display: "flex", gap: "12px", margin: "24px 0 36px" }}>
              <button
                className="hero-cta"
                onClick={() => triggerToast("경기 결과 입력 페이지로 이동합니다")}
              >
                + 신규 경기 스탯 입력
              </button>
              <button
                className="admin-switch-btn"
                onClick={() => triggerToast("선수 등록 팝업을 열었습니다")}
              >
                + 선수/스트리머 등록
              </button>
            </div>

            {/* 3. activeTab별 동적 탭 컨텐츠 (ROMS_메뉴구성도.md 메뉴 순서 적용) */}
            {activeTab === "공통 마스터 관리" && (
              <section className="section">
                <div className="section-head">
                  <h2 className="section-title">공통 마스터 관리 (스트리머/영웅/맵)</h2>
                  <span className="section-sub">등록 스트리머, 영웅 픽풀, 맵 데이터 관리 (SCR-009 / AD-004)</span>
                </div>
                <div className="rank-list">
                  {streamers.map((s, idx) => (
                    <div
                      key={s.id}
                      className="rank-row"
                      style={{ gridTemplateColumns: "40px 1fr 140px 100px 80px" }}
                    >
                      <span className="rank-index">{idx + 1}</span>
                      <div className="rank-player">
                        <span className={`role-mark ${s.position.toLowerCase()}`} />
                        <span className="rank-name">{s.name}</span>
                        <span className="rank-role">({s.nickname})</span>
                      </div>
                      <span className="rank-cell">{s.team}</span>
                      <span className="rank-cell wins">{s.position}</span>
                      <button
                        className="admin-switch-btn"
                        onClick={() => triggerToast(`${s.name} 선수 정보 수정`)}
                      >
                        수정
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "시즌 및 팀/로스터 관리" && (
              <section className="section">
                <div className="section-head">
                  <h2 className="section-title">시즌 및 팀/로스터 관리</h2>
                  <span className="section-sub">대회 시즌 생성, 팀 생성 및 선수 배정 (SCR-005 / AD-001, AD-002)</span>
                </div>
                <p style={{ color: "var(--ink-dim)", fontSize: "14px" }}>
                  시즌 및 팀/로스터 관리 메뉴 준비 중입니다. (요구사항 ID: AD-001, AD-002)
                </p>
              </section>
            )}

            {activeTab === "매치 관리 & 기록 입력" && (
              <section className="section">
                <div className="section-head">
                  <h2 className="section-title">매치 관리 & 기록 입력</h2>
                  <span className="section-sub">매치 생성 및 게임 흐름 기반 상세 스탯 입력 (SCR-007 / AD-003)</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {recentMatches.map((match) => (
                    <div key={match.id} className="match-row">
                      <span className="match-tag">{match.tag}</span>
                      <div className="match-names">
                        {match.teamA}{" "}
                        <span style={{ color: "var(--ink-faint)", margin: "0 6px" }}>
                          VS
                        </span>{" "}
                        {match.teamB}
                      </div>
                      <span className="match-score">{match.score}</span>
                      <span
                        className={`match-badge ${match.status === "최종 승인" ? "win" : "lose"}`}
                      >
                        {match.status}
                      </span>
                      <button
                        className="admin-switch-btn"
                        style={{ marginLeft: "12px" }}
                        onClick={() =>
                          triggerToast(`Match #${match.id} 스탯 입력 화면으로 이동`)
                        }
                      >
                        {match.status === "최종 승인" ? "스탯 수정" : "스탯 입력"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "경기 결과 & 스탯 조회" && (
              <section className="section">
                <div className="section-head">
                  <h2 className="section-title">경기 결과 & 스탯 통합 조회</h2>
                  <span className="section-sub">시즌/팀/선수별 경기 세트 및 상세 스탯 필터링 조회·검수 (SCR-010 / AD-003)</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {recentMatches
                    .filter((match) => match.status === "최종 승인")
                    .map((match) => (
                      <div key={match.id} className="match-row">
                        <span className="match-tag">{match.tag}</span>
                        <div className="match-names">
                          {match.teamA}{" "}
                          <span style={{ color: "var(--ink-faint)", margin: "0 6px" }}>
                            VS
                          </span>{" "}
                          {match.teamB}
                        </div>
                        <span className="match-score">{match.score}</span>
                        <span className="match-badge win">최종 승인</span>
                        <button
                          className="admin-switch-btn"
                          style={{ marginLeft: "12px" }}
                          onClick={() =>
                            triggerToast(`Match #${match.id} 결과 상세 조회`)
                          }
                        >
                          상세 보기
                        </button>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* Toast Feedback */}
      <div id="toast" className={showToast ? "show" : ""}>
        {toastMessage}
      </div>
    </>
  );
}
