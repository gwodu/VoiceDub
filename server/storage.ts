import { audioTranslations, type AudioTranslation, type InsertAudioTranslation } from "@shared/schema";

export interface IStorage {
  createTranslation(translation: InsertAudioTranslation): Promise<AudioTranslation>;
  getTranslation(id: number): Promise<AudioTranslation | undefined>;
  updateTranslation(id: number, translation: Partial<AudioTranslation>): Promise<AudioTranslation>;
}

export class MemStorage implements IStorage {
  private translations: Map<number, AudioTranslation>;
  private currentId: number;

  constructor() {
    this.translations = new Map();
    this.currentId = 1;
  }

  async createTranslation(translation: InsertAudioTranslation): Promise<AudioTranslation> {
    const id = this.currentId++;
    const newTranslation: AudioTranslation = {
      id,
      ...translation,
      translatedAudio: null,
      status: "pending",
    };
    this.translations.set(id, newTranslation);
    return newTranslation;
  }

  async getTranslation(id: number): Promise<AudioTranslation | undefined> {
    return this.translations.get(id);
  }

  async updateTranslation(
    id: number,
    translation: Partial<AudioTranslation>,
  ): Promise<AudioTranslation> {
    const existing = this.translations.get(id);
    if (!existing) {
      throw new Error("Translation not found");
    }
    
    const updated = { ...existing, ...translation };
    this.translations.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
