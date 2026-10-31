import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const DEEPGRAM_URL =
  "https://api.deepgram.com/v1/listen?model=nova-3&language=fr&smart_format=true&punctuate=true";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
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

  const res = await fetch(DEEPGRAM_URL, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": audio.type || "audio/webm",
    },
    body: await audio.arrayBuffer(),
  });

  if (!res.ok) {
    console.error("Deepgram error:", res.status, await res.text());
    return NextResponse.json({ error: "Échec de la transcription" }, { status: 502 });
  }

  const data = await res.json();
  const text: string = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
  return NextResponse.json({ text: text.trim() });
}
