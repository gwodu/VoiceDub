import fetch from "node-fetch";
import FormData from "form-data";

interface TranslationOptions {
  audioBuffer: Buffer;
  targetLanguage: string;
  sourceLanguage?: string;
}

interface DubbingStatusResponse {
  status: "queued" | "processing" | "done" | "failed";
  message?: string;
}

interface DubbingResponse {
  dubbing_id: string;
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

  private async checkDubbingStatus(dubbingId: string): Promise<boolean> {
    const response = await fetch(
      `${this.baseUrl}/v1/dubbing/${dubbingId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": this.apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check dubbing status: ${await response.text()}`);
    }

    const status = await response.json() as DubbingStatusResponse;
    return status.status === "done";
  }

  private async waitForDubbing(dubbingId: string, maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      console.log(`Checking dubbing status (attempt ${i + 1}/${maxAttempts})...`);
      const isDone = await this.checkDubbingStatus(dubbingId);
      if (isDone) {
        console.log("Dubbing completed successfully");
        return;
      }
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error("Dubbing timed out");
  }

  async translateAudio({ audioBuffer, targetLanguage, sourceLanguage = "en" }: TranslationOptions): Promise<Buffer> {
    try {
      // Step 1: Initialize dubbing request
      const formData = new FormData();
      formData.append('audio', audioBuffer, {
        filename: 'audio.wav',
        contentType: 'audio/wav'
      });
      formData.append('source_language', sourceLanguage);
      formData.append('target_language', targetLanguage);
      formData.append('automatic_dubbing', 'true');
      formData.append('model_id', 'eleven_multilingual_v2');

      console.log("Starting dubbing process...");
      console.log("Request parameters:", {
        sourceLanguage,
        targetLanguage,
        contentLength: audioBuffer.length
      });

      const dubbingResponse = await fetch(
        `${this.baseUrl}/v1/dubbing`,
        {
          method: "POST",
          headers: {
            "xi-api-key": this.apiKey,
            ...formData.getHeaders()
          },
          body: formData,
        }
      );

      if (!dubbingResponse.ok) {
        const errorText = await dubbingResponse.text();
        console.error('Dubbing Request Error:', {
          status: dubbingResponse.status,
          statusText: dubbingResponse.statusText,
          error: errorText
        });
        throw new Error(`Failed to start dubbing: ${errorText}`);
      }

      const dubbingData = await dubbingResponse.json() as DubbingResponse;
      const dubbingId = dubbingData.dubbing_id;
      console.log(`Dubbing initiated with ID: ${dubbingId}`);

      // Step 2: Wait for dubbing to complete
      await this.waitForDubbing(dubbingId);

      // Step 3: Get the dubbed audio
      console.log("Retrieving dubbed audio...");
      const audioResponse = await fetch(
        `${this.baseUrl}/v1/dubbing/${dubbingId}/audio`,
        {
          method: "GET",
          headers: {
            "xi-api-key": this.apiKey,
            "Accept": "audio/mpeg",
          },
        }
      );

      if (!audioResponse.ok) {
        const errorText = await audioResponse.text();
        console.error('Audio Retrieval Error:', {
          status: audioResponse.status,
          statusText: audioResponse.statusText,
          error: errorText
        });
        throw new Error(`Failed to get dubbed audio: ${errorText}`);
      }

      const audioArrayBuffer = await audioResponse.arrayBuffer();
      return Buffer.from(audioArrayBuffer);
    } catch (error) {
      console.error("ElevenLabs API error:", error);
      throw error;
    }
  }
}

export const elevenlabsService = new ElevenLabsService();