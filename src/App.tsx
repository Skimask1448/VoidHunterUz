/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameState, Player, Upgrade, RunHistoryItem, Skin, RocketSkin } from './types';
import GameCanvas from './components/GameCanvas';
import HangarScreen from './components/HangarScreen';
import SecondaryScreens from './components/SecondaryScreens';
import { pickUpgrades, spd } from './utils/upgrades';
import { Sound } from './utils/sound';

export default function App() {
  // Global Metagame states loaded from localStorage
  const [bankCredits, setBankCredits] = useState<number>(0);
  const [selectedSkin, setSelectedSkin] = useState<string>('classic');
  const [selectedRocketSkin, setSelectedRocketSkin] = useState<string>('classic');
  const [bestWave, setBestWave] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);
  const [unlockedSynergies, setUnlockedSynergies] = useState<string[]>([]);
  
  // Audio state
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Ship Skins lists
  const [skins, setSkins] = useState<Skin[]>([
    { id: 'classic', name: 'Azure Core', col: '#2ed8ff', price: 0, owned: true },
    { id: 'crimson', name: 'Crimson Fury', col: '#ff4e6a', price: 120, owned: false },
    { id: 'green', name: 'Venom Stinger', col: '#39ff8a', price: 150, owned: false },
    { id: 'gold', name: 'Gold Emperor', col: '#ffd166', price: 200, owned: false },
    { id: 'purple', name: 'Void Phantom', col: '#b06aff', price: 300, owned: false },
    { id: 'paradise', name: 'Paradise Cruiser', col: '#0ea5e9', price: 500, owned: false, password: 'ayen', gradient: ['#0ea5e9', '#38bdf8', '#e0f2fe'] },
    { id: 'korean', name: 'Korean Phoenix', col: '#ff3b5c', price: 700, owned: false, password: 'lilkeed', gradient: ['#ff3b5c', '#ffffff', '#0066ff'] },
  ]);

  // Customizable Rocket Skins lists! Directly answering: "создай текстуры для ракеты и скины на них. замени уже существующие"
  const [rocketSkins, setRocketSkins] = useState<RocketSkin[]>([
    { id: 'classic', name: 'Azure Sting', col: '#38bdf8', price: 0, owned: true, desc: 'Классическая ионная ракета с приятным шлейфом энергии' },
    { id: 'crimson', name: 'Crimson Fury', col: '#f43f5e', price: 80, owned: false, desc: 'Трёхугольная фугасная ракета, извергающая алые искры' },
    { id: 'green', name: 'Venom Spore', col: '#34d399', price: 110, owned: false, desc: 'Органический снаряд с разъедающим ядовитым выбросом' },
    { id: 'gold', name: 'Gold Torpedo', col: '#fbbf24', price: 160, owned: false, desc: 'Золотая элитная торпеда драгоценного сияния' },
    { id: 'purple', name: 'Void Comet', col: '#a78bfa', price: 200, owned: false, desc: 'Темпоральный заряд, затягивающий шлейф тёмной энергии' },
    { id: 'paradise', name: 'Paradise Pulse', col: '#ffffff', price: 300, owned: false, desc: 'Целестиальная стрела с мягким плазменным кольцом сопла' },
    { id: 'korean', name: 'Korean Phoenix', col: '#ff3b5c', price: 400, owned: false, desc: 'Красно-синяя ракета Феникса с двойной огненной тягой' },
  ]);

  // Overall controller active screen layout state
  const [activeScreen, setActiveScreen] = useState<'menu' | 'playing' | 'upgrade' | 'pause' | 'stats' | 'leaderboard' | 'history' | 'codex' | 'hangar'>('menu');
  
  // Game session parameters
  const [endPayload, setEndPayload] = useState<{
    score: number;
    wave: number;
    level: number;
    credits: number;
    tags: string[];
    damage: number;
    dps: number;
  } | null>(null);

  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [currentUpgrades, setCurrentUpgrades] = useState<Upgrade[]>([]);
  const [rerolls, setRerolls] = useState<number>(3);
  const [gameTick, setGameTick] = useState<number>(0);

  // Load persistence State on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('void_hunter_state');
      if (raw) {
        const meta = JSON.parse(raw);
        if (meta.bankCredits !== undefined) setBankCredits(meta.bankCredits);
        if (meta.selectedSkin) setSelectedSkin(meta.selectedSkin);
        if (meta.selectedRocketSkin) setSelectedRocketSkin(meta.selectedRocketSkin);
        if (meta.bestWave) setBestWave(meta.bestWave);
        if (meta.bestScore) setBestScore(meta.bestScore);
        if (meta.runHistory) setRunHistory(meta.runHistory);
        if (meta.unlockedSynergies) setUnlockedSynergies(meta.unlockedSynergies);

        // Sync owned skins list
        if (meta.skins) {
          setSkins(prev =>
            prev.map(s => {
              const saved = meta.skins.find((item: any) => item.id === s.id);
              if (saved) return { ...s, owned: saved.owned };
              return s;
            })
          );
        }

        // Sync owned rocket skins list
        if (meta.rocketSkins) {
          setRocketSkins(prev =>
            prev.map(r => {
              const saved = meta.rocketSkins.find((item: any) => item.id === r.id);
              if (saved) return { ...r, owned: saved.owned };
              return r;
            })
          );
        }
      }
    } catch (e) {
      console.error('Failed to load local game metadata: ', e);
    }
  }, []);

  // Save persistence on modification
  const saveState = (
    credits: number,
    skin: string,
    rocketSkin: string,
    wave: number,
    score: number,
    historyList: RunHistoryItem[],
    synergyList: string[],
    skinsList: Skin[],
    rocketList: RocketSkin[]
  ) => {
    try {
      const payload = {
        bankCredits: credits,
        selectedSkin: skin,
        selectedRocketSkin: rocketSkin,
        bestWave: wave,
        bestScore: score,
        runHistory: historyList,
        unlockedSynergies: synergyList,
        skins: skinsList.map(s => ({ id: s.id, owned: s.owned })),
        rocketSkins: rocketList.map(r => ({ id: r.id, owned: r.owned })),
      };
      localStorage.setItem('void_hunter_state', JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save metagame state: ', e);
    }
  };

  const handleMuteToggle = () => {
    const nextVal = !isMuted;
    setIsMuted(nextVal);
    Sound.muted = nextVal;
  };

  const handleStartRun = () => {
    setGameTick(p => p + 1);
    setActiveScreen('playing');
    Sound.resume();
  };

  // Upgrades mechanics
  const handleLevelUp = (level: number, player: Player) => {
    setActivePlayer(player);
    setCurrentLevel(level);
    
    // Pick 3 candidate upgrade cards
    const picked = pickUpgrades(player);
    setCurrentUpgrades(picked);
    setRerolls(level % 5 === 0 ? rerolls + 1 : rerolls); // extra reroll each 5 levels
    setActiveScreen('upgrade');
  };

  const handleSelectUpgrade = (upg: Upgrade) => {
    if (!activePlayer) return;

    upg.apply(activePlayer);
    
    if (activePlayer.maxShield && activePlayer.shield < 1) {
      activePlayer.shield = 1;
    }

    // Capture newly unlocked synergies
    if (upg.synergy && !unlockedSynergies.includes(upg.id)) {
      const updatedSynergies = [...unlockedSynergies, upg.id];
      setUnlockedSynergies(updatedSynergies);
      saveState(
        bankCredits,
        selectedSkin,
        selectedRocketSkin,
        bestWave,
        bestScore,
        runHistory,
        updatedSynergies,
        skins,
        rocketSkins
      );
      Sound.play('synergy');
    } else {
      Sound.play('upgrade');
    }

    setActiveScreen('playing');
  };

  const handleReroll = () => {
    if (rerolls > 0 && activePlayer) {
      setRerolls(p => p - 1);
      const picked = pickUpgrades(activePlayer);
      setCurrentUpgrades(picked);
    }
  };

  const handleEndRun = (
    score: number,
    wave: number,
    level: number,
    credits: number,
    tags: string[],
    damage: number,
    dps: number
  ) => {
    const updatedCredits = bankCredits + credits;
    const updatedWave = Math.max(bestWave, wave);
    const updatedScore = Math.max(bestScore, score);

    const historyRecord: RunHistoryItem = {
      date: new Date().toISOString(),
      score,
      wave,
      level,
      credits,
      skin: selectedSkin,
      rocketSkin: selectedRocketSkin,
      upgrades: tags,
    };
    const updatedHistory = [historyRecord, ...runHistory].slice(0, 10);

    setBankCredits(updatedCredits);
    setBestWave(updatedWave);
    setBestScore(updatedScore);
    setRunHistory(updatedHistory);
    setEndPayload({ score, wave, level, credits, tags, damage, dps });

    saveState(
      updatedCredits,
      selectedSkin,
      selectedRocketSkin,
      updatedWave,
      updatedScore,
      updatedHistory,
      unlockedSynergies,
      skins,
      rocketSkins
    );
  };

  // Select ship skin
  const handleSelectSkin = (id: string) => {
    setSelectedSkin(id);
    saveState(
      bankCredits,
      id,
      selectedRocketSkin,
      bestWave,
      bestScore,
      runHistory,
      unlockedSynergies,
      skins,
      rocketSkins
    );
  };

  // Select rocket skin launcher configuration
  const handleSelectRocketSkin = (id: string) => {
    setSelectedRocketSkin(id);
    saveState(
      bankCredits,
      selectedSkin,
      id,
      bestWave,
      bestScore,
      runHistory,
      unlockedSynergies,
      skins,
      rocketSkins
    );
  };

  // Buy or input code for ship skins
  const handleUnlockSkin = (id: string, passwordAttempt?: string) => {
    const index = skins.findIndex(s => s.id === id);
    if (index === -1) return false;

    const s = skins[index];
    
    // Unlock using purchase or password verification
    if (passwordAttempt === '_BUY_WITH_CREDITS_') {
      if (bankCredits >= s.price) {
        const nextCredits = bankCredits - s.price;
        setBankCredits(nextCredits);
        const nextSkins = [...skins];
        nextSkins[index].owned = true;
        setSkins(nextSkins);
        setSelectedSkin(id);
        saveState(
          nextCredits,
          id,
          selectedRocketSkin,
          bestWave,
          bestScore,
          runHistory,
          unlockedSynergies,
          nextSkins,
          rocketSkins
        );
        Sound.play('synergy');
        return true;
      }
    } else if (s.password && s.password === passwordAttempt) {
      const nextSkins = [...skins];
      nextSkins[index].owned = true;
      setSkins(nextSkins);
      setSelectedSkin(id);
      saveState(
        bankCredits,
        id,
        selectedRocketSkin,
        bestWave,
        bestScore,
        runHistory,
        unlockedSynergies,
        nextSkins,
        rocketSkins
      );
      Sound.play('synergy');
      return true;
    } else if (!s.password && bankCredits >= s.price) {
      const nextCredits = bankCredits - s.price;
      setBankCredits(nextCredits);
      const nextSkins = [...skins];
      nextSkins[index].owned = true;
      setSkins(nextSkins);
      setSelectedSkin(id);
      saveState(
        nextCredits,
        id,
        selectedRocketSkin,
        bestWave,
        bestScore,
        runHistory,
        unlockedSynergies,
        nextSkins,
        rocketSkins
      );
      Sound.play('synergy');
      return true;
    }
    return false;
  };

  // Buying rocket launcher skin configurations
  const handleUnlockRocketSkin = (id: string) => {
    const index = rocketSkins.findIndex(r => r.id === id);
    if (index === -1) return false;

    const r = rocketSkins[index];
    if (bankCredits >= r.price) {
      const nextCredits = bankCredits - r.price;
      setBankCredits(nextCredits);
      const nextRockets = [...rocketSkins];
      nextRockets[index].owned = true;
      setRocketSkins(nextRockets);
      setSelectedRocketSkin(id);
      saveState(
        nextCredits,
        selectedSkin,
        id,
        bestWave,
        bestScore,
        runHistory,
        unlockedSynergies,
        skins,
        nextRockets
      );
      Sound.play('synergy');
      return true;
    }
    return false;
  };

  return (
    <div className="w-full h-[100dvh] bg-[#040609] text-white relative font-sans select-none antialiased overflow-hidden">
      {/* Background Star loop wrapper behind everything */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30 select-none">
        <canvas className="absolute block w-full h-full" id="menuBackground" />
      </div>

      {/* Primary gameplay engine loop instance */}
      <div className="w-full h-full z-10 relative">
        <GameCanvas
          state={(activeScreen === 'playing' || activeScreen === 'upgrade' || activeScreen === 'pause') ? activeScreen : 'menu'}
          selectedSkin={selectedSkin}
          selectedRocketSkin={selectedRocketSkin}
          rerollTrigger={rerolls}
          onEndRun={handleEndRun}
          onLevelUp={handleLevelUp}
          onStateChange={(st) => {
            if (st === 'playing' || st === 'upgrade' || st === 'pause' || st === 'stats') {
              setActiveScreen(st);
            }
          }}
          gameTick={gameTick}
        />
      </div>

      {/* Overlay screens controllers */}

      {/* Main menu Screen overlay */}
      {activeScreen === 'menu' && (
        <div className="fixed inset-0 z-30 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-zinc-950/90 backdrop-blur-md select-none antialiased overflow-y-auto">
          <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl p-3 sm:p-6 md:p-8 shadow-2xl flex flex-col font-sans my-2 sm:my-auto">
            {/* Header Section */}
            <header className="flex justify-between items-center mb-4 sm:mb-6 border-b border-zinc-800 pb-3 sm:pb-4">
              <div>
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white font-sans">
                  VOID HUNTER <span className="text-zinc-500 font-mono text-xs sm:text-sm ml-2">v1.4.0</span>
                </h1>
                <p className="text-zinc-500 text-[8px] sm:text-[10px] uppercase tracking-widest mt-1 font-mono">
                  ОРУЖЕЙНАЯ БОЕГОЛОВКА СЕКТОРА
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3 items-center">
                <button
                  onClick={handleMuteToggle}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-extrabold border border-zinc-700 transition uppercase tracking-widest cursor-pointer font-mono"
                >
                  {isMuted ? '🔇' : '🔊'}
                </button>
              </div>
            </header>

            {/* Bento Grid Content */}
            <div className="grid grid-cols-12 gap-3 sm:gap-4 flex-grow">

              {/* Left Column: Active Hangar Details */}
              <div className="col-span-12 md:col-span-4 bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h2 className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-indigo-400 font-mono">ТЕКУЩЕЕ СНАРЯЖЕНИЕ</h2>
                    <span className="text-[8px] sm:text-[9px] bg-zinc-900 px-1.5 sm:px-2 py-0.5 rounded text-zinc-500 font-mono uppercase">АКТИВНО</span>
                  </div>

                  {/* Ship skin showcase */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg sm:rounded-xl p-2 sm:p-3 flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 hover:border-indigo-500/20 transition">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                      style={{
                        background: skins.find(s => s.id === selectedSkin)?.gradient
                          ? `linear-gradient(135deg, ${skins.find(s => s.id === selectedSkin)?.gradient?.join(',')})`
                          : skins.find(s => s.id === selectedSkin)?.col || '#38bdf8',
                        boxShadow: `0 0 10px ${(skins.find(s => s.id === selectedSkin)?.col || '#38bdf8')}80`
                      }}
                    />
                    <div>
                      <div className="text-[8px] sm:text-[9px] text-zinc-500 uppercase font-mono tracking-wider">КОРПУС</div>
                      <div className="text-xs sm:text-sm font-bold text-zinc-200">{skins.find(s => s.id === selectedSkin)?.name || 'Azure Core'}</div>
                    </div>
                  </div>

                  {/* Rocket skin showcase */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg sm:rounded-xl p-2 sm:p-3 flex items-center gap-2 sm:gap-3 hover:border-indigo-500/20 transition">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-black text-base sm:text-lg flex-shrink-0 border"
                      style={{
                        backgroundColor: (rocketSkins.find(r => r.id === selectedRocketSkin)?.col || '#a78bfa') + '20',
                        borderColor: rocketSkins.find(r => r.id === selectedRocketSkin)?.col || '#a78bfa',
                        color: rocketSkins.find(r => r.id === selectedRocketSkin)?.col || '#a78bfa',
                        boxShadow: `0 0 8px ${(rocketSkins.find(r => r.id === selectedRocketSkin)?.col || '#a78bfa')}40`
                      }}
                    >
                      ▲
                    </div>
                    <div>
                      <div className="text-[8px] sm:text-[9px] text-zinc-500 uppercase font-mono tracking-wider">БОЕГОЛОВКА</div>
                      <div className="text-xs sm:text-sm font-bold text-zinc-200">{rocketSkins.find(r => r.id === selectedRocketSkin)?.name || 'Azure Sting'}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveScreen('hangar')}
                  className="w-full mt-3 sm:mt-4 py-2 sm:py-2.5 bg-zinc-800 hover:bg-zinc-700 text-indigo-400 hover:text-indigo-300 border border-zinc-700 hover:border-zinc-600 rounded-lg sm:rounded-xl text-[9px] sm:text-xs uppercase font-extrabold tracking-wide sm:tracking-widest transition cursor-pointer font-mono"
                >
                  🔧 АНГАР
                </button>
              </div>

              {/* Middle: Mission Control Launch Console */}
              <div className="col-span-12 md:col-span-5 bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden bento-glow-indigo">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>

                <div className="relative text-center my-auto py-3 sm:py-4">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 animate-bounce">🚀</div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-wide uppercase">СВЕРХСВЕТОВОЙ ПРЫЖОК</h3>
                  <p className="text-[10px] sm:text-xs text-zinc-400 mt-2 max-w-[280px] mx-auto leading-relaxed">
                    Инициализация двигателей реактора для вылета в опасный роевой сектор с бесконечным наплывом противников.
                  </p>
                </div>

                <button
                  onClick={handleStartRun}
                  className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs sm:text-sm font-black uppercase tracking-widest rounded-lg sm:rounded-xl transition duration-250 cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.45)] border border-indigo-400/20"
                >
                  НАЧАТЬ ВЫЛЕТ!
                </button>
              </div>

              {/* Right: Metrics / stats dashboard */}
              <div className="col-span-12 md:col-span-3 flex flex-col gap-3 sm:gap-4">

                {/* Stats panel */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-400 font-mono mb-2 sm:mb-3">БОРТОВОЙ ЖУРНАЛ</h2>

                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-500 font-mono">ЛУЧШИЙ РЕКОРД</div>
                        <div className="text-xl sm:text-2xl font-black font-mono text-zinc-100 mt-0.5">{bestScore.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-500 font-mono">МАКСИМАЛЬНАЯ ВОЛНА</div>
                        <div className="text-xl sm:text-2xl font-black font-mono text-indigo-400 mt-0.5">{bestWave} <span className="text-xs font-normal text-zinc-650">волн</span></div>
                      </div>
                      <div>
                        <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-500 font-mono">СБЕРЕЖЕНИЯ</div>
                        <div className="text-base sm:text-lg font-black font-mono text-amber-400 mt-0.5">{bankCredits} кр.</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-zinc-900 flex justify-between gap-1">
                    <button
                      onClick={() => setActiveScreen('leaderboard')}
                      className="flex-1 py-1 px-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded transition cursor-pointer font-mono"
                    >
                      🏆
                    </button>
                    <button
                      onClick={() => setActiveScreen('codex')}
                      className="flex-1 py-1 px-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded transition cursor-pointer font-mono"
                    >
                      ⭐
                    </button>
                  </div>
                </div>

                {/* Auxiliary quick status */}
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between">
                  <div>
                    <div className="text-[8px] sm:text-[9px] font-bold text-indigo-300 uppercase tracking-widest font-mono">СИНЕРГИИ</div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">{unlockedSynergies.length} / 11</div>
                  </div>
                  <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2 relative overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full shadow-[0_0_8px_#6366f1] transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(10, (unlockedSynergies.length / 11) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Status Bar */}
            <footer className="hidden sm:flex justify-between items-center mt-4 sm:mt-6 text-[8px] sm:text-[9px] text-zinc-500 font-mono border-t border-zinc-800/60 pt-2 sm:pt-3">
              <div className="flex gap-2 sm:gap-4">
                <span>SYSTEM: STABLE</span>
                <span>CACHE: 98.4%</span>
                <span>SHADERS: COMPILED</span>
              </div>
              <div className="hidden sm:block text-zinc-550 font-mono">
                LAST COMPILED SYNC: {new Date().toISOString().slice(0, 10)} | ASSET_ID: void_99x
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Upgrade cards selection Overlay */}
      {activeScreen === 'upgrade' && (
        <div className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col bento-glow-indigo">
            <div className="text-center mb-6">
              <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 font-mono">
                НОВЫЙ УРОВЕНЬ ОРУЖИЯ
              </span>
              <h2 className="text-2xl font-black text-zinc-100 mt-4 tracking-wider">ВЫБЕРИ МОДИФИКАТОР</h2>
              <p className="text-xs text-zinc-400 mt-1 font-mono">ТЕКУЩИЙ УРОВЕНЬ: <span className="text-indigo-400 font-bold">{currentLevel}</span></p>
            </div>

            {/* List upgrade perks cards */}
            <div className="flex flex-col gap-3 max-h-[45vh] overflow-y-auto pr-1">
              {currentUpgrades.map(u => {
                const rarColor =
                  u.rar === 'Legendary'
                    ? 'text-yellow-400'
                    : u.rar === 'Epic'
                    ? 'text-purple-400'
                    : u.rar === 'Rare'
                    ? 'text-indigo-400'
                    : 'text-zinc-450';

                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUpgrade(u)}
                    className={`p-4 bg-zinc-950/50 border border-zinc-800/80 hover:border-indigo-500/30 rounded-xl transition duration-150 cursor-pointer text-left flex justify-between items-center group relative overflow-hidden ${
                      u.synergy ? 'border-yellow-500/40 bg-gradient-to-r from-yellow-500/5 to-indigo-500/5 shadow-[0_0_12px_rgba(251,191,36,0.03)]' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black tracking-widest uppercase font-mono ${rarColor}`}>
                          {u.rar}
                        </span>
                        {u.synergy && (
                          <span className="text-[10px] font-black tracking-widest uppercase text-yellow-300 bg-yellow-500/15 px-1.5 py-0.5 rounded font-mono">
                            ЛЕГЕНДАРНАЯ СИНЕРГИЯ
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-black text-zinc-100 mt-1 group-hover:text-indigo-400 transition">
                        {u.name}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-snug">{u.desc}</p>
                    </div>
                    <button className="ml-4 px-3.5 py-1.5 bg-zinc-800 group-hover:bg-indigo-500/20 text-zinc-300 group-hover:text-indigo-300 text-xs font-bold rounded-lg border border-zinc-700 group-hover:border-indigo-500/30 transition pointer-events-none font-mono">
                      ВЗЯТЬ
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Reroll trigger options */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-800/60">
              <span className="text-xs text-zinc-400 font-mono">РЕКОМПИЛИРОВАТЬ ДРЕВО</span>
              <button
                onClick={handleReroll}
                disabled={rerolls <= 0}
                className={`py-2 px-5 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 font-mono ${
                  rerolls > 0
                    ? 'bg-zinc-800 border border-zinc-750 hover:border-zinc-550 text-zinc-100 hover:bg-zinc-750'
                    : 'bg-transparent text-zinc-600 border border-zinc-850 cursor-not-allowed'
                }`}
              >
                🔄 РЕКОМПИЛЯЦИЯ ({rerolls})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paused options Selection */}
      {activeScreen === 'pause' && (
        <div className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl bento-glow-indigo">
            <span className="text-4xl">⏸</span>
            <h2 className="text-xl font-black text-zinc-100 mt-3 tracking-wider font-sans">НАУЧНАЯ ПАУЗА</h2>
            <p className="text-xs text-zinc-450 mt-1 font-mono uppercase">Орудия реактора деактивированы.</p>

            <div className="flex flex-col gap-2 w-full mt-5">
              <button
                onClick={() => setActiveScreen('playing')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer font-mono"
              >
                ПРОДОЛЖИТЬ ВЫЛЕТ
              </button>
              <button
                onClick={() => setActiveScreen('menu')}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition border border-zinc-700 cursor-pointer font-mono"
              >
                ВЫЙТИ В МЕНЮ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End game metrics board stats overlay */}
      {activeScreen === 'stats' && endPayload && (
        <div className="fixed inset-0 z-40 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 antialiased select-none">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center max-h-[92vh] overflow-y-auto bento-glow-indigo">
            <span className="text-3xl">💀</span>
            <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-2 bg-indigo-950/30 px-3 py-1 rounded-full border border-indigo-500/25 text-indigo-300 font-mono">
              НОВАЯ ЗАПИСЬ БОРТОВОГО КОМПЬЮТЕРА
            </div>
            <h2 className="text-2xl font-black tracking-wider text-zinc-100 mt-3 uppercase font-sans">Забег Завершен</h2>
            
            <div className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.25)] my-4 font-mono">
              {endPayload.score.toLocaleString()} ОЧКОВ
            </div>

            {/* Run score parameters columns */}
            <div className="grid grid-cols-3 gap-2 w-full my-3 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Уровень</div>
                <div className="text-base font-black text-indigo-400 font-mono">{endPayload.level}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Волна</div>
                <div className="text-base font-black text-purple-400 font-mono">{endPayload.wave}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Кредиты</div>
                <div className="text-base font-black text-yellow-400 font-mono">+{endPayload.credits}</div>
              </div>
            </div>

            {/* Damage metrics */}
            <div className="w-full py-2.5 px-3 bg-zinc-950/40 border border-zinc-800 rounded-xl text-center flex justify-between items-center text-sm">
              <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider font-mono">DAMAGE PER SECOND (DPS)</span>
              <span className="text-base font-extrabold text-indigo-400 font-mono">{endPayload.dps.toLocaleString()} DPS</span>
            </div>

            {/* Upgrades selected lists */}
            <div className="w-full mt-4 text-left">
              <div className="text-[10px] font-black text-zinc-400 tracking-wider mb-2 uppercase font-mono">АКТИВИРОВАННЫЕ МОДИФИКАЦИИ:</div>
              <div className="flex flex-wrap gap-1.5 max-h-[14vh] overflow-y-auto pr-1 pb-1">
                {endPayload.tags.length > 0 ? (
                  endPayload.tags.map((tg, i) => (
                    <span key={i} className="text-[10px] font-bold bg-zinc-950 text-zinc-300 border border-zinc-800 px-2 py-1 rounded font-mono">
                      🔧 {tg}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500">Нет установленных модификаторов</span>
                )}
              </div>
            </div>

            {/* End stats button grids */}
            <div className="flex flex-col gap-2 w-full mt-6">
              <button
                onClick={handleStartRun}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer font-mono"
              >
                🔄 ПОВТОРИТЬ ПРЫЖОК
              </button>
              <button
                onClick={() => setActiveScreen('menu')}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition border border-zinc-700 cursor-pointer font-mono"
              >
                🏠 ВЕРНУТЬСЯ В ГАВАНЬ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select skin or rocket selectors overlay */}
      {activeScreen === 'hangar' && (
        <HangarScreen
          bankCredits={bankCredits}
          selectedSkin={selectedSkin}
          selectedRocketSkin={selectedRocketSkin}
          skins={skins}
          rocketSkins={rocketSkins}
          onSelectSkin={handleSelectSkin}
          onSelectRocketSkin={handleSelectRocketSkin}
          onUnlockSkin={handleUnlockSkin}
          onUnlockRocketSkin={handleUnlockRocketSkin}
          onClose={() => setActiveScreen('menu')}
        />
      )}

      {/* Secondary Screens tabs triggers (History, Leaderboards, Codex) */}
      {(activeScreen === 'leaderboard' || activeScreen === 'history' || activeScreen === 'codex') && (
        <SecondaryScreens
          initialTab={activeScreen}
          bestWave={bestWave}
          bestScore={bestScore}
          runHistory={runHistory}
          unlockedSynergies={unlockedSynergies}
          skins={skins}
          onClose={() => setActiveScreen('menu')}
        />
      )}
    </div>
  );
}
