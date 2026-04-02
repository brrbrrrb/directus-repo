import express from "express";
import multer from "multer";
import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/generate", upload.single("file"), (req, res) => {
  try {
    const filePath = req.file.path;
    const data = JSON.parse(req.body.data);

    const content = fs.readFileSync(filePath, "binary");

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip);

    doc.setData(data);
    doc.render();

    const buffer = doc.getZip().generate({ type: "nodebuffer" });

    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": "attachment; filename=result.docx",
    });

    res.send(buffer);

    // удаляем временный файл
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).send("Ошибка генерации");
  }
});

app.listen(3000, () => {
  console.log("docx-service started");
});
