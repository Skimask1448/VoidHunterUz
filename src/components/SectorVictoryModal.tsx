/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SectorConfig } from '../types';
import { BossIcon } from '../utils/icons';

interface SectorVictoryModalProps {
  sector: SectorConfig;
  nextSectorName?: string;
  isFirstClear: boolean;
  score: number;
  creditsEarned: number;
  onClaimAndExit: () => void;
  onContinueEndless: () => void;
}

export default function SectorVictoryModal({
  sector,
  nextSectorName,
  isFirstClear,
  score,
  creditsEarned,
  onClaimAndExit,
  onContinueEndless,
}: SectorVictoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400/80 rounded-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(251,191,36,0.3)] text-center text-slate-100 animate-scale-up">
        {/* Defeated Boss Portrait Header */}
        <div className="relative inline-block mx-auto mb-3">
          <BossIcon
            sectorId={sector.id}
            size={72}
            className="rounded-2xl border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.5)]"
          />
          <span className="absolute -bottom-1 -right-1 text-lg">👑</span>
        </div>

        <div className="text-xs uppercase tracking-widest font-bold text-amber-400">
          Миссия Выполнена!
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 mt-1">
          {sector.name.toUpperCase()} ЗАЧИЩЕН
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          Флагман <span className="text-rose-400 font-semibold">{sector.bossName}</span> полностью уничтожен! Космическое пространство стабилизировано.
        </p>

        {/* Stats & Rewards Box */}
        <div className="my-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">Итоговый счёт:</span>
            <span className="font-mono font-bold text-cyan-300 text-base">
              {Math.floor(score).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">Кредитов в забеге:</span>
            <span className="font-mono font-bold text-amber-300 text-base">
              +{Math.floor(creditsEarned).toLocaleString()} кр.
            </span>
          </div>

          {/* First Clear Bonus Section */}
          {isFirstClear && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-400/30 space-y-1.5">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span>🎁</span> НАГРАДА ЗА ПЕРВОЕ ПРОХОЖДЕНИЕ:
              </div>
              <div className="text-xs text-amber-200 font-medium">
                • Бонус +{sector.reward.credits} кредитов в банк
              </div>
              {sector.reward.skinName && (
                <div className="text-xs text-sky-300 font-semibold">
                  • Разблокирован скин корабля: «{sector.reward.skinName}»
                </div>
              )}
              {sector.reward.rocketSkinName && (
                <div className="text-xs text-purple-300 font-semibold">
                  • Разблокирован скин ракеты: «{sector.reward.rocketSkinName}»
                </div>
              )}
              {nextSectorName && (
                <div className="text-xs text-emerald-400 font-bold pt-1 border-t border-amber-500/20">
                  🔓 Открыт доступ к следующему сектору: {nextSectorName}!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={onClaimAndExit}
            className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-sm tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(251,191,36,0.35)]"
          >
            🏆 Забрать награды и в Меню
          </button>

          <button
            onClick={onContinueEndless}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-bold text-xs tracking-wider transition-colors border border-slate-700"
          >
            ♾️ Продолжить в Бесконечном режиме (Endless)
          </button>
        </div>
      </div>
    </div>
  );
}
