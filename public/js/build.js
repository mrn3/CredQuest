const BuildStudio = (() => {
  const STUD = Parts.STUD;
  let view = null;
  let canvas;
  let selectedPart = 'brick_2x4';
  let selectedColor = Parts.COLORS[0].hex;
  let rot = 0;
  let tool = 'build';
  let activeGroup = Parts.GROUPS[0].name;
  const undoStack = [];

  const CATEGORIES = [
    { id: 'house', name: '🏠 House', hint: 'Move into it — then decorate the inside and earn rent-free income.' },
    { id: 'vehicle', name: '🚗 Vehicle', hint: 'Drive it around the world for extra speed.' },
    { id: 'art', name: '🖼 Art', hint: 'Hang it on a wall inside your house for comfort bonuses.' },
    { id: 'furniture', name: '🛋 Furniture', hint: 'Place it on your floor for comfort bonuses.' },
    { id: 'other', name: '🧱 Other', hint: 'A collectible creation you can sell or display.' }
  ];

  function init() {
    canvas = document.getElementById('buildCanvas');
    sizeCanvas();
    view = Brick3D.createView(canvas, { grid: 24 });
    renderPartPalette();
    renderColorPalette();
    renderCategorySelect();
    bindControls();
    view.attachControls({
      onClick: handleClick,
      onAltClick: (x, y) => erase(x, y),
      onHover: handleHover
    });
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', () => { sizeCanvas(); draw(); });
    draw();
  }

  function sizeCanvas() {
    const wrap = canvas.parentElement;
    const w = Math.max(420, Math.min(900, wrap.clientWidth || 760));
    canvas.width = w;
    canvas.height = Math.round(w * 0.62);
  }

  function draw(fast) {
    view.render(!!fast);
    document.getElementById('brickCount').textContent = view.bricks.length;
  }

  // -------------------------------------------------------------- palettes
  function renderPartPalette() {
    const tabs = document.getElementById('partGroups');
    const list = document.getElementById('partPalette');
    tabs.innerHTML = '';
    Parts.GROUPS.forEach(g => {
      const b = document.createElement('button');
      b.className = 'group-tab' + (g.name === activeGroup ? ' active' : '');
      b.textContent = g.name;
      b.addEventListener('click', () => { activeGroup = g.name; renderPartPalette(); });
      tabs.appendChild(b);
    });
    list.innerHTML = '';
    const group = Parts.GROUPS.find(g => g.name === activeGroup);
    group.parts.forEach(p => {
      const b = document.createElement('button');
      b.className = 'part-btn' + (p.id === selectedPart ? ' selected' : '');
      b.title = `${p.name} — ${p.w}×${p.d} studs, ${p.h} plate${p.h > 1 ? 's' : ''} tall`;
      b.appendChild(partIcon(p));
      const label = document.createElement('span');
      label.textContent = p.name;
      b.appendChild(label);
      b.addEventListener('click', () => {
        selectedPart = p.id;
        setTool('build');
        renderPartPalette();
      });
      list.appendChild(b);
    });
  }

  const iconCache = new Map();
  function partIcon(p) {
    const key = p.id + selectedColor;
    let url = iconCache.get(key);
    if (!url) {
      const c = document.createElement('canvas');
      c.width = c.height = 72;
      const tmp = Brick3D.createView(c, { grid: 24, showPlate: false });
      tmp.add({ partId: p.id, color: selectedColor, x: 0, y: 0, z: 0, rot: 0 });
      tmp.frame(1.25);
      tmp.renderTo(c.getContext('2d'), 72, 72, { fast: false, transparent: true });
      url = c.toDataURL('image/png');
      iconCache.set(key, url);
    }
    const img = new Image();
    img.src = url;
    img.className = 'part-icon';
    return img;
  }

  function renderColorPalette() {
    const palette = document.getElementById('brickPalette');
    palette.innerHTML = '';
    Parts.COLORS.forEach(col => {
      const sw = document.createElement('button');
      sw.className = 'brick-swatch' + (col.hex === selectedColor ? ' selected' : '');
      sw.style.background = col.hex;
      sw.title = col.name;
      sw.addEventListener('click', () => {
        selectedColor = col.hex;
        iconCache.clear();
        renderColorPalette();
        renderPartPalette();
      });
      palette.appendChild(sw);
    });
  }

  function renderCategorySelect() {
    const sel = document.getElementById('buildCategorySelect');
    sel.innerHTML = '';
    CATEGORIES.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.name;
      sel.appendChild(o);
    });
    sel.addEventListener('change', updateCategoryHint);
    updateCategoryHint();
  }

  function updateCategoryHint() {
    const sel = document.getElementById('buildCategorySelect');
    const c = CATEGORIES.find(x => x.id === sel.value) || CATEGORIES[0];
    document.getElementById('buildCategoryHint').textContent = c.hint;
  }

  // ------------------------------------------------------------- placement
  function target(hit) {
    if (!hit) return null;
    const p = Parts.BY_ID[selectedPart];
    const fw = (rot % 2) ? p.d : p.w;
    const fd = (rot % 2) ? p.w : p.d;
    const pt = hit.point;

    if (hit.ground) {
      return { x: Math.floor(pt[0] / STUD), y: 0, z: Math.floor(pt[2] / STUD) };
    }
    const b = hit.brick;
    const bf = Parts.footprint(b);
    const n = hit.n;
    if (n[1] > 0.5) {
      return { x: clampCell(pt[0], b.x, bf.w), y: b.y + bf.h, z: clampCell(pt[2], b.z, bf.d) };
    }
    if (n[1] < -0.5) {
      return { x: clampCell(pt[0], b.x, bf.w), y: b.y - p.h, z: clampCell(pt[2], b.z, bf.d) };
    }
    let x = clampCell(pt[0], b.x, bf.w);
    let z = clampCell(pt[2], b.z, bf.d);
    if (n[0] > 0.5) x = b.x + bf.w;
    else if (n[0] < -0.5) x = b.x - fw;
    if (n[2] > 0.5) z = b.z + bf.d;
    else if (n[2] < -0.5) z = b.z - fd;
    return { x, y: b.y, z };
  }

  function clampCell(worldCoord, base, span) {
    const c = Math.floor(worldCoord / STUD);
    return Math.max(base, Math.min(base + span - 1, c));
  }

  function makeBrick(pos) {
    return { partId: selectedPart, color: selectedColor, x: pos.x, y: pos.y, z: pos.z, rot };
  }

  let hoverRaf = null;
  function handleHover(mx, my) {
    if (hoverRaf) return;
    hoverRaf = requestAnimationFrame(() => {
      hoverRaf = null;
      if (tool !== 'build') {
        if (view.state.ghost) { view.state.ghost = null; draw(); }
        return;
      }
      const pos = target(view.pick(mx, my));
      const g = pos ? makeBrick(pos) : null;
      const next = g && view.fits(g) ? g : null;
      if (samePos(view.state.ghost, next)) return;
      view.state.ghost = next;
      draw();
    });
  }

  function samePos(a, b) {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.x === b.x && a.y === b.y && a.z === b.z && a.rot === b.rot
      && a.partId === b.partId && a.color === b.color;
  }

  function handleClick(mx, my) {
    const hit = view.pick(mx, my);
    if (!hit) return;
    if (tool === 'erase') return erase(mx, my, hit);
    if (tool === 'paint') {
      if (hit.brick) {
        undoStack.push({ type: 'paint', brick: hit.brick, color: hit.brick.color });
        hit.brick.color = selectedColor;
        draw();
      }
      return;
    }
    const pos = target(hit);
    if (!pos) return;
    const b = makeBrick(pos);
    if (!view.add(b)) {
      UI.toast('No room for that brick there.');
      return;
    }
    undoStack.push({ type: 'add', brick: b });
    view.state.ghost = null;
    draw();
  }

  function erase(mx, my, hit) {
    hit = hit || view.pick(mx, my);
    if (!hit || !hit.brick) return;
    undoStack.push({ type: 'remove', brick: hit.brick });
    view.remove(hit.brick);
    view.state.ghost = null;
    draw();
  }

  function undo() {
    const op = undoStack.pop();
    if (!op) return;
    if (op.type === 'add') view.remove(op.brick);
    else if (op.type === 'remove') view.add(op.brick);
    else if (op.type === 'paint') op.brick.color = op.color;
    draw();
  }

  function onKey(e) {
    if (!document.getElementById('tab-build').classList.contains('active')) return;
    const t = e.target.tagName;
    if (t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA') return;
    const k = e.key.toLowerCase();
    if (k === 'r') setRotation((rot + 1) % 4);
    else if (k === 'e') setTool(tool === 'erase' ? 'build' : 'erase');
    else if (k === 'z' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo(); }
    else if (k === '[') { view.orbit(-0.3, 0); draw(); }
    else if (k === ']') { view.orbit(0.3, 0); draw(); }
  }

  function setRotation(r) {
    rot = r;
    document.getElementById('rotatePartBtn').textContent = `⟳ Rotate Part (${rot * 90}°)`;
    view.state.ghost = null;
    draw();
  }

  function setTool(t) {
    tool = t;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
    view.state.ghost = null;
    draw();
  }

  function bindControls() {
    document.getElementById('rotatePartBtn').addEventListener('click', () => setRotation((rot + 1) % 4));
    document.querySelectorAll('.tool-btn').forEach(b => {
      b.addEventListener('click', () => setTool(b.dataset.tool));
    });
    document.getElementById('undoBuildBtn').addEventListener('click', undo);
    document.getElementById('clearBuildBtn').addEventListener('click', () => {
      if (view.bricks.length && !confirm('Clear the whole build?')) return;
      view.clear();
      undoStack.length = 0;
      draw();
    });
    document.getElementById('saveBuildBtn').addEventListener('click', save);
    document.getElementById('camLeftBtn').addEventListener('click', () => { view.orbit(-0.4, 0); draw(); });
    document.getElementById('camRightBtn').addEventListener('click', () => { view.orbit(0.4, 0); draw(); });
    document.getElementById('camUpBtn').addEventListener('click', () => { view.orbit(0, 0.2); draw(); });
    document.getElementById('camDownBtn').addEventListener('click', () => { view.orbit(0, -0.2); draw(); });
    document.getElementById('camInBtn').addEventListener('click', () => { view.zoom(1.2); draw(); });
    document.getElementById('camOutBtn').addEventListener('click', () => { view.zoom(1 / 1.2); draw(); });
    document.getElementById('camResetBtn').addEventListener('click', () => {
      view.state.cam.yaw = -0.85;
      view.state.cam.pitch = 0.75;
      if (view.bricks.length) view.frame(1.7);
      else { view.state.cam.zoom = 1; view.state.cam.target = [24 * STUD / 2, 24, 24 * STUD / 2]; }
      draw();
    });
    setRotation(0);
    setTool('build');
  }

  function save() {
    if (!view.bricks.length) {
      UI.toast('Place some bricks first!');
      return;
    }
    const nameInput = document.getElementById('buildNameInput');
    const name = nameInput.value.trim() || 'Unnamed Creation';
    const category = document.getElementById('buildCategorySelect').value;
    const thumbnail = view.snapshot(240);
    const build = {
      id: 'b_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name,
      category,
      thumbnail,
      model: view.bricks.map(b => ({ partId: b.partId, color: b.color, x: b.x, y: b.y, z: b.z, rot: b.rot })),
      brickCount: view.bricks.length,
      listed: false
    };
    State.player.builtItems.push(build);
    Net.syncPlayer();
    UI.renderAll();
    nameInput.value = '';
    view.clear();
    undoStack.length = 0;
    draw();
    UI.toast(`Saved "${name}" (${build.brickCount} bricks) to your creations!`);
  }

  function loadForEditing(build) {
    if (!build.model || !build.model.length) {
      UI.toast('That creation was made in the old 2D studio and cannot be edited.');
      return;
    }
    view.setBricks(build.model);
    undoStack.length = 0;
    document.getElementById('buildNameInput').value = build.name + ' (copy)';
    document.getElementById('buildCategorySelect').value = build.category || 'other';
    updateCategoryHint();
    view.frame(1.7);
    draw();
    UI.showTab('build');
    UI.toast('Loaded into the studio — saving makes a new copy.');
  }

  return { init, loadForEditing, CATEGORIES, redraw: () => draw() };
})();
