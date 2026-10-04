const state = {
  players: Number(localStorage.getItem("ravenor_players") || 0),
  joined: localStorage.getItem("ravenor_joined") === "1"
};

const serverScreen = document.getElementById("serverScreen");
const gameScreen = document.getElementById("gameScreen");
const players = document.getElementById("players");
const serverCount = document.getElementById("serverCount");
const joinBtn = document.getElementById("joinBtn");
const infoPanel = document.getElementById("infoPanel");
const panelTitle = document.getElementById("panelTitle");
const panelContent = document.getElementById("panelContent");
const closePanel = document.getElementById("closePanel");

function updateCount() {
  players.textContent = `${state.players}/55`;
  serverCount.textContent = `${state.players}/55 гравців`;
}

function openGame() {
  serverScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
}

function joinGame() {
  if (!state.joined) {
    if (state.players >= 55) {
      alert("Сервер заповнений.");
      return;
    }
    state.players++;
    state.joined = true;
    localStorage.setItem("ravenor_players", state.players);
    localStorage.setItem("ravenor_joined", "1");
    updateCount();
  }
  openGame();
}

joinBtn.addEventListener("click", joinGame);

const panels = {
  power: ["Влада", "Тут буде інформація про твій статус лорда, короля та підлеглі регіони."],
  settlements: ["Поселення", "Тут будуть міста та села твого регіону."],
  people: ["Люди", "Тут будуть скарги та звернення підданих."],
  mines: ["Шахти", "Тут будуть твої шахти та видобуток ресурсів."],
  gold: ["Золото", "Тут буде баланс золота та економічна інформація."],
  army: ["Армія", "Тут буде список армії: солдати, лицарі, кавалерія, лучники та облогова техніка."]
};

document.querySelectorAll("[data-panel]").forEach(btn => {
  btn.addEventListener("click", () => {
    const data = panels[btn.dataset.panel];
    panelTitle.textContent = data[0];
    panelContent.textContent = data[1];
    infoPanel.classList.remove("hidden");
  });
});

closePanel.addEventListener("click", () => infoPanel.classList.add("hidden"));

document.querySelectorAll("[data-view]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-view]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    panelTitle.textContent = btn.dataset.view === "map" ? "Карта" : "Регіон";
    panelContent.textContent = btn.dataset.view === "map"
      ? "На карті буде весь континент Ravenor."
      : "Тут буде детальна інформація про твій регіон.";
    infoPanel.classList.remove("hidden");
  });
});

const mapImage = document.getElementById("mapImage");
const mapPlaceholder = document.getElementById("mapPlaceholder");
mapImage.addEventListener("load", () => {
  mapImage.style.display = "block";
  mapPlaceholder.style.display = "none";
});
mapImage.addEventListener("error", () => {
  mapImage.style.display = "none";
  mapPlaceholder.style.display = "grid";
});

updateCount();
if (state.joined) openGame();


// Титул гравця
let playerTitle = "independentLord";
// Варіанти:
// "independentLord" — Самостійний лорд
// "lord" — Лорд
// "king" — Король

const titleButton = document.getElementById("titleButton");

function updateTitleButton() {
  titleButton.innerHTML = "";

  if (playerTitle === "independentLord") {
    // У самостійного лорда немає кнопки
    return;
  }

  if (playerTitle === "lord") {
    // У лорда є кнопка "Король"
    titleButton.innerHTML = `
      <button class="title-button" data-panel="king">
        Король
      </button>
    `;
  }

  if (playerTitle === "king") {
    // У короля є кнопка "Влада"
    titleButton.innerHTML = `
      <button class="title-button" data-panel="power">
        Влада
      </button>
    `;
  }

  document.querySelectorAll("#titleButton [data-panel]").forEach(btn => {
    btn.addEventListener("click", () => {
      const data = panels[btn.dataset.panel];

      if (!data) return;

      panelTitle.textContent = data[0];
      panelContent.textContent = data[1];
      infoPanel.classList.remove("hidden");
    });
  });
}

updateTitleButton();

