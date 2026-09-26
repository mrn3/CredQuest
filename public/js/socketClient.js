const Net = (() => {
  let socket;

  function init(onReady) {
    socket = io();
    socket.emit('join');

    socket.on('connect_error', err => {
      if (err && err.message === 'unauthorized') window.location.reload();
    });

    socket.once('joined', data => {
      State.player = normalizePlayer(data.player);
      State.playerId = data.player.id;
      State.catalog = data.catalog;
      State.listings = data.listings;
      onReady();
    });

    socket.on('playerUpdated', p => {
      State.player = normalizePlayer(p);
      UI.renderAll();
    });

    socket.on('listingsUpdated', listings => {
      State.listings = listings;
      UI.renderAll();
    });

    socket.on('onlinePlayers', players => {
      State.onlinePlayers = players;
      UI.renderOnlinePlayers();
    });

    socket.on('worldPlayers', players => {
      State.onlinePlayers = players;
      UI.renderOnlinePlayers();
    });

    socket.on('worldChat', message => {
      State.chatMessages.push({ ...message, receivedAt: Date.now() });
      State.chatMessages = State.chatMessages.slice(-30);
      World.renderChat();
    });

    socket.on('itemSold', data => {
      UI.toast(`💸 ${data.buyer} bought your "${data.name}" for ${data.price} creds!`);
    });

    socket.on('actionError', data => {
      UI.toast(data.message);
    });
  }

  function normalizePlayer(p) {
    p.inventory = p.inventory || { weapons: [], powerups: [] };
    p.equipped = p.equipped || { weapons: [], powerups: [] };
    p.builtItems = p.builtItems || [];
    p.home = p.home || { houseBuildId: null, art: [], furniture: [] };
    p.home.art = p.home.art || [];
    p.home.furniture = p.home.furniture || [];
    p.vehicleBuildId = p.vehicleBuildId || null;
    p.world = p.world || { x: 400, y: 300, homeX: 125, homeY: 155 };
    p.hunt = p.hunt || { level: 1, runCred: 0, inFight: false };
    return p;
  }

  function syncPlayer() {
    socket.emit('syncPlayer', {
      cred: State.player.cred,
      lifetimeCred: State.player.lifetimeCred,
      inventory: State.player.inventory,
      equipped: State.player.equipped,
      builtItems: State.player.builtItems,
      home: State.player.home,
      vehicleBuildId: State.player.vehicleBuildId,
      hunt: State.player.hunt
    });
  }

  function buyItem(itemId, kind) {
    socket.emit('buyItem', { itemId, kind });
  }

  function listBuild(build, price) {
    socket.emit('listBuild', { build: { id: build.id, price } });
  }

  function cancelListing(listingId) {
    socket.emit('cancelListing', { listingId });
  }

  function buyListing(listingId) {
    socket.emit('buyListing', { listingId });
  }

  function moveWorld(x, y) {
    socket.emit('worldMove', { x, y });
  }

  function placeHome(x, y) {
    socket.emit('placeHome', { x, y });
  }

  function chat(message) {
    socket.emit('worldChat', message);
  }

  return { init, syncPlayer, buyItem, listBuild, cancelListing, buyListing, moveWorld, placeHome, chat };
})();
