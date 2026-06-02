/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, Enemy } from '../types';

const rnd = (a: number, b: number) => Math.random() * (b - a) + a;

export function spawnEnemy(G: GameState, canvas: { width: number; height: number }, spd: (v: number) => number) {
  const side = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;
  if (side === 0) {
    x = rnd(0, canvas.width);
    y = -50;
  } else if (side === 1) {
    x = canvas.width + 50;
    y = rnd(0, canvas.height);
  } else if (side === 2) {
    x = rnd(0, canvas.width);
    y = canvas.height + 50;
  } else {
    x = -50;
    y = rnd(0, canvas.height);
  }
  const wv = G.wave;

  const t = Math.random();
  if (t < 0.45) {
    // Grunt — tiny, fast, 1 green XP gem
    G.enemies.push({
      x,
      y,
      type: 'grunt',
      hp: 4 + wv * 1.8,
      maxHp: 4 + wv * 1.8,
      r: spd(10),
      spd: spd(1.0 + wv * 0.06),
      dmg: 7,
      score: 8 + wv,
      col: '#ff6b6b',
      xpTier: 0,
      creditChance: 0.08,
      frozen: 0,
      poison: 0,
      poisonTimer: 0,
      angle: 0
    });
  } else if (t < 0.65) {
    // Brute — slow tank, 1 blue XP gem (worth more)
    const hp = wv < 3 ? 12 : 18 + wv * 3.5;
    G.enemies.push({
      x,
      y,
      type: 'brute',
      hp,
      maxHp: hp,
      r: spd(19),
      spd: spd(0.5 + wv * 0.025),
      dmg: 13,
      score: 22 + wv * 2,
      col: '#ff9a2e',
      xpTier: 1,
      creditChance: 0.2,
      frozen: 0,
      poison: 0,
      poisonTimer: 0,
      angle: 0
    });
  } else if (t < 0.78) {
    // Splitter — splits into 2 smaller enemies on death (wave 2+)
    if (wv < 2) {
      G.enemies.push({
        x,
        y,
        type: 'grunt',
        hp: 4 + wv * 1.8,
        maxHp: 4 + wv * 1.8,
        r: spd(10),
        spd: spd(1.0 + wv * 0.06),
        dmg: 7,
        score: 8 + wv,
        col: '#ff6b6b',
        xpTier: 0,
        creditChance: 0.08,
        frozen: 0,
        poison: 0,
        poisonTimer: 0,
        angle: 0
      });
    } else {
      G.enemies.push({
        x,
        y,
        type: 'splitter',
        hp: 8 + wv * 2,
        maxHp: 8 + wv * 2,
        r: spd(14),
        spd: spd(0.7 + wv * 0.04),
        dmg: 10,
        score: 15 + wv * 2,
        col: '#22d3ee',
        xpTier: 0,
        creditChance: 0.15,
        frozen: 0,
        poison: 0,
        poisonTimer: 0,
        angle: 0,
        hasSplit: false,
        hopTimer: 0
      });
    }
  } else if (t < 0.92) {
    // Dasher — zigzag mover
    G.enemies.push({
      x,
      y,
      type: 'dasher',
      hp: 3 + wv,
      maxHp: 3 + wv,
      r: spd(9),
      spd: 0,
      baseDashSpd: spd(1.8 + wv * 0.08),
      dmg: 6,
      score: 10 + wv,
      col: '#ff4e8a',
      xpTier: 0,
      creditChance: 0.05,
      frozen: 0,
      poison: 0,
      poisonTimer: 0,
      dashTimer: 0,
      dashAngle: G.player ? Math.atan2(G.player.y - y, G.player.x - x) : 0,
      angle: 0
    });
  } else {
    // Shooter — stops and fires projectiles (wave 4+)
    if (wv < 4) {
      G.enemies.push({
        x,
        y,
        type: 'grunt',
        hp: 4 + wv * 1.8,
        maxHp: 4 + wv * 1.8,
        r: spd(10),
        spd: spd(1.1 + wv * 0.07),
        dmg: 7,
        score: 8 + wv,
        col: '#ff6b6b',
        xpTier: 0,
        creditChance: 0.08,
        frozen: 0,
        poison: 0,
        poisonTimer: 0,
        angle: 0
      });
    } else {
      G.enemies.push({
        x,
        y,
        type: 'shooter',
        hp: 12 + wv * 2,
        maxHp: 12 + wv * 2,
        r: spd(14),
        spd: spd(0.6 + wv * 0.025),
        dmg: 10,
        score: 18 + wv * 2,
        col: '#c084fc',
        xpTier: 1,
        creditChance: 0.25,
        frozen: 0,
        poison: 0,
        poisonTimer: 0,
        shootCd: 0,
        angle: 0
      });
    }
  }
}

export function spawnMiniBoss(G: GameState, x: number, y: number, wv: number, spd: (v: number) => number) {
  const types = ['charger', 'spinner'];
  const t = types[Math.floor(Math.random() * types.length)];
  if (t === 'charger') {
    G.enemies.push({
      x,
      y,
      type: 'charger',
      hp: 60 + wv * 15,
      maxHp: 60 + wv * 15,
      r: spd(22),
      spd: 0,
      dmg: 20,
      score: 80 + wv * 8,
      col: '#fb923c',
      xpTier: 2,
      creditChance: 1,
      frozen: 0,
      poison: 0,
      poisonTimer: 0,
      chargeTimer: 0,
      chargePhase: 'wait',
      chargeVx: 0,
      chargeVy: 0,
      angle: 0,
      miniboss: true
    });
  } else {
    G.enemies.push({
      x,
      y,
      type: 'spinner',
      hp: 50 + wv * 12,
      maxHp: 50 + wv * 12,
      r: spd(20),
      spd: spd(0.45 + wv * 0.025),
      dmg: 15,
      score: 70 + wv * 7,
      col: '#a78bfa',
      xpTier: 2,
      creditChance: 1,
      frozen: 0,
      poison: 0,
      poisonTimer: 0,
      spinAngle: 0,
      shootCd: 0,
      angle: 0,
      miniboss: true
    });
  }
}

export function spawnBoss(G: GameState, x: number, y: number, wv: number, spd: (v: number) => number) {
  const types = ['titan', 'hydra', 'ghost', 'vortex', 'necro'];
  const t = types[Math.floor(wv / 5) % 5];
  if (t === 'titan') {
    G.enemies.push({
      x,
      y,
      type: 'titan',
      hp: 200 + wv * 30,
      maxHp: 200 + wv * 30,
      r: spd(38),
      spd: spd(0.4 + wv * 0.018),
      dmg: 25,
      score: 300 + wv * 20,
      col: '#ef4444',
      xpTier: 3,
      creditChance: 1,
      frozen: 0,
      poison: 0,
      poisonTimer: 0,
      shootCd: 0,
      angle: 0,
      boss: true
    });
  } else if (t === 'hydra') {
    G.enemies.push({
      x,
      y,
      type: 'hydra',
      hp: 180 + wv * 25,
      maxHp: 180 + wv * 25,
      r: spd(34),
      spd: spd(0.32 + wv * 0.016),
      dmg: 20,
      score: 280 + wv * 20,
      col: '#10b981',
      xpTier: 3,
      creditChance: 1,
      frozen: 0,
      poison: 0,
      poisonTimer: 0,
      shootCd: 0,
      angle: 0,
      splitDone: false,
      boss: true
    });
  } else if (t === 'ghost') {
    G.enemies.push({
      x,
      y,
      type: 'ghost',
      hp: 160 + wv * 20,
      maxHp: 160 + wv * 20,
      r: spd(30),
      spd: spd(1.0 + wv * 0.03),
      dmg: 18,
      score: 250 + wv * 20,
      col: '#67e8f9',
      xpTier: 3,
      creditChance: 1,
      frozen: 0,
      poison: 0,
      poisonTimer: 0,
      alpha: 1,
      phaseTimer: 0,
      angle: 0,
      boss: true
    });
  } else if (t === 'vortex') {
    G.enemies.push({
      x,
      y,
      type: 'vortex',
      hp: 220 + wv * 28,
      maxHp: 220 + wv * 28,
      r: spd(36),
      spd: spd(0.28 + wv * 0.012),
      dmg: 22,
      score: 320 + wv * 22,
      col: '#a855f7',
      xpTier: 3,
      creditChance: 1,
      frozen: 0,
      poison: 0,
      poisonTimer: 0,
      shootCd: 0,
      angle: 0,
      spinAngle: 0,
      boss: true
    });
  } else {
    G.enemies.push({
      x,
      y,
      type: 'necro',
      hp: 240 + wv * 35,
      maxHp: 240 + wv * 35,
      r: spd(32),
      spd: spd(0.22 + wv * 0.01),
      dmg: 15,
      score: 350 + wv * 25,
      col: '#f9a8d4',
      xpTier: 3,
      creditChance: 1,
      frozen: 0,
      poison: 0,
      poisonTimer: 0,
      shootCd: 0,
      angle: 0,
      summonCd: 0,
      boss: true
    });
  }
}
