/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Skin {
  id: string;
  name: string;
  col: string;
  price: number;
  owned: boolean;
  password?: string;
  gradient?: string[];
}

export interface RocketSkin {
  id: string;
  name: string;
  col: string;
  price: number;
  owned: boolean;
  desc: string;
}

export interface Player {
  x: number;
  y: number;
  r: number;
  col: string;
  hp: number;
  maxHp: number;
  moveSpeed: number;
  bulletSpeed: number;
  bulletSize: number;
  shootRate: number;
  shootCd: number;
  damage: number;
  pierce: number;
  extraShots: number;
  ricochet: number;
  chain: number;
  critChance: number;
  critDmg: number;
  pickupRange: number;
  armor: number;
  dodge: number;
  lifesteal: number;
  freeze: number;
  poison: number;
  poisonDmg: number;
  aura: number;
  auraStacks?: number;
  auraDmg?: number;
  drone: number;
  droneCd: number;
  orbital: number;
  orbAngle: number;
  maxShield: number;
  shield: number;
  shieldCd: number;
  regenLv: number;
  regenTimer: number;
  xpGain: number;
  creditGain: number;
  adrenalineTimer: number;
  magnetRange?: number;
  explosionRadius?: number;
  explosionDmg?: number;
  bloodNovaCd?: number;
  phoenixTimer?: number;
  facing: number;
  laserStacks?: number;
  laserCd?: number;
  tags: Set<string>;
  trail: { x: number; y: number }[];
  garlicCd?: number;
  bibleAngle?: number;
  bibleCd?: number;
  waterCd?: number;
  lightningCd?: number;
  crossCd?: number;
  scytheCd?: number;
  daggerCd?: number;
  manaCd?: number;
  lancetCd?: number;
  laurelShields?: number;
  laurelMax?: number;
  laurelCd?: number;
  laurelCdMax?: number;
}

export type EnemyType =
  | 'grunt'
  | 'brute'
  | 'splitter'
  | 'dasher'
  | 'shooter'
  | 'charger'
  | 'spinner'
  | 'titan'
  | 'hydra'
  | 'ghost'
  | 'vortex'
  | 'necro';

export interface Enemy {
  x: number;
  y: number;
  type: EnemyType;
  hp: number;
  maxHp: number;
  r: number;
  spd: number;
  dmg: number;
  score: number;
  col: string;
  xpTier: number;
  creditChance: number;
  frozen: number;
  poison: number;
  poisonTimer: number;
  angle: number;
  
  // Custom Enemy AI types
  hasSplit?: boolean;
  splitDone?: boolean;
  hopTimer?: number;
  dashTimer?: number;
  dashAngle?: number;
  baseDashSpd?: number;
  shootCd?: number;
  chargeTimer?: number;
  chargePhase?: 'wait' | 'wind' | 'charge';
  chargeVx?: number;
  chargeVy?: number;
  spinAngle?: number;
  miniboss?: boolean;
  boss?: boolean;
  frenzy?: boolean;
  frenzyHeadsDone?: boolean;
  alpha?: number;
  phaseTimer?: number;
  summonCd?: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  pierce: number;
  dmg: number;
  col: string;
  ricochet: number;
  chain: number;
  homing: boolean;
  explosive: boolean;
  clusterstorm: boolean;
  ionlance: boolean;
  plasmaTrail?: boolean;
  gravityRocket?: boolean;
  splitRocket?: boolean;
  cryoRocket?: boolean;
  railRocket?: boolean;
  critHit: boolean;
  _dead?: boolean;
  _hit?: Set<Enemy>;
  _cluster?: boolean;
  _chain?: boolean;
  
  // Properties for rendering detailed rocket and smoke trails
  skinId: string; // Active rocket skin
  trail: { x: number; y: number; life: number }[];
  smokeTimer?: number;
  angle?: number;
  _targetY?: number;
  _waterPool?: boolean;
  _crossState?: 'forward' | 'returning';
  _crossTimer?: number;
  _crossVx?: number;
  _crossVy?: number;
  weaponKind?: 'cross' | 'sword' | 'scythe' | 'dagger' | 'shroud';
}

export interface EnemyBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dmg: number;
  r: number;
  dead?: boolean;
  poison?: boolean;
}

export interface Gem {
  x: number;
  y: number;
  vx: number;
  vy: number;
  val: number;
  type: 'xp' | 'credit';
  r: number;
  col: string;
  dead: boolean;
  spin?: number;
  magnetized?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  col: string;
  r: number;
  angle?: number;
  fade?: boolean;
  type?: 'spark' | 'smoke' | 'debris' | 'ring';
  maxLife?: number;
  spinSpd?: number;
  growth?: number;
  friction?: number;
}

export interface LightningBolt {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  col: string;
  life: number;
}

export interface ScreenFlash {
  col: string;
  life: number;
}

export interface DamageNumber {
  x: number;
  y: number;
  text: string;
  col: string;
  size: number;
  alpha: number;
  vx: number;
  vy: number;
  life: number;
  isCrit?: boolean;
}

export type SuperPickupType = 'nuke' | 'magnet' | 'heal' | 'freeze';

export interface SuperPickup {
  x: number;
  y: number;
  type: SuperPickupType;
  r: number;
  life: number;
  col: string;
  pulseTimer: number;
}

export interface LaserBeam {
  x: number;
  y: number;
  ang: number;
  life: number;
}

export interface IonHazard {
  id: number;
  x: number;
  y: number;
  r: number;
  timer: number;
  maxTimer: number;
  active: boolean;
}

export interface HazardAsteroid {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hp: number;
  maxHp: number;
  rot: number;
  rotSpd: number;
  col: string;
}

export interface VortexHazard {
  id: number;
  x: number;
  y: number;
  r: number;
  timer: number;
  maxTimer: number;
  pullLife: number;
  active: boolean;
}

export interface UpgradeRequirement {
  text: string;
  met: boolean;
}

export interface Upgrade {
  id: string;
  name: string;
  rar: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  desc: string;
  descEng?: string;
  synergy?: boolean;
  onceTag?: string;
  requires?: ((p: Player) => boolean)[];
  synergyReqs?: ((p: Player) => UpgradeRequirement)[];
  currentLevel?: number;
  nextLevel?: number;
  statDelta?: string;
  w: (p: Player) => number;
  apply: (p: Player) => void;
}

export interface GameSettings {
  shakeIntensity: number; // 0, 0.5, 1.0, 1.5
  flashEnabled: boolean;
  particlesLevel: 'low' | 'medium' | 'high';
}

export interface RunHistoryItem {
  date: string;
  score: number;
  wave: number;
  level: number;
  credits: number;
  skin: string;
  rocketSkin?: string;
  upgrades: string[];
  victory?: boolean;
  sectorId?: string;
  sectorName?: string;
}

export interface SectorReward {
  credits: number;
  skinId?: string;
  skinName?: string;
  rocketSkinId?: string;
  rocketSkinName?: string;
}

export interface SectorConfig {
  id: string; // 'earth' | 'nebula' | 'asteroid' | 'singularity'
  name: string; // 'Орбита Земли'
  subtitle: string; // 'Сектор 1'
  desc: string; // Описание сектора
  targetScore: number; // Необходимый счет для вызова Флагмана
  creditMultiplier: number; // 1.0, 1.25, 1.5, 2.0
  bossType: EnemyType;
  bossName: string;
  bossTitle: string;
  reward: SectorReward;
  palette: {
    bgGradientTop: string;
    bgGradientBottom: string;
    starColors: string[];
    accentColor: string;
    nebulaColor?: string;
    hazardType?: 'none' | 'nebula' | 'asteroid' | 'singularity';
  };
}

export const SECTORS: SectorConfig[] = [
  {
    id: 'earth',
    name: 'Орбита Земли',
    subtitle: 'Сектор 1',
    desc: 'Оборонительный периметр родной планеты. Идеальное место для калибровки боевых систем корабля.',
    targetScore: 7000,
    creditMultiplier: 1.0,
    bossType: 'titan',
    bossName: 'Titan Dreadnought',
    bossTitle: 'Тяжёлый осадный дредноут',
    reward: {
      credits: 300,
      skinId: 'earth_defender',
      skinName: 'Earth Defender',
    },
    palette: {
      bgGradientTop: '#040714',
      bgGradientBottom: '#07162c',
      starColors: ['#ffffff', '#bae6fd', '#38bdf8', '#7dd3fc'],
      accentColor: '#38bdf8',
      hazardType: 'none',
    },
  },
  {
    id: 'nebula',
    name: 'Туманность Омега',
    subtitle: 'Сектор 2',
    desc: 'Ионизированные фиолетовые облака космического газа. Враги здесь более агрессивны и быстрее маневрируют.',
    targetScore: 14000,
    creditMultiplier: 1.25,
    bossType: 'hydra',
    bossName: 'Hydra Overlord',
    bossTitle: 'Многоглавый плазменный флагман',
    reward: {
      credits: 600,
      rocketSkinId: 'nebula_pulse',
      rocketSkinName: 'Nebula Pulse',
    },
    palette: {
      bgGradientTop: '#0d041a',
      bgGradientBottom: '#22083a',
      starColors: ['#ffffff', '#e879f9', '#c084fc', '#f472b6'],
      accentColor: '#c084fc',
      nebulaColor: 'rgba(192, 132, 252, 0.14)',
      hazardType: 'nebula',
    },
  },
  {
    id: 'asteroid',
    name: 'Пояс Цереры',
    subtitle: 'Сектор 3',
    desc: 'Плотное скопление древних астероидов и метеоритной пыли. Враги оснащены усиленной броней.',
    targetScore: 22000,
    creditMultiplier: 1.5,
    bossType: 'spinner',
    bossName: 'Orbital Colossus',
    bossTitle: 'Вращающаяся боевая цитадель',
    reward: {
      credits: 1200,
      skinId: 'asteroid_miner',
      skinName: 'Asteroid Miner',
    },
    palette: {
      bgGradientTop: '#140802',
      bgGradientBottom: '#2a1103',
      starColors: ['#ffffff', '#fde047', '#fb923c', '#fdba74'],
      accentColor: '#fb923c',
      hazardType: 'asteroid',
    },
  },
  {
    id: 'singularity',
    name: 'Горизонт Событий',
    subtitle: 'Сектор 4 (Эндгейм)',
    desc: 'Гравитационная воронка сверхмассивной чёрной дыры. Пространство искривляется под натиском фантомов Бездны.',
    targetScore: 35000,
    creditMultiplier: 2.0,
    bossType: 'ghost',
    bossName: 'Void Nemesis',
    bossTitle: 'Воплощение космической энтропии',
    reward: {
      credits: 2500,
      rocketSkinId: 'singularity_core',
      rocketSkinName: 'Singularity Core',
    },
    palette: {
      bgGradientTop: '#080106',
      bgGradientBottom: '#18020a',
      starColors: ['#ffffff', '#f43f5e', '#fb7185', '#fda4af'],
      accentColor: '#f43f5e',
      hazardType: 'singularity',
    },
  },
];

export interface MetaState {
  bankCredits: number;
  selectedSkin: string;
  selectedRocketSkin: string;
  selectedSector?: string;
  unlockedSectors?: string[];
  bestWave: number;
  bestScore: number;
  runHistory: RunHistoryItem[];
  unlockedSynergies: string[];
}

export interface GameState {
  state: 'menu' | 'playing' | 'upgrade' | 'pause' | 'stats' | 'leaderboard' | 'hangar' | 'history' | 'codex' | 'sector_select' | 'sector_victory';
  frame: number;
  score: number;
  wave: number;
  waveFrame: number;
  level: number;
  xp: number;
  xpNext: number;
  runCredits: number;
  rerolls: number;
  lastUpgIds: string[];
  stars: { x: number; y: number; r: number; s: number; a: number; col?: string }[];
  bullets: Bullet[];
  eBullets: EnemyBullet[];
  enemies: Enemy[];
  gems: Gem[];
  particles: Particle[];
  lightningBolts: LightningBolt[];
  laserBeams?: LaserBeam[];
  screenFlash?: ScreenFlash | null;
  screenShake: number;
  totalDamage: number;
  runStartTime: number;
  player: Player | null;
  spawnCd: number;
  _enrageNotified?: boolean;
  deflectorCd?: number;
  deflectorAngle?: number;
  singularities?: { x: number; y: number; life: number; r: number }[];
  waterPools?: { x: number; y: number; life: number; r: number; dmg: number; evolved: boolean }[];
  manaPillars?: { x: number; y: number; life: number; w: number; col: string }[];
  lancetBeams?: { x: number; y: number; ang: number; life: number; width: number; evolved: boolean }[];
  
  // Sector System states
  currentSector: SectorConfig;
  sectorProgress: number; // 0 to 100%
  bossWarningTimer: number; // Countdown frames for warning siren
  sectorBoss: Enemy | null; // Reference to active sector flagship
  bossDefeated: boolean;
  isEndless: boolean; // Player chose to continue playing after flagship victory
  asteroids?: { x: number; y: number; r: number; spd: number; rot: number; rotSpd: number; col: string }[];

  // Game Feel & Visual Juice fields
  damageNumbers: DamageNumber[];
  superPickups: SuperPickup[];
  hitStop: number; // Frames of freeze-frame crunch on critical impacts

  // Interactive Sector Hazards (Stage 4)
  ionHazards?: IonHazard[];
  hazardAsteroids?: HazardAsteroid[];
  vortexHazards?: VortexHazard[];
  hazardCooldown?: number;
}
