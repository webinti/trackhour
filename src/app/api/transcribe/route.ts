import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// OpenAI rejects audio files above 25 MB.
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Transcription non configurée" }, { status: 503 });
  }

  const formData = await request.formData();
  const audio = formData.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "Aucun audio reçu" }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Enregistrement trop long" }, { status: 413 });
  }

  const filename = audio instanceof File && audio.name ? audio.name : "audio.webm";
  const upstream = new FormData();
  upstream.append("file", audio, filename);
  upstream.append("model", "whisper-1");
  upstream.append("language", "fr");
  upstream.append("response_format", "json");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: upstream,
  });

  if (!res.ok) {
    console.error("Whisper error:", res.status, await res.text());
    return NextResponse.json({ error: "Échec de la transcription" }, { status: 502 });
  }

  const { text } = (await res.json()) as { text?: string };
  return NextResponse.json({ text: (text ?? "").trim() });
}
