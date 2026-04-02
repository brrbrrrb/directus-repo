import express from "express";
import multer from "multer";
import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const app = express();

// папка для временных файлов
const upload = multer({ dest: "uploads/" });

// 👉 опционально: простой API-ключ (можешь пока закомментировать)
/*
const API_KEY = "secret123";

app.use((req, res, next) => {
  if (req.headers["x-api-key"] !== API_KEY) {
    return res.status(403).send("Forbidden");
  }
  next();
});
*/

// основной endpoint
app.post("/generate", upload.single("file"), (req, res) => {
  let filePath;

  try {
    // проверка файла
    if (!req.file) {
      return res.status(400).send("Файл не передан");
    }

    filePath = req.file.path;

    // проверка данных
    if (!req.body.data) {
      return res.status(400).send("Нет данных для шаблона");
    }

    let data;
    try {
      data = JSON.parse(req.body.data);
    } catch (e) {
      return res.status(400).send("Неверный JSON в data");
    }

    // читаем docx
    const content = fs.readFileSync(filePath, "binary");

    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // подставляем значения
    doc.setData(data);

    // рендер
    doc.render();

    // получаем результат
    const buffer = doc.getZip().generate({
      type: "nodebuffer",
    });

    // отправляем файл
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": "attachment; filename=result.docx",
    });

    res.send(buffer);
  } catch (error) {
    console.error("Ошибка:", error);
    res.status(500).send("Ошибка генерации документа");
  } finally {
    // удаляем временный файл
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// health check (очень полезно для Elestio)
app.get("/", (req, res) => {
  res.send("docx-service is running");
});

// порт для Elestio
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
