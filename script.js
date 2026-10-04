localStorage.removeItem("ravenor_players");
localStorage.removeItem("ravenor_taken_regions");
localStorage.removeItem("ravenor_joined");
localStorage.removeItem("ravenor_region");


// ==========================
// МЕЖІ РУХУ КАРТИ
// ==========================

const MAP_LIMITS = {
  left: 0,
  right: 0,
  top:  0,
  bottom: 0
};


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
  try {
    return JSON.parse(
      localStorage.getItem("ravenor_taken_regions") || "[]"
    );
  } catch {
    return [];
  }
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

    if (state.region) {
      return;
    }

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

  if (!state.joined) {
    return;
  }

  if (state.region) {

    const taken = getTakenRegions();

    const updated = taken.filter(
      region => region !== state.region
    );

    saveTakenRegions(updated);
  }

  state.players = Math.max(
    0,
    state.players - 1
  );

  localStorage.setItem(
    "ravenor_players",
    state.players
  );

  localStorage.removeItem(
    "ravenor_joined"
  );

  localStorage.removeItem(
    "ravenor_region"
  );
}


window.addEventListener(
  "beforeunload",
  leaveGame
);


// ==========================
// КНОПКА УВІЙТИ
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


// ==================================================
// КАРТА
// ==================================================

const mapWrap =
  document.querySelector(".map-wrap");

const mapImage =
  document.getElementById("mapImage");

const mapPlaceholder =
  document.getElementById("mapPlaceholder");


// ==========================
// НАЛАШТУВАННЯ
// ==========================

let scale = 1;

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

let mapX = 0;
let mapY = 0;


// ==========================
// ПОКАЗ КАРТИ
// ==========================

mapImage.style.display = "block";


// ==================================================
// ОБМЕЖЕННЯ КАРТИ
// ==================================================

function limitMap() {

  if (!mapImage.naturalWidth) {
    return;
  }

  const areaWidth = mapWrap.clientWidth;
  const areaHeight = mapWrap.clientHeight;

  const mapWidth =
    mapImage.naturalWidth * scale;

  const mapHeight =
    mapImage.naturalHeight * scale;


  // Якщо карта ширша за екран
  if (mapWidth > areaWidth) {

    const maxX =
      (mapWidth - areaWidth) / 2;

    mapX = Math.max(
      -maxX,
      Math.min(maxX, mapX)
    );

  } else {

    mapX = 100;

  }


  // Якщо карта вища за екран
  if (mapHeight > areaHeight) {

    const maxY =
      (mapHeight - areaHeight) / 2;

    mapY = Math.max(
      -maxY,
      Math.min(maxY, mapY)
    );

  } else {

    mapY = -100;

  }
}


// ==================================================
// ЗАСТОСУВАТИ ПОЗИЦІЮ
// ==================================================

function renderMap() {

  limitMap();

  mapImage.style.transform =
    `translate(-50%, -50%)
     translate(${mapX}px, ${mapY}px)
     scale(${scale})`;
}


// ==================================================
// ЦЕНТР
// ==================================================

function centerMap() {

  mapX = -50;
  mapY = 50;

  renderMap();
}


// ==================================================
// ZOOM
// ==================================================

function setZoom(newScale) {

  scale = Math.max(
    MIN_SCALE,
    Math.min(MAX_SCALE, newScale)
  );

  renderMap();
}


// ==================================================
// КНОПКИ + / −
// ==================================================

const zoomControls =
  document.createElement("div");

zoomControls.className =
  "map-zoom";

zoomControls.innerHTML = `
  <button type="button" id="zoomIn">+</button>
  <button type="button" id="zoomOut">−</button>
`;

mapWrap.appendChild(zoomControls);


const zoomIn =
  document.getElementById("zoomIn");

const zoomOut =
  document.getElementById("zoomOut");


zoomIn.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    setZoom(scale + 0.25);

  }
);


zoomOut.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    setZoom(scale - 0.25);

  }
);


// ==================================================
// ЗАВАНТАЖЕННЯ
// ==================================================

mapImage.addEventListener(
  "load",
  () => {

    mapImage.style.display = "block";

    mapPlaceholder.style.display = "none";

    scale = 1;

    centerMap();

  }
);


mapImage.addEventListener(
  "error",
  () => {

    mapImage.style.display = "none";

    mapPlaceholder.style.display = "grid";

  }
);


// ==================================================
// ОДИН ПАЛЕЦЬ — РУХ
// ==================================================

let dragging = false;

let dragStartX = 0;
let dragStartY = 0;


// ==================================================
// ДВА ПАЛЬЦІ — ZOOM
// ==================================================

let pinchDistance = 0;
let pinchScale = 1;


// ==========================
// ВІДСТАНЬ МІЖ ПАЛЬЦЯМИ
// ==========================

function getTouchDistance(touch1, touch2) {

  const dx =
    touch1.clientX - touch2.clientX;

  const dy =
    touch1.clientY - touch2.clientY;

  return Math.sqrt(
    dx * dx + dy * dy
  );
}


// ==================================================
// TOUCH START
// ==================================================

mapWrap.addEventListener(
  "touchstart",
  event => {

    event.preventDefault();


    // Два пальці
    if (event.touches.length === 2) {

      dragging = false;

      pinchDistance =
        getTouchDistance(
          event.touches[0],
          event.touches[1]
        );

      pinchScale = scale;

      return;
    }


    // Один палець
    if (event.touches.length === 1) {

      dragging = true;

      dragStartX =
        event.touches[0].clientX - mapX;

      dragStartY =
        event.touches[0].clientY - mapY;

    }

  },
  { passive: false }
);


// ==================================================
// TOUCH MOVE
// ==================================================

mapWrap.addEventListener(
  "touchmove",
  event => {

    event.preventDefault();


    // ==========================
    // ДВА ПАЛЬЦІ
    // ==========================

    if (event.touches.length === 2) {

      const newDistance =
        getTouchDistance(
          event.touches[0],
          event.touches[1]
        );


      if (pinchDistance > 0) {

        const ratio =
          newDistance / pinchDistance;

        setZoom(
          pinchScale * ratio
        );

      }

      return;
    }


    // ==========================
    // ОДИН ПАЛЕЦЬ
    // ==========================

    if (
      dragging &&
      event.touches.length === 1
    ) {

      mapX =
        event.touches[0].clientX -
        dragStartX;

      mapY =
        event.touches[0].clientY -
        dragStartY;

      renderMap();

    }

  },
  { passive: false }
);


// ==================================================
// TOUCH END
// ==================================================

mapWrap.addEventListener(
  "touchend",
  event => {

    if (event.touches.length === 0) {

      dragging = false;

      pinchDistance = 0;

    }

  }
);


// ==================================================
// МИША
// ==================================================

let mouseDragging = false;


mapImage.addEventListener(
  "mousedown",
  event => {

    mouseDragging = true;

    dragStartX =
      event.clientX - mapX;

    dragStartY =
      event.clientY - mapY;

    event.preventDefault();

  }
);


window.addEventListener(
  "mousemove",
  event => {

    if (!mouseDragging) {
      return;
    }

    mapX =
      event.clientX - dragStartX;

    mapY =
      event.clientY - dragStartY;

    renderMap();

  }
);


window.addEventListener(
  "mouseup",
  () => {

    mouseDragging = false;

  }
);


// ==================================================
// КОЛЕСО МИШІ
// ==================================================

mapWrap.addEventListener(
  "wheel",
  event => {

    event.preventDefault();

    if (event.deltaY < 0) {

      setZoom(scale + 0.1);

    } else {

      setZoom(scale - 0.1);

    }

  },
  { passive: false }
);


// ==================================================
// ЗМІНА РОЗМІРУ ЕКРАНУ
// ==================================================

window.addEventListener(
  "resize",
  () => {

    renderMap();

  }
);
