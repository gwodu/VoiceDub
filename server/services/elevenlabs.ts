import fetch from "node-fetch";

interface TranslationOptions {
  audioBuffer: Buffer;
  targetLanguage: string;
  sourceLanguage?: string;
}

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = "https://api.elevenlabs.io/v1";

  constructor() {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVEN_LABS_API_KEY is required");
    }
    this.apiKey = apiKey;
  }

  async translateAudio({ audioBuffer, targetLanguage, sourceLanguage = "en" }: TranslationOptions): Promise<Buffer> {
    try {
      // First, convert audio to text using speech-to-text
      const transcriptionResponse = await fetch(`${this.baseUrl}/speech-to-text`, {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "audio/wav",
        },
        body: audioBuffer,
      });

      if (!transcriptionResponse.ok) {
        throw new Error(`Speech-to-text failed: ${transcriptionResponse.statusText}`);
      }

      const transcription = await transcriptionResponse.json();
      const text = transcription.text;

      // Then, generate speech in target language
      const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Default voice ID, you can make this configurable
      const synthesisResponse = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!synthesisResponse.ok) {
        throw new Error(`Text-to-speech failed: ${synthesisResponse.statusText}`);
      }

      const audioArrayBuffer = await synthesisResponse.arrayBuffer();
      return Buffer.from(audioArrayBuffer);
    } catch (error) {
      console.error("ElevenLabs API error:", error);
      throw error;
    }
  }
}

export const elevenlabsService = new ElevenLabsService();
