import fetch from "node-fetch";
import FormData from "form-data";

interface TranslationOptions {
  audioBuffer: Buffer;
  targetLanguage: string;
  sourceLanguage?: string;
}

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = "https://api.elevenlabs.io";

  constructor() {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVEN_LABS_API_KEY is required");
    }
    this.apiKey = apiKey;
  }

  async translateAudio({ audioBuffer, targetLanguage, sourceLanguage = "en" }: TranslationOptions): Promise<Buffer> {
    try {
      // For dubbing, we'll use a sample text in the target language
      // In a real application, you would want to translate the text first
      const sampleText = "This is a sample dubbed audio in the target language.";

      // Generate speech in target language
      const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Default voice ID
      console.log(`Making request to ElevenLabs API for voice ${voiceId}`);

      const synthesisResponse = await fetch(
        `${this.baseUrl}/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Accept": "audio/mpeg",
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: sampleText,
            model_id: "eleven_multilingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!synthesisResponse.ok) {
        const errorText = await synthesisResponse.text();
        console.error('ElevenLabs API Error Response:', {
          status: synthesisResponse.status,
          statusText: synthesisResponse.statusText,
          errorBody: errorText
        });
        throw new Error(`Text-to-speech failed: ${errorText}`);
      }

      const audioArrayBuffer = await synthesisResponse.arrayBuffer();
      console.log("Speech synthesis successful");

      return Buffer.from(audioArrayBuffer);
    } catch (error) {
      console.error("ElevenLabs API error:", error);
      throw error;
    }
  }
}

export const elevenlabsService = new ElevenLabsService();