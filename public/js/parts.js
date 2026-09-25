// LEGO-style part library. Geometry is emitted as flat-shaded polygons so the
// software renderer in renderer3d.js can draw it without WebGL.
const Parts = (() => {
  const STUD = 20;   // stud pitch (x/z grid unit)
  const PLATE = 8;   // plate height (y grid unit); a brick is 3 plates tall
  const STUD_R = 6;
  const STUD_H = 4;

  // ---------------------------------------------------------------- geometry
  function box(x, y, z, w, h, d, c, a) {
    const X = x + w, Y = y + h, Z = z + d;
    return [
      { c, a, n: [0, 1, 0], v: [[x, Y, z], [x, Y, Z], [X, Y, Z], [X, Y, z]] },
      { c, a, n: [0, -1, 0], v: [[x, y, z], [X, y, z], [X, y, Z], [x, y, Z]] },
      { c, a, n: [0, 0, 1], v: [[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]] },
      { c, a, n: [0, 0, -1], v: [[X, y, z], [x, y, z], [x, Y, z], [X, Y, z]] },
      { c, a, n: [1, 0, 0], v: [[X, y, Z], [X, y, z], [X, Y, z], [X, Y, Z]] },
      { c, a, n: [-1, 0, 0], v: [[x, y, z], [x, y, Z], [x, Y, Z], [x, Y, z]] }
    ];
  }

  function axisPoint(axis, cx, cy, cz, u, v, t) {
    if (axis === 'x') return [cx + t, cy + u, cz + v];
    if (axis === 'z') return [cx + u, cy + v, cz + t];
    return [cx + u, cy + t, cz + v];
  }
  function axisNormal(axis, u, v, t) {
    if (axis === 'x') return [t, u, v];
    if (axis === 'z') return [u, v, t];
    return [u, t, v];
  }

  // Truncated cone / cylinder along `axis`, starting at the centre point.
  function tube(cx, cy, cz, r1, r2, len, c, axis, seg, a, caps) {
    axis = axis || 'y';
    seg = seg || 12;
    caps = caps === undefined ? true : caps;
    const faces = [];
    const top = [], bot = [];
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0);
      const c1 = Math.cos(a1), s1 = Math.sin(a1);
      const p0 = axisPoint(axis, cx, cy, cz, c0 * r1, s0 * r1, 0);
      const p1 = axisPoint(axis, cx, cy, cz, c1 * r1, s1 * r1, 0);
      const p2 = axisPoint(axis, cx, cy, cz, c1 * r2, s1 * r2, len);
      const p3 = axisPoint(axis, cx, cy, cz, c0 * r2, s0 * r2, len);
      const nm = axisNormal(axis, (c0 + c1) / 2, (s0 + s1) / 2, 0);
      faces.push({ c, a, n: nm, v: [p0, p1, p2, p3] });
      bot.push(p0);
      top.push(p3);
    }
    if (caps) {
      if (r2 > 0.01) faces.push({ c, a, n: axisNormal(axis, 0, 0, 1), v: top });
      if (r1 > 0.01) faces.push({ c, a, n: axisNormal(axis, 0, 0, -1), v: bot.slice().reverse() });
    }
    return faces;
  }

  const cyl = (cx, cy, cz, r, len, c, axis, seg, a) => tube(cx, cy, cz, r, r, len, c, axis, seg, a);

  // Sloped block: full height at z, dropping to `low` at z+d.
  function wedge(x, y, z, w, h, d, c, low, a) {
    low = low || 0;
    const X = x + w, Z = z + d, Y = y + h, L = y + low;
    const faces = [
      { c, a, n: [0, -1, 0], v: [[x, y, z], [X, y, z], [X, y, Z], [x, y, Z]] },
      { c, a, n: [0, 0, -1], v: [[X, y, z], [x, y, z], [x, Y, z], [X, Y, z]] },
      { c, a, n: [0, 1 * d, h - low], v: [[x, Y, z], [X, Y, z], [X, L, Z], [x, L, Z]] },
      { c, a, n: [-1, 0, 0], v: [[x, y, z], [x, y, Z], [x, L, Z], [x, Y, z]] },
      { c, a, n: [1, 0, 0], v: [[X, y, Z], [X, y, z], [X, Y, z], [X, L, Z]] }
    ];
    faces[2].n = norm([0, d, h - low]);
    if (low > 0.01) faces.push({ c, a, n: [0, 0, 1], v: [[x, y, Z], [X, y, Z], [X, L, Z], [x, L, Z]] });
    return faces;
  }

  function norm(v) {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }

  function studs(w, d, topY, c, helper, r, h) {
    r = r || STUD_R; h = h || STUD_H;
    const out = [];
    for (let dx = 0; dx < w; dx++) {
      for (let dz = 0; dz < d; dz++) {
        if (helper && helper.covered && helper.covered(dx, dz)) continue;
        out.push(...cyl(dx * STUD + STUD / 2, topY, dz * STUD + STUD / 2, r, h, c, 'y', 8));
      }
    }
    return out;
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    const b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  // ------------------------------------------------------------- part makers
  function plainBrick(w, h, d, opts) {
    opts = opts || {};
    return (c, helper) => {
      const f = box(0, 0, 0, w * STUD, h * PLATE, d * STUD, c);
      if (!opts.noStuds) f.push(...studs(w, d, h * PLATE, c, helper));
      return f;
    };
  }

  const DARK = '#1f2430';
  const GREY = '#9aa3ae';
  const SILVER = '#c7ccd4';
  const GLASS = '#a5d8ef';

  const DEFS = [];
  function def(id, name, group, w, h, d, geom, opts) {
    DEFS.push(Object.assign({ id, name, group, w, h, d, geom }, opts || {}));
  }

  // --- bricks (3 plates tall)
  [[1, 1], [1, 2], [1, 3], [1, 4], [1, 6], [1, 8], [2, 2], [2, 3], [2, 4], [2, 6], [2, 8]]
    .forEach(([w, d]) => def(`brick_${w}x${d}`, `Brick ${w}×${d}`, 'Bricks', w, 3, d, plainBrick(w, 3, d)));

  // --- plates (1 plate tall)
  [[1, 1], [1, 2], [1, 4], [1, 6], [2, 2], [2, 4], [2, 6], [2, 8], [4, 4], [4, 8], [6, 6], [8, 8]]
    .forEach(([w, d]) => def(`plate_${w}x${d}`, `Plate ${w}×${d}`, 'Plates', w, 1, d, plainBrick(w, 1, d)));

  // --- smooth tiles
  [[1, 1], [1, 2], [1, 4], [2, 2], [2, 4], [4, 4]]
    .forEach(([w, d]) => def(`tile_${w}x${d}`, `Tile ${w}×${d}`, 'Tiles', w, 1, d, plainBrick(w, 1, d, { noStuds: true })));

  def('grille_1x2', 'Grille Tile 1×2', 'Tiles', 1, 1, 2, c => {
    const f = box(0, 0, 0, STUD, PLATE, 2 * STUD, c);
    for (let i = 0; i < 5; i++) f.push(...box(2, PLATE, i * 8 + 3, STUD - 4, 1.5, 4, shade(c, -35)));
    return f;
  });

  // --- slopes
  def('slope_2x2', 'Slope 2×2', 'Slopes', 2, 3, 2, c => wedge(0, 0, 0, 2 * STUD, 3 * PLATE, 2 * STUD, c));
  def('slope_1x2', 'Slope 1×2', 'Slopes', 1, 3, 2, c => wedge(0, 0, 0, STUD, 3 * PLATE, 2 * STUD, c));
  def('slope_2x4', 'Slope 2×4', 'Slopes', 2, 3, 4, c => wedge(0, 0, 0, 2 * STUD, 3 * PLATE, 4 * STUD, c));
  def('slope_1x1_steep', 'Steep Slope 1×1', 'Slopes', 1, 3, 1, c => wedge(0, 0, 0, STUD, 3 * PLATE, STUD, c));
  def('slope_inv_2x2', 'Inverted Slope 2×2', 'Slopes', 2, 3, 2, c => {
    const f = wedge(0, 0, 0, 2 * STUD, 3 * PLATE, 2 * STUD, c);
    return f.map(fc => ({ c: fc.c, a: fc.a, n: [fc.n[0], -fc.n[1], fc.n[2]], v: fc.v.map(p => [p[0], 3 * PLATE - p[1], p[2]]) }));
  });
  def('slope_curved_2x2', 'Curved Slope 2×2', 'Slopes', 2, 3, 2, c => {
    const f = [];
    const steps = 7, H = 3 * PLATE, D = 2 * STUD;
    for (let i = 0; i < steps; i++) {
      const z0 = (i / steps) * D, z1 = ((i + 1) / steps) * D;
      const h = H * Math.cos((i / steps) * Math.PI / 2);
      const h2 = H * Math.cos(((i + 1) / steps) * Math.PI / 2);
      f.push(...wedge(0, 0, z0, 2 * STUD, h, z1 - z0, c, h2));
    }
    return f;
  });
  def('roof_ridge_2x2', 'Roof Ridge 2×2', 'Slopes', 2, 3, 2, c => {
    const f = wedge(0, 0, 0, 2 * STUD, 3 * PLATE, STUD, c);
    const g = wedge(0, 0, 0, 2 * STUD, 3 * PLATE, STUD, c)
      .map(fc => ({ c: fc.c, n: [fc.n[0], fc.n[1], -fc.n[2]], v: fc.v.map(p => [p[0], p[1], 2 * STUD - p[2]]) }));
    return f.concat(g);
  });

  // --- round / curved
  def('round_1x1', 'Round Brick 1×1', 'Round', 1, 3, 1, (c, h) => {
    const f = cyl(STUD / 2, 0, STUD / 2, STUD * 0.46, 3 * PLATE, c, 'y', 14);
    f.push(...studs(1, 1, 3 * PLATE, c, h));
    return f;
  });
  def('round_plate_1x1', 'Round Plate 1×1', 'Round', 1, 1, 1, (c, h) => {
    const f = cyl(STUD / 2, 0, STUD / 2, STUD * 0.46, PLATE, c, 'y', 14);
    f.push(...studs(1, 1, PLATE, c, h));
    return f;
  });
  def('round_2x2', 'Round Brick 2×2', 'Round', 2, 3, 2, (c, h) => {
    const f = cyl(STUD, 0, STUD, STUD * 0.96, 3 * PLATE, c, 'y', 18);
    f.push(...studs(2, 2, 3 * PLATE, c, h));
    return f;
  });
  def('cone_1x1', 'Cone 1×1', 'Round', 1, 3, 1, c =>
    tube(STUD / 2, 0, STUD / 2, STUD * 0.46, STUD * 0.28, 3 * PLATE, c, 'y', 14));
  def('dome_2x2', 'Dome 2×2', 'Round', 2, 3, 2, c => {
    const f = [];
    const steps = 6, H = 3 * PLATE, R = STUD * 0.96;
    for (let i = 0; i < steps; i++) {
      const t0 = i / steps, t1 = (i + 1) / steps;
      const r0 = R * Math.cos(t0 * Math.PI / 2), r1 = R * Math.cos(t1 * Math.PI / 2);
      f.push(...tube(STUD, t0 * H, STUD, r0, r1, (t1 - t0) * H, c, 'y', 16, 1, i === 0));
    }
    return f;
  });
  def('column_1x1', 'Column 1×1×5', 'Round', 1, 15, 1, (c, h) => {
    const f = cyl(STUD / 2, 0, STUD / 2, STUD * 0.36, 15 * PLATE, c, 'y', 14);
    f.push(...studs(1, 1, 15 * PLATE, c, h));
    return f;
  });

  // --- windows, doors, walls
  def('window_1x2x2', 'Window 1×2×2', 'Windows & Doors', 2, 6, 1, c => {
    const W = 2 * STUD, H = 6 * PLATE, D = STUD, t = 5;
    const f = [];
    f.push(...box(0, 0, 0, W, t, D, c));
    f.push(...box(0, H - t, 0, W, t, D, c));
    f.push(...box(0, 0, 0, t, H, D, c));
    f.push(...box(W - t, 0, 0, t, H, D, c));
    f.push(...box(t, t, D * 0.35, W - 2 * t, H - 2 * t, D * 0.3, GLASS, 0.55));
    return f;
  });
  def('window_1x4x3', 'Window 1×4×3', 'Windows & Doors', 4, 9, 1, c => {
    const W = 4 * STUD, H = 9 * PLATE, D = STUD, t = 5;
    const f = [];
    f.push(...box(0, 0, 0, W, t, D, c), ...box(0, H - t, 0, W, t, D, c));
    f.push(...box(0, 0, 0, t, H, D, c), ...box(W - t, 0, 0, t, H, D, c));
    f.push(...box(W / 2 - 2, 0, 0, 4, H, D, c));
    f.push(...box(t, t, D * 0.35, W - 2 * t, H - 2 * t, D * 0.3, GLASS, 0.55));
    return f;
  });
  def('door_1x4x6', 'Door 1×4×6', 'Windows & Doors', 4, 18, 1, c => {
    const W = 4 * STUD, H = 18 * PLATE, D = STUD, t = 6;
    const f = [];
    f.push(...box(0, 0, 0, t, H, D, c), ...box(W - t, 0, 0, t, H, D, c));
    f.push(...box(0, H - t, 0, W, t, D, c));
    f.push(...box(t, 0, D * 0.2, W - 2 * t, H - t, D * 0.55, shade(c, -25)));
    f.push(...cyl(W - t - 9, H * 0.42, D * 0.78, 3, 5, SILVER, 'z', 8));
    return f;
  });
  def('fence_1x4', 'Fence 1×4', 'Windows & Doors', 4, 3, 1, c => {
    const f = box(0, 0, 0, 4 * STUD, PLATE, STUD, c);
    for (let i = 0; i < 5; i++) f.push(...box(i * (4 * STUD - 5) / 4, PLATE, STUD / 2 - 2.5, 5, 2 * PLATE, 5, c));
    f.push(...box(0, 3 * PLATE - 4, STUD / 2 - 2.5, 4 * STUD, 4, 5, c));
    return f;
  });
  def('ladder_1x6', 'Ladder 1×6', 'Windows & Doors', 1, 18, 1, c => {
    const f = [];
    f.push(...box(2, 0, STUD / 2 - 3, 4, 18 * PLATE, 6, c));
    f.push(...box(STUD - 6, 0, STUD / 2 - 3, 4, 18 * PLATE, 6, c));
    for (let i = 0; i < 7; i++) f.push(...box(6, 6 + i * 20, STUD / 2 - 2, STUD - 12, 3, 4, c));
    return f;
  });
  def('arch_1x4', 'Arch 1×4', 'Windows & Doors', 4, 6, 1, c => {
    const W = 4 * STUD, H = 6 * PLATE, D = STUD;
    const f = box(0, H - 2 * PLATE, 0, W, 2 * PLATE, D, c);
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const h = (H - 2 * PLATE) * (1 - Math.sin(t * Math.PI / 2));
      const bw = W / 2 / steps;
      f.push(...box(i * bw, H - 2 * PLATE - h, 0, bw + 0.5, h, D, c));
      f.push(...box(W - (i + 1) * bw - 0.5, H - 2 * PLATE - h, 0, bw + 0.5, h, D, c));
    }
    f.push(...studs(4, 1, H, c));
    return f;
  });

  // --- vehicle parts
  def('wheel', 'Wheel & Tire', 'Vehicle', 1, 4, 2, () => {
    const f = cyl(STUD / 2, 2 * PLATE, STUD, 17, STUD * 0.8, DARK, 'x', 16);
    f.push(...cyl(STUD / 2 + 3, 2 * PLATE, STUD, 10, STUD * 0.8 - 6, SILVER, 'x', 14));
    return f;
  }, { fixedColor: true });
  def('wheel_small', 'Small Wheel', 'Vehicle', 1, 3, 1, () => {
    const f = cyl(STUD / 2, 1.5 * PLATE, STUD / 2, 11, STUD * 0.7, DARK, 'x', 14);
    f.push(...cyl(STUD / 2 + 3, 1.5 * PLATE, STUD / 2, 6, STUD * 0.7 - 6, SILVER, 'x', 12));
    return f;
  }, { fixedColor: true });
  def('axle_plate_2x2', 'Axle Plate 2×2', 'Vehicle', 2, 1, 2, (c, h) => {
    const f = box(0, 0, 0, 2 * STUD, PLATE, 2 * STUD, c);
    f.push(...cyl(0, PLATE / 2, STUD, 3, -10, GREY, 'x', 8));
    f.push(...cyl(2 * STUD, PLATE / 2, STUD, 3, 10, GREY, 'x', 8));
    f.push(...studs(2, 2, PLATE, c, h));
    return f;
  });
  def('mudguard_2x4', 'Mudguard 2×4', 'Vehicle', 2, 3, 4, c => {
    const f = box(0, 2 * PLATE, 0, 2 * STUD, PLATE, 4 * STUD, c);
    f.push(...box(0, 0, 0, 2 * STUD, 2 * PLATE, 6, c));
    f.push(...box(0, 0, 4 * STUD - 6, 2 * STUD, 2 * PLATE, 6, c));
    f.push(...studs(2, 4, 3 * PLATE, c));
    return f;
  });
  def('windscreen_2x4', 'Windscreen 2×4', 'Vehicle', 2, 6, 4, () =>
    wedge(0, 0, 0, 2 * STUD, 6 * PLATE, 4 * STUD, GLASS, PLATE, 0.5), { fixedColor: true });
  def('steering_wheel', 'Steering Wheel', 'Vehicle', 1, 3, 1, c => {
    const f = box(STUD / 2 - 2, 0, STUD / 2 - 2, 4, 2 * PLATE, 4, c);
    f.push(...tube(STUD / 2, 2 * PLATE, STUD / 2, 8, 8, 3, c, 'y', 14, 1, true));
    return f;
  });
  def('headlight_1x1', 'Headlight Brick 1×1', 'Vehicle', 1, 3, 1, (c, h) => {
    const f = box(0, 0, 0, STUD, 3 * PLATE, STUD, c);
    f.push(...cyl(STUD / 2, 1.5 * PLATE, STUD, 5, 3, '#fff3b0', 'z', 10));
    f.push(...studs(1, 1, 3 * PLATE, c, h));
    return f;
  });
  def('exhaust_1x1', 'Exhaust Pipe', 'Vehicle', 1, 3, 1, () =>
    cyl(STUD / 2, 0, STUD / 2, 4, 3 * PLATE, SILVER, 'y', 10), { fixedColor: true });
  def('propeller', 'Propeller', 'Vehicle', 3, 3, 3, c => {
    const f = cyl(1.5 * STUD, PLATE, 1.5 * STUD, 5, PLATE, GREY, 'y', 10);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const px = 1.5 * STUD + Math.cos(a) * 20, pz = 1.5 * STUD + Math.sin(a) * 20;
      f.push(...box(px - 18, PLATE + 2, pz - 3, 36, 3, 6, c));
    }
    return f;
  });

  // --- decor / nature
  def('tree_trunk', 'Tree Trunk', 'Decor', 1, 9, 1, () =>
    cyl(STUD / 2, 0, STUD / 2, 6, 9 * PLATE, '#8b5a2b', 'y', 10), { fixedColor: true });
  def('tree_top', 'Tree Top', 'Decor', 2, 9, 2, () => {
    const f = [];
    for (let i = 0; i < 3; i++) {
      f.push(...tube(STUD, i * 3 * PLATE, STUD, 20 - i * 5, 14 - i * 5, 3 * PLATE, '#2f9e44', 'y', 12));
    }
    return f;
  }, { fixedColor: true });
  def('flower', 'Flower', 'Decor', 1, 3, 1, c => {
    const f = cyl(STUD / 2, 0, STUD / 2, 2.5, 2 * PLATE, '#2f9e44', 'y', 8);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      f.push(...cyl(STUD / 2 + Math.cos(a) * 5, 2 * PLATE, STUD / 2 + Math.sin(a) * 5, 4, 3, c, 'y', 8));
    }
    return f;
  });
  def('antenna', 'Antenna', 'Decor', 1, 9, 1, c => {
    const f = cyl(STUD / 2, 0, STUD / 2, 6, PLATE, c, 'y', 10);
    f.push(...cyl(STUD / 2, PLATE, STUD / 2, 2, 8 * PLATE, c, 'y', 8));
    return f;
  });
  def('flag', 'Flag', 'Decor', 1, 12, 1, c => {
    const f = cyl(STUD / 2, 0, STUD / 2, 2.5, 12 * PLATE, GREY, 'y', 8);
    f.push(...box(STUD / 2, 7 * PLATE, STUD / 2 - 1, 30, 4 * PLATE, 2, c));
    return f;
  });
  def('lamp_post', 'Lamp Post', 'Decor', 1, 15, 1, c => {
    const f = cyl(STUD / 2, 0, STUD / 2, 4, 13 * PLATE, c, 'y', 10);
    f.push(...tube(STUD / 2, 13 * PLATE, STUD / 2, 9, 4, 2 * PLATE, '#fff3b0', 'y', 12, 0.85));
    return f;
  });
  def('sign_1x2', 'Sign 1×2', 'Decor', 2, 9, 1, c => {
    const f = cyl(STUD, 0, STUD / 2, 3, 6 * PLATE, GREY, 'y', 8);
    f.push(...box(0, 6 * PLATE, STUD / 2 - 2, 2 * STUD, 3 * PLATE, 4, c));
    return f;
  });
  def('baseplate_8x8', 'Baseplate 8×8', 'Plates', 8, 1, 8, plainBrick(8, 1, 8));

  // --- figures
  def('minifig', 'Minifig', 'Figures', 1, 12, 1, c => {
    const f = [];
    const cx = STUD / 2, cz = STUD / 2;
    f.push(...box(cx - 8, 0, cz - 4, 7, 26, 8, '#1d4ed8'));
    f.push(...box(cx + 1, 0, cz - 4, 7, 26, 8, '#1d4ed8'));
    f.push(...box(cx - 9, 26, cz - 5, 18, 26, 10, c));
    f.push(...box(cx - 13, 28, cz - 4, 4, 22, 8, c));
    f.push(...box(cx + 9, 28, cz - 4, 4, 22, 8, c));
    f.push(...cyl(cx, 52, cz, 8, 14, '#ffd43b', 'y', 14));
    f.push(...cyl(cx, 66, cz, 5, 4, '#ffd43b', 'y', 12));
    f.push(...box(cx - 4, 58, cz - 9, 2.5, 2.5, 2, '#111'));
    f.push(...box(cx + 1.5, 58, cz - 9, 2.5, 2.5, 2, '#111'));
    return f;
  });
  def('minifig_head', 'Minifig Head', 'Figures', 1, 3, 1, () =>
    cyl(STUD / 2, 0, STUD / 2, 8, 3 * PLATE, '#ffd43b', 'y', 14), { fixedColor: true });

  const BY_ID = Object.fromEntries(DEFS.map(p => [p.id, p]));
  const GROUPS = [];
  DEFS.forEach(p => {
    let g = GROUPS.find(x => x.name === p.group);
    if (!g) GROUPS.push(g = { name: p.group, parts: [] });
    g.parts.push(p);
  });

  const COLORS = [
    { name: 'Bright Red', hex: '#d3262a' },
    { name: 'Bright Blue', hex: '#1e6ed6' },
    { name: 'Bright Yellow', hex: '#f5c518' },
    { name: 'Dark Green', hex: '#237841' },
    { name: 'Bright Green', hex: '#4bb050' },
    { name: 'Orange', hex: '#f57c20' },
    { name: 'Purple', hex: '#8a4fc0' },
    { name: 'Magenta', hex: '#d13a86' },
    { name: 'White', hex: '#f2f3f2' },
    { name: 'Light Grey', hex: '#a3a9ae' },
    { name: 'Dark Grey', hex: '#5c6169' },
    { name: 'Black', hex: '#20242b' },
    { name: 'Brown', hex: '#7a4a24' },
    { name: 'Tan', hex: '#d7c599' },
    { name: 'Dark Red', hex: '#7b1f22' },
    { name: 'Sand Blue', hex: '#6d8fa8' },
    { name: 'Lime', hex: '#bbe32d' },
    { name: 'Azure', hex: '#3cc7e0' },
    { name: 'Gold', hex: '#c9a227' },
    { name: 'Silver', hex: '#c7ccd4' }
  ];

  // Footprint after rotation (rot = 0..3 quarter turns about Y).
  function footprint(b) {
    const p = BY_ID[b.partId];
    if (!p) return { w: 1, h: 1, d: 1 };
    return (b.rot % 2) ? { w: p.d, h: p.h, d: p.w } : { w: p.w, h: p.h, d: p.d };
  }

  function cells(b) {
    const f = footprint(b);
    const out = [];
    for (let dx = 0; dx < f.w; dx++)
      for (let dy = 0; dy < f.h; dy++)
        for (let dz = 0; dz < f.d; dz++)
          out.push((b.x + dx) + ',' + (b.y + dy) + ',' + (b.z + dz));
    return out;
  }

  // Map a local stud column to its world column for the brick's rotation.
  function localColumnToWorld(b, dx, dz) {
    const p = BY_ID[b.partId];
    const w = p.w, d = p.d;
    switch (b.rot % 4) {
      case 1: return [b.x + (d - 1 - dz), b.z + dx];
      case 2: return [b.x + (w - 1 - dx), b.z + (d - 1 - dz)];
      case 3: return [b.x + dz, b.z + (w - 1 - dx)];
      default: return [b.x + dx, b.z + dz];
    }
  }

  function rotatePoint(p, rot, W, D) {
    switch (rot % 4) {
      case 1: return [D - p[2], p[1], p[0]];
      case 2: return [W - p[0], p[1], D - p[2]];
      case 3: return [p[2], p[1], W - p[0]];
      default: return p;
    }
  }
  function rotateNormal(n, rot) {
    switch (rot % 4) {
      case 1: return [-n[2], n[1], n[0]];
      case 2: return [-n[0], n[1], -n[2]];
      case 3: return [n[2], n[1], -n[0]];
      default: return n;
    }
  }

  // World-space polygons for one placed brick.
  function faces(b, helper) {
    const p = BY_ID[b.partId];
    if (!p) return [];
    const raw = p.geom(p.fixedColor ? (b.color || '#a3a9ae') : (b.color || '#d3262a'), helper);
    const W = p.w * STUD, D = p.d * STUD;
    const ox = b.x * STUD, oy = b.y * PLATE, oz = b.z * STUD;
    return raw.map(f => ({
      c: f.c,
      a: f.a,
      n: rotateNormal(f.n, b.rot || 0),
      v: f.v.map(v => {
        const r = rotatePoint(v, b.rot || 0, W, D);
        return [r[0] + ox, r[1] + oy, r[2] + oz];
      })
    }));
  }

  return {
    STUD, PLATE, DEFS, BY_ID, GROUPS, COLORS,
    footprint, cells, faces, localColumnToWorld, shade, box, cyl, tube, wedge
  };
})();
