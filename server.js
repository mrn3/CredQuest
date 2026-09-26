const path = require('path');
const fs = require('fs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DB_FILE = path.join(__dirname, 'db.json');
const CATALOG_FILE = path.join(PUBLIC_DIR, 'data', 'catalog.json');
const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1600;

app.use(express.static(PUBLIC_DIR));

const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
const weaponById = Object.fromEntries(catalog.weapons.map(w => [w.id, w]));
const powerupById = Object.fromEntries(catalog.powerups.map(p => [p.id, p]));

function loadDb() {
  if (!fs.existsSync(DB_FILE)) return { players: {}, listings: [] };
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed to parse db.json, starting fresh.', e);
    return { players: {}, listings: [] };
  }
}

const db = loadDb();
let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    saveTimer = null;
  }, 300);
}

function newPlayer(id, name) {
  return {
    id,
    name: name || 'Minifig',
    cred: 100,
    lifetimeCred: 100,
    inventory: { weapons: [], powerups: [] },
    equipped: { weapons: [], powerups: [] },
    builtItems: [],
    home: { houseBuildId: null, art: [], furniture: [] },
    vehicleBuildId: null,
    world: { x: 400, y: 300, homeX: 125, homeY: 155 },
    hunt: { level: 1, runCred: 0, inFight: false },
    online: true
  };
}

function publicPlayer(p) {
  const { id, name, cred, lifetimeCred, inventory, equipped, builtItems, home, vehicleBuildId, world } = p;
  return {
    id, name, cred, lifetimeCred, inventory, equipped, builtItems,
    hunt: p.hunt || { level: 1, runCred: 0, inFight: false },
    home: home || { houseBuildId: null, art: [], furniture: [] },
    vehicleBuildId: vehicleBuildId || null,
    world: world || { x: 400, y: 300, homeX: 125, homeY: 155 }
  };
}

// Drop references to a creation the player no longer owns.
function releaseBuild(p, buildId) {
  if (!p) return;
  if (p.vehicleBuildId === buildId) p.vehicleBuildId = null;
  if (!p.home) return;
  if (p.home.houseBuildId === buildId) {
    p.home.houseBuildId = null;
    p.home.art = [];
    p.home.furniture = [];
    return;
  }
  p.home.art = (p.home.art || []).map(id => (id === buildId ? null : id));
  p.home.furniture = (p.home.furniture || []).map(id => (id === buildId ? null : id));
}

function onlineList() {
  return Object.values(db.players)
    .filter(p => p.online)
    .map(p => {
      const house = (p.builtItems || []).find(b => b.id === p.home?.houseBuildId);
      const vehicle = (p.builtItems || []).find(b => b.id === p.vehicleBuildId);
      return {
        id: p.id,
        name: p.name,
        lifetimeCred: p.lifetimeCred,
        world: p.world || { x: 400, y: 300, homeX: 125, homeY: 155 },
        house: house ? { name: house.name, thumbnail: house.thumbnail } : null,
        vehicle: vehicle ? { thumbnail: vehicle.thumbnail } : null
      };
    });
}

function findSocketByPlayerId(id) {
  for (const [, s] of io.sockets.sockets) {
    if (s.currentPlayerId === id) return s;
  }
  return null;
}

io.on('connection', socket => {
  socket.currentPlayerId = null;

  socket.on('join', ({ id, name }) => {
    if (!id) return;
    socket.currentPlayerId = id;
    if (!db.players[id]) {
      db.players[id] = newPlayer(id, name);
    } else if (name) {
      db.players[id].name = name;
    }
    db.players[id].online = true;
    socket.join('lobby');
    scheduleSave();

    socket.emit('joined', {
      player: publicPlayer(db.players[id]),
      catalog,
      listings: db.listings
    });

    io.to('lobby').emit('onlinePlayers', onlineList());
  });

  // Client is trusted for its own solo progress (store gear, equip loadout,
  // built creations); only trade actions below are server-validated.
  socket.on('syncPlayer', patch => {
    const p = db.players[socket.currentPlayerId];
    if (!p) return;
    if (patch.cred !== undefined) p.cred = Math.max(0, Math.round(patch.cred));
    if (patch.lifetimeCred !== undefined) p.lifetimeCred = Math.max(p.lifetimeCred, Math.round(patch.lifetimeCred));
    if (patch.inventory) p.inventory = patch.inventory;
    if (patch.equipped) p.equipped = patch.equipped;
    if (patch.builtItems) p.builtItems = patch.builtItems;
    if (patch.home) p.home = patch.home;
    if (patch.vehicleBuildId !== undefined) p.vehicleBuildId = patch.vehicleBuildId;
    if (patch.hunt && typeof patch.hunt === 'object') {
      const level = Math.round(Number(patch.hunt.level));
      const runCred = Math.round(Number(patch.hunt.runCred));
      p.hunt = {
        level: Number.isFinite(level) ? Math.min(50, Math.max(1, level)) : 1,
        runCred: Number.isFinite(runCred) ? Math.max(0, runCred) : 0,
        inFight: patch.hunt.inFight === true
      };
    }
    scheduleSave();
  });

  socket.on('worldMove', ({ x, y }) => {
    const p = db.players[socket.currentPlayerId];
    if (!p || !Number.isFinite(x) || !Number.isFinite(y)) return;
    p.world = p.world || { homeX: 125, homeY: 155 };
    p.world.x = Math.max(40, Math.min(WORLD_WIDTH - 40, Math.round(x)));
    p.world.y = Math.max(40, Math.min(WORLD_HEIGHT - 40, Math.round(y)));
    scheduleSave();
    socket.to('lobby').volatile.emit('worldPlayers', onlineList());
  });

  socket.on('placeHome', ({ x, y }) => {
    const p = db.players[socket.currentPlayerId];
    const house = p && (p.builtItems || []).find(b => b.id === p.home?.houseBuildId);
    if (!p || !house || !Number.isFinite(x) || !Number.isFinite(y)) return;
    p.world = p.world || { x: 400, y: 300 };
    p.world.homeX = Math.max(85, Math.min(WORLD_WIDTH - 85, Math.round(x)));
    p.world.homeY = Math.max(85, Math.min(WORLD_HEIGHT - 85, Math.round(y)));
    scheduleSave();
    io.to('lobby').emit('worldPlayers', onlineList());
  });

  socket.on('worldChat', rawMessage => {
    const p = db.players[socket.currentPlayerId];
    const message = String(rawMessage || '').trim().slice(0, 160);
    if (!p || !message) return;
    const origin = p.world || { x: 400, y: 300 };
    for (const [, peerSocket] of io.sockets.sockets) {
      const peer = db.players[peerSocket.currentPlayerId];
      if (!peer || !peer.online) continue;
      const location = peer.world || { x: 400, y: 300 };
      if (Math.hypot(location.x - origin.x, location.y - origin.y) <= 240) {
        peerSocket.emit('worldChat', { id: p.id, name: p.name, message });
      }
    }
  });

  socket.on('buyItem', ({ itemId, kind }) => {
    const p = db.players[socket.currentPlayerId];
    if (!p) return;
    const item = kind === 'weapon' ? weaponById[itemId] : powerupById[itemId];
    if (!item) return;
    if (p.cred < item.cost) {
      socket.emit('actionError', { message: 'Not enough creds.' });
      return;
    }
    p.cred -= item.cost;
    if (kind === 'weapon') p.inventory.weapons.push(itemId);
    else p.inventory.powerups.push(itemId);
    scheduleSave();
    socket.emit('playerUpdated', publicPlayer(p));
  });

  socket.on('listBuild', ({ build }) => {
    const p = db.players[socket.currentPlayerId];
    if (!p || !build) return;
    const built = p.builtItems.find(b => b.id === build.id);
    if (!built || built.listed) return;
    built.listed = true;
    const listing = {
      id: 'l_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      buildId: built.id,
      sellerId: p.id,
      sellerName: p.name,
      name: built.name,
      category: built.category || 'other',
      thumbnail: built.thumbnail,
      model: built.model || null,
      grid: built.grid || null,
      brickCount: built.brickCount || (built.model ? built.model.length : 0),
      price: Math.max(1, Math.round(build.price))
    };
    db.listings.push(listing);
    releaseBuild(p, built.id);
    scheduleSave();
    io.to('lobby').emit('listingsUpdated', db.listings);
    socket.emit('playerUpdated', publicPlayer(p));
  });

  socket.on('cancelListing', ({ listingId }) => {
    const idx = db.listings.findIndex(l => l.id === listingId && l.sellerId === socket.currentPlayerId);
    if (idx === -1) return;
    const listing = db.listings[idx];
    const seller = db.players[listing.sellerId];
    if (seller) {
      const built = seller.builtItems.find(b => b.id === listing.buildId);
      if (built) built.listed = false;
    }
    db.listings.splice(idx, 1);
    scheduleSave();
    io.to('lobby').emit('listingsUpdated', db.listings);
  });

  socket.on('buyListing', ({ listingId }) => {
    const buyer = db.players[socket.currentPlayerId];
    const idx = db.listings.findIndex(l => l.id === listingId);
    if (!buyer || idx === -1) return;
    const listing = db.listings[idx];
    if (listing.sellerId === buyer.id) return;
    if (buyer.cred < listing.price) {
      socket.emit('actionError', { message: 'Not enough creds for that build.' });
      return;
    }
    const seller = db.players[listing.sellerId];
    buyer.cred -= listing.price;
    if (seller) {
      seller.cred += listing.price;
      seller.builtItems = seller.builtItems.filter(b => b.id !== listing.buildId);
      releaseBuild(seller, listing.buildId);
    }
    buyer.builtItems.push({
      id: 'owned_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name: listing.name,
      category: listing.category || 'other',
      thumbnail: listing.thumbnail,
      model: listing.model || null,
      grid: listing.grid || null,
      brickCount: listing.brickCount || 0,
      listed: false,
      boughtFrom: listing.sellerName
    });
    db.listings.splice(idx, 1);
    scheduleSave();

    socket.emit('playerUpdated', publicPlayer(buyer));
    io.to('lobby').emit('listingsUpdated', db.listings);
    if (seller) {
      const sellerSocket = findSocketByPlayerId(listing.sellerId);
      if (sellerSocket) {
        sellerSocket.emit('playerUpdated', publicPlayer(seller));
        sellerSocket.emit('itemSold', { name: listing.name, price: listing.price, buyer: buyer.name });
      }
    }
  });

  socket.on('disconnect', () => {
    const id = socket.currentPlayerId;
    if (id && db.players[id] && !findSocketByPlayerId(id)) {
      db.players[id].online = false;
      scheduleSave();
      io.to('lobby').emit('onlinePlayers', onlineList());
    }
  });
});

server.listen(PORT, () => {
  console.log(`Cred Quest running at http://localhost:${PORT}`);
});
