/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameState, Enemy, Bullet, EnemyBullet, Gem, Particle, LightningBolt, Player, Skin, RocketSkin } from '../types';
import { spawnEnemy, spawnMiniBoss, spawnBoss } from '../utils/enemies';
import { drawProceduralEnemy, drawProceduralRocket, drawProceduralPlayer } from '../utils/textures';
import { Sound } from '../utils/sound';
import { spd } from '../utils/upgrades';
import { SpatialHash } from '../utils/spatial-hash';

interface GameCanvasProps {
  state: 'playing' | 'upgrade' | 'pause' | 'menu';
  selectedSkin: string;
  selectedRocketSkin: string;
  rerollTrigger: number; // Increment to force upgrades re-pick (handled by App.tsx)
  onEndRun: (score: number, wave: number, level: number, credits: number, tags: string[], damage: number, dps: number) => void;
  onLevelUp: (level: number, player: Player) => void;
  onStateChange: (state: 'playing' | 'upgrade' | 'pause' | 'stats') => void;
  gameTick: number; // Handle state switches
}

export default function GameCanvas({
  state,
  selectedSkin,
  selectedRocketSkin,
  rerollTrigger,
  onEndRun,
  onLevelUp,
  onStateChange,
  gameTick,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game Loop States stored in Refs for 60fps non-blocking rendering
  const G = useRef<GameState>({
    state: 'menu',
    frame: 0,
    score: 0,
    wave: 1,
    waveFrame: 0,
    level: 1,
    xp: 0,
    xpNext: 22,
    runCredits: 0,
    rerolls: 3,
    lastUpgIds: [],
    stars: [],
    bullets: [],
    eBullets: [],
    enemies: [],
    gems: [],
    particles: [],
    lightningBolts: [],
    laserBeams: [],
    screenFlash: null,
    screenShake: 0,
    totalDamage: 0,
    runStartTime: 0,
    player: null,
    spawnCd: 60,
    deflectorCd: 0,
    deflectorAngle: 0,
    singularities: [],
  });

  const keys = useRef<{ [key: string]: boolean }>({});
  const spatialHash = useRef(new SpatialHash(80));

  // Touch controls
  const touchId = useRef<number | null>(null);
  const joyBase = useRef({ x: 0, y: 0 });
  const joyThumb = useRef({ x: 0, y: 0 });
  const joyActive = useRef(false);
  const joystickValue = useRef({ x: 0, y: 0 });

  // Screen metrics
  const [hudInfo, setHudInfo] = useState({
    score: 0,
    wave: 1,
    level: 1,
    credits: 0,
    hpPercent: 100,
    xpPercent: 0,
    laserPercent: 0,
    hasLaser: false,
  });

  // Calculate XP threshold
  const xpForLevel = (lv: number) => Math.floor(22 * Math.pow(1.18, lv - 1));

  // Reset core run state
  const resetRun = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    G.current = {
      state: 'playing',
      frame: 0,
      score: 0,
      wave: 1,
      waveFrame: 0,
      level: 1,
      xp: 0,
      xpNext: xpForLevel(1),
      runCredits: 0,
      rerolls: 3,
      lastUpgIds: [],
      stars: [],
      bullets: [],
      eBullets: [],
      enemies: [],
      gems: [],
      particles: [],
      lightningBolts: [],
      laserBeams: [],
      screenFlash: null,
      screenShake: 0,
      totalDamage: 0,
      runStartTime: Date.now(),
      spawnCd: 90,
      deflectorCd: 0,
      deflectorAngle: 0,
      singularities: [],
      player: {
        x: width / 2,
        y: height - 120,
        col: '#2ed8ff', // Overridden downstream
        hp: 100,
        maxHp: 100,
        moveSpeed: spd(2.6),
        bulletSpeed: spd(3.2),
        bulletSize: spd(3.0),
        shootRate: 18,
        shootCd: 0,
        damage: 1.4,
        pierce: 0,
        extraShots: 0,
        ricochet: 0,
        chain: 0,
        critChance: 0,
        critDmg: 1.8,
        pickupRange: spd(56),
        armor: 0,
        dodge: 0,
        lifesteal: 0,
        freeze: 0,
        poison: 0,
        poisonDmg: 0,
        aura: 0,
        auraStacks: 0,
        auraDmg: 0.1,
        drone: 0,
        droneCd: 0,
        orbital: 0,
        orbAngle: 0,
        maxShield: 0,
        shield: 0,
        shieldCd: 0,
        regenLv: 0,
        regenTimer: 0,
        xpGain: 1,
        creditGain: 1,
        adrenalineTimer: 0,
        facing: -Math.PI / 2,
        tags: new Set<string>(),
        trail: [],
        laserStacks: 0,
        laserCd: 180,
      },
    };
    
    // Set colors from ship skin
    if (G.current.player) {
      if (selectedSkin === 'classic') G.current.player.col = '#2ed8ff';
      else if (selectedSkin === 'crimson') G.current.player.col = '#ff4e6a';
      else if (selectedSkin === 'green') G.current.player.col = '#39ff8a';
      else if (selectedSkin === 'gold') G.current.player.col = '#ffd166';
      else if (selectedSkin === 'purple') G.current.player.col = '#b06aff';
      else if (selectedSkin === 'paradise') G.current.player.col = '#0ea5e9';
      else if (selectedSkin === 'korean') G.current.player.col = '#ff3b5c';
    }

    // Populate stars
    for (let i = 0; i < 120; i++) {
      G.current.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.3,
        s: Math.random() * 0.4 + 0.1,
        a: Math.random() * 0.7 + 0.2,
      });
    }

    onStateChange('playing');
  };

  // Run on start
  useEffect(() => {
    resetRun();
    
    // Set up Keyboard listens
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameTick]);

  // Sync state update hook
  useEffect(() => {
    if (G.current) {
      G.current.state = state;
    }
  }, [state]);

  const burstAt = (x: number, y: number, col: string, count = 18, power = 3.5) => {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * power + 1;
      G.current.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: Math.random() * 0.8 + 0.6,
        col,
        r: Math.random() * 3 + 1.5,
      });
    }
  };

  const addLightning = (x1: number, y1: number, x2: number, y2: number, col = '#7dd3fc', life = 12) => {
    G.current.lightningBolts.push({ x1, y1, x2, y2, col, life });
  };

  const damageArea = (cx: number, cy: number, radius: number, dmg: number, col = '#ffd166') => {
    let hits = 0;
    for (const e of G.current.enemies) {
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - cx, e.y - cy);
      if (d < radius) {
        const dealt = dmg * (1 - d / radius);
        e.hp -= dealt;
        G.current.totalDamage += dealt;
        hits++;
        if (hits < 6) burstAt(e.x, e.y, col, 3, 1.8);
      }
    }
    return hits;
  };

  const guardPulse = (cx: number, cy: number) => {
    G.current.screenFlash = { col: '#a0e8ff', life: 8 };
    G.current.screenShake = Math.max(G.current.screenShake, 8);
    burstAt(cx, cy, '#a0e8ff', 24, 4.5);
    const radius = spd(86);
    const p = G.current.player;
    if (!p) return;
    const dmg = p.damage * 2.2;
    for (const e of G.current.enemies) {
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - cx, e.y - cy);
      if (d < radius) {
        const dealt = dmg * (1 - d / radius);
        e.hp -= dealt;
        G.current.totalDamage += dealt;
        burstAt(e.x, e.y, '#a0e8ff', 3, 2);

        const angle = Math.atan2(e.y - cy, e.x - cx);
        const force = (1 - d / radius) * 35;
        e.x += Math.cos(angle) * force;
        e.y += Math.sin(angle) * force;
      }
    }
  };

  const executeFrostnova = (p: Player) => {
    Sound.play('synergy');
    G.current.screenFlash = { col: p.tags.has('nova_radiance') ? 'rgba(34, 211, 238, 0.45)' : 'rgba(56, 189, 248, 0.45)', life: 25 };
    G.current.screenShake = Math.max(G.current.screenShake, 14);
    
    // Dissipate all enemy projectiles
    for (const eb of G.current.eBullets) {
      eb.dead = true;
    }

    // Freeze active enemies on screen
    for (const e of G.current.enemies) {
      if (e.hp <= 0) continue;
      e.frozen = 180; // freeze for 3 seconds (180 frames)
      
      // Synergy: Светоносная Сверхновая (nova_radiance)
      if (p.tags.has('nova_radiance')) {
        const plasmaDmg = p.damage * 9.5;
        e.hp -= plasmaDmg;
        G.current.totalDamage += plasmaDmg;
        burstAt(e.x, e.y, '#f97316', 7, 2.8); // plasma fire sparks
      } else {
        burstAt(e.x, e.y, '#a5f3fc', 5, 1.8); // icy crystal sparks
      }
    }

    // Spectacular frozen shockwave expanding outward in a circular ring
    for (let angle = 0; angle < Math.PI * 2; angle += 0.15) {
      const sp = rnd(6.0, 9.0);
      G.current.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp,
        life: 0.8,
        col: p.tags.has('nova_radiance') ? '#22d3ee' : '#38bdf8',
        r: rnd(2.5, 4.5),
      });
    }
  };

  // Shooting mechanic launching customizable procedural rockets
  const executeShoot = () => {
    const p = G.current.player;
    if (!p) return;

    let target: Enemy | null = null;
    let minD = 1e9;
    for (const e of G.current.enemies) {
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < minD) {
        minD = d;
        target = e;
      }
    }

    const baseAng = target ? Math.atan2(target.y - p.y, target.x - p.x) : p.facing;

    const createRocket = (angleOffset = 0) => {
      const ang = baseAng + angleOffset;
      const critHit = Math.random() < p.critChance;
      const critMult = critHit ? p.critDmg : 1;
      
      const bColor = p.tags.has('ionlance') 
        ? '#c4b5fd' 
        : p.tags.has('cryotoxin') 
        ? '#34d399' 
        : p.tags.has('clusterstorm') 
        ? '#ffb020' 
        : p.col;

      const bullet: Bullet = {
        x: p.x,
        y: p.y,
        vx: Math.cos(ang) * p.bulletSpeed,
        vy: Math.sin(ang) * p.bulletSpeed,
        r: p.bulletSize,
        pierce: p.pierce,
        dmg: p.damage * critMult,
        col: bColor,
        ricochet: p.ricochet,
        chain: p.chain,
        homing: p.tags.has('homing'),
        explosive: p.tags.has('explosive'),
        clusterstorm: p.tags.has('clusterstorm'),
        ionlance: p.tags.has('ionlance'),
        critHit,
        skinId: selectedRocketSkin, // Current rocket skin assigned here!
        trail: [],
        smokeTimer: 0,
        angle: ang,
      };

      G.current.bullets.push(bullet);
    };

    if (p.tags.has('multishot')) {
      createRocket(-0.2);
      createRocket(0);
      createRocket(0.2);
    } else {
      createRocket(0);
      const shotsTotal = p.extraShots;
      for (let i = 1; i <= shotsTotal; i++) {
        setTimeout(() => {
          if (G.current.state === 'playing') {
            createRocket(Math.sin(i * 0.5) * 0.1);
          }
        }, i * 75);
      }
    }
  };

  const gainXp = (amount: number) => {
    const p = G.current.player;
    if (!p) return;
    G.current.xp += amount * p.xpGain;
    
    if (G.current.xp >= G.current.xpNext && G.current.state === 'playing') {
      G.current.xp -= G.current.xpNext;
      G.current.level++;
      G.current.xpNext = xpForLevel(G.current.level);
      
      if (G.current.level % 5 === 0) {
        G.current.rerolls++;
      }
      
      // Open card overlay screen in parent
      onLevelUp(G.current.level, p);
    }
  };

  const handleBossFrenzy = (e: Enemy) => {
    e.frenzy = true;
    e.spd *= 1.35;
    e.dmg *= 1.25;
    G.current.screenFlash = { col: '#ff2d55', life: 18 };
    burstAt(e.x, e.y, '#ff2d55', 30, 5);
  };

  // Full logic updates
  const updateGame = (width: number, height: number) => {
    const p = G.current.player;
    if (!p || G.current.state !== 'playing') return;

    G.current.frame++;

    // Star stream motion
    for (const s of G.current.stars) {
      s.y += s.s * 1.5;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // Capture speed coefficients and keyboard controls
    const jx = joystickValue.current.x;
    const jy = joystickValue.current.y;
    const kd = keys.current;

    let dx = Math.abs(jx) > 0.05 ? jx : (kd['d'] || kd['arrowright'] ? 1 : 0) - (kd['a'] || kd['arrowleft'] ? 1 : 0);
    let dy = Math.abs(jy) > 0.05 ? jy : (kd['s'] || kd['arrowdown'] ? 1 : 0) - (kd['w'] || kd['arrowup'] ? 1 : 0);
    const len = Math.hypot(dx, dy) || 1;
    if (Math.hypot(dx, dy) > 0) {
      dx /= len;
      dy /= len;
    }

    const adrenalineBonus = p.adrenalineTimer > 0 ? 1.3 : 1;
    p.x = Math.max(20, Math.min(width - 20, p.x + dx * p.moveSpeed * adrenalineBonus));
    p.y = Math.max(20, Math.min(height - 20, p.y + dy * p.moveSpeed * adrenalineBonus));

    // Smooth ship rotation
    if (Math.hypot(dx, dy) > 0.05) {
      const targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
      let da = targetAngle - p.facing;
      if (da > Math.PI) da -= Math.PI * 2;
      if (da < -Math.PI) da += Math.PI * 2;
      p.facing += da * 0.18;
    }

    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 15) p.trail.shift();

    // Secondary timers (Adrenaline, Blood Nova, Shield, Drones)
    if (p.adrenalineTimer > 0) p.adrenalineTimer--;
    
    if (p.tags.has('bloodnova') && p.hp < p.maxHp * 0.5) {
      p.bloodNovaCd = (p.bloodNovaCd || 0) - 1;
      if (p.bloodNovaCd <= 0) {
        p.bloodNovaCd = 75;
        const hits = damageArea(p.x, p.y, spd(96), p.damage * 2.4, '#ff4e6a');
        if (hits > 0) p.hp = Math.min(p.maxHp, p.hp + hits * (1.5 + p.lifesteal));
        burstAt(p.x, p.y, '#ff4e6a', 15, 3.5);
      }
    }

    if (p.tags.has('phaseblade') && p.adrenalineTimer > 0) {
      if (G.current.frame % 10 === 0) {
        damageArea(p.x, p.y, spd(54), p.damage * 1.35, '#c4b5fd');
      }
    }

    if (p.maxShield > 0 && p.shield < p.maxShield) {
      p.shieldCd++;
      const speedCap = p.tags.has('aegisreactor') ? 160 : 280;
      if (p.shieldCd >= speedCap) {
        p.shield++;
        p.shieldCd = 0;
      }
    }

    if (p.regenLv > 0) {
      p.regenTimer++;
      if (p.regenTimer >= 180 / p.regenLv) {
        p.regenTimer = 0;
        p.hp = Math.min(p.maxHp, p.hp + 3);
      }
    }

    // Shoots
    p.shootCd--;
    if (p.shootCd <= 0) {
      const berserkerMult = (p.tags.has('berserker') && p.hp < p.maxHp * 0.5) ? 1.22 : 1.0;
      executeShoot();
      p.shootCd = Math.floor(p.shootRate / berserkerMult);
    }

    // Global Wave Difficulty and enemy spawning
    G.current.spawnCd--;
    if (G.current.spawnCd <= 0 && G.current.enemies.length < 50) {
      const rate = Math.max(15, 85 - G.current.wave * 4);
      G.current.spawnCd = rate;
      const spCount = 1 + Math.floor(G.current.wave / 6);
      for (let i = 0; i < spCount; i++) {
        spawnEnemy(G.current, { width, height }, spd);
      }
    }

    // Laser mechanism and storm cores
    if (p.tags.has('laser')) {
      p.laserCd = (p.laserCd || 180) - 1;
      if (p.laserCd <= 0) {
        p.laserCd = 180;
        const scans = p.laserStacks || 1;
        Sound.play('laser');

        for (let i = 0; i < scans; i++) {
          let target: Enemy | null = null;
          let minD = 1e9;
          for (const e of G.current.enemies) {
            const d = Math.hypot(e.x - p.x, e.y - p.y);
            if (d < minD) { minD = d; target = e; }
          }

          const ang = target ? Math.atan2(target.y - p.y, target.x - p.x) : p.facing + (i - Math.floor(scans / 2)) * 0.25;

          // Hit linear targets
          for (const e of G.current.enemies) {
            if (e.hp <= 0) continue;
            const dx = e.x - p.x;
            const dy = e.y - p.y;
            const proj = dx * Math.cos(ang) + dy * Math.sin(ang);
            if (proj < 0) continue;
            const perp = Math.abs(dx * Math.sin(ang) - dy * Math.cos(ang));
            if (perp < e.r + 14) {
              const ldmg = p.damage * 7 * (Math.random() < p.critChance ? p.critDmg : 1);
              e.hp -= ldmg;
              G.current.totalDamage += ldmg;
              
              if (p.tags.has('stormcore')) {
                let sparks = 0;
                for (const e2 of G.current.enemies) {
                  if (e2 === e || e2.hp <= 0) continue;
                  if (Math.hypot(e2.x - e.x, e2.y - e.y) < 220) {
                    const sparkDmg = p.damage * 2.5;
                    e2.hp -= sparkDmg;
                    G.current.totalDamage += sparkDmg;
                    addLightning(e.x, e.y, e2.x, e2.y, '#7dd3fc', 12);
                    if (++sparks >= 2) break;
                  }
                }
              }
            }
          }

          G.current.laserBeams!.push({ x: p.x, y: p.y, ang, life: 12 });
        }
      }
    }

    // Orbital satellites
    if (p.orbital > 0) {
      p.orbAngle = (p.orbAngle || 0) + 0.08;
      const orbitRadius = p.tags.has('gravitywell') ? 48 : 35;
      const orbitDmg = p.damage * (p.tags.has('gravitywell') ? 0.85 : 0.5);

      for (let oi = 0; oi < p.orbital; oi++) {
        const oa = p.orbAngle + oi * (Math.PI * 2 / p.orbital);
        const ox = p.x + Math.cos(oa) * orbitRadius;
        const oy = p.y + Math.sin(oa) * orbitRadius;

        for (const e of G.current.enemies) {
          if (e.hp <= 0) continue;
          if (Math.hypot(ox - e.x, oy - e.y) < e.r + 8) {
            e.hp -= orbitDmg;
            G.current.totalDamage += orbitDmg;
            burstAt(ox, oy, p.col, 2, 1.5);
          }
        }
      }
    }

    // Orbital Deflector update logic
    if (p.tags.has('deflector')) {
      if (G.current.deflectorAngle === undefined) G.current.deflectorAngle = 0;
      if (G.current.deflectorCd === undefined) G.current.deflectorCd = 0;

      G.current.deflectorAngle += 0.055; // rotates around ship
      const defX = p.x + Math.cos(G.current.deflectorAngle) * 44;
      const defY = p.y + Math.sin(G.current.deflectorAngle) * 44;

      if (G.current.deflectorCd > 0) {
        G.current.deflectorCd--;
      } else {
        // 1. Try to block a projectile coming close to player (within 90px of player)
        let blockedBulletsCount = 0;
        for (const eb of G.current.eBullets) {
          if (!eb.dead) {
            const distToPlayer = Math.hypot(p.x - eb.x, p.y - eb.y);
            if (distToPlayer < 90) {
              eb.dead = true;
              blockedBulletsCount++;
            }
          }
        }

        if (blockedBulletsCount > 0) {
          G.current.deflectorCd = 240; // 4 second cool down
          Sound.play('shield');
          // Visual: lightning connect from deflector to the points
          addLightning(defX, defY, p.x, p.y, '#38bdf8', 15);
          burstAt(defX, defY, '#38bdf8', 12, 3.2);
          
          // Synergy: Энерго-Симбионт (energy_symbiont)
          if (p.tags.has('energy_symbiont')) {
            if (p.maxShield > 0) {
              p.shield = Math.min(p.maxShield, p.shield + 1);
            }
            if (p.orbital < 3) p.orbital += 1;
            G.current.screenShake = Math.max(G.current.screenShake, 6);
          }
        } else {
          // 2. If no bullet was blocked, discharge electrical arc inside a 165px range
          let closestEnemy: Enemy | null = null;
          let bestD = 165;
          for (const e of G.current.enemies) {
            if (e.hp <= 0) continue;
            const d = Math.hypot(p.x - e.x, p.y - e.y);
            if (d < bestD) {
              bestD = d;
              closestEnemy = e;
            }
          }

          if (closestEnemy) {
            G.current.deflectorCd = 240; // 4 sec cool down
            let dmg = p.damage * 3.5;
            
            // Synergy: Энерго-Симбионт (energy_symbiont)
            let bounceTargetCount = 0;
            if (p.tags.has('energy_symbiont')) {
              dmg *= 1.8;
              bounceTargetCount = 2; // electricity arcs to 2 target enemies
            }

            closestEnemy.hp -= dmg;
            G.current.totalDamage += dmg;
            addLightning(defX, defY, closestEnemy.x, closestEnemy.y, '#38bdf8', 14);
            burstAt(closestEnemy.x, closestEnemy.y, '#38bdf8', 8, 2.5);

            // bounce to another enemy option
            if (bounceTargetCount > 0) {
              let prev = closestEnemy;
              for (const e2 of G.current.enemies) {
                if (e2.hp <= 0 || e2 === closestEnemy) continue;
                const d2 = Math.hypot(prev.x - e2.x, prev.y - e2.y);
                if (d2 < 120) {
                  e2.hp -= dmg * 0.7;
                  G.current.totalDamage += dmg * 0.7;
                  addLightning(prev.x, prev.y, e2.x, e2.y, '#38bdf8', 12);
                  burstAt(e2.x, e2.y, '#38bdf8', 6, 2.2);
                  bounceTargetCount--;
                  prev = e2;
                  if (bounceTargetCount <= 0) break;
                }
              }
            }
          }
        }
      }
    }

    // Singularities mechanics
    if (G.current.singularities && G.current.singularities.length > 0) {
      for (const sing of G.current.singularities) {
        sing.life--;
        // pull active enemies and credit chips (gems of type 'credit')
        for (const e of G.current.enemies) {
          if (e.hp <= 0) continue;
          const dist = Math.hypot(sing.x - e.x, sing.y - e.y);
          if (dist < sing.r + 80) { // pull range
            const pullForce = (1 - dist / (sing.r + 80)) * 2.8;
            const pullAng = Math.atan2(sing.y - e.y, sing.x - e.x);
            e.x += Math.cos(pullAng) * pullForce;
            e.y += Math.sin(pullAng) * pullForce;
            
            // deal periodic damage to pulled enemies
            const perDmg = p.damage * 0.15;
            e.hp -= perDmg;
            G.current.totalDamage += perDmg;
          }
        }
        
        // pull collectables (gems)
        for (const g of G.current.gems) {
          if (g.dead) continue;
          const dist = Math.hypot(sing.x - g.x, sing.y - g.y);
          if (dist < sing.r + 120) {
            const pullForce = (1 - dist / (sing.r + 120)) * 4.5;
            const pullAng = Math.atan2(sing.y - g.y, sing.x - g.x);
            g.x += Math.cos(pullAng) * pullForce;
            g.y += Math.sin(pullAng) * pullForce;
          }
        }

        // Synergy check: Абсолютный Коллапс (singularity_collapse)
        if (p.tags.has('singularity_collapse') && sing.life === 1) { // triggers exactly when it collapses/end
          guardPulse(sing.x, sing.y);
          const collapseDmg = p.damage * 8.5;
          damageArea(sing.x, sing.y, spd(140), collapseDmg, '#a78bfa');
          
          // chain lightning to 6 closest targets
          let chainTargets = 0;
          let prevX = sing.x;
          let prevY = sing.y;
          for (const e of G.current.enemies) {
            if (e.hp <= 0) continue;
            const d = Math.hypot(prevX - e.x, prevY - e.y);
            if (d < 240) {
              e.hp -= collapseDmg * 0.5;
              G.current.totalDamage += collapseDmg * 0.5;
              addLightning(prevX, prevY, e.x, e.y, '#c084fc', 18);
              burstAt(e.x, e.y, '#c084fc', 8, 2.5);
              prevX = e.x;
              prevY = e.y;
              chainTargets++;
              if (chainTargets >= 6) break;
            }
          }
        }
      }
      G.current.singularities = G.current.singularities.filter(s => s.life > 0);
    }

    // Autonomous auxiliary drones
    if (p.drone > 0) {
      p.droneCd++;
      const dronesLimit = p.tags.has('droneswarm') ? 16 : 30;
      if (p.droneCd >= dronesLimit && G.current.enemies.length > 0) {
        p.droneCd = 0;
        // Shoot at nearest enemy
        let nearest: Enemy | null = null;
        let nd = 1e9;
        for (const e of G.current.enemies) {
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < nd) { nd = d; nearest = e; }
        }

        if (nearest) {
          const dang = Math.atan2(nearest.y - p.y, nearest.x - p.x);
          for (let d = 0; d < p.drone; d++) {
            G.current.bullets.push({
              x: p.x + Math.cos(dang) * 10,
              y: p.y + Math.sin(dang) * 10,
              vx: Math.cos(dang + rnd(-0.15, 0.15)) * spd(p.tags.has('droneswarm') ? 8.2 : 6.8),
              vy: Math.sin(dang + rnd(-0.15, 0.15)) * spd(p.tags.has('droneswarm') ? 8.2 : 6.8),
              r: p.tags.has('droneswarm') ? 4 : 3,
              pierce: 0,
              dmg: p.damage * (p.tags.has('droneswarm') ? 0.75 : 0.6),
              col: p.tags.has('droneswarm') ? '#fde68a' : '#ffd166',
              ricochet: 0,
              chain: 0,
              homing: p.tags.has('droneswarm'),
              explosive: false,
              clusterstorm: false,
              ionlance: false,
              critHit: false,
              skinId: selectedRocketSkin,
              trail: [],
            });
          }
        }
      }
    }

    // Rocket Physics Engine (Homing, Trails, Smokes)
    for (const b of G.current.bullets) {
      if (b._dead) continue;

      // Append detailed smoke and flame trails to the rocket
      b.trail.push({ x: b.x, y: b.y, life: 1.0 });
      if (b.trail.length > 12) b.trail.shift();

      // Spawn drifting smoke particles
      b.smokeTimer = (b.smokeTimer || 0) + 1;
      if (b.smokeTimer % 2 === 0) {
        G.current.particles.push({
          x: b.x - Math.cos(b.angle || 0) * 10,
          y: b.y - Math.sin(b.angle || 0) * 10,
          vx: Math.cos((b.angle || 0) + Math.PI + rnd(-0.3, 0.3)) * 0.7,
          vy: Math.sin((b.angle || 0) + Math.PI + rnd(-0.3, 0.3)) * 0.7,
          life: 0.8,
          col: 'rgba(148, 163, 184, 0.35)', // smoky slate
          r: Math.random() * 4 + 3,
          fade: true,
        });
      }

      // Homing calculation
      if (b.homing && G.current.enemies.length > 0) {
        let nearest: Enemy | null = null;
        let nd = 1e9;
        for (const e of G.current.enemies) {
          if (e.hp <= 0) continue;
          const d = Math.hypot(e.x - b.x, e.y - b.y);
          if (d < nd) { nd = d; nearest = e; }
        }

        if (nearest) {
          const targetAng = Math.atan2(nearest.y - b.y, nearest.x - b.x);
          const currentAng = Math.atan2(b.vy, b.vx);
          let diff = targetAng - currentAng;
          if (diff > Math.PI) diff -= Math.PI * 2;
          if (diff < -Math.PI) diff += Math.PI * 2;

          const newAng = currentAng + diff * 0.08;
          b.angle = newAng;
          const speed = Math.hypot(b.vx, b.vy);
          b.vx = Math.cos(newAng) * speed;
          b.vy = Math.sin(newAng) * speed;
        }
      }

      b.x += b.vx;
      b.y += b.vy;
    }

    // Enemy bullets drift
    for (const eb of G.current.eBullets) {
      eb.x += eb.vx;
      eb.y += eb.vy;
    }

    // Enemy state updates
    for (const e of G.current.enemies) {
      if (e.hp <= 0) continue;

      e.angle += 0.04;

      if (e.frozen > 0) {
        e.frozen--;
        if (e.poisonTimer > 0) {
          e.poisonTimer--;
          const pdmg = e.poison * (p.tags.has('cryotoxin') ? 2.0 : 1.0);
          e.hp -= pdmg;
          if (e.hp <= 0) e.hp = 0;
        }
        continue;
      }

      if (e.poisonTimer > 0) {
        e.poisonTimer--;
        const pdmg = e.poison;
        e.hp -= pdmg;
        if (e.hp <= 0) e.hp = 0;
      }

      const toAng = Math.atan2(p.y - e.y, p.x - e.x);
      const isBoss = e.boss;

      if (isBoss && e.hp <= e.maxHp * 0.35 && !e.frenzy) {
        handleBossFrenzy(e);
      }

      // Enemy specific AI paths
      if (e.type === 'grunt' || e.type === 'brute') {
        const trueSpd = e.frenzy ? e.spd * 1.35 : e.spd;
        e.x += Math.cos(toAng) * trueSpd;
        e.y += Math.sin(toAng) * trueSpd;
      }
      else if (e.type === 'dasher') {
        e.dashTimer = (e.dashTimer || 0) + 1;
        if (e.dashTimer < 20) {
          const sideOsc = Math.sin(e.dashTimer * 0.5) * 1.5;
          const baseSpeed = e.baseDashSpd || 0;
          e.x += Math.cos(e.dashAngle || 0) * baseSpeed + Math.cos((e.dashAngle || 0) + Math.PI / 2) * sideOsc;
          e.y += Math.sin(e.dashAngle || 0) * baseSpeed + Math.sin((e.dashAngle || 0) + Math.PI / 2) * sideOsc;
        } else if (e.dashTimer < 35) {
          // Wind up
        } else {
          e.dashTimer = 0;
          e.dashAngle = toAng + rnd(-0.3, 0.3);
        }
      }
      else if (e.type === 'splitter') {
        e.hopTimer = (e.hopTimer || 0) + 1;
        if (e.hopTimer < 40) {
          e.x += Math.cos(toAng) * e.spd * 0.35;
          e.y += Math.sin(toAng) * e.spd * 0.35;
        } else if (e.hopTimer < 50) {
          e.x += Math.cos(toAng) * e.spd * 3;
          e.y += Math.sin(toAng) * e.spd * 3;
        } else {
          e.hopTimer = 0;
        }
      }
      else if (e.type === 'shooter') {
        const d = Math.hypot(p.x - e.x, p.y - e.y);
        if (d > 220) {
          e.x += Math.cos(toAng) * e.spd;
          e.y += Math.sin(toAng) * e.spd;
        } else if (d < 140) {
          e.x -= Math.cos(toAng) * e.spd * 0.6;
          e.y -= Math.sin(toAng) * e.spd * 0.6;
        }

        e.shootCd = (e.shootCd || 0) + 1;
        if (e.shootCd >= 80) {
          e.shootCd = 0;
          for (let i = -1; i <= 1; i++) {
            G.current.eBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(toAng + i * 0.25) * spd(3),
              vy: Math.sin(toAng + i * 0.25) * spd(3),
              dmg: 8,
              r: spd(6),
            });
          }
        }
      }
      else if (e.type === 'charger') {
        e.chargeTimer = (e.chargeTimer || 0) + 1;
        if (e.chargePhase === 'wait') {
          if (e.chargeTimer > 55) {
            e.chargePhase = 'wind';
            e.chargeTimer = 0;
            e.chargeVx = Math.cos(toAng) * spd(10);
            e.chargeVy = Math.sin(toAng) * spd(10);
          }
        } else if (e.chargePhase === 'wind') {
          if (e.chargeTimer > 30) {
            e.chargePhase = 'charge';
            e.chargeTimer = 0;
          }
        } else if (e.chargePhase === 'charge') {
          e.x += e.chargeVx || 0;
          e.y += e.chargeVy || 0;
          e.chargeVx = (e.chargeVx || 0) * 0.92;
          e.chargeVy = (e.chargeVy || 0) * 0.92;
          if (e.chargeTimer > 25) {
            e.chargePhase = 'wait';
            e.chargeTimer = 0;
          }
        }
      }
      else if (e.type === 'spinner') {
        e.spinAngle = (e.spinAngle || 0) + 0.05;
        e.x += Math.cos(toAng) * e.spd;
        e.y += Math.sin(toAng) * e.spd;
        e.shootCd = (e.shootCd || 0) + 1;
        if (e.shootCd >= 50) {
          e.shootCd = 0;
          for (let i = 0; i < 6; i++) {
            const ba = (e.spinAngle || 0) + i * ((Math.PI * 2) / 6);
            G.current.eBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(ba) * spd(2.5),
              vy: Math.sin(ba) * spd(2.5),
              dmg: 7,
              r: spd(5),
            });
          }
        }
      }
      else if (e.type === 'titan') {
        e.x += Math.cos(toAng) * e.spd;
        e.y += Math.sin(toAng) * e.spd;

        e.shootCd = (e.shootCd || 0) + 1;
        const cooldown = e.frenzy ? 30 : 45;
        if (e.shootCd % cooldown === 0) {
          const sideCount = e.frenzy ? 3 : 2;
          for (let i = -sideCount; i <= sideCount; i++) {
            G.current.eBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(toAng + i * 0.22) * spd(e.frenzy ? 4.2 : 3.5),
              vy: Math.sin(toAng + i * 0.22) * spd(e.frenzy ? 4.2 : 3.5),
              dmg: e.frenzy ? 14 : 12,
              r: spd(7),
            });
          }
        }
      }
      else if (e.type === 'hydra') {
        e.x += Math.cos(toAng) * e.spd;
        e.y += Math.sin(toAng) * e.spd;

        e.shootCd = (e.shootCd || 0) + 1;
        const hCd = e.frenzy ? 40 : 60;
        if (e.shootCd % hCd === 0) {
          for (let i = -1; i <= 1; i++) {
            G.current.eBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(toAng + i * 0.25) * spd(2.8),
              vy: Math.sin(toAng + i * 0.25) * spd(2.8),
              dmg: 6,
              r: spd(8),
              poison: true,
            });
          }
        }
      }
      else if (e.type === 'ghost') {
        e.phaseTimer = (e.phaseTimer || 0) + 1;
        const fadeIn = e.frenzy ? 38 : 60;
        const vanish = e.frenzy ? 62 : 90;
        if (e.phaseTimer < fadeIn) {
          e.alpha = e.phaseTimer / fadeIn;
          e.x += Math.cos(toAng) * e.spd;
          e.y += Math.sin(toAng) * e.spd;
        } else if (e.phaseTimer < vanish) {
          e.alpha = 1 - (e.phaseTimer - fadeIn) / (vanish - fadeIn);
        } else if (e.phaseTimer === vanish) {
          // Spawn circles on warp arrival
          const totalPoints = e.frenzy ? 6 : 4;
          for (let i = 0; i < totalPoints; i++) {
            const oa = (i * Math.PI * 2) / totalPoints;
            G.current.eBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(oa) * spd(2),
              vy: Math.sin(oa) * spd(2),
              dmg: 14,
              r: spd(8),
            });
          }
          const ta = Math.random() * Math.PI * 2;
          e.x = p.x + Math.cos(ta) * rnd(100, 180);
          e.y = p.y + Math.sin(ta) * rnd(100, 180);
          e.phaseTimer = 0;
        }
      }
      else if (e.type === 'vortex') {
        e.x += Math.cos(toAng) * e.spd;
        e.y += Math.sin(toAng) * e.spd;

        e.shootCd = (e.shootCd || 0) + 1;
        if (e.shootCd % 40 === 0) {
          const ring = e.frenzy ? 14 : 10;
          for (let i = 0; i < ring; i++) {
            const ba = i * ((Math.PI * 2) / ring);
            G.current.eBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(ba) * spd(2.8),
              vy: Math.sin(ba) * spd(2.8),
              dmg: 10,
              r: spd(6),
            });
          }
        }
        
        // Slightly pull player toward boss
        const dist = Math.hypot(p.x - e.x, p.y - e.y);
        if (dist < 280) {
          const pull = (1 - dist / 280) * (e.frenzy ? 2.5 : 1.5);
          const va = Math.atan2(e.y - p.y, e.x - p.x);
          p.x += Math.cos(va) * pull;
          p.y += Math.sin(va) * pull;
        }
      }
      else if (e.type === 'necro') {
        const d = Math.hypot(p.x - e.x, p.y - e.y);
        if (d < 280) {
          e.x -= Math.cos(toAng) * e.spd;
          e.y -= Math.sin(toAng) * e.spd;
        } else {
          e.x += Math.cos(toAng) * e.spd * 0.4;
          e.y += Math.sin(toAng) * e.spd * 0.4;
        }

        e.summonCd = (e.summonCd || 0) + 1;
        const summonLimit = e.frenzy ? 120 : 180;
        if (e.summonCd % summonLimit === 0) {
          G.current.screenFlash = { col: '#f9a8d4', life: 6 };
          const minionCount = e.frenzy ? 4 : 2;
          for (let i = 0; i < minionCount; i++) {
            G.current.enemies.push({
              x: e.x + rnd(-40, 40),
              y: e.y + rnd(-40, 40),
              type: 'grunt',
              hp: 4 + G.current.wave * 1.8,
              maxHp: 4 + G.current.wave * 1.8,
              r: spd(10),
              spd: spd(1.2 + G.current.wave * 0.05),
              dmg: 7,
              score: 0,
              col: '#f9a8d4',
              xpTier: 0,
              creditChance: 0,
              frozen: 0,
              poison: 0,
              poisonTimer: 0,
              angle: 0,
            });
          }
        }
      }
    }

    // Magnet and pickup mechanics
    if (p.pickupRange > 0) {
      for (const g of G.current.gems) {
        if (g.dead) continue;
        const d = Math.hypot(p.x - g.x, p.y - g.y);
        if (d < p.pickupRange) {
          const force = 1 + (1 - d / p.pickupRange) * 2.8;
          const a = Math.atan2(p.y - g.y, p.x - g.x);
          g.vx += Math.cos(a) * force;
          g.vy += Math.sin(a) * force;
        }
      }
    }

    for (const g of G.current.gems) {
      g.x += g.vx;
      g.y += g.vy;
      g.vx *= 0.92;
      g.vy *= 0.92;

      const d = Math.hypot(p.x - g.x, p.y - g.y);
      if (d < 16) {
        g.dead = true;
        if (g.type === 'xp') {
          gainXp(g.val);
        } else {
          G.current.runCredits += g.val * p.creditGain;
          
          if (p.tags.has('nanite_repair')) {
            const threshold = p.tags.has('nanoregen_vanguard') ? 0.5 : 0.3;
            if (p.hp < p.maxHp * threshold) {
              p.hp = Math.min(p.maxHp, p.hp + 3); // restores 3 HP
              burstAt(g.x, g.y, '#10b981', 8, 2.2); // green nanite repair sparks
            }
          }
        }

        if (p.tags.has('prospector')) {
          burstAt(g.x, g.y, g.type === 'credit' ? '#fcd34d' : '#4ade80', 8, 2.5);
          damageArea(g.x, g.y, spd(52), p.damage * 0.8, g.type === 'credit' ? '#fcd34d' : '#4ade80');
          if (g.type === 'xp' && Math.random() < 0.18) {
            G.current.runCredits += 1;
          }
        }
      }
    }

    // Collision Detection (Spatial Hash optimized)
    spatialHash.current.clear();
    for (const e of G.current.enemies) {
      if (e.hp > 0) spatialHash.current.insert(e);
    }

    for (const b of G.current.bullets) {
      if (b._dead) continue;
      if (!b._hit) b._hit = new Set<Enemy>();

      const nearby = spatialHash.current.query(b.x, b.y, 45);
      for (const e of nearby) {
        if (e.hp <= 0 || b._hit.has(e)) continue;
        if (Math.hypot(b.x - e.x, b.y - e.y) >= e.r + b.r) continue;

        // Register Hit
        b._hit.add(e);
        const damageDealt = b.dmg;
        e.hp -= damageDealt;
        G.current.totalDamage += damageDealt;

        if (p.lifesteal > 0) {
          p.hp = Math.min(p.maxHp, p.hp + damageDealt * p.lifesteal * 0.04);
        }

        if (p.freeze > 0 && Math.random() < p.freeze) {
          e.frozen = 80;
        }
        if (p.poison > 0) {
          e.poison = p.poisonDmg;
          e.poisonTimer = 120;
        }

        // Handle Chain Lightning (from Молния перегрузки / Energy discharge perk)
        if (b.chain > 0) {
          let chainCount = b.chain;
          let currentTarget = e;
          const hitEnemies = new Set<Enemy>([e]);
          
          for (let step = 0; step < chainCount + 2; step++) { // chain jumps up to chainCount + 2 times!
            let nextTarget: Enemy | null = null;
            let bestD = 160 + (b.chain * 40); // detection range of chain jumps
            
            for (const e2 of G.current.enemies) {
              if (e2.hp <= 0 || hitEnemies.has(e2)) continue;
              const d = Math.hypot(currentTarget.x - e2.x, currentTarget.y - e2.y);
              if (d < bestD) {
                bestD = d;
                nextTarget = e2;
              }
            }
            
            if (nextTarget) {
              hitEnemies.add(nextTarget);
              const chainDmg = damageDealt * 0.65; // 65% of original damage for strong visuals and punchy gameplay
              nextTarget.hp -= chainDmg;
              G.current.totalDamage += chainDmg;
              
              // Trigger electrical lightning visual link with some random lifetime
              addLightning(currentTarget.x, currentTarget.y, nextTarget.x, nextTarget.y, '#38bdf8', 14);
              burstAt(nextTarget.x, nextTarget.y, '#38bdf8', 5, 2.0); // electric sparks burst at target
              
              currentTarget = nextTarget;
            } else {
              break;
            }
          }
        }

        // Handle Synergies
        if (b.ionlance) {
          const la = b.angle || 0;
          for (const e2 of G.current.enemies) {
            if (e2 === e || e2.hp <= 0) continue;
            const dx = e2.x - e.x;
            const dy = e2.y - e.y;
            const proj = dx * Math.cos(la) + dy * Math.sin(la);
            const perp = Math.abs(dx * Math.sin(la) - dy * Math.cos(la));
            if (proj > 0 && proj < 240 && perp < e2.r + 12) {
              const lanceDmg = damageDealt * 0.45;
              e2.hp -= lanceDmg;
              G.current.totalDamage += lanceDmg;
              addLightning(e.x, e.y, e2.x, e2.y, '#c4b5fd', 10);
            }
          }
        }

        if (b.explosive) {
          const expRadius = p.explosionRadius || spd(40);
          const expDmg = damageDealt * (p.explosionDmg || 0.5);

          for (const e2 of G.current.enemies) {
            if (e2 === e || e2.hp <= 0) continue;
            const innerD = Math.hypot(b.x - e2.x, b.y - e2.y);
            if (innerD < expRadius) {
              const finalAreaDmg = expDmg * (1 - innerD / expRadius);
              e2.hp -= finalAreaDmg;
              G.current.totalDamage += finalAreaDmg;
            }
          }

          burstAt(b.x, b.y, '#f59e0b', 12, 4);

          // Handle cluster splitting inside clusterstorm synergy
          if (b.clusterstorm && !b._cluster) {
            for (let si = 0; si < 6; si++) {
              const sa = (si * Math.PI * 2) / 6 + rnd(-0.15, 0.15);
              G.current.bullets.push({
                x: b.x,
                y: b.y,
                vx: Math.cos(sa) * p.bulletSpeed * 1.3,
                vy: Math.sin(sa) * p.bulletSpeed * 1.3,
                r: Math.max(2, b.r * 0.55),
                pierce: 0,
                dmg: b.dmg * 0.32,
                col: '#ffb020',
                ricochet: 0,
                chain: 0,
                homing: false,
                explosive: false,
                clusterstorm: false,
                ionlance: false,
                critHit: false,
                skinId: selectedRocketSkin,
                trail: [],
                _cluster: true,
              });
            }
          }
        }

        // Richochet physics
        if (b.ricochet > 0) {
          let nextTarget: Enemy | null = null;
          let minD = 1e9;
          for (const e2 of G.current.enemies) {
            if (e2 === e || e2.hp <= 0) continue;
            const innerD = Math.hypot(e.x - e2.x, e.y - e2.y);
            if (innerD < minD) { minD = innerD; nextTarget = e2; }
          }

          if (nextTarget) {
            const ra = Math.atan2(nextTarget.y - e.y, nextTarget.x - e.x);
            
            // Break away 2-3 small homing shards flying off crookedly at first, then steering perfectly
            const shardCount = 3;
            for (let si = 0; si < shardCount; si++) {
              const shardAng = ra + rnd(-1.1, 1.1); // fly crookedly in wide angles from impact
              // Shards are highly visual electric blue
              const shardCol = '#22d3ee';
              G.current.bullets.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(shardAng) * p.bulletSpeed * 1.45,
                vy: Math.sin(shardAng) * p.bulletSpeed * 1.45,
                r: Math.max(1.2, b.r * 0.4), // smaller breakaway shards size
                pierce: 0,
                dmg: b.dmg * 0.45, // shards deal 45% of ricochet damage
                col: shardCol,
                ricochet: 0,
                chain: 0,
                homing: true, // steer aggressively into enemies
                explosive: false,
                clusterstorm: false,
                ionlance: false,
                critHit: false,
                skinId: selectedRocketSkin,
                trail: [],
                _cluster: true,
                angle: shardAng,
              });
            }

            // Ricochet primary bullet flies off crookedly as requested ("пули летят криво")
            const crookedAngle = ra + rnd(-0.5, 0.5); 
            b.vx = Math.cos(crookedAngle) * p.bulletSpeed * 1.2;
            b.vy = Math.sin(crookedAngle) * p.bulletSpeed * 1.2;
            b.x = e.x + Math.cos(crookedAngle) * e.r;
            b.y = e.y + Math.sin(crookedAngle) * e.r;
            b.angle = crookedAngle;
            b.ricochet--;
            b.dmg *= 0.65; // retain primary damage on bounce
            burstAt(e.x, e.y, '#ffd166', 8, 2.8); // extra spark impact
            break;
          }
        }

        // Pierce check
        b.pierce--;
        if (b.pierce < 0) {
          b._dead = true;
          break;
        }
      }
    }

    // Clean bullets array
    G.current.bullets = G.current.bullets.filter(
      b => !b._dead && b.x > -50 && b.x < width + 50 && b.y > -50 && b.y < height + 50
    );

    // Enemies touch player
    for (const e of G.current.enemies) {
      if (e.hp <= 0) continue;
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (d < e.r + 14) {
        if (p.tags.has('phaseblade') && p.adrenalineTimer > 0) {
          e.hp -= p.damage * 1.8;
          burstAt(e.x, e.y, '#c4b5fd', 8, 3);
          continue;
        }

        if (Math.random() < p.dodge) continue;

        if (p.shield > 0) {
          p.shield--;
          p.shieldCd = 0;
          Sound.play('shield');
          if (p.tags.has('aegisreactor')) {
            guardPulse(p.x, p.y);
          }
          if (p.shield === 0 && p.tags.has('frostnova')) {
            executeFrostnova(p);
          }
          continue;
        }

        p.hp -= e.dmg * (1 - p.armor);
        Sound.play('hit');
        G.current.screenShake = Math.max(G.current.screenShake, 12);
        
        if (p.tags.has('adrenaline')) {
          p.adrenalineTimer = 180;
        }

        e.hp = -999; // destroy
        burstAt(p.x, p.y, '#ff4e6a', 6, 3);

        checkDeaths(p);
      }
    }

    // Enemy projectile hits player
    for (const eb of G.current.eBullets) {
      if (eb.dead) continue;
      const d = Math.hypot(p.x - eb.x, p.y - eb.y);
      if (d < eb.r + 15) {
        eb.dead = true;
        if (Math.random() < p.dodge) continue;

        if (p.shield > 0) {
          p.shield--;
          p.shieldCd = 0;
          Sound.play('shield');
          if (p.tags.has('aegisreactor')) {
            guardPulse(p.x, p.y);
          }
          if (p.shield === 0 && p.tags.has('frostnova')) {
            executeFrostnova(p);
          }
          continue;
        }

        p.hp -= eb.dmg * (1 - p.armor);
        Sound.play('hit');
        G.current.screenShake = Math.max(G.current.screenShake, 10);
        
        if (p.tags.has('adrenaline')) {
          p.adrenalineTimer = 180;
        }

        checkDeaths(p);
      }
    }

    // Handle dying enemies and drops
    for (const e of G.current.enemies) {
      if (e.hp <= 0 && e.hp !== -999) {
        G.current.score += e.score;
        burstAt(e.x, e.y, e.col, isNaN(e.score) ? 4 : 8, 2.5);

        // Populate visual gems
        const gemColor = e.xpTier === 0 ? '#4ade80' : e.xpTier === 1 ? '#60a5fa' : '#fbbf24';
        const rawPower = e.xpTier === 0 ? 1.5 : e.xpTier === 1 ? 4.5 : 15;
        G.current.gems.push({
          x: e.x,
          y: e.y,
          vx: rnd(-1.5, 1.5),
          vy: rnd(-1.5, 1.5),
          val: rawPower,
          type: 'xp',
          r: e.xpTier === 0 ? 4 : 6,
          col: gemColor,
          dead: false,
        });

        // Credit coins
        if (Math.random() < e.creditChance) {
          G.current.gems.push({
            x: e.x,
            y: e.y,
            vx: rnd(-1.5, 1.5),
            vy: rnd(-1.5, 1.5),
            val: 1,
            type: 'credit',
            r: 5,
            col: '#fbbf24',
            dead: false,
            spin: 0,
          });
        }

        // Gravity Singularity vortex pull trigger
        if ((e.miniboss || e.boss || e.xpTier >= 2) && p.tags.has('vortex_pull')) {
          if (G.current.singularities === undefined) {
            G.current.singularities = [];
          }
          G.current.singularities.push({
            x: e.x,
            y: e.y,
            life: 150, // 2.5 seconds at 60fps
            r: 130,
          });
          Sound.play('synergy');
          G.current.screenShake = Math.max(G.current.screenShake, 10);
        }
      }
    }

    // Wave Progression
    G.current.waveFrame++;
    if (G.current.waveFrame >= 1800) {
      G.current.waveFrame = 0;
      G.current.wave++;
      // Boss alert trigger
      if (G.current.wave % 5 === 0) {
        G.current.screenFlash = { col: '#ef4444', life: 15 };
        Sound.play('synergy');
        spawnBoss(G.current, width / 2, -100, G.current.wave, spd);
      } else if (G.current.wave % 3 === 0) {
        G.current.screenFlash = { col: '#fb923c', life: 10 };
        spawnMiniBoss(G.current, width / 2, -100, G.current.wave, spd);
      }
    }

    // Filter dead elements
    G.current.enemies = G.current.enemies.filter(e => e.hp > 0);
    G.current.eBullets = G.current.eBullets.filter(eb => !eb.dead && eb.y < height + 50);
    G.current.gems = G.current.gems.filter(g => !g.dead);
    G.current.particles = G.current.particles.filter(pt => {
      pt.life -= 0.025;
      pt.x += pt.vx;
      pt.y += pt.vy;
      return pt.life > 0;
    });

    // Handle structural UI updates hook
    setHudInfo({
      score: G.current.score,
      wave: G.current.wave,
      level: G.current.level,
      credits: G.current.runCredits,
      hpPercent: Math.max(0, (p.hp / p.maxHp) * 100),
      xpPercent: Math.min(100, (G.current.xp / G.current.xpNext) * 100),
      laserPercent: p.tags.has('laser') ? Math.min(100, ((180 - (p.laserCd || 0)) / 180) * 100) : 0,
      hasLaser: p.tags.has('laser'),
    });
  };

  const checkDeaths = (p: Player) => {
    if (p.hp <= 0) {
      if (p.tags.has('secondwind')) {
        p.hp = Math.floor(p.maxHp * 0.5);
        p.tags.delete('secondwind');
        G.current.screenFlash = { col: '#ffd166', life: 25 };
        Sound.play('synergy');
        burstAt(p.x, p.y, '#ffd166', 30, 6);
      } else {
        Sound.play('gameover');
        // Game Over! Dispatch stats payload
        const length = (Date.now() - G.current.runStartTime) / 1000;
        const dps = length > 0 ? Math.floor(G.current.totalDamage / length) : 0;
        
        onEndRun(
          G.current.score,
          G.current.wave,
          G.current.level,
          G.current.runCredits,
          Array.from(p.tags),
          G.current.totalDamage,
          dps
        );

        onStateChange('stats');
      }
    }
  };

  // High fidelity canvas drawing loop
  useEffect(() => {
    let animId: number;

    const processFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = (canvas.width = window.innerWidth);
      const height = (canvas.height = window.innerHeight);

      // Core mechanics logic
      if (G.current.state === 'playing') {
        updateGame(width, height);
      }

      // Draw routine
      ctx.fillStyle = '#05070b';
      ctx.fillRect(0, 0, width, height);

      // Camera screen shake calculations
      ctx.save();
      if (G.current.screenShake > 0.1 && G.current.state === 'playing') {
        const shakeX = (Math.random() * 2 - 1) * G.current.screenShake;
        const shakeY = (Math.random() * 2 - 1) * G.current.screenShake;
        ctx.translate(shakeX, shakeY);
        G.current.screenShake *= 0.9;
      }

      // Draw background stars
      for (const s of G.current.stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render items logic
      if (G.current.state !== 'menu') {
        const p = G.current.player;
        if (p) {
          // Heat circles (aura)
          if (p.aura > 0) {
            ctx.save();
            ctx.globalAlpha = p.tags.has('gravitywell') ? 0.14 : 0.06;
            ctx.fillStyle = p.tags.has('gravitywell') ? '#a78bfa' : p.col;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.aura, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Satellites
          if (p.orbital > 0) {
            for (let oi = 0; oi < p.orbital; oi++) {
              const oa = (p.orbAngle || 0) + oi * ((Math.PI * 2) / p.orbital);
              const ox = p.x + Math.cos(oa) * (p.tags.has('gravitywell') ? 48 : 35);
              const oy = p.y + Math.sin(oa) * (p.tags.has('gravitywell') ? 48 : 35);
              ctx.save();
              ctx.fillStyle = p.tags.has('gravitywell') ? '#fcd34d' : p.col;
              ctx.beginPath();
              ctx.arc(ox, oy, 5.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }

          // Orbital Deflector Drone
          if (p.tags.has('deflector')) {
            const oa = G.current.deflectorAngle || 0;
            const ox = p.x + Math.cos(oa) * 44;
            const oy = p.y + Math.sin(oa) * 44;
            
            // Draw scanning link
            ctx.save();
            ctx.strokeStyle = p.tags.has('energy_symbiont') ? 'rgba(167, 139, 250, 0.25)' : 'rgba(56, 189, 248, 0.2)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(ox, oy);
            ctx.stroke();
            ctx.restore();

            // Draw drone body core
            ctx.save();
            ctx.shadowColor = p.tags.has('energy_symbiont') ? '#a78bfa' : '#38bdf8';
            ctx.shadowBlur = 10;
            ctx.fillStyle = p.tags.has('energy_symbiont') ? '#c084fc' : '#38bdf8';
            ctx.beginPath();
            ctx.arc(ox, oy, 6, 0, Math.PI * 2);
            ctx.fill();

            // Rotating sub-panels for mechanical tech aesthetic
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.arc(ox, oy, 8.5, oa * 2, oa * 2 + Math.PI * 0.4);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(ox, oy, 8.5, oa * 2 + Math.PI, oa * 2 + Math.PI * 1.4);
            ctx.stroke();
            
            // Deflector Shield recharge ring indicator
            if ((G.current.deflectorCd || 0) > 0) {
              const cdPercent = (G.current.deflectorCd || 0) / 240;
              ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(ox, oy, 11, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * cdPercent));
              ctx.stroke();
            } else {
              // Idle energy rings
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(ox, oy, 11 + Math.sin(G.current.frame * 0.1) * 2, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.restore();

            // Synergy double electric boundary glow ring around ship
            if (p.tags.has('energy_symbiont')) {
              ctx.save();
              ctx.strokeStyle = 'rgba(192, 132, 252, 0.15)';
              ctx.lineWidth = 2.2;
              ctx.shadowColor = '#c084fc';
              ctx.shadowBlur = 6;
              ctx.beginPath();
              ctx.arc(p.x, p.y, 44, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
          }

          // Render active gravity singularities (vortex black holes)
          if (G.current.singularities && G.current.singularities.length > 0) {
            for (const sing of G.current.singularities) {
              ctx.save();
              const coreRadius = 8 + (150 - sing.life) * 0.12; 
              const angleSpin = G.current.frame * 0.085;
              
              // 1. Swirling accretion disk
              const discGrad = ctx.createRadialGradient(sing.x, sing.y, coreRadius, sing.x, sing.y, sing.r);
              discGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)'); // pitch black core
              discGrad.addColorStop(0.18, 'rgba(124, 58, 237, 0.65)'); // intense purple hot gas
              discGrad.addColorStop(0.55, 'rgba(192, 132, 252, 0.25)'); // fading ultraviolet tentacles
              discGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0)');
              
              ctx.fillStyle = discGrad;
              ctx.beginPath();
              ctx.arc(sing.x, sing.y, sing.r, 0, Math.PI * 2);
              ctx.fill();

              // 2. Swirling spiral lines inside accretion disk
              ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
              ctx.lineWidth = 1.6;
              for (let sa = 0; sa < Math.PI * 2; sa += Math.PI * 0.5) {
                ctx.beginPath();
                for (let r = coreRadius; r < sing.r * 0.85; r += 4) {
                  const spiralAng = sa + angleSpin + (r * 0.035);
                  const sx = sing.x + Math.cos(spiralAng) * r;
                  const sy = sing.y + Math.sin(spiralAng) * r;
                  if (r === coreRadius) ctx.moveTo(sx, sy);
                  else ctx.lineTo(sx, sy);
                }
                ctx.stroke();
              }

              // 3. Pitch black event horizon singularity core
              ctx.shadowColor = '#c084fc';
              ctx.shadowBlur = 18;
              ctx.fillStyle = '#020617';
              ctx.beginPath();
              ctx.arc(sing.x, sing.y, coreRadius, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.restore();
            }
          }

          // Laserbeams representation
          if (G.current.laserBeams) {
            for (const beam of G.current.laserBeams) {
              const alphaCheck = beam.life / 12;
              ctx.save();
              ctx.globalAlpha = alphaCheck * 0.75;
              ctx.strokeStyle = '#ffee00';
              ctx.lineWidth = 4 * alphaCheck;
              ctx.beginPath();
              ctx.moveTo(beam.x, beam.y);
              ctx.lineTo(beam.x + Math.cos(beam.ang) * 1200, beam.y + Math.sin(beam.ang) * 1200);
              ctx.stroke();
              ctx.restore();
              beam.life--;
            }
            G.current.laserBeams = G.current.laserBeams.filter(b => b.life > 0);
          }

          // Lightning bolt arcs - rendered as stunning procedural jagged electrical currents
          for (const bolt of G.current.lightningBolts) {
            ctx.save();
            ctx.strokeStyle = bolt.col;
            ctx.lineWidth = 2.5 * (bolt.life / 12) + 0.6;
            ctx.shadowColor = bolt.col;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(bolt.x1, bolt.y1);
            
            // Procedurally calculate jagged lightning joints
            const steps = 4;
            const dx = bolt.x2 - bolt.x1;
            const dy = bolt.y2 - bolt.y1;
            const dist = Math.hypot(dx, dy);
            
            if (dist > 5) {
              for (let s = 1; s < steps; s++) {
                const fraction = s / steps;
                const px = bolt.x1 + dx * fraction;
                const py = bolt.y1 + dy * fraction;
                
                // Normal direction for perpendicular offsets
                const nx = -dy / dist;
                const ny = dx / dist;
                const offset = (Math.random() - 0.5) * Math.min(22, dist * 0.25);
                ctx.lineTo(px + nx * offset, py + ny * offset);
              }
            }
            ctx.lineTo(bolt.x2, bolt.y2);
            ctx.stroke();
            ctx.restore();
            bolt.life--;
          }
          G.current.lightningBolts = G.current.lightningBolts.filter(b => b.life > 0);

          // Ship hulls trail
          for (let i = 0; i < p.trail.length; i++) {
            const tr = p.trail[i];
            ctx.fillStyle = p.col;
            ctx.globalAlpha = (i / p.trail.length) * 0.25;
            ctx.beginPath();
            ctx.arc(tr.x, tr.y, 5 * (i / p.trail.length), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }

          // Draw space-ships procedurally
          drawProceduralPlayer(ctx, p, G.current.frame);

          // Shield sphere overlay
          if (p.shield > 0) {
            ctx.save();
            ctx.strokeStyle = '#38bdf8';
            ctx.globalAlpha = 0.5 + Math.sin(G.current.frame * 0.25) * 0.15;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 23, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Draw dynamic rocket projectiles and their high-fidelity flame tails
        for (const b of G.current.bullets) {
          // Draw rocket hull trail (smoke plumes & fading fires)
          for (let i = 0; i < b.trail.length; i++) {
            const tr = b.trail[i];
            ctx.fillStyle = b.col;
            ctx.globalAlpha = (i / b.trail.length) * 0.22;
            ctx.beginPath();
            ctx.arc(tr.x, tr.y, b.r * 0.8 * (i / b.trail.length), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }

          // Procedural render bullet as highly detailed scifi rocket
          drawProceduralRocket(
            ctx,
            b.x,
            b.y,
            b.r * 0.68, // Scaled down rocket size visually as requested by the user
            b.angle || 0,
            b.skinId,
            G.current.frame,
            b.critHit
          );
        }

        // Mini lasers shots from enemies
        for (const eb of G.current.eBullets) {
          ctx.fillStyle = eb.poison ? '#10b981' : '#f87171';
          ctx.beginPath();
          ctx.arc(eb.x, eb.y, eb.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Procedural Spaceships of space invaders (Enemies)
        for (const e of G.current.enemies) {
          drawProceduralEnemy(ctx, e, G.current.frame);

          // Drawing enemy floating text, wave modifiers, or simple HP bars
          if (e.hp < e.maxHp) {
            const hBarWidth = e.r * 1.9 + 5;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
            ctx.fillRect(e.x - hBarWidth / 2, e.y + e.r + 6, hBarWidth, 4);
            ctx.fillStyle = e.boss ? '#ef4444' : '#10b981';
            ctx.fillRect(e.x - hBarWidth / 2, e.y + e.r + 6, hBarWidth * (e.hp / e.maxHp), 4);
          }
        }

        // Collectible crystallite nodes
        for (const g of G.current.gems) {
          ctx.save();
          ctx.shadowColor = g.col;
          ctx.shadowBlur = 8;
          ctx.fillStyle = g.col;
          
          if (g.type === 'credit') {
            g.spin = (g.spin || 0) + 0.1;
            const sizeX = Math.abs(Math.sin(g.spin));
            ctx.translate(g.x, g.y);
            ctx.scale(sizeX, 1);
            ctx.beginPath();
            ctx.arc(0, 0, g.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 7px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 0);
          } else {
            // Draw diamond crystals
            ctx.translate(g.x, g.y);
            ctx.beginPath();
            ctx.moveTo(0, -g.r);
            ctx.lineTo(g.r * 0.7, 0);
            ctx.lineTo(0, g.r);
            ctx.lineTo(-g.r * 0.7, 0);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }

        // Particle nodes
        for (const pt of G.current.particles) {
          ctx.save();
          ctx.globalAlpha = pt.life;
          ctx.fillStyle = pt.col;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Onscreen flash notifications
        if (G.current.screenFlash) {
          const flLife = G.current.screenFlash.life / 15;
          ctx.fillStyle = G.current.screenFlash.col;
          ctx.globalAlpha = flLife * 0.25;
          ctx.fillRect(0, 0, width, height);
          ctx.globalAlpha = 1.0;
          G.current.screenFlash.life--;
          if (G.current.screenFlash.life <= 0) G.current.screenFlash = null;
        }

        // Virtual Touch Joystick HUD
        if (joyActive.current) {
          ctx.save();
          ctx.globalAlpha = 0.45;
          
          // Outer loop
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(joyBase.current.x, joyBase.current.y, 42, 0, Math.PI * 2);
          ctx.stroke();

          // Under fill
          ctx.fillStyle = 'rgba(34, 211, 238, 0.08)';
          ctx.fill();

          // Thumb track knob
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(joyThumb.current.x, joyThumb.current.y, 16, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(processFrame);
    };

    animId = requestAnimationFrame(processFrame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedSkin, selectedRocketSkin]);

  // Touch handlers for responsive Mobile virtual joystick
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (state !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      // Only trigger if bottom half of vertical screen height is dragged
      if (t.clientY > window.innerHeight * 0.35 && touchId.current === null) {
        touchId.current = t.identifier;
        joyActive.current = true;
        joyBase.current = { x: t.clientX, y: t.clientY };
        joyThumb.current = { x: t.clientX, y: t.clientY };
        joystickValue.current = { x: 0, y: 0 };
        break;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!joyActive.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchId.current) {
        let dx = t.clientX - joyBase.current.x;
        let dy = t.clientY - joyBase.current.y;
        const distLen = Math.hypot(dx, dy);
        const radiusLimit = 42;

        if (distLen > radiusLimit) {
          dx = (dx / distLen) * radiusLimit;
          dy = (dy / distLen) * radiusLimit;
        }

        joyThumb.current = {
          x: joyBase.current.x + dx,
          y: joyBase.current.y + dy,
        };

        // Normalize axes
        joystickValue.current = {
          x: dx / radiusLimit,
          y: dy / radiusLimit,
        };
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchId.current) {
        touchId.current = null;
        joyActive.current = false;
        joystickValue.current = { x: 0, y: 0 };
        break;
      }
    }
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* Absolute background Canvas */}
      <canvas
        ref={canvasRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="block w-full h-full cursor-crosshair"
      />

      {/* Modern Sci-Fi HUD overlays */}
      {state === 'playing' && (
        <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none flex justify-between select-none font-sans select-none antialiased">
          {/* Stats cards columns */}
          <div className="flex flex-col gap-2 pointer-events-auto">
            <div className="flex gap-2">
              <div className="px-3.5 py-1.5 bg-slate-900/80 border border-cyan-500/10 rounded-xl backdrop-blur-md">
                <div className="text-[9px] uppercase tracking-widest text-slate-450 font-extrabold">Рекорд Очков</div>
                <div className="text-sm font-black text-cyan-400">{hudInfo.score}</div>
              </div>
              <div className="px-3.5 py-1.5 bg-slate-900/80 border border-cyan-500/10 rounded-xl backdrop-blur-md">
                <div className="text-[9px] uppercase tracking-widest text-slate-450 font-extrabold">Сектор волны</div>
                <div className="text-sm font-black text-cyan-400">{hudInfo.wave}</div>
              </div>
              <div className="px-3.5 py-1.5 bg-slate-900/80 border border-cyan-500/10 rounded-xl backdrop-blur-md">
                <div className="text-[9px] uppercase tracking-widest text-slate-450 font-extrabold">Уровень</div>
                <div className="text-sm font-black text-cyan-400">{hudInfo.level}</div>
              </div>
            </div>
            {/* Health hull safety stats */}
            <div className="w-48 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 backdrop-blur-sm flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-slate-300">
                <span>ПРОЧНОСТЬ ОБШИВКИ</span>
                <span className="text-cyan-400">{Math.round(hudInfo.hpPercent)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-emerald-400 transition-all duration-150"
                  style={{ width: `${hudInfo.hpPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right hand health levels bar columns */}
          <div className="flex flex-col items-end gap-2 pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-slate-900/80 border border-slate-750 rounded-xl backdrop-blur-md flex items-center gap-1.5">
                <span className="text-yellow-400 text-xs">💎</span>
                <span className="text-xs font-black text-slate-100">{hudInfo.credits}</span>
              </div>
              
              <button
                onClick={() => onStateChange('pause')}
                className="pointer-events-auto px-4 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition cursor-pointer select-none"
              >
                ⏸ Пауза
              </button>
            </div>

            {/* EXP Progress tracking Bar */}
            <div className="w-48 bg-slate-950/80 p-2.5 rounded-xl border border-slate-850 backdrop-blur-sm flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-slate-300">
                <span>ЯДРО ОПЫТА (XP)</span>
                <span className="text-purple-400">{Math.round(hudInfo.xpPercent)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-850 rounded-full overflow-hidden p-0.5 border border-slate-800/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-150"
                  style={{ width: `${hudInfo.xpPercent}%` }}
                />
              </div>
            </div>

            {/* Auxiliary lasers indicators */}
            {hudInfo.hasLaser && (
              <div className="w-48 bg-slate-950/80 p-2 rounded-lg border border-slate-850 backdrop-blur-sm flex items-center justify-between gap-1.5">
                <span className="text-[9px] font-black tracking-wider text-slate-400">ЗАРЯД ЛАЗЕРА:</span>
                <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${hudInfo.laserPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple random coordinate ranges support
const rnd = (a: number, b: number) => Math.random() * (b - a) + a;
