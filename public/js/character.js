// Draws a simplified LEGO minifig on a canvas 2D context, centered at (x, y).
function drawMinifig(ctx, x, y, opts) {
  opts = opts || {};
  const scale = opts.scale || 1;
  const phase = opts.walkPhase || 0;
  const bodyColor = opts.bodyColor || '#9a9a9a';
  const legColor = opts.legColor || '#5a5a5a';
  const glow = opts.glow;
  const facing = opts.facing || 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * scale, scale);

  if (glow) {
    ctx.shadowColor = '#fff59d';
    ctx.shadowBlur = 25;
  }

  const legSwing = Math.sin(phase) * 10;
  ctx.fillStyle = legColor;
  ctx.fillRect(-14, 20 + legSwing * 0.2, 10, 30 - legSwing);
  ctx.fillRect(4, 20 - legSwing * 0.2, 10, 30 + legSwing);

  ctx.fillStyle = bodyColor;
  ctx.fillRect(-16, -20, 32, 42);

  const armSwing = Math.sin(phase + Math.PI) * 12;
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-24, -18 + armSwing * 0.3, 8, 34);
  ctx.fillRect(16, -18 - armSwing * 0.3, 8, 34);

  ctx.fillStyle = '#ffe066';
  ctx.beginPath();
  ctx.arc(0, -34, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-4, -50, 8, 6);

  ctx.fillStyle = '#333';
  ctx.fillRect(-6, -36, 3, 3);
  ctx.fillRect(3, -36, 3, 3);
  ctx.beginPath();
  ctx.arc(0, -28, 4, 0, Math.PI);
  ctx.stroke();

  if (opts.weapon) {
    ctx.fillStyle = '#666';
    ctx.fillRect(20, -10, 6, 30);
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(18, -14, 10, 8);
  }

  if (opts.cape) {
    ctx.fillStyle = opts.capeColor || '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-16, -18);
    ctx.lineTo(-26, 20 + Math.sin(phase) * 6);
    ctx.lineTo(-16, 20);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
