import type { Express } from "express";
import { createServer } from "http";
import multer from "multer";
import { storage } from "./storage";
import { elevenlabsService } from "./services/elevenlabs";
import { supportedLanguages } from "@shared/schema";

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

      const targetLanguage = req.body.targetLanguage;
      const isValidLanguage = supportedLanguages.some(lang => lang.code === targetLanguage);

      if (!isValidLanguage) {
        return res.status(400).json({ message: "Unsupported target language" });
      }

      // Create a translation record
      const translation = await storage.createTranslation({
        originalAudio: req.file.buffer.toString('base64'),
        sourceLanguage: "en", // Default to English for now
        targetLanguage,
        waveformData: null,
      });

      try {
        // Perform the translation
        const translatedAudioBuffer = await elevenlabsService.translateAudio({
          audioBuffer: req.file.buffer,
          targetLanguage,
        });

        // Update the translation record
        await storage.updateTranslation(translation.id, {
          translatedAudio: translatedAudioBuffer.toString('base64'),
          status: "completed",
        });

        // Send the translated audio back to the client
        res.set("Content-Type", "audio/wav");
        res.send(translatedAudioBuffer);
      } catch (error) {
        // Update the translation record with error status
        await storage.updateTranslation(translation.id, {
          status: "failed",
        });
        throw error;
      }
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ message: "Translation failed" });
    }
  });

  return httpServer;
}