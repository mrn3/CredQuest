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
    window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
    requestAnimationFrame(loop);
  }

  function update() {
    let dx = 0, dy = 0;
    if (keys['arrowleft'] || keys['a']) dx -= 1;
    if (keys['arrowright'] || keys['d']) dx += 1;
    if (keys['arrowup'] || keys['w']) dy -= 1;
    if (keys['arrowdown'] || keys['s']) dy += 1;
    moving = dx !== 0 || dy !== 0;
    if (dx !== 0) facing = dx > 0 ? 1 : -1;
    px = Math.min(canvas.width - 40, Math.max(40, px + dx * 3));
    py = Math.min(canvas.height - 40, Math.max(80, py + dy * 3));
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
