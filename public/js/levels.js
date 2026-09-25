const ENEMY_NAMES = [
  'Sludge Goblin', 'Rock Golem', 'Shadow Wolf', 'Iron Bandit', 'Swamp Troll',
  'Fire Imp', 'Storm Serpent', 'Bone Reaper', 'Void Wraith', 'Toxic Slime',
  'Rogue Drone', 'Frost Yeti', 'Sand Viper', 'Molten Brute', 'Crystal Spider'
];
const BOSS_NAMES = [
  'Grimjaw the Cruel', 'Obsidian Warlord', 'The Hollow King',
  'Emberclaw Prime', 'Nyx, Devourer of Light', 'Titan of the Wastes'
];

function generateLevels() {
  const levels = [];
  for (let i = 1; i <= 50; i++) {
    const t = (i - 1) / 49;
    const isBoss = i % 10 === 0;
    const rawReward = (isBoss ? 1.4 : 1) * (15 + (1000 - 15) * Math.pow(t, 1.3));
    const reward = Math.min(1000, Math.round(rawReward));
    const enemyHealth = Math.round((isBoss ? 1.6 : 1) * (40 + 6000 * Math.pow(t, 1.8)));
    const enemyAttack = Math.round((isBoss ? 1.3 : 1) * (5 + 300 * Math.pow(t, 1.7)));
    const recommendedPower = Math.round(10 + 900 * Math.pow(t, 1.6));
    const name = isBoss
      ? (BOSS_NAMES[Math.floor(i / 10) - 1] || BOSS_NAMES[BOSS_NAMES.length - 1])
      : ENEMY_NAMES[i % ENEMY_NAMES.length];
    levels.push({ level: i, name, isBoss, reward, enemyHealth, enemyAttack, recommendedPower });
  }
  return levels;
}

const LEVELS = generateLevels();
