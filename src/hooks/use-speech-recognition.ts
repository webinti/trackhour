"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  onResult?: (transcript: string) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone non autorisé. Vérifie les permissions du site.",
  "no-speech": "Aucune voix détectée. Réessaie.",
  "audio-capture": "Aucun microphone détecté.",
  "network": "Erreur réseau — la reconnaissance vocale nécessite une connexion internet.",
  "service-not-available": "Service de reconnaissance vocale indisponible.",
};

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { lang = "fr-FR", continuous = true, onResult } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = useCallback(() => {
    if (!isSupported || isRecording) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;

    let accumulated = "";
    let hasStarted = false;

    recognition.onaudiostart = () => {
      hasStarted = true;
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accumulated += text;
          onResultRef.current?.(accumulated);
          setInterimTranscript("");
        } else {
          interim += text;
        }
      }
      if (interim) setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      const msg = ERROR_MESSAGES[event.error];
      if (msg) {
        toast.error(msg);
      } else if (event.error !== "aborted") {
        toast.error(`Erreur micro : ${event.error}`);
      }
      setIsRecording(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      if (isRecording && hasStarted && recognitionRef.current) {
        try {
          recognition.start();
          return;
        } catch {}
      }
      setIsRecording(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
      setInterimTranscript("");
    } catch (e: any) {
      toast.error("Impossible de démarrer le micro.");
      setIsRecording(false);
    }
  }, [isSupported, isRecording, lang, continuous]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    recognition?.stop();
    setIsRecording(false);
    setInterimTranscript("");
  }, []);

  const toggle = useCallback(() => {
    if (isRecording) stop();
    else start();
  }, [isRecording, start, stop]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  return { isRecording, isSupported, interimTranscript, start, stop, toggle };
}
