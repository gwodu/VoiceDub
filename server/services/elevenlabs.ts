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
      // Convert audio to text using Speech-to-Text API
      const transcriptionResponse = await fetch(`${this.baseUrl}/audio/transcribe`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "xi-api-key": this.apiKey,
          "Content-Type": "multipart/form-data",
        },
        body: JSON.stringify({
          audio: audioBuffer.toString('base64'),
          model_id: "eleven_multilingual_v1"
        }),
      });

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        throw new Error(`Speech-to-text failed: ${errorText}`);
      }

      const transcriptionData = await transcriptionResponse.json();

      if (!transcriptionData || !transcriptionData.text) {
        throw new Error("Invalid transcription response");
      }

      const text = transcriptionData.text;
      console.log("Transcription successful:", text);

      // Generate speech in target language
      const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Default voice ID
      const synthesisResponse = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Accept": "audio/mpeg",
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
        const errorText = await synthesisResponse.text();
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