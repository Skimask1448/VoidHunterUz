// ── UPGRADES SYSTEM ──────────────────────────────────────────────────────────
// Helper function for speed scaling
function spd(v){
  if(typeof window !== 'undefined' && window.innerWidth && window.innerHeight){
    return v*(Math.min(window.innerWidth,window.innerHeight)/480);
  }
  return v;
}

export const UPGRADES=[
  // DAMAGE
  {id:'dmg1',     name:'Усиленные патроны',   rar:'Common',   desc:'Больше урона.',
   w:p=>8+(p.damage<2?4:0), apply:p=>{p.damage+=0.4;}},
  {id:'dmg2',     name:'Бронебойный заряд',   rar:'Rare',     desc:'Большая пуля, +урон.',
   w:p=>4+(p.bulletSize<7?3:0), apply:p=>{p.damage+=0.7;p.bulletSize+=1.2;}},
  {id:'crit',     name:'Прицел охотника',     rar:'Rare',     desc:'+15% крит.',
   w:p=>5+(p.critChance<.3?4:0), apply:p=>{p.critChance=Math.min(.5,p.critChance+.15);}},
  {id:'critdmg',  name:'Смертельный удар',    rar:'Epic',     desc:'+0.4 крит урон.',
   w:p=>3+(p.critDmg<2.5?4:0), apply:p=>{p.critDmg+=0.4;}},

  // BULLETS
  {id:'pierce',   name:'Сквозной выстрел',    rar:'Rare',     desc:'+1 пробитие.',
   w:p=>5+(p.pierce<2?5:0), apply:p=>{p.pierce=Math.min(5,p.pierce+1);}},
  {id:'ricochet', name:'Рикошет',             rar:'Legendary',desc:'Пули рикошетят к следующей цели. +1 рикошет за стак.',
   w:p=>2+(p.ricochet<1?6:0), apply:p=>{p.ricochet=Math.min(5,p.ricochet+1);}},
  {id:'extrashot',name:'Мультивыстрел',       rar:'Rare',     desc:'+1 пуля. Пули летят друг за другом.',
   w:p=>5+(p.extraShots<2?6:0), apply:p=>{p.extraShots=Math.min(3,p.extraShots+1);}},

  {id:'rapid',    name:'Шквальный огонь',     rar:'Common',   desc:'Быстрее стреляет, -5% урон.',
   w:p=>8+(p.shootRate>10?5:0), apply:p=>{p.shootRate=Math.max(6,p.shootRate-2);p.damage=Math.max(.5,p.damage*.95);}},
  {id:'bspeed',   name:'Разгон пуль',         rar:'Common',   desc:'+скорость пуль.',
   w:p=>7+(p.bulletSpeed<spd(6)?5:0), apply:p=>{p.bulletSpeed=Math.min(spd(9),p.bulletSpeed+spd(1.2));}},
  {id:'sniper',   name:'Снайпер',             rar:'Rare',     desc:'+урон, +скорость пули, +пробитие.',
   w:p=>4+(p.bulletSpeed<spd(7)?3:0), apply:p=>{p.damage+=0.5;p.bulletSpeed+=spd(1.5);p.pierce=Math.min(5,p.pierce+1);}},

  {id:'laser',    name:'Лазер',               rar:'Epic',     desc:'Каждые 3 сек прожигает луч через всех врагов. Макс 4 стака.',
   w:p=>4+((p.laserStacks||0)<4?6:0), apply:p=>{if((p.laserStacks||0)<4){p.laserStacks=(p.laserStacks||0)+1;p.tags.add('laser');p.laserCd=0;}}},

  // SPEED / SURVIVAL
  {id:'speed',    name:'Форсаж',              rar:'Common',   desc:'+0.5 скорость.',
   w:p=>7+(p.moveSpeed<5?3:0), apply:p=>{p.moveSpeed=Math.min(spd(6),p.moveSpeed+spd(.5));}},
  {id:'hp',       name:'Броня',               rar:'Common',   desc:'+30 HP.',
   w:p=>7+(p.hp<60?6:0), apply:p=>{p.maxHp+=30;p.hp=Math.min(p.maxHp,p.hp+30);}},
  {id:'regen',    name:'Регенерация',         rar:'Rare',     desc:'Восстанавливает 3 HP каждые 3 сек.',
   w:p=>4+(p.regenLv<1?5:0), apply:p=>{p.regenLv=Math.min(3,p.regenLv+1);}},
  {id:'shield',   name:'Щит',                 rar:'Epic',     desc:'+1 щит (поглощает удар).',
   w:p=>3+(p.maxShield<2?5:0), apply:p=>{p.maxShield+=1;p.shield=Math.min(p.maxShield,p.shield+1);}},
  {id:'lifesteal',name:'Вампиризм',           rar:'Epic',     desc:'Восстанавливает 8% нанесённого урона в HP. Стакается.',
   w:p=>3+(p.lifesteal<1?5:0), apply:p=>{p.lifesteal=Math.min(2,p.lifesteal+1);}},
  {id:'dodge',    name:'Уклонение',           rar:'Rare',     desc:'+20% шанс уклонения.',
   w:p=>4+(p.dodge<.4?4:0), apply:p=>{p.dodge=Math.min(.6,p.dodge+.2);}},
  {id:'armor',    name:'Усиленная броня',     rar:'Rare',     desc:'+20% поглощение урона.',
   w:p=>4+(p.armor<.4?4:0), apply:p=>{p.armor=Math.min(.5,p.armor+.2);}},

  // SPECIAL
  {id:'freeze',   name:'Криопатрон',          rar:'Rare',     desc:'35% шанс заморозить врага на 1.3 сек.',
   w:p=>4+(!p.tags.has('freeze')?5:0), apply:p=>{p.freeze=0.35;p.tags.add('freeze');}},
  {id:'poison',   name:'Яд',                  rar:'Rare',     desc:'Пули отравляют врагов.',
   w:p=>4+(p.poison<1?5:0), apply:p=>{p.poison=Math.min(1,p.poison+.4);p.poisonDmg=.3;}},
  {id:'aura',     name:'Аура урона',          rar:'Epic',     desc:'Наносит урон вокруг. +15% к размеру за стак.',
   w:p=>3+(p.aura<1?5:0), apply:p=>{p.auraStacks=(p.auraStacks||0)+1;p.aura=Math.floor(30*Math.pow(1.15,p.auraStacks));p.auraDmg=(p.auraDmg||0.1)+0.05;}},
  {id:'drone',    name:'Дрон',                rar:'Epic',     desc:'+1 дрон-помощник.',
   w:p=>3+(p.drone<2?5:0), apply:p=>{p.drone=Math.min(3,p.drone+1);}},
  {id:'pickup',   name:'Магнит',              rar:'Common',   desc:'Притягивает XP и монеты с большого расстояния. Макс 3 стака.',
   w:p=>6+((p.magnetRange||0)<3?5:0), apply:p=>{if((p.magnetRange||0)<3){p.pickupRange=Math.min(180,p.pickupRange+40);p.magnetRange=(p.magnetRange||0)+1;}}},
  {id:'xpboost',  name:'Сканер XP',           rar:'Common',   desc:'Больше опыта.',
   w:p=>6+(p.xpGain<1.5?4:0), apply:p=>{p.xpGain=Math.min(2,p.xpGain+.3);}},
  {id:'economy',  name:'Трофейный сбор',      rar:'Rare',     desc:'Больше кредитов.',
   w:p=>4+(p.creditGain<1.5?4:0), apply:p=>{p.creditGain=Math.min(2.5,p.creditGain+.4);}},
  {id:'chain',    name:'Цепной разряд',       rar:'Epic',     desc:'Поражает соседних врагов.',
   w:p=>3+(p.chain<1?5:0), apply:p=>{p.chain=Math.min(2,p.chain+1);}},
  {id:'glasscannon',name:'Стеклянная пушка',  rar:'Legendary',desc:'+60% урон, -30% HP.',
   w:p=>1+(!p.tags.has('glass')?4:0), apply:p=>{p.damage*=1.6;p.maxHp=Math.max(50,Math.floor(p.maxHp*.7));p.hp=Math.min(p.hp,p.maxHp);p.tags.add('glass');}},

  // NEW PERKS
  {id:'explosive',name:'Взрывные пули',       rar:'Epic',     desc:'Пули взрываются при попадании, нанося урон по области.',
   w:p=>3+(!p.tags.has('explosive')?5:0), apply:p=>{p.tags.add('explosive');p.explosionRadius=spd(40);p.explosionDmg=0.5;}},
  {id:'berserker', name:'Берсерк',            rar:'Rare',     desc:'+20% урон и скорость атаки при HP<50%.',
   w:p=>4+(!p.tags.has('berserker')?5:0), apply:p=>{p.tags.add('berserker');}},
  {id:'orbital',  name:'Орбитальный щит',     rar:'Epic',     desc:'+1 вращающийся снаряд вокруг корабля.',
   w:p=>3+(p.orbital<3?5:0), apply:p=>{p.orbital=Math.min(3,p.orbital+1);}},
  {id:'homing',   name:'Самонаведение',       rar:'Rare',     desc:'Пули слегка поворачивают к врагам.',
   w:p=>4+(!p.tags.has('homing')?5:0), apply:p=>{p.tags.add('homing');}},
  {id:'multishot',name:'Веер',                rar:'Epic',     desc:'Стреляет 3 пулями веером.',
   w:p=>3+(!p.tags.has('multishot')?6:0), apply:p=>{p.tags.add('multishot');}},

  // NEW PERKS
  {id:'adrenaline',name:'Адреналин',          rar:'Rare',     desc:'При получении урона +30% скорость на 3 сек.',
   w:p=>4+(!p.tags.has('adrenaline')?5:0), apply:p=>{p.tags.add('adrenaline');}},
  {id:'secondwind',name:'Второе дыхание',     rar:'Legendary',desc:'При смерти восстанавливает 50% HP. Работает 1 раз за забег.',
   w:p=>2+(!p.tags.has('secondwind')?6:0), apply:p=>{p.tags.add('secondwind');}},
];

export function weightedPick(pool){
  if(!pool||!pool.length) return null;
  const total=pool.reduce((s,x)=>s+x.w,0);
  if(!total) return pool[Math.floor(Math.random()*pool.length)];
  let r=Math.random()*total;
  for(const x of pool){r-=x.w;if(r<=0)return x;}
  return pool[pool.length-1];
}

export function pickUpgrades(player){
  const picked=[]; const used=new Set();
  for(let i=0;i<3;i++){
    const pool=UPGRADES
      .filter(u=>!used.has(u.id))
      .filter(u=>{
        const tagChecks=['glass','explosive','homing','multishot','berserker','adrenaline','secondwind','freeze'];
        for(const tag of tagChecks){
          if(u.id===tag&&player.tags.has(tag)) return false;
        }
        return true;
      })
      .map(u=>({...u,w:u.w(player)}))
      .filter(u=>u.w>0);
    const pick=weightedPick(pool);
    if(pick){picked.push(pick);used.add(pick.id);}
  }
  return picked;
}
