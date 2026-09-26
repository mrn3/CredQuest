const World = (() => {
  const WORLD_WIDTH = 2400;
  const WORLD_HEIGHT = 1600;
  const PLAYER_MARGIN = 40;
  let canvas, ctx;
  let px = 400, py = 300;
  let cameraX = 0, cameraY = 0;
  let facing = 1;
  let moving = false;
  let phase = 0;
  let lastMoveSent = 0;
  const keys = {};

  function init() {
    canvas = document.getElementById('worldCanvas');
    ctx = canvas.getContext('2d');
    px = State.player.world.x;
    py = State.player.world.y;
    window.addEventListener('keydown', e => {
      if (isTyping(e.target)) return;
      keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
    document.getElementById('placeHomeBtn').addEventListener('click', placeHome);
    document.getElementById('worldChatForm').addEventListener('submit', sendChat);
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

  function update(timestamp) {
    let dx = 0, dy = 0;
    if (keys['arrowleft'] || keys['a']) dx -= 1;
    if (keys['arrowright'] || keys['d']) dx += 1;
    if (keys['arrowup'] || keys['w']) dy -= 1;
    if (keys['arrowdown'] || keys['s']) dy += 1;
    moving = dx !== 0 || dy !== 0;
    if (dx !== 0) facing = dx > 0 ? 1 : -1;
    const speed = 3 * (State.player ? getVehicleStats(State.player).speedMult : 1);
    px = Math.min(WORLD_WIDTH - PLAYER_MARGIN, Math.max(PLAYER_MARGIN, px + dx * speed));
    py = Math.min(WORLD_HEIGHT - PLAYER_MARGIN, Math.max(PLAYER_MARGIN, py + dy * speed));
    cameraX = Math.min(WORLD_WIDTH - canvas.width, Math.max(0, px - canvas.width / 2));
    cameraY = Math.min(WORLD_HEIGHT - canvas.height, Math.max(0, py - canvas.height / 2));
    if (moving) {
      phase += 0.25;
      State.player.world.x = px;
      State.player.world.y = py;
      if (timestamp - lastMoveSent >= 100) {
        Net.moveWorld(px, py);
        lastMoveSent = timestamp;
      }
    } else {
      phase = 0;
    }
  }

  function drawGround() {
    ctx.fillStyle = '#7fd858';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    const startX = -(cameraX % 40);
    const startY = -(cameraY % 40);
    for (let x = startX; x < canvas.width; x += 40) {
      for (let y = startY; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.arc(x + 20, y + 20, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = 'rgba(30,41,59,0.65)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`World ${Math.round(px)}, ${Math.round(py)}`, 12, 22);
  }

  function drawHouse(player) {
    if (!player.house || !player.world) return;
    const img = image(player.house.thumbnail);
    const x = player.world.homeX - cameraX;
    const y = player.world.homeY - cameraY;
    if (img) ctx.drawImage(img, x - 85, y - 85, 170, 170);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${player.name}'s home`, x, y + 92);
  }

  function drawBubble(message, x, y) {
    const text = message.length > 34 ? message.slice(0, 33) + '…' : message;
    ctx.font = '12px sans-serif';
    const width = Math.min(240, ctx.measureText(text).width + 18);
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.fillRect(x - width / 2, y - 18, width, 24);
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y - 2);
  }

  function drawPlayer(player, isLocal) {
    const worldX = isLocal ? px : player.world.x;
    const worldY = isLocal ? py : player.world.y;
    const x = worldX - cameraX;
    const y = worldY - cameraY;
    if (player.vehicle) {
      const vehicleImg = image(player.vehicle.thumbnail);
      if (vehicleImg) ctx.drawImage(vehicleImg, x - 70, y - 40, 140, 140);
    }
    const tier = getTierInfo(player);
    drawMinifig(ctx, x, y, {
      scale: 1.4,
      walkPhase: isLocal ? phase : 0,
      bodyColor: tier.bodyColor,
      legColor: tier.legColor,
      glow: tier.glow,
      facing: isLocal ? facing : 1,
      weapon: isLocal && (State.player.equipped.weapons || []).length > 0,
      cape: tier.id >= 4
    });
    ctx.fillStyle = '#1e293b';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${player.name} · ${tier.name}`, x, y - 60);
    const chat = [...State.chatMessages].reverse().find(m => m.id === player.id && Date.now() - m.receivedAt < 6000);
    if (chat) drawBubble(chat.message, x, y - 82);
  }

  function render() {
    drawGround();
    if (!State.player || !State.catalog) return;
    const homeStats = getHomeStats(State.player);
    const localPlayer = {
      ...State.player,
      house: homeStats.house ? { name: homeStats.house.name, thumbnail: homeStats.house.thumbnail } : null,
      vehicle: getVehicleStats(State.player).vehicle
    };
    State.onlinePlayers.filter(player => player.id !== State.playerId).forEach(player => drawHouse(player));
    drawHouse(localPlayer);
    State.onlinePlayers
      .filter(player => player.id !== State.playerId && player.world)
      .forEach(player => drawPlayer(player, false));
    drawPlayer(localPlayer, true);
  }

  function placeHome() {
    if (!getHomeStats(State.player).house) {
      UI.toast('Choose a house in My Home first.');
      return;
    }
    State.player.world.homeX = px;
    State.player.world.homeY = Math.max(110, py - 100);
    Net.placeHome(State.player.world.homeX, State.player.world.homeY);
    UI.toast('Your home has been placed here.');
  }

  function sendChat(event) {
    event.preventDefault();
    const input = document.getElementById('worldChatInput');
    const message = input.value.trim();
    if (!message) return;
    Net.chat(message);
    input.value = '';
  }

  function renderChat() {
    const box = document.getElementById('worldChatBox');
    if (!box) return;
    box.innerHTML = '';
    State.chatMessages.slice(-8).forEach(message => {
      const line = document.createElement('div');
      line.className = 'chat-line';
      const name = document.createElement('strong');
      name.textContent = `${message.name}: `;
      line.append(name, document.createTextNode(message.message));
      box.appendChild(line);
    });
    box.scrollTop = box.scrollHeight;
  }

  function loop(timestamp) {
    try {
      update(timestamp);
      render();
    } catch (err) {
      console.error('World render error:', err);
    }
    requestAnimationFrame(loop);
  }

  return { init, renderChat };
})();
