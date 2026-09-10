import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { QuizResult } from '../types';
import { Trophy, Medal, Award, Clock, Users, ArrowLeft, Search, Filter } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const { setCurrentPage } = useApp();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [classFilter, setClassFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/results')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setResults(data);
      })
      .catch(() => {});
  }, []);

  const filtered = results
    .filter(r => {
      const matchClass = classFilter === 'ALL' || r.studentClass === classFilter;
      const matchSearch = r.studentName.toLowerCase().includes(search.toLowerCase()) ||
        r.quizTitle.toLowerCase().includes(search.toLowerCase());
      return matchClass && matchSearch;
    })
    .sort((a, b) => b.score - a.score || a.timeSpentSeconds - b.timeSpentSeconds);

  const top3 = filtered.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('landing')}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              HALL OF FAME
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500 fill-amber-500" />
              Papan Peringkat Prestasi Matsamaga
            </h1>
            <p className="text-xs text-slate-500">
              Apresiasi peserta didik dengan nilai tertinggi dan penyelesaian tercepat MTsN 5 Tegal.
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Juara 2 */}
          {top3[1] && (
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 text-center shadow-md space-y-3 order-2 md:order-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
                  🥈
                </div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Peringkat 2</span>
                <h3 className="font-extrabold text-sm text-slate-900">{top3[1].studentName}</h3>
                <p className="text-xs text-slate-500">Kelas {top3[1].studentClass}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-2xl font-black text-slate-800 font-mono">{top3[1].score} pt</div>
                <div className="text-[11px] text-slate-400">{top3[1].quizTitle}</div>
              </div>
            </div>
          )}

          {/* Juara 1 (Tinggi di tengah) */}
          {top3[0] && (
            <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl border-2 border-amber-300 p-6 text-center shadow-xl space-y-3 order-1 md:order-2 md:-translate-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-amber-400 text-white flex items-center justify-center mx-auto text-3xl font-black shadow-lg shadow-amber-400/30 animate-bounce">
                  🥇
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  Juara Utama
                </span>
                <h3 className="font-black text-base text-slate-900">{top3[0].studentName}</h3>
                <p className="text-xs text-slate-500 font-medium">Kelas {top3[0].studentClass}</p>
              </div>
              <div className="p-3 bg-amber-100/50 rounded-2xl border border-amber-200">
                <div className="text-3xl font-black text-amber-900 font-mono">{top3[0].score} pt</div>
                <div className="text-[11px] text-amber-800 font-medium">{top3[0].quizTitle}</div>
              </div>
            </div>
          )}

          {/* Juara 3 */}
          {top3[2] && (
            <div className="bg-white rounded-3xl border-2 border-amber-100 p-6 text-center shadow-md space-y-3 order-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
                  🥉
                </div>
                <span className="text-[10px] font-bold uppercase text-amber-700">Peringkat 3</span>
                <h3 className="font-extrabold text-sm text-slate-900">{top3[2].studentName}</h3>
                <p className="text-xs text-slate-500">Kelas {top3[2].studentClass}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-2xl font-black text-slate-800 font-mono">{top3[2].score} pt</div>
                <div className="text-[11px] text-slate-400">{top3[2].quizTitle}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full max-w-sm">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama peserta atau nama kuis..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-500 font-semibold">Filter Kelas:</span>
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 text-xs"
          >
            <option value="ALL">Semua Kelas</option>
            <option value="VII A">Kelas VII A</option>
            <option value="VII B">Kelas VII B</option>
            <option value="VIII A">Kelas VIII A</option>
            <option value="VIII B">Kelas VIII B</option>
            <option value="IX A">Kelas IX A</option>
            <option value="IX B">Kelas IX B</option>
          </select>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Nama Siswa</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4">Nama Kuis</th>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4 text-right">Skor Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((r, idx) => (
                <tr key={r.id || idx} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="py-3.5 px-4 text-center font-bold">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{r.studentName}</td>
                  <td className="py-3.5 px-4">{r.studentClass}</td>
                  <td className="py-3.5 px-4 text-slate-600">{r.quizTitle}</td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">
                    {Math.floor(r.timeSpentSeconds / 60)}m {r.timeSpentSeconds % 60}s
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-800 font-mono text-sm">
                    {r.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
