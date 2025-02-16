import type { Express } from "express";
import { createServer } from "http";
import multer from "multer";
import { storage } from "./storage";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  app.post("/api/translate", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file || !req.body.targetLanguage) {
        return res.status(400).json({ message: "Missing audio file or target language" });
      }

      // Here we would integrate with ElevenLabs API to perform the translation
      // For now, we'll just echo back the original audio
      res.set("Content-Type", "audio/wav");
      res.send(req.file.buffer);
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ message: "Translation failed" });
    }
  });

  return httpServer;
}
