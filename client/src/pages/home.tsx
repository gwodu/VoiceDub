import { useState } from "react";
import { Card } from "@/components/ui/card";
import { AudioRecorder } from "@/components/audio-recorder";
import { LanguageSelector } from "@/components/language-selector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Waveform } from "@/components/waveform";
import { Loader2, Upload } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { supportedLanguages } from "@shared/schema";

export default function Home() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [targetLanguage, setTargetLanguage] = useState(supportedLanguages[0].code);
  const { toast } = useToast();

  const translateMutation = useMutation({
    mutationFn: async ({ audio, language }: { audio: Blob, language: string }) => {
      const formData = new FormData();
      formData.append("audio", audio);
      formData.append("targetLanguage", language);
      
      const response = await fetch("/api/translate", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Translation failed");
      }
      
      return response.blob();
    },
    onSuccess: (data) => {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "translated-audio.mp3";
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Translation completed! Download started.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to translate audio. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTranslate = () => {
    if (!audioBlob) {
      toast({
        title: "Error",
        description: "Please record or upload audio first",
        variant: "destructive",
      });
      return;
    }
    
    translateMutation.mutate({ 
      audio: audioBlob,
      language: targetLanguage
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-[#2C3E50]">
            Audio Translator
          </h1>
          <p className="text-lg text-muted-foreground">
            Record or upload audio to translate it into another language
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <AudioRecorder onRecordingComplete={setAudioBlob} />
          
          {audioBlob && (
            <Waveform 
              audioBlob={audioBlob}
              className="h-32 w-full"
            />
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <LanguageSelector
              value={targetLanguage}
              onChange={setTargetLanguage}
            />
            
            <Button
              onClick={handleTranslate}
              className="bg-[#FF5500] hover:bg-[#FF5500]/90"
              disabled={!audioBlob || translateMutation.isPending}
            >
              {translateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Translate
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
