const Battle = (() => {
  let canvas, ctx;
  let activeLevel = null;
  let anim = null;

  function init() {
    canvas = document.getElementById('battleCanvas');
    ctx = canvas.getContext('2d');
    document.getElementById('fightBtn').addEventListener('click', startFight);
    document.getElementById('closeBattleBtn').addEventListener('click', closeBattle);
    renderLevelGrid();
  }

  function renderLevelGrid() {
    const gridEl = document.getElementById('levelSelectGrid');
    gridEl.innerHTML = '';
    LEVELS.forEach(lvl => {
      const btn = document.createElement('button');
      btn.className = 'level-btn' + (lvl.isBoss ? ' boss' : '');
      btn.innerHTML = `<div class="lvl-num">${lvl.level}</div><div class="lvl-name">${lvl.name}</div><div class="lvl-reward">💰${lvl.reward}</div>`;
      btn.addEventListener('click', () => openLevel(lvl));
      gridEl.appendChild(btn);
    });
  }

  function openLevel(lvl) {
    if (anim) return;
    activeLevel = lvl;
    document.getElementById('battleArea').classList.remove('hidden');
    document.getElementById('enemyName').textContent = lvl.name + (lvl.isBoss ? ' (BOSS)' : '');
    document.getElementById('battleLog').innerHTML =
      `<div>Recommended attack power: ~${lvl.recommendedPower}. Your attack: ${getCombatStats(State.player).attack}</div>`;
    resetBars(lvl);
    drawScene();
  }

  function closeBattle() {
    if (anim) return;
    document.getElementById('battleArea').classList.add('hidden');
    activeLevel = null;
  }

  function resetBars(lvl) {
    const stats = getCombatStats(State.player);
    setBar('player', stats.health, stats.health);
    setBar('enemy', lvl.enemyHealth, lvl.enemyHealth);
  }

  function setBar(who, current, max) {
    const pct = Math.max(0, current / max) * 100;
    document.getElementById(who + 'HpBar').style.width = pct + '%';
    document.getElementById(who + 'HpText').textContent = `${Math.max(0, Math.round(current))}/${Math.round(max)}`;
  }

  function drawScene(hitFlash) {
    ctx.fillStyle = hitFlash ? '#fee2e2' : '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const stats = getCombatStats(State.player);
    drawMinifig(ctx, 150, 220, {
      scale: 2,
      bodyColor: stats.tier.bodyColor,
      legColor: stats.tier.legColor,
      glow: stats.tier.glow,
      weapon: true,
      cape: stats.tier.id >= 4,
      facing: 1
    });
    ctx.fillStyle = activeLevel && activeLevel.isBoss ? '#ef4444' : '#7c3aed';
    ctx.beginPath();
    ctx.arc(canvas.width - 150, 200, 40 + (activeLevel ? Math.min(30, activeLevel.level) : 0) * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(activeLevel ? activeLevel.name : '', canvas.width - 150, 250);
  }

  function log(msg) {
    const el = document.getElementById('battleLog');
    const line = document.createElement('div');
    line.textContent = msg;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
  }

  function startFight() {
    if (!activeLevel || anim) return;
    const lvl = activeLevel;
    const stats = getCombatStats(State.player);
    let playerHp = stats.health;
    const playerMaxHp = stats.health;
    let enemyHp = lvl.enemyHealth;
    const enemyMaxHp = lvl.enemyHealth;
    let revives = stats.revive;
    document.getElementById('battleLog').innerHTML = '';
    log(`${lvl.name} appears! Fight begins.`);

    let round = 0;
    anim = setInterval(() => {
      round++;
      const variance = () => 0.85 + Math.random() * 0.3;
      const dmgToEnemy = Math.max(1, Math.round(stats.attack * variance()));
      enemyHp -= dmgToEnemy;
      log(`Round ${round}: You hit ${lvl.name} for ${dmgToEnemy}.`);
      setBar('enemy', Math.max(0, enemyHp), enemyMaxHp);
      drawScene(true);

      if (enemyHp <= 0) {
        finish(true, lvl);
        return;
      }

      const dmgToPlayer = Math.max(1, Math.round((lvl.enemyAttack - stats.defense) * variance()));
      playerHp -= dmgToPlayer;
      log(`Round ${round}: ${lvl.name} hits you for ${dmgToPlayer}.`);
      setBar('player', Math.max(0, playerHp), playerMaxHp);

      if (playerHp <= 0) {
        if (revives > 0) {
          revives--;
          playerHp = Math.round(playerMaxHp * 0.3);
          setBar('player', playerHp, playerMaxHp);
          log('Your Phoenix Charm revives you!');
        } else {
          finish(false, lvl);
          return;
        }
      }
      drawScene(false);
    }, 500);
  }

  function finish(won, lvl) {
    clearInterval(anim);
    anim = null;
    if (won) {
      log(`You defeated ${lvl.name}! +${lvl.reward} creds.`);
      const beforeTier = getTierInfo(State.player);
      State.player.cred += lvl.reward;
      State.player.lifetimeCred += lvl.reward;
      const afterTier = getTierInfo(State.player);
      Net.syncPlayer();
      UI.renderAll();
      if (afterTier.id !== beforeTier.id) {
        UI.toast(`🎉 You evolved into ${afterTier.name}!`);
      } else {
        UI.toast(`Victory! +${lvl.reward} creds`);
      }
    } else {
      log(`You were defeated by ${lvl.name}. No creds earned — gear up and try again!`);
      UI.toast('Defeated! Buy more weapons and try again.');
    }
  }

  return { init };
})();
