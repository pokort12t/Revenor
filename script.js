const state = {
  players: Number(localStorage.getItem("ravenor_players") || 0),
  joined: localStorage.getItem("ravenor_joined") === "1",
  region: localStorage.getItem("ravenor_region") || null
};

const serverScreen = document.getElementById("serverScreen");
const gameScreen = document.getElementById("gameScreen");
const players = document.getElementById("players");
const serverCount = document.getElementById("serverCount");
const joinBtn = document.getElementById("joinBtn");

const regionSelect = document.getElementById("regionSelect");

function updateCount() {
  players.textContent = `${state.players}/55`;
  serverCount.textContent = `${state.players}/55 гравців`;
}

function openGame() {
  serverScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  if (state.region) {
    regionSelect.classList.add("hidden");
  } else {
    regionSelect.classList.remove("hidden");
    updateRegionButtons();
  }
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


// ==========================
// ВИБІР РЕГІОНУ
// ==========================

const regions = {
  west: "Західна земля",
  erenor: "Еренор",
  erodaronis: "Еродароніс"
};

function getTakenRegions() {
  return JSON.parse(
    localStorage.getItem("ravenor_taken_regions") || "[]"
  );
}

function updateRegionButtons() {
  const takenRegions = getTakenRegions();

  document.querySelectorAll(".region-option").forEach(button => {
    const region = button.dataset.region;
    const status = button.querySelector("span");

    if (takenRegions.includes(region)) {
      button.disabled = true;
      status.textContent = "Зайнятий";
    } else {
      button.disabled = false;
      status.textContent = "Вільний";
    }
  });
}

document.querySelectorAll(".region-option").forEach(button => {
  button.addEventListener("click", () => {

    if (state.region) {
      return;
    }

    const region = button.dataset.region;
    const takenRegions = getTakenRegions();

    if (takenRegions.includes(region)) {
      alert("Цей регіон уже зайнятий.");
      updateRegionButtons();
      return;
    }

    takenRegions.push(region);

    localStorage.setItem(
      "ravenor_taken_regions",
      JSON.stringify(takenRegions)
    );

    state.region = region;

    localStorage.setItem(
      "ravenor_region",
      region
    );

    regionSelect.classList.add("hidden");

    alert(
      `Ти обрав регіон: ${regions[region]}`
    );
  });
});


// ==========================
// КНОПКА ВХОДУ
// ==========================

joinBtn.addEventListener("click", joinGame);

updateCount();

if (state.joined) {
  openGame();
  }

.region-select {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 20px;
  background: #17110c;
}

.region-select h2 {
  color: #f4dfad;
  text-align: center;
  margin-bottom: 15px;
}

.region-option {
  width: min(360px, 90vw);
  min-height: 65px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  font-weight: bold;
}

.region-option span {
  color: #9ee08f;
  font-size: 13px;
}

.region-option:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.region-option:disabled span {
  color: #e58b8b;
}
