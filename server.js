// Мінімальний сервер для Telegram Mini App (Node.js 20+).
// Цей приклад лише перевіряє Telegram initData. Для повної гри додайте БД та API ігрових дій.
import express from "express";
import crypto from "node:crypto";
const app = express();
app.use(express.json({ limit: "32kb" }));
app.use(express.static("public"));
const BOT_TOKEN = process.env.BOT_TOKEN;

function validateTelegramInitData(initData) {
  if (!BOT_TOKEN || !initData) return false;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const calculated = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(calculated, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

app.post("/api/session", (req, res) => {
  const initData = req.body?.initData;
  if (!validateTelegramInitData(initData)) {
    return res.status(401).json({ ok: false, error: "Invalid Telegram initData" });
  }
  const params = new URLSearchParams(initData);
  const user = params.get("user");
  res.json({ ok: true, user: user ? JSON.parse(user) : null });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Koroli ta Lordy listening on ${port}`));
