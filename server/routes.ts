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

      // Validate audio file type
      if (!req.file.mimetype.startsWith("audio/")) {
        return res.status(400).json({ message: "Invalid file type. Please upload an audio file." });
      }

      const targetLanguage = req.body.targetLanguage;
      const isValidLanguage = supportedLanguages.some(lang => lang.code === targetLanguage);

      if (!isValidLanguage) {
        return res.status(400).json({ message: "Unsupported target language" });
      }

      console.log(`Starting translation to ${targetLanguage}`);

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

        console.log("Translation completed successfully");

        // Update the translation record
        await storage.updateTranslation(translation.id, {
          translatedAudio: translatedAudioBuffer.toString('base64'),
          status: "completed",
        });

        // Send the translated audio back to the client
        res.set("Content-Type", "audio/mpeg");
        res.send(translatedAudioBuffer);
      } catch (error: any) {
        console.error("Translation processing error:", error.message);

        // Update the translation record with error status
        await storage.updateTranslation(translation.id, {
          status: "failed",
        });

        res.status(500).json({ 
          message: "Translation failed",
          error: error.message 
        });
      }
    } catch (error: any) {
      console.error("Translation error:", error);
      res.status(500).json({ 
        message: "Translation failed",
        error: error.message 
      });
    }
  });

  return httpServer;
}