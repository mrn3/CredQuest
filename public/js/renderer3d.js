// Minimal software 3D renderer (canvas 2D, painter's algorithm) for brick models.
const Brick3D = (() => {
  const STUD = Parts.STUD, PLATE = Parts.PLATE;
  const LIGHT = (() => { const v = [0.45, 0.85, 0.3]; const l = Math.hypot(...v); return v.map(x => x / l); })();
  const colorCache = new Map();

  function litColor(hex, b) {
    const key = hex + '|' + b;
    let v = colorCache.get(key);
    if (v) return v;
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.round(((n >> 16) & 255) * b));
    const g = Math.min(255, Math.round(((n >> 8) & 255) * b));
    const bl = Math.min(255, Math.round((n & 255) * b));
    v = 'rgb(' + r + ',' + g + ',' + bl + ')';
    colorCache.set(key, v);
    return v;
  }

  function createView(canvas, opts) {
    opts = opts || {};
    const GRID = opts.grid || 24;
    const ctx = canvas.getContext('2d');
    const state = {
      bricks: [],
      ghost: null,
      grid: GRID,
      showPlate: opts.showPlate !== false,
      background: opts.background || '#bfe3ff',
      plateColor: opts.plateColor || '#4bb050',
      cam: { yaw: -0.85, pitch: 0.75, zoom: 1, target: [GRID * STUD / 2, 24, GRID * STUD / 2] }
    };
    let occ = new Map();

    function rebuildOcc() {
      occ = new Map();
      state.bricks.forEach(b => Parts.cells(b).forEach(k => occ.set(k, b)));
    }

    function basis() {
      const { yaw, pitch } = state.cam;
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const eye = [Math.sin(yaw) * cp, sp, Math.cos(yaw) * cp];
      const f = [-eye[0], -eye[1], -eye[2]];
      let r = [f[2], 0, -f[0]];
      const rl = Math.hypot(r[0], r[1], r[2]) || 1;
      r = [r[0] / rl, 0, r[2] / rl];
      // Screen-down vector, so larger world Y draws higher on the canvas.
      const u = [
        r[1] * f[2] - r[2] * f[1],
        r[2] * f[0] - r[0] * f[2],
        r[0] * f[1] - r[1] * f[0]
      ];
      return { f, r, u };
    }

    function viewScale(w, h) {
      return state.cam.zoom * Math.min(w, h) / (GRID * STUD * 1.15);
    }

    function makeProjector(w, h, bs) {
      const s = viewScale(w, h);
      const t = state.cam.target;
      const cx = w / 2, cy = h / 2;
      return p => {
        const dx = p[0] - t[0], dy = p[1] - t[1], dz = p[2] - t[2];
        return [
          cx + (dx * bs.r[0] + dy * bs.r[1] + dz * bs.r[2]) * s,
          cy + (dx * bs.u[0] + dy * bs.u[1] + dz * bs.u[2]) * s,
          dx * bs.f[0] + dy * bs.f[1] + dz * bs.f[2]
        ];
      };
    }

    function coveredHelper(b) {
      const p = Parts.BY_ID[b.partId];
      if (!p) return null;
      const topY = b.y + p.h;
      return {
        covered(dx, dz) {
          const [wx, wz] = Parts.localColumnToWorld(b, dx, dz);
          return occ.has(wx + ',' + topY + ',' + wz);
        }
      };
    }

    function collect(fast) {
      const out = [];
      for (const b of state.bricks) {
        const fs = Parts.faces(b, fast ? { covered: () => true } : coveredHelper(b));
        for (const f of fs) out.push(f);
      }
      if (state.ghost) {
        for (const f of Parts.faces(state.ghost, { covered: () => true })) {
          f.a = 0.45;
          f.ghost = true;
          out.push(f);
        }
      }
      return out;
    }

    function renderTo(c, w, h, o) {
      o = o || {};
      const fast = !!o.fast;
      const bs = basis();
      const proj = makeProjector(w, h, bs);

      c.save();
      if (o.transparent) c.clearRect(0, 0, w, h);
      else {
        const g = c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, state.background);
        g.addColorStop(1, '#eaf6ff');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
      }

      if (state.showPlate) drawPlate(c, proj);

      const faces = collect(fast);
      const items = [];
      for (const f of faces) {
        const nd = f.n[0] * bs.f[0] + f.n[1] * bs.f[1] + f.n[2] * bs.f[2];
        if (nd > 0.02 && !f.a) continue; // back-face cull (opaque only)
        const pts = f.v.map(proj);
        let depth = -Infinity;
        for (const p of pts) if (p[2] > depth) depth = p[2];
        items.push({ f, pts, depth, nd });
      }
      items.sort((a, b) => b.depth - a.depth);

      c.lineJoin = 'round';
      for (const it of items) {
        const f = it.f;
        const b = 0.5 + 0.5 * Math.max(0, f.n[0] * LIGHT[0] + f.n[1] * LIGHT[1] + f.n[2] * LIGHT[2]);
        c.beginPath();
        c.moveTo(it.pts[0][0], it.pts[0][1]);
        for (let i = 1; i < it.pts.length; i++) c.lineTo(it.pts[i][0], it.pts[i][1]);
        c.closePath();
        c.globalAlpha = f.a === undefined ? 1 : f.a;
        c.fillStyle = litColor(f.c, b);
        c.fill();
        if (!fast) {
          c.globalAlpha = (f.a === undefined ? 1 : f.a) * 0.35;
          c.strokeStyle = litColor(f.c, b * 0.6);
          c.lineWidth = 1;
          c.stroke();
        }
      }
      c.globalAlpha = 1;
      c.restore();
    }

    function drawPlate(c, proj) {
      const S = GRID * STUD;
      const corners = [[0, 0, 0], [S, 0, 0], [S, 0, S], [0, 0, S]].map(proj);
      c.beginPath();
      c.moveTo(corners[0][0], corners[0][1]);
      for (let i = 1; i < 4; i++) c.lineTo(corners[i][0], corners[i][1]);
      c.closePath();
      c.fillStyle = state.plateColor;
      c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.12)';
      c.lineWidth = 1;
      for (let i = 0; i <= GRID; i++) {
        const a = proj([i * STUD, 0, 0]), b = proj([i * STUD, 0, S]);
        const d = proj([0, 0, i * STUD]), e = proj([S, 0, i * STUD]);
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
        c.beginPath(); c.moveTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.stroke();
      }
    }

    function render(fast) {
      renderTo(ctx, canvas.width, canvas.height, { fast });
    }

    // ------------------------------------------------------------- picking
    function ray(mx, my) {
      const bs = basis();
      const s = viewScale(canvas.width, canvas.height);
      const u = (mx - canvas.width / 2) / s;
      const v = (my - canvas.height / 2) / s;
      const t = state.cam.target;
      const BACK = 20000;
      const o = [
        t[0] + bs.r[0] * u + bs.u[0] * v - bs.f[0] * BACK,
        t[1] + bs.r[1] * u + bs.u[1] * v - bs.f[1] * BACK,
        t[2] + bs.r[2] * u + bs.u[2] * v - bs.f[2] * BACK
      ];
      return { o, d: bs.f };
    }

    function hitBox(r, min, max) {
      let tmin = -Infinity, tmax = Infinity, axis = 0, sign = 1;
      for (let i = 0; i < 3; i++) {
        const inv = 1 / (r.d[i] || 1e-9);
        let t1 = (min[i] - r.o[i]) * inv, t2 = (max[i] - r.o[i]) * inv;
        let sg = -1;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; sg = 1; }
        if (t1 > tmin) { tmin = t1; axis = i; sign = sg; }
        if (t2 < tmax) tmax = t2;
        if (tmin > tmax) return null;
      }
      if (tmax < 0) return null;
      const n = [0, 0, 0];
      n[axis] = sign;
      return { t: tmin, n };
    }

    function pick(mx, my) {
      const r = ray(mx, my);
      let best = null;
      for (const b of state.bricks) {
        const f = Parts.footprint(b);
        const min = [b.x * STUD, b.y * PLATE, b.z * STUD];
        const max = [(b.x + f.w) * STUD, (b.y + f.h) * PLATE, (b.z + f.d) * STUD];
        const h = hitBox(r, min, max);
        if (h && (!best || h.t < best.t)) best = { t: h.t, n: h.n, brick: b };
      }
      const S = GRID * STUD;
      if (Math.abs(r.d[1]) > 1e-6) {
        const t = (0 - r.o[1]) / r.d[1];
        if (t > 0) {
          const px = r.o[0] + r.d[0] * t, pz = r.o[2] + r.d[2] * t;
          if (px >= 0 && px < S && pz >= 0 && pz < S && (!best || t < best.t)) {
            best = { t, n: [0, 1, 0], ground: true, point: [px, 0, pz] };
          }
        }
      }
      if (!best) return null;
      if (!best.point) {
        best.point = [r.o[0] + r.d[0] * best.t, r.o[1] + r.d[1] * best.t, r.o[2] + r.d[2] * best.t];
      }
      return best;
    }

    // --------------------------------------------------------- model editing
    function fits(b) {
      const f = Parts.footprint(b);
      if (b.x < 0 || b.z < 0 || b.y < 0) return false;
      if (b.x + f.w > GRID || b.z + f.d > GRID) return false;
      return Parts.cells(b).every(k => !occ.has(k));
    }

    function add(b) {
      if (!fits(b)) return false;
      state.bricks.push(b);
      Parts.cells(b).forEach(k => occ.set(k, b));
      return true;
    }

    function remove(b) {
      const i = state.bricks.indexOf(b);
      if (i === -1) return false;
      state.bricks.splice(i, 1);
      rebuildOcc();
      return true;
    }

    function setBricks(list) {
      state.bricks = (list || []).map(b => ({ partId: b.partId, color: b.color, x: b.x, y: b.y, z: b.z, rot: b.rot || 0 }));
      rebuildOcc();
    }

    function clear() {
      state.bricks = [];
      occ = new Map();
    }

    function bounds() {
      if (!state.bricks.length) return null;
      let mnx = 1e9, mny = 1e9, mnz = 1e9, mxx = -1e9, mxy = -1e9, mxz = -1e9;
      for (const b of state.bricks) {
        const f = Parts.footprint(b);
        mnx = Math.min(mnx, b.x); mny = Math.min(mny, b.y); mnz = Math.min(mnz, b.z);
        mxx = Math.max(mxx, b.x + f.w); mxy = Math.max(mxy, b.y + f.h); mxz = Math.max(mxz, b.z + f.d);
      }
      return { mnx, mny, mnz, mxx, mxy, mxz };
    }

    function frame(pad) {
      const b = bounds();
      if (!b) {
        state.cam.target = [GRID * STUD / 2, 24, GRID * STUD / 2];
        state.cam.zoom = 1;
        return;
      }
      state.cam.target = [
        (b.mnx + b.mxx) / 2 * STUD,
        (b.mny + b.mxy) / 2 * PLATE,
        (b.mnz + b.mxz) / 2 * STUD
      ];
      const span = Math.max((b.mxx - b.mnx) * STUD, (b.mxz - b.mnz) * STUD, (b.mxy - b.mny) * PLATE, 3 * STUD);
      state.cam.zoom = (GRID * STUD * 1.15) / (span * (pad || 1.7));
    }

    function snapshot(size) {
      size = size || 220;
      const tmp = document.createElement('canvas');
      tmp.width = tmp.height = size;
      const tctx = tmp.getContext('2d');
      const saveZoom = state.cam.zoom, saveTarget = state.cam.target.slice();
      const savePlate = state.showPlate, saveGhost = state.ghost;
      state.showPlate = false;
      state.ghost = null;
      frame(1.3);
      renderTo(tctx, size, size, { fast: false, transparent: true });
      state.cam.zoom = saveZoom;
      state.cam.target = saveTarget;
      state.showPlate = savePlate;
      state.ghost = saveGhost;
      return tmp.toDataURL('image/png');
    }

    // ------------------------------------------------------------- controls
    function attachControls(handlers) {
      handlers = handlers || {};
      let dragging = false, moved = 0, lx = 0, ly = 0, button = 0;

      canvas.addEventListener('contextmenu', e => e.preventDefault());
      canvas.addEventListener('mousedown', e => {
        dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; button = e.button;
      });
      window.addEventListener('mouseup', e => {
        if (!dragging) return;
        dragging = false;
        if (moved < 5) {
          const p = local(e);
          if (p) {
            if (button === 2 && handlers.onAltClick) handlers.onAltClick(p.x, p.y);
            else if (button === 0 && handlers.onClick) handlers.onClick(p.x, p.y);
          }
        }
      });
      window.addEventListener('mousemove', e => {
        if (dragging) {
          const dx = e.clientX - lx, dy = e.clientY - ly;
          moved += Math.abs(dx) + Math.abs(dy);
          lx = e.clientX; ly = e.clientY;
          if (moved >= 5) {
            if (button === 2 || e.shiftKey) pan(dx, dy);
            else orbit(dx * 0.01, dy * 0.01);
            state.ghost = null;
            render(true);
          }
          return;
        }
        const p = local(e);
        if (p && handlers.onHover) handlers.onHover(p.x, p.y);
      });
      canvas.addEventListener('wheel', e => {
        e.preventDefault();
        zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12);
        render(true);
        clearTimeout(canvas._rt);
        canvas._rt = setTimeout(() => render(false), 120);
      }, { passive: false });

      function local(e) {
        const r = canvas.getBoundingClientRect();
        const x = (e.clientX - r.left) * (canvas.width / r.width);
        const y = (e.clientY - r.top) * (canvas.height / r.height);
        if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) return null;
        return { x, y };
      }
    }

    function orbit(dyaw, dpitch) {
      state.cam.yaw += dyaw;
      state.cam.pitch = Math.max(0.08, Math.min(1.45, state.cam.pitch + dpitch));
    }
    function pan(dx, dy) {
      const bs = basis();
      const s = viewScale(canvas.width, canvas.height);
      const t = state.cam.target;
      for (let i = 0; i < 3; i++) t[i] -= (bs.r[i] * dx + bs.u[i] * dy) / s;
    }
    function zoom(f) {
      state.cam.zoom = Math.max(0.25, Math.min(6, state.cam.zoom * f));
    }

    return {
      state, render, renderTo, pick, add, remove, setBricks, clear, fits,
      frame, bounds, snapshot, attachControls, orbit, pan, zoom, rebuildOcc,
      get bricks() { return state.bricks; },
      get occupancy() { return occ; }
    };
  }

  return { createView };
})();
