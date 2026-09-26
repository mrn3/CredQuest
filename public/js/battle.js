const Battle = (() => {
  const FIST_COOLDOWN = 400;
  const WEAPON_COOLDOWN = 700;
  const SCENES = [
    { sky: ['#14532d', '#052e16'], ground: '#3f6212' },
    { sky: ['#44403c', '#0c0a09'], ground: '#57534e' },
    { sky: ['#7c2d12', '#1c0a05'], ground: '#431407' },
    { sky: ['#0369a1', '#082f49'], ground: '#cbd5e1' },
    { sky: ['#312e81', '#020617'], ground: '#1e1b4b' }
  ];

  let canvas, ctx, fx, fxCtx;
  let fight = null;
  let mode = localStorage.getItem('cq_attack_mode') || 'weapons';
  let lastHitAt = 0;
  const effects = { floaters: [], playerLunge: -1e9, beastLunge: -1e9, beastFlash: -1e9, playerFlash: -1e9 };

  const hunt = () => State.player.hunt;
  const currentLevel = () => LEVELS[hunt().level - 1];
  const hasWeapons = () => State.player.equipped.weapons.length > 0;
  const usingWeapons = () => mode === 'weapons' && hasWeapons();
  const groundY = () => canvas.height - 40;
  const beastX = () => canvas.width - 190;
  const PLAYER_X = 150;

  function init() {
    canvas = document.getElementById('battleCanvas');
    ctx = canvas.getContext('2d');
    fx = document.createElement('canvas');
    fx.width = canvas.width;
    fx.height = canvas.height;
    fxCtx = fx.getContext('2d');

    const fightBtn = document.getElementById('fightBtn');
    fightBtn.addEventListener('click', () => {
      if (fight) hit(); else startFight();
      fightBtn.blur();
    });
    canvas.addEventListener('click', () => { if (fight) hit(); });
    document.addEventListener('keydown', e => {
      if (!fight || e.code !== 'Space') return;
      e.preventDefault();
      hit();
    });
    document.querySelectorAll('.attack-mode-btn').forEach(b => {
      b.addEventListener('click', () => {
        mode = b.dataset.mode;
        localStorage.setItem('cq_attack_mode', mode);
        render();
        b.blur();
      });
    });

    // Leaving mid-fight (refresh/close) counts as a defeat.
    if (hunt().inFight) {
      const lost = loseRun();
      Net.syncPlayer();
      setTimeout(() => UI.toast(`You fled a beast mid-fight and lost ${lost} creds. Back to level 1.`), 300);
    }
    render();
    requestAnimationFrame(loop);
  }

  function isFighting() { return !!fight; }

  function render() {
    if (!canvas || !State.player) return;
    const h = hunt();
    const lvl = currentLevel();
    const stats = getCombatStats(State.player);
    document.getElementById('huntLevel').textContent = h.level;
    document.getElementById('huntRunCred').textContent = h.runCred;
    document.getElementById('enemyName').textContent = lvl.name + (lvl.isBoss ? ' (BOSS)' : '');
    document.getElementById('fistDmg').textContent = `${stats.unarmedAttack} dmg · fast`;
    document.getElementById('weaponDmg').textContent = hasWeapons() ? `${stats.attack} dmg · slow` : 'none equipped';
    document.querySelectorAll('.attack-mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === (usingWeapons() ? 'weapons' : 'fists'));
      b.disabled = b.dataset.mode === 'weapons' && !hasWeapons();
    });
    const fightBtn = document.getElementById('fightBtn');
    fightBtn.textContent = fight ? '💥 Hit! (Space)' : `Fight ${lvl.name} — 💰${lvl.reward}`;
    fightBtn.classList.toggle('hitting', !!fight);
    document.getElementById('loadoutStats').innerHTML =
      `⚔ Attack <strong>${stats.attack}</strong> · ❤ Health <strong>${stats.health}</strong> · 🛡 Defense <strong>${stats.defense}</strong>` +
      `<br>Recommended for this beast: ~${lvl.recommendedPower} attack`;
    if (!fight) {
      setBar('player', stats.health, stats.health);
      setBar('enemy', lvl.enemyHealth, lvl.enemyHealth);
    }
    renderTrack();
  }

  function renderTrack() {
    const track = document.getElementById('huntTrack');
    const current = hunt().level;
    track.innerHTML = '';
    LEVELS.forEach(l => {
      const cell = document.createElement('div');
      const state = l.level < current ? 'beaten' : l.level === current ? 'current' : 'locked';
      cell.className = `hunt-cell ${state}${l.isBoss ? ' boss' : ''}`;
      cell.title = `Level ${l.level}: ${l.name} — 💰${l.reward}`;
      const img = document.createElement('img');
      img.src = Beasts.thumbnail(l.name, l.isBoss);
      img.alt = l.name;
      const num = document.createElement('span');
      num.textContent = l.level < current ? '✓' : l.level;
      cell.append(img, num);
      track.appendChild(cell);
    });
    const cur = track.querySelector('.current');
    if (cur) track.scrollLeft = cur.offsetLeft - track.clientWidth / 2 + cur.clientWidth / 2;
  }

  function setBar(who, current, max) {
    const pct = Math.max(0, current / max) * 100;
    document.getElementById(who + 'HpBar').style.width = pct + '%';
    document.getElementById(who + 'HpText').textContent = `${Math.max(0, Math.round(current))}/${Math.round(max)}`;
  }

  function log(msg) {
    const el = document.getElementById('battleLog');
    const line = document.createElement('div');
    line.textContent = msg;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
  }

  function startFight() {
    const lvl = currentLevel();
    const stats = getCombatStats(State.player);
    fight = {
      lvl,
      playerHp: stats.health,
      playerMax: stats.health,
      enemyHp: lvl.enemyHealth,
      enemyMax: lvl.enemyHealth,
      defense: stats.defense,
      revives: stats.revive,
      timer: setInterval(enemyAttack, lvl.isBoss ? 950 : 1100)
    };
    lastHitAt = 0;
    hunt().inFight = true;
    Net.syncPlayer();
    document.getElementById('battleLog').innerHTML = '';
    log(`${lvl.name} attacks! Click the beast, press Space, or hit the button to strike.`);
    render();
  }

  function hit() {
    if (!fight) return;
    const now = performance.now();
    const weapons = usingWeapons();
    if (now - lastHitAt < (weapons ? WEAPON_COOLDOWN : FIST_COOLDOWN)) return;
    lastHitAt = now;
    const stats = getCombatStats(State.player);
    const base = weapons ? stats.attack : stats.unarmedAttack;
    const dmg = Math.max(1, Math.round(base * (0.85 + Math.random() * 0.3)));
    fight.enemyHp -= dmg;
    effects.playerLunge = now;
    effects.beastFlash = now;
    effects.floaters.push({ x: beastX() + (Math.random() - 0.5) * 60, y: groundY() - 160, text: `-${dmg}`, color: '#fde047', born: now });
    setBar('enemy', fight.enemyHp, fight.enemyMax);
    if (fight.enemyHp <= 0) finish(true);
  }

  function enemyAttack() {
    if (!fight) return;
    const now = performance.now();
    const dmg = Math.max(1, Math.round((fight.lvl.enemyAttack - fight.defense) * (0.85 + Math.random() * 0.3)));
    fight.playerHp -= dmg;
    effects.beastLunge = now;
    effects.playerFlash = now;
    effects.floaters.push({ x: PLAYER_X + (Math.random() - 0.5) * 40, y: groundY() - 150, text: `-${dmg}`, color: '#f87171', born: now });
    if (fight.playerHp <= 0 && fight.revives > 0) {
      fight.revives--;
      fight.playerHp = Math.round(fight.playerMax * 0.3);
      log('Your Phoenix Charm revives you!');
    }
    setBar('player', fight.playerHp, fight.playerMax);
    if (fight.playerHp <= 0) finish(false);
  }

  function loseRun() {
    const lost = Math.min(State.player.cred, hunt().runCred);
    State.player.cred -= lost;
    State.player.hunt = { level: 1, runCred: 0, inFight: false };
    return lost;
  }

  function finish(won) {
    clearInterval(fight.timer);
    const lvl = fight.lvl;
    fight = null;
    if (won) {
      const beforeTier = getTierInfo(State.player);
      State.player.cred += lvl.reward;
      State.player.lifetimeCred += lvl.reward;
      const h = hunt();
      h.runCred += lvl.reward;
      h.level++;
      h.inFight = false;
      log(`You defeated ${lvl.name}! +${lvl.reward} creds.`);
      const afterTier = getTierInfo(State.player);
      if (h.level > LEVELS.length) {
        State.player.hunt = { level: 1, runCred: 0, inFight: false };
        UI.toast('🏆 You slew all 50 beasts! Your creds are safe. The hunt begins anew.');
      } else if (afterTier.id !== beforeTier.id) {
        UI.toast(`🎉 You evolved into ${afterTier.name}!`);
      } else {
        UI.toast(`Victory! +${lvl.reward} creds. Next up: ${currentLevel().name}`);
      }
    } else {
      const lost = loseRun();
      log(`${lvl.name} defeated you. You lost ${lost} creds and must start again at level 1.`);
      UI.toast(`Defeated! Lost ${lost} creds. Back to level 1.`);
    }
    Net.syncPlayer();
    UI.renderAll();
  }

  function pulse(start, now, dur) {
    const p = (now - start) / dur;
    return p >= 0 && p <= 1 ? Math.sin(p * Math.PI) : 0;
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (!document.getElementById('tab-beasthunters').classList.contains('active')) return;
    drawScene(now);
  }

  function drawScene(now) {
    const lvl = fight ? fight.lvl : currentLevel();
    const scene = SCENES[Math.min(SCENES.length - 1, Math.floor((lvl.level - 1) / 10))];
    const W = canvas.width, H = canvas.height, gy = groundY();

    const sky = ctx.createLinearGradient(0, 0, 0, gy);
    sky.addColorStop(0, scene.sky[0]);
    sky.addColorStop(1, scene.sky[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = scene.ground;
    ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, gy, W, 4);

    const t = now / 1000;
    const bx = beastX() - pulse(effects.beastLunge, now, 260) * 60 + pulse(effects.beastFlash, now, 160) * 10;
    fxCtx.clearRect(0, 0, W, H);
    Beasts.draw(fxCtx, lvl.name, bx, gy, lvl.isBoss ? 230 : 210, { t, boss: lvl.isBoss });
    const flash = pulse(effects.beastFlash, now, 160);
    if (flash > 0) {
      fxCtx.save();
      fxCtx.globalCompositeOperation = 'source-atop';
      fxCtx.fillStyle = `rgba(255,255,255,${flash * 0.75})`;
      fxCtx.fillRect(0, 0, W, H);
      fxCtx.restore();
    }
    ctx.drawImage(fx, 0, 0);

    const stats = getCombatStats(State.player);
    const px = PLAYER_X + pulse(effects.playerLunge, now, 180) * 70;
    drawMinifig(ctx, px, gy - 90, {
      scale: 1.8,
      bodyColor: stats.tier.bodyColor,
      legColor: stats.tier.legColor,
      glow: stats.tier.glow,
      weapon: usingWeapons(),
      cape: stats.tier.id >= 4,
      facing: 1,
      walkPhase: fight ? Math.sin(t * 6) * 0.4 : 0
    });

    if (fight) {
      const cd = usingWeapons() ? WEAPON_COOLDOWN : FIST_COOLDOWN;
      const ready = Math.min(1, (now - lastHitAt) / cd);
      ctx.strokeStyle = ready >= 1 ? '#22c55e' : '#facc15';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(PLAYER_X, gy - 210, 12, -Math.PI / 2, -Math.PI / 2 + ready * Math.PI * 2);
      ctx.stroke();
    }

    const hurt = pulse(effects.playerFlash, now, 250);
    if (hurt > 0) {
      ctx.fillStyle = `rgba(239,68,68,${hurt * 0.3})`;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.textAlign = 'center';
    ctx.font = 'bold 22px sans-serif';
    effects.floaters = effects.floaters.filter(f => now - f.born < 800);
    effects.floaters.forEach(f => {
      const age = (now - f.born) / 800;
      ctx.globalAlpha = 1 - age;
      ctx.fillStyle = '#000';
      ctx.fillText(f.text, f.x + 2, f.y - age * 50 + 2);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y - age * 50);
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`Level ${lvl.level}: ${lvl.name}${lvl.isBoss ? ' 👑' : ''}`, W / 2, 26);
    if (!fight) {
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('Press Fight to begin. Beat it to unlock the next beast.', W / 2, 46);
    }
  }

  return { init, render, isFighting };
})();
