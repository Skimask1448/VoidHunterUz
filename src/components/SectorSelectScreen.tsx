/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SectorConfig, SECTORS } from '../types';
import { BossIcon } from '../utils/icons';

interface SectorSelectScreenProps {
  unlockedSectors: string[];
  selectedSectorId: string;
  onSelectSector: (sector: SectorConfig) => void;
  onLaunchSector: (sector: SectorConfig) => void;
  onClose: () => void;
}

export default function SectorSelectScreen({
  unlockedSectors,
  selectedSectorId,
  onSelectSector,
  onLaunchSector,
  onClose,
}: SectorSelectScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-5 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌌</span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                СЕКТОРЫ ГАЛАКТИКИ
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Выберите звёздную систему экспедиции. Уничтожьте Флагман сектора, чтобы открыть новые рубежи и награды.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Sectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 overflow-y-auto pr-1">
          {SECTORS.map((sec, idx) => {
            const isUnlocked = unlockedSectors.includes(sec.id);
            const isSelected = selectedSectorId === sec.id;

            return (
              <div
                key={sec.id}
                onClick={() => {
                  if (isUnlocked) onSelectSector(sec);
                }}
                className={`relative rounded-xl p-5 border transition-all duration-300 flex flex-col justify-between ${
                  isUnlocked
                    ? isSelected
                      ? 'bg-gradient-to-br from-slate-900 to-slate-800/90 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400 cursor-pointer'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-600 hover:bg-slate-800/50 cursor-pointer'
                    : 'bg-slate-950/60 border-slate-900 opacity-60 cursor-not-allowed select-none'
                }`}
                style={{
                  borderLeftWidth: '5px',
                  borderLeftColor: isUnlocked ? sec.palette.accentColor : '#475569',
                }}
              >
                {/* Sector Header Info */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${sec.palette.accentColor}20`,
                        color: isUnlocked ? sec.palette.accentColor : '#94a3b8',
                        border: `1px solid ${sec.palette.accentColor}40`,
                      }}
                    >
                      {sec.subtitle}
                    </span>

                    {/* Multiplier / Status badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        💰 x{sec.creditMultiplier} кр.
                      </span>
                      {!isUnlocked && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          🔒 Заблокирован
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mt-2">
                    <BossIcon
                      sectorId={sec.id}
                      size={54}
                      className={`rounded-xl border flex-shrink-0 shadow-lg ${
                        isUnlocked ? 'border-rose-500/50 shadow-rose-500/20' : 'border-slate-800 grayscale'
                      }`}
                      title={sec.bossName}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {sec.name}
                        {isSelected && isUnlocked && (
                          <span className="text-xs font-semibold text-cyan-400 tracking-normal border border-cyan-500/40 px-2 py-0.5 rounded-md bg-cyan-950/50">
                            Выбран
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {sec.desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details & Target */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Цель вызова Босса:</span>
                    <span className="font-mono font-bold text-sky-300">
                      {sec.targetScore.toLocaleString()} очков
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Флагман Сектора:</span>
                    <span className="font-semibold text-rose-300 flex items-center gap-1">
                      ⚠️ {sec.bossName}
                    </span>
                  </div>

                  {/* Reward Preview */}
                  <div className="mt-2 p-2.5 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span>🏆</span> Трофей:
                    </span>
                    <span className="font-medium text-amber-300 text-right">
                      +{sec.reward.credits} кр.
                      {sec.reward.skinName && ` • Скин «${sec.reward.skinName}»`}
                      {sec.reward.rocketSkinName && ` • Ракета «${sec.reward.rocketSkinName}»`}
                    </span>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="mt-4">
                  {isUnlocked ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLaunchSector(sec);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-md ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isSelected ? '🚀 В Бой!' : 'Выбрать Сектор'}
                    </button>
                  ) : (
                    <div className="w-full py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
                      Пройдите {SECTORS[idx - 1]?.name || 'предыдущий сектор'} для разблокировки
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Совет: на более сложных секторах множитель золота выше!</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-semibold"
          >
            Назад в меню
          </button>
        </div>
      </div>
    </div>
  );
}
