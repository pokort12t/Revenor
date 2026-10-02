import express from "express";
import Database from "better-sqlite3";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const botToken = process.env.BOT_TOKEN || "";

const db = new Database(path.join(__dirname, "ravenor.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS players (
  telegram_id INTEGER PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  server_id INTEGER,
  region_id INTEGER,
  role TEXT NOT NULL DEFAULT 'lord',
  level INTEGER NOT NULL DEFAULT 1,
  gold INTEGER NOT NULL DEFAULT 1000,
  food INTEGER NOT NULL DEFAULT 500,
  iron INTEGER NOT NULL DEFAULT 100,
  wood INTEGER NOT NULL DEFAULT 100,
  stone INTEGER NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS servers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  gold_total INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS regions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  biome TEXT NOT NULL,
  owner_id INTEGER,
  capital INTEGER NOT NULL DEFAULT 0,
  population INTEGER NOT NULL DEFAULT 1000,
  FOREIGN KEY(owner_id) REFERENCES players(telegram_id)
);
`);

const regionNames = [
  "Вальден","Елдрія","Фростваль","Нордхейм","Альвенор","Тарвін","Вінтерхольд",
  "Сноурен","Рейвенфорд","Вальдор","Естерваль","Брандор","Аркен","Морвейн","Торвен",
  "Греймонт","Лорден","Кардор","Вестмар","Елмарк","Дорнваль","Равенмір","Хаймонт",
  "Блеквуд","Стармонт","Ерваль","Таргон","Вальмер","Остервік","Голдрен","Кронваль",
  "Дреймор","Арден","Фальмор","Морден","Сільвар","Грейваль","Варден","Естор","Дракнор",
  "Терраваль","Бріарен","Кальдор","Олдрін","Рейнгард","Велмор","Торнхейм","Арвен",
  "Мальдор","Скарен","Саутваль","Лорвейн","Феррон","Айронваль","Кастелор"
];

const winter = new Set([3, 7, 8]);
const insertServer = db.prepare("INSERT OR IGNORE INTO servers(id,name) VALUES(?,?)");
const insertRegion = db.prepare("INSERT OR IGNORE INTO regions(id,name,biome) VALUES(?,?,?)");
for (let i = 1; i <= 20; i++) insertServer.run(i, `Сервер ${i}`);
for (let i = 1; i <= 55; i++) {
  insertRegion.run(i, regionNames[i - 1], winter.has(i) ? "winter" : "temperate");
}

function verifyTelegramInitData(initData) {
  if (!botToken) throw new Error("BOT_TOKEN is not configured");
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("Missing Telegram hash");
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = crypto.createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const calculated = crypto.createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(hash))) {
    throw new Error("Invalid Telegram initData");
  }

  const user = JSON.parse(params.get("user") || "{}");
  if (!user.id) throw new Error("Telegram user missing");
  return user;
}

function auth(req) {
  const initData = req.header("X-Telegram-Init-Data") || "";
  // Local development fallback. Disable by removing this branch before production.
  if (!initData && process.env.NODE_ENV !== "production") {
    return { id: 999999, username: "dev_lord", first_name: "Dev" };
  }
  return verifyTelegramInitData(initData);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/state", (req, res) => {
  try {
    const tg = auth(req);
    let player = db.prepare("SELECT * FROM players WHERE telegram_id=?").get(tg.id);

    if (!player) {
      const occupied = db.prepare(
        "SELECT region_id FROM players WHERE server_id=? AND region_id IS NOT NULL"
      ).all(1).map(x => x.region_id);

      const free = [...Array(55)].map((_, i) => i + 1).find(id => !occupied.includes(id)) || 1;
      db.prepare(`
        INSERT INTO players(telegram_id,username,first_name,server_id,region_id)
        VALUES(?,?,?,?,?)
      `).run(tg.id, tg.username || "", tg.first_name || "Lord", 1, free);

      db.prepare("UPDATE regions SET owner_id=? WHERE id=?").run(tg.id, free);
      player = db.prepare("SELECT * FROM players WHERE telegram_id=?").get(tg.id);
    }

    const regions = db.prepare(`
      SELECT r.*, p.first_name AS owner_name
      FROM regions r LEFT JOIN players p ON p.telegram_id=r.owner_id
      WHERE r.id BETWEEN 1 AND 55 ORDER BY r.id
    `).all();

    const serverPlayers = db.prepare(
      "SELECT COUNT(*) AS count FROM players WHERE server_id=?"
    ).get(player.server_id).count;

    res.json({ player, serverPlayers, maxPlayers: 55, regions });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

app.post("/api/claim", (req, res) => {
  try {
    const tg = auth(req);
    const player = db.prepare("SELECT * FROM players WHERE telegram_id=?").get(tg.id);
    const regionId = Number(req.body.regionId);
    const region = db.prepare("SELECT * FROM regions WHERE id=?").get(regionId);
    if (!player || !region) return res.status(404).json({ error: "Не знайдено" });
    if (region.owner_id) return res.status(409).json({ error: "Регіон уже має лорда" });

    // Starter rule: only adjacent regions can be claimed.
    // Regions are arranged as an 11x5 logical map for this first prototype.
    const from = player.region_id;
    const fx = (from - 1) % 11, fy = Math.floor((from - 1) / 11);
    const tx = (regionId - 1) % 11, ty = Math.floor((regionId - 1) / 11);
    if (Math.abs(fx - tx) + Math.abs(fy - ty) !== 1) {
      return res.status(400).json({ error: "Можна захоплювати лише сусідній регіон" });
    }

    db.prepare("UPDATE regions SET owner_id=? WHERE id=?").run(tg.id, regionId);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("*", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(port, () => console.log(`Ravenor running on http://localhost:${port}`));
