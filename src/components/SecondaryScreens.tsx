/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RunHistoryItem, Skin } from '../types';
import { UPGRADES } from '../utils/upgrades';
import { PerkIcon } from '../utils/icons';

interface SecondaryScreensProps {
  initialTab: 'leaderboard' | 'history' | 'codex';
  bestWave: number;
  bestScore: number;
  runHistory: RunHistoryItem[];
  unlockedSynergies: string[];
  skins: Skin[];
  onClose: () => void;
}

export default function SecondaryScreens({
  initialTab,
  bestWave,
  bestScore,
  runHistory,
  unlockedSynergies,
  skins,
  onClose,
}: SecondaryScreensProps) {
  const [tab, setTab] = useState<'leaderboard' | 'history' | 'codex'>(initialTab);

  // Synergy list filter (all upgrades where synergy is true)
  const listSynergies = UPGRADES.filter(u => u.synergy);

  const getRankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden bento-glow-indigo">
        
        {/* Header Tabs Navigation */}
        <div className="flex gap-1.5 p-1 bg-zinc-950 border border-zinc-850 rounded-xl mb-4">
          <button
            onClick={() => setTab('leaderboard')}
            className={`flex-1 py-2 text-xs tracking-wider font-extrabold text-center uppercase rounded-lg transition duration-150 cursor-pointer font-mono ${
              tab === 'leaderboard'
                ? 'bg-indigo-950/30 border border-indigo-500/40 text-indigo-450'
                : 'bg-transparent text-zinc-500 hover:text-zinc-200'
            }`}
          >
            🏆 Рекорды
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-2 text-xs tracking-wider font-extrabold text-center uppercase rounded-lg transition duration-150 cursor-pointer font-mono ${
              tab === 'history'
                ? 'bg-indigo-950/30 border border-indigo-500/40 text-indigo-450'
                : 'bg-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            📜 История
          </button>
          <button
            onClick={() => setTab('codex')}
            className={`flex-1 py-1.5 text-xs tracking-wider font-extrabold text-center uppercase rounded-lg transition duration-150 cursor-pointer font-mono ${
              tab === 'codex'
                ? 'bg-indigo-950/30 border border-indigo-500/40 text-indigo-450'
                : 'bg-transparent text-zinc-500 hover:text-zinc-305'
            }`}
          >
            ⭐ Синергии
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto pr-1">
          {tab === 'leaderboard' && (
            <div className="flex flex-col gap-3">
              <h3 className="text-xs uppercase font-black text-zinc-500 tracking-wider font-mono">ТАБЛИЦА РЕКОРДОВ</h3>
              
              {bestWave > 0 ? (
                <div className="p-4 bg-zinc-950/60 rounded-xl border border-indigo-500/25 flex justify-between items-center relative overflow-hidden bento-glow-indigo">
                  <div className="absolute right-0 top-0 text-7xl font-black text-indigo-500/5 select-none pointer-events-none font-mono">
                    YOU
                  </div>
                  <div>
                    <div className="font-extrabold text-indigo-400 text-lg flex items-center gap-2 font-sans">
                      🥇 #1 Игрок <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300 tracking-widest uppercase font-mono">ТЫ</span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 font-mono">
                      ЛИЧНЫЙ РЕКОРД: <span className="text-zinc-100 font-bold">{bestScore.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-semibold text-zinc-500 uppercase font-mono">Макс. Волна</div>
                    <div className="text-3xl font-black text-indigo-400 leading-none font-mono">{bestWave}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
                  <p className="text-zinc-400 text-sm">Ты еще не совершил ни одного вылета.</p>
                  <p className="text-xs text-indigo-400 mt-1 font-mono">Очки твоих забегов загрузятся сюда!</p>
                </div>
              )}
              
              <div className="mt-2 text-[10px] text-zinc-500 bg-zinc-950/30 p-3 rounded-lg border border-zinc-850 text-center font-mono uppercase">
                🏆 Личные рекорды и статистика вылетов сохраняются локально на этом устройстве.
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div className="flex flex-col gap-2.5">
              <h3 className="text-xs uppercase font-black text-zinc-500 tracking-wider mb-1 font-mono">ИСТОРИЯ ВЫЛЕТОВ</h3>
              {runHistory.length > 0 ? (
                runHistory.map((run, i) => {
                  const skin = skins.find(s => s.id === run.skin);
                  const dateObj = new Date(run.date);
                  const formattedDate = dateObj.toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={i}
                      className={`p-3.5 bg-zinc-950/40 border rounded-xl flex justify-between items-center transition duration-150 ${
                        run.victory ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-zinc-800 hover:border-zinc-700/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full ring-2 ring-zinc-850 flex-shrink-0"
                          style={{ background: skin?.col || '#2ed8ff' }}
                        />
                        <div>
                          <div className="text-sm font-black text-zinc-200 flex items-center gap-2">
                            {run.victory ? (
                              <span className="text-emerald-400 font-bold">🏆 ПОБЕДА: {run.sectorName || 'Сектор'}</span>
                            ) : (
                              <span>Забег #{runHistory.length - i}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                            Волна {run.wave} • {run.score.toLocaleString()} очков • {formattedDate}
                          </div>
                          {run.upgrades && run.upgrades.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {run.upgrades.slice(0, 7).map((tg, idx) => (
                                <PerkIcon key={idx} id={tg} size={18} className="rounded border border-zinc-800/80" title={tg} />
                              ))}
                              {run.upgrades.length > 7 && (
                                <span className="text-[10px] text-zinc-500 font-mono self-center">+{run.upgrades.length - 7}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right font-mono flex-shrink-0 ml-3">
                        <div className="text-xs font-black text-amber-400">+{run.credits} КР.</div>
                        <div className="text-[10px] text-zinc-500 uppercase mt-0.5 font-bold">ЗАРАБОТАНО</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
                  <p className="text-zinc-400 text-sm">Раздел истории пуст.</p>
                  <p className="text-xs text-zinc-500 mt-1 font-mono">Пройди хотя бы 1 волну до гибели обшивки.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'codex' && (
            <div className="flex flex-col gap-3">
              <div className="mb-1">
                <h3 className="text-xs uppercase font-black text-zinc-500 tracking-wider font-mono">СИНЕРГОПЕДИЯ СЕКТОРА</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Объединяй обычные апгрейды во время прокачки для открытия легендарных оружейных комплексов.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {listSynergies.map(s => {
                  const unlocked = unlockedSynergies.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      className={`p-3 rounded-xl border transition-all flex items-center gap-3.5 ${
                        unlocked
                          ? 'border-yellow-500/40 bg-zinc-950 shadow-[inset_0_0_12px_rgba(251,191,36,0.06)]'
                          : 'border-zinc-800/80 bg-zinc-950/25 opacity-60'
                      }`}
                    >
                      <PerkIcon
                        id={s.id}
                        size={46}
                        className={`rounded-lg border flex-shrink-0 ${
                          unlocked ? 'border-yellow-500/50 shadow-md' : 'border-zinc-800 grayscale'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className={`text-sm font-black truncate ${unlocked ? 'text-yellow-400' : 'text-zinc-300'}`}>
                            {unlocked ? '🌟 ' : '🔒 '}{s.name}
                          </h4>
                          <span className={`text-[10px] font-black tracking-widest px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${
                            unlocked ? 'bg-yellow-500/25 text-yellow-300' : 'bg-zinc-805 text-zinc-500'
                          }`}>
                            {unlocked ? 'ОТКРЫТО' : 'ЗАБЛОК'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-tight mt-1">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Button Footer */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 bg-zinc-800 hover:bg-zinc-755 hover:text-white text-zinc-300 text-sm tracking-widest font-black uppercase rounded-xl transition duration-150 border border-zinc-700 hover:border-zinc-550 cursor-pointer font-mono"
        >
          Вернуться в меню
        </button>
      </div>
    </div>
  );
}
