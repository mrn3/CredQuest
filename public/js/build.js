const BuildStudio = (() => {
  const COLS = 20, ROWS = 16, CELL = 25;
  let canvas, ctx;
  let grid = [];
  let selectedColor = null;

  function init() {
    canvas = document.getElementById('buildCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    renderPalette();
    canvas.addEventListener('click', onClick);
    document.getElementById('clearBuildBtn').addEventListener('click', clear);
    document.getElementById('saveBuildBtn').addEventListener('click', save);
    draw();
  }

  function renderPalette() {
    const palette = document.getElementById('brickPalette');
    palette.innerHTML = '';
    State.catalog.brickColors.forEach(color => {
      const sw = document.createElement('button');
      sw.className = 'brick-swatch';
      sw.style.background = color;
      sw.addEventListener('click', () => {
        selectedColor = color;
        document.querySelectorAll('.brick-swatch').forEach(s => s.classList.remove('selected'));
        sw.classList.add('selected');
      });
      palette.appendChild(sw);
    });
    const eraser = document.createElement('button');
    eraser.className = 'brick-swatch eraser';
    eraser.textContent = 'X';
    eraser.addEventListener('click', () => {
      selectedColor = null;
      document.querySelectorAll('.brick-swatch').forEach(s => s.classList.remove('selected'));
      eraser.classList.add('selected');
    });
    palette.appendChild(eraser);
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / CELL);
    const row = Math.floor((e.clientY - rect.top) / CELL);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    grid[row][col] = selectedColor;
    draw();
  }

  function clear() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    draw();
  }

  function draw() {
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = grid[r][c];
        ctx.strokeStyle = '#c8c8c8';
        ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(c * CELL + 2, r * CELL + 2, CELL - 4, CELL - 4);
          ctx.beginPath();
          ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fill();
        }
      }
    }
  }

  function isEmpty() {
    return grid.every(row => row.every(c => !c));
  }

  function save() {
    if (isEmpty()) {
      UI.toast('Place some bricks first!');
      return;
    }
    const nameInput = document.getElementById('buildNameInput');
    const name = nameInput.value.trim() || 'Unnamed Creation';
    const thumbnail = canvas.toDataURL('image/png');
    const build = {
      id: 'b_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name,
      thumbnail,
      grid: JSON.parse(JSON.stringify(grid)),
      listed: false
    };
    State.player.builtItems.push(build);
    Net.syncPlayer();
    UI.renderAll();
    nameInput.value = '';
    clear();
    UI.toast(`Saved "${name}" to your creations!`);
  }

  return { init };
})();
