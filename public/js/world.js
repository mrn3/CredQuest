const World = (() => {
  let canvas, ctx;
  let px = 400, py = 300;
  let facing = 1;
  let moving = false;
  let phase = 0;
  const keys = {};

  function init() {
    canvas = document.getElementById('worldCanvas');
    ctx = canvas.getContext('2d');
    window.addEventListener('keydown', e => {
      if (isTyping(e.target)) return;
      keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
    requestAnimationFrame(loop);
  }

  function isTyping(el) {
    const t = el && el.tagName;
    return t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA';
  }

  const imgCache = new Map();
  function image(src) {
    if (!src) return null;
    let img = imgCache.get(src);
    if (!img) {
      img = new Image();
      img.src = src;
      imgCache.set(src, img);
    }
    return img.complete && img.naturalWidth ? img : null;
  }

  function update() {
    let dx = 0, dy = 0;
    if (keys['arrowleft'] || keys['a']) dx -= 1;
    if (keys['arrowright'] || keys['d']) dx += 1;
    if (keys['arrowup'] || keys['w']) dy -= 1;
    if (keys['arrowdown'] || keys['s']) dy += 1;
    moving = dx !== 0 || dy !== 0;
    if (dx !== 0) facing = dx > 0 ? 1 : -1;
    const speed = 3 * (State.player ? getVehicleStats(State.player).speedMult : 1);
    px = Math.min(canvas.width - 40, Math.max(40, px + dx * speed));
    py = Math.min(canvas.height - 40, Math.max(80, py + dy * speed));
    if (moving) phase += 0.25; else phase = 0;
  }

  function drawGround() {
    ctx.fillStyle = '#7fd858';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for (let x = 0; x < canvas.width; x += 40) {
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.arc(x + 20, y + 20, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function render() {
    drawGround();
    if (!State.player || !State.catalog) return;
    const stats = getCombatStats(State.player);
    const tier = stats.tier;

    const homeStats = getHomeStats(State.player);
    if (homeStats.house) {
      const img = image(homeStats.house.thumbnail);
      if (img) ctx.drawImage(img, 40, 60, 170, 170);
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${homeStats.house.name} — your home`, 125, 246);
    }

    const vStats = getVehicleStats(State.player);
    if (vStats.vehicle) {
      const img = image(vStats.vehicle.thumbnail);
      if (img) ctx.drawImage(img, px - 70, py - 40, 140, 140);
    }

    drawMinifig(ctx, px, py, {
      scale: 1.4,
      walkPhase: phase,
      bodyColor: tier.bodyColor,
      legColor: tier.legColor,
      glow: tier.glow,
      facing,
      weapon: (State.player.equipped.weapons || []).length > 0,
      cape: tier.id >= 4
    });
    ctx.fillStyle = '#1e293b';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${State.player.name} — ${tier.name}`, px, py - 60);
  }

  function loop() {
    try {
      update();
      render();
    } catch (err) {
      console.error('World render error:', err);
    }
    requestAnimationFrame(loop);
  }

  return { init };
})();
