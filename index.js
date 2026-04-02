// index.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// Создаём папку для загрузок, если не существует
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Настройка хранения файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Сохраняем с оригинальным именем + дату
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Настройка multer
const upload = multer({ storage });

// Создаём Express приложение
const app = express();

// Маршрут проверки сервера
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Маршрут для загрузки одного файла
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({ message: "File uploaded successfully", file: req.file });
});

// Маршрут для загрузки нескольких файлов
app.post("/uploads", upload.array("files", 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }
  res.json({ message: "Files uploaded successfully", files: req.files });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
