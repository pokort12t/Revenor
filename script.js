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

const regionImages = {
  west: "02_region_1_zahidna_zemlya.png",
  erenor: "03_region_2_erenor.png",
  erodaronis: "04_region_3_erodaronis.png"
};

const continentMap =
  "01_map_continent_3_regions.png";


// ==========================
// РЕЖИМ КАРТИ
// ==========================

let regionView = false;


// ==========================
// ЛІЧИЛЬНИК
// ==========================

function updateCount() {

  players.textContent =
    `${state.players}/55`;

  serverCount.textContent =
    `${state.players}/55 гравців`;
}


// ==========================
// РЕГІОНИ
// ==========================

function getTakenRegions() {

  try {

    return JSON.parse(
      localStorage.getItem(
        "ravenor_taken_regions"
      ) || "[]"
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

  const taken =
    getTakenRegions();

  document
    .querySelectorAll(".region-option")
    .forEach(button => {

      const region =
        button.dataset.region;

      const status =
        button.querySelector("span");

      if (taken.includes(region)) {

        button.disabled = true;

        if (status) {
          status.textContent =
            "Зайнятий";
        }

      } else {

        button.disabled = false;

        if (status) {
          status.textContent =
            "Вільний";
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

document
  .querySelectorAll(".region-option")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        if (state.region) {
          return;
        }

        const region =
          button.dataset.region;

        const taken =
          getTakenRegions();

        if (taken.includes(region)) {

          alert(
            "Цей регіон уже зайнятий."
          );

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

        regionSelect.classList.add(
          "hidden"
        );

        alert(
          `Ти обрав регіон: ${regions[region]}`
        );

      }
    );

  });


// ==========================
// ВИХІД
// ==========================

function leaveGame() {

  if (!state.joined) {
    return;
  }

  if (state.region) {

    const taken =
      getTakenRegions();

    const updated =
      taken.filter(
        region =>
          region !== state.region
      );

    saveTakenRegions(updated);
  }

  state.players =
    Math.max(
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
// УВІЙТИ
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
// МАСШТАБ
// ==========================

let scale = 1;

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;


// ==========================
// ПОЗИЦІЯ
// ==========================

let mapX = 0;
let mapY = 0;


// ==========================
// ОБМЕЖЕННЯ
// ==========================

function limitMap() {

  if (regionView) {

    mapX = 0;
    mapY = 0;

    return;
  }

  const areaWidth =
    mapWrap.clientWidth;

  const areaHeight =
    mapWrap.clientHeight;

  const mapWidth =
    mapImage.naturalWidth * scale;

  const mapHeight =
    mapImage.naturalHeight * scale;

  if (mapWidth > areaWidth) {

    const maxX =
      (mapWidth - areaWidth) / 2;

    mapX = Math.max(
      -maxX,
      Math.min(maxX, mapX)
    );

  } else {

    mapX = 0;

  }

  if (mapHeight > areaHeight) {

    const maxY =
      (mapHeight - areaHeight) / 2;

    mapY = Math.max(
      -maxY,
      Math.min(maxY, mapY)
    );

  } else {

    mapY = 0;

  }
}


// ==========================
// ПОКАЗ КАРТИ
// ==========================

function renderMap() {

  limitMap();

  mapImage.style.transform =
    `translate(-50%, -50%)
     translate(${mapX}px, ${mapY}px)
     scale(${scale})`;
}


// ==========================
// КАРТА НА ВЕСЬ ЕКРАН
// ==========================

function fitMapToScreen() {

  const areaWidth =
    mapWrap.clientWidth;

  const areaHeight =
    mapWrap.clientHeight;

  const imageWidth =
    mapImage.naturalWidth;

  const imageHeight =
    mapImage.naturalHeight;

  if (!imageWidth || !imageHeight) {
    return;
  }

  const scaleX =
    areaWidth / imageWidth;

  const scaleY =
    areaHeight / imageHeight;

  scale =
    Math.min(
      scaleX,
      scaleY
    );

  scale =
    Math.min(
      scale,
      1
    );

  mapX = 0;
  mapY = 0;

  renderMap();
}


// ==========================
// КНОПКИ ZOOM
// ==========================

const zoomControls =
  document.createElement("div");

zoomControls.className =
  "map-zoom";

zoomControls.innerHTML = `
  <button type="button" id="zoomIn">+</button>
  <button type="button" id="zoomOut">−</button>
`;

mapWrap.appendChild(
  zoomControls
);


const zoomIn =
  document.getElementById("zoomIn");

const zoomOut =
  document.getElementById("zoomOut");


zoomIn.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    if (regionView) {
      return;
    }

    scale =
      Math.min(
        MAX_SCALE,
        scale + 0.25
      );

    renderMap();

  }
);


zoomOut.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    if (regionView) {
      return;
    }

    scale =
      Math.max(
        MIN_SCALE,
        scale - 0.25
      );

    renderMap();

  }
);


// ==========================
// ЗАВАНТАЖЕННЯ КАРТИ
// ==========================

mapImage.addEventListener(
  "load",
  () => {

    mapImage.style.display =
      "block";

    mapPlaceholder.style.display =
      "none";

    if (regionView) {

      scale = 0.1;

      mapX = 0;
      mapY = 0;

      renderMap();

    } else {

      fitMapToScreen();

    }

  }
);


mapImage.addEventListener(
  "error",
  () => {

    mapImage.style.display =
      "none";

    mapPlaceholder.style.display =
      "grid";

  }
);


// ==================================================
// РУХ ПАЛЬЦЕМ
// ==================================================

let dragging = false;

let dragStartX = 0;
let dragStartY = 0;


// ==================================================
// TOUCH START
// ==================================================

mapWrap.addEventListener(
  "touchstart",
  event => {

    if (regionView) {
      return;
    }

    event.preventDefault();

    if (event.touches.length === 1) {

      dragging = true;

      dragStartX =
        event.touches[0].clientX -
        mapX;

      dragStartY =
        event.touches[0].clientY -
        mapY;

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

    if (regionView) {
      return;
    }

    event.preventDefault();

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
  () => {

    dragging = false;

  }
);


// ==================================================
// КАРТА / РЕГІОН
// ==================================================

document
  .querySelectorAll(".bottom-nav button")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const view =
          button.dataset.view;


        // ==========================
        // КАРТА
        // ==========================

        if (view === "map") {

          regionView = false;

          mapImage.src =
            continentMap;

          document
            .querySelectorAll(
              ".bottom-nav button"
            )
            .forEach(btn =>
              btn.classList.remove(
                "active"
              )
            );

          button.classList.add(
            "active"
          );

          return;
        }


        // ==========================
        // РЕГІОН
        // ==========================

        if (view === "region") {

          if (!state.region) {

            alert(
              "Ти ще не маєш регіону."
            );

            return;
          }


          const image =
            regionImages[
              state.region
            ];


          if (!image) {

            alert(
              "Карта регіону не знайдена."
            );

            return;
          }


          regionView = true;

          mapImage.src = image;


          document
            .querySelectorAll(
              ".bottom-nav button"
            )
            .forEach(btn =>
              btn.classList.remove(
                "active"
              )
            );

          button.classList.add(
            "active"
          );

        }

      }
    );

  });


// ==========================
// МИША
// ==========================

let mouseDragging = false;


mapImage.addEventListener(
  "mousedown",
  event => {

    if (regionView) {
      return;
    }

    mouseDragging = true;

    dragStartX =
      event.clientX -
      mapX;

    dragStartY =
      event.clientY -
      mapY;

    event.preventDefault();

  }
);


window.addEventListener(
  "mousemove",
  event => {

    if (
      !mouseDragging ||
      regionView
    ) {
      return;
    }

    mapX =
      event.clientX -
      dragStartX;

    mapY =
      event.clientY -
      dragStartY;

    renderMap();

  }
);


window.addEventListener(
  "mouseup",
  () => {

    mouseDragging = false;

  }
);


// ==========================
// RESIZE
// ==========================

window.addEventListener(
  "resize",
  () => {

    if (regionView) {

      mapX = 0;
      mapY = 0;

      renderMap();

    } else {

      fitMapToScreen();

    }

  }
);
