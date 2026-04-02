// index.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

// Создаем папку для загрузок, если она не существует
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Настройка хранилища для загружаемых файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Сохраняем файл с уникальным именем, чтобы они не перезаписывали друг друга
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });
const app = express();

// Маршрут для проверки, что сервер вообще работает
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Новый маршрут специально для замены текста в docx
app.post("/process-docx", upload.single("file"), (req, res) => {
  // Проверяем, прикрепил ли пользователь файл
  if (!req.file) {
    return res.status(400).json({ error: "Файл не загружен" });
  }

  try {
    // 1. Читаем загруженный файл
    const content = fs.readFileSync(req.file.path, "binary");

    // 2. Распаковываем его (docx это по сути архив)
    const zip = new PizZip(content);

    // 3. Подключаем шаблонизатор
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // 4. Берем имя из запроса. Если имя не передали, используем "Станислав"
    const templateData = {
      name: req.body.name || "Станислав"
    };

    // 5. Выполняем замену (вместо {name} подставится реальное имя)
    doc.render(
