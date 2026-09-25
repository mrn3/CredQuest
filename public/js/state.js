const State = {
  playerId: null,
  player: null,
  catalog: null,
  listings: [],
  onlinePlayers: []
};

function ensurePlayerId() {
  let id = localStorage.getItem('lego_player_id');
  if (!id) {
    id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem('lego_player_id', id);
  }
  return id;
}

function getTierInfo(player) {
  const tiers = State.catalog.tiers;
  let current = tiers[0];
  for (const t of tiers) {
    if (player.lifetimeCred >= t.threshold) current = t;
  }
  return current;
}

function weaponsById(ids) {
  return ids.map(id => State.catalog.weapons.find(w => w.id === id)).filter(Boolean);
}
function powerupsById(ids) {
  return ids.map(id => State.catalog.powerups.find(p => p.id === id)).filter(Boolean);
}

function getCombatStats(player) {
  const tier = getTierInfo(player);
  const equippedWeapons = weaponsById(player.equipped.weapons || []);
  const equippedPowerups = powerupsById(player.equipped.powerups || []);
  let attack = 5 + tier.bonusAttack + equippedWeapons.reduce((s, w) => s + w.attack, 0);
  let health = 100 + tier.bonusHealth;
  let defense = 0;
  let attackMult = 1;
  let regen = 0;
  let revive = 0;
  equippedPowerups.forEach(p => {
    if (p.health) health += p.health;
    if (p.defense) defense += p.defense;
    if (p.attackMult) attackMult *= p.attackMult;
    if (p.regen) regen += p.regen;
    if (p.revive) revive += p.revive;
  });
  attack = Math.round(attack * attackMult);
  return { attack, health, defense, regen, revive, tier };
}
