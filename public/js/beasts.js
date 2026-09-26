// Hand-drawn canvas art for every beast. Each drawer works in a 200-unit space:
// (0, 0) is the ground under the beast, negative y is up, and beasts face left.
const Beasts = (() => {
  const TAU = Math.PI * 2;

  function ell(c, x, y, rx, ry, fill, rot) {
    c.beginPath();
    c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU);
    c.fillStyle = fill;
    c.fill();
  }

  function poly(c, pts, fill) {
    c.beginPath();
    c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }

  function line(c, x0, y0, x1, y1) {
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
  }

  function lin(c, x0, y0, x1, y1, stops) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s));
    return g;
  }

  function rad(c, x, y, r, stops) {
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s));
    return g;
  }

  function eye(c, x, y, r, iris) {
    ell(c, x, y, r, r, '#fff');
    ell(c, x - r * 0.2, y, r * 0.6, r * 0.6, iris);
    ell(c, x - r * 0.25, y, r * 0.28, r * 0.28, '#000');
    ell(c, x - r * 0.45, y - r * 0.3, r * 0.15, r * 0.15, '#fff');
  }

  function glow(c, x, y, r, color, blur) {
    c.save();
    c.shadowColor = color;
    c.shadowBlur = blur || 14;
    ell(c, x, y, r, r * 0.75, color);
    c.restore();
  }

  function flame(c, x, y, r, t) {
    const f = 1 + Math.sin(t * 12) * 0.15;
    c.save();
    c.shadowColor = '#f97316';
    c.shadowBlur = 16;
    c.fillStyle = '#f97316';
    c.beginPath();
    c.moveTo(x - r, y);
    c.quadraticCurveTo(x - r, y - r * 2 * f, x, y - r * 3 * f);
    c.quadraticCurveTo(x + r, y - r * 2 * f, x + r, y);
    c.arc(x, y, r, 0, Math.PI);
    c.fill();
    c.fillStyle = '#fde047';
    c.beginPath();
    c.moveTo(x - r * 0.5, y);
    c.quadraticCurveTo(x - r * 0.5, y - r * f, x, y - r * 1.8 * f);
    c.quadraticCurveTo(x + r * 0.5, y - r * f, x + r * 0.5, y);
    c.arc(x, y, r * 0.5, 0, Math.PI);
    c.fill();
    c.restore();
  }

  function bolt(c, x0, y0, x1, y1) {
    c.beginPath();
    c.moveTo(x0, y0);
    for (let i = 1; i < 5; i++) {
      const u = i / 5;
      c.lineTo(x0 + (x1 - x0) * u + (i % 2 ? 10 : -10), y0 + (y1 - y0) * u);
    }
    c.lineTo(x1, y1);
    c.stroke();
  }

  function rock(c, x, y, r, rot, light, dark) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.beginPath();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      const rr = r * (0.82 + ((i * 37) % 10) / 45);
      c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
    c.fillStyle = rad(c, 0, 0, r, [light || '#a8a29e', dark || '#57534e']);
    c.fill();
    c.strokeStyle = '#1c1917';
    c.lineWidth = 3;
    c.stroke();
    c.restore();
  }

  const DRAW = {
    'Sludge Goblin'(c, t) {
      const b = Math.sin(t * 3) * 3;
      c.fillStyle = '#3f6212';
      c.fillRect(-30, -42, 18, 42);
      c.fillRect(12, -42, 18, 42);
      ell(c, -24, -3, 17, 7, '#365314');
      ell(c, 24, -3, 17, 7, '#365314');
      ell(c, 0, -72 + b, 46, 42, rad(c, 0, -72 + b, 52, ['#a3e635', '#4d7c0f']));
      poly(c, [-40, -46 + b, 40, -46 + b, 26, -20, -26, -20], '#78350f');
      c.strokeStyle = '#65a30d';
      c.lineWidth = 12;
      line(c, -40, -85 + b, -66, -52 + b);
      line(c, 40, -85 + b, 62, -56 + b);
      poly(c, [-66, -52 + b, -104, -78 + b, -72, -44 + b], '#cbd5e1');
      c.fillStyle = '#78350f';
      c.fillRect(-72, -56 + b, 10, 12);
      const hy = -128 + b;
      poly(c, [-28, hy - 6, -84, hy - 34, -34, hy + 12], '#84cc16');
      poly(c, [28, hy - 6, 84, hy - 34, 34, hy + 12], '#84cc16');
      ell(c, 0, hy, 36, 32, rad(c, 0, hy, 40, ['#bef264', '#65a30d']));
      eye(c, -14, hy - 6, 9, '#facc15');
      eye(c, 14, hy - 6, 9, '#facc15');
      c.fillStyle = '#1a2e05';
      c.beginPath();
      c.ellipse(0, hy + 13, 17, 8, 0, 0, Math.PI);
      c.fill();
      poly(c, [-9, hy + 13, -5, hy + 21, -1, hy + 13], '#fef9c3');
      poly(c, [4, hy + 13, 8, hy + 20, 12, hy + 13], '#fef9c3');
      for (let i = 0; i < 4; i++) {
        const drip = 8 + ((t * 18 + i * 13) % 22);
        ell(c, -30 + i * 20, -44 + drip * 0.5 + b, 4, drip * 0.5, 'rgba(132,204,22,0.85)');
      }
    },

    'Rock Golem'(c, t) {
      const b = Math.sin(t * 1.5) * 2;
      rock(c, -32, -26, 28, 0.2);
      rock(c, 32, -26, 28, -0.3);
      rock(c, 0, -98 + b, 62, 0.1);
      rock(c, -76, -112 + b, 30, 0.5);
      rock(c, 76, -112 + b, 30, -0.4);
      rock(c, -88, -60 + b, 27, 1);
      rock(c, 88, -60 + b, 27, 0.3);
      rock(c, 0, -170 + b, 32, 0.3);
      c.save();
      c.shadowColor = '#f97316';
      c.shadowBlur = 12;
      c.strokeStyle = '#fb923c';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-22, -125 + b); c.lineTo(-6, -104 + b); c.lineTo(-16, -84 + b); c.lineTo(4, -66 + b);
      c.moveTo(26, -120 + b); c.lineTo(14, -98 + b); c.lineTo(30, -80 + b);
      c.stroke();
      ell(c, -12, -172 + b, 7, 4, '#fdba74');
      ell(c, 12, -172 + b, 7, 4, '#fdba74');
      c.fillStyle = '#fb923c';
      c.fillRect(-10, -156 + b, 20, 3);
      c.restore();
      ell(c, -4, -198 + b, 18, 6, '#4d7c0f');
      ell(c, 44, -136 + b, 11, 4, '#4d7c0f');
      ell(c, -60, -128 + b, 9, 4, '#65a30d');
    },

    'Shadow Wolf'(c, t) {
      const b = Math.sin(t * 4) * 2;
      for (let i = 0; i < 6; i++) {
        const a = (t * 0.8 + i / 6) % 1;
        c.globalAlpha = 0.45 * (1 - a);
        ell(c, 70 - i * 22 + Math.sin(i + t) * 8, -70 - a * 90, 10 + a * 12, 10 + a * 12, '#7c3aed');
      }
      c.globalAlpha = 1;
      c.fillStyle = '#1e1b4b';
      c.beginPath();
      c.moveTo(62, -88 + b);
      c.quadraticCurveTo(128, -118 + Math.sin(t * 3) * 10, 112, -152);
      c.quadraticCurveTo(104, -104, 56, -70 + b);
      c.fill();
      poly(c, [40, -64, 62, -64, 66, 0, 46, 0], '#1e1b4b');
      poly(c, [18, -58, 38, -58, 34, 0, 20, 0], '#312e81');
      poly(c, [-52, -64, -32, -64, -36, 0, -54, 0], '#1e1b4b');
      poly(c, [-30, -62, -14, -62, -18, 0, -32, 0], '#312e81');
      ell(c, 6, -80 + b, 72, 34, lin(c, 0, -115, 0, -45, ['#3730a3', '#0f0a2e']));
      for (let i = 0; i < 5; i++) poly(c, [-30 + i * 20, -108 + b, -20 + i * 20, -124 + b, -12 + i * 20, -108 + b], '#1e1b4b');
      poly(c, [-56, -100 + b, -74, -52 + b, -40, -64 + b], '#312e81');
      const hx = -72, hy = -110 + b;
      ell(c, hx, hy, 32, 26, '#1e1b4b');
      poly(c, [hx - 18, hy - 8, hx - 72, hy + 6, hx - 68, hy + 20, hx - 14, hy + 24], '#1e1b4b');
      poly(c, [hx - 4, hy - 20, hx + 6, hy - 58, hx + 18, hy - 18], '#312e81');
      poly(c, [hx + 12, hy - 18, hx + 30, hy - 52, hx + 32, hy - 8], '#1e1b4b');
      ell(c, hx - 70, hy + 8, 6, 5, '#000');
      for (let i = 0; i < 4; i++) poly(c, [hx - 62 + i * 11, hy + 20, hx - 58 + i * 11, hy + 31, hx - 54 + i * 11, hy + 20], '#e5e7eb');
      glow(c, hx - 20, hy - 5, 6, '#ef4444', 18);
    },

    'Iron Bandit'(c, t) {
      const b = Math.sin(t * 2) * 2;
      c.fillStyle = '#374151';
      c.fillRect(-30, -72, 22, 72);
      c.fillRect(8, -72, 22, 72);
      c.fillStyle = '#111827';
      c.fillRect(-34, -12, 28, 12);
      c.fillRect(6, -12, 28, 12);
      c.fillStyle = lin(c, -45, 0, 45, 0, ['#6b7280', '#e5e7eb', '#6b7280']);
      c.fillRect(-45, -152 + b, 90, 86);
      c.strokeStyle = '#374151';
      c.lineWidth = 3;
      c.strokeRect(-45, -152 + b, 90, 86);
      [[-38, -145], [38, -145], [-38, -74], [38, -74]].forEach(([x, y]) => ell(c, x, y + b, 3, 3, '#374151'));
      c.strokeStyle = '#92400e';
      c.lineWidth = 8;
      line(c, -40, -148 + b, 40, -84 + b);
      c.fillStyle = '#78350f';
      c.fillRect(-46, -82 + b, 92, 10);
      c.fillStyle = '#facc15';
      c.fillRect(-8, -84 + b, 16, 14);
      c.fillStyle = '#9ca3af';
      c.fillRect(-66, -148 + b, 20, 62);
      c.fillRect(46, -148 + b, 20, 62);
      ell(c, -56, -150 + b, 17, 12, '#6b7280');
      ell(c, 56, -150 + b, 17, 12, '#6b7280');
      c.fillStyle = '#1f2937';
      c.fillRect(-100, -96 + b, 44, 10);
      c.fillRect(-66, -90 + b, 8, 20);
      c.fillStyle = '#78350f';
      c.fillRect(-104, -100 + b, 8, 18);
      const hy = -184 + b;
      c.fillStyle = lin(c, -28, 0, 28, 0, ['#4b5563', '#e5e7eb', '#4b5563']);
      c.beginPath();
      c.roundRect(-28, hy - 30, 56, 60, [26, 26, 6, 6]);
      c.fill();
      poly(c, [-29, hy + 5, 29, hy + 5, 26, hy + 30, 0, hy + 40, -26, hy + 30], '#dc2626');
      poly(c, [26, hy + 8, 50, hy + 20 + Math.sin(t * 5) * 5, 40, hy + 32], '#b91c1c');
      c.fillStyle = '#111';
      c.fillRect(-22, hy - 9, 44, 9);
      glow(c, -10, hy - 4, 3, '#fde047');
      glow(c, 10, hy - 4, 3, '#fde047');
      c.fillStyle = '#6b7280';
      c.fillRect(-3, hy - 40, 6, 12);
    },

    'Swamp Troll'(c, t) {
      const b = Math.sin(t * 1.8) * 3;
      c.fillStyle = '#4d5a2a';
      c.fillRect(-46, -62, 30, 62);
      c.fillRect(16, -62, 30, 62);
      ell(c, -31, -3, 23, 8, '#3f4a22');
      ell(c, 31, -3, 23, 8, '#3f4a22');
      ell(c, 0, -108 + b, 72, 64, rad(c, 0, -108 + b, 76, ['#8fae62', '#3f5a2a']));
      ell(c, 0, -92 + b, 44, 38, '#a3b77a');
      c.strokeStyle = '#5f7a3a';
      c.lineWidth = 24;
      line(c, -60, -134 + b, -92, -72 + b);
      line(c, 60, -134 + b, 82, -62 + b);
      c.save();
      c.translate(-94, -72 + b);
      c.rotate(-0.5 + Math.sin(t * 1.8) * 0.12);
      poly(c, [-6, 0, 6, 0, 14, -88, -14, -88], '#78350f');
      ell(c, 0, -96, 21, 17, '#92400e');
      for (let i = 0; i < 5; i++) poly(c, [-18 + i * 9, -106, -14 + i * 9, -122, -10 + i * 9, -106], '#d6d3d1');
      c.restore();
      const hy = -180 + b;
      ell(c, 0, hy, 40, 32, '#6b8a45');
      ell(c, -14, hy - 6, 7, 6, '#fde68a');
      ell(c, 14, hy - 6, 7, 6, '#fde68a');
      ell(c, -15, hy - 6, 3, 3, '#000');
      ell(c, 13, hy - 6, 3, 3, '#000');
      c.fillStyle = '#4d5a2a';
      c.fillRect(-26, hy - 19, 52, 7);
      ell(c, 0, hy + 4, 10, 7, '#556b2f');
      c.fillStyle = '#1c1917';
      c.fillRect(-20, hy + 14, 40, 8);
      poly(c, [-18, hy + 20, -12, hy + 2, -7, hy + 20], '#fef3c7');
      poly(c, [7, hy + 20, 12, hy + 2, 18, hy + 20], '#fef3c7');
      ell(c, -18, hy - 30, 18, 7, '#365314');
      ell(c, 42, -154 + b, 14, 6, '#365314');
      ell(c, -48, -80 + b, 10, 4, '#365314');
      for (let i = 0; i < 3; i++) ell(c, 30 + i * 10, -150 + b + ((t * 25 + i * 9) % 30), 2.5, 4, '#4d7c0f');
    },

    'Fire Imp'(c, t) {
      const y0 = -96 + Math.sin(t * 4) * 8;
      flame(c, 72, y0 - 18, 11, t + 1);
      c.fillStyle = '#7f1d1d';
      [-1, 1].forEach(s => {
        const flap = Math.sin(t * 10) * 10;
        c.beginPath();
        c.moveTo(s * 15, y0 - 20);
        c.quadraticCurveTo(s * 80, y0 - 84 + flap, s * 88, y0 - 10);
        c.lineTo(s * 66, y0 - 24);
        c.lineTo(s * 56, y0);
        c.lineTo(s * 40, y0 - 14);
        c.closePath();
        c.fill();
      });
      const sw = Math.sin(t * 3) * 10;
      c.strokeStyle = '#dc2626';
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(10, y0 + 25);
      c.quadraticCurveTo(52, y0 + 58, 40 + sw, y0 + 80);
      c.stroke();
      poly(c, [32 + sw, y0 + 78, 52 + sw, y0 + 82, 40 + sw, y0 + 96], '#dc2626');
      ell(c, 0, y0 + 10, 26, 30, rad(c, 0, y0 + 10, 32, ['#f87171', '#b91c1c']));
      c.strokeStyle = '#b91c1c';
      c.lineWidth = 7;
      line(c, -10, y0 + 35, -16, y0 + 56);
      line(c, 10, y0 + 35, 16, y0 + 56);
      c.lineWidth = 6;
      line(c, -20, y0, -38, y0 + 6);
      ell(c, 0, y0 - 30, 26, 24, rad(c, 0, y0 - 30, 28, ['#fca5a5', '#dc2626']));
      poly(c, [-18, y0 - 44, -32, y0 - 80, -8, y0 - 50], '#fbbf24');
      poly(c, [18, y0 - 44, 32, y0 - 80, 8, y0 - 50], '#fbbf24');
      glow(c, -9, y0 - 32, 5, '#fde047');
      glow(c, 9, y0 - 32, 5, '#fde047');
      c.strokeStyle = '#450a0a';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, y0 - 24, 10, 0.2, Math.PI - 0.2);
      c.stroke();
      flame(c, -42, y0 + 4, 10, t * 1.3);
    },

    'Storm Serpent'(c, t) {
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const u = i / 24;
        pts.push([92 - u * 150, -20 - u * 140 + Math.sin(u * 9 - t * 3) * 20 * (1 - u * 0.5)]);
      }
      pts.forEach(([x, y], i) => {
        const r = 8 + i * 0.9;
        ell(c, x, y, r, r, i % 2 ? '#1d4ed8' : '#2563eb');
        if (i % 3 === 0) poly(c, [x - 4, y - r, x, y - r - 12, x + 6, y - r], '#7dd3fc');
      });
      pts.forEach(([x, y], i) => {
        if (i % 2) return;
        const r = 8 + i * 0.9;
        ell(c, x, y + r * 0.45, r * 0.6, r * 0.3, '#93c5fd');
      });
      const [hx, hy] = pts[pts.length - 1];
      poly(c, [hx + 4, hy - 14, hx + 32, hy - 46, hx + 22, hy - 8], '#7dd3fc');
      poly(c, [hx - 6, hy - 18, hx + 10, hy - 52, hx + 8, hy - 14], '#38bdf8');
      ell(c, hx - 12, hy, 34, 22, rad(c, hx - 12, hy, 36, ['#3b82f6', '#1e3a8a']));
      poly(c, [hx - 40, hy + 4, hx - 58, hy + 14, hx - 24, hy + 18], '#1e3a8a');
      poly(c, [hx - 42, hy + 6, hx - 38, hy + 14, hx - 34, hy + 6], '#fff');
      poly(c, [hx - 30, hy + 8, hx - 26, hy + 16, hx - 22, hy + 8], '#fff');
      glow(c, hx - 24, hy - 7, 5, '#fef08a', 18);
      if (Math.sin(t * 7) > 0.3) {
        c.save();
        c.strokeStyle = '#fef08a';
        c.shadowColor = '#fef08a';
        c.shadowBlur = 12;
        c.lineWidth = 3;
        bolt(c, hx + 40, hy - 60, hx + 8, hy - 6);
        bolt(c, 50, -150, 64, -60);
        c.restore();
      }
    },

    'Bone Reaper'(c, t) {
      const b = Math.sin(t * 2) * 5;
      c.strokeStyle = '#57534e';
      c.lineWidth = 6;
      line(c, -72, -8 + b, -42, -212 + b);
      c.fillStyle = lin(c, -150, -200, -40, -200, ['#94a3b8', '#f1f5f9']);
      c.beginPath();
      c.moveTo(-40, -212 + b);
      c.quadraticCurveTo(-122, -224 + b, -152, -160 + b);
      c.quadraticCurveTo(-112, -196 + b, -46, -196 + b);
      c.closePath();
      c.fill();
      c.fillStyle = lin(c, 0, -170, 0, 0, ['#27272a', '#09090b']);
      c.beginPath();
      c.moveTo(-30, -160 + b);
      c.lineTo(30, -160 + b);
      c.lineTo(60, -10);
      for (let i = 0; i < 5; i++) c.lineTo(48 - i * 24, (i % 2 ? -22 : 0) + Math.sin(t * 4 + i) * 4);
      c.lineTo(-60, -10);
      c.closePath();
      c.fill();
      c.strokeStyle = '#d6d3d1';
      c.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.arc(0, -128 + b + i * 10, 16 - i * 2, Math.PI * 0.15, Math.PI * 0.85);
        c.stroke();
      }
      ell(c, 0, -168 + b, 34, 40, '#18181b');
      ell(c, -4, -164 + b, 20, 22, '#f5f5f4');
      ell(c, -11, -168 + b, 6, 7, '#000');
      ell(c, 4, -168 + b, 6, 7, '#000');
      glow(c, -11, -168 + b, 2.5, '#22d3ee', 16);
      glow(c, 4, -168 + b, 2.5, '#22d3ee', 16);
      poly(c, [-4, -158 + b, -1, -152 + b, -8, -152 + b], '#000');
      c.fillStyle = '#000';
      for (let i = 0; i < 5; i++) c.fillRect(-14 + i * 5, -148 + b, 3, 6);
      c.strokeStyle = '#f5f5f4';
      c.lineWidth = 4;
      line(c, -26, -118 + b, -58, -108 + b);
      line(c, -26, -104 + b, -62, -70 + b);
      ell(c, -60, -108 + b, 6, 5, '#f5f5f4');
      ell(c, -64, -70 + b, 6, 5, '#f5f5f4');
    },

    'Void Wraith'(c, t) {
      const y0 = -124 + Math.sin(t * 2) * 10;
      c.save();
      c.shadowColor = '#a855f7';
      c.shadowBlur = 30;
      c.fillStyle = lin(c, 0, y0 - 75, 0, y0 + 100, ['#3b2f8f', '#1e1b4b', 'rgba(30,27,75,0.1)']);
      c.beginPath();
      c.moveTo(0, y0 - 76);
      c.bezierCurveTo(56, y0 - 76, 60, y0 - 10, 56, y0 + 40);
      for (let i = 0; i <= 6; i++) c.lineTo(56 - (i * 112) / 6, y0 + 70 + (i % 2 ? -22 : 14) + Math.sin(t * 5 + i) * 10);
      c.bezierCurveTo(-60, y0 - 10, -56, y0 - 76, 0, y0 - 76);
      c.fill();
      c.restore();
      c.strokeStyle = '#312e81';
      c.lineWidth = 10;
      const reach = Math.sin(t * 3) * 10;
      c.beginPath();
      c.moveTo(-40, y0 - 8);
      c.quadraticCurveTo(-82, y0 - 30, -102, y0 + reach);
      c.stroke();
      c.strokeStyle = '#c4b5fd';
      c.lineWidth = 3;
      for (let i = -1; i <= 1; i++) line(c, -102, y0 + reach, -118, y0 + reach + i * 9);
      c.save();
      c.translate(0, y0 + 12);
      c.rotate(t * 2);
      ['#c084fc', '#7c3aed', '#e9d5ff'].forEach((col, i) => {
        c.strokeStyle = col;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(0, 0, 8 + i * 7, i, i + Math.PI * 1.3);
        c.stroke();
      });
      c.restore();
      glow(c, -16, y0 - 40, 8, '#e879f9', 22);
      glow(c, 12, y0 - 40, 8, '#e879f9', 22);
      ell(c, -2, y0 - 16, 10, 6 + Math.sin(t * 3) * 3, '#0b0620');
    },

    'Toxic Slime'(c, t) {
      const sq = Math.sin(t * 3);
      const w = 86 + sq * 8, h = 82 - sq * 8;
      ell(c, 0, 0, w + 20, 10, 'rgba(132,204,22,0.55)');
      c.save();
      c.shadowColor = '#84cc16';
      c.shadowBlur = 22;
      c.fillStyle = rad(c, 0, -h * 0.6, w, ['#d9f99d', '#84cc16', '#3f6212']);
      c.beginPath();
      c.moveTo(-w, 0);
      c.bezierCurveTo(-w, -h * 1.6, w, -h * 1.6, w, 0);
      c.closePath();
      c.fill();
      c.restore();
      c.globalAlpha = 0.35;
      ell(c, 26, -42, 16, 14, '#fff');
      c.fillRect(19, -32, 14, 8);
      ell(c, 20, -44, 4, 4, '#000');
      ell(c, 32, -44, 4, 4, '#000');
      c.globalAlpha = 1;
      for (let i = 0; i < 6; i++) {
        const u = (t * 0.4 + i / 6) % 1;
        const r = 3 + (i % 3) * 2;
        ell(c, -50 + i * 20 + Math.sin(t + i) * 5, -10 - u * h * 1.05, r, r, `rgba(236,252,203,${0.8 * (1 - u)})`);
      }
      eye(c, -26, -h * 0.95, 13, '#be123c');
      eye(c, 6, -h * 1.02, 10, '#be123c');
      c.fillStyle = '#1a2e05';
      c.beginPath();
      c.ellipse(-12, -h * 0.55, 22, 11, 0, 0, Math.PI);
      c.fill();
      poly(c, [-26, -h * 0.55, -22, -h * 0.55 + 7, -18, -h * 0.55], '#ecfccb');
      poly(c, [-4, -h * 0.55, 0, -h * 0.55 + 6, 4, -h * 0.55], '#ecfccb');
    },

    'Rogue Drone'(c, t) {
      const y0 = -124 + Math.sin(t * 3) * 8;
      ell(c, 0, y0 + 46, 22, 6, 'rgba(56,189,248,0.5)');
      c.strokeStyle = '#475569';
      c.lineWidth = 8;
      line(c, -72, y0 - 30, 72, y0 - 30);
      [-76, 76].forEach(x => {
        c.fillStyle = '#334155';
        c.fillRect(x - 6, y0 - 42, 12, 16);
        const spin = Math.abs(Math.sin(t * 40)) * 36 + 6;
        ell(c, x, y0 - 45, spin, 4, 'rgba(203,213,225,0.75)');
      });
      c.fillStyle = lin(c, 0, y0 - 40, 0, y0 + 36, ['#94a3b8', '#334155']);
      c.beginPath();
      c.roundRect(-46, y0 - 36, 92, 66, 18);
      c.fill();
      c.save();
      c.beginPath();
      c.rect(-46, y0 + 18, 92, 10);
      c.clip();
      for (let i = 0; i < 7; i++) poly(c, [-50 + i * 16, y0 + 28, -42 + i * 16, y0 + 18, -34 + i * 16, y0 + 18, -42 + i * 16, y0 + 28], '#facc15');
      c.restore();
      ell(c, -10, y0 - 4, 21, 21, '#0f172a');
      glow(c, -13, y0 - 4, 9, '#ef4444', 24);
      ell(c, -16, y0 - 8, 3, 3, '#fecaca');
      c.strokeStyle = '#64748b';
      c.lineWidth = 3;
      line(c, 22, y0 - 36, 32, y0 - 66);
      ell(c, 32, y0 - 68, 4, 4, Math.sin(t * 6) > 0 ? '#ef4444' : '#7f1d1d');
      c.fillStyle = '#1e293b';
      c.fillRect(-64, y0 + 30, 52, 10);
      c.fillRect(-22, y0 + 28, 14, 16);
    },

    'Frost Yeti'(c, t) {
      const b = Math.sin(t * 1.6) * 3;
      ell(c, -32, -26, 24, 30, '#e2e8f0');
      ell(c, 32, -26, 24, 30, '#e2e8f0');
      ell(c, 0, -112 + b, 70, 70, rad(c, 0, -112 + b, 74, ['#ffffff', '#cbd5e1']));
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * 0.6 + (i / 8) * Math.PI * 1.8;
        const x = Math.cos(a) * 68, y = -112 + b + Math.sin(a) * 68;
        poly(c, [x - 8, y, x + Math.cos(a) * 14, y + Math.sin(a) * 14, x + 8, y], '#f1f5f9');
      }
      ell(c, -74, -96 + b, 21, 50, '#f1f5f9', 0.3);
      ell(c, 74, -96 + b, 21, 50, '#f1f5f9', -0.3);
      [-1, 0, 1].forEach(i => {
        poly(c, [-90 + i * 8, -52 + b, -86 + i * 8, -38 + b, -82 + i * 8, -52 + b], '#475569');
        poly(c, [90 + i * 8, -52 + b, 86 + i * 8, -38 + b, 82 + i * 8, -52 + b], '#475569');
      });
      const hy = -188 + b;
      c.strokeStyle = '#64748b';
      c.lineWidth = 9;
      [-1, 1].forEach(s => {
        c.beginPath();
        c.moveTo(s * 28, hy - 20);
        c.quadraticCurveTo(s * 64, hy - 28, s * 52, hy - 62);
        c.stroke();
      });
      ell(c, 0, hy, 42, 38, '#f8fafc');
      ell(c, 0, hy + 6, 28, 24, '#7dd3fc');
      ell(c, -10, hy, 5, 5, '#0c4a6e');
      ell(c, 10, hy, 5, 5, '#0c4a6e');
      poly(c, [-28, hy - 10, 0, hy - 4, 28, hy - 10, 28, hy - 18, -28, hy - 18], '#e2e8f0');
      c.fillStyle = '#0c4a6e';
      c.beginPath();
      c.ellipse(0, hy + 14, 14, 9, 0, 0, Math.PI);
      c.fill();
      poly(c, [-10, hy + 14, -7, hy + 22, -4, hy + 14], '#fff');
      poly(c, [4, hy + 14, 7, hy + 22, 10, hy + 14], '#fff');
      [[-40, -44], [-20, -44], [30, -44], [50, -44]].forEach(([x, y]) => poly(c, [x - 4, y + b, x, y + 14 + b, x + 4, y + b], '#bae6fd'));
      for (let i = 0; i < 10; i++) {
        ell(c, ((i * 47 + t * 18) % 240) - 120, ((i * 31 + t * 40) % 240) - 230, 2, 2, '#fff');
      }
    },

    'Sand Viper'(c, t) {
      const sway = Math.sin(t * 2) * 8;
      for (let i = 0; i < 3; i++) {
        const cy = -18 - i * 22, rx = 82 - i * 18;
        ell(c, 0, cy, rx, 22, i % 2 ? '#d6a35c' : '#c28a45');
        for (let j = -2; j <= 2; j++) {
          const x = j * rx * 0.35;
          poly(c, [x - 7, cy, x, cy - 8, x + 7, cy, x, cy + 8], '#7c4a1c');
        }
      }
      c.strokeStyle = '#c28a45';
      c.lineWidth = 28;
      c.beginPath();
      c.moveTo(0, -74);
      c.quadraticCurveTo(44, -124 + sway, -20 + sway, -168);
      c.stroke();
      const hx = -24 + sway, hy = -176;
      ell(c, hx, hy + 12, 42, 52, '#b07535');
      ell(c, hx, hy + 18, 22, 38, '#f5deb3');
      ell(c, hx - 26, hy, 6, 8, '#3f2a14');
      ell(c, hx + 26, hy, 6, 8, '#3f2a14');
      ell(c, hx - 10, hy - 36, 26, 18, '#c28a45');
      ell(c, hx - 20, hy - 42, 6, 6, '#facc15');
      ell(c, hx - 20, hy - 42, 1.5, 5, '#000');
      c.fillStyle = '#3f1d0b';
      c.beginPath();
      c.moveTo(hx - 34, hy - 34);
      c.lineTo(hx - 58, hy - 30);
      c.lineTo(hx - 34, hy - 22);
      c.closePath();
      c.fill();
      poly(c, [hx - 40, hy - 34, hx - 38, hy - 22, hx - 36, hy - 33], '#fff');
      if (Math.sin(t * 5) > 0) {
        c.strokeStyle = '#dc2626';
        c.lineWidth = 3;
        line(c, hx - 50, hy - 30, hx - 72, hy - 30);
        line(c, hx - 72, hy - 30, hx - 80, hy - 36);
        line(c, hx - 72, hy - 30, hx - 80, hy - 24);
      }
    },

    'Molten Brute'(c, t) {
      const b = Math.sin(t * 2) * 3;
      c.fillStyle = '#1c1917';
      c.fillRect(-48, -64, 34, 64);
      c.fillRect(14, -64, 34, 64);
      poly(c, [-82, -172 + b, 82, -172 + b, 52, -62, -52, -62], '#292524');
      c.strokeStyle = '#1c1917';
      c.lineWidth = 30;
      line(c, -74, -160 + b, -98, -84 + b);
      line(c, 74, -160 + b, 96, -84 + b);
      ell(c, -100, -70 + b, 32, 28, '#1c1917');
      ell(c, 98, -70 + b, 30, 26, '#1c1917');
      c.save();
      c.shadowColor = '#f97316';
      c.shadowBlur = 14;
      c.strokeStyle = '#fb923c';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(-50, -160 + b); c.lineTo(-20, -130 + b); c.lineTo(-34, -100 + b); c.lineTo(-10, -72 + b);
      c.moveTo(40, -165 + b); c.lineTo(18, -128 + b); c.lineTo(36, -96 + b);
      c.moveTo(-86, -160 + b); c.lineTo(-96, -100 + b);
      c.stroke();
      [-114, -100, -86].forEach(x => ell(c, x, -62 + b, 4, 3, '#fdba74'));
      c.restore();
      ell(c, 0, -190 + b, 28, 25, '#1c1917');
      flame(c, 0, -208 + b, 18, t);
      glow(c, -10, -192 + b, 5, '#fde047', 18);
      glow(c, 10, -192 + b, 5, '#fde047', 18);
      c.save();
      c.shadowColor = '#f97316';
      c.shadowBlur = 10;
      c.fillStyle = '#f97316';
      c.fillRect(-12, -178 + b, 24, 4);
      c.restore();
      for (let i = 0; i < 3; i++) {
        const d = (t * 40 + i * 20) % 60;
        ell(c, -112 + i * 12, -44 + b + d, 3, 4, `rgba(249,115,22,${1 - d / 60})`);
      }
    },

    'Crystal Spider'(c, t) {
      const b = Math.sin(t * 3) * 3;
      poly(c, [36, -60 + b, 68, -118 + b, 116, -90 + b, 108, -40 + b, 62, -28 + b], lin(c, 40, -120, 110, -30, ['#cffafe', '#22d3ee', '#0e7490']));
      c.strokeStyle = 'rgba(255,255,255,0.6)';
      c.lineWidth = 2;
      line(c, 68, -118 + b, 76, -60 + b);
      line(c, 76, -60 + b, 116, -90 + b);
      line(c, 76, -60 + b, 62, -28 + b);
      c.strokeStyle = '#0e7490';
      c.lineWidth = 7;
      [-1, 1].forEach(s => {
        for (let i = 0; i < 4; i++) {
          const step = Math.sin(t * 6 + i + (s > 0 ? 1.5 : 0)) * 5;
          c.beginPath();
          c.moveTo(s * 18 - 10, -64 + b + i * 5);
          c.lineTo(s * (52 + i * 14) - 10, -124 + i * 12 + b + step);
          c.lineTo(s * (74 + i * 22) - 10, 0);
          c.stroke();
        }
      });
      ell(c, -10, -66 + b, 40, 30, rad(c, -10, -66 + b, 42, ['#a5f3fc', '#0891b2', '#164e63']));
      [[-20, -92, 12], [0, -96, 16], [18, -88, 11]].forEach(([x, y, h]) => poly(c, [x - 6, y + b, x, y - h + b, x + 6, y + b], 'rgba(103,232,249,0.9)'));
      [[-38, -76], [-30, -80], [-40, -66], [-30, -68], [-22, -74], [-24, -64]].forEach(([x, y], i) => glow(c, x, y + b, i < 2 ? 4 : 3, '#e879f9', 10));
      poly(c, [-44, -48 + b, -40, -32 + b, -36, -48 + b], '#e0f2fe');
      poly(c, [-30, -46 + b, -28, -30 + b, -24, -46 + b], '#e0f2fe');
      for (let i = 0; i < 4; i++) {
        const a = (t * 1.5 + i * 0.7) % 1;
        c.globalAlpha = 1 - a;
        const sx = -60 + i * 45, sy = -150 + i * 20;
        poly(c, [sx, sy - 6, sx + 2, sy, sx, sy + 6, sx - 2, sy], '#fff');
        poly(c, [sx - 6, sy, sx, sy - 2, sx + 6, sy, sx, sy + 2], '#fff');
      }
      c.globalAlpha = 1;
    },

    'Grimjaw the Cruel'(c, t) {
      const b = Math.sin(t * 1.5) * 3;
      c.fillStyle = '#4b3f52';
      c.fillRect(-56, -70, 40, 70);
      c.fillRect(16, -70, 40, 70);
      ell(c, 0, -120 + b, 90, 76, rad(c, 0, -120 + b, 92, ['#8b7a94', '#4b3f52']));
      c.fillStyle = '#44403c';
      c.fillRect(-90, -84 + b, 180, 16);
      [-1, 1].forEach(s => {
        ell(c, s * 78, -170 + b, 32, 22, '#71717a');
        for (let i = 0; i < 3; i++) poly(c, [s * (60 + i * 16), -186 + b, s * (66 + i * 16), -216 + b, s * (72 + i * 16), -186 + b], '#d4d4d8');
      });
      c.strokeStyle = '#6b5b73';
      c.lineWidth = 30;
      line(c, 70, -150 + b, 98, -80 + b);
      line(c, -70, -150 + b, -96, -100 + b);
      const swing = Math.sin(t * 2.2) * 0.5;
      const fx = -96 + Math.cos(Math.PI * 0.75 + swing) * 70, fy = -100 + b - Math.sin(Math.PI * 0.75 + swing) * 70;
      c.strokeStyle = '#a1a1aa';
      c.lineWidth = 4;
      c.setLineDash([6, 4]);
      line(c, -96, -100 + b, fx, fy);
      c.setLineDash([]);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + t;
        poly(c, [fx + Math.cos(a - 0.3) * 18, fy + Math.sin(a - 0.3) * 18, fx + Math.cos(a) * 32, fy + Math.sin(a) * 32, fx + Math.cos(a + 0.3) * 18, fy + Math.sin(a + 0.3) * 18], '#9ca3af');
      }
      ell(c, fx, fy, 20, 20, rad(c, fx, fy, 22, ['#a1a1aa', '#3f3f46']));
      const hy = -206 + b;
      ell(c, 0, hy, 46, 36, '#7c6a85');
      c.fillStyle = '#5b4a63';
      c.beginPath();
      c.roundRect(-54, hy + 4, 108, 44, 18);
      c.fill();
      for (let i = 0; i < 5; i++) poly(c, [-44 + i * 20, hy + 10, -38 + i * 20, hy - 2 - (i % 2) * 4, -32 + i * 20, hy + 10], '#d4d4d8');
      poly(c, [-50, hy + 8, -44, hy - 14, -36, hy + 8], '#fef3c7');
      poly(c, [36, hy + 8, 44, hy - 14, 50, hy + 8], '#fef3c7');
      c.strokeStyle = '#2e2533';
      c.lineWidth = 6;
      line(c, -30, hy - 34, -6, hy - 26);
      line(c, 30, hy - 34, 6, hy - 26);
      glow(c, -16, hy - 20, 5, '#ef4444', 20);
      glow(c, 16, hy - 20, 5, '#ef4444', 20);
      c.strokeStyle = '#fca5a5';
      c.lineWidth = 3;
      line(c, 20, hy - 34, 34, hy + 2);
      for (let i = -1; i <= 1; i++) line(c, 22 + i * 0, hy - 26 + i * 10, 34, hy - 30 + i * 10);
    },

    'Obsidian Warlord'(c, t) {
      const b = Math.sin(t * 1.6) * 2;
      const wave = Math.sin(t * 3) * 8;
      c.fillStyle = lin(c, 0, -190, 0, 0, ['#991b1b', '#450a0a']);
      c.beginPath();
      c.moveTo(-50, -178 + b);
      c.lineTo(50, -178 + b);
      c.quadraticCurveTo(90 + wave, -90, 80 + wave, -6);
      c.lineTo(-40 + wave, -6);
      c.closePath();
      c.fill();
      c.fillStyle = '#18181b';
      c.fillRect(-40, -76, 30, 76);
      c.fillRect(10, -76, 30, 76);
      c.fillStyle = lin(c, -55, 0, 55, 0, ['#09090b', '#52525b', '#09090b']);
      poly(c, [-58, -180 + b, 58, -180 + b, 44, -76 + b, -44, -76 + b], c.fillStyle);
      [-1, 1].forEach(s => {
        ell(c, s * 66, -176 + b, 28, 20, '#27272a');
        poly(c, [s * 56, -190 + b, s * 90, -214 + b, s * 80, -178 + b], '#3f3f46');
      });
      c.save();
      c.shadowColor = '#ef4444';
      c.shadowBlur = 12;
      c.strokeStyle = '#f87171';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(0, -168 + b); c.lineTo(-14, -140 + b); c.lineTo(0, -112 + b); c.lineTo(14, -140 + b); c.closePath();
      c.moveTo(0, -112 + b); c.lineTo(0, -86 + b);
      c.stroke();
      c.restore();
      c.save();
      c.translate(-70, -120 + b);
      c.rotate(-0.55 + Math.sin(t * 1.6) * 0.08);
      c.fillStyle = '#78350f';
      c.fillRect(-5, -10, 10, 40);
      c.fillStyle = '#a16207';
      c.fillRect(-24, -14, 48, 8);
      c.shadowColor = '#dc2626';
      c.shadowBlur = 14;
      poly(c, [-12, -14, 12, -14, 8, -150, 0, -170, -8, -150], lin(c, -12, 0, 12, 0, ['#18181b', '#71717a', '#18181b']));
      c.restore();
      c.strokeStyle = '#27272a';
      c.lineWidth = 20;
      line(c, -54, -166 + b, -70, -120 + b);
      const hy = -214 + b;
      c.strokeStyle = '#d4d4d8';
      c.lineWidth = 8;
      [-1, 1].forEach(s => {
        c.beginPath();
        c.moveTo(s * 22, hy - 16);
        c.quadraticCurveTo(s * 70, hy - 20, s * 60, hy - 64);
        c.stroke();
      });
      c.fillStyle = lin(c, -30, 0, 30, 0, ['#09090b', '#3f3f46', '#09090b']);
      c.beginPath();
      c.roundRect(-30, hy - 32, 60, 66, [28, 28, 10, 10]);
      c.fill();
      c.save();
      c.shadowColor = '#ef4444';
      c.shadowBlur = 18;
      c.fillStyle = '#ef4444';
      c.fillRect(-22, hy - 6, 44, 6);
      c.fillRect(-3, hy - 6, 6, 26);
      c.restore();
    },

    'The Hollow King'(c, t) {
      const b = Math.sin(t * 1.8) * 6;
      c.fillStyle = lin(c, 0, -180, 0, 0, ['#581c87', '#2e1065']);
      c.beginPath();
      c.moveTo(-34, -168 + b);
      c.lineTo(34, -168 + b);
      c.lineTo(76, -6);
      for (let i = 0; i < 6; i++) c.lineTo(62 - i * 26, (i % 2 ? -16 : 0) + Math.sin(t * 3 + i) * 4);
      c.lineTo(-76, -6);
      c.closePath();
      c.fill();
      c.strokeStyle = '#facc15';
      c.lineWidth = 5;
      line(c, -34, -168 + b, -76, -6);
      line(c, 34, -168 + b, 76, -6);
      ell(c, 0, -118 + b, 26, 44, '#0b0616');
      ell(c, 0, -176 + b, 40, 44, '#3b0764');
      ell(c, 0, -170 + b, 28, 32, '#05020a');
      glow(c, -11, -174 + b, 6, '#38bdf8', 24);
      glow(c, 11, -174 + b, 6, '#38bdf8', 24);
      for (let i = 0; i < 5; i++) {
        const a = (t * 0.7 + i / 5) % 1;
        c.globalAlpha = 1 - a;
        ell(c, -11 + Math.sin(t * 3 + i) * 4, -180 + b - a * 30, 3 - a * 2, 5 - a * 3, '#7dd3fc');
      }
      c.globalAlpha = 1;
      const cy = -236 + b + Math.sin(t * 2.5) * 5;
      c.save();
      c.shadowColor = '#fde047';
      c.shadowBlur = 16;
      poly(c, [-32, cy + 14, -32, cy - 8, -18, cy + 2, -8, cy - 18, 0, cy, 8, cy - 18, 18, cy + 2, 32, cy - 8, 32, cy + 14], '#facc15');
      c.restore();
      ell(c, -16, cy + 6, 4, 4, '#dc2626');
      ell(c, 0, cy + 6, 4, 4, '#2563eb');
      ell(c, 16, cy + 6, 4, 4, '#16a34a');
      c.strokeStyle = '#78716c';
      c.lineWidth = 6;
      line(c, -72, -6, -72, -200 + b);
      c.save();
      c.shadowColor = '#38bdf8';
      c.shadowBlur = 20;
      ell(c, -72, -210 + b, 12, 12, '#7dd3fc');
      c.restore();
      c.strokeStyle = '#e7e5e4';
      c.lineWidth = 4;
      line(c, -34, -130 + b, -68, -118 + b);
      [-6, 0, 6].forEach(o => line(c, -68, -118 + b, -76, -120 + b + o));
    },

    'Emberclaw Prime'(c, t) {
      const b = Math.sin(t * 2) * 4;
      const flap = Math.sin(t * 3) * 14;
      c.fillStyle = lin(c, 0, -230, 0, -80, ['#7f1d1d', '#b91c1c']);
      [1, -1].forEach(s => {
        c.beginPath();
        c.moveTo(s * 10 + 20, -140 + b);
        c.lineTo(s * 70 + 30, -230 + b - flap);
        c.lineTo(s * 120 + 30, -200 + b - flap);
        c.quadraticCurveTo(s * 100 + 30, -160 + b, s * 110 + 30, -110 + b);
        c.quadraticCurveTo(s * 80 + 30, -130 + b, s * 70 + 30, -100 + b);
        c.quadraticCurveTo(s * 50 + 30, -120 + b, s * 20 + 20, -100 + b);
        c.closePath();
        c.fill();
      });
      c.strokeStyle = '#991b1b';
      c.lineWidth = 16;
      c.beginPath();
      c.moveTo(60, -60 + b);
      c.quadraticCurveTo(120, -30, 110 + Math.sin(t * 2) * 10, -2);
      c.stroke();
      poly(c, [100, -4, 126, 4, 112, -22], '#fbbf24');
      c.fillStyle = '#7f1d1d';
      c.fillRect(-10, -60, 26, 60);
      c.fillRect(40, -60, 26, 60);
      ell(c, 20, -96 + b, 66, 48, rad(c, 20, -96 + b, 70, ['#ef4444', '#7f1d1d']));
      ell(c, 6, -84 + b, 38, 30, '#fbbf24');
      for (let i = 0; i < 4; i++) {
        c.strokeStyle = '#d97706';
        c.lineWidth = 2;
        line(c, -24 + i * 4, -96 + b + i * 8, 34 - i * 4, -96 + b + i * 8);
      }
      c.strokeStyle = '#b91c1c';
      c.lineWidth = 26;
      c.beginPath();
      c.moveTo(-10, -120 + b);
      c.quadraticCurveTo(-40, -170 + b, -60, -178 + b);
      c.stroke();
      for (let i = 0; i < 5; i++) poly(c, [30 - i * 18, -140 + b - i * 6, 22 - i * 18, -160 + b - i * 6, 14 - i * 18, -140 + b - i * 6], '#fbbf24');
      const hx = -74, hy = -182 + b;
      ell(c, hx, hy, 34, 24, rad(c, hx, hy, 36, ['#f87171', '#991b1b']));
      poly(c, [hx - 20, hy - 10, hx - 70, hy - 2, hx - 66, hy + 12, hx - 18, hy + 18], '#b91c1c');
      poly(c, [hx + 8, hy - 18, hx + 42, hy - 46, hx + 22, hy - 12], '#fbbf24');
      poly(c, [hx - 6, hy - 20, hx + 18, hy - 52, hx + 8, hy - 16], '#f59e0b');
      glow(c, hx - 18, hy - 8, 5, '#fde047', 18);
      for (let i = 0; i < 4; i++) poly(c, [hx - 62 + i * 11, hy + 10, hx - 58 + i * 11, hy + 20, hx - 54 + i * 11, hy + 10], '#fff');
      if (Math.sin(t * 2.5) > 0.2) {
        const len = 30 + Math.sin(t * 20) * 6;
        for (let i = 0; i < 3; i++) flame(c, hx - 80 - i * 16, hy + 14 + (i % 2) * 4, 10 - i * 2 + len * 0.05, t + i);
      }
      c.strokeStyle = '#991b1b';
      c.lineWidth = 12;
      line(c, -30, -90 + b, -52, -56 + b);
      [-8, 0, 8].forEach(o => poly(c, [-56 + o, -58 + b, -62 + o, -42 + b, -50 + o, -56 + b], '#fef3c7'));
    },

    'Nyx, Devourer of Light'(c, t) {
      const cy = -130 + Math.sin(t * 1.4) * 6;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + t * 0.3;
        c.strokeStyle = i % 2 ? '#1e1b4b' : '#312e81';
        c.lineWidth = 12;
        c.beginPath();
        c.moveTo(Math.cos(a) * 50, cy + Math.sin(a) * 50);
        const r1 = 90, r2 = 125;
        c.quadraticCurveTo(
          Math.cos(a + Math.sin(t * 2 + i) * 0.5) * r1, cy + Math.sin(a + Math.sin(t * 2 + i) * 0.5) * r1,
          Math.cos(a + 0.4) * r2, cy + Math.sin(a + 0.4) * r2
        );
        c.stroke();
      }
      for (let i = 0; i < 14; i++) {
        const u = (t * 0.35 + i / 14) % 1;
        const a = i * 2.4;
        const r = 150 * (1 - u) + 20;
        c.globalAlpha = u;
        ell(c, Math.cos(a) * r, cy + Math.sin(a) * r, 2.5, 2.5, '#fef9c3');
      }
      c.globalAlpha = 1;
      c.save();
      c.shadowColor = '#7c3aed';
      c.shadowBlur = 40;
      ell(c, 0, cy, 72, 72, rad(c, 0, cy, 76, ['#1e1b4b', '#020617']));
      c.restore();
      c.save();
      c.beginPath();
      c.arc(0, cy, 70, 0, TAU);
      c.clip();
      for (let i = 0; i < 24; i++) {
        const sx = ((i * 53) % 140) - 70, sy = cy + ((i * 37) % 140) - 70;
        ell(c, sx, sy, 1.2, 1.2, `rgba(255,255,255,${0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i))})`);
      }
      c.restore();
      const blink = Math.max(0.1, Math.abs(Math.sin(t * 0.6)) > 0.97 ? 0.1 : 1);
      ell(c, 0, cy, 42, 26 * blink, '#fef3c7');
      c.save();
      c.shadowColor = '#a855f7';
      c.shadowBlur = 20;
      ell(c, -6, cy, 18, 18 * blink, rad(c, -6, cy, 18, ['#e879f9', '#7c3aed', '#2e1065']));
      c.restore();
      ell(c, -8, cy, 5, 14 * blink, '#000');
      c.strokeStyle = '#c4b5fd';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, cy, 80 + Math.sin(t * 3) * 4, 0, TAU);
      c.stroke();
    }
  };

  function drawFallback(c, t, name) {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const hue = h % 360;
    const b = Math.sin(t * 2) * 3;
    c.fillStyle = `hsl(${hue},40%,25%)`;
    c.fillRect(-40, -60, 28, 60);
    c.fillRect(12, -60, 28, 60);
    ell(c, 0, -110 + b, 70, 60, rad(c, 0, -110 + b, 72, [`hsl(${hue},55%,55%)`, `hsl(${hue},50%,25%)`]));
    poly(c, [-40, -160 + b, -60, -220 + b, -20, -170 + b], '#e5e7eb');
    poly(c, [40, -160 + b, 60, -220 + b, 20, -170 + b], '#e5e7eb');
    glow(c, -20, -130 + b, 7, '#fde047');
    glow(c, 20, -130 + b, 7, '#fde047');
  }

  function draw(ctx, name, x, y, size, opts) {
    opts = opts || {};
    const t = opts.t || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 200, size / 200);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ell(ctx, 0, 0, 95, 14, 'rgba(0,0,0,0.35)');
    if (opts.boss) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(t * 3) * 0.1;
      ell(ctx, 0, -110, 130, 130, rad(ctx, 0, -110, 130, ['rgba(239,68,68,0.9)', 'rgba(239,68,68,0)']));
      ctx.restore();
    }
    (DRAW[name] || drawFallback)(ctx, t, name);
    ctx.restore();
  }

  const thumbCache = {};
  function thumbnail(name, boss) {
    const key = name + (boss ? ':boss' : '');
    if (!thumbCache[key]) {
      const cv = document.createElement('canvas');
      cv.width = 96;
      cv.height = 96;
      draw(cv.getContext('2d'), name, 50, 90, 74, { boss, t: 0.4 });
      thumbCache[key] = cv.toDataURL();
    }
    return thumbCache[key];
  }

  return { draw, thumbnail };
})();
