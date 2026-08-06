'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('경기 결과 관리');
  const [toastMessage, setToastMessage] = useState('');
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

  // Mock Admin Data
  const adminStats = [
    { label: '등록 스트리머', value: '42명', name: '전체 등록 완료' },
    { label: '진행 시즌', value: 'S05', name: '러너리그 Season 05' },
    { label: '완료 경기', value: '18', name: '누적 매치 완료' },
    { label: '평균 KDA', value: '3.42', name: '시즌 통합 평균' },
    { label: '최고 승률', value: '78%', name: '제타치즈 (딜러)' },
    { label: '시스템 상태', value: 'OK', name: 'Prisma DB 정상' },
  ];

  const recentMatches = [
    { id: 101, tag: 'RUNNER · W5', teamA: '제타치즈 팀', teamB: '산왕이 팀', score: '3 : 1', winner: '제타치즈 팀', date: '2026.08.05', status: '최종 승인' },
    { id: 102, tag: 'RIVAL · 8강', teamA: '리코샤 팀', teamB: '노을빛 팀', score: '2 : 3', winner: '노을빛 팀', date: '2026.08.04', status: '최종 승인' },
    { id: 103, tag: 'RUNNER · W4', teamA: '후니베어 팀', teamB: '폭풍우진 팀', score: '3 : 2', winner: '후니베어 팀', date: '2026.08.02', status: '최종 승인' },
    { id: 104, tag: 'RUNNER · W6', teamA: '미스틱캣 팀', teamB: '카이저 팀', score: '0 : 0', winner: '미정', date: '2026.08.08', status: '경기 예정' },
  ];

  const streamers = [
    { id: 1, name: '제타치즈', nickname: 'ZetaCheese', position: 'DAMAGE', team: '제타치즈 팀', status: '활성' },
    { id: 2, name: '리코샤', nickname: 'Ricosha', position: 'TANK', team: '리코샤 팀', status: '활성' },
    { id: 3, name: '후니베어', nickname: 'HooniBear', position: 'HEALER', team: '후니베어 팀', status: '활성' },
    { id: 4, name: '폭풍우진', nickname: 'StormWoojin', position: 'DAMAGE', team: '폭풍우진 팀', status: '활성' },
    { id: 5, name: '미스틱캣', nickname: 'MysticCat', position: 'TANK', team: '미스틱캣 팀', status: '활성' },
  ];

  return (
    <>
      {/* Topbar Navigation */}
      <div className="topbar">
        <div className="brand" onClick={() => triggerToast('관리자 홈으로 이동합니다')}>
          RO<span>MS</span> <span className="mono" style={{ fontSize: '12px', color: 'var(--cobalt)', marginLeft: '4px' }}>[ADMIN]</span>
        </div>
        <div className="nav-tabs">
          {['경기 결과 관리', '선수/스트리머 관리', '시즌/팀 관리', '공통 코드'].map((tab) => (
            <div
              key={tab}
              className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                triggerToast(`${tab} 화면으로 전환합니다`);
              }}
            >
              {tab}
            </div>
          ))}
        </div>
        <Link href="/" className="admin-switch-btn ml-4">
          ← 사용자 대시보드
        </Link>
        <div className="search-wrap">
          <input
            type="text"
            placeholder="관리 항목 검색"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                triggerToast(`"${e.currentTarget.value.trim()}" 검색 결과입니다`);
              }
            }}
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="#14141A" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* Admin Hero Section */}
      <div className="hero" style={{ background: 'rgba(44, 75, 255, 0.03)' }}>
        <div className="hero-rule"></div>
        <div className="hero-eyebrow">ROMS System Control Panel · Admin Dashboard</div>
        <div className="hero-row">
          <div className="hero-num" style={{ fontSize: 'min(18vw, 160px)' }}>42</div>
          <div className="hero-info">
            <div className="hero-name">시스템 관리 센터</div>
            <div className="hero-meta">시즌 05 진행 중 · 총 18경기 등록 완료 · DB 연결 정상</div>
            <button className="hero-cta" onClick={() => triggerToast('신규 경기 결과 등록 모달을 엽니다')}>
              + 경기 결과 등록
            </button>
          </div>
        </div>
      </div>

      {/* Admin Content Container */}
      <div className="content">

        {/* Quick Admin Overview Stat Strip */}
        <div className="section">
          <div className="section-head">
            <span className="section-title">시스템 현황 요약</span>
          </div>
          <div className="stat-strip">
            {adminStats.map((st) => (
              <div key={st.label} className="stat-item" onClick={() => triggerToast(`${st.label} 세부 정보를 확인합니다`)}>
                <div className="stat-label">{st.label}</div>
                <div className="stat-value">{st.value}</div>
                <div className="stat-name">{st.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Matches Management */}
        <div className="section">
          <div className="section-head">
            <span className="section-title">최근 등록 경기 관리</span>
            <span className="section-sub">수정 및 세트별 전적 입력 가능</span>
          </div>
          <div className="rank-list">
            {recentMatches.map((m) => (
              <div key={m.id} className="rank-row" style={{ gridTemplateColumns: '70px 1.5fr 1fr 100px 120px' }}>
                <span className="mono" style={{ fontSize: '13px', color: 'var(--ink-faint)', fontWeight: 700 }}>
                  #{m.id}
                </span>
                <div>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--cobalt)', display: 'block' }}>{m.tag} ({m.date})</span>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>{m.teamA} vs {m.teamB}</span>
                </div>
                <div className="mono" style={{ fontSize: '14px', fontWeight: 700 }}>
                  {m.score} <span style={{ fontSize: '11px', color: 'var(--ink-dim)', fontWeight: 400 }}>({m.winner})</span>
                </div>
                <div>
                  <span className="match-badge win" style={{ background: m.status === '최종 승인' ? 'rgba(18,183,106,0.1)' : 'rgba(255,210,63,0.3)', color: m.status === '최종 승인' ? 'var(--support)' : 'var(--ink)' }}>
                    {m.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="hero-cta"
                    style={{ padding: '6px 10px', fontSize: '11px' }}
                    onClick={(e) => { e.stopPropagation(); triggerToast(`경기 #${m.id} 수정 모달을 활성화합니다`); }}
                  >
                    수정
                  </button>
                  <button
                    className="hero-cta"
                    style={{ padding: '6px 10px', fontSize: '11px', background: 'var(--dps)' }}
                    onClick={(e) => { e.stopPropagation(); triggerToast(`경기 #${m.id} 삭제 요청되었습니다`); }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Streamer / Player Management */}
        <div className="section" style={{ borderBottom: 'none' }}>
          <div className="section-head">
            <span className="section-title">스트리머 / 선수 관리</span>
            <span className="section-sub">등록된 스트리머 5명 표시 중</span>
          </div>
          <div className="rank-list">
            {streamers.map((s) => (
              <div key={s.id} className="rank-row" style={{ gridTemplateColumns: '50px 1.5fr 1fr 100px 120px' }}>
                <span className="mono" style={{ fontSize: '13px', color: 'var(--ink-faint)' }}>0{s.id}</span>
                <div className="rank-player">
                  <span className={`role-mark ${s.position.toLowerCase()}`}></span>
                  <span className="rank-name">{s.name}</span>
                  <span className="rank-role">({s.nickname})</span>
                </div>
                <span className="mono" style={{ fontSize: '13px', color: 'var(--ink-dim)' }}>{s.team}</span>
                <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--support)' }}>{s.status}</span>
                <button
                  className="hero-cta"
                  style={{ padding: '6px 12px', fontSize: '11px', background: 'var(--ink)' }}
                  onClick={() => triggerToast(`${s.name} 선수 정보를 수정합니다`)}
                >
                  선수 관리
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Toast Feedback */}
      <div id="toast" className={showToast ? 'show' : ''}>
        {toastMessage}
      </div>
    </>
  );
}
