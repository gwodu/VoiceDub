import { pgTable, text, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const audioTranslations = pgTable("audio_translations", {
  id: serial("id").primaryKey(),
  originalAudio: text("original_audio").notNull(),
  translatedAudio: text("translated_audio"),
  sourceLanguage: text("source_language").notNull(),
  targetLanguage: text("target_language").notNull(),
  waveformData: jsonb("waveform_data"),
  status: text("status").notNull().default("pending"),
});

export const insertAudioTranslationSchema = createInsertSchema(audioTranslations).pick({
  originalAudio: true,
  sourceLanguage: true,
  targetLanguage: true,
  waveformData: true,
});

export type InsertAudioTranslation = z.infer<typeof insertAudioTranslationSchema>;
export type AudioTranslation = typeof audioTranslations.$inferSelect;

export const supportedLanguages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "pl", name: "Polish" },
  { code: "hi", name: "Hindi" },
] as const;
