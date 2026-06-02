/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Upgrade, Player } from '../types';

// Helper function for speed scaling based on viewport size
export function spd(v: number): number {
  if (typeof window !== 'undefined' && window.innerWidth && window.innerHeight) {
    return v * (Math.min(window.innerWidth, window.innerHeight) / 480);
  }
  return v;
}

const hasTag = (p: Player, tag: string) => p.tags && p.tags.has(tag);
const synergyReady = (p: Player, checks: ((p: Player) => boolean)[]) => checks.every(check => check(p));
const needTag = (tag: string) => (p: Player) => hasTag(p, tag);
const needStat = (key: keyof Player, min = 1) => (p: Player) => {
  const val = p[key];
  if (typeof val === 'number') {
    return val >= min;
  }
  return false;
};

export const UPGRADES: Upgrade[] = [
  // DAMAGE
  {
    id: 'dmg1',
    name: 'Усиленные патроны',
    rar: 'Common',
    desc: 'Увеличивает базовый урон ракет.',
    w: p => 8 + (p.damage < 2 ? 4 : 0),
    apply: p => {
      p.damage += 0.4;
    }
  },
  {
    id: 'dmg2',
    name: 'Бронебойный заряд',
    rar: 'Rare',
    desc: 'Увеличивает размер ракет и значительно повышает урон.',
    w: p => 4 + (p.bulletSize < 7 ? 3 : 0),
    apply: p => {
      p.damage += 0.7;
      p.bulletSize += 1.2;
    }
  },
  {
    id: 'crit',
    name: 'Прицел охотника',
    rar: 'Rare',
    desc: '+15% шанс критического удара.',
    w: p => 5 + (p.critChance < 0.3 ? 4 : 0),
    apply: p => {
      p.critChance = Math.min(0.5, p.critChance + 0.15);
    }
  },
  {
    id: 'critdmg',
    name: 'Смертельный удар',
    rar: 'Epic',
    desc: 'Увеличивает множитель критического урона на +0.4.',
    w: p => 3 + (p.critDmg < 2.5 ? 4 : 0),
    apply: p => {
      p.critDmg += 0.4;
    }
  },

  // Projectile Modifiers
  {
    id: 'pierce',
    name: 'Сквозной выстрел',
    rar: 'Rare',
    desc: 'Ракеты пробивают +1 врага насквозь.',
    w: p => 5 + (p.pierce < 2 ? 5 : 0),
    apply: p => {
      p.pierce = Math.min(5, p.pierce + 1);
    }
  },
  {
    id: 'ricochet',
    name: 'Рикошет',
    rar: 'Legendary',
    desc: 'Ракеты рикошетят к следующему врагу при попадании. +1 рикошет.',
    w: p => 2 + (p.ricochet < 1 ? 6 : 0),
    apply: p => {
      p.ricochet = Math.min(5, p.ricochet + 1);
    }
  },
  {
    id: 'extrashot',
    name: 'Мультивыстрел',
    rar: 'Rare',
    desc: '+1 ракета в залпе. Запускаются очередью одна за другой.',
    w: p => 5 + (p.extraShots < 2 ? 6 : 0),
    apply: p => {
      p.extraShots = Math.min(3, p.extraShots + 1);
    }
  },
  {
    id: 'rapid',
    name: 'Шквальный огонь',
    rar: 'Common',
    desc: 'Значительно повышает скорость запуска, снижая урон на 5%.',
    w: p => 8 + (p.shootRate > 10 ? 5 : 0),
    apply: p => {
      p.shootRate = Math.max(6, p.shootRate - 2);
      p.damage = Math.max(0.5, p.damage * 0.95);
    }
  },
  {
    id: 'bspeed',
    name: 'Турбо-нагнетатель',
    rar: 'Common',
    desc: 'Увеличивает скорость полета ракет.',
    w: p => 7 + (p.bulletSpeed < spd(6) ? 5 : 0),
    apply: p => {
      p.bulletSpeed = Math.min(spd(9), p.bulletSpeed + spd(1.2));
    }
  },
  {
    id: 'sniper',
    name: 'Снайперская боеголовка',
    rar: 'Rare',
    desc: '+урон, +скорость полета ракет и +1 пробитие.',
    w: p => 4 + (p.bulletSpeed < spd(7) ? 3 : 0),
    apply: p => {
      p.damage += 0.5;
      p.bulletSpeed += spd(1.5);
      p.pierce = Math.min(5, p.pierce + 1);
    }
  },
  {
    id: 'laser',
    name: 'Вспомогательный лазер',
    rar: 'Epic',
    desc: 'Каждые 3 сек прожигает мощный луч сквозь врагов. Максимум 4 стака.',
    w: p => 4 + ((p.laserStacks || 0) < 4 ? 6 : 0),
    apply: p => {
      if ((p.laserStacks || 0) < 4) {
        p.laserStacks = (p.laserStacks || 0) + 1;
        p.tags.add('laser');
        p.laserCd = 0;
      }
    }
  },

  // SPEED / SURVIVAL
  {
    id: 'speed',
    name: 'Форсажные двигатели',
    rar: 'Common',
    desc: '+0.5 к скорости передвижения корабля.',
    w: p => 7 + (p.moveSpeed < 5 ? 3 : 0),
    apply: p => {
      p.moveSpeed = Math.min(spd(6), p.moveSpeed + spd(0.5));
    }
  },
  {
    id: 'hp',
    name: 'Тяжёлая нано-броня',
    rar: 'Common',
    desc: 'Повышает максимальную прочность корпуса на +30 HP.',
    w: p => 7 + (p.hp < 60 ? 6 : 0),
    apply: p => {
      p.maxHp += 30;
      p.hp = Math.min(p.maxHp, p.hp + 30);
    }
  },
  {
    id: 'regen',
    name: 'Авто-ремонтный дроид',
    rar: 'Rare',
    desc: 'Медленно восстанавливает 3 HP каждые 3 секунды. Стак х3.',
    w: p => 4 + (p.regenLv < 1 ? 5 : 0),
    apply: p => {
      p.regenLv = Math.min(3, p.regenLv + 1);
    }
  },
  {
    id: 'shield',
    name: 'Энергетический щит',
    rar: 'Epic',
    desc: 'Добавляет щит, полностью блокирующий один удар. Восстанавливается вне боя.',
    w: p => 3 + (p.maxShield < 2 ? 5 : 0),
    apply: p => {
      p.maxShield += 1;
      p.shield = Math.min(p.maxShield, p.shield + 1);
    }
  },
  {
    id: 'lifesteal',
    name: 'Нано-паразит',
    rar: 'Epic',
    desc: 'Преобразует 8% нанесённого ракетами урона в прочность обшивки.',
    w: p => 3 + (p.lifesteal < 1 ? 5 : 0),
    apply: p => {
      p.lifesteal = Math.min(2, p.lifesteal + 1);
    }
  },
  {
    id: 'dodge',
    name: 'Маневры уклонения',
    rar: 'Rare',
    desc: '+20% шанс полностью уклониться от урона.',
    w: p => 4 + (p.dodge < 0.4 ? 4 : 0),
    apply: p => {
      p.dodge = Math.min(0.6, p.dodge + 0.2);
    }
  },
  {
    id: 'armor',
    name: 'Силовое поле',
    rar: 'Rare',
    desc: '+20% поглощение входящего урона.',
    w: p => 4 + (p.armor < 0.4 ? 4 : 0),
    apply: p => {
      p.armor = Math.min(0.5, p.armor + 0.2);
    }
  },

  // SPECIAL WEAPONS
  {
    id: 'freeze',
    name: 'Криогенная БЧ',
    rar: 'Rare',
    desc: 'Ракеты получают 35% шанс заморозить врагов на 1.3 секунды.',
    w: p => 4 + (!p.tags.has('freeze') ? 5 : 0),
    apply: p => {
      p.freeze = 0.35;
      p.tags.add('freeze');
    }
  },
  {
    id: 'poison',
    name: 'Кислотный катализатор',
    rar: 'Rare',
    desc: 'Ракеты отравляют врагов, нанося периодический урон.',
    w: p => 4 + (p.poison < 1 ? 5 : 0),
    apply: p => {
      p.poison = Math.min(1, p.poison + 0.4);
      p.poisonDmg = 0.3;
    }
  },
  {
    id: 'aura',
    name: 'Термоядерная аура',
    rar: 'Epic',
    desc: 'Выжигает радиацией всех врагов поблизости. Каждый стак увеличивает радиус.',
    w: p => 3 + (p.aura < 1 ? 5 : 0),
    apply: p => {
      p.auraStacks = (p.auraStacks || 0) + 1;
      p.aura = Math.floor(30 * Math.pow(1.15, p.auraStacks));
      p.auraDmg = (p.auraDmg || 0.1) + 0.05;
    }
  },
  {
    id: 'drone',
    name: 'Дрон-истребитель',
    rar: 'Epic',
    desc: 'Выпускает автономного спутника, летающего рядом и помогающего вести огонь.',
    w: p => 3 + (p.drone < 2 ? 5 : 0),
    apply: p => {
      p.drone = Math.min(3, p.drone + 1);
    }
  },
  {
    id: 'pickup',
    name: 'Грави-магнит',
    rar: 'Common',
    desc: 'Притягивает кристаллы опыта и кредиты с огромного расстояния.',
    w: p => 6 + ((p.magnetRange || 0) < 3 ? 5 : 0),
    apply: p => {
      if ((p.magnetRange || 0) < 3) {
        p.pickupRange = Math.min(180, p.pickupRange + 40);
        p.magnetRange = (p.magnetRange || 0) + 1;
      }
    }
  },
  {
    id: 'xpboost',
    name: 'Сенсоры сканирования',
    rar: 'Common',
    desc: 'Увеличивает весь получаемый опыт на +30%.',
    w: p => 6 + (p.xpGain < 1.5 ? 4 : 0),
    apply: p => {
      p.xpGain = Math.min(2, p.xpGain + 0.3);
    }
  },
  {
    id: 'economy',
    name: 'Грузовой захват',
    rar: 'Rare',
    desc: 'Увеличивает сбор кредитных чипов за убийство врагов на +40%.',
    w: p => 4 + (p.creditGain < 1.5 ? 4 : 0),
    apply: p => {
      p.creditGain = Math.min(2.5, p.creditGain + 0.4);
    }
  },
  {
    id: 'chain',
    name: 'Молния перегрузки',
    rar: 'Epic',
    desc: 'Энергетические разряды цепляют соседних врагов.',
    w: p => 3 + (p.chain < 1 ? 5 : 0),
    apply: p => {
      p.chain = Math.min(2, p.chain + 1);
    }
  },
  {
    id: 'glasscannon',
    name: 'Стеклянная пушка',
    rar: 'Legendary',
    desc: '+60% к урону пушек, но снижает максимальное здоровье корабля на -30%.',
    w: p => 1 + (!p.tags.has('glass') ? 4 : 0),
    apply: p => {
      p.damage *= 1.6;
      p.maxHp = Math.max(50, Math.floor(p.maxHp * 0.7));
      p.hp = Math.min(p.hp, p.maxHp);
      p.tags.add('glass');
    }
  },

  // Projectiles
  {
    id: 'explosive',
    name: 'Осколочно-фугасная БЧ',
    rar: 'Epic',
    desc: 'Ракеты детонируют при ударе, нанося мощный урон по площади.',
    w: p => 3 + (!p.tags.has('explosive') ? 5 : 0),
    apply: p => {
      p.tags.add('explosive');
      p.explosionRadius = spd(40);
      p.explosionDmg = 0.5;
    }
  },
  {
    id: 'berserker',
    name: 'Ярость берсерка',
    rar: 'Rare',
    desc: '+20% урона и скорострельности при прочности пробитой ниже 50%.',
    w: p => 4 + (!p.tags.has('berserker') ? 5 : 0),
    apply: p => {
      p.tags.add('berserker');
    }
  },
  {
    id: 'orbital',
    name: 'Гонитель астероидов',
    rar: 'Epic',
    desc: 'Орбитальные плазменные мины вращаются вокруг корпуса и таранят цели.',
    w: p => 3 + (p.orbital < 3 ? 5 : 0),
    apply: p => {
      p.orbital = Math.min(3, p.orbital + 1);
    }
  },
  {
    id: 'homing',
    name: 'Тепловой искатель',
    rar: 'Rare',
    desc: 'Ракеты автоматически доворачивают в сторону ближайших угроз.',
    w: p => 4 + (!p.tags.has('homing') ? 5 : 0),
    apply: p => {
      p.tags.add('homing');
    }
  },
  {
    id: 'multishot',
    name: 'Веерный залп',
    rar: 'Epic',
    desc: 'Корабль разом запускает веер из 3 ракет под углом.',
    w: p => 3 + (!p.tags.has('multishot') ? 6 : 0),
    apply: p => {
      p.tags.add('multishot');
    }
  },
  {
    id: 'adrenaline',
    name: 'Инъекция адреналина',
    rar: 'Rare',
    desc: 'При получении урона дает +30% к скорости полета и маневренности на 3 сек.',
    w: p => 4 + (!p.tags.has('adrenaline') ? 5 : 0),
    apply: p => {
      p.tags.add('adrenaline');
    }
  },
  {
    id: 'secondwind',
    name: 'Резервное питание',
    rar: 'Legendary',
    desc: 'При критическом разрушении восстанавливает 50% обшивки один раз за вылет.',
    w: p => 2 + (!p.tags.has('secondwind') ? 6 : 0),
    apply: p => {
      p.tags.add('secondwind');
    }
  },
  {
    id: 'deflector',
    name: 'Орбитальный Дефлектор',
    rar: 'Epic',
    desc: 'Электрический защитный дрон кружит по орбите. Раз в 4 сек блокирует лазеры/снаряды врагов, либо разряжается электродугой в ближних врагов.',
    w: p => 4 + (!p.tags.has('deflector') ? 5 : 0),
    apply: p => {
      p.tags.add('deflector');
    }
  },
  {
    id: 'vortex_pull',
    name: 'Гравитационная Сингулярность',
    rar: 'Epic',
    desc: 'Каждое критическое уничтожение элитного врага открывает черную дыру на 2.5 сек, которая втягивает врагов и чипы, нанося урон по площади.',
    w: p => 4 + (!p.tags.has('vortex_pull') ? 5 : 0),
    apply: p => {
      p.tags.add('vortex_pull');
    }
  },
  {
    id: 'frostnova',
    name: 'Ледяная Сверхновая',
    rar: 'Rare',
    desc: 'При полной потере силового щита испускает мощную криогенную волну, замораживающую врагов на экране на 3 сек и уничтожающую снаряды.',
    requires: [needStat('maxShield', 1)],
    w: p => (p.maxShield > 0 && !p.tags.has('frostnova')) ? 5 : 0,
    apply: p => {
      p.tags.add('frostnova');
    }
  },
  {
    id: 'nanite_repair',
    name: 'Нанитовый Рем-Рой',
    rar: 'Rare',
    desc: 'Пассивные медицинские нано-боты восстанавливают прочность обшивки при подборе кредитов, когда у вас критическое здоровье (ниже 30% HP).',
    w: p => 5 + (!p.tags.has('nanite_repair') ? 5 : 0),
    apply: p => {
      p.tags.add('nanite_repair');
    }
  },

  // ── LEGENDARY SYNERGIES (Combining Perks) ──
  {
    id: 'nova_radiance',
    name: 'Светоносная Сверхновая',
    rar: 'Legendary',
    desc: 'Синергия: Ледяная Сверхновая + Лазер/Аура. При взрыве сверхновой замороженные враги выгорают от ослепительной тепловой плазмы.',
    synergy: true,
    onceTag: 'nova_radiance',
    requires: [needTag('frostnova'), p => hasTag(p, 'laser') || (p.aura || 0) > 0],
    w: p =>
      synergyReady(p, [needTag('frostnova'), p => hasTag(p, 'laser') || (p.aura || 0) > 0]) &&
      !hasTag(p, 'nova_radiance')
        ? 10
        : 0,
    apply: p => {
      p.tags.add('nova_radiance');
      p.damage += 0.15;
    }
  },
  {
    id: 'singularity_collapse',
    name: 'Абсолютный Коллапс',
    rar: 'Legendary',
    desc: 'Синергия: Гравитационная Сингулярность + Фугас/Молния. Схлопывание черной дыры запускает мощнейшую круговую цепь молний по стянутым врагам.',
    synergy: true,
    onceTag: 'singularity_collapse',
    requires: [needTag('vortex_pull'), p => hasTag(p, 'explosive') || (p.chain || 0) > 0],
    w: p =>
      synergyReady(p, [needTag('vortex_pull'), p => hasTag(p, 'explosive') || (p.chain || 0) > 0]) &&
      !hasTag(p, 'singularity_collapse')
        ? 10
        : 0,
    apply: p => {
      p.tags.add('singularity_collapse');
      p.explosionRadius = Math.max(p.explosionRadius || 0, spd(50));
    }
  },
  {
    id: 'energy_symbiont',
    name: 'Энерго-Симбионт',
    rar: 'Legendary',
    desc: 'Синергия: Орбитальный Дефлектор + Энергетический щит/Орбитальные мины. Блокирование лазеров дефлектором мгновенно перезаряжает щит или плазмо-мины.',
    synergy: true,
    onceTag: 'energy_symbiont',
    requires: [needTag('deflector'), p => (p.maxShield || 0) > 0 || (p.orbital || 0) > 0],
    w: p =>
      synergyReady(p, [needTag('deflector'), p => (p.maxShield || 0) > 0 || (p.orbital || 0) > 0]) &&
      !hasTag(p, 'energy_symbiont')
        ? 10
        : 0,
    apply: p => {
      p.tags.add('energy_symbiont');
    }
  },
  {
    id: 'nanoregen_vanguard',
    name: 'Нано-Регенератор "Авангард"',
    rar: 'Legendary',
    desc: 'Синергия: Нанитовый Рой + Авто-ремонт/Вампиризм. Лимит активации нано-ботов повышается до 50% HP, а сбор чипов увеличивает вампиризм на 40%.',
    synergy: true,
    onceTag: 'nanoregen_vanguard',
    requires: [needTag('nanite_repair'), p => (p.regenLv || 0) > 0 || (p.lifesteal || 0) > 0],
    w: p =>
      synergyReady(p, [needTag('nanite_repair'), p => (p.regenLv || 0) > 0 || (p.lifesteal || 0) > 0]) &&
      !hasTag(p, 'nanoregen_vanguard')
        ? 10
        : 0,
    apply: p => {
      p.tags.add('nanoregen_vanguard');
      p.maxHp += 20;
      p.hp = Math.min(p.maxHp, p.hp + 20);
    }
  },

  // ── LEGENDARY SYNERGIES (Combining Perks) ──
  {
    id: 'clusterstorm',
    name: 'Кластерный шторм',
    rar: 'Legendary',
    desc: 'Синергия: Фугас + Веер / Мультивыстрел. Взрывы разлетаются делящимися осколками.',
    synergy: true,
    onceTag: 'clusterstorm',
    requires: [needTag('explosive'), p => hasTag(p, 'multishot') || (p.extraShots || 0) > 0],
    w: p =>
      synergyReady(p, [needTag('explosive'), p => hasTag(p, 'multishot') || (p.extraShots || 0) > 0]) &&
      !hasTag(p, 'clusterstorm')
        ? 10
        : 0,
    apply: p => {
      p.tags.add('clusterstorm');
      p.explosionRadius = Math.max(p.explosionRadius || 0, spd(62));
      p.explosionDmg = Math.max(p.explosionDmg || 0, 0.75);
      p.bulletSize += spd(0.8);
    }
  },
  {
    id: 'cryotoxin',
    name: 'Криотоксин',
    rar: 'Legendary',
    desc: 'Синергия: Заморозка + Кислота. Замороженные враги плавятся под двойным уроном яда.',
    synergy: true,
    onceTag: 'cryotoxin',
    requires: [needTag('freeze'), needStat('poison', 0.1)],
    w: p =>
      synergyReady(p, [needTag('freeze'), needStat('poison', 0.1)]) && !hasTag(p, 'cryotoxin')
        ? 10
        : 0,
    apply: p => {
      p.tags.add('cryotoxin');
      p.freeze = Math.max(p.freeze || 0, 0.45);
      p.poison = Math.max(p.poison || 0, 1);
      p.poisonDmg = Math.max(p.poisonDmg || 0, 0.55);
    }
  },
  {
    id: 'stormcore',
    name: 'Ядро бури',
    rar: 'Legendary',
    desc: 'Синергия: Лазер + Цепь / Рикошет. Проводники лазера перенаправляют каскады молний при выстреле.',
    synergy: true,
    onceTag: 'stormcore',
    requires: [needTag('laser'), p => (p.chain || 0) > 0 || (p.ricochet || 0) > 0],
    w: p =>
      synergyReady(p, [needTag('laser'), p => (p.chain || 0) > 0 || (p.ricochet || 0) > 0]) &&
      !hasTag(p, 'stormcore')
        ? 10
        : 0,
    apply: p => {
      p.tags.add('stormcore');
      p.chain = Math.max(p.chain || 0, 1);
      p.laserStacks = Math.max(p.laserStacks || 1, 2);
      p.laserCd = 0;
    }
  },
  {
    id: 'gravitywell',
    name: 'Гравитационный колодец',
    rar: 'Legendary',
    desc: 'Синергия: Аура + Магнит / Орбиталь. Чёрная дыра притягивает врагов в эпицентр гибели.',
    synergy: true,
    onceTag: 'gravitywell',
    requires: [needStat('aura', 1), p => (p.magnetRange || 0) > 0 || (p.orbital || 0) > 0],
    w: p =>
      synergyReady(p, [needStat('aura', 1), p => (p.magnetRange || 0) > 0 || (p.orbital || 0) > 0]) &&
      !hasTag(p, 'gravitywell')
        ? 10
        : 0,
    apply: p => {
      p.tags.add('gravitywell');
      p.aura = Math.max(p.aura || 0, spd(72));
      p.auraDmg = (p.auraDmg || 0.15) + 0.08;
      p.pickupRange = Math.max(p.pickupRange || 0, spd(110));
    }
  },
  {
    id: 'ionlance',
    name: 'Ионное копьё',
    rar: 'Legendary',
    desc: 'Синергия: Искатель + Пробитие. За ракетой тянется разрушительный лазерный хлыст.',
    synergy: true,
    onceTag: 'ionlance',
    requires: [needTag('homing'), needStat('pierce', 1)],
    w: p =>
      synergyReady(p, [needTag('homing'), needStat('pierce', 1)]) && !hasTag(p, 'ionlance')
        ? 10
        : 0,
    apply: p => {
      p.tags.add('ionlance');
      p.pierce = Math.max(p.pierce || 0, 2);
      p.bulletSpeed += spd(1.2);
      p.damage += 0.25;
    }
  },
  {
    id: 'bloodnova',
    name: 'Кровавая вспышка',
    rar: 'Legendary',
    desc: 'Синергия: Вампиризм + Берсерк. На низком здоровье корпус испускает кольца жатвы.',
    synergy: true,
    onceTag: 'bloodnova',
    requires: [needStat('lifesteal', 1), needTag('berserker')],
    w: p =>
      synergyReady(p, [needStat('lifesteal', 1), needTag('berserker')]) && !hasTag(p, 'bloodnova')
        ? 10
        : 0,
    apply: p => {
      p.tags.add('bloodnova');
      p.lifesteal = Math.max(p.lifesteal || 0, 1.4);
      p.damage += 0.2;
    }
  },
  {
    id: 'aegisreactor',
    name: 'Реактор Эгиды',
    rar: 'Legendary',
    desc: 'Синергия: Щит + Силовое поле. Потребление щита создаёт защитную отталкивающую волну.',
    synergy: true,
    onceTag: 'aegisreactor',
    requires: [needStat('maxShield', 1), needStat('armor', 0.1)],
    w: p =>
      synergyReady(p, [needStat('maxShield', 1), needStat('armor', 0.1)]) &&
      !hasTag(p, 'aegisreactor')
        ? 10
        : 0,
    apply: p => {
      p.tags.add('aegisreactor');
      p.maxShield += 1;
      p.shield = Math.min(p.maxShield, (p.shield || 0) + 1);
      p.armor = Math.max(p.armor || 0, 0.35);
    }
  },
  {
    id: 'executionmatrix',
    name: 'Матрица казни',
    rar: 'Legendary',
    desc: 'Синергия: Крит + Цепь / Рикошет. Критические детонации создают истребительную электросеть.',
    synergy: true,
    onceTag: 'executionmatrix',
    requires: [needStat('critChance', 0.15), p => (p.chain || 0) > 0 || (p.ricochet || 0) > 0],
    w: p =>
      synergyReady(p, [needStat('critChance', 0.15), p => (p.chain || 0) > 0 || (p.ricochet || 0) > 0]) &&
      !hasTag(p, 'executionmatrix')
        ? 10
        : 0,
    apply: p => {
      p.tags.add('executionmatrix');
      p.critChance = Math.min(0.65, (p.critChance || 0) + 0.1);
      p.critDmg += 0.25;
    }
  },
  {
    id: 'droneswarm',
    name: 'Рой дронов-истребителей',
    rar: 'Legendary',
    desc: 'Синергия: Спутники + Скорострельность. Дроны начинают вести огонь мини-ракетами.',
    synergy: true,
    onceTag: 'droneswarm',
    requires: [needStat('drone', 1), p => p.shootRate <= 14 || hasTag(p, 'laser')],
    w: p =>
      synergyReady(p, [needStat('drone', 1), p => p.shootRate <= 14 || hasTag(p, 'laser')]) &&
      !hasTag(p, 'droneswarm')
        ? 10
        : 0,
    apply: p => {
      p.tags.add('droneswarm');
      p.drone = Math.max(p.drone || 0, 2);
      p.shootRate = Math.max(6, p.shootRate - 1);
    }
  },
  {
    id: 'phaseblade',
    name: 'Фазовое лезвие',
    rar: 'Legendary',
    desc: 'Синергия: Адреналин + Скорость. При получении ускорения корпус шинкует ближних врагов.',
    synergy: true,
    onceTag: 'phaseblade',
    requires: [needTag('adrenaline'), p => (p.dodge || 0) > 0 || p.moveSpeed > spd(3.4)],
    w: p =>
      synergyReady(p, [needTag('adrenaline'), p => (p.dodge || 0) > 0 || p.moveSpeed > spd(3.4)]) &&
      !hasTag(p, 'phaseblade')
        ? 10
        : 0,
    apply: p => {
      p.tags.add('phaseblade');
      p.dodge = Math.max(p.dodge || 0, 0.25);
      p.moveSpeed += spd(0.4);
    }
  },
  {
    id: 'phoenixloop',
    name: 'Петля феникса',
    rar: 'Legendary',
    desc: 'Синергия: Резерв + Ремонт / Вампиризм. Воскрешение обрушивает огненный смерч на сектор.',
    synergy: true,
    onceTag: 'phoenixloop',
    requires: [needTag('secondwind'), p => (p.regenLv || 0) > 0 || (p.lifesteal || 0) > 0],
    w: p =>
      synergyReady(p, [needTag('secondwind'), p => (p.regenLv || 0) > 0 || (p.lifesteal || 0) > 0]) &&
      !hasTag(p, 'phoenixloop')
        ? 10
        : 0,
    apply: p => {
      p.tags.add('phoenixloop');
      p.regenLv = Math.max(p.regenLv || 0, 1);
      p.maxHp += 20;
      p.hp = Math.min(p.maxHp, p.hp + 20);
    }
  },
  {
    id: 'prospector',
    name: 'Двигатель старателя',
    rar: 'Legendary',
    desc: 'Синергия: Магнит + Сканер XP. Сбор ресурсов вызывает детонации обогащенного сырья.',
    synergy: true,
    onceTag: 'prospector',
    requires: [needStat('magnetRange', 1), p => (p.xpGain || 1) > 1 || (p.creditGain || 1) > 1],
    w: p =>
      synergyReady(p, [needStat('magnetRange', 1), p => (p.xpGain || 1) > 1 || (p.creditGain || 1) > 1]) &&
      !hasTag(p, 'prospector')
        ? 10
        : 0,
    apply: p => {
      p.tags.add('prospector');
      p.xpGain = Math.max(p.xpGain || 1, 1.35);
      p.creditGain = Math.max(p.creditGain || 1, 1.35);
      p.pickupRange = Math.max(p.pickupRange || 0, spd(145));
    }
  }
];

export function weightedPick(pool: any[]): any {
  if (!pool || !pool.length) return null;
  const total = pool.reduce((s, x) => s + (typeof x.w === 'number' ? x.w : 0), 0);
  if (!total) return pool[Math.floor(Math.random() * pool.length)];
  let r = Math.random() * total;
  for (const x of pool) {
    const val = typeof x.w === 'number' ? x.w : 0;
    r -= val;
    if (r <= 0) return x;
  }
  return pool[pool.length - 1];
}

export function pickUpgrades(player: Player): Upgrade[] {
  const picked: Upgrade[] = [];
  const used = new Set<string>();
  
  for (let i = 0; i < 3; i++) {
    const pool = UPGRADES.filter(u => {
      if (used.has(u.id)) return false;
      if (u.onceTag && player.tags.has(u.onceTag)) return false;
      if (u.requires && !synergyReady(player, u.requires)) return false;
      
      const tagChecks = ['glass', 'explosive', 'homing', 'multishot', 'berserker', 'adrenaline', 'secondwind', 'freeze'];
      for (const tag of tagChecks) {
        if (u.id === tag && player.tags.has(tag)) return false;
      }
      return true;
    })
    .map(u => ({ ...u, w: u.w(player) }))
    .filter(u => u.w > 0);

    const pick = weightedPick(pool as any);
    if (pick) {
      picked.push(pick);
      used.add(pick.id);
    }
  }
  return picked;
}
