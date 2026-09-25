document.addEventListener('DOMContentLoaded', () => {
  UI.initTabs();

  function startHomeIncome() {
    setInterval(() => {
      const stats = getHomeStats(State.player);
      if (!stats.house) return;
      State.player.cred += stats.income;
      State.player.lifetimeCred += stats.income;
      Net.syncPlayer();
      UI.renderAll();
      UI.toast(`🏠 Your home earned you ${stats.income} creds.`);
    }, 60000);
  }

  function startGame(name) {
    localStorage.setItem('lego_player_name', name);
    Net.init(name, () => {
      World.init();
      BuildStudio.init();
      Home.init();
      Battle.init();
      UI.initMarketControls();
      UI.renderAll();
      startHomeIncome();
    });
  }

  const savedName = localStorage.getItem('lego_player_name');
  if (savedName) {
    startGame(savedName);
  } else {
    const modal = document.getElementById('nameModal');
    const input = document.getElementById('nameModalInput');
    const btn = document.getElementById('nameModalBtn');
    modal.classList.remove('hidden');
    const submit = () => {
      const name = input.value.trim() || 'Minifig';
      modal.classList.add('hidden');
      startGame(name);
    };
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  }
});
