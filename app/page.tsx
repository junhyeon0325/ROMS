'use client';

import React, { useState } from 'react';
import { Search, Trophy, Swords, Shield, Heart, Zap, Play, ChevronRight, UserCheck } from 'lucide-react';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Sample Leaderboard Data (Match CM-001 requirements)
  const winnersTop5 = [
    { rank: 1, name: 'Runner (윤대훈)', wins: 4, team: '러너팀', role: 'HEALER' },
    { rank: 2, name: 'Flow3r (황연오)', wins: 3, team: '꽃빈팀', role: 'DAMAGE' },
    { rank: 3, name: 'Haksal (김효종)', wins: 2, team: '학살팀', role: 'DAMAGE' },
    { rank: 4, name: 'Kaiser (류상훈)', wins: 2, team: '카이저팀', role: 'TANK' },
    { rank: 5, name: 'Stitch (이충희)', wins: 1, team: '스티치팀', role: 'DAMAGE' },
  ];

  const topKills = [
    { name: 'Runner', val: '1,240 Kill', team: '러너팀' },
    { name: 'Flow3r', val: '1,180 Kill', team: '꽃빈팀' },
    { name: 'Haksal', val: '1,120 Kill', team: '학살팀' },
  ];

  const topDamage = [
    { name: 'Haksal', val: '924,500 Dmg', team: '학살팀' },
    { name: 'Flow3r', val: '890,200 Dmg', team: '꽃빈팀' },
    { name: 'Stitch', val: '812,000 Dmg', team: '스티치팀' },
  ];

  const topHealing = [
    { name: 'Slime', val: '854,000 Heal', team: '슬라임팀' },
    { name: 'Twilight', val: '792,000 Heal', team: '트와일라잇팀' },
    { name: 'Runner', val: '740,000 Heal', team: '러너팀' },
  ];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#0b0e14]/90 backdrop-blur-md border-b border-gray-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
              R
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-wider text-white">ROMS</span>
              <span className="text-xs block text-amber-500 font-semibold tracking-widest uppercase">Overwatch League</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            {['시즌1', '시즌2', '시즌3', '시즌4', '라이벌클래시', '통합 랭킹'].map((item, idx) => (
              <button
                key={idx}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-amber-400 hover:bg-gray-800/50 rounded-lg transition-all"
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-all">
            로그인
          </button>
          <button className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-lg shadow-md shadow-amber-500/20 transition-all flex items-center space-x-2">
            <UserCheck className="w-4 h-4" />
            <span>ADMIN 관리자</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        {/* Hero Banner & Search Section */}
        <div className="relative rounded-3xl overflow-hidden p-8 md:p-12 bg-gradient-to-r from-amber-950/40 via-gray-900 to-slate-900 border border-amber-500/20 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wider">
              <Trophy className="w-3.5 h-3.5" />
              <span>RUNNER'S OVERWATCH MATCH SYSTEM</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              전체 시즌 <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">통합 전적 & 경기 아카이브</span>
            </h1>
            
            <p className="text-gray-400 text-base leading-relaxed">
              러너리그 시즌 1~4 및 라이벌클래시 스트리머 전적, 맵별 승률, 상대 전적, VOD 하이라이트를 검색하세요.
            </p>

            {/* Unified Search Input (CM-001) */}
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="스트리머(선수명)을 입력하세요... (예: Haksal, Runner)"
                className="w-full pl-12 pr-28 py-4 bg-gray-900/90 border border-gray-700/80 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm shadow-inner"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition-all shadow-md">
                검색
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Stat Cards (CM-001) */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Trophy className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-extrabold tracking-tight">전체 시즌 통합 지표 대시보드</h2>
            </div>
            <span className="text-xs text-gray-400">최근 업데이트: 2026.07.28</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Top 5 Winners Card */}
            <div className="glass-card rounded-2xl p-6 transition-all border border-amber-500/20">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div className="flex items-center space-x-2.5">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-gray-100">우승 횟수 TOP 5</h3>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">All Seasons</span>
              </div>
              <ul className="mt-4 space-y-3">
                {winnersTop5.map((p) => (
                  <li key={p.rank} className="flex items-center justify-between text-sm py-1">
                    <div className="flex items-center space-x-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        p.rank === 1 ? 'bg-amber-500 text-black' :
                        p.rank === 2 ? 'bg-gray-300 text-black' :
                        p.rank === 3 ? 'bg-amber-800 text-white' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {p.rank}
                      </span>
                      <span className="font-semibold text-gray-200">{p.name}</span>
                    </div>
                    <span className="font-extrabold text-amber-400">{p.wins}회 우승</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Kills Card */}
            <div className="glass-card rounded-2xl p-6 transition-all">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div className="flex items-center space-x-2.5">
                  <Swords className="w-5 h-5 text-red-400" />
                  <h3 className="font-bold text-base text-gray-100">최다 처치 (Kill)</h3>
                </div>
                <span className="text-xs text-gray-400">누적</span>
              </div>
              <ul className="mt-4 space-y-4">
                {topKills.map((k, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-200 text-sm">{k.name}</div>
                      <div className="text-xs text-gray-500">{k.team}</div>
                    </div>
                    <span className="font-bold text-red-400 text-sm">{k.val}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Damage Card */}
            <div className="glass-card rounded-2xl p-6 transition-all">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div className="flex items-center space-x-2.5">
                  <Zap className="w-5 h-5 text-orange-400" />
                  <h3 className="font-bold text-base text-gray-100">최다 피해 (Damage)</h3>
                </div>
                <span className="text-xs text-gray-400">누적</span>
              </div>
              <ul className="mt-4 space-y-4">
                {topDamage.map((d, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-200 text-sm">{d.name}</div>
                      <div className="text-xs text-gray-500">{d.team}</div>
                    </div>
                    <span className="font-bold text-orange-400 text-sm">{d.val}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Healing Card */}
            <div className="glass-card rounded-2xl p-6 transition-all">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div className="flex items-center space-x-2.5">
                  <Heart className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-base text-gray-100">최다 치유 (Healing)</h3>
                </div>
                <span className="text-xs text-gray-400">누적</span>
              </div>
              <ul className="mt-4 space-y-4">
                {topHealing.map((h, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-200 text-sm">{h.name}</div>
                      <div className="text-xs text-gray-500">{h.team}</div>
                    </div>
                    <span className="font-bold text-emerald-400 text-sm">{h.val}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Featured Recent Match VOD */}
        <div className="glass-card rounded-3xl p-8 border border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold text-amber-500 tracking-wider uppercase">HIGHLIGHT MATCH</span>
              <h2 className="text-2xl font-black text-white mt-1">시즌 4 결승전 세트 상세</h2>
            </div>
            <button className="text-xs font-semibold text-amber-400 hover:underline flex items-center space-x-1">
              <span>전체 경기 보기</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Match Teams Card */}
            <div className="lg:col-span-2 bg-gray-950/60 rounded-2xl p-6 border border-gray-800 flex items-center justify-between">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center font-bold text-xl mx-auto">
                  학살
                </div>
                <div className="font-bold text-lg">학살팀</div>
                <div className="text-xs text-emerald-400 font-semibold">WINNER (3)</div>
              </div>

              <div className="text-center px-4">
                <div className="text-3xl font-black text-amber-400 tracking-wider">3 : 1</div>
                <div className="text-xs text-gray-400 mt-1">결승전 BO5</div>
                <div className="text-[10px] text-gray-500 mt-2 px-2 py-1 bg-gray-800 rounded">1세트: 왕의 길</div>
              </div>

              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center font-bold text-xl mx-auto">
                  미라클
                </div>
                <div className="font-bold text-lg">미라클팀</div>
                <div className="text-xs text-gray-400">RUNNER-UP (1)</div>
              </div>
            </div>

            {/* VOD Link Action */}
            <div className="bg-gradient-to-br from-red-950/40 to-gray-900 rounded-2xl p-6 border border-red-500/20 flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="flex items-center space-x-2 text-red-400 text-xs font-bold">
                  <Play className="w-4 h-4 fill-current" />
                  <span>VOD AGAIN</span>
                </div>
                <h3 className="font-bold text-lg mt-2">유튜브/치지직 다시보기</h3>
                <p className="text-xs text-gray-400 mt-1">결승전 하이라이트 및 전체 세트 영상을 시청할 수 있습니다.</p>
              </div>

              <button className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-red-600/20">
                <Play className="w-4 h-4 fill-current" />
                <span>영상 다시보기 (VOD)</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
