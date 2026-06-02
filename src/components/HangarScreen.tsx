/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Skin, RocketSkin } from '../types';

interface HangarScreenProps {
  bankCredits: number;
  selectedSkin: string;
  selectedRocketSkin: string;
  skins: Skin[];
  rocketSkins: RocketSkin[];
  onSelectSkin: (id: string) => void;
  onSelectRocketSkin: (id: string) => void;
  onUnlockSkin: (id: string, passwordAttempt?: string) => boolean; // returns success
  onUnlockRocketSkin: (id: string) => boolean; // returns success
  onClose: () => void;
}

export default function HangarScreen({
  bankCredits,
  selectedSkin,
  selectedRocketSkin,
  skins,
  rocketSkins,
  onSelectSkin,
  onSelectRocketSkin,
  onUnlockSkin,
  onUnlockRocketSkin,
  onClose,
}: HangarScreenProps) {
  const [activeTab, setActiveTab] = useState<'ships' | 'rockets'>('ships');
  const [passwordModal, setPasswordModal] = useState<{ skinId: string; name: string; price: number } | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorText, setErrorText] = useState('');

  const handleSkinClick = (s: Skin) => {
    if (s.owned) {
      onSelectSkin(s.id);
    } else {
      if (s.password) {
        setPasswordModal({ skinId: s.id, name: s.name, price: s.price });
        setPasswordInput('');
        setErrorText('');
      } else {
        // Simple direct buy with credits
        if (bankCredits >= s.price) {
          onUnlockSkin(s.id);
        } else {
          alert('Недостаточно кредитов!');
        }
      }
    }
  };

  const handleRocketClick = (r: RocketSkin) => {
    if (r.owned) {
      onSelectRocketSkin(r.id);
    } else {
      if (bankCredits >= r.price) {
        onUnlockRocketSkin(r.id);
      } else {
        alert('Недостаточно кредитов!');
      }
    }
  };

  const submitPassword = () => {
    if (!passwordModal) return;
    const success = onUnlockSkin(passwordModal.skinId, passwordInput);
    if (success) {
      setPasswordModal(null);
    } else {
      setErrorText('Неверный код доступа!');
    }
  };

  const submitDirectBuy = () => {
    if (!passwordModal) return;
    if (bankCredits >= passwordModal.price) {
      onUnlockSkin(passwordModal.skinId, '_BUY_WITH_CREDITS_');
      setPasswordModal(null);
    } else {
      setErrorText('Недостаточно кредитов для покупки!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden bento-glow-indigo">
        {/* Hangar Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-4">
          <div>
            <h2 className="text-2xl font-black tracking-widest text-zinc-100 font-sans">АНГАР ИСКАТЕЛЯ</h2>
            <p className="text-xs text-zinc-400 mt-1 font-mono">ТВОЙ БАЛАНС: <span className="text-yellow-400 font-bold">{bankCredits} кр.</span></p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 border border-zinc-750 bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-550 text-zinc-300 rounded-xl transition duration-150 flex items-center justify-center font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 p-1 bg-zinc-950 border border-zinc-850 rounded-xl mb-4">
          <button
            onClick={() => setActiveTab('ships')}
            className={`flex-1 py-2.5 text-xs tracking-wider font-extrabold text-center uppercase rounded-lg transition-all cursor-pointer font-mono ${
              activeTab === 'ships'
                ? 'bg-indigo-950/30 border border-indigo-500/40 text-indigo-450'
                : 'bg-transparent text-zinc-500 border border-transparent hover:text-zinc-200'
            }`}
          >
            🚀 Корабли
          </button>
          <button
            onClick={() => setActiveTab('rockets')}
            className={`flex-1 py-1.5 text-xs tracking-wider font-extrabold text-center uppercase rounded-lg transition-all cursor-pointer font-mono ${
              activeTab === 'rockets'
                ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-400'
                : 'bg-transparent text-zinc-500 border border-transparent hover:text-zinc-200'
            }`}
          >
            🚀 Скины Ракет
          </button>
        </div>

        {/* Content Lists */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'ships' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {skins.map(s => {
                const bgGrad = s.gradient
                  ? `linear-gradient(135deg, ${s.gradient.join(',')})`
                  : s.col;
                const isSelected = selectedSkin === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSkinClick(s)}
                    className={`p-4 rounded-xl border transition-all text-center flex flex-col justify-between cursor-pointer group ${
                      isSelected
                        ? 'bg-zinc-950 border-indigo-500 bento-glow-indigo'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-indigo-500/20'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-10 h-10 rounded-full shadow-lg group-hover:scale-110 transition duration-150"
                        style={{ background: bgGrad, boxShadow: `0 0 10px ${s.col}80` }}
                      />
                      <h4 className="font-bold text-sm text-zinc-100 mt-2">{s.name}</h4>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5 font-mono">Класс корпуса</p>
                    </div>
                    <div className="mt-4">
                      {s.owned ? (
                        <div className={`text-xs font-bold py-1.5 rounded-lg font-mono ${
                          isSelected ? 'text-indigo-400 font-black' : 'text-zinc-500 hover:text-zinc-300'
                        }`}>
                          {isSelected ? '✓ АКТИВИРОВАН' : 'ВЫБРАТЬ'}
                        </div>
                      ) : (
                        <div className="text-[11px] font-black bg-zinc-800 text-zinc-300 py-1.5 rounded-lg border border-zinc-700 font-mono">
                          {s.password ? '🔑 КОД / ' : ''}{s.price} КР.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {rocketSkins.map(r => {
                const isSelected = selectedRocketSkin === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleRocketClick(r)}
                    className={`p-4 rounded-xl border transition-all text-center flex flex-col justify-between cursor-pointer group ${
                      isSelected
                        ? 'bg-zinc-950 border-emerald-500 bento-glow-emerald'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-emerald-500/20'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-xl group-hover:scale-110 transition duration-150 border-2 border-zinc-800"
                        style={{
                          backgroundColor: r.col + '20',
                          borderColor: r.col,
                          color: r.col,
                          boxShadow: `0 0 8px ${r.col}40`
                        }}
                      >
                        ▲
                      </div>
                      <h4 className="font-bold text-sm text-zinc-100 mt-2">{r.name}</h4>
                      <p className="text-[10px] text-zinc-400 mt-1 px-1 line-clamp-2 leading-tight font-sans">{r.desc}</p>
                    </div>
                    <div className="mt-4">
                      {r.owned ? (
                        <div className={`text-xs font-bold py-1.5 rounded-lg font-mono ${
                          isSelected ? 'text-emerald-450 font-black' : 'text-zinc-500 hover:text-zinc-300'
                        }`}>
                          {isSelected ? '✓ ЗАРЯЖЕН' : 'ВЫБРАТЬ'}
                        </div>
                      ) : (
                        <div className="text-[11px] font-black bg-zinc-800 text-zinc-300 py-1.5 rounded-lg border border-zinc-750 font-mono">
                          {r.price} КР.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lock Password Modal inside overlay */}
        {passwordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl bento-glow-indigo">
              <span className="text-4xl">🔐</span>
              <h3 className="text-lg font-black text-zinc-100 mt-2">МАНЕВРЫ {passwordModal.name}</h3>
              <p className="text-xs text-zinc-400 mt-1 mb-4 font-mono">Выкупите за <span className="text-yellow-400 font-extrabold">{passwordModal.price} кр.</span> или введите код:</p>

              <input
                type="text"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Код доступа..."
                className="w-full text-center py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 outline-none focus:border-indigo-500 mb-2 font-mono"
                onKeyDown={e => {
                  if (e.key === 'Enter') submitPassword();
                }}
              />

              {errorText && <p className="text-xs text-red-400 font-bold mb-2 font-mono">{errorText}</p>}

              <div className="flex flex-col gap-2">
                <button
                  onClick={submitDirectBuy}
                  className="w-full text-xs py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold rounded-lg cursor-pointer transition font-mono uppercase"
                >
                  Купить за {passwordModal.price} КР
                </button>
                <button
                  onClick={submitPassword}
                  className="w-full text-xs py-2 bg-indigo-600 hover:bg-indigo-550 text-white font-extrabold rounded-lg cursor-pointer transition font-mono uppercase"
                >
                  Ввести код
                </button>
              </div>
              <button
                onClick={() => setPasswordModal(null)}
                className="w-full mt-2 text-xs py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 rounded-lg cursor-pointer transition font-mono uppercase"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
