const Net = (() => {
  let socket;

  function init(name, onReady) {
    socket = io();
    State.playerId = ensurePlayerId();
    socket.emit('join', { id: State.playerId, name });

    socket.once('joined', data => {
      State.player = normalizePlayer(data.player);
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
      vehicleBuildId: State.player.vehicleBuildId
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

  return { init, syncPlayer, buyItem, listBuild, cancelListing, buyListing };
})();
