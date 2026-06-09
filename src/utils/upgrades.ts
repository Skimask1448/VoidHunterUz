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

// Check level of a weapon or passive based on player tags
export function getWeaponLevel(p: Player, prefix: string): number {
  if (p.tags.has(`syn_${prefix}`)) return 6; // Synergy acts as level 6 (max/evolved)
  for (let i = 5; i >= 1; i--) {
    if (p.tags.has(`${prefix}_${i}`)) return i;
  }
  return 0;
}

const needTag = (tag: string) => (p: Player) => p.tags.has(tag);
const synergyReady = (p: Player, checks: ((p: Player) => boolean)[]) => checks.every(check => check(p));

// Definitions for programmatically generating level 1-5 cards
interface CardMeta {
  id: string;
  name: string;
  descriptions: string[];
  rarity: ('Common' | 'Rare' | 'Epic' | 'Legendary')[];
  applyEffect: (p: Player, lv: number) => void;
}

const WEAPONS_META: CardMeta[] = [
  {
    id: 'garlic',
    name: 'Грави-Аура',
    descriptions: [
      'Разворачивает вокруг корабля кольцо искривленного пространства, наносящее периодический урон.',
      '+20% к радиусу грави-поля и +25% к его урону.',
      'Пульсации учащаются, поле испускает яркие гравитационные волны.',
      '+20% к радиусу грави-поля и +30% к его урону.',
      'Поле замедляет и отталкивает врагов на краю сингулярной зоны.'
    ],
    rarity: ['Common', 'Common', 'Rare', 'Rare', 'Epic'],
    applyEffect: (p, lv) => {
      p.tags.add('garlic');
      if (lv === 1) p.garlicCd = 0;
    }
  },
  {
    id: 'bible',
    name: 'Орбитальные Реликты',
    descriptions: [
      'Запускает один древний орбитальный модуль, вращающийся вокруг корабля.',
      'Добавляет второй модуль, скорость вращения увеличена на 15%.',
      'Добавляет третий модуль, каждый оставляет ионный шлейф.',
      '+30% к урону орбитальных модулей.',
      'Добавляет четвертый модуль, радиус орбиты динамически меняется.'
    ],
    rarity: ['Common', 'Common', 'Rare', 'Rare', 'Epic'],
    applyEffect: (p, lv) => {
      p.tags.add('bible');
      if (lv === 1) {
        p.bibleAngle = 0;
        p.bibleCd = 0;
      }
    }
  },
  {
    id: 'water',
    name: 'Плазменный Конденсат',
    descriptions: [
      'Сбрасывает с орбиты сгусток плазмы, создающий нестабильную зону прожига.',
      'Сбрасывает два сгустка за раз. +20% к радиусу плазменной зоны.',
      'Время существования зоны увеличено на 50%.',
      'Сбрасывает три сгустка за раз. +30% к урону плазмы.',
      'Плазма переходит в синий режим сверхнагрева и замедляет врагов.'
    ],
    rarity: ['Common', 'Rare', 'Rare', 'Epic', 'Epic'],
    applyEffect: (p, lv) => {
      p.tags.add('water');
      if (lv === 1) p.waterCd = 0;
    }
  },
  {
    id: 'lightning',
    name: 'Ионный Разрядник',
    descriptions: [
      'Поражает случайного врага на экране мощным ионным разрядом.',
      '+20% к урону разряда. Бьет двух врагов одновременно.',
      'Разряд перегружает цель и перескакивает на соседний корпус.',
      'Интервал ударов снижен до 1.5 секунд. Бьет трех врагов.',
      'Разряды оставляют короткое электромагнитное поле в точке удара.'
    ],
    rarity: ['Rare', 'Rare', 'Epic', 'Epic', 'Legendary'],
    applyEffect: (p, lv) => {
      p.tags.add('lightning');
      if (lv === 1) p.lightningCd = 0;
    }
  },
  {
    id: 'cross',
    name: 'Фотонный Бумеранг',
    descriptions: [
      'Запускает вперед вращающийся фотонный клинок, который затем возвращается обратно.',
      'Запускает два бумеранга. +20% к урону.',
      'Бумеранги пробивают врагов насквозь (+2 пробития) и увеличиваются в размере.',
      'Запускает три бумеранга веером.',
      'Скорость вращения увеличена на 50%, дальность полета +40%.'
    ],
    rarity: ['Common', 'Rare', 'Rare', 'Epic', 'Epic'],
    applyEffect: (p, lv) => {
      p.tags.add('cross');
      if (lv === 1) p.crossCd = 0;
    }
  },
  {
    id: 'scythe',
    name: 'Плазменная Коса',
    descriptions: [
      'Запускает плазменную косу по дуге, которая летит сквозь всех врагов.',
      'Запускает две косы. Размер косы увеличен на 25%.',
      'Урон увеличен на 30%. Коса пробивает абсолютно всех врагов.',
      'Запускает три косы.',
      'Перезарядка косы снижена на 30%.'
    ],
    rarity: ['Rare', 'Rare', 'Epic', 'Epic', 'Legendary'],
    applyEffect: (p, lv) => {
      p.tags.add('scythe');
      if (lv === 1) p.scytheCd = 0;
    }
  },
  {
    id: 'dagger',
    name: 'Вихрь Клинков',
    descriptions: [
      'Выпускает очередь из 3 скоростных энерго-клинков в направлении носа.',
      'Очередь увеличена до 5 клинков, скорость их полета +20%.',
      'Клинки получают +1 пробитие. +30% к урону.',
      'Очередь увеличена до 6 клинков.',
      'Интервал между очередями снижен на 40%.'
    ],
    rarity: ['Common', 'Common', 'Rare', 'Rare', 'Epic'],
    applyEffect: (p, lv) => {
      p.tags.add('dagger');
      if (lv === 1) p.daggerCd = 0;
    }
  },
  {
    id: 'mana',
    name: 'Космический Столб',
    descriptions: [
      'Периодически призывает столб космической пыли, проходящий по всей высоте экрана.',
      'Ширина столба увеличена на 30%, урон +20%.',
      'Перезарядка снижена до 3 сек. Столб накладывает на врагов замедление.',
      'Ширина столба увеличена на 25%, урон +30%.',
      'Столб испускает вторичные волны, аннигилируя снаряды врагов.'
    ],
    rarity: ['Rare', 'Rare', 'Epic', 'Epic', 'Legendary'],
    applyEffect: (p, lv) => {
      p.tags.add('mana');
      if (lv === 1) p.manaCd = 0;
    }
  },
  {
    id: 'lancet',
    name: 'Хроно-Ланцет',
    descriptions: [
      'Выпускает временной луч, замораживающий врагов на 1.5 секунды.',
      'Выпускает два луча в противоположных направлениях. Заморозка на 2 сек.',
      'Время заморозки увеличено до 3 секунд.',
      'Лучи становятся шире на 25%. Перезарядка снижена на 25%.',
      'Замороженные лучами враги временно получают на 15% больше урона.'
    ],
    rarity: ['Common', 'Rare', 'Rare', 'Epic', 'Epic'],
    applyEffect: (p, lv) => {
      p.tags.add('lancet');
      if (lv === 1) p.lancetCd = 0;
    }
  },
  {
    id: 'laurel',
    name: 'Барьер Эгиды',
    descriptions: [
      'Создает щит, полностью блокирующий один любой удар. Перезарядка 15 сек.',
      'Перезарядка барьера снижена до 12 секунд.',
      'Барьер может накапливать до 2 зарядов блокировки.',
      'Перезарядка барьера снижена до 9 секунд.',
      'При разрушении барьера испускается волна, отбрасывающая врагов.'
    ],
    rarity: ['Rare', 'Rare', 'Epic', 'Epic', 'Legendary'],
    applyEffect: (p, lv) => {
      p.tags.add('laurel');
      if (lv === 1) {
        p.laurelShields = 1;
        p.laurelMax = 1;
        p.laurelCd = 0;
        p.laurelCdMax = 900;
      }
    }
  }
];

const PASSIVES_META: CardMeta[] = [
  {
    id: 'spinach',
    name: 'Звездный Катализатор',
    descriptions: [
      'Увеличивает весь наносимый урон на +10%.',
      'Увеличивает весь наносимый урон на +20%.',
      'Увеличивает весь наносимый урон на +30%.',
      'Увеличивает весь наносимый урон на +40%.',
      'Увеличивает весь наносимый урон на +50%.'
    ],
    rarity: ['Common', 'Common', 'Rare', 'Rare', 'Epic'],
    applyEffect: (p, lv) => {
      p.tags.add('passive_spinach');
      p.damage += 0.15;
    }
  },
  {
    id: 'armor',
    name: 'Нейтронная Броня',
    descriptions: [
      'Снижает получаемый урон на 8% и добавляет +15 к макс. прочности.',
      'Снижает получаемый урон на 16% и добавляет +30 к макс. прочности.',
      'Снижает получаемый урон на 24% и добавляет +45 к макс. прочности.',
      'Снижает получаемый урон на 32% и добавляет +60 к макс. прочности.',
      'Снижает получаемый урон на 40% и добавляет +80 к макс. прочности.'
    ],
    rarity: ['Common', 'Common', 'Rare', 'Rare', 'Epic'],
    applyEffect: (p, lv) => {
      p.tags.add('passive_armor');
      p.armor = Math.min(0.5, p.armor + 0.08);
      p.maxHp += 15;
      p.hp = Math.min(p.maxHp, p.hp + 15);
    }
  },
  {
    id: 'heart',
    name: 'Реактор Живучести',
    descriptions: [
      'Увеличивает максимальную прочность корпуса на +25 HP.',
      'Увеличивает максимальную прочность корпуса на +50 HP.',
      'Увеличивает максимальную прочность корпуса на +75 HP.',
      'Увеличивает максимальную прочность корпуса на +100 HP.',
      'Увеличивает максимальную прочность корпуса на +130 HP.'
    ],
    rarity: ['Common', 'Common', 'Rare', 'Rare', 'Epic'],
    applyEffect: (p, lv) => {
      p.tags.add('passive_heart');
      p.maxHp += 25;
      p.hp = Math.min(p.maxHp, p.hp + 25);
    }
  },
  {
    id: 'regen',
    name: 'Нано-Регенератор',
    descriptions: [
      'Каждые 3 сек восстанавливает +2 прочности обшивки.',
      'Восстановление увеличено до +4 прочности каждые 3 сек.',
      'Восстановление увеличено до +6 прочности каждые 3 сек.',
      'Восстановление увеличено до +8 прочности каждые 3 сек.',
      'Восстановление увеличено до +10 прочности каждые 3 сек.'
    ],
    rarity: ['Common', 'Rare', 'Rare', 'Epic', 'Epic'],
    applyEffect: (p, lv) => {
      p.tags.add('passive_regen');
      p.regenLv = Math.min(5, p.regenLv + 1);
    }
  },
  {
    id: 'reactor',
    name: 'Быстрый Реактор',
    descriptions: [
      'Снижает интервал стрельбы основного оружия на 12%.',
      'Снижает интервал стрельбы основного оружия на 24%.',
      'Снижает интервал стрельбы основного оружия на 36%.',
      'Снижает интервал стрельбы основного оружия на 48%.',
      'Снижает интервал стрельбы основного оружия на 60%.'
    ],
    rarity: ['Common', 'Common', 'Rare', 'Rare', 'Epic'],
    applyEffect: (p, lv) => {
      p.tags.add('passive_reactor');
      p.shootRate = Math.max(5, Math.floor(p.shootRate * 0.88));
    }
  },
  {
    id: 'lens',
    name: 'Фокусирующая Линза',
    descriptions: [
      'Увеличивает размер снарядов на +15% и радиус аур/взрывов на +15%.',
      'Увеличивает размер снарядов на +30% и радиус аур/взрывов на +30%.',
      'Увеличивает размер снарядов на +45% и радиус аур/взрывов на +45%.',
      'Увеличивает размер снарядов на +60% и радиус аур/взрывов на +60%.',
      'Увеличивает размер снарядов на +80% и радиус аур/взрывов на +80%.'
    ],
    rarity: ['Common', 'Common', 'Rare', 'Rare', 'Epic'],
    applyEffect: (p, lv) => {
      p.tags.add('passive_lens');
      p.bulletSize += 0.5;
      if (p.explosionRadius) p.explosionRadius += 10;
    }
  },
  {
    id: 'duplicator',
    name: 'Мультипликатор',
    descriptions: [
      'Добавляет +1 ракету в залпе основного оружия.',
      'Добавляет +2 ракеты в залпе основного оружия.',
      'Добавляет +3 ракеты в залпе основного оружия.',
      'Добавляет +4 ракеты в залпе основного оружия.',
      'Добавляет +5 ракет в залпе основного оружия.'
    ],
    rarity: ['Rare', 'Rare', 'Epic', 'Epic', 'Legendary'],
    applyEffect: (p, lv) => {
      p.tags.add('passive_duplicator');
      p.extraShots = Math.min(5, p.extraShots + 1);
    }
  },
  {
    id: 'wings',
    name: 'Грави-Ускоритель',
    descriptions: [
      'Увеличивает скорость движения корабля на +15%.',
      'Увеличивает скорость движения корабля на +30%.',
      'Увеличивает скорость движения корабля на +45%.',
      'Увеличивает скорость движения корабля на +60%.',
      'Увеличивает скорость движения корабля на +75%.'
    ],
    rarity: ['Common', 'Common', 'Rare', 'Rare', 'Epic'],
    applyEffect: (p, lv) => {
      p.tags.add('passive_wings');
      p.moveSpeed = Math.min(spd(7), p.moveSpeed + spd(0.4));
    }
  },
  {
    id: 'magnet',
    name: 'Притяжатель',
    descriptions: [
      'Увеличивает радиус сбора опыта и кредитов на +40%.',
      'Увеличивает радиус сбора опыта и кредитов на +80%.',
      'Увеличивает радиус сбора опыта и кредитов на +120%.',
      'Увеличивает радиус сбора опыта и кредитов на +160%.',
      'Увеличивает радиус сбора опыта и кредитов на +200%.'
    ],
    rarity: ['Common', 'Common', 'Rare', 'Rare', 'Epic'],
    applyEffect: (p, lv) => {
      p.tags.add('passive_magnet');
      p.pickupRange = Math.min(250, p.pickupRange + 25);
    }
  },
  {
    id: 'clover',
    name: 'Квантовый Навигатор',
    descriptions: [
      'Увеличивает шанс критического удара на +8% и получаемый опыт на +15%.',
      'Увеличивает шанс критического удара на +16% и получаемый опыт на +30%.',
      'Увеличивает шанс критического удара на +24% и получаемый опыт на +45%.',
      'Увеличивает шанс критического удара на +32% и получаемый опыт на +60%.',
      'Увеличивает шанс критического удара на +40% и получаемый опыт на +75%.'
    ],
    rarity: ['Common', 'Rare', 'Rare', 'Epic', 'Epic'],
    applyEffect: (p, lv) => {
      p.tags.add('passive_clover');
      p.critChance = Math.min(0.65, p.critChance + 0.08);
      p.xpGain = Math.min(2.5, p.xpGain + 0.15);
    }
  }
];

export const UPGRADES: Upgrade[] = [];

const ROCKET_MUTATIONS: Upgrade[] = [
  {
    id: 'rocket_homing',
    name: 'Грави-Наведение Ракет',
    rar: 'Rare',
    desc: 'Базовые ракеты получают самонаведение по ближайшей цели и поворачивают к врагам в полете.',
    onceTag: 'homing',
    requires: [],
    w: p => p.tags.has('homing') ? 0 : 7,
    apply: p => {
      p.tags.add('homing');
      p.bulletSpeed += spd(0.35);
    }
  },
  {
    id: 'rocket_antimatter',
    name: 'Антиматерийная БЧ',
    rar: 'Rare',
    desc: 'Ракеты взрываются при попадании, оставляя яркую космическую ударную волну по области.',
    onceTag: 'explosive',
    requires: [],
    w: p => p.tags.has('explosive') ? 0 : 7,
    apply: p => {
      p.tags.add('explosive');
      p.explosionRadius = Math.max(p.explosionRadius || 0, spd(48));
      p.explosionDmg = Math.max(p.explosionDmg || 0, 0.58);
      p.bulletSize += spd(0.45);
    }
  },
  {
    id: 'rocket_fan',
    name: 'Веерный Пуск',
    rar: 'Common',
    desc: 'Основное оружие выпускает три ракеты широким космическим веером.',
    onceTag: 'multishot',
    requires: [],
    w: p => p.tags.has('multishot') ? 0 : 7,
    apply: p => {
      p.tags.add('multishot');
      p.shootRate = Math.max(8, p.shootRate + 2);
    }
  },
  {
    id: 'rocket_duplicator',
    name: 'Пакетный Старт',
    rar: 'Common',
    desc: '+2 дополнительные ракеты в очереди основного оружия.',
    onceTag: 'rocket_pack_start',
    requires: [],
    w: p => p.tags.has('rocket_pack_start') ? 0 : 6,
    apply: p => {
      p.tags.add('rocket_pack_start');
      p.extraShots += 2;
      p.shootRate = Math.max(8, p.shootRate + 1);
    }
  },
  {
    id: 'rocket_rail',
    name: 'Рельсовый Ускоритель',
    rar: 'Epic',
    desc: 'Ракеты превращаются в длинные рельсовые снаряды: выше скорость, пробитие и бело-синий след.',
    onceTag: 'rail_rockets',
    requires: [],
    w: p => p.tags.has('rail_rockets') ? 0 : 5,
    apply: p => {
      p.tags.add('rail_rockets');
      p.bulletSpeed += spd(1.6);
      p.pierce += 2;
      p.damage += 0.18;
    }
  },
  {
    id: 'rocket_chain',
    name: 'Ионная Катушка',
    rar: 'Rare',
    desc: 'Попадания ракет выпускают цепные электрические дуги к соседним целям.',
    onceTag: 'rocket_chain_coil',
    requires: [],
    w: p => p.tags.has('rocket_chain_coil') ? 0 : 6,
    apply: p => {
      p.tags.add('rocket_chain_coil');
      p.chain += 1;
    }
  },
  {
    id: 'rocket_ricochet',
    name: 'Матрица Рикошета',
    rar: 'Rare',
    desc: 'Ракеты отскакивают от целей и рассыпают управляемые осколки.',
    onceTag: 'rocket_ricochet_matrix',
    requires: [],
    w: p => p.tags.has('rocket_ricochet_matrix') ? 0 : 6,
    apply: p => {
      p.tags.add('rocket_ricochet_matrix');
      p.ricochet += 2;
    }
  },
  {
    id: 'rocket_plasma_trail',
    name: 'Плазменный Хвост',
    rar: 'Rare',
    desc: 'Ракеты оставляют горячий плазменный след, который прожигает врагов позади траектории.',
    onceTag: 'plasma_trail',
    requires: [],
    w: p => p.tags.has('plasma_trail') ? 0 : 6,
    apply: p => {
      p.tags.add('plasma_trail');
      p.damage += 0.12;
    }
  },
  {
    id: 'rocket_gravity_warhead',
    name: 'Грави-Боеголовка',
    rar: 'Epic',
    desc: 'Ракеты тянут ближайших врагов к траектории полета и слегка стягивают их в точку удара.',
    onceTag: 'gravity_rockets',
    requires: [],
    w: p => p.tags.has('gravity_rockets') ? 0 : 5,
    apply: p => {
      p.tags.add('gravity_rockets');
      p.bulletSize += spd(0.35);
    }
  },
  {
    id: 'rocket_splitter',
    name: 'Разделяющиеся Ракеты',
    rar: 'Epic',
    desc: 'При первом попадании ракета распадается на три малых фотонных снаряда.',
    onceTag: 'split_rockets',
    requires: [],
    w: p => p.tags.has('split_rockets') ? 0 : 5,
    apply: p => {
      p.tags.add('split_rockets');
      p.damage += 0.1;
    }
  },
  {
    id: 'rocket_cryo_core',
    name: 'Крио-Ядро',
    rar: 'Rare',
    desc: 'Ракеты получают голубое крио-ядро и на короткое время замораживают поврежденные цели.',
    onceTag: 'cryo_rockets',
    requires: [],
    w: p => p.tags.has('cryo_rockets') ? 0 : 6,
    apply: p => {
      p.tags.add('cryo_rockets');
      p.freeze = Math.max(p.freeze, 0.25);
    }
  },
  {
    id: 'rocket_orbital_laser',
    name: 'Орбитальный Целеуказатель',
    rar: 'Epic',
    desc: 'Открывает периодический лазерный залп по ближайшим целям, синхронизированный с ракетным компьютером.',
    onceTag: 'laser',
    requires: [],
    w: p => p.tags.has('laser') ? 0 : 5,
    apply: p => {
      p.tags.add('laser');
      p.laserStacks = Math.max(p.laserStacks || 1, 1);
      p.laserCd = 60;
    }
  },
  {
    id: 'syn_clusterstorm',
    name: 'Кластерный Шторм',
    rar: 'Legendary',
    desc: 'Синергия ракет: Антиматерийная БЧ + Веерный Пуск. Взрывы распадаются на шесть малых плазменных снарядов.',
    synergy: true,
    onceTag: 'clusterstorm',
    requires: [needTag('explosive'), needTag('multishot')],
    w: p => (p.tags.has('explosive') && p.tags.has('multishot') && !p.tags.has('clusterstorm')) ? 10 : 0,
    apply: p => {
      p.tags.add('clusterstorm');
      p.explosionRadius = Math.max(p.explosionRadius || 0, spd(70));
      p.explosionDmg = Math.max(p.explosionDmg || 0, 0.82);
      p.bulletSize += spd(0.8);
    }
  },
  {
    id: 'syn_ionlance',
    name: 'Ионное Копье',
    rar: 'Legendary',
    desc: 'Синергия ракет: Грави-Наведение + Рельсовый Ускоритель. За ракетой тянется разрушительный ионный луч.',
    synergy: true,
    onceTag: 'ionlance',
    requires: [needTag('homing'), needTag('rail_rockets')],
    w: p => (p.tags.has('homing') && p.tags.has('rail_rockets') && !p.tags.has('ionlance')) ? 10 : 0,
    apply: p => {
      p.tags.add('ionlance');
      p.pierce += 2;
      p.bulletSpeed += spd(0.9);
      p.damage += 0.22;
    }
  },
  {
    id: 'syn_gravity_storm',
    name: 'Сингулярный Залп',
    rar: 'Legendary',
    desc: 'Синергия ракет: Грави-Боеголовка + Разделяющиеся Ракеты. Осколки получают притяжение и стягивают врагов в мини-сингулярности.',
    synergy: true,
    onceTag: 'singularity_rockets',
    requires: [needTag('gravity_rockets'), needTag('split_rockets')],
    w: p => (p.tags.has('gravity_rockets') && p.tags.has('split_rockets') && !p.tags.has('singularity_rockets')) ? 10 : 0,
    apply: p => {
      p.tags.add('singularity_rockets');
      p.bulletSize += spd(0.6);
      p.damage += 0.18;
    }
  }
];

// Programmatically fill levels 1-5 for weapons and passives
function populateUpgrades() {
  const allMeta = [...WEAPONS_META, ...PASSIVES_META];
  for (const meta of allMeta) {
    for (let lv = 1; lv <= 5; lv++) {
      const cardId = `${meta.id}_${lv}`;
      UPGRADES.push({
        id: cardId,
        name: `${meta.name} (Ур. ${lv})`,
        rar: meta.rarity[lv - 1],
        desc: meta.descriptions[lv - 1],
        requires: lv === 1 ? [] : [p => getWeaponLevel(p, meta.id) === lv - 1],
        w: p => getWeaponLevel(p, meta.id) === lv - 1 ? 8 : 0,
        apply: p => {
          if (lv > 1) {
            p.tags.delete(`${meta.id}_${lv - 1}`);
          }
          p.tags.add(cardId);
          meta.applyEffect(p, lv);
        }
      });
    }
  }
}

// Statically add synergies to the UPGRADES array
const SYNERGIES: Upgrade[] = [
  {
    id: 'syn_garlic',
    name: 'Черная Корона (Soul Eater)',
    rar: 'Legendary',
    desc: 'Эволюция: Грави-Аура + Реактор Живучести. Вокруг корабля рождается багровая микросингулярность: мощные пульсы урона, притяжение ресурсов и восстановление корпуса.',
    synergy: true,
    onceTag: 'syn_garlic',
    requires: [p => getWeaponLevel(p, 'garlic') === 5 && getWeaponLevel(p, 'heart') >= 1],
    w: p => (getWeaponLevel(p, 'garlic') === 5 && getWeaponLevel(p, 'heart') >= 1 && !p.tags.has('syn_garlic')) ? 10 : 0,
    apply: p => {
      p.tags.delete('garlic_5');
      p.tags.add('syn_garlic');
      p.damage += 0.2;
    }
  },
  {
    id: 'syn_bible',
    name: 'Вечные Орбиты (Unholy Vespers)',
    rar: 'Legendary',
    desc: 'Эволюция: Орбитальные Реликты + Быстрый Реактор. Спутники превращаются в фиолетовое кольцо абсолютной энергии, вращаются со сверхвысокой скоростью и режут все на орбите.',
    synergy: true,
    onceTag: 'syn_bible',
    requires: [p => getWeaponLevel(p, 'bible') === 5 && getWeaponLevel(p, 'reactor') >= 1],
    w: p => (getWeaponLevel(p, 'bible') === 5 && getWeaponLevel(p, 'reactor') >= 1 && !p.tags.has('syn_bible')) ? 10 : 0,
    apply: p => {
      p.tags.delete('bible_5');
      p.tags.add('syn_bible');
      p.bulletSize += 0.3;
    }
  },
  {
    id: 'syn_water',
    name: 'Синяя Туманность (La Borra)',
    rar: 'Legendary',
    desc: 'Эволюция: Плазменный Конденсат + Фокусирующая Линза. Синие плазменные туманности медленно смещаются вслед за кораблем, расширяя радиус поражения.',
    synergy: true,
    onceTag: 'syn_water',
    requires: [p => getWeaponLevel(p, 'water') === 5 && getWeaponLevel(p, 'lens') >= 1],
    w: p => (getWeaponLevel(p, 'water') === 5 && getWeaponLevel(p, 'lens') >= 1 && !p.tags.has('syn_water')) ? 10 : 0,
    apply: p => {
      p.tags.delete('water_5');
      p.tags.add('syn_water');
    }
  },
  {
    id: 'syn_lightning',
    name: 'Петля Перегруза (Thunder Loop)',
    rar: 'Legendary',
    desc: 'Эволюция: Ионный Разрядник + Мультипликатор. Каждый разряд бьет дважды и выпускает вторичные дуги перегруженной энергии.',
    synergy: true,
    onceTag: 'syn_lightning',
    requires: [p => getWeaponLevel(p, 'lightning') === 5 && getWeaponLevel(p, 'duplicator') >= 1],
    w: p => (getWeaponLevel(p, 'lightning') === 5 && getWeaponLevel(p, 'duplicator') >= 1 && !p.tags.has('syn_lightning')) ? 10 : 0,
    apply: p => {
      p.tags.delete('lightning_5');
      p.tags.add('syn_lightning');
    }
  },
  {
    id: 'syn_cross',
    name: 'Звездный Разруб (Heaven Sword)',
    rar: 'Legendary',
    desc: 'Эволюция: Фотонный Бумеранг + Квантовый Навигатор. Бумеранги заменяются гигантскими сияющими фотонными лезвиями с повышенным шансом критического удара.',
    synergy: true,
    onceTag: 'syn_cross',
    requires: [p => getWeaponLevel(p, 'cross') === 5 && getWeaponLevel(p, 'clover') >= 1],
    w: p => (getWeaponLevel(p, 'cross') === 5 && getWeaponLevel(p, 'clover') >= 1 && !p.tags.has('syn_cross')) ? 10 : 0,
    apply: p => {
      p.tags.delete('cross_5');
      p.tags.add('syn_cross');
      p.critChance = Math.min(0.85, p.critChance + 0.15);
      p.critDmg += 0.5;
    }
  },
  {
    id: 'syn_scythe',
    name: 'Спираль Энтропии (Death Spiral)',
    rar: 'Legendary',
    desc: 'Эволюция: Плазменная Коса + Звездный Катализатор. Корабль выпускает круговой залп из 8 огромных вращающихся багровых плазменных дуг.',
    synergy: true,
    onceTag: 'syn_scythe',
    requires: [p => getWeaponLevel(p, 'scythe') === 5 && getWeaponLevel(p, 'spinach') >= 1],
    w: p => (getWeaponLevel(p, 'scythe') === 5 && getWeaponLevel(p, 'spinach') >= 1 && !p.tags.has('syn_scythe')) ? 10 : 0,
    apply: p => {
      p.tags.delete('scythe_5');
      p.tags.add('syn_scythe');
    }
  },
  {
    id: 'syn_dagger',
    name: 'Тысяча Фотонов (Thousand Edge)',
    rar: 'Legendary',
    desc: 'Эволюция: Вихрь Клинков + Грави-Ускоритель. Корабль выпускает непрерывный поток сверхбыстрых фотонных игл перед собой.',
    synergy: true,
    onceTag: 'syn_dagger',
    requires: [p => getWeaponLevel(p, 'dagger') === 5 && getWeaponLevel(p, 'wings') >= 1],
    w: p => (getWeaponLevel(p, 'dagger') === 5 && getWeaponLevel(p, 'wings') >= 1 && !p.tags.has('syn_dagger')) ? 10 : 0,
    apply: p => {
      p.tags.delete('dagger_5');
      p.tags.add('syn_dagger');
    }
  },
  {
    id: 'syn_mana',
    name: 'Пульсарный Столб (Mannajja)',
    rar: 'Legendary',
    desc: 'Эволюция: Космический Столб + Притяжатель. Звездный луч расширяется в гигантскую золотую ударную волну, замедляя врагов и притягивая ресурсы.',
    synergy: true,
    onceTag: 'syn_mana',
    requires: [p => getWeaponLevel(p, 'mana') === 5 && getWeaponLevel(p, 'magnet') >= 1],
    w: p => (getWeaponLevel(p, 'mana') === 5 && getWeaponLevel(p, 'magnet') >= 1 && !p.tags.has('syn_mana')) ? 10 : 0,
    apply: p => {
      p.tags.delete('mana_5');
      p.tags.add('syn_mana');
    }
  },
  {
    id: 'syn_lancet',
    name: 'Коридор Времени (Infinite Corridor)',
    rar: 'Legendary',
    desc: 'Эволюция: Хроно-Ланцет + Нейтронная Броня. Проецирует хронографический круг: лучи sweep-сканера замораживают врагов и срезают их текущее здоровье.',
    synergy: true,
    onceTag: 'syn_lancet',
    requires: [p => getWeaponLevel(p, 'lancet') === 5 && getWeaponLevel(p, 'armor') >= 1],
    w: p => (getWeaponLevel(p, 'lancet') === 5 && getWeaponLevel(p, 'armor') >= 1 && !p.tags.has('syn_lancet')) ? 10 : 0,
    apply: p => {
      p.tags.delete('lancet_5');
      p.tags.add('syn_lancet');
    }
  },
  {
    id: 'syn_laurel',
    name: 'Багряный Купол (Crimson Shroud)',
    rar: 'Legendary',
    desc: 'Эволюция: Барьер Эгиды + Нано-Регенератор. Накапливает до 3 зарядов блокировки. При поглощении удара выпускает круговую волну багровых фотонных клинков.',
    synergy: true,
    onceTag: 'syn_laurel',
    requires: [p => getWeaponLevel(p, 'laurel') === 5 && getWeaponLevel(p, 'regen') >= 1],
    w: p => (getWeaponLevel(p, 'laurel') === 5 && getWeaponLevel(p, 'regen') >= 1 && !p.tags.has('syn_laurel')) ? 10 : 0,
    apply: p => {
      p.tags.delete('laurel_5');
      p.tags.add('syn_laurel');
      if (p.laurelShields) p.laurelShields = Math.min(3, p.laurelShields + 1);
    }
  }
];

// Populate and add synergies
populateUpgrades();
UPGRADES.push(...ROCKET_MUTATIONS);
UPGRADES.push(...SYNERGIES);

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
