// ==========================
// СТАН ГРАВЦЯ
// ==========================

const state = {
  players: Number(localStorage.getItem("ravenor_players") || 0),
  joined: localStorage.getItem("ravenor_joined") === "1",
  region: localStorage.getItem("ravenor_region") || null
};


// ==========================
// ЕЛЕМЕНТИ
// ==========================

const serverScreen = document.getElementById("serverScreen");
const gameScreen = document.getElementById("gameScreen");
const players = document.getElementById("players");
const serverCount = document.getElementById("serverCount");
const joinBtn = document.getElementById("joinBtn");
const regionSelect = document.getElementById("regionSelect");


// ==========================
// РЕГІОНИ
// ==========================

const regions = {
  west: "Західна земля",
  erenor: "Еренор",
  erodaronis: "Еродароніс"
};


// ==========================
// ЛІЧИЛЬНИК
// ==========================

function updateCount() {
  players.textContent = `${state.players}/55`;
  serverCount.textContent = `${state.players}/55 гравців`;
}


// ==========================
// РЕГІОНИ
// ==========================

function getTakenRegions() {
  return JSON.parse(
    localStorage.getItem("ravenor_taken_regions") || "[]"
  );
}

function saveTakenRegions(regions) {
  localStorage.setItem(
    "ravenor_taken_regions",
    JSON.stringify(regions)
  );
}

function updateRegionButtons() {

  const taken = getTakenRegions();

  document.querySelectorAll(".region-option").forEach(button => {

    const region = button.dataset.region;
    const status = button.querySelector("span");

    if (taken.includes(region)) {

      button.disabled = true;
      status.textContent = "Зайнятий";

    } else {

      button.disabled = false;
      status.textContent = "Вільний";

    }

  });
}


// ==========================
// ВІДКРИТТЯ ГРИ
// ==========================

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


// ==========================
// УВІЙТИ
// ==========================

function joinGame() {

  if (state.joined) {
    openGame();
    return;
  }

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
  openGame();
}


// ==========================
// ВИБІР РЕГІОНУ
// ==========================

document.querySelectorAll(".region-option").forEach(button => {

  button.addEventListener("click", () => {

    if (state.region) return;

    const region = button.dataset.region;
    const taken = getTakenRegions();

    if (taken.includes(region)) {

      alert("Цей регіон уже зайнятий.");
      updateRegionButtons();
      return;

    }

    taken.push(region);

    saveTakenRegions(taken);

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
// ВИХІД
// ==========================

function leaveGame() {

  if (!state.joined) return;

  // Звільняємо регіон
  if (state.region) {

    const taken = getTakenRegions();

    const updated = taken.filter(
      region => region !== state.region
    );

    saveTakenRegions(updated);
  }

  // Зменшуємо гравців
  state.players = Math.max(
    0,
    state.players - 1
  );

  localStorage.setItem(
    "ravenor_players",
    state.players
  );

  localStorage.removeItem("ravenor_joined");
  localStorage.removeItem("ravenor_region");
}


// Закриття сторінки
window.addEventListener(
  "beforeunload",
  leaveGame
);


// ==========================
// КНОПКА
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


// ==========================
// КАРТА
// ==========================

const mapImage =
  document.getElementById("mapImage");

const mapPlaceholder =
  document.getElementById("mapPlaceholder");


mapImage.addEventListener("load", () => {

  mapImage.style.display = "block";
  mapPlaceholder.style.display = "none";

});


mapImage.addEventListener("error", () => {

  mapImage.style.display = "none";
  mapPlaceholder.style.display = "grid";

});


let mapX = 0;
let mapY = 0;

let startX = 0;
let startY = 0;

let dragging = false;


mapImage.addEventListener(
  "touchstart",
  e => {

    if (e.touches.length !== 1) return;

    dragging = true;

    startX =
      e.touches[0].clientX - mapX;

    startY =
      e.touches[0].clientY - mapY;

  }
);


mapImage.addEventListener(
  "touchmove",
  e => {

    if (!dragging || e.touches.length !== 1) {
      return;
    }

    e.preventDefault();

    mapX =
      e.touches[0].clientX - startX;

    mapY =
      e.touches[0].clientY - startY;

    mapImage.style.transform =
      `translate(${mapX}px, ${mapY}px)`;

  }
);


mapImage.addEventListener(
  "touchend",
  () => {

    dragging = false;

  }
);
