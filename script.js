localStorage.removeItem("ravenor_players");
localStorage.removeItem("ravenor_taken_regions");
localStorage.removeItem("ravenor_joined");
localStorage.removeItem("ravenor_region");

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

  serverCount.textContent =
    `${state.players}/55 гравців`;

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

  document.querySelectorAll(".region-option")
    .forEach(button => {

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

document.querySelectorAll(".region-option")
  .forEach(button => {

    button.addEventListener("click", () => {

      if (state.region) {
        return;
      }


      const region =
        button.dataset.region;

      const taken =
        getTakenRegions();


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


  // Звільняємо регіон
  if (state.region) {

    const taken =
      getTakenRegions();


    const updated =
      taken.filter(
        region => region !== state.region
      );


    saveTakenRegions(updated);

  }


  // Зменшуємо кількість гравців
  state.players =
    Math.max(0, state.players - 1);


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


// При закритті сторінки
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
// МАСШТАБ
// ==========================

let scale = 1;

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;


// ==========================
// ПОЗИЦІЯ
// ==========================

let mapX = 0;
let mapY = 0;


// ==========================
// СТАН ПАЛЬЦІВ
// ==========================

let dragging = false;

let startX = 0;
let startY = 0;


// Для двох пальців
let pinchStartDistance = 0;
let pinchStartScale = 1;

let pinchCenterX = 0;
let pinchCenterY = 0;


// ==========================
// РОЗМІР КАРТИ
// ==========================

function getMapSize() {

  return {

    width:
      mapImage.naturalWidth * scale,

    height:
      mapImage.naturalHeight * scale

  };

}


// ==========================
// ОБМЕЖЕННЯ КАРТИ
// ==========================

function limitMapPosition() {

  const areaWidth =
    mapWrap.clientWidth;

  const areaHeight =
    mapWrap.clientHeight;


  const size =
    getMapSize();


  // Ширина
  if (size.width > areaWidth) {

    const maxX =
      (size.width - areaWidth) / 2;


    mapX = Math.max(
      -maxX,
      Math.min(maxX, mapX)
    );

  } else {

    mapX = 0;

  }


  // Висота
  if (size.height > areaHeight) {

    const maxY =
      (size.height - areaHeight) / 2;


    mapY = Math.max(
      -maxY,
      Math.min(maxY, mapY)
    );

  } else {

    mapY = 0;

  }

}


// ==========================
// ОНОВЛЕННЯ КАРТИ
// ==========================

function updateMap() {

  limitMapPosition();


  mapImage.style.transform =
    `translate(-50%, -50%)
     translate(${mapX}px, ${mapY}px)
     scale(${scale})`;

}


// ==========================
// ЦЕНТР КАРТИ
// ==========================

function centerMap() {

  mapX = 0;
  mapY = 0;

  updateMap();

}


// ==========================
// ZOOM
// ==========================

function changeZoom(amount) {

  scale += amount;


  scale = Math.max(
    MIN_SCALE,
    Math.min(MAX_SCALE, scale)
  );


  updateMap();

}


// ==========================
// КНОПКИ ZOOM
// ==========================

const zoomControls =
  document.createElement("div");

zoomControls.className =
  "map-zoom";


zoomControls.innerHTML = `
  <button id="zoomIn">+</button>
  <button id="zoomOut">−</button>
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
  () => changeZoom(0.25)
);


zoomOut.addEventListener(
  "click",
  () => changeZoom(-0.25)
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


    // Початковий центр
    centerMap();

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
// РУХ ОДНИМ ПАЛЬЦЕМ
// ==================================================

mapImage.addEventListener(
  "touchstart",
  e => {

    // Два пальці — zoom
    if (e.touches.length === 2) {

      dragging = false;


      const dx =
        e.touches[0].clientX -
        e.touches[1].clientX;

      const dy =
        e.touches[0].clientY -
        e.touches[1].clientY;


      pinchStartDistance =
        Math.hypot(dx, dy);


      pinchStartScale =
        scale;


      pinchCenterX =
        (e.touches[0].clientX +
         e.touches[1].clientX) / 2;


      pinchCenterY =
        (e.touches[0].clientY +
         e.touches[1].clientY) / 2;


      return;

    }


    // Один палець — рух
    if (e.touches.length !== 1) {
      return;
    }


    dragging = true;


    startX =
      e.touches[0].clientX -
      mapX;


    startY =
      e.touches[0].clientY -
      mapY;

  }
);


// ==================================================
// РУХ / PINCH ZOOM
// ==================================================

mapImage.addEventListener(
  "touchmove",
  e => {

    e.preventDefault();


    // ==========================
    // ДВА ПАЛЬЦІ
    // ==========================

    if (e.touches.length === 2) {

      const dx =
        e.touches[0].clientX -
        e.touches[1].clientX;

      const dy =
        e.touches[0].clientY -
        e.touches[1].clientY;


      const distance =
        Math.hypot(dx, dy);


      if (pinchStartDistance > 0) {

        scale =
          pinchStartScale *
          (distance / pinchStartDistance);


        scale = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, scale)
        );


        updateMap();

      }


      return;

    }


    // ==========================
    // ОДИН ПАЛЕЦ
    // ==========================

    if (
      !dragging ||
      e.touches.length !== 1
    ) {
      return;
    }


    mapX =
      e.touches[0].clientX -
      startX;


    mapY =
      e.touches[0].clientY -
      startY;


    updateMap();

  },
  { passive: false }
);


// ==========================
// ЗАКІНЧЕННЯ ДОТИКУ
// ==========================

mapImage.addEventListener(
  "touchend",
  e => {

    if (e.touches.length === 0) {

      dragging = false;

      pinchStartDistance = 0;

    }

  }
);


// ==================================================
// МИША
// ==================================================

let mouseDragging = false;


mapImage.addEventListener(
  "mousedown",
  e => {

    mouseDragging = true;


    startX =
      e.clientX - mapX;

    startY =
      e.clientY - mapY;


    e.preventDefault();

  }
);


window.addEventListener(
  "mousemove",
  e => {

    if (!mouseDragging) {
      return;
    }


    mapX =
      e.clientX - startX;

    mapY =
      e.clientY - startY;


    updateMap();

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
  e => {

    e.preventDefault();


    if (e.deltaY < 0) {

      changeZoom(0.1);

    } else {

      changeZoom(-0.1);

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

    limitMapPosition();

    updateMap();

  }
);
