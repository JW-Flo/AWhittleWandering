import express from "express";
import Busboy from "busboy";
import pdfParse from "pdf-parse";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const app = express();
app.use(express.json({ limit: "10mb" }));

// Utility: process raw text (placeholder for NLP)
function extractPlain(text = "") {
  return {
    length: text.length,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    preview: text.substring(0, 200),
  };
}

// Accepts:
// 1) JSON { "text": "..." }  – simple pass-through
// 2) multipart/form-data with a file field – extracts text from PDF
app.post("/extract", (req, res) => {
  // If JSON with text
  if (req.is("application/json") && req.body?.text) {
    return res.json({ type: "plain", data: extractPlain(req.body.text) });
  }

  // Otherwise expect multipart upload
  if (!req.is("multipart/form-data")) {
    return res.status(400).json({
      error: "Expected JSON with text or multipart/form-data file upload",
    });
  }

  const busboy = Busboy({ headers: req.headers });
  let processed = false;

  busboy.on("file", async (fieldname, file, filename, encoding, mimetype) => {
    try {
      const tmpFile = path.join(os.tmpdir(), `${Date.now()}-${filename}`);
      const writeStream = fs.createWriteStream(tmpFile);
      file.pipe(writeStream);

      writeStream.on("error", (err) => {
        console.error("Write stream error:", err);
        if (!processed) {
        let result;
        if (mimetype === "application/pdf") {
          const dataBuffer = await fs.promises.readFile(tmpFile);
          const pdf = await pdfParse(dataBuffer);
          result = { type: "pdf", data: extractPlain(pdf.text) };
        } else {
          const raw = await fs.promises.readFile(tmpFile, "utf8");
          result = { type: "plain-file", data: extractPlain(raw) };
        }
        await fs.promises.unlink(tmpFile);
        if (!processed) {
          processed = true;
          res.json(result);
        }
        }
        fs.unlinkSync(tmpFile);
        if (!processed) {
          processed = true;
          res.json(result);
        }
      });
    } catch (err) {
      console.error(err);
      if (!processed) {
        processed = true;
        res.status(500).json({ error: "Processing failed" });
      }
    }
  });

  busboy.on("finish", () => {
    if (!processed) {
      res.status(400).json({ error: "No file found in upload" });
    }
  });

  req.pipe(busboy);
});

// Simple health endpoint
app.get("/health", (_, res) => res.sendStatus(200));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`doc-processing-server listening on ${PORT}`)
);
