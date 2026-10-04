localStorage.removeItem("ravenor_joined");
localStorage.removeItem("ravenor_region");

const state = {
  players: Number(localStorage.getItem("ravenor_players") || 0),
  joined: localStorage.getItem("ravenor_joined") === "1",
  region: localStorage.getItem("ravenor_region") || null
};

// Елементи сторінки
const serverScreen = document.getElementById("serverScreen");
const gameScreen = document.getElementById("gameScreen");
const players = document.getElementById("players");
const serverCount = document.getElementById("serverCount");
const joinBtn = document.getElementById("joinBtn");
const regionSelect = document.getElementById("regionSelect");

// ==========================
// ЛІЧИЛЬНИК ГРАВЦІВ
// ==========================

function updateCount() {
  if (players) {
    players.textContent = `${state.players}/55`;
  }

  if (serverCount) {
    serverCount.textContent = `${state.players}/55 гравців`;
  }
}

// ==========================
// ВІДКРИТТЯ ГРИ
// ==========================

function openGame() {
  serverScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  // Якщо регіон уже вибраний
  if (state.region) {
    regionSelect.classList.add("hidden");
  } else {
    // Якщо регіон ще не вибраний
    regionSelect.classList.remove("hidden");
    updateRegionButtons();
  }
}

// ==========================
// ВХІД НА СЕРВЕР
// ==========================

function joinGame() {
  if (!state.joined) {

    if (state.players >= 55) {
      alert("Сервер заповнений.");
      return;
    }

    state.players++;
    state.joined = true;

    localStorage.setItem(
      "ravenor_players",
      state.players
    );

    localStorage.setItem(
      "ravenor_joined",
      "1"
    );

    updateCount();
  }

  openGame();
}

// ==========================
// РЕГІОНИ
// ==========================

const regions = {
  west: "Західна земля",
  erenor: "Еренор",
  erodaronis: "Еродароніс"
};

// Отримати зайняті регіони
function getTakenRegions() {
  return JSON.parse(
    localStorage.getItem("ravenor_taken_regions") || "[]"
  );
}

// Оновити статус кнопок регіонів
function updateRegionButtons() {
  const takenRegions = getTakenRegions();

  document.querySelectorAll(".region-option").forEach(button => {

    const region = button.dataset.region;
    const status = button.querySelector("span");

    if (takenRegions.includes(region)) {

      button.disabled = true;

      if (status) {
        status.textContent = "Зайнятий";
      }

    } else {

      button.disabled = false;

      if (status) {
        status.textContent = "Вільний";
      }
    }
  });
}

// ==========================
// ВИБІР РЕГІОНУ
// ==========================

document.querySelectorAll(".region-option").forEach(button => {

  button.addEventListener("click", () => {

    // Якщо регіон уже вибраний
    if (state.region) {
      return;
    }

    const region = button.dataset.region;

    const takenRegions = getTakenRegions();

    // Перевірка, чи регіон уже зайнятий
    if (takenRegions.includes(region)) {

      alert("Цей регіон уже зайнятий.");

      updateRegionButtons();

      return;
    }

    // Додаємо регіон до зайнятих
    takenRegions.push(region);

    localStorage.setItem(
      "ravenor_taken_regions",
      JSON.stringify(takenRegions)
    );

    // Зберігаємо регіон гравця
    state.region = region;

    localStorage.setItem(
      "ravenor_region",
      region
    );

    // Ховаємо вибір регіону
    regionSelect.classList.add("hidden");

    alert(
      `Ти обрав регіон: ${regions[region]}`
    );
  });

});

// ==========================
// КНОПКА "УВІЙТИ"
// ==========================

joinBtn.addEventListener(
  "click",
  joinGame
);

// ==========================
// ЗАПУСК
// ==========================

updateCount();

if (state.joined) {
  openGame();
    }
