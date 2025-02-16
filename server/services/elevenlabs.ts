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
      // Step 1: Convert audio to text
      const formData = new FormData();
      formData.append('audio', audioBuffer, {
        filename: 'audio.wav',
        contentType: 'audio/wav'
      });

      console.log("Step 1: Converting audio to text...");
      const transcriptionResponse = await fetch(
        `${this.baseUrl}/v1/audio/transcriptions`,
        {
          method: "POST",
          headers: {
            "xi-api-key": this.apiKey,
            ...formData.getHeaders()
          },
          body: formData,
        }
      );

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        console.error('Transcription Error:', {
          status: transcriptionResponse.status,
          statusText: transcriptionResponse.statusText,
          error: errorText
        });
        throw new Error(`Speech-to-text failed: ${errorText}`);
      }

      const transcription = await transcriptionResponse.json();
      const originalText = transcription.text;
      console.log("Original text:", originalText);

      // Step 2: Generate dubbed speech
      const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Default voice ID
      console.log(`Step 2: Generating dubbed speech with voice ${voiceId}`);

      const synthesisResponse = await fetch(
        `${this.baseUrl}/v1/text-to-speech/${voiceId}/stream`,
        {
          method: "POST",
          headers: {
            "Accept": "audio/mpeg",
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: originalText,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!synthesisResponse.ok) {
        const errorText = await synthesisResponse.text();
        console.error('Speech Synthesis Error:', {
          status: synthesisResponse.status,
          statusText: synthesisResponse.statusText,
          error: errorText
        });
        throw new Error(`Text-to-speech failed: ${errorText}`);
      }

      console.log("Speech synthesis successful");
      const audioArrayBuffer = await synthesisResponse.arrayBuffer();
      return Buffer.from(audioArrayBuffer);
    } catch (error) {
      console.error("ElevenLabs API error:", error);
      throw error;
    }
  }
}

export const elevenlabsService = new ElevenLabsService();