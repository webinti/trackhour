"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";

interface UseVoiceDictationOptions {
  onResult?: (text: string) => void;
}

function pickMimeType(): { mimeType: string; ext: string } {
  const candidates = [
    { mimeType: "audio/webm;codecs=opus", ext: "webm" },
    { mimeType: "audio/webm", ext: "webm" },
    { mimeType: "audio/mp4", ext: "mp4" },
    { mimeType: "audio/ogg;codecs=opus", ext: "ogg" },
  ];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c.mimeType)) ?? { mimeType: "", ext: "webm" };
}

export function useVoiceDictation({ onResult }: UseVoiceDictationOptions = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  // Detected after mount so server and client render the same markup.
  useEffect(() => {
    setIsSupported(typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const transcribe = useCallback(async (blob: Blob, ext: string) => {
    setIsTranscribing(true);
    try {
      const body = new FormData();
      body.append("audio", blob, `dictee.${ext}`);
      const res = await fetch("/api/transcribe", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Échec de la transcription");
        return;
      }
      if (data.text) onResultRef.current?.(data.text);
      else toast.info("Aucune parole détectée.");
    } catch {
      toast.error("Impossible de joindre le serveur de transcription.");
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const start = useCallback(async () => {
    if (!isSupported || recorderRef.current || isTranscribing) return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e: any) {
      toast.error(
        e?.name === "NotAllowedError"
          ? "Microphone non autorisé. Vérifie les permissions du site."
          : "Aucun microphone détecté."
      );
      return;
    }

    const { mimeType, ext } = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      releaseStream();
      recorderRef.current = null;
      setIsRecording(false);
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
      if (blob.size > 0) transcribe(blob, ext);
    };

    streamRef.current = stream;
    recorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  }, [isSupported, isTranscribing, releaseStream, transcribe]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const toggle = useCallback(() => {
    if (recorderRef.current) stop();
    else start();
  }, [start, stop]);

  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.onstop = null;
        if (recorderRef.current.state === "recording") recorderRef.current.stop();
      }
      releaseStream();
    };
  }, [releaseStream]);

  return { isSupported, isRecording, isTranscribing, start, stop, toggle };
}
